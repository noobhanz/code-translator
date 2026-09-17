import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sha256Hex } from "@codetranslate/shared";
import { hashFileContents } from "./file-hash";

describe("file hashing", () => {
  it("hashes file contents with SHA-256 stably", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "codetranslate-hash-"));
    const filePath = path.join(dir, "a.txt");
    await fs.writeFile(filePath, "hello", "utf8");

    const first = await hashFileContents(filePath);
    const second = await hashFileContents(filePath);
    expect(first).toBe(second);
    expect(first).toBe(sha256Hex("hello"));
  });
});
