import { FILE_CATEGORY_PRIORITY, type FileNode } from "../schema/files";
import type { RepositoryStatistics } from "../schema/analysis";

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function sortRecord(counts: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

export function computeStatistics(files: readonly FileNode[]): RepositoryStatistics {
  const categoryCounts: Record<string, number> = {};
  const languageCounts: Record<string, number> = {};
  const extensionCounts: Record<string, number> = {};

  for (const category of FILE_CATEGORY_PRIORITY) {
    categoryCounts[category] = 0;
  }

  let filesIncluded = 0;
  let filesIgnored = 0;
  let binaryFiles = 0;
  let totalBytes = 0;
  let includedBytes = 0;

  for (const file of files) {
    totalBytes += file.sizeBytes;
    if (file.ignored) {
      filesIgnored += 1;
      continue;
    }

    filesIncluded += 1;
    includedBytes += file.sizeBytes;
    increment(categoryCounts, file.category);
    if (file.language) {
      increment(languageCounts, file.language);
    }
    const extensionKey = file.extension === "" ? "(none)" : file.extension;
    increment(extensionCounts, extensionKey);
    if (file.binary) {
      binaryFiles += 1;
    }
  }

  return {
    filesDiscovered: files.length,
    filesIncluded,
    filesIgnored,
    binaryFiles,
    totalBytes,
    includedBytes,
    categoryCounts: sortRecord(categoryCounts),
    languageCounts: sortRecord(languageCounts),
    extensionCounts: sortRecord(extensionCounts),
  };
}
