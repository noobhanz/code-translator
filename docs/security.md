# Security notes

See the root [SECURITY.md](../SECURITY.md).

The tool never executes repository code. Analysis is static filesystem inspection, Tree-sitter parsing, and data-only reads of tsconfig/package manifests.

Hosted mode adds GitHub read-only access and PostgreSQL persistence of derived analysis, not of repository source. Tokens stay on the server. Temporary checkouts are deleted after analysis. Project records are scoped to the signed-in user. See [hosted.md](hosted.md).
