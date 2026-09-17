import fs from "node:fs/promises";
import path from "node:path";
import { OUTPUT_DIR_NAME, OUTPUT_FILE_NAME } from "@codetranslate/shared";
import type { RepositoryAnalysis } from "../schema/analysis";
import { serializeAnalysis } from "./serialize";

export async function resolveOutputFilePath(
  repositoryRoot: string,
  outputOption?: string,
): Promise<string> {
  if (!outputOption) {
    return path.join(repositoryRoot, OUTPUT_DIR_NAME, OUTPUT_FILE_NAME);
  }

  const resolved = path.resolve(outputOption);
  try {
    const stat = await fs.stat(resolved);
    if (stat.isDirectory()) {
      return path.join(resolved, OUTPUT_FILE_NAME);
    }
  } catch {
    // Path does not exist yet. If it has no extension, treat it as a directory.
  }

  if (path.extname(resolved) === "") {
    return path.join(resolved, OUTPUT_FILE_NAME);
  }

  return resolved;
}

export async function writeRepositoryAnalysis(
  analysis: RepositoryAnalysis,
  outputFilePath: string,
): Promise<void> {
  await fs.mkdir(path.dirname(outputFilePath), { recursive: true });
  await fs.writeFile(outputFilePath, serializeAnalysis(analysis), "utf8");
}
