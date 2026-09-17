import { describe, expect, it } from "vitest";
import type { FileNode } from "@codetranslate/core";
import { EXTENSION_PRECEDENCE, probeInternalPath } from "./candidates";

function file(path: string): FileNode {
  return {
    id: `file_${path}`,
    path,
    extension: path.slice(path.lastIndexOf(".")),
    category: "source",
    sizeBytes: 1,
    hash: "x",
    binary: false,
    ignored: false,
  };
}

describe("extension probing", () => {
  it("uses documented precedence .ts before .tsx", () => {
    expect(EXTENSION_PRECEDENCE[0]).toBe(".ts");
    expect(EXTENSION_PRECEDENCE[1]).toBe(".tsx");
    const files = new Map([
      ["src/foo.tsx", file("src/foo.tsx")],
      ["src/foo.ts", file("src/foo.ts")],
    ]);
    const result = probeInternalPath("src/foo", files);
    expect(result.hit?.path).toBe("src/foo.ts");
    expect(result.hit?.evidenceType).toBe("extension-probe");
  });

  it("resolves index files after direct files fail", () => {
    const files = new Map([["src/dir/index.ts", file("src/dir/index.ts")]]);
    const result = probeInternalPath("src/dir", files);
    expect(result.hit?.path).toBe("src/dir/index.ts");
    expect(result.hit?.evidenceType).toBe("index-file");
  });

  it("uses exact path when the specifier has an extension", () => {
    const files = new Map([
      ["src/exact.js", file("src/exact.js")],
      ["src/exact.ts", file("src/exact.ts")],
    ]);
    const result = probeInternalPath("src/exact.js", files, true);
    expect(result.hit?.path).toBe("src/exact.js");
    expect(result.hit?.evidenceType).toBe("exact-path");
  });
});
