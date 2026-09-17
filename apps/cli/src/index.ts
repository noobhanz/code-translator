import { Command } from "commander";
import { ANALYZER_VERSION } from "@codetranslate/shared";
import { runInspectCommand, type InspectCommandOptions } from "./commands/inspect";

const program = new Command();

program
  .name("codetranslate")
  .description("Code Translator\n\nUnderstand the structure of a software repository.")
  .version(ANALYZER_VERSION, "-V, --version", "Show the analyzer version")
  .option("--debug", "Enable debug logging", false)
  .option("--json", "Write machine-readable JSON to stdout", false)
  .option("--output <path>", "Output path for repository.json")
  .helpOption("-h, --help", "Show help")
  .addHelpText(
    "after",
    `
Examples:
  $ codetranslate inspect ./fixtures/next-basic
  $ codetranslate inspect ./fixtures/next-basic --json
  $ codetranslate inspect ./fixtures/next-basic --debug
`,
  );

program
  .command("inspect")
  .description("Analyze a local repository")
  .argument("<path>", "Path to a local repository directory")
  .option("--debug", "Enable debug logging", false)
  .option("--json", "Write machine-readable JSON to stdout", false)
  .option("--output <path>", "Output path for repository.json")
  .action(async (inputPath: string, commandOptions: InspectCommandOptions, command: Command) => {
    const globalOptions = command.parent?.opts<InspectCommandOptions>() ?? {};
    await runInspectCommand(inputPath, {
      debug: Boolean(commandOptions.debug || globalOptions.debug),
      json: Boolean(commandOptions.json || globalOptions.json),
      output: commandOptions.output ?? globalOptions.output,
    });
  });

await program.parseAsync(process.argv);
