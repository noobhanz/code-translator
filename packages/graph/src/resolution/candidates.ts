import type { FileNode } from "@codetranslate/core";
import { normalizeRelativePath } from "@codetranslate/shared";
import { hasExplicitExtension } from "./posix";

/**
 * Deterministic extension probe order for extensionless specifiers.
 */
export const EXTENSION_PRECEDENCE = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mts",
  ".cts",
  ".mjs",
  ".cjs",
] as const;

export interface FileProbeHit {
  path: string;
  file: FileNode;
  evidenceType: "exact-path" | "extension-probe" | "index-file";
}

export function probeInternalPath(
  repoRelativeBase: string,
  filesByPath: ReadonlyMap<string, FileNode>,
  specifierHasExtension: boolean = hasExplicitExtension(repoRelativeBase),
): { hit?: FileProbeHit; candidates: string[] } {
  const base = normalizeRelativePath(repoRelativeBase);
  const candidates: string[] = [];

  if (specifierHasExtension) {
    candidates.push(base);
    const exact = filesByPath.get(base);
    if (exact) {
      return { hit: { path: base, file: exact, evidenceType: "exact-path" }, candidates };
    }
    return { candidates };
  }

  for (const extension of EXTENSION_PRECEDENCE) {
    const candidate = `${base}${extension}`;
    candidates.push(candidate);
    const file = filesByPath.get(candidate);
    if (file) {
      return { hit: { path: candidate, file, evidenceType: "extension-probe" }, candidates };
    }
  }

  for (const extension of EXTENSION_PRECEDENCE) {
    const candidate = `${base}/index${extension}`;
    candidates.push(candidate);
    const file = filesByPath.get(candidate);
    if (file) {
      return { hit: { path: candidate, file, evidenceType: "index-file" }, candidates };
    }
  }

  return { candidates };
}
