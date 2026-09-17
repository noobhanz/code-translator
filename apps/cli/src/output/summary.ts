import type { FileCategory, RepositoryAnalysis } from "@codetranslate/core";
import type { Logger } from "@codetranslate/shared";

const CATEGORY_LABELS: Record<FileCategory, string> = {
  source: "Source",
  test: "Test",
  config: "Config",
  documentation: "Documentation",
  generated: "Generated",
  vendor: "Vendor",
  asset: "Asset",
  unknown: "Unknown",
};

const CATEGORY_ORDER: FileCategory[] = [
  "source",
  "test",
  "config",
  "documentation",
  "generated",
  "vendor",
  "asset",
  "unknown",
];

export function printInspectSummary(
  analysis: RepositoryAnalysis,
  outputPath: string,
  logger: Logger,
): void {
  const stats = analysis.statistics;

  logger.info("");
  logger.info("Repository:");
  logger.info(`  ${analysis.repository.name}`);
  logger.info("");
  logger.info("File categories:");
  for (const category of CATEGORY_ORDER) {
    const count = stats.categoryCounts[category] ?? 0;
    if (count === 0) {
      continue;
    }
    logger.info(`  ${padLabel(CATEGORY_LABELS[category])} ${count}`);
  }

  const languages = Object.entries(stats.languageCounts);
  if (languages.length > 0) {
    logger.info("");
    logger.info("Languages:");
    for (const [language, count] of languages) {
      logger.info(`  ${padLabel(language)} ${count}`);
    }
  }

  logger.info("");
  logger.info("Package manager:");
  logger.info(`  ${analysis.packageManager ?? "unknown"}`);

  if (analysis.detectedTechnologies.length > 0) {
    logger.info("");
    logger.info("Installed technologies:");
    for (const technology of analysis.detectedTechnologies) {
      logger.info(`  ${technology.name}`);
    }
    logger.info("");
    logger.info("Detected from package metadata only (status: installed).");
  }

  if (analysis.diagnostics.length > 0) {
    logger.info("");
    logger.info("Diagnostics:");
    for (const diagnostic of analysis.diagnostics) {
      const location = diagnostic.path ? ` (${diagnostic.path})` : "";
      logger.info(`  ${diagnostic.severity} ${diagnostic.code}${location}: ${diagnostic.message}`);
    }
  }

  logger.info("");
  logger.info("Output:");
  logger.info(`  ${outputPath}`);
  logger.info("");
  logger.info("Analysis complete.");
}

function padLabel(label: string, width = 16): string {
  return label.padEnd(width, " ");
}
