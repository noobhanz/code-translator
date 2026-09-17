import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { inspectRepository } from "@codetranslate/ingest";
import { visibleToHumans } from "@codetranslate/application";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("application detection", () => {
  it("understands the SaaS fixture", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/app-saas-basic"));
    const app = analysis.application;
    expect(app).toBeDefined();
    expect(app?.summary.primaryFramework).toBe("Next.js");
    expect(app?.summary.primaryType).toBe("fullstack-web-application");
    expect(app?.summary.headline).toContain("Next.js");
    const pageNames = (app?.surfaces ?? [])
      .filter((surface) => surface.type === "page")
      .map((surface) => surface.name);
    expect(pageNames).toEqual(expect.arrayContaining(["Home", "Login", "Dashboard", "Upload"]));
    expect(
      app?.surfaces.some(
        (surface) => surface.type === "api-endpoint" && surface.route === "/api/compare",
      ),
    ).toBe(true);
    const areaNames = (app?.areas ?? [])
      .filter((area) => visibleToHumans(area.confidence))
      .map((area) => area.name);
    expect(areaNames).toEqual(
      expect.arrayContaining(["Accounts", "Payments", "AI", "Data", "Files"]),
    );
    const serviceNames = (app?.externalServices ?? []).map((service) => service.name);
    expect(serviceNames).toEqual(expect.arrayContaining(["Stripe", "OpenAI"]));
    expect(app?.dataStores.some((store) => store.name === "Prisma")).toBe(true);
    expect(app?.areas.find((area) => area.name === "Payments")?.description).toContain("Stripe");
  });

  it("keeps application model IDs stable across runs", async () => {
    const fixture = path.join(root, "fixtures/app-saas-basic");
    const first = await inspectRepository(fixture);
    const second = await inspectRepository(fixture);
    expect(first.analysis.application?.areas.map((area) => area.id)).toEqual(
      second.analysis.application?.areas.map((area) => area.id),
    );
    expect(first.analysis.application?.surfaces.map((surface) => surface.id)).toEqual(
      second.analysis.application?.surfaces.map((surface) => surface.id),
    );
    expect(first.analysis.application?.externalServices.map((service) => service.id)).toEqual(
      second.analysis.application?.externalServices.map((service) => service.id),
    );
    expect(first.analysis.application?.areas.map((area) => area.confidence)).toEqual(
      second.analysis.application?.areas.map((area) => area.confidence),
    );
  });

  it("detects a Vite frontend", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/app-vite-react"));
    expect(analysis.application?.frameworks.some((item) => item.name === "Vite")).toBe(true);
    expect(analysis.application?.summary.primaryType).toBe("frontend-application");
  });

  it("detects an Express API", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/app-express"));
    expect(analysis.application?.frameworks.some((item) => item.name === "Express")).toBe(true);
    expect(analysis.application?.summary.primaryType).toBe("backend-api");
    expect(analysis.application?.entrypoints.some((item) => item.type === "server")).toBe(true);
  });

  it("detects Next.js Pages Router routes", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/app-next-pages"));
    const pages = analysis.application?.surfaces.filter((surface) => surface.type === "page") ?? [];
    expect(pages.map((page) => page.route)).toEqual(expect.arrayContaining(["/", "/dashboard"]));
    expect(
      analysis.application?.surfaces.some(
        (surface) => surface.type === "api-endpoint" && surface.route === "/api/hello",
      ),
    ).toBe(true);
  });

  it("does not invent high-confidence areas from names alone", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/app-false-positives"));
    const visible = (analysis.application?.areas ?? []).filter((area) =>
      visibleToHumans(area.confidence),
    );
    expect(visible.map((area) => area.name)).not.toContain("Payments");
    expect(visible.map((area) => area.name)).not.toContain("Accounts");
    expect(visible.map((area) => area.name)).not.toContain("AI");
    expect(
      analysis.application?.externalServices.some((service) => service.name === "OpenAI"),
    ).toBe(false);
    expect(
      analysis.application?.externalServices.some((service) => service.name === "Stripe"),
    ).toBe(false);
  });
});
