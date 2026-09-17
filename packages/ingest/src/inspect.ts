import {
  buildRepositoryAnalysis,
  DEFAULT_SCAN_OPTIONS,
  type RepositoryAnalysis,
  type ScanOptions,
} from "@codetranslate/core";
import { analyzeSnapshotSources } from "@codetranslate/parser";
import type { Logger } from "@codetranslate/shared";
import { LocalRepositorySource } from "./local/source";
import { parseManifests } from "./manifests/detect";
import { detectPackageManager } from "./manifests/package-manager";
import { detectInstalledTechnologies } from "./manifests/technologies";

export interface InspectResult {
  analysis: RepositoryAnalysis;
  outputRoot: string;
}

export async function inspectRepository(
  inputPath: string,
  options: Partial<ScanOptions> = {},
  logger?: Logger,
): Promise<InspectResult> {
  const scanOptions: ScanOptions = { ...DEFAULT_SCAN_OPTIONS, ...options };
  const source = new LocalRepositorySource(inputPath, scanOptions, logger);
  const snapshot = await source.getSnapshot();

  logger?.debug(`discovered ${snapshot.files.length} files`);

  const parsedManifests = await parseManifests(snapshot);
  const packageManager = detectPackageManager(snapshot.files, parsedManifests.manifests);
  const detectedTechnologies = detectInstalledTechnologies(parsedManifests.manifests);
  const parsedSources = await analyzeSnapshotSources(
    snapshot,
    {
      maxParserFileBytes: scanOptions.maxParserFileBytes,
      concurrency: scanOptions.concurrency,
    },
    logger,
  );

  const analysis = buildRepositoryAnalysis({
    snapshot,
    manifests: parsedManifests.manifests,
    detectedTechnologies,
    extraDiagnostics: [
      ...parsedManifests.diagnostics,
      ...packageManager.diagnostics,
      ...parsedSources.diagnostics,
    ],
    packageManager: packageManager.packageManager,
    fileAnalyses: parsedSources.analyses,
  });

  return {
    analysis,
    outputRoot: snapshot.metadata.rootPath,
  };
}
