# Code Translator

Understand the app you built.

Code Translator analyzes a software project and turns its structure into
a simple overview of what the application contains and how the main parts
fit together.

Analysis happens locally using static code analysis.

```bash
pnpm install
pnpm codetranslate understand ./my-project
pnpm web
```

A hosted version can connect GitHub, save apps, and keep history. The engine stays open source either way. See [docs/hosted.md](docs/hosted.md).

It has been vibe coded, to help vibe coders understand what they are actually shipping.

## Why

Most “explain this repo” tools jump straight to a model. That skips the boring work that actually makes explanations trustworthy: what files exist, which ones are source, which package manager is in play, and what the manifests claim is installed.

Milestone A is the scanner. Milestone B parses JavaScript and TypeScript. Milestone C builds a dependency graph. Milestone D turns that into an application overview. Milestone E adds hosted GitHub apps and history. The tool never executes repository code.

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
- Parse JavaScript, TypeScript, JSX, and TSX with Tree-sitter
- Extract functions, classes, methods, types, constants, components, and hooks
- Extract imports and exports
- Resolve relative, alias, builtin, workspace, and package specifiers
- Build a file-to-file and file-to-package dependency graph
- Rank files by simple structural importance
- Detect Next.js, React, Vite, and Express structure
- Identify pages, API routes, and application areas such as Accounts, Payments, AI, and Data
- Write `.codetranslate/repository.json`
- Explain a project with `understand`, or inspect symbols/dependencies as a developer
- Optionally connect GitHub, save apps, and keep analysis history in hosted mode

Not yet implemented: TypeScript semantic checking, call graphs, runtime tracing, or AI-written explanations.

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

Local web UI (no database, no GitHub auth):

```bash
pnpm web
```

Hosted mode is documented in [docs/hosted.md](docs/hosted.md).

## CLI usage

```bash
pnpm codetranslate understand ./my-project
pnpm web
```

Developer commands:

```bash
pnpm codetranslate --help
pnpm codetranslate inspect ./fixtures/next-basic
pnpm codetranslate inspect ./fixtures/next-basic --json
pnpm codetranslate inspect ./fixtures/next-basic --debug
pnpm codetranslate inspect ./fixtures/next-basic --output ./tmp-out
pnpm codetranslate symbols ./fixtures/next-basic
pnpm codetranslate symbols ./fixtures/next-basic --json
pnpm codetranslate dependencies ./fixtures/next-basic
pnpm codetranslate graph ./fixtures/next-basic
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

Source analysis:
  Parsed files     5
  Symbols          10
  Imports          7
  Exports          6
  Syntax warnings  0

Dependency analysis:
  Internal deps    3
  External deps    2
  Built-in deps    0
  Unresolved       0

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
Repository → files → syntax → graph → application model → understand / web
```

Schema version: `0.4`.

## Security

See [SECURITY.md](SECURITY.md).

Repositories are untrusted. The scanner does not install dependencies, run scripts, evaluate config files, or print secrets. JavaScript and TypeScript are parsed as text, never executed.

## Roadmap

- **Milestone A:** local scan, classification, manifests, IR JSON
- **Milestone B:** Tree-sitter JS/TS parsing and symbol extraction
- **Milestone C:** module resolution and dependency graph
- **Milestone D:** application overview, `understand`, and a small web UI
- **Milestone E (this release):** hosted GitHub apps, saved overviews, and history
- Later: automatic GitHub sync and human-readable change summaries

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Apache License 2.0](LICENSE)
