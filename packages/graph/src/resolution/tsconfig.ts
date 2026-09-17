import { parse as parseJsonc, type ParseError } from "jsonc-parser";
import {
  createDiagnostic,
  DiagnosticCode,
  type Diagnostic,
  type FileNode,
} from "@codetranslate/core";
import { fileName, normalizeRelativePath } from "@codetranslate/shared";
import { posixDirname, posixJoin } from "./posix";

export interface AliasRule {
  prefix: string;
  hasWildcard: boolean;
  targets: string[];
  tsconfigPath: string;
}

export interface TsconfigSettings {
  path: string;
  dir: string;
  baseUrl?: string;
  aliases: AliasRule[];
}

const MAX_EXTENDS_DEPTH = 4;

export async function loadTsconfigSettings(
  files: readonly FileNode[],
  readText: (path: string) => Promise<string>,
): Promise<{ settings: TsconfigSettings[]; diagnostics: Diagnostic[] }> {
  const diagnostics: Diagnostic[] = [];
  const configs = files.filter(
    (file) =>
      !file.ignored &&
      (fileName(file.path) === "tsconfig.json" || fileName(file.path) === "jsconfig.json"),
  );
  configs.sort((a, b) => a.path.localeCompare(b.path));

  const settings: TsconfigSettings[] = [];
  const visiting = new Set<string>();

  for (const file of configs) {
    const loaded = await loadOneConfig(file.path, readText, visiting, 0, diagnostics);
    if (loaded) {
      settings.push(loaded);
    }
  }

  return { settings, diagnostics };
}

async function loadOneConfig(
  path: string,
  readText: (path: string) => Promise<string>,
  visiting: Set<string>,
  depth: number,
  diagnostics: Diagnostic[],
): Promise<TsconfigSettings | undefined> {
  if (visiting.has(path) || depth > MAX_EXTENDS_DEPTH) {
    return undefined;
  }
  visiting.add(path);

  let raw: string;
  try {
    raw = await readText(path);
  } catch (error) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        DiagnosticCode.TSCONFIG_PARSE_FAILED,
        `Could not read ${path}: ${error instanceof Error ? error.message : String(error)}`,
        path,
      ),
    );
    visiting.delete(path);
    return undefined;
  }

  const errors: ParseError[] = [];
  const parsed = parseJsonc(raw, errors, { allowTrailingComma: true }) as unknown;
  if (errors.length > 0 || !isPlainObject(parsed)) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        DiagnosticCode.TSCONFIG_PARSE_FAILED,
        `${path} is not valid JSONC.`,
        path,
      ),
    );
    visiting.delete(path);
    return undefined;
  }

  const dir = posixDirname(path);
  let baseUrl: string | undefined;
  let aliases: AliasRule[] = [];

  const extendsValue = parsed.extends;
  if (
    typeof extendsValue === "string" &&
    (extendsValue.startsWith("./") || extendsValue.startsWith("../"))
  ) {
    const parentPath = normalizeRelativePath(posixJoin(dir, extendsValue));
    const parent = await loadOneConfig(parentPath, readText, visiting, depth + 1, diagnostics);
    if (parent) {
      baseUrl = parent.baseUrl;
      aliases = parent.aliases.map((rule) => ({ ...rule }));
    }
  }

  const compilerOptions = isPlainObject(parsed.compilerOptions)
    ? parsed.compilerOptions
    : undefined;
  if (compilerOptions) {
    if (typeof compilerOptions.baseUrl === "string") {
      baseUrl = normalizeRelativePath(posixJoin(dir, compilerOptions.baseUrl));
    }
    if (isPlainObject(compilerOptions.paths)) {
      aliases = parseAliasRules(compilerOptions.paths, dir, path, diagnostics);
    }
  }

  visiting.delete(path);
  return { path, dir, baseUrl, aliases };
}

function parseAliasRules(
  paths: Record<string, unknown>,
  configDir: string,
  tsconfigPath: string,
  diagnostics: Diagnostic[],
): AliasRule[] {
  const rules: AliasRule[] = [];
  for (const [pattern, rawTargets] of Object.entries(paths)) {
    if (!Array.isArray(rawTargets) || !rawTargets.every((item) => typeof item === "string")) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          DiagnosticCode.TSCONFIG_PATH_INVALID,
          `paths["${pattern}"] is not a string array.`,
          tsconfigPath,
        ),
      );
      continue;
    }
    const hasWildcard = pattern.includes("*");
    const prefix = hasWildcard ? pattern.slice(0, pattern.indexOf("*")) : pattern;
    const targets = rawTargets.map((target) => normalizeRelativePath(posixJoin(configDir, target)));
    rules.push({ prefix, hasWildcard, targets, tsconfigPath });
  }
  rules.sort((a, b) => b.prefix.length - a.prefix.length || a.prefix.localeCompare(b.prefix));
  return rules;
}

export function settingsForFile(
  filePath: string,
  settings: readonly TsconfigSettings[],
): TsconfigSettings | undefined {
  const matches = settings.filter(
    (item) => item.dir === "" || filePath === item.dir || filePath.startsWith(`${item.dir}/`),
  );
  matches.sort((a, b) => b.dir.length - a.dir.length);
  return matches[0];
}

export function applyAlias(specifier: string, aliases: readonly AliasRule[]): string[] | undefined {
  for (const rule of aliases) {
    if (rule.hasWildcard) {
      if (!specifier.startsWith(rule.prefix)) {
        continue;
      }
      const rest = specifier.slice(rule.prefix.length);
      return rule.targets
        .map((target) => target.replace("*", rest))
        .map((path) => normalizeRelativePath(path));
    }
    if (specifier === rule.prefix) {
      return rule.targets.map((target) => normalizeRelativePath(target.replace("*", "")));
    }
  }
  return undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
