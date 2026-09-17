import { z } from "zod";
import {
  createDiagnostic,
  DiagnosticCode,
  type Diagnostic,
  type PackageManifestSummary,
  type RepositorySnapshot,
} from "@codetranslate/core";

const stringRecordSchema = z.record(z.string(), z.unknown());

export async function parsePackageManifest(
  snapshot: RepositorySnapshot,
  relativePath: string,
): Promise<{ manifest?: PackageManifestSummary; diagnostics: Diagnostic[] }> {
  let raw: string;
  try {
    raw = await snapshot.readText(relativePath);
  } catch (error) {
    return {
      diagnostics: [
        createDiagnostic(
          "error",
          DiagnosticCode.MANIFEST_PARSE_FAILED,
          `Could not read package.json: ${error instanceof Error ? error.message : String(error)}`,
          relativePath,
        ),
      ],
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch (error) {
    return {
      diagnostics: [
        createDiagnostic(
          "error",
          DiagnosticCode.MANIFEST_PARSE_FAILED,
          `package.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
          relativePath,
        ),
      ],
    };
  }

  if (!isPlainObject(json)) {
    return {
      diagnostics: [
        createDiagnostic(
          "error",
          DiagnosticCode.MANIFEST_PARSE_FAILED,
          "package.json root value is not an object.",
          relativePath,
        ),
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  const scripts = readStringKeys(json.scripts, "scripts", relativePath, diagnostics);
  const dependencies = readStringKeys(json.dependencies, "dependencies", relativePath, diagnostics);
  const devDependencies = readStringKeys(
    json.devDependencies,
    "devDependencies",
    relativePath,
    diagnostics,
  );
  const peerDependencies = readStringKeys(
    json.peerDependencies,
    "peerDependencies",
    relativePath,
    diagnostics,
  );

  const manifest: PackageManifestSummary = {
    type: "package.json",
    path: relativePath,
    scripts,
    dependencies,
    devDependencies,
    peerDependencies,
  };

  if (typeof json.name === "string") {
    manifest.name = json.name;
  }
  if (typeof json.version === "string") {
    manifest.version = json.version;
  }
  if (typeof json.private === "boolean") {
    manifest.private = json.private;
  }
  if (typeof json.packageManager === "string") {
    manifest.packageManager = json.packageManager;
  }

  const workspaces = readWorkspaces(json.workspaces);
  if (workspaces && workspaces.length > 0) {
    manifest.workspaces = workspaces;
  }

  if (json.engines !== undefined) {
    const engines = z.record(z.string(), z.string()).safeParse(json.engines);
    if (engines.success) {
      manifest.engines = engines.data;
    } else {
      diagnostics.push(
        createDiagnostic(
          "warning",
          DiagnosticCode.MANIFEST_PARSE_FAILED,
          'package.json field "engines" is not a string record and was ignored.',
          relativePath,
        ),
      );
    }
  }

  return { manifest, diagnostics };
}

function readStringKeys(
  value: unknown,
  field: string,
  relativePath: string,
  diagnostics: Diagnostic[],
): string[] {
  if (value === undefined) {
    return [];
  }
  const parsed = stringRecordSchema.safeParse(value);
  if (!parsed.success) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        DiagnosticCode.MANIFEST_PARSE_FAILED,
        `package.json field "${field}" is not an object and was ignored.`,
        relativePath,
      ),
    );
    return [];
  }
  return Object.keys(parsed.data).sort((a, b) => a.localeCompare(b));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readWorkspaces(value: unknown): string[] | undefined {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return [...value].sort((a, b) => a.localeCompare(b));
  }
  if (isPlainObject(value) && Array.isArray(value.packages)) {
    const packages = value.packages.filter((item): item is string => typeof item === "string");
    return packages.sort((a, b) => a.localeCompare(b));
  }
  return undefined;
}
