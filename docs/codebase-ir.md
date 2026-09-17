# Codebase IR

Schema version: **`0.3`**

The Codebase IR is the versioned JSON document written to `.codetranslate/repository.json`. Zod schemas in `@codetranslate/core` are the runtime source of truth.

Schema evolution must bump `schemaVersion`. Do not silently change field meaning.

## RepositoryAnalysis

Top-level document.

| Field                  | Meaning                                           |
| ---------------------- | ------------------------------------------------- |
| `schemaVersion`        | `"0.3"`                                           |
| `repository`           | Identity and source metadata                      |
| `files`                | Sorted `FileNode` list (POSIX relative paths)     |
| `manifests`            | Parsed or detected project manifests              |
| `detectedTechnologies` | Package-metadata hints with `status: "installed"` |
| `diagnostics`          | Non-fatal issues                                  |
| `statistics`           | Deterministic counts                              |
| `packageManager`       | Optional best-effort package manager name         |
| `resolutions`          | One record per import/re-export specifier         |
| `graph`                | File/package/builtin nodes and dependency edges   |
| `fileImportance`       | Structural scores, highest first                  |

Milestone C adds module resolution and a static dependency graph. It does not include call graphs, routes, or AI explanations.

## RepositoryMetadata

| Field             | Meaning                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| `id`              | Deterministic `repo_` + SHA-256 prefix of the normalized absolute root path |
| `name`            | Directory basename                                                          |
| `source.type`     | `"local"`                                                                   |
| `source.path`     | Path supplied to the CLI                                                    |
| `rootPath`        | Resolved absolute POSIX path                                                |
| `analyzedAt`      | ISO-8601 timestamp (varies by run)                                          |
| `analyzerVersion` | Tool version, currently `0.3.0`                                             |

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
| `analysis`     | Optional `FileAnalysis` for parsed JS/TS-family files                 |

File contents are never serialized. Raw Tree-sitter nodes are never serialized.

## FileAnalysis

| Field         | Meaning                                   |
| ------------- | ----------------------------------------- |
| `parser`      | `{ language, parserId }`                  |
| `symbols`     | `SymbolNode[]`, sorted by source location |
| `imports`     | `ImportDeclaration[]`                     |
| `exports`     | `ExportDeclaration[]`                     |
| `diagnostics` | Parse/syntax issues for this file         |
| `parse`       | `{ successful, hasSyntaxErrors }`         |

## SymbolNode

| Field           | Meaning                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `id`            | Deterministic `symbol_` + SHA-256 prefix of `repoId:fileId:kind:qualifiedName:startLine:startColumn`                      |
| `name`          | Display name. Anonymous default exports use `default`                                                                     |
| `qualifiedName` | Optional, e.g. `UserService.getUser`                                                                                      |
| `kind`          | `function` \| `class` \| `method` \| `variable` \| `constant` \| `interface` \| `type` \| `enum` \| `component` \| `hook` |
| `fileId`        | Owning file                                                                                                               |
| `location`      | 1-based line and 1-based column (`startLine/startColumn/endLine/endColumn`)                                               |
| `exported`      | True if this declaration is exported (including intra-file `export { name }`)                                             |
| `defaultExport` | True if this symbol is the file default export                                                                            |
| `async`         | Function/method async flag                                                                                                |
| `signature`     | Concise signature without the body                                                                                        |
| `documentation` | Adjacent JSDoc (`/** ... */`) when present                                                                                |
| `modifiers`     | Optional, e.g. `static`, `abstract`                                                                                       |
| `metadata`      | Optional `{ heuristic: true }` for component/hook classification                                                          |

## SourceLocation

Tree-sitter uses 0-based rows/columns internally. The IR converts at the parser boundary to **1-based lines and 1-based columns**.

## ImportDeclaration

| Field        | Meaning                                        |
| ------------ | ---------------------------------------------- |
| `id`         | Deterministic `import_` hash                   |
| `fileId`     | Owning file                                    |
| `source`     | Literal module specifier                       |
| `location`   | 1-based range                                  |
| `kind`       | `static` \| `dynamic` \| `require`             |
| `specifiers` | `default`, `named`, `namespace`, `side-effect` |

`imported` is the name in the module; `local` is the binding in this file.

## ExportDeclaration

| Field      | Meaning                                             |
| ---------- | --------------------------------------------------- |
| `id`       | Deterministic `export_` hash                        |
| `fileId`   | Owning file                                         |
| `location` | 1-based range                                       |
| `type`     | `named` \| `default` \| `re-export` \| `export-all` |
| `names`    | Exported names (`*` for export-all)                 |
| `source`   | Literal re-export module specifier if present       |

Re-export module specifiers are resolved in Milestone C. Symbol names inside those modules are not linked.

## ModuleResolution

| Field                | Meaning                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `id`                 | Deterministic `resolution_` hash of repo, importer, specifier, location                     |
| `importerFileId`     | Importing file                                                                              |
| `specifier`          | Literal module specifier                                                                    |
| `kind`               | `internal` \| `external` \| `builtin` \| `unresolved`                                       |
| `targetFileId`       | Internal file when resolved                                                                 |
| `packageName`        | Canonical npm name or `node:fs`-style builtin                                               |
| `resolutionStrategy` | `relative` \| `alias` \| `workspace` \| `package` \| `builtin` \| `baseUrl` \| `unresolved` |
| `confidence`         | 0–1                                                                                         |
| `candidates`         | Paths considered                                                                            |
| `evidence`           | Why this resolution was chosen                                                              |
| `sourceImportId`     | Originating import when applicable                                                          |
| `sourceExportId`     | Originating re-export when applicable                                                       |

Evidence `type` values: `exact-path`, `extension-probe`, `index-file`, `tsconfig-path`, `package-manifest`, `node-builtin`, `workspace-package`.

## GraphNode / GraphEdge

Graph node `type`: `file` \| `package` \| `builtin`.

File nodes reuse file IDs. Package nodes use `package:<name>`. Builtin nodes use `builtin:<canonical>`.

Edge `type`: `imports` \| `requires` \| `dynamic-imports` \| `re-exports`.

Each import declaration keeps its own edge (`sourceImportId`) so provenance is stable. Summaries may collapse labels.

## FileImportance

`score` is documented in `docs/architecture.md`. `reasons` lists the raw incoming/outgoing/export/symbol counts.

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

`statistics.sourceAnalysis` counts parsed files, symbols, imports, exports, syntax-error files, parse failures, and `symbolKindCounts`.

`statistics.dependencyGraph` counts graph nodes/edges by kind and unresolved imports.

## Diagnostic

```text
severity: info | warning | error
code: string
message: string
path?: string
```

Codes include prior issues plus `SOURCE_PARSE_FAILED`, `SOURCE_SYNTAX_ERROR`, `UNSUPPORTED_PARSER_LANGUAGE`, `SOURCE_READ_FAILED`, `SOURCE_TOO_LARGE_FOR_PARSER`, `IMPORT_UNRESOLVED`, `IMPORT_RESOLUTION_AMBIGUOUS`, `TSCONFIG_PARSE_FAILED`, `TSCONFIG_PATH_INVALID`, and `WORKSPACE_MANIFEST_PARSE_FAILED`.

Bare package imports are **external**, not unresolved, even when `node_modules` is absent.

`UNSUPPORTED_PARSER_LANGUAGE` is not emitted for ordinary CSS/Markdown/image files.
