import path from "node:path";
import {
  InspectError,
  resolveOutputFilePath,
  serializeAnalysis,
  writeRepositoryAnalysis,
} from "@codetranslate/core";
import { inspectRepository } from "@codetranslate/ingest";
import { createLogger, toPosixPath, type Logger } from "@codetranslate/shared";
import { printInspectSummary } from "../output/summary";

export interface InspectCommandOptions {
  json?: boolean;
  debug?: boolean;
  output?: string;
}

export async function runInspectCommand(
  inputPath: string,
  options: InspectCommandOptions,
): Promise<void> {
  const json = options.json === true;
  const logger = createLogger({ debug: options.debug === true, quiet: json });

  try {
    await inspectAndWrite(inputPath, options, logger, json);
  } catch (error) {
    if (error instanceof InspectError) {
      logger.error(error.message);
      process.exitCode = error.exitCode;
      return;
    }
    if (options.debug && error instanceof Error && error.stack) {
      logger.debug(error.stack);
    }
    logger.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

async function inspectAndWrite(
  inputPath: string,
  options: InspectCommandOptions,
  logger: Logger,
  json: boolean,
): Promise<void> {
  logger.info("Code Translator");
  logger.info("");
  logger.info("Scanning repository...");

  const { analysis, outputRoot } = await inspectRepository(inputPath, {}, logger);

  logger.success(pluralize(analysis.statistics.filesDiscovered, "file") + " discovered");
  logger.success(pluralize(analysis.statistics.filesIncluded, "file") + " included");
  logger.success(pluralize(analysis.statistics.filesIgnored, "file") + " ignored");
  logger.info("");
  logger.info("Analyzing repository...");
  logger.success("classification, manifests, and package metadata complete");

  let outputFile: string;
  try {
    outputFile = await resolveOutputFilePath(outputRoot, options.output);
    await writeRepositoryAnalysis(analysis, outputFile);
  } catch (error) {
    throw new InspectError(
      `Could not write analysis output: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const displayPath = displayOutputPath(outputFile);

  if (json) {
    process.stdout.write(serializeAnalysis(analysis));
    return;
  }

  printInspectSummary(analysis, displayPath, logger);
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function displayOutputPath(outputFile: string): string {
  const relative = path.relative(process.cwd(), outputFile);
  if (relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return toPosixPath(relative);
  }
  return toPosixPath(outputFile);
}
