# Contributing

Thank you for helping with Code Translator.

## Requirements

- Node.js 22+
- pnpm 10+

## Setup

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Run the scanner:

```bash
pnpm codetranslate --help
pnpm codetranslate inspect ./fixtures/next-basic
```

## Layout

- `packages/shared` — primitives
- `packages/core` — Codebase IR schemas and analysis assembly
- `packages/ingest` — filesystem snapshotting and classification
- `packages/application` — human-recognizable application structure
- `packages/hosted` — GitHub connection and hosted persistence
- `apps/cli` — CLI
- `apps/web` — local UI and hosted product
- `fixtures/` — tiny repositories used by tests
- `docs/` — architecture and IR notes

## Testing

Prefer fixture-based tests over mocks of the filesystem.

- Unit tests live next to the code they cover (`*.test.ts`)
- Integration tests live in `tests/`
- Do not install fixture dependencies
- Do not execute fixture scripts
- Do not assert on `analyzedAt` or host-specific absolute paths unless you normalize them

```bash
pnpm test
```

## Style

```bash
pnpm lint
pnpm format
```

Keep changes boring, deterministic, and scoped. Milestone A must remain a static scanner: never execute repository code.

## Pull requests

1. Add or update tests for the behavior you change.
2. Keep `schemaVersion` compatibility in mind. If the IR changes, update `docs/codebase-ir.md`.
3. Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` before opening a PR.
