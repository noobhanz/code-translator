import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { safeRemove, withTempDirectory } from "./checkout";

describe("temporary checkout cleanup", () => {
  it("removes the directory after success", async () => {
    let created = "";
    await withTempDirectory(async (rootPath) => {
      created = rootPath;
      await fs.writeFile(path.join(rootPath, "file.txt"), "ok");
      expect((await fs.stat(rootPath)).isDirectory()).toBe(true);
    });
    await expect(fs.stat(created)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("removes the directory after failure", async () => {
    let created = "";
    await expect(
      withTempDirectory(async (rootPath) => {
        created = rootPath;
        await fs.writeFile(path.join(rootPath, "file.txt"), "ok");
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    await expect(fs.stat(created)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("safeRemove is idempotent", async () => {
    await withTempDirectory(async (rootPath) => {
      await safeRemove(rootPath);
      await safeRemove(rootPath);
    });
  });
});
