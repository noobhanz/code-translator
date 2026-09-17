export const SCHEMA_VERSION = "0.4" as const;

export const ANALYZER_VERSION = "0.4.0";

export const OUTPUT_DIR_NAME = ".codetranslate";

export const OUTPUT_FILE_NAME = "repository.json";

export const DEFAULT_MAX_FILE_BYTES = 2 * 1024 * 1024;

export const DEFAULT_MAX_REPOSITORY_BYTES = 100 * 1024 * 1024;

export const DEFAULT_MAX_FILES = 20_000;

export const DEFAULT_CONCURRENCY = 16;

export const BINARY_PEEK_BYTES = 8_192;

export const DEFAULT_MAX_PARSER_FILE_BYTES = 1_000_000;

/** Anonymous default exports use this stable display name. */
export const DEFAULT_EXPORT_DISPLAY_NAME = "default";
