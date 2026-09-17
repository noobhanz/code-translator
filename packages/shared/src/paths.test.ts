import { describe, expect, it } from "vitest";
import {
  fileName,
  getExtension,
  isPathInsideRoot,
  normalizeRelativePath,
  pathSegments,
  toPosixPath,
} from "./paths";

describe("path normalization", () => {
  it("converts Windows separators to POSIX", () => {
    expect(toPosixPath("src\\components\\Button.tsx")).toBe("src/components/Button.tsx");
  });

  it("strips leading ./ and trailing slashes", () => {
    expect(normalizeRelativePath("./src/app.ts/")).toBe("src/app.ts");
  });

  it("keeps nested relative paths stable", () => {
    expect(normalizeRelativePath("app/page.tsx")).toBe("app/page.tsx");
  });

  it("extracts file names", () => {
    expect(fileName("src/components/Button.tsx")).toBe("Button.tsx");
  });

  it("splits path segments", () => {
    expect(pathSegments("src/components/Button.tsx")).toEqual(["src", "components", "Button.tsx"]);
  });

  it("returns last extension lowercased", () => {
    expect(getExtension("app/page.TSX")).toBe(".tsx");
    expect(getExtension("bundle.min.js")).toBe(".js");
  });

  it("treats dotfiles without a second dot as having no extension", () => {
    expect(getExtension(".gitignore")).toBe("");
    expect(getExtension(".env")).toBe("");
  });

  it("detects paths inside a root", () => {
    expect(isPathInsideRoot("/repo", "/repo/src/index.ts")).toBe(true);
    expect(isPathInsideRoot("/repo", "/etc/passwd")).toBe(false);
    expect(isPathInsideRoot("/repo", "/repo/../outside")).toBe(false);
  });
});
