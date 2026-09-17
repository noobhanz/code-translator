import type { ApplicationEvidence, FileNode } from "@codetranslate/core";

export function evidence(partial: ApplicationEvidence): ApplicationEvidence {
  return partial;
}

export function fileEvidence(
  file: FileNode,
  description: string,
  weight?: number,
): ApplicationEvidence {
  const item: ApplicationEvidence = { type: "file", fileId: file.id, description };
  if (weight !== undefined) {
    item.weight = weight;
  }
  return item;
}

export function packageEvidence(
  packageName: string,
  description: string,
  weight?: number,
): ApplicationEvidence {
  const item: ApplicationEvidence = { type: "package", packageName, description };
  if (weight !== undefined) {
    item.weight = weight;
  }
  return item;
}

export function pathEvidence(
  file: FileNode,
  description: string,
  weight?: number,
): ApplicationEvidence {
  const item: ApplicationEvidence = { type: "path", fileId: file.id, description };
  if (weight !== undefined) {
    item.weight = weight;
  }
  return item;
}

export function conventionEvidence(
  description: string,
  file?: FileNode,
  weight?: number,
): ApplicationEvidence {
  const item: ApplicationEvidence = { type: "framework-convention", description };
  if (file) {
    item.fileId = file.id;
  }
  if (weight !== undefined) {
    item.weight = weight;
  }
  return item;
}

export function importEvidence(
  file: FileNode,
  packageName: string,
  description: string,
  weight?: number,
): ApplicationEvidence {
  const item: ApplicationEvidence = {
    type: "import",
    fileId: file.id,
    packageName,
    description,
  };
  if (weight !== undefined) {
    item.weight = weight;
  }
  return item;
}

export function uniqueFileIds(ids: string[]): string[] {
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}
