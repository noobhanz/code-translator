import { describe, expect, it } from "vitest";
import { compactId, fileIdFrom, repositoryIdFromPath, sha256Hex } from "./hash";

describe("hashing", () => {
  it("uses SHA-256", () => {
    expect(sha256Hex("hello")).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("is stable for the same input", () => {
    expect(sha256Hex("code-translator")).toBe(sha256Hex("code-translator"));
  });

  it("produces deterministic repository IDs", () => {
    const a = repositoryIdFromPath("/Users/me/project");
    const b = repositoryIdFromPath("/Users/me/project");
    const c = repositoryIdFromPath("/Users/me/project/");
    expect(a).toBe(b);
    expect(a).toBe(c);
    expect(a.startsWith("repo_")).toBe(true);
  });

  it("produces deterministic file IDs from repo id + path", () => {
    const repoId = repositoryIdFromPath("/tmp/repo");
    const first = fileIdFrom(repoId, "app/page.tsx");
    const second = fileIdFrom(repoId, "app/page.tsx");
    expect(first).toBe(second);
    expect(first.startsWith("file_")).toBe(true);
    expect(fileIdFrom(repoId, "app/layout.tsx")).not.toBe(first);
  });

  it("uses compact prefixed ids", () => {
    expect(compactId("repo", "abc")).toMatch(/^repo_[0-9a-f]{16}$/);
  });
});
