# Codebase IR

Schema version: **`0.1`**

The Codebase IR is the versioned JSON document written to `.codetranslate/repository.json`. Zod schemas in `@codetranslate/core` are the runtime source of truth.

Schema evolution must bump `schemaVersion`. Do not silently change field meaning.

## RepositoryAnalysis

Top-level document.

| Field                  | Meaning                                           |
| ---------------------- | ------------------------------------------------- |
| `schemaVersion`        | Always `"0.1"` in Milestone A                     |
| `repository`           | Identity and source metadata                      |
| `files`                | Sorted `FileNode` list (POSIX relative paths)     |
| `manifests`            | Parsed or detected project manifests              |
| `detectedTechnologies` | Package-metadata hints with `status: "installed"` |
| `diagnostics`          | Non-fatal issues                                  |
| `statistics`           | Deterministic counts                              |
| `packageManager`       | Optional best-effort package manager name         |

Milestone A does not include symbols, ASTs, graph edges, routes, or AI explanations.

## RepositoryMetadata

| Field             | Meaning                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| `id`              | Deterministic `repo_` + SHA-256 prefix of the normalized absolute root path |
| `name`            | Directory basename                                                          |
| `source.type`     | `"local"`                                                                   |
| `source.path`     | Path supplied to the CLI                                                    |
| `rootPath`        | Resolved absolute POSIX path                                                |
| `analyzedAt`      | ISO-8601 timestamp (varies by run)                                          |
| `analyzerVersion` | Tool version, currently `0.1.0`                                             |

## FileNode

| Field          | Meaning                                                               |
| -------------- | --------------------------------------------------------------------- |
| `id`           | Deterministic `file_` + SHA-256 prefix of `repositoryId + ":" + path` |
| `path`         | Repository-relative POSIX path                                        |
| `extension`    | Last extension, lowercased, including the dot                         |
| `language`     | Optional extension/filename inference                                 |
| `category`     | See classification precedence in `docs/architecture.md`               |
| `sizeBytes`    | File size                                                             |
| `hash`         | SHA-256 of contents for included files; empty when unread             |
| `binary`       | Extension or byte-heuristic result                                    |
| `ignored`      | True when skipped from analysis                                       |
| `ignoreReason` | Optional human-readable reason                                        |

File contents are never serialized.

## ManifestSummary

Fully parsed:

- `package.json` — name, version, private, packageManager, script **names**, dependency **names**, engines

Detected but not deeply parsed:

- `pyproject.toml`, `requirements.txt`, `Cargo.toml`, `go.mod`, `Gemfile`, `composer.json`

Malformed `package.json` yields `MANIFEST_PARSE_FAILED` and does not abort the scan.

## BasicTechnologyDetection

Package names mapped to a display name. `status` is always `"installed"`. Presence in metadata is not evidence of runtime use.

## RepositoryStatistics

Counts of discovered / included / ignored files, binary files, bytes, and maps of category, language, and extension. Included files only contribute to category/language/extension counts.

## Diagnostic

```text
severity: info | warning | error
code: string
message: string
path?: string
```

Initial codes include `FILE_READ_FAILED`, `FILE_TOO_LARGE`, `REPOSITORY_FILE_LIMIT_REACHED`, `REPOSITORY_SIZE_LIMIT_REACHED`, `SENSITIVE_FILE_SKIPPED`, `BINARY_FILE_SKIPPED`, `MANIFEST_PARSE_FAILED`, `SYMLINK_SKIPPED`, `PERMISSION_DENIED`, `UNKNOWN_FILE_TYPE`, `PACKAGE_MANAGER_CONFLICT`, and `GITIGNORE_READ_FAILED`.
