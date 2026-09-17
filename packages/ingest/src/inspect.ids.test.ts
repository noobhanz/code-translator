import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fileIdFrom } from "@codetranslate/shared";
import { inspectRepository } from "./inspect";

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../fixtures");

describe("identifier stability", () => {
  it("keeps repository and file IDs stable across runs", async () => {
    const root = path.join(fixtures, "mixed-files");
    const first = await inspectRepository(root);
    const second = await inspectRepository(root);

    expect(first.analysis.repository.id).toBe(second.analysis.repository.id);
    expect(first.analysis.repository.id.startsWith("repo_")).toBe(true);

    const page = first.analysis.files.find((file) => file.path === "hello.ts");
    const pageAgain = second.analysis.files.find((file) => file.path === "hello.ts");
    expect(page?.id).toBe(pageAgain?.id);
    expect(page?.id).toBe(fileIdFrom(first.analysis.repository.id, "hello.ts"));
  });
});
