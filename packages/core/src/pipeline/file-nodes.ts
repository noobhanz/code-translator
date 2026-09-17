import { fileIdFrom } from "@codetranslate/shared";
import type { FileNode } from "../schema/files";
import type { FileAnalysis } from "../schema/source";
import type { SnapshotFile } from "../types/snapshot";

export function snapshotFileToNode(
  repositoryId: string,
  file: SnapshotFile,
  analysis?: FileAnalysis,
): FileNode {
  const node: FileNode = {
    id: fileIdFrom(repositoryId, file.path),
    path: file.path,
    extension: file.extension,
    category: file.category,
    sizeBytes: file.sizeBytes,
    hash: file.hash,
    binary: file.binary,
    ignored: file.ignored,
  };

  if (file.language !== undefined) {
    node.language = file.language;
  }
  if (file.ignoreReason !== undefined) {
    node.ignoreReason = file.ignoreReason;
  }
  if (analysis !== undefined) {
    node.analysis = analysis;
  }

  return node;
}

export function sortFileNodes(files: readonly FileNode[]): FileNode[] {
  return [...files].sort((a, b) => a.path.localeCompare(b.path));
}
