import { InspectError } from "@codetranslate/core";
import { inspectRepository } from "@codetranslate/ingest";
import { createLogger } from "@codetranslate/shared";
import { printDependencies, serializeDependenciesJson } from "../output/dependencies";
import type { InspectCommandOptions } from "./inspect";

export async function runDependenciesCommand(
  inputPath: string,
  options: InspectCommandOptions,
): Promise<void> {
  const json = options.json === true;
  const logger = createLogger({ debug: options.debug === true, quiet: json });

  try {
    const { analysis } = await inspectRepository(inputPath, {}, logger);
    if (json) {
      process.stdout.write(serializeDependenciesJson(analysis));
      return;
    }
    printDependencies(analysis, logger);
  } catch (error) {
    handleCommandError(error, logger, options.debug === true);
  }
}

export function handleCommandError(
  error: unknown,
  logger: ReturnType<typeof createLogger>,
  debug: boolean,
): void {
  if (error instanceof InspectError) {
    logger.error(error.message);
    process.exitCode = error.exitCode;
    return;
  }
  if (debug && error instanceof Error && error.stack) {
    logger.debug(error.stack);
  }
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
