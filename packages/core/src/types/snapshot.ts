import type { Diagnostic } from "../schema/diagnostics";
import type { FileCategory } from "../schema/files";
import type { RepositoryMetadata } from "../schema/analysis";

export interface SnapshotFile {
  path: string;
  absolutePath: string;
  extension: string;
  sizeBytes: number;
  hash: string;
  binary: boolean;
  category: FileCategory;
  language?: string;
  ignored: boolean;
  ignoreReason?: string;
}

export interface RepositorySnapshot {
  metadata: RepositoryMetadata;
  files: SnapshotFile[];
  diagnostics: Diagnostic[];
  readText(relativePath: string): Promise<string>;
}

export interface RepositorySource {
  getSnapshot(): Promise<RepositorySnapshot>;
}
