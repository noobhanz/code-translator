import { getExtension, normalizeRelativePath, toPosixPath } from "@codetranslate/shared";

export function posixDirname(relativePath: string): string {
  const normalized = normalizeRelativePath(relativePath);
  const index = normalized.lastIndexOf("/");
  return index === -1 ? "" : normalized.slice(0, index);
}

export function posixJoin(...parts: string[]): string {
  const joined = parts
    .filter((part) => part !== "")
    .map((part) => toPosixPath(part))
    .join("/");
  return normalizePosixPath(joined);
}

export function normalizePosixPath(value: string): string {
  const posix = toPosixPath(value).replace(/^\.\/+/, "");
  const parts: string[] = [];
  for (const part of posix.split("/")) {
    if (part === "" || part === ".") {
      continue;
    }
    if (part === "..") {
      if (parts.length > 0 && parts[parts.length - 1] !== "..") {
        parts.pop();
      } else {
        parts.push("..");
      }
      continue;
    }
    parts.push(part);
  }
  return parts.join("/");
}

export function isRelativeSpecifier(specifier: string): boolean {
  return (
    specifier.startsWith("./") ||
    specifier.startsWith("../") ||
    specifier === "." ||
    specifier === ".."
  );
}

export function hasExplicitExtension(specifier: string): boolean {
  const base = specifier.split("/").pop() ?? specifier;
  if (base.startsWith(".") && !base.slice(1).includes(".")) {
    return false;
  }
  return getExtension(base) !== "";
}

export function escapesRepository(relativePath: string): boolean {
  return relativePath === ".." || relativePath.startsWith("../");
}
