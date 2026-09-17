import { Command } from "commander";
import { ANALYZER_VERSION } from "@codetranslate/shared";
import { runDependenciesCommand } from "./commands/dependencies";
import { runGraphCommand } from "./commands/graph";
import { runInspectCommand, type InspectCommandOptions } from "./commands/inspect";
import { runSymbolsCommand } from "./commands/symbols";
import { runUnderstandCommand } from "./commands/understand";

const program = new Command();

program
  .name("codetranslate")
  .description("Code Translator\n\nUnderstand the software you built.")
  .version(ANALYZER_VERSION, "-V, --version", "Show the analyzer version")
  .option("--debug", "Enable debug logging", false)
  .option("--json", "Write machine-readable JSON to stdout", false)
  .option("--output <path>", "Output path for repository.json")
  .helpOption("-h, --help", "Show help")
  .addHelpText(
    "after",
    `
Examples:
  $ codetranslate understand ./my-project
  $ codetranslate inspect ./fixtures/next-basic
  $ codetranslate symbols ./fixtures/next-basic
  $ codetranslate dependencies ./fixtures/next-basic
  $ codetranslate graph ./fixtures/next-basic
`,
  );

program
  .command("understand")
  .description("Explain the application in plain language")
  .argument("<path>", "Path to a local repository directory")
  .option("--debug", "Enable debug logging", false)
  .option("--json", "Write application overview JSON to stdout", false)
  .action(async (inputPath: string, commandOptions: InspectCommandOptions, command: Command) => {
    const globalOptions = command.parent?.opts<InspectCommandOptions>() ?? {};
    await runUnderstandCommand(inputPath, {
      debug: Boolean(commandOptions.debug || globalOptions.debug),
      json: Boolean(commandOptions.json || globalOptions.json),
    });
  });

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

program
  .command("symbols")
  .description("List extracted source symbols in a local repository")
  .argument("<path>", "Path to a local repository directory")
  .option("--debug", "Enable debug logging", false)
  .option("--json", "Write machine-readable JSON to stdout", false)
  .action(async (inputPath: string, commandOptions: InspectCommandOptions, command: Command) => {
    const globalOptions = command.parent?.opts<InspectCommandOptions>() ?? {};
    await runSymbolsCommand(inputPath, {
      debug: Boolean(commandOptions.debug || globalOptions.debug),
      json: Boolean(commandOptions.json || globalOptions.json),
    });
  });

program
  .command("dependencies")
  .description("List resolved module dependencies")
  .argument("<path>", "Path to a local repository directory")
  .option("--debug", "Enable debug logging", false)
  .option("--json", "Write machine-readable JSON to stdout", false)
  .action(async (inputPath: string, commandOptions: InspectCommandOptions, command: Command) => {
    const globalOptions = command.parent?.opts<InspectCommandOptions>() ?? {};
    await runDependenciesCommand(inputPath, {
      debug: Boolean(commandOptions.debug || globalOptions.debug),
      json: Boolean(commandOptions.json || globalOptions.json),
    });
  });

program
  .command("graph")
  .description("Summarize the repository dependency graph")
  .argument("<path>", "Path to a local repository directory")
  .option("--debug", "Enable debug logging", false)
  .option("--json", "Write machine-readable JSON to stdout", false)
  .action(async (inputPath: string, commandOptions: InspectCommandOptions, command: Command) => {
    const globalOptions = command.parent?.opts<InspectCommandOptions>() ?? {};
    await runGraphCommand(inputPath, {
      debug: Boolean(commandOptions.debug || globalOptions.debug),
      json: Boolean(commandOptions.json || globalOptions.json),
    });
  });

await program.parseAsync(process.argv);
