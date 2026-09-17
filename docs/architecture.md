# Architecture

Code Translator is a small TypeScript monorepo. Milestone A discovers and classifies files. Milestone B parses JavaScript/TypeScript with Tree-sitter and extracts language-neutral symbols, imports, and exports.

It does not build graphs, resolve imports, call models, or ship a UI.

## Pipeline

```text
LocalRepositorySource
        ↓
RepositorySnapshot
        ↓
RepositoryAnalyzer
        │
        ├── manifest analysis
        │
        └── parser registry
                ↓
          LanguageAnalyzer
                ↓
           FileAnalysis
        ↓
RepositoryAnalysis
        ↓
CLI / JSON
```

The scanner never walks the filesystem during parsing. Parsers consume `SnapshotFile` records already discovered by ingest.

## Packages

| Package                 | Role                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| `@codetranslate/shared` | Path normalization, SHA-256, IDs, logger, scan constants              |
| `@codetranslate/core`   | Zod schemas, diagnostics, snapshot types, analysis assembly, JSON I/O |
| `@codetranslate/ingest` | Local source, ignore rules, classification, hashing, manifest parsing |
| `@codetranslate/parser` | Tree-sitter registry, JS/TS/JSX/TSX analyzers, symbol extraction      |
| `@codetranslate/cli`    | `codetranslate inspect` and `codetranslate symbols`                   |

Ingest remains responsible for filesystem, ignores, hashes, binary detection, and classification.

The parser is responsible for syntax trees, symbols, imports, exports, source ranges, and parse diagnostics. Tree-sitter nodes are internal and never serialized.

## Parser selection

A small in-process registry maps file extensions to analyzers:

- `.js` / `.mjs` / `.cjs` → JavaScript
- `.jsx` → JSX
- `.ts` → TypeScript
- `.tsx` → TSX

Unsupported languages stay in the IR without `analysis`. Binary, ignored, vendor, generated, asset, and documentation files are not parsed.

`next.config.ts` may be parsed as TypeScript source. It is never executed.

## Classification precedence

When multiple categories match:

```text
test > config > documentation > generated > vendor > source > asset > unknown
```

## Future boundaries (not implemented)

```text
graphs           import resolution, dependency / call graphs
detectors        framework routes, env usage, Prisma
AI               explanations, chat, embeddings
web UI           browser app, OAuth, uploads
```
