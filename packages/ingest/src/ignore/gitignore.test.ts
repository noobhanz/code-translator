import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadIgnoreMatcher } from "./gitignore";

describe(".gitignore handling", () => {
  it("applies root gitignore patterns such as *.log and tmp/", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "codetranslate-ignore-"));
    await fs.writeFile(path.join(dir, ".gitignore"), "tmp/\n*.log\ncustom.txt\n", "utf8");

    const { matcher } = await loadIgnoreMatcher(dir);
    expect(matcher.ignores("debug.log", false)).toBe(true);
    expect(matcher.ignores("tmp", true)).toBe(true);
    expect(matcher.ignores("tmp/secret.txt", false)).toBe(true);
    expect(matcher.ignores("custom.txt", false)).toBe(true);
    expect(matcher.ignores("src/app.ts", false)).toBe(false);
  });
});
