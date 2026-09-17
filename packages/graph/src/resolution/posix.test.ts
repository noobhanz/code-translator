import { describe, expect, it } from "vitest";
import {
  escapesRepository,
  hasExplicitExtension,
  isRelativeSpecifier,
  normalizePosixPath,
  posixDirname,
  posixJoin,
} from "./posix";

describe("posix helpers", () => {
  it("normalizes Windows-style separators", () => {
    expect(normalizePosixPath("src\\lib\\foo.ts")).toBe("src/lib/foo.ts");
  });

  it("resolves relative segments", () => {
    expect(posixJoin("src/app", "../lib/foo")).toBe("src/lib/foo");
    expect(posixDirname("src/app.ts")).toBe("src");
  });

  it("detects relative specifiers and explicit extensions", () => {
    expect(isRelativeSpecifier("./foo")).toBe(true);
    expect(isRelativeSpecifier("../foo")).toBe(true);
    expect(isRelativeSpecifier("foo")).toBe(false);
    expect(hasExplicitExtension("./foo.js")).toBe(true);
    expect(hasExplicitExtension("./foo")).toBe(false);
  });

  it("detects paths that escape the repository", () => {
    expect(escapesRepository("../outside")).toBe(true);
    expect(escapesRepository("src/foo")).toBe(false);
  });
});
