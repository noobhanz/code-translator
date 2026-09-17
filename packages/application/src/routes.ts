import type { FileNode } from "@codetranslate/core";
import { fileName } from "@codetranslate/shared";
import { HTTP_METHODS } from "./catalogs";
import { pageLabelFromRoute, stripSrcPrefix } from "./naming";

export interface DetectedRoute {
  kind: "page" | "api-endpoint" | "layout" | "middleware";
  route: string;
  file: FileNode;
  methods: string[];
}

const PAGE_FILE = /(^|\/)page\.(t|j)sx?$/;
const LAYOUT_FILE = /(^|\/)layout\.(t|j)sx?$/;
const ROUTE_FILE = /(^|\/)route\.(t|j)sx?$/;
const MIDDLEWARE_FILE = /(^|\/)middleware\.(t|j)sx?$/;

export function detectNextRoutes(files: readonly FileNode[]): DetectedRoute[] {
  const detected: DetectedRoute[] = [];
  for (const file of files) {
    if (file.ignored) {
      continue;
    }
    const relative = stripSrcPrefix(file.path);
    if (MIDDLEWARE_FILE.test(fileName(file.path)) && !relative.includes("/")) {
      detected.push({ kind: "middleware", route: "*", file, methods: [] });
      continue;
    }
    if (relative.startsWith("app/")) {
      const appRoute = nextAppPathToRoute(relative);
      if (PAGE_FILE.test(relative) && appRoute !== undefined) {
        detected.push({ kind: "page", route: appRoute, file, methods: [] });
      } else if (LAYOUT_FILE.test(relative) && appRoute !== undefined) {
        detected.push({ kind: "layout", route: appRoute, file, methods: [] });
      } else if (ROUTE_FILE.test(relative) && appRoute !== undefined) {
        detected.push({
          kind: "api-endpoint",
          route: appRoute,
          file,
          methods: httpMethodsFromFile(file),
        });
      }
      continue;
    }
    if (relative.startsWith("pages/")) {
      const pagesRoute = nextPagesPathToRoute(relative);
      if (!pagesRoute) {
        continue;
      }
      detected.push({
        kind: pagesRoute.api ? "api-endpoint" : "page",
        route: pagesRoute.route,
        file,
        methods: pagesRoute.api ? httpMethodsFromFile(file) : [],
      });
    }
  }
  detected.sort((a, b) => a.route.localeCompare(b.route) || a.file.path.localeCompare(b.file.path));
  return detected;
}

export function nextAppPathToRoute(path: string): string | undefined {
  const withoutFile = path.replace(/^app\//, "").replace(/\/?(page|layout|route)\.(t|j)sx?$/, "");
  if (
    path === "app/page.tsx" ||
    path === "app/page.ts" ||
    path === "app/page.jsx" ||
    path === "app/page.js"
  ) {
    return "/";
  }
  if (withoutFile === "" || withoutFile === "app") {
    return "/";
  }
  const segments = withoutFile.split("/").filter((segment) => {
    if (!segment) {
      return false;
    }
    if (segment.startsWith("(") && segment.endsWith(")")) {
      return false;
    }
    if (segment.startsWith("@")) {
      return false;
    }
    return true;
  });
  if (segments.length === 0) {
    return "/";
  }
  return `/${segments.map(dynamicSegment).join("/")}`;
}

export function nextPagesPathToRoute(path: string): { route: string; api: boolean } | undefined {
  const rest = path.replace(/^pages\//, "");
  const base = rest.replace(/\.(t|j)sx?$/, "");
  if (base.startsWith("_")) {
    return undefined;
  }
  if (base === "index") {
    return { route: "/", api: false };
  }
  if (base.startsWith("api/")) {
    const apiPath =
      base === "api/index" ? "/api" : `/${base.split("/").map(dynamicSegment).join("/")}`;
    return { route: apiPath, api: true };
  }
  const segments = base
    .split("/")
    .map((segment) => (segment === "index" ? "" : dynamicSegment(segment)));
  const route = `/${segments.filter(Boolean).join("/")}`;
  return { route: route === "/" ? "/" : route, api: false };
}

function dynamicSegment(segment: string): string {
  const optionalCatchAll = segment.match(/^\[\[\.\.\.(.+)]]$/);
  if (optionalCatchAll?.[1]) {
    return `*${optionalCatchAll[1]}`;
  }
  const catchAll = segment.match(/^\[\.\.\.(.+)]$/);
  if (catchAll?.[1]) {
    return `*${catchAll[1]}`;
  }
  const dynamic = segment.match(/^\[(.+)]$/);
  if (dynamic?.[1]) {
    return `:${dynamic[1]}`;
  }
  return segment;
}

export function httpMethodsFromFile(file: FileNode): string[] {
  const names = new Set<string>();
  for (const symbol of file.analysis?.symbols ?? []) {
    if ((HTTP_METHODS as readonly string[]).includes(symbol.name) && symbol.exported) {
      names.add(symbol.name);
    }
  }
  for (const exported of file.analysis?.exports ?? []) {
    for (const name of exported.names) {
      if ((HTTP_METHODS as readonly string[]).includes(name)) {
        names.add(name);
      }
    }
  }
  return HTTP_METHODS.filter((method) => names.has(method));
}

export { pageLabelFromRoute };
