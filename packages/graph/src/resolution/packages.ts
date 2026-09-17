export function canonicalNpmPackageName(specifier: string): string {
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    return parts.slice(0, 2).join("/");
  }
  return specifier.split("/")[0] ?? specifier;
}

export function looksLikeBarePackage(specifier: string): boolean {
  if (specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("node:")) {
    return false;
  }
  return specifier.length > 0;
}
