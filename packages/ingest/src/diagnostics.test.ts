import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DiagnosticCode } from "@codetranslate/core";
import { fileURLToPath } from "node:url";
import { inspectRepository } from "./inspect";

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../fixtures");

describe("diagnostic generation", () => {
  it("emits MANIFEST_PARSE_FAILED for invalid package.json and continues", async () => {
    const { analysis } = await inspectRepository(path.join(fixtures, "malformed-manifest"));
    expect(analysis.diagnostics.some((d) => d.code === DiagnosticCode.MANIFEST_PARSE_FAILED)).toBe(
      true,
    );
    expect(analysis.files.some((file) => file.path === "src/index.ts" && !file.ignored)).toBe(true);
  });

  it("emits SENSITIVE_FILE_SKIPPED and does not hash secrets", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "codetranslate-secret-"));
    await fs.writeFile(path.join(dir, "app.ts"), "export const x = 1;\n", "utf8");
    await fs.writeFile(path.join(dir, ".env"), "SECRET=should-not-be-read\n", "utf8");

    const { analysis } = await inspectRepository(dir);
    const env = analysis.files.find((file) => file.path === ".env");
    expect(env?.ignored).toBe(true);
    expect(env?.hash).toBe("");
    expect(analysis.diagnostics.some((d) => d.code === DiagnosticCode.SENSITIVE_FILE_SKIPPED)).toBe(
      true,
    );
    expect(JSON.stringify(analysis)).not.toContain("should-not-be-read");
  });

  it("emits FILE_TOO_LARGE when a file exceeds the limit", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "codetranslate-limit-"));
    await fs.writeFile(path.join(dir, "tiny.ts"), "export const ok = true;\n");
    await fs.writeFile(path.join(dir, "big.ts"), "x".repeat(200));

    const { analysis } = await inspectRepository(dir, { maxFileBytes: 50 });
    expect(analysis.diagnostics.some((d) => d.code === DiagnosticCode.FILE_TOO_LARGE)).toBe(true);
    expect(analysis.files.find((file) => file.path === "big.ts")?.ignored).toBe(true);
    expect(analysis.files.find((file) => file.path === "tiny.ts")?.ignored).toBe(false);
  });
});
