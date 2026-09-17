import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { inspectRepository } from "../inspect";
import { loadIgnoreMatcher } from "../ignore/gitignore";
import { walkRepository } from "./walk";
import { DEFAULT_IGNORE_PATTERNS } from "../ignore/defaults";

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../fixtures");

describe("directory walking and ignore rules", () => {
  it("includes default ignore patterns", () => {
    expect(DEFAULT_IGNORE_PATTERNS).toEqual(
      expect.arrayContaining([
        ".git/",
        "node_modules/",
        ".next/",
        "dist/",
        "build/",
        "coverage/",
        ".cache/",
        ".turbo/",
        ".vercel/",
        "target/",
        "__pycache__/",
        ".codetranslate/",
      ]),
    );
  });

  it("does not recurse into node_modules, dist, or .codetranslate", async () => {
    const root = path.join(fixtures, "ignored-files");
    const { matcher } = await loadIgnoreMatcher(root);
    const walked = await walkRepository(root, matcher, 20_000);

    const paths = walked.files.map((file) => file.path);
    const included = walked.files.filter((file) => !file.ignored).map((file) => file.path);
    expect(paths).toContain("src/app.ts");
    expect(paths).toContain("keep.txt");
    expect(paths.some((item) => item.startsWith("node_modules/"))).toBe(false);
    expect(paths.some((item) => item.startsWith("dist/"))).toBe(false);
    expect(paths.some((item) => item.startsWith(".codetranslate/"))).toBe(false);
    expect(paths.some((item) => item.startsWith("tmp/"))).toBe(false);
    expect(walked.files.find((file) => file.path === "custom-ignored.txt")?.ignored).toBe(true);
    expect(included).not.toContain("custom-ignored.txt");
    expect(included).toContain("src/app.ts");
  });

  it("produces stable sorted paths", async () => {
    const { analysis } = await inspectRepository(path.join(fixtures, "mixed-files"));
    const paths = analysis.files.map((file) => file.path);
    expect(paths).toEqual([...paths].sort((a, b) => a.localeCompare(b)));
  });
});
