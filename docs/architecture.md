# Architecture

Code Translator is built as a small TypeScript monorepo. Milestone A implements repository ingest and a versioned Codebase IR. It does not parse source, build graphs, call models, or ship a UI.

## Pipeline

```text
Local directory
      ↓
LocalRepositorySource
      ↓
RepositorySnapshot
      ↓
RepositoryAnalyzer (manifests, technologies, statistics)
      ↓
RepositoryAnalysis / Codebase IR
      ↓
CLI + .codetranslate/repository.json
```

The scanner is not coupled to future AI or UI consumers. Those will read `RepositoryAnalysis`, not walk the filesystem themselves.

## Packages

| Package                 | Role                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| `@codetranslate/shared` | Path normalization, SHA-256, IDs, logger, scan constants              |
| `@codetranslate/core`   | Zod schemas, diagnostics, snapshot types, analysis assembly, JSON I/O |
| `@codetranslate/ingest` | Local source, ignore rules, classification, hashing, manifest parsing |
| `@codetranslate/cli`    | `codetranslate inspect`                                               |

## Local repository source

`LocalRepositorySource` implements `RepositorySource.getSnapshot()`. Later sources (Git, GitHub, ZIP, paste, IDE) should produce the same `RepositorySnapshot` so core analysis stays unchanged.

Snapshot files store path, size, hash, category, language, and binary flags. They do not store file contents. `snapshot.readText(path)` is the only content access, and only for included non-binary files.

## Ignore and safety

Ignore matching uses the `ignore` package (gitignore semantics) plus internal defaults:

`.git`, `node_modules`, `.next`, `dist`, `build`, `coverage`, `.cache`, `.turbo`, `.vercel`, `target`, `__pycache__`, `.codetranslate`, `vendor`, `.generated`

Root `.gitignore` is loaded in addition to those defaults. `.codetranslate/` is always ignored so the tool cannot scan its own output.

## Classification precedence

When multiple categories match:

```text
test > config > documentation > generated > vendor > source > asset > unknown
```

Lockfiles are generated, not source. `next.config.ts` is config and is never executed.

## Future boundaries (not implemented)

```text
parsers          Tree-sitter, symbols, imports
graphs           dependency / call graphs
detectors        framework routes, env usage, Prisma
AI               explanations, chat, embeddings
web UI           browser app, OAuth, uploads
```

Milestone A stops at structured repository metadata.
