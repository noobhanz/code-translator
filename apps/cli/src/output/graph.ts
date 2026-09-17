import type { RepositoryAnalysis } from "@codetranslate/core";
import type { Logger } from "@codetranslate/shared";

export function printGraphSummary(analysis: RepositoryAnalysis, logger: Logger): void {
  const stats = analysis.statistics.dependencyGraph;
  logger.info("Dependency Graph");
  logger.info("");
  logger.info("Nodes:");
  logger.info(`  Internal files      ${stats.internalFileNodes}`);
  logger.info(`  External packages   ${stats.externalPackageNodes}`);
  logger.info(`  Built-ins           ${stats.builtinNodes}`);
  logger.info("");
  logger.info("Edges:");
  logger.info(`  Internal            ${stats.internalEdges}`);
  logger.info(`  External            ${stats.externalEdges}`);
  logger.info(`  Built-in            ${stats.builtinEdges}`);
  logger.info("");
  logger.info(`Unresolved imports: ${stats.unresolvedImports}`);
  logger.info("");

  const ranked = [...analysis.fileImportance]
    .filter((item) => item.reasons.incomingDependencies > 0)
    .sort(
      (a, b) =>
        b.reasons.incomingDependencies - a.reasons.incomingDependencies ||
        a.path.localeCompare(b.path),
    )
    .slice(0, 8);

  if (ranked.length === 0) {
    logger.info("Most depended-on files:");
    logger.info("  (none with incoming internal/external edges)");
    return;
  }

  logger.info("Most depended-on files:");
  for (const item of ranked) {
    logger.info(`  ${item.path}`);
    logger.info(`    incoming: ${item.reasons.incomingDependencies}`);
  }
}

export function serializeGraphJson(analysis: RepositoryAnalysis): string {
  return `${JSON.stringify(
    {
      schemaVersion: analysis.schemaVersion,
      repository: { id: analysis.repository.id, name: analysis.repository.name },
      statistics: analysis.statistics.dependencyGraph,
      graph: analysis.graph,
      resolutions: analysis.resolutions,
      fileImportance: analysis.fileImportance,
    },
    null,
    2,
  )}\n`;
}
