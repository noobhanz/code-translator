import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseAnalysisJson } from "@codetranslate/core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "apps/cli/src/index.ts");

function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const tsxCli = path.join(root, "node_modules/tsx/dist/cli.mjs");
    const child = spawn(process.execPath, [tsxCli, cli, ...args], {
      cwd: root,
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ stdout, stderr, code: code ?? 1 });
    });
  });
}

describe("CLI", () => {
  it("prints help", async () => {
    const result = await runCli(["--help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Code Translator");
    expect(result.stdout).toContain("inspect");
    expect(result.stdout).toContain("symbols");
    expect(result.stdout).toContain("dependencies");
    expect(result.stdout).toContain("graph");
    expect(result.stdout).toContain("--debug");
    expect(result.stdout).toContain("--json");
    expect(result.stdout).toContain("--output");
  });

  it("inspects next-basic and writes JSON to stdout in --json mode", async () => {
    const result = await runCli(["inspect", "./fixtures/next-basic", "--json"]);
    expect(result.code).toBe(0);
    expect(result.stdout.trim().startsWith("{")).toBe(true);
    const analysis = parseAnalysisJson(result.stdout);
    expect(analysis.repository.name).toBe("next-basic");
    expect(analysis.detectedTechnologies.some((tech) => tech.name === "Next.js")).toBe(true);
  });

  it("lists symbols for next-basic", async () => {
    const result = await runCli(["symbols", "./fixtures/next-basic"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("WelcomeCard");
    expect(result.stdout).toContain("component");
  });

  it("fails with a readable error for a missing path", async () => {
    const result = await runCli(["inspect", "./does-not-exist"]);
    expect(result.code).not.toBe(0);
    expect(result.stderr.toLowerCase()).toContain("does not exist");
  });
});
