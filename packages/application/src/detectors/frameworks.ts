import type { FrameworkDetection } from "@codetranslate/core";
import type { ApplicationDetectionContext } from "../context";
import { conventionEvidence, fileEvidence, importEvidence, packageEvidence } from "../evidence";
import { applicationEntityId } from "../ids";
import { clampConfidence } from "../scoring";
import { filesImportingAny, hasPackage } from "../context";

export function detectFrameworks(context: ApplicationDetectionContext): FrameworkDetection[] {
  const detections = [
    detectNext(context),
    detectReact(context),
    detectVite(context),
    detectExpress(context),
  ].filter((item): item is FrameworkDetection => item !== undefined);
  detections.sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name));
  return detections;
}

function detectNext(context: ApplicationDetectionContext): FrameworkDetection | undefined {
  let score = 0;
  const evidence = [];
  if (hasPackage(context, "next")) {
    score += 0.25;
    evidence.push(packageEvidence("next", "next is listed in package metadata", 0.25));
  }
  const config = context.includedFiles.find((file) =>
    /^next\.config\.(t|j|mj)s$/.test(file.path.split("/").pop() ?? ""),
  );
  if (config) {
    score += 0.15;
    evidence.push(fileEvidence(config, `${config.path} looks like a Next.js config file`, 0.15));
  }
  const appDir = context.includedFiles.some(
    (file) => file.path.startsWith("app/") || file.path.startsWith("src/app/"),
  );
  const pagesDir = context.includedFiles.some(
    (file) => file.path.startsWith("pages/") || file.path.startsWith("src/pages/"),
  );
  if (appDir || pagesDir) {
    score += 0.2;
    evidence.push(
      conventionEvidence(
        appDir ? "An app/ directory is present." : "A pages/ directory is present.",
      ),
    );
  }
  const pageFile = context.includedFiles.find((file) => /(^|\/)page\.(t|j)sx?$/.test(file.path));
  if (pageFile) {
    score += 0.15;
    evidence.push(
      conventionEvidence("A page.tsx file matches the App Router convention.", pageFile, 0.15),
    );
  }
  const nextImports = filesImportingAny(context, ["next"]);
  if (nextImports.length > 0) {
    score += 0.15;
    const file = context.filesById.get(nextImports[0] ?? "");
    if (file) {
      evidence.push(importEvidence(file, "next", "A file imports next", 0.15));
    }
  }
  const middleware = context.includedFiles.find((file) =>
    /(^|\/)middleware\.(t|j)sx?$/.test(file.path),
  );
  if (middleware) {
    score += 0.1;
    evidence.push(fileEvidence(middleware, "middleware.ts is present", 0.1));
  }
  if (score < 0.25) {
    return undefined;
  }
  return {
    id: applicationEntityId("framework", `${context.analysis.repository.id}:next`),
    name: "Next.js",
    confidence: clampConfidence(score),
    basis: score >= 0.45 ? "observed" : "inferred",
    evidence,
  };
}

function detectReact(context: ApplicationDetectionContext): FrameworkDetection | undefined {
  let score = 0;
  const evidence = [];
  if (hasPackage(context, "react")) {
    score += 0.3;
    evidence.push(packageEvidence("react", "react is listed in package metadata", 0.3));
  }
  const reactImports = filesImportingAny(context, ["react"]);
  if (reactImports.length > 0) {
    score += 0.3;
    evidence.push(conventionEvidence("Source files import react.", undefined, 0.3));
  }
  const components = context.includedFiles.filter((file) =>
    (file.analysis?.symbols ?? []).some((symbol) => symbol.kind === "component"),
  );
  if (components.length > 0) {
    score += 0.25;
    evidence.push(
      conventionEvidence("React components were identified in source.", components[0], 0.25),
    );
  }
  if (score < 0.3) {
    return undefined;
  }
  return {
    id: applicationEntityId("framework", `${context.analysis.repository.id}:react`),
    name: "React",
    confidence: clampConfidence(score),
    basis: "observed",
    evidence,
  };
}

function detectVite(context: ApplicationDetectionContext): FrameworkDetection | undefined {
  let score = 0;
  const evidence = [];
  if (hasPackage(context, "vite")) {
    score += 0.35;
    evidence.push(packageEvidence("vite", "vite is listed in package metadata", 0.35));
  }
  const config = context.includedFiles.find((file) => file.path.includes("vite.config."));
  if (config) {
    score += 0.25;
    evidence.push(fileEvidence(config, `${config.path} looks like a Vite config file`, 0.25));
  }
  const main = context.includedFiles.find((file) => /(^|\/)main\.(t|j)sx?$/.test(file.path));
  if (main) {
    score += 0.2;
    evidence.push(fileEvidence(main, "A Vite-style main entry file is present", 0.2));
  }
  if (score < 0.35) {
    return undefined;
  }
  return {
    id: applicationEntityId("framework", `${context.analysis.repository.id}:vite`),
    name: "Vite",
    confidence: clampConfidence(score),
    basis: score >= 0.5 ? "observed" : "inferred",
    evidence,
  };
}

function detectExpress(context: ApplicationDetectionContext): FrameworkDetection | undefined {
  let score = 0;
  const evidence = [];
  if (hasPackage(context, "express")) {
    score += 0.35;
    evidence.push(packageEvidence("express", "express is listed in package metadata", 0.35));
  }
  const imports = filesImportingAny(context, ["express"]);
  if (imports.length > 0) {
    score += 0.35;
    const file = context.filesById.get(imports[0] ?? "");
    if (file) {
      evidence.push(importEvidence(file, "express", "A file imports express", 0.35));
    }
  }
  const server = context.includedFiles.find((file) =>
    /(^|\/)(server|app|index)\.(t|j)s$/.test(file.path),
  );
  if (server && imports.includes(server.id)) {
    score += 0.2;
    evidence.push(fileEvidence(server, `${server.path} looks like an Express entry file`, 0.2));
  }
  if (score < 0.35) {
    return undefined;
  }
  return {
    id: applicationEntityId("framework", `${context.analysis.repository.id}:express`),
    name: "Express",
    confidence: clampConfidence(score),
    basis: "observed",
    evidence,
  };
}
