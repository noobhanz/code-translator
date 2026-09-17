import path from "node:path";

/**
 * Normalize path separators to POSIX `/` for stable cross-platform output.
 */
export function toPosixPath(value: string): string {
  return value.replaceAll("\\", "/");
}

/**
 * Repository-relative path used in serialized output.
 * - POSIX separators
 * - no leading `./`
 * - no trailing slash
 */
export function normalizeRelativePath(value: string): string {
  return toPosixPath(value)
    .replace(/^\.\/+/, "")
    .replace(/\/+$/, "");
}

export function normalizeAbsolutePath(value: string): string {
  return toPosixPath(path.resolve(value));
}

export function fileName(relativePath: string): string {
  const normalized = normalizeRelativePath(relativePath);
  const segments = normalized.split("/");
  return segments[segments.length - 1] ?? normalized;
}

export function pathSegments(relativePath: string): string[] {
  return normalizeRelativePath(relativePath).split("/").filter(Boolean);
}

/**
 * Last extension including the dot, lowercased.
 * `.gitignore` and similar dotfiles without a second dot have no extension.
 */
export function getExtension(relativePath: string): string {
  const base = fileName(relativePath);
  if (base.startsWith(".") && !base.slice(1).includes(".")) {
    return "";
  }
  const ext = path.posix.extname(base);
  return ext.toLowerCase();
}

export function isPathInsideRoot(root: string, candidate: string): boolean {
  const normalizedRoot = path.resolve(root);
  const normalizedCandidate = path.resolve(candidate);
  const relative = path.relative(normalizedRoot, normalizedCandidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
