import { FILE_CATEGORY_PRIORITY, type FileCategory } from "@codetranslate/core";
import { fileName, getExtension, pathSegments } from "@codetranslate/shared";
import { isSourceLanguageExtension } from "./language";

const LOCKFILE_NAMES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
  "npm-shrinkwrap.json",
]);

const CONFIG_FILENAMES = new Set([
  "package.json",
  "tsconfig.json",
  "jsconfig.json",
  "turbo.json",
  "nx.json",
  "lerna.json",
  "pnpm-workspace.yaml",
  "components.json",
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
  ".nvmrc",
  ".npmrc",
  ".prettierrc",
  ".prettierignore",
  ".eslintignore",
  ".dockerignore",
  "dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".env.example",
  ".env.sample",
  ".env.template",
]);

const CONFIG_PREFIXES = ["tsconfig.", ".eslintrc", ".prettierrc", ".babelrc", ".yarnrc"];

const DOCUMENTATION_FILENAMES = new Set([
  "readme",
  "changelog",
  "contributing",
  "license",
  "licence",
  "code_of_conduct",
  "security",
  "authors",
  "notice",
  "copying",
]);

const ASSET_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".svg",
  ".bmp",
  ".avif",
  ".pdf",
  ".zip",
  ".gz",
  ".mp4",
  ".mov",
  ".mp3",
  ".wav",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
]);

const ASSET_DIRECTORIES = new Set([
  "images",
  "img",
  "fonts",
  "icons",
  "media",
  "public",
  "static",
  "assets",
]);

const VENDOR_DIRECTORIES = new Set(["vendor", "third_party", "third-party"]);

const TEST_DIRECTORIES = new Set(["test", "tests", "__tests__", "__test__"]);

function matchesConfigPattern(base: string): boolean {
  const lower = base.toLowerCase();
  if (CONFIG_FILENAMES.has(lower)) {
    return true;
  }
  if (
    lower.endsWith(".config.ts") ||
    lower.endsWith(".config.js") ||
    lower.endsWith(".config.mjs")
  ) {
    return true;
  }
  if (
    lower.endsWith(".config.cjs") ||
    lower.endsWith(".config.mts") ||
    lower.endsWith(".config.cts")
  ) {
    return true;
  }
  if (lower.startsWith("eslint.config.")) {
    return true;
  }
  if (lower.startsWith("prettier.config.")) {
    return true;
  }
  if (lower.startsWith("next.config.")) {
    return true;
  }
  if (lower.startsWith("vite.config.") || lower.startsWith("vitest.config.")) {
    return true;
  }
  if (lower.startsWith("webpack.config.") || lower.startsWith("postcss.config.")) {
    return true;
  }
  if (lower.startsWith("tailwind.config.")) {
    return true;
  }
  if (lower.startsWith("jest.config.")) {
    return true;
  }
  return CONFIG_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

function isTestPath(relativePath: string): boolean {
  const base = fileName(relativePath);
  if (/\.(test|spec)\.[^.]+$/i.test(base)) {
    return true;
  }
  const segments = pathSegments(relativePath).slice(0, -1);
  return segments.some((segment) => TEST_DIRECTORIES.has(segment.toLowerCase()));
}

function isDocumentationPath(relativePath: string): boolean {
  const base = fileName(relativePath);
  const stem = base.replace(/\.[^.]+$/, "").toLowerCase();
  if (DOCUMENTATION_FILENAMES.has(stem)) {
    return true;
  }

  const segments = pathSegments(relativePath);
  const inDocs = segments.some((segment) => segment.toLowerCase() === "docs");
  const ext = getExtension(relativePath);
  return inDocs && (ext === ".md" || ext === ".mdx" || ext === ".txt" || ext === ".rst");
}

function isGeneratedPath(relativePath: string): boolean {
  const base = fileName(relativePath).toLowerCase();
  if (LOCKFILE_NAMES.has(base)) {
    return true;
  }
  if (base.endsWith(".min.js") || base.endsWith(".min.css") || base.endsWith(".min.mjs")) {
    return true;
  }
  if (base.endsWith(".map")) {
    return true;
  }
  if (base.includes(".generated.")) {
    return true;
  }
  return pathSegments(relativePath).some((segment) => segment.toLowerCase() === ".generated");
}

function isVendorPath(relativePath: string): boolean {
  return pathSegments(relativePath)
    .slice(0, -1)
    .some((segment) => VENDOR_DIRECTORIES.has(segment.toLowerCase()));
}

function isAssetPath(relativePath: string): boolean {
  const ext = getExtension(relativePath);
  if (ASSET_EXTENSIONS.has(ext)) {
    return true;
  }
  return pathSegments(relativePath)
    .slice(0, -1)
    .some((segment) => ASSET_DIRECTORIES.has(segment.toLowerCase()));
}

function matchingCategories(relativePath: string): FileCategory[] {
  const matches: FileCategory[] = [];
  if (isTestPath(relativePath)) {
    matches.push("test");
  }
  if (matchesConfigPattern(fileName(relativePath))) {
    matches.push("config");
  }
  if (isDocumentationPath(relativePath)) {
    matches.push("documentation");
  }
  if (isGeneratedPath(relativePath)) {
    matches.push("generated");
  }
  if (isVendorPath(relativePath)) {
    matches.push("vendor");
  }
  if (isSourceLanguageExtension(relativePath)) {
    matches.push("source");
  }
  if (isAssetPath(relativePath)) {
    matches.push("asset");
  }
  return matches;
}

export function classifyFile(relativePath: string): FileCategory {
  const matches = matchingCategories(relativePath);
  for (const category of FILE_CATEGORY_PRIORITY) {
    if (matches.includes(category)) {
      return category;
    }
  }
  return "unknown";
}

export { LOCKFILE_NAMES };
