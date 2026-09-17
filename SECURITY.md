# Security

Code Translator treats every analyzed repository as **untrusted input**.

## What Milestone A does

Milestone A is static filesystem inspection only.

1. Repositories are treated as untrusted.
2. Repository code is never executed during normal analysis.
3. Lifecycle scripts are never run. The scanner does not invoke `npm install`, `pnpm install`, `yarn`, `npm run`, `pnpm run`, `node`, `npx`, `pip`, `python`, `cargo`, `make`, or repository shell scripts.
4. JavaScript/TypeScript configuration files such as `next.config.ts` are classified, never evaluated.
5. Sensitive files such as `.env`, `*.pem`, `*.key`, `id_rsa`, and `credentials.json` are skipped. Their contents are not read, hashed, printed, or written to `repository.json`.
6. Symlinks that leave the repository, and all other symlinks, are skipped.
7. File-size, repository-size, and file-count limits bound how much is read.

## What this tool is not

Code Translator is **not a security scanner**.

It does not hunt for leaked secrets beyond excluding obvious sensitive filenames. It does not sandbox third-party tools. It does not prove a repository is safe.

## Network and AI

Milestone A does not make network calls for AI, embeddings, or model inference.

Future AI features, if added, must transmit selected source content only when the user explicitly enables that behavior.

## Reporting vulnerabilities

Please open a GitHub issue or contact the maintainers privately if you find a vulnerability in the scanner itself (for example path traversal, symlink escape, or accidental execution of repository code).
