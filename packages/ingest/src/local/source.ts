import fs from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_SCAN_OPTIONS,
  InspectError,
  type RepositorySnapshot,
  type RepositorySource,
  type ScanOptions,
  type SnapshotFile,
} from "@codetranslate/core";
import {
  ANALYZER_VERSION,
  normalizeRelativePath,
  repositoryIdFromPath,
  toPosixPath,
  type Logger,
} from "@codetranslate/shared";
import { loadIgnoreMatcher } from "../ignore/gitignore";
import { processDiscoveredFiles } from "./process-files";
import { walkRepository } from "./walk";

export class LocalRepositorySource implements RepositorySource {
  private readonly inputPath: string;
  private readonly options: ScanOptions;
  private readonly logger?: Logger;

  constructor(inputPath: string, options: Partial<ScanOptions> = {}, logger?: Logger) {
    this.inputPath = inputPath;
    this.options = { ...DEFAULT_SCAN_OPTIONS, ...options };
    this.logger = logger;
  }

  async getSnapshot(): Promise<RepositorySnapshot> {
    const resolvedInput = path.resolve(this.inputPath);
    const rootPath = await resolveRepositoryRoot(resolvedInput);
    const name = path.basename(rootPath);
    const analyzedAt = new Date().toISOString();
    const id = repositoryIdFromPath(toPosixPath(rootPath));

    this.logger?.debug(`repository root ${rootPath}`);
    this.logger?.debug(
      `scan limits files=${this.options.maxFiles} maxFileBytes=${this.options.maxFileBytes} maxRepositoryBytes=${this.options.maxRepositoryBytes}`,
    );

    const { matcher, diagnostics: ignoreDiagnostics } = await loadIgnoreMatcher(rootPath);
    this.logger?.debug(`loaded ${matcher.patterns.length} ignore pattern groups`);

    const walked = await walkRepository(rootPath, matcher, this.options.maxFiles, this.logger);
    const processed = await processDiscoveredFiles(walked.files, this.options, this.logger);

    const files = processed.files;
    const diagnostics = [...ignoreDiagnostics, ...walked.diagnostics, ...processed.diagnostics];

    return {
      metadata: {
        id,
        name,
        source: {
          type: "local",
          path: this.inputPath,
        },
        rootPath: toPosixPath(rootPath),
        analyzedAt,
        analyzerVersion: ANALYZER_VERSION,
      },
      files,
      diagnostics,
      readText: async (relativePath: string) => readSnapshotText(files, relativePath),
    };
  }
}

async function resolveRepositoryRoot(resolvedInput: string): Promise<string> {
  let stat;
  try {
    stat = await fs.stat(resolvedInput);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new InspectError(`Repository path does not exist: ${resolvedInput}`);
    }
    throw new InspectError(
      `Could not access repository path: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!stat.isDirectory()) {
    throw new InspectError(`Repository path is not a directory: ${resolvedInput}`);
  }

  try {
    return await fs.realpath(resolvedInput);
  } catch {
    return resolvedInput;
  }
}

async function readSnapshotText(files: SnapshotFile[], relativePath: string): Promise<string> {
  const normalized = normalizeRelativePath(relativePath);
  const file = files.find((candidate) => candidate.path === normalized);
  if (!file) {
    throw new InspectError(`File is not in the repository snapshot: ${normalized}`);
  }
  if (file.ignored) {
    throw new InspectError(`Cannot read ignored file as text: ${normalized}`);
  }
  if (file.binary) {
    throw new InspectError(`Cannot read binary file as text: ${normalized}`);
  }

  return fs.readFile(file.absolutePath, "utf8");
}
