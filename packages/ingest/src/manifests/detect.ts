import { fileName } from "@codetranslate/shared";
import type {
  GenericManifestSummary,
  ManifestSummary,
  RepositorySnapshot,
  Diagnostic,
} from "@codetranslate/core";
import { parsePackageManifest } from "./package-json";

const GENERIC_MANIFESTS: Record<string, GenericManifestSummary["type"]> = {
  "pyproject.toml": "pyproject.toml",
  "requirements.txt": "requirements.txt",
  "cargo.toml": "Cargo.toml",
  "go.mod": "go.mod",
  gemfile: "Gemfile",
  "composer.json": "composer.json",
};

export async function parseManifests(
  snapshot: RepositorySnapshot,
): Promise<{ manifests: ManifestSummary[]; diagnostics: Diagnostic[] }> {
  const manifests: ManifestSummary[] = [];
  const diagnostics: Diagnostic[] = [];

  for (const file of snapshot.files) {
    if (file.ignored) {
      continue;
    }

    const base = fileName(file.path);

    if (base === "package.json") {
      const parsed = await parsePackageManifest(snapshot, file.path);
      diagnostics.push(...parsed.diagnostics);
      if (parsed.manifest) {
        manifests.push(parsed.manifest);
      }
      continue;
    }

    const genericType = GENERIC_MANIFESTS[base.toLowerCase()];
    if (genericType) {
      manifests.push({
        type: genericType,
        path: file.path,
      });
    }
  }

  manifests.sort((a, b) => a.path.localeCompare(b.path));
  return { manifests, diagnostics };
}
