import fs from "node:fs/promises";
import path from "node:path";
import ignore from "ignore";
import { createDiagnostic, DiagnosticCode, type Diagnostic } from "@codetranslate/core";
import { DEFAULT_IGNORE_PATTERNS } from "./defaults";

export interface IgnoreMatcher {
  ignores(relativePath: string, isDirectory: boolean): boolean;
  patterns: string[];
}

export async function loadIgnoreMatcher(
  rootPath: string,
): Promise<{ matcher: IgnoreMatcher; diagnostics: Diagnostic[] }> {
  const diagnostics: Diagnostic[] = [];
  const patterns = [...DEFAULT_IGNORE_PATTERNS];
  const gitignorePath = path.join(rootPath, ".gitignore");
  const ig = ignore();
  ig.add([...DEFAULT_IGNORE_PATTERNS]);

  try {
    const contents = await fs.readFile(gitignorePath, "utf8");
    // Pass the file as a single string so `ignore` splits gitignore lines.
    ig.add(contents);
    patterns.push(contents);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      diagnostics.push(
        createDiagnostic(
          "warning",
          DiagnosticCode.GITIGNORE_READ_FAILED,
          "Could not read root .gitignore; continuing with default ignore rules.",
          ".gitignore",
        ),
      );
    }
  }

  return {
    matcher: {
      patterns,
      ignores(relativePath: string, isDirectory: boolean): boolean {
        if (relativePath === "") {
          return false;
        }
        const posix = relativePath.replaceAll("\\", "/");
        if (ig.ignores(posix)) {
          return true;
        }
        if (isDirectory && ig.ignores(`${posix}/`)) {
          return true;
        }
        return false;
      },
    },
    diagnostics,
  };
}
