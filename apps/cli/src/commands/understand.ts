import { InspectError } from "@codetranslate/core";
import {
  humanAnalyzeError,
  printUnderstand,
  serializeUnderstandJson,
} from "@codetranslate/application";
import { inspectRepository } from "@codetranslate/ingest";
import { createLogger } from "@codetranslate/shared";
import type { InspectCommandOptions } from "./inspect";

export async function runUnderstandCommand(
  inputPath: string,
  options: InspectCommandOptions,
): Promise<void> {
  const json = options.json === true;
  const logger = createLogger({ debug: options.debug === true, quiet: json });

  try {
    const { analysis } = await inspectRepository(inputPath, {}, logger);
    const model = analysis.application;
    if (!model) {
      throw new InspectError("We couldn't prepare an application overview for that project.");
    }
    if (json) {
      process.stdout.write(serializeUnderstandJson(model));
      return;
    }
    printUnderstand(model, logger);
  } catch (error) {
    if (error instanceof InspectError) {
      logger.error(options.debug ? error.message : humanAnalyzeError(error.message));
      process.exitCode = error.exitCode;
      return;
    }
    if (options.debug && error instanceof Error && error.stack) {
      logger.debug(error.stack);
    }
    const message = error instanceof Error ? error.message : String(error);
    logger.error(options.debug ? message : humanAnalyzeError(message));
    process.exitCode = 1;
  }
}
