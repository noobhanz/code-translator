import {
  createDiagnostic,
  DiagnosticCode,
  type Diagnostic,
  type FileCategory,
  type ScanOptions,
  type SnapshotFile,
} from "@codetranslate/core";
import { BINARY_PEEK_BYTES, getExtension, mapLimit, type Logger } from "@codetranslate/shared";
import { hasBinaryExtension, looksBinary } from "../binary/detect";
import { classifyFile } from "../classify/category";
import { inferLanguage } from "../classify/language";
import { hashFileContents, peekFileBytes } from "../hash/file-hash";
import { isSensitivePath } from "../ignore/sensitive";
import type { DiscoveredFile } from "./walk";

export async function processDiscoveredFiles(
  discovered: DiscoveredFile[],
  options: ScanOptions,
  logger?: Logger,
): Promise<{ files: SnapshotFile[]; diagnostics: Diagnostic[] }> {
  const diagnostics: Diagnostic[] = [];
  const snapshots: SnapshotFile[] = [];
  const toHash: SnapshotFile[] = [];
  let includedBytes = 0;
  let sizeLimitDiagnosticEmitted = false;

  for (const file of discovered) {
    const snapshot = classifyDiscoveredFile(file);

    if (isSensitivePath(file.path)) {
      snapshot.ignored = true;
      snapshot.ignoreReason = "sensitive file";
      diagnostics.push(
        createDiagnostic(
          "warning",
          DiagnosticCode.SENSITIVE_FILE_SKIPPED,
          "Skipped potentially sensitive file; contents were not read.",
          file.path,
        ),
      );
      logger?.debug(`skipped sensitive file ${file.path}`);
      snapshots.push(snapshot);
      continue;
    }

    if (file.ignored) {
      snapshots.push(snapshot);
      continue;
    }

    if (file.sizeBytes > options.maxFileBytes) {
      snapshot.ignored = true;
      snapshot.ignoreReason = "file too large";
      diagnostics.push(
        createDiagnostic(
          "warning",
          DiagnosticCode.FILE_TOO_LARGE,
          `File exceeds maxFileBytes (${options.maxFileBytes}).`,
          file.path,
        ),
      );
      snapshots.push(snapshot);
      continue;
    }

    if (includedBytes + file.sizeBytes > options.maxRepositoryBytes) {
      snapshot.ignored = true;
      snapshot.ignoreReason = "repository size limit";
      if (!sizeLimitDiagnosticEmitted) {
        sizeLimitDiagnosticEmitted = true;
        diagnostics.push(
          createDiagnostic(
            "warning",
            DiagnosticCode.REPOSITORY_SIZE_LIMIT_REACHED,
            `Stopped reading file contents after reaching maxRepositoryBytes (${options.maxRepositoryBytes}).`,
          ),
        );
      }
      snapshots.push(snapshot);
      continue;
    }

    includedBytes += file.sizeBytes;
    toHash.push(snapshot);
    snapshots.push(snapshot);
  }

  const hashDiagnostics = await mapLimit(toHash, options.concurrency, async (snapshot) => {
    try {
      if (!snapshot.binary) {
        const peek = await peekFileBytes(snapshot.absolutePath, BINARY_PEEK_BYTES);
        if (looksBinary(peek)) {
          snapshot.binary = true;
          logger?.debug(`byte heuristic marked ${snapshot.path} as binary`);
        }
      }
      snapshot.hash = await hashFileContents(snapshot.absolutePath);
      return undefined;
    } catch (error) {
      snapshot.ignored = true;
      snapshot.ignoreReason = "unreadable";
      snapshot.hash = "";
      return createDiagnostic(
        "warning",
        DiagnosticCode.FILE_READ_FAILED,
        `Could not read file: ${error instanceof Error ? error.message : String(error)}`,
        snapshot.path,
      );
    }
  });
  for (const diagnostic of hashDiagnostics) {
    if (diagnostic) {
      diagnostics.push(diagnostic);
    }
  }

  snapshots.sort((a, b) => a.path.localeCompare(b.path));
  return { files: snapshots, diagnostics };
}

function classifyDiscoveredFile(file: DiscoveredFile): SnapshotFile {
  const extension = getExtension(file.path);
  const category: FileCategory = classifyFile(file.path);
  const language = inferLanguage(file.path);
  const snapshot: SnapshotFile = {
    path: file.path,
    absolutePath: file.absolutePath,
    extension,
    sizeBytes: file.sizeBytes,
    hash: "",
    binary: hasBinaryExtension(file.path),
    category,
    ignored: file.ignored,
  };
  if (language !== undefined) {
    snapshot.language = language;
  }
  if (file.ignoreReason !== undefined) {
    snapshot.ignoreReason = file.ignoreReason;
  }
  return snapshot;
}
