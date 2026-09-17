# Code Translator

Understand what is inside a software repository before asking AI to explain it.

Code Translator is an open-source codebase understanding project.

The project starts with deterministic repository analysis: file discovery,
classification, manifests, technologies, and structured metadata.

AI explanation comes later.

## Why

Most “explain this repo” tools jump straight to a model. That skips the boring work that actually makes explanations trustworthy: what files exist, which ones are source, which package manager is in play, and what the manifests claim is installed.

Milestone A is that foundation. It is a local, static, testable scanner. It never executes repository code.

## Current capabilities

- Recursively scan a local directory
- Respect root `.gitignore` plus internal ignore defaults
- Skip `.git`, `node_modules`, build output, and `.codetranslate/`
- Classify files (source, test, config, documentation, generated, vendor, asset)
- Infer languages from extensions
- Detect binary files
- Hash included files with SHA-256
- Parse `package.json` as data (not by running Node against it)
- Detect likely package managers from lockfiles / `packageManager`
- Emit **installed** technology hints from package names only
- Write `.codetranslate/repository.json`
- Print a human summary, or `--json` for scripts

Not in Milestone A: AST parsing, symbols, import graphs, framework route detection, AI, or a web UI.

## Installation

```bash
git clone <repository-url>
cd code-translator
pnpm install
pnpm build
```

Node.js 22+ is required.

## Development

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm format
pnpm codetranslate inspect ./fixtures/next-basic
```

## CLI usage

```bash
pnpm codetranslate --help
pnpm codetranslate inspect ./fixtures/next-basic
pnpm codetranslate inspect ./fixtures/next-basic --json
pnpm codetranslate inspect ./fixtures/next-basic --debug
pnpm codetranslate inspect ./fixtures/next-basic --output ./tmp-out
```

`--json` writes the analysis document to stdout and still saves `.codetranslate/repository.json` unless `--output` is set. Progress text is suppressed on stdout in this mode.

Invalid paths exit non-zero with a readable error.

## Example output

```text
Code Translator

Scanning repository...
✓ 13 files discovered
✓ 12 files included
✓ 1 file ignored

Analyzing repository...
✓ classification, manifests, and package metadata complete

Repository:
  next-basic

File categories:
  Source           5
  Config           4
  Documentation    1
  Generated        1
  Asset            1

Languages:
  CSS              1
  JSON             2
  Markdown         1
  TSX              3
  TypeScript       2
  YAML             1

Package manager:
  pnpm

Installed technologies:
  Next.js
  React

Detected from package metadata only (status: installed).

Output:
  fixtures/next-basic/.codetranslate/repository.json

Analysis complete.
```

Exact counts depend on the repository. Technology lines mean “listed in package metadata”, not “this app uses Next.js at runtime”.

## Architecture

See [docs/architecture.md](docs/architecture.md) and [docs/codebase-ir.md](docs/codebase-ir.md).

```text
LocalRepositorySource → RepositorySnapshot → RepositoryAnalysis → CLI / JSON
```

Schema version: `0.1`.

## Security

See [SECURITY.md](SECURITY.md).

Repositories are untrusted. The scanner does not install dependencies, run scripts, evaluate config files, or print secrets.

## Roadmap

- **Milestone A (this release):** local scan, classification, manifests, IR JSON
- **Milestone B:** Tree-sitter parsing and symbol extraction
- Later: import/dependency graphs, framework detectors, optional AI explanations, web UI

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Apache License 2.0](LICENSE)
