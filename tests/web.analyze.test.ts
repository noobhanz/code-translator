import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { analyzeLocalProject, toUserError } from "../apps/web/src/lib/analyze-local";
import { InspectError } from "@codetranslate/core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("web local analysis", () => {
  it("returns an application overview for a local path", async () => {
    const result = await analyzeLocalProject(path.join(root, "fixtures/app-saas-basic"));
    expect(result.application.summary.primaryFramework).toBe("Next.js");
    expect(result.application.areas.some((area) => area.name === "Payments")).toBe(true);
    const home = result.application.surfaces.find((surface) => surface.name === "Home");
    expect(home && result.files[home.fileId]).toBe("app/page.tsx");
  });

  it("translates missing folders into a human error", () => {
    expect(toUserError(new InspectError("Repository path does not exist: /tmp/nope"))).toBe(
      "We couldn't find that project folder.",
    );
  });
});
