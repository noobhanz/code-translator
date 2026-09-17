import { describe, expect, it } from "vitest";
import { nextAppPathToRoute, nextPagesPathToRoute } from "./routes";
import { humanizeToken, pageLabelFromRoute } from "./naming";

describe("Next.js route translation", () => {
  it("maps App Router files to routes", () => {
    expect(nextAppPathToRoute("app/page.tsx")).toBe("/");
    expect(nextAppPathToRoute("app/dashboard/page.tsx")).toBe("/dashboard");
    expect(nextAppPathToRoute("app/projects/[id]/page.tsx")).toBe("/projects/:id");
    expect(nextAppPathToRoute("app/blog/[...slug]/page.tsx")).toBe("/blog/*slug");
    expect(nextAppPathToRoute("app/api/compare/route.ts")).toBe("/api/compare");
  });

  it("maps Pages Router files to routes", () => {
    expect(nextPagesPathToRoute("pages/index.tsx")).toEqual({ route: "/", api: false });
    expect(nextPagesPathToRoute("pages/dashboard.tsx")).toEqual({
      route: "/dashboard",
      api: false,
    });
    expect(nextPagesPathToRoute("pages/projects/[id].tsx")).toEqual({
      route: "/projects/:id",
      api: false,
    });
    expect(nextPagesPathToRoute("pages/api/foo.ts")).toEqual({ route: "/api/foo", api: true });
    expect(nextPagesPathToRoute("pages/_app.tsx")).toBeUndefined();
  });

  it("creates human page labels", () => {
    expect(pageLabelFromRoute("/")).toBe("Home");
    expect(pageLabelFromRoute("/login")).toBe("Login");
    expect(pageLabelFromRoute("/dashboard")).toBe("Dashboard");
    expect(pageLabelFromRoute("/upload")).toBe("Upload");
    expect(humanizeToken("documentComparison")).toBe("Document comparison");
  });
});
