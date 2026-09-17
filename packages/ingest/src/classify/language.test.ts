import { describe, expect, it } from "vitest";
import { inferLanguage } from "./language";

describe("language inference", () => {
  it("maps well-known extensions", () => {
    expect(inferLanguage("a.ts")).toBe("TypeScript");
    expect(inferLanguage("a.tsx")).toBe("TSX");
    expect(inferLanguage("a.js")).toBe("JavaScript");
    expect(inferLanguage("a.jsx")).toBe("JSX");
    expect(inferLanguage("a.mjs")).toBe("JavaScript");
    expect(inferLanguage("a.cjs")).toBe("JavaScript");
    expect(inferLanguage("a.css")).toBe("CSS");
    expect(inferLanguage("a.scss")).toBe("SCSS");
    expect(inferLanguage("a.html")).toBe("HTML");
    expect(inferLanguage("a.json")).toBe("JSON");
    expect(inferLanguage("a.md")).toBe("Markdown");
    expect(inferLanguage("a.mdx")).toBe("MDX");
    expect(inferLanguage("a.py")).toBe("Python");
    expect(inferLanguage("a.go")).toBe("Go");
    expect(inferLanguage("a.rs")).toBe("Rust");
    expect(inferLanguage("a.java")).toBe("Java");
    expect(inferLanguage("a.rb")).toBe("Ruby");
    expect(inferLanguage("a.php")).toBe("PHP");
    expect(inferLanguage("a.sql")).toBe("SQL");
    expect(inferLanguage("a.yaml")).toBe("YAML");
    expect(inferLanguage("a.yml")).toBe("YAML");
    expect(inferLanguage("a.toml")).toBe("TOML");
    expect(inferLanguage("a.sh")).toBe("Shell");
  });

  it("returns undefined for unknown extensions", () => {
    expect(inferLanguage("file.unknownext")).toBeUndefined();
    expect(inferLanguage(".gitignore")).toBeUndefined();
  });
});
