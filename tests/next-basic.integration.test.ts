import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseAnalysisJson, serializeAnalysis } from "@codetranslate/core";
import { inspectRepository } from "@codetranslate/ingest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = path.join(root, "fixtures/next-basic");

describe("inspect fixtures/next-basic", () => {
  it("produces a stable, relative, package-metadata-aware analysis", async () => {
    const { analysis } = await inspectRepository(fixture);

    expect(analysis.schemaVersion).toBe("0.2");
    expect(analysis.repository.name).toBe("next-basic");
    expect(analysis.repository.id.startsWith("repo_")).toBe(true);

    const included = analysis.files.filter((file) => !file.ignored);
    expect(included.some((file) => file.path === "package.json")).toBe(true);
    expect(included.some((file) => file.path === "app/page.tsx")).toBe(true);
    expect(included.every((file) => !file.path.includes("\\"))).toBe(true);
    expect(included.every((file) => !path.isAbsolute(file.path))).toBe(true);
    expect(included.every((file) => !file.path.startsWith("node_modules"))).toBe(true);

    const debugLog = analysis.files.find((file) => file.path === "debug.log");
    expect(debugLog?.ignored).toBe(true);

    expect(analysis.statistics.languageCounts.TSX).toBe(3);
    expect(analysis.statistics.languageCounts.TypeScript).toBe(2);
    expect(analysis.statistics.languageCounts.CSS).toBe(1);
    expect(analysis.statistics.languageCounts.JSON).toBe(2);
    expect(analysis.statistics.languageCounts.Markdown).toBe(1);

    expect(analysis.packageManager).toBe("pnpm");

    const names = analysis.detectedTechnologies.map((tech) => tech.name);
    expect(names).toEqual(expect.arrayContaining(["Next.js", "React"]));
    expect(analysis.detectedTechnologies.every((tech) => tech.status === "installed")).toBe(true);

    const pkg = analysis.manifests.find((manifest) => manifest.type === "package.json");
    expect(pkg && "name" in pkg ? pkg.name : undefined).toBe("next-basic");
    expect(pkg && "scripts" in pkg ? pkg.scripts : []).toEqual(
      expect.arrayContaining(["dev", "build"]),
    );

    const json = serializeAnalysis(analysis);
    const parsed = parseAnalysisJson(json);
    expect(parsed.files.map((file) => file.path)).toEqual(analysis.files.map((file) => file.path));

    const welcome = analysis.files.find((file) => file.path === "components/WelcomeCard.tsx");
    expect(welcome?.analysis?.symbols).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "WelcomeCard", kind: "component", exported: true }),
      ]),
    );
    expect(json).not.toContain("treeSitter");
    expect(json).not.toContain("nodeType");
  });

  it("marks binary fixture files as binary", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/binary-files"));
    expect(analysis.files.find((file) => file.path === "pixel.png")?.binary).toBe(true);
    expect(analysis.files.find((file) => file.path === "document.pdf")?.binary).toBe(true);
    expect(analysis.files.find((file) => file.path === "nulls.bin")?.binary).toBe(true);
    expect(analysis.files.find((file) => file.path === "disguised.txt")?.binary).toBe(true);
    expect(analysis.files.find((file) => file.path === "readme.txt")?.binary).toBe(false);
  });

  it("infers mixed-file languages", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/mixed-files"));
    const languageByPath = Object.fromEntries(
      analysis.files.map((file) => [file.path, file.language]),
    );
    expect(languageByPath["hello.ts"]).toBe("TypeScript");
    expect(languageByPath["hello.py"]).toBe("Python");
    expect(languageByPath["main.rs"]).toBe("Rust");
    expect(languageByPath["README.md"]).toBe("Markdown");
    expect(languageByPath["data.json"]).toBe("JSON");
    expect(languageByPath["styles.css"]).toBe("CSS");
  });

  it("writes pretty JSON that can be parsed back", async () => {
    const { analysis } = await inspectRepository(fixture);
    const serialized = serializeAnalysis(analysis);
    const tmp = path.join(os.tmpdir(), `codetranslate-analysis-${Date.now()}.json`);
    await fs.writeFile(tmp, serialized, "utf8");
    const raw = await fs.readFile(tmp, "utf8");
    const parsed = parseAnalysisJson(raw);
    expect(parsed.repository.name).toBe("next-basic");
    await fs.unlink(tmp);
  });
});
