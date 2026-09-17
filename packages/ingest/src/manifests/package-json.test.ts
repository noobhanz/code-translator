import { describe, expect, it } from "vitest";
import type { RepositorySnapshot, SnapshotFile } from "@codetranslate/core";
import { parsePackageManifest } from "./package-json";
import { detectPackageManager } from "./package-manager";
import { detectInstalledTechnologies } from "./technologies";

function snapshotWith(path: string, contents: string): RepositorySnapshot {
  const file: SnapshotFile = {
    path,
    absolutePath: `/tmp/${path}`,
    extension: ".json",
    sizeBytes: contents.length,
    hash: "x",
    binary: false,
    category: "config",
    ignored: false,
  };
  return {
    metadata: {
      id: "repo_x",
      name: "x",
      source: { type: "local", path: "." },
      rootPath: "/tmp",
      analyzedAt: "2026-01-01T00:00:00.000Z",
      analyzerVersion: "0.1.0",
    },
    files: [file],
    diagnostics: [],
    async readText() {
      return contents;
    },
  };
}

describe("package.json parsing", () => {
  it("extracts names not sources, and script names only", async () => {
    const result = await parsePackageManifest(
      snapshotWith(
        "package.json",
        JSON.stringify({
          name: "demo",
          version: "1.2.3",
          private: true,
          packageManager: "pnpm@10.0.0",
          scripts: { dev: "next dev", build: "next build" },
          dependencies: { next: "15.0.0", react: "19.0.0" },
          devDependencies: { typescript: "5.0.0" },
          peerDependencies: { react: "*" },
          engines: { node: ">=22" },
        }),
      ),
      "package.json",
    );

    expect(result.manifest).toMatchObject({
      type: "package.json",
      name: "demo",
      version: "1.2.3",
      private: true,
      scripts: ["build", "dev"],
      dependencies: ["next", "react"],
      devDependencies: ["typescript"],
      peerDependencies: ["react"],
    });
    expect(JSON.stringify(result.manifest)).not.toContain("next dev");
  });

  it("does not crash when dependencies is not an object", async () => {
    const result = await parsePackageManifest(
      snapshotWith("package.json", JSON.stringify({ name: "weird", dependencies: "hello" })),
      "package.json",
    );
    expect(result.manifest?.name).toBe("weird");
    expect(result.manifest?.dependencies).toEqual([]);
    expect(result.diagnostics.some((d) => d.code === "MANIFEST_PARSE_FAILED")).toBe(true);
  });

  it("reports invalid JSON without throwing", async () => {
    const result = await parsePackageManifest(
      snapshotWith("package.json", "{ not json"),
      "package.json",
    );
    expect(result.manifest).toBeUndefined();
    expect(result.diagnostics[0]?.code).toBe("MANIFEST_PARSE_FAILED");
  });
});

describe("package manager detection", () => {
  it("detects pnpm from lockfile", () => {
    const result = detectPackageManager(
      [
        {
          path: "pnpm-lock.yaml",
          absolutePath: "/tmp/pnpm-lock.yaml",
          extension: ".yaml",
          sizeBytes: 1,
          hash: "",
          binary: false,
          category: "generated",
          ignored: false,
        },
      ],
      [],
    );
    expect(result.packageManager).toBe("pnpm");
  });

  it("prefers packageManager field and warns on conflict", () => {
    const result = detectPackageManager(
      [
        {
          path: "yarn.lock",
          absolutePath: "/tmp/yarn.lock",
          extension: "",
          sizeBytes: 1,
          hash: "",
          binary: false,
          category: "generated",
          ignored: false,
        },
      ],
      [
        {
          type: "package.json",
          path: "package.json",
          packageManager: "pnpm@9.0.0",
          scripts: [],
          dependencies: [],
          devDependencies: [],
          peerDependencies: [],
        },
      ],
    );
    expect(result.packageManager).toBe("pnpm");
    expect(result.diagnostics.some((d) => d.code === "PACKAGE_MANAGER_CONFLICT")).toBe(true);
  });
});

describe("technology mapping", () => {
  it("maps obvious packages as installed, not used", () => {
    const technologies = detectInstalledTechnologies([
      {
        type: "package.json",
        path: "package.json",
        scripts: [],
        dependencies: ["next", "react", "stripe"],
        devDependencies: ["vitest"],
        peerDependencies: [],
      },
    ]);
    expect(technologies.map((t) => t.name)).toEqual(["Next.js", "React", "Stripe", "Vitest"]);
    expect(technologies.every((t) => t.status === "installed")).toBe(true);
    expect(technologies.find((t) => t.name === "Next.js")?.evidence[0]?.packageName).toBe("next");
  });
});
