# Architecture

Code Translator is a small TypeScript monorepo.

- Milestone A discovers and classifies files.
- Milestone B parses JavaScript/TypeScript with Tree-sitter.
- Milestone C resolves module specifiers and builds a static dependency graph.
- Milestone D detects application structure and presents it in `understand` and a small web UI.
- Milestone E adds a hosted convenience layer: GitHub login, saved apps, and analysis history.

It does not call models or execute repository code.

## Pipeline

```text
Repository
        ↓
Filesystem analysis
        ↓
Source parsing
        ↓
Symbols / imports / exports
        ↓
Module resolution
        ↓
Dependency graph
        ↓
Application detection
        ↓
ApplicationModel
        ↓
Understand CLI / local web / hosted GitHub apps
```

The graph package never walks the filesystem and never reparses source. It consumes file records, `FileAnalysis` imports/exports, and config/manifest data.

## Packages

| Package                      | Role                                                                  |
| ---------------------------- | --------------------------------------------------------------------- |
| `@codetranslate/shared`      | Path normalization, SHA-256, IDs, logger, scan constants              |
| `@codetranslate/core`        | Zod schemas, diagnostics, snapshot types, analysis assembly, JSON I/O |
| `@codetranslate/ingest`      | Local source, ignore rules, classification, hashing, manifest parsing |
| `@codetranslate/parser`      | Tree-sitter registry, JS/TS/JSX/TSX analyzers, symbol extraction      |
| `@codetranslate/graph`       | Module resolution, dependency graph, structural importance            |
| `@codetranslate/application` | Framework, page, area, and service detection for humans               |
| `@codetranslate/hosted`      | GitHub access, persistence, and hosted analysis orchestration         |
| `@codetranslate/cli`         | `understand`, `inspect`, `symbols`, `dependencies`, `graph`           |
| `@codetranslate/web`         | Local UI and hosted GitHub product                                    |

Ownership:

```text
ingest       → filesystem facts
parser       → syntax facts
graph        → cross-file/module relationships
application  → human-recognizable application structure
hosted       → accounts, GitHub, saved apps (depends on engine, never the reverse)
core         → schemas and analysis assembly
```

The hosted package may call the engine. The engine must not import hosted auth, Prisma, or GitHub APIs.

See [docs/hosted.md](hosted.md) for the local vs hosted split.

## Module resolution

The graph is a **source graph**: statically declared module dependencies. It is not a runtime, call, or data-flow graph.

Precedence:

1. Relative specifiers (`./`, `../`)
2. `tsconfig.json` / `jsconfig.json` `paths` aliases
3. Node.js builtins (`fs`, `node:fs`, …)
4. Workspace package names
5. `baseUrl` internal files, only when the specifier is not a known package.json dependency
6. Bare specifiers → external packages (even without `node_modules`)
7. Unresolved (failed relative/alias lookups)

Extension probe order:

```text
.ts .tsx .js .jsx .mts .cts .mjs .cjs
```

Then `index` files with the same order. Specifiers with an explicit extension use that path first and do not remap `.js` → `.ts`.

Builtin names are stored as `node:fs` even when the source wrote `fs`.

## Application detection

Detectors consume `RepositoryAnalysis` only. They do not walk the filesystem or parse source.

Human-facing confidence:

```text
>= 0.85 high
>= 0.60 medium
< 0.60 low
```

`understand` and the web UI hide detections below 0.55.

## Structural importance

`fileImportance.score` is a normalized mix of unique incoming neighbors (0.60), unique outgoing neighbors (0.15), export count (0.15), and symbol count (0.10). It is graph centrality, not business or architectural importance.

## Future boundaries (not implemented)

```text
call graphs      symbol references, function calls
AI               explanations, chat, embeddings
webhooks         automatic GitHub sync
billing          paid plans
change summaries human-readable history diffs
```
