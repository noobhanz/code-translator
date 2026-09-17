import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { EMPTY_APPS_COPY, LANDING_HEADLINE, LANDING_SUPPORT } from "../apps/web/src/lib/copy";
import { POST as analyzeLocal } from "../apps/web/app/api/analyze/route";
import { analyzeLocalProject } from "../apps/web/src/lib/analyze-local";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

afterEach(() => {
  delete process.env.HOSTED_MODE;
});

describe("hosted web surfaces", () => {
  it("keeps landing copy nontechnical", () => {
    expect(LANDING_HEADLINE).toBe("Understand the app you built.");
    expect(LANDING_SUPPORT).toContain("Your AI writes the code");
    expect(LANDING_SUPPORT.toLowerCase()).not.toContain("tree-sitter");
    expect(LANDING_SUPPORT.toLowerCase()).not.toContain("oauth");
  });

  it("uses a simple empty apps state", () => {
    expect(EMPTY_APPS_COPY).toContain("Add your first app");
  });

  it("keeps local analysis available when hosted mode is off", async () => {
    const result = await analyzeLocalProject(path.join(root, "fixtures/app-saas-basic"));
    expect(result.application.summary.primaryFramework).toBe("Next.js");
  });

  it("hides local path analysis while hosted mode is on", async () => {
    process.env.HOSTED_MODE = "true";
    const response = await analyzeLocal(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: path.join(root, "fixtures/app-saas-basic") }),
      }),
    );
    expect(response.status).toBe(404);
  });
});
