import type { ApplicationModel } from "@codetranslate/core";
import type { Logger } from "@codetranslate/shared";
import { visibleToHumans } from "./scoring";

export function printUnderstand(model: ApplicationModel, logger: Logger): void {
  logger.info("Code Translator");
  logger.info("");
  logger.info("What you built");
  logger.info("");
  logger.info(`  ${model.summary.headline}`);
  if (
    model.summary.primaryFramework &&
    !model.summary.headline.includes(model.summary.primaryFramework)
  ) {
    logger.info(`  Built with ${model.summary.primaryFramework}`);
  }
  logger.info("");

  const pages = model.surfaces.filter(
    (surface) => surface.type === "page" && visibleToHumans(surface.confidence),
  );
  if (pages.length > 0) {
    logger.info("Pages");
    logger.info("");
    for (const page of pages) {
      logger.info(`  ${page.name}`);
    }
    logger.info("");
  }

  const areas = model.areas.filter((area) => visibleToHumans(area.confidence));
  if (areas.length > 0) {
    logger.info("Main parts");
    logger.info("");
    for (const area of areas) {
      logger.info(`  ${area.name}`);
      logger.info(`    ${area.description}`);
      logger.info("");
    }
  } else {
    logger.info(
      "We found the project structure, but couldn't confidently identify its main features yet.",
    );
    logger.info("");
  }

  const services = model.externalServices.filter((service) => visibleToHumans(service.confidence));
  if (services.length > 0) {
    logger.info("Connected services");
    logger.info("");
    for (const service of services) {
      logger.info(`  ${service.name}`);
    }
    logger.info("");
  }

  logger.info("Technical details are available with:");
  logger.info("  codetranslate inspect");
}

export function serializeUnderstandJson(model: ApplicationModel): string {
  const visible = {
    summary: model.summary,
    frameworks: model.frameworks.filter((item) => visibleToHumans(item.confidence)),
    entrypoints: model.entrypoints.filter((item) => visibleToHumans(item.confidence)),
    surfaces: model.surfaces.filter((item) => visibleToHumans(item.confidence)),
    areas: model.areas.filter((item) => visibleToHumans(item.confidence)),
    capabilities: model.capabilities.filter((item) => visibleToHumans(item.confidence)),
    externalServices: model.externalServices.filter((item) => visibleToHumans(item.confidence)),
    dataStores: model.dataStores.filter((item) => visibleToHumans(item.confidence)),
    relationships: model.relationships.filter((item) => visibleToHumans(item.confidence)),
  };
  return `${JSON.stringify(visible, null, 2)}\n`;
}

export function humanAnalyzeError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("does not exist")) {
    return "We couldn't find that project folder.";
  }
  if (lower.includes("not a directory")) {
    return "That path isn't a project folder.";
  }
  if (lower.includes("too large") || lower.includes("file limit")) {
    return "This project is too large for the current analysis limits.";
  }
  return "We couldn't analyze that project.";
}
