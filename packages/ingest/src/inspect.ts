import {
  buildRepositoryAnalysis,
  DEFAULT_SCAN_OPTIONS,
  snapshotFileToNode,
  type RepositoryAnalysis,
  type RepositorySource,
  type ScanOptions,
} from "@codetranslate/core";
import { detectApplication } from "@codetranslate/application";
import { analyzeDependencies } from "@codetranslate/graph";
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
  return inspectSource(source, scanOptions, logger);
}

export async function inspectSource(
  source: RepositorySource,
  options: Partial<ScanOptions> = {},
  logger?: Logger,
): Promise<InspectResult> {
  const scanOptions: ScanOptions = { ...DEFAULT_SCAN_OPTIONS, ...options };
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

  const fileNodes = snapshot.files.map((file) =>
    snapshotFileToNode(snapshot.metadata.id, file, parsedSources.analyses.get(file.path)),
  );
  const dependencies = await analyzeDependencies({
    repositoryId: snapshot.metadata.id,
    files: fileNodes,
    manifests: parsedManifests.manifests,
    readText: (relativePath) => snapshot.readText(relativePath),
  });

  const draft = buildRepositoryAnalysis({
    snapshot,
    manifests: parsedManifests.manifests,
    detectedTechnologies,
    extraDiagnostics: [
      ...parsedManifests.diagnostics,
      ...packageManager.diagnostics,
      ...parsedSources.diagnostics,
      ...dependencies.diagnostics,
    ],
    packageManager: packageManager.packageManager,
    fileAnalyses: parsedSources.analyses,
    resolutions: dependencies.resolutions,
    graph: dependencies.graph,
    fileImportance: dependencies.fileImportance,
  });
  const application = detectApplication(draft);
  const analysis = buildRepositoryAnalysis({
    snapshot,
    manifests: parsedManifests.manifests,
    detectedTechnologies,
    extraDiagnostics: draft.diagnostics,
    packageManager: packageManager.packageManager,
    fileAnalyses: parsedSources.analyses,
    resolutions: dependencies.resolutions,
    graph: dependencies.graph,
    fileImportance: dependencies.fileImportance,
    application,
  });

  return {
    analysis,
    outputRoot: snapshot.metadata.rootPath,
  };
}
