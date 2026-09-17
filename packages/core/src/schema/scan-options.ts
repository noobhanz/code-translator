import { z } from "zod";
import {
  DEFAULT_CONCURRENCY,
  DEFAULT_MAX_FILE_BYTES,
  DEFAULT_MAX_FILES,
  DEFAULT_MAX_REPOSITORY_BYTES,
} from "@codetranslate/shared";

export const scanOptionsSchema = z.object({
  maxFileBytes: z.number().int().positive().default(DEFAULT_MAX_FILE_BYTES),
  maxRepositoryBytes: z.number().int().positive().default(DEFAULT_MAX_REPOSITORY_BYTES),
  maxFiles: z.number().int().positive().default(DEFAULT_MAX_FILES),
  concurrency: z.number().int().positive().default(DEFAULT_CONCURRENCY),
});

export type ScanOptions = z.infer<typeof scanOptionsSchema>;

export const DEFAULT_SCAN_OPTIONS: ScanOptions = scanOptionsSchema.parse({});
