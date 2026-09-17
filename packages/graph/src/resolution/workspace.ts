import {
  createDiagnostic,
  DiagnosticCode,
  type Diagnostic,
  type FileNode,
  type ManifestSummary,
  type PackageManifestSummary,
} from "@codetranslate/core";
import { fileName, normalizeRelativePath } from "@codetranslate/shared";
import { posixDirname } from "./posix";

export interface WorkspacePackage {
  name: string;
  dir: string;
  manifestPath: string;
}

export async function loadWorkspacePackages(
  files: readonly FileNode[],
  manifests: readonly ManifestSummary[],
  readText: (path: string) => Promise<string>,
): Promise<{ packages: Map<string, WorkspacePackage>; diagnostics: Diagnostic[] }> {
  const diagnostics: Diagnostic[] = [];
  const patterns = new Set<string>();

  for (const manifest of manifests) {
    if (manifest.type === "package.json" && manifest.workspaces) {
      for (const pattern of manifest.workspaces) {
        patterns.add(pattern);
      }
    }
  }

  const workspaceFiles = files.filter(
    (file) => !file.ignored && fileName(file.path) === "pnpm-workspace.yaml",
  );
  for (const file of workspaceFiles) {
    try {
      const text = await readText(file.path);
      for (const pattern of parsePnpmWorkspacePackages(text)) {
        patterns.add(pattern);
      }
    } catch (error) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          DiagnosticCode.WORKSPACE_MANIFEST_PARSE_FAILED,
          `Could not read ${file.path}: ${error instanceof Error ? error.message : String(error)}`,
          file.path,
        ),
      );
    }
  }

  const packages = new Map<string, WorkspacePackage>();
  const packageManifests = manifests.filter(
    (manifest): manifest is PackageManifestSummary =>
      manifest.type === "package.json" && typeof manifest.name === "string",
  );

  for (const manifest of packageManifests) {
    const dir = posixDirname(manifest.path);
    if (patterns.size > 0 && !matchesAnyWorkspacePattern(dir, patterns)) {
      continue;
    }
    if (patterns.size === 0 && dir === "") {
      continue;
    }
    const name = manifest.name;
    if (!name) {
      continue;
    }
    packages.set(name, { name, dir, manifestPath: manifest.path });
  }

  return { packages, diagnostics };
}

export function parsePnpmWorkspacePackages(text: string): string[] {
  const packages: string[] = [];
  let inPackages = false;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }
    if (/^packages:\s*$/.test(trimmed)) {
      inPackages = true;
      continue;
    }
    if (inPackages) {
      if (!/^\s*-/.test(line) && !line.startsWith(" ") && !line.startsWith("\t")) {
        inPackages = false;
        continue;
      }
      const match = trimmed.match(/^-\s+(.+)$/);
      if (!match?.[1]) {
        continue;
      }
      packages.push(match[1].replace(/^['"]|['"]$/g, ""));
    }
  }
  return packages;
}

export function matchesAnyWorkspacePattern(
  packageDir: string,
  patterns: Iterable<string>,
): boolean {
  const dir = normalizeRelativePath(packageDir);
  for (const pattern of patterns) {
    if (matchesWorkspacePattern(dir, pattern)) {
      return true;
    }
  }
  return false;
}

export function matchesWorkspacePattern(packageDir: string, pattern: string): boolean {
  const normalized = normalizeRelativePath(pattern.replace(/\/+$/, ""));
  if (normalized.endsWith("/**")) {
    const prefix = normalized.slice(0, -3);
    return packageDir === prefix || packageDir.startsWith(`${prefix}/`);
  }
  if (normalized.endsWith("/*")) {
    const prefix = normalized.slice(0, -2);
    if (packageDir === prefix) {
      return false;
    }
    if (!packageDir.startsWith(`${prefix}/`)) {
      return false;
    }
    return !packageDir.slice(prefix.length + 1).includes("/");
  }
  return packageDir === normalized;
}
