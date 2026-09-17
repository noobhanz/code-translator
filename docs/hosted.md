# Hosted Code Translator

The analysis engine is open source. The hosted product is a convenience layer on top of the same engine:

```text
GitHub repository
        ↓
temporary checkout
        ↓
EXISTING ANALYZER
        ↓
ApplicationModel
        ↓
PostgreSQL
        ↓
Your apps
```

Open-source packages never import `@codetranslate/hosted`.

## Local vs hosted

| | Local / self-hosted | Hosted |
| --- | --- | --- |
| Command | `pnpm web` | `HOSTED_MODE=true pnpm web` |
| Account | None | Continue with GitHub |
| Input | Local path | GitHub apps the user grants |
| Persistence | In-memory / this session | PostgreSQL |
| Database | Not required | Required |
| OAuth | Not required | Required |

Local mode still works without GitHub credentials or PostgreSQL.

## What hosted stores

Persisted:

- GitHub user identity (`id`, login, name, avatar)
- App metadata (owner, repo, visibility, default branch)
- Commit SHA for each analysis
- `analyzerVersion` / `schemaVersion`
- `ApplicationModel` JSON
- optional sanitized `RepositoryAnalysis` JSON (no checkout path, no file contents)

Not persisted:

- cloned repository source
- temporary checkout directories
- GitHub tokens in logs or client responses

GitHub access tokens live in the Auth.js `Account` table on the server. They are never sent to the browser.

## Auth and GitHub access

GitHub login uses Auth.js with the GitHub provider. Identity uses `read:user`.

Repository access is designed around a **GitHub App** with:

- Contents: Read
- Metadata: Read

No write, issue, pull request, workflow, or admin permissions.

After login, if the app is not installed, the user is asked to choose which apps Code Translator can access.

## Analysis lifecycle

1. User selects a GitHub repository.
2. Hosted creates a `Project` (or reuses the same user + repo).
3. Hosted resolves the default-branch commit SHA.
4. If a completed `AnalysisRun` already exists for `projectId + commitSha + analyzerVersion`, it is reused.
5. Otherwise hosted downloads a tarball (not a git clone with scripts), extracts it to a temp directory, and calls `inspectRepository`.
6. Source is deleted after success or failure.
7. The new run is stored. The project points at the latest completed run.

`Check for changes` repeats steps 3–7. If the SHA is unchanged, the user sees “Your app is already up to date.”

## Development setup

1. Create a GitHub OAuth app or GitHub App.
   - Homepage URL: `http://localhost:3000`
   - Callback: `http://localhost:3000/api/auth/callback/github`
   - GitHub App permissions: Contents read, Metadata read.
2. Copy `.env.example` to `.env` and fill in credentials.
3. Optional database:

```bash
docker compose up -d
pnpm db:generate
pnpm db:migrate
```

4. Start hosted mode:

```bash
HOSTED_MODE=true pnpm web
```

If you already exported `HOSTED_MODE` and `DATABASE_URL` in `.env`, `pnpm web` is enough — Next.js loads `apps/web/.env.local` or the process environment.

Put secrets in `apps/web/.env.local` (gitignored) so the Next.js app can read them:

```text
HOSTED_MODE=true
DATABASE_URL=postgresql://codetranslate:codetranslate@localhost:5432/codetranslate
AUTH_SECRET=...
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
```

Prisma migrations run from `packages/hosted` and also need `DATABASE_URL` in the environment.

## Security

- Analysis is still static. Repository code is never executed. Dependencies are never installed.
- Temporary directories use `os.tmpdir()` and are removed in `finally`.
- Project lookups are always scoped to the signed-in user. Missing and other-user projects both return “We couldn't find that app.”
- Tokens are redacted before error responses.

## Known limitations

- No automatic GitHub webhooks yet
- No semantic change summaries yet
- No AI explanations yet
- No billing yet
- No teams
