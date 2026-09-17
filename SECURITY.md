# Security

Code Translator treats every analyzed repository as **untrusted input**.

## What the tool does

Analysis is static. Milestone A inspects the filesystem. Milestone B parses JavaScript/TypeScript with Tree-sitter.

1. Repositories are treated as untrusted.
2. Repository code is never executed during normal analysis.
3. Lifecycle scripts are never run. The scanner does not invoke `npm install`, `pnpm install`, `yarn`, `npm run`, `pnpm run`, `node`, `npx`, `pip`, `python`, `cargo`, `make`, or repository shell scripts.
4. JavaScript/TypeScript configuration files such as `next.config.ts` may be parsed as text. They are never evaluated, imported, or run through `ts-node` / Babel / ESLint. `tsconfig.json`, `jsconfig.json`, `package.json`, and `pnpm-workspace.yaml` are read as data (JSON/JSONC/YAML text) only.
5. The parser does not `eval`, `new Function`, `import()`, or `require()` repository source. `import`/`require` in analyzed files are syntax only.
6. Only Code Translator's own Tree-sitter grammars are used. Repository-installed grammars are ignored.
7. Sensitive files such as `.env`, `*.pem`, `*.key`, `id_rsa`, and `credentials.json` are skipped. Their contents are not read, hashed, printed, or written to `repository.json`.
8. Symlinks that leave the repository, and all other symlinks, are skipped.
9. File-size, repository-size, file-count, and parser-size limits bound how much is read.

## What this tool is not

Code Translator is **not a security scanner**.

It does not hunt for leaked secrets beyond excluding obvious sensitive filenames. It does not sandbox third-party tools. It does not prove a repository is safe.

## Hosted mode

When `HOSTED_MODE=true`, Code Translator may fetch a GitHub repository the signed-in user granted, using a read-only token. That source is written to a temporary directory, analyzed with the same static engine, and deleted afterward. File contents are not stored. GitHub tokens are not logged or returned to the browser.

See [docs/hosted.md](docs/hosted.md) and [docs/security.md](docs/security.md).

## Network and AI

The open-source engine does not make network calls for AI, embeddings, or model inference.

Future AI features, if added, must transmit selected source content only when the user explicitly enables that behavior.

## Reporting vulnerabilities

Please open a GitHub issue or contact the maintainers privately if you find a vulnerability in the scanner itself (for example path traversal, symlink escape, or accidental execution of repository code).
