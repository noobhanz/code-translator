import { describe, expect, it } from "vitest";
import { classifyFile } from "./category";

describe("file classification", () => {
  it("classifies source files", () => {
    expect(classifyFile("src/components/Button.tsx")).toBe("source");
    expect(classifyFile("app/page.tsx")).toBe("source");
    expect(classifyFile("lib/example.ts")).toBe("source");
    expect(classifyFile("server/index.js")).toBe("source");
  });

  it("classifies tests over source", () => {
    expect(classifyFile("src/button.test.ts")).toBe("test");
    expect(classifyFile("src/button.spec.tsx")).toBe("test");
    expect(classifyFile("__tests__/thing.ts")).toBe("test");
    expect(classifyFile("tests/unit.ts")).toBe("test");
  });

  it("classifies config over source", () => {
    expect(classifyFile("package.json")).toBe("config");
    expect(classifyFile("tsconfig.json")).toBe("config");
    expect(classifyFile("next.config.ts")).toBe("config");
    expect(classifyFile("vite.config.ts")).toBe("config");
    expect(classifyFile("eslint.config.js")).toBe("config");
    expect(classifyFile(".prettierrc")).toBe("config");
    expect(classifyFile("tailwind.config.ts")).toBe("config");
    expect(classifyFile("postcss.config.mjs")).toBe("config");
    expect(classifyFile(".env.example")).toBe("config");
    expect(classifyFile(".gitignore")).toBe("config");
  });

  it("classifies documentation", () => {
    expect(classifyFile("README.md")).toBe("documentation");
    expect(classifyFile("CHANGELOG.md")).toBe("documentation");
    expect(classifyFile("CONTRIBUTING.md")).toBe("documentation");
    expect(classifyFile("docs/architecture.md")).toBe("documentation");
  });

  it("classifies generated lockfiles and minified assets, not as source", () => {
    expect(classifyFile("package-lock.json")).toBe("generated");
    expect(classifyFile("pnpm-lock.yaml")).toBe("generated");
    expect(classifyFile("yarn.lock")).toBe("generated");
    expect(classifyFile("bun.lock")).toBe("generated");
    expect(classifyFile("vendor/jquery.min.js")).toBe("generated");
    expect(classifyFile("app.js.map")).toBe("generated");
  });

  it("classifies vendor paths when not generated", () => {
    expect(classifyFile("vendor/legacy.js")).toBe("vendor");
  });

  it("classifies assets", () => {
    expect(classifyFile("public/icon.svg")).toBe("asset");
    expect(classifyFile("images/logo.png")).toBe("asset");
    expect(classifyFile("fonts/inter.woff2")).toBe("asset");
  });

  it("uses documented precedence: test > config > documentation > generated > vendor > source > asset", () => {
    expect(classifyFile("tests/next.config.ts")).toBe("test");
    expect(classifyFile("docs/README.md")).toBe("documentation");
  });

  it("returns unknown when nothing matches", () => {
    expect(classifyFile("mystery.dat")).toBe("unknown");
  });
});
