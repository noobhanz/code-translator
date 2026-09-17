import { inspectRepository } from "@codetranslate/ingest";
import { createLogger } from "@codetranslate/shared";
import { printGraphSummary, serializeGraphJson } from "../output/graph";
import { handleCommandError } from "./dependencies";
import type { InspectCommandOptions } from "./inspect";

export async function runGraphCommand(
  inputPath: string,
  options: InspectCommandOptions,
): Promise<void> {
  const json = options.json === true;
  const logger = createLogger({ debug: options.debug === true, quiet: json });

  try {
    const { analysis } = await inspectRepository(inputPath, {}, logger);
    if (json) {
      process.stdout.write(serializeGraphJson(analysis));
      return;
    }
    printGraphSummary(analysis, logger);
  } catch (error) {
    handleCommandError(error, logger, options.debug === true);
  }
}
