import { InspectError } from "@codetranslate/core";
import { inspectRepository } from "@codetranslate/ingest";
import { createLogger } from "@codetranslate/shared";
import { printSymbols, serializeSymbolsJson } from "../output/symbols";
import type { InspectCommandOptions } from "./inspect";

export async function runSymbolsCommand(
  inputPath: string,
  options: InspectCommandOptions,
): Promise<void> {
  const json = options.json === true;
  const logger = createLogger({ debug: options.debug === true, quiet: json });

  try {
    const { analysis } = await inspectRepository(inputPath, {}, logger);
    if (json) {
      process.stdout.write(serializeSymbolsJson(analysis));
      return;
    }
    printSymbols(analysis, logger);
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
