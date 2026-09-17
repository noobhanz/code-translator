import fs from "node:fs/promises";
import path from "node:path";
import {
  createDiagnostic,
  DiagnosticCode,
  InspectError,
  type Diagnostic,
} from "@codetranslate/core";
import { isPathInsideRoot, normalizeRelativePath, type Logger } from "@codetranslate/shared";
import type { IgnoreMatcher } from "../ignore/gitignore";

export interface DiscoveredFile {
  path: string;
  absolutePath: string;
  sizeBytes: number;
  ignored: boolean;
  ignoreReason?: string;
}

export interface WalkResult {
  files: DiscoveredFile[];
  diagnostics: Diagnostic[];
  fileLimitReached: boolean;
}

interface WalkContext {
  rootPath: string;
  matcher: IgnoreMatcher;
  maxFiles: number;
  logger?: Logger;
  files: DiscoveredFile[];
  diagnostics: Diagnostic[];
  fileLimitReached: boolean;
}

export async function walkRepository(
  rootPath: string,
  matcher: IgnoreMatcher,
  maxFiles: number,
  logger?: Logger,
): Promise<WalkResult> {
  const context: WalkContext = {
    rootPath,
    matcher,
    maxFiles,
    logger,
    files: [],
    diagnostics: [],
    fileLimitReached: false,
  };

  await walkDirectory(context, rootPath, "");
  context.files.sort((a, b) => a.path.localeCompare(b.path));
  return {
    files: context.files,
    diagnostics: context.diagnostics,
    fileLimitReached: context.fileLimitReached,
  };
}

async function walkDirectory(
  context: WalkContext,
  absoluteDir: string,
  relativeDir: string,
): Promise<void> {
  if (context.fileLimitReached) {
    return;
  }

  let entries;
  try {
    entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const diagnosticCode =
      code === "EACCES" || code === "EPERM"
        ? DiagnosticCode.PERMISSION_DENIED
        : DiagnosticCode.FILE_READ_FAILED;
    context.diagnostics.push(
      createDiagnostic(
        "warning",
        diagnosticCode,
        `Could not read directory: ${describeError(error)}`,
        relativeDir || ".",
      ),
    );
    return;
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    if (context.fileLimitReached) {
      return;
    }

    const absolutePath = path.join(absoluteDir, entry.name);
    const relativePath = normalizeRelativePath(path.join(relativeDir, entry.name));

    if (entry.isSymbolicLink()) {
      await handleSymlink(context, absolutePath, relativePath);
      continue;
    }

    if (entry.isDirectory()) {
      if (context.matcher.ignores(relativePath, true)) {
        context.logger?.debug(`skipping ignored directory ${relativePath}`);
        continue;
      }
      await walkDirectory(context, absolutePath, relativePath);
      continue;
    }

    if (!entry.isFile()) {
      context.logger?.debug(`skipping non-file entry ${relativePath}`);
      continue;
    }

    await addFile(context, absolutePath, relativePath);
  }
}

async function handleSymlink(
  context: WalkContext,
  absolutePath: string,
  relativePath: string,
): Promise<void> {
  try {
    const target = await fs.realpath(absolutePath);
    if (!isPathInsideRoot(context.rootPath, target)) {
      context.diagnostics.push(
        createDiagnostic(
          "warning",
          DiagnosticCode.SYMLINK_SKIPPED,
          "Skipped symlink that points outside the repository.",
          relativePath,
        ),
      );
      return;
    }
  } catch {
    context.diagnostics.push(
      createDiagnostic(
        "warning",
        DiagnosticCode.SYMLINK_SKIPPED,
        "Skipped unreadable or dangling symlink.",
        relativePath,
      ),
    );
    return;
  }

  context.diagnostics.push(
    createDiagnostic(
      "info",
      DiagnosticCode.SYMLINK_SKIPPED,
      "Skipped symlink to avoid circular or duplicate discovery.",
      relativePath,
    ),
  );
  context.logger?.debug(`skipping symlink ${relativePath}`);
}

async function addFile(
  context: WalkContext,
  absolutePath: string,
  relativePath: string,
): Promise<void> {
  if (context.files.length >= context.maxFiles) {
    if (!context.fileLimitReached) {
      context.fileLimitReached = true;
      context.diagnostics.push(
        createDiagnostic(
          "warning",
          DiagnosticCode.REPOSITORY_FILE_LIMIT_REACHED,
          `Stopped after discovering ${context.maxFiles} files.`,
        ),
      );
    }
    return;
  }

  let sizeBytes = 0;
  try {
    const stat = await fs.stat(absolutePath);
    sizeBytes = stat.size;
  } catch (error) {
    context.diagnostics.push(
      createDiagnostic(
        "warning",
        DiagnosticCode.FILE_READ_FAILED,
        `Could not stat file: ${describeError(error)}`,
        relativePath,
      ),
    );
    return;
  }

  const ignoredByRules = context.matcher.ignores(relativePath, false);
  const file: DiscoveredFile = {
    path: relativePath,
    absolutePath,
    sizeBytes,
    ignored: ignoredByRules,
  };
  if (ignoredByRules) {
    file.ignoreReason = "ignore rule";
    context.logger?.debug(`ignored file ${relativePath} (ignore rule)`);
  }

  context.files.push(file);
}

function describeError(error: unknown): string {
  if (error instanceof InspectError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
