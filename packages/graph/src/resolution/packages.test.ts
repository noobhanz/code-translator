import { describe, expect, it } from "vitest";
import { canonicalBuiltinName, isNodeBuiltin } from "./builtins";
import { canonicalNpmPackageName, looksLikeBarePackage } from "./packages";
import { matchesWorkspacePattern, parsePnpmWorkspacePackages } from "./workspace";

describe("package and builtin names", () => {
  it("canonicalizes scoped packages and subpaths", () => {
    expect(canonicalNpmPackageName("react")).toBe("react");
    expect(canonicalNpmPackageName("lodash/fp")).toBe("lodash");
    expect(canonicalNpmPackageName("@supabase/supabase-js")).toBe("@supabase/supabase-js");
    expect(canonicalNpmPackageName("@scope/pkg/subpath")).toBe("@scope/pkg");
  });

  it("detects Node builtins and prefixes them with node:", () => {
    expect(isNodeBuiltin("fs")).toBe(true);
    expect(isNodeBuiltin("node:fs")).toBe(true);
    expect(canonicalBuiltinName("fs")).toBe("node:fs");
    expect(canonicalBuiltinName("node:path")).toBe("node:path");
    expect(isNodeBuiltin("react")).toBe(false);
  });

  it("treats bare specifiers as packages", () => {
    expect(looksLikeBarePackage("react")).toBe(true);
    expect(looksLikeBarePackage("./foo")).toBe(false);
  });
});

describe("workspace globs", () => {
  it("parses pnpm-workspace.yaml package lists", () => {
    expect(parsePnpmWorkspacePackages(`packages:\n  - apps/*\n  - packages/*\n`)).toEqual([
      "apps/*",
      "packages/*",
    ]);
  });

  it("matches single-segment globs", () => {
    expect(matchesWorkspacePattern("packages/ui", "packages/*")).toBe(true);
    expect(matchesWorkspacePattern("packages/ui/nested", "packages/*")).toBe(false);
  });
});
