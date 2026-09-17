import {
  createDiagnostic,
  DiagnosticCode,
  type Diagnostic,
  type ManifestSummary,
  type SnapshotFile,
} from "@codetranslate/core";
import { fileName } from "@codetranslate/shared";

export type PackageManagerName = "pnpm" | "npm" | "yarn" | "bun";

const LOCKFILE_MANAGERS: Record<string, PackageManagerName> = {
  "pnpm-lock.yaml": "pnpm",
  "package-lock.json": "npm",
  "npm-shrinkwrap.json": "npm",
  "yarn.lock": "yarn",
  "bun.lock": "bun",
  "bun.lockb": "bun",
};

const FIELD_PREFIX: Record<string, PackageManagerName> = {
  pnpm: "pnpm",
  npm: "npm",
  yarn: "yarn",
  bun: "bun",
};

export function detectPackageManager(
  files: readonly SnapshotFile[],
  manifests: readonly ManifestSummary[],
): { packageManager?: PackageManagerName; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  const lockfileHits = new Map<PackageManagerName, string>();

  for (const file of files) {
    const manager = LOCKFILE_MANAGERS[fileName(file.path)];
    if (manager) {
      lockfileHits.set(manager, file.path);
    }
  }

  let fieldHit: PackageManagerName | undefined;
  let fieldEvidence: string | undefined;
  for (const manifest of manifests) {
    if (manifest.type !== "package.json" || !manifest.packageManager) {
      continue;
    }
    const prefix = manifest.packageManager.split("@")[0]?.toLowerCase();
    if (!prefix) {
      continue;
    }
    const mapped = FIELD_PREFIX[prefix];
    if (mapped) {
      fieldHit = mapped;
      fieldEvidence = manifest.path;
    }
  }

  const lockfileNames = [...lockfileHits.keys()];

  if (fieldHit && lockfileNames.length > 0 && !lockfileHits.has(fieldHit)) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        DiagnosticCode.PACKAGE_MANAGER_CONFLICT,
        `package.json packageManager field indicates ${fieldHit}, but lockfile evidence indicates ${lockfileNames.join(", ")}. Using packageManager field.`,
        fieldEvidence,
      ),
    );
    return { packageManager: fieldHit, diagnostics };
  }

  if (fieldHit) {
    return { packageManager: fieldHit, diagnostics };
  }

  if (lockfileNames.length === 1) {
    return { packageManager: lockfileNames[0], diagnostics };
  }

  if (lockfileNames.length > 1) {
    const preferred = preferPackageManager(lockfileNames);
    diagnostics.push(
      createDiagnostic(
        "warning",
        DiagnosticCode.PACKAGE_MANAGER_CONFLICT,
        `Multiple lockfiles found (${lockfileNames.join(", ")}). Using ${preferred}.`,
      ),
    );
    return { packageManager: preferred, diagnostics };
  }

  return { diagnostics };
}

function preferPackageManager(names: PackageManagerName[]): PackageManagerName {
  const order: PackageManagerName[] = ["pnpm", "bun", "yarn", "npm"];
  return order.find((name) => names.includes(name)) ?? names[0] ?? "npm";
}
