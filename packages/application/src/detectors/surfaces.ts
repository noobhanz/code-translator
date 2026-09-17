import type {
  ApplicationEntrypoint,
  FrameworkDetection,
  UserFacingSurface,
} from "@codetranslate/core";
import type { ApplicationDetectionContext } from "../context";
import { conventionEvidence, fileEvidence } from "../evidence";
import { applicationEntityId } from "../ids";
import { pageLabelFromRoute } from "../naming";
import { detectNextRoutes } from "../routes";

export function detectSurfaces(
  context: ApplicationDetectionContext,
  frameworks: readonly FrameworkDetection[],
): { surfaces: UserFacingSurface[]; entrypoints: ApplicationEntrypoint[] } {
  const surfaces: UserFacingSurface[] = [];
  const entrypoints: ApplicationEntrypoint[] = [];
  const repoId = context.analysis.repository.id;
  const hasNext = frameworks.some((item) => item.name === "Next.js");
  const hasVite = frameworks.some((item) => item.name === "Vite");
  const hasExpress = frameworks.some((item) => item.name === "Express");

  if (hasNext) {
    for (const route of detectNextRoutes(context.includedFiles)) {
      const type =
        route.kind === "page"
          ? "page"
          : route.kind === "api-endpoint"
            ? "api-endpoint"
            : route.kind === "layout"
              ? "layout"
              : "middleware";
      const name =
        type === "page"
          ? pageLabelFromRoute(route.route)
          : type === "api-endpoint"
            ? route.route
            : type === "layout"
              ? `${pageLabelFromRoute(route.route)} layout`
              : "Middleware";
      const surface: UserFacingSurface = {
        id: applicationEntityId("surface", `${repoId}:${type}:${route.route}:${route.file.id}`),
        type,
        name,
        route: route.route,
        fileId: route.file.id,
        confidence: 0.95,
        evidence: [
          conventionEvidence(`Next.js ${route.kind} at ${route.file.path}`, route.file, 0.95),
        ],
      };
      if (route.methods.length > 0) {
        surface.methods = route.methods;
      }
      surfaces.push(surface);
      if (route.kind === "page" && route.route === "/") {
        entrypoints.push({
          id: applicationEntityId("entrypoint", `${repoId}:web:${route.file.id}`),
          type: "web",
          name: "Home page",
          fileId: route.file.id,
          confidence: 0.9,
          evidence: [fileEvidence(route.file, "App Router home page", 0.9)],
        });
      }
    }
  }

  if (hasVite) {
    const main = context.includedFiles.find((file) => /(^|\/)main\.(t|j)sx?$/.test(file.path));
    if (main) {
      surfaces.push({
        id: applicationEntityId("surface", `${repoId}:entrypoint:${main.id}`),
        type: "entrypoint",
        name: "Web entry",
        fileId: main.id,
        confidence: 0.85,
        evidence: [fileEvidence(main, "Vite-style browser entry file", 0.85)],
      });
      entrypoints.push({
        id: applicationEntityId("entrypoint", `${repoId}:web:${main.id}`),
        type: "web",
        name: "Web entry",
        fileId: main.id,
        confidence: 0.85,
        evidence: [fileEvidence(main, "Vite browser entry", 0.85)],
      });
    }
  }

  if (hasExpress) {
    const server = context.includedFiles.find((file) => {
      const importsExpress = context.importedPackagesByFile.get(file.id)?.has("express");
      return importsExpress && /(server|app|index)\.(t|j)s$/.test(file.path);
    });
    if (server) {
      entrypoints.push({
        id: applicationEntityId("entrypoint", `${repoId}:server:${server.id}`),
        type: "server",
        name: "API server",
        fileId: server.id,
        confidence: 0.8,
        evidence: [fileEvidence(server, "File imports express and looks like a server entry", 0.8)],
      });
    }
  }

  surfaces.sort((a, b) => {
    const order = ["page", "entrypoint", "api-endpoint", "layout", "middleware", "unknown"];
    const delta = order.indexOf(a.type) - order.indexOf(b.type);
    if (delta !== 0) {
      return delta;
    }
    if (a.type === "page") {
      return (
        pageRank(a.route ?? "") - pageRank(b.route ?? "") ||
        (a.route ?? "").localeCompare(b.route ?? "")
      );
    }
    return (a.route ?? a.name).localeCompare(b.route ?? b.name);
  });
  entrypoints.sort((a, b) => a.name.localeCompare(b.name));
  return { surfaces, entrypoints };
}

function pageRank(route: string): number {
  const preferred = ["/", "/login", "/sign-in", "/signin", "/dashboard", "/upload", "/settings"];
  const index = preferred.indexOf(route);
  return index === -1 ? 100 : index;
}
