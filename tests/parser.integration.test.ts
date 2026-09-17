import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DiagnosticCode } from "@codetranslate/core";
import { inspectRepository } from "@codetranslate/ingest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("parser fixtures", () => {
  it("extracts javascript symbols, imports, and requires", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/parser-javascript"));
    const hello = analysis.files.find((file) => file.path === "src/hello.js")?.analysis;
    expect(hello?.parse.successful).toBe(true);
    expect(hello?.symbols).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "hello", kind: "function", exported: true }),
        expect.objectContaining({ name: "add", kind: "function", exported: true }),
        expect.objectContaining({ name: "UserService", kind: "class" }),
      ]),
    );
    expect(hello?.imports.some((item) => item.kind === "require")).toBe(true);
    expect(analysis.statistics.sourceAnalysis.parsedFiles).toBeGreaterThan(0);
  });

  it("extracts typescript kinds and signatures", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/parser-typescript"));
    const user = analysis.files.find((file) => file.path === "src/user.ts")?.analysis;
    expect(user?.symbols).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "User", kind: "interface" }),
        expect.objectContaining({ name: "UserId", kind: "type" }),
        expect.objectContaining({ name: "Status", kind: "enum" }),
        expect.objectContaining({ name: "DEFAULT_LIMIT", kind: "constant" }),
        expect.objectContaining({ name: "getUser", kind: "function", async: true }),
        expect.objectContaining({ name: "UserService", kind: "class", defaultExport: true }),
      ]),
    );
    expect(user?.exports.some((item) => item.type === "re-export")).toBe(true);
    expect(user?.exports.some((item) => item.type === "export-all")).toBe(true);
  });

  it("detects react components and hooks", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/parser-react"));
    const ui = analysis.files.find((file) => file.path === "src/ui.tsx")?.analysis;
    expect(ui?.symbols).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Button", kind: "component" }),
        expect.objectContaining({ name: "WelcomeCard", kind: "component" }),
        expect.objectContaining({ name: "useCounter", kind: "hook" }),
        expect.objectContaining({ name: "UserService", kind: "function" }),
      ]),
    );
  });

  it("does not crash on malformed source and records syntax diagnostics", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/parser-broken"));
    expect(analysis.files.some((file) => file.path === "src/ok.ts" && !file.ignored)).toBe(true);
    const broken = analysis.files.find((file) => file.path === "src/broken.ts")?.analysis;
    expect(broken?.parse.hasSyntaxErrors).toBe(true);
    expect(broken?.diagnostics.some((d) => d.code === DiagnosticCode.SOURCE_SYNTAX_ERROR)).toBe(
      true,
    );
  });

  it("keeps symbol IDs stable across runs", async () => {
    const fixture = path.join(root, "fixtures/parser-typescript");
    const first = await inspectRepository(fixture);
    const second = await inspectRepository(fixture);
    const firstIds = first.analysis.files.flatMap((file) =>
      (file.analysis?.symbols ?? []).map((symbol) => symbol.id),
    );
    const secondIds = second.analysis.files.flatMap((file) =>
      (file.analysis?.symbols ?? []).map((symbol) => symbol.id),
    );
    expect(firstIds).toEqual(secondIds);
    expect(first.analysis.repository.analyzedAt).not.toBe(second.analysis.repository.analyzedAt);
  });
});
