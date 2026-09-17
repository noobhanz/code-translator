import type {
  ApplicationArea,
  ApplicationAreaCategory,
  ExternalServiceDetection,
  FileNode,
  UserFacingSurface,
} from "@codetranslate/core";
import type { ApplicationDetectionContext } from "../context";
import {
  AREA_DISPLAY_NAME,
  AREA_PRIORITY,
  genericAreaDescription,
  SERVICE_CATALOG,
} from "../catalogs";
import { filesImportingAny, hasPackage } from "../context";
import {
  conventionEvidence,
  fileEvidence,
  importEvidence,
  packageEvidence,
  uniqueFileIds,
} from "../evidence";
import { applicationEntityId } from "../ids";
import { clampConfidence } from "../scoring";

interface AreaAccumulator {
  category: ApplicationAreaCategory;
  score: number;
  evidence: ApplicationArea["evidence"];
  fileIds: string[];
  symbolIds: string[];
  serviceNames: string[];
  basis: "observed" | "inferred";
}

export function detectAreas(
  context: ApplicationDetectionContext,
  surfaces: readonly UserFacingSurface[],
  services: readonly ExternalServiceDetection[],
): ApplicationArea[] {
  const accumulators = [
    scoreAuth(context, surfaces),
    scorePayments(context, surfaces),
    scoreAi(context, surfaces),
    scoreDatabase(context),
    scoreFiles(context, surfaces),
    scoreEmail(context),
    scoreAnalytics(context),
    scoreSearch(context, surfaces),
    scoreDashboard(context, surfaces),
    scoreSettings(context, surfaces),
  ].filter((item): item is AreaAccumulator => item !== undefined && item.score >= 0.35);

  const areas: ApplicationArea[] = accumulators.map((item) => {
    const ranked = rankFiles(context, item.fileIds);
    const related = services
      .filter((service) => item.serviceNames.includes(service.name))
      .map((service) => service.id);
    const description = descriptionFor(item);
    return {
      id: applicationEntityId("area", `${context.analysis.repository.id}:${item.category}`),
      category: item.category,
      name: AREA_DISPLAY_NAME[item.category],
      description,
      confidence: clampConfidence(item.score),
      basis: item.score >= 0.6 ? "observed" : item.basis,
      primaryFileIds: ranked.slice(0, 5),
      supportingFileIds: ranked.slice(5, 15),
      symbolIds: uniqueFileIds(item.symbolIds).slice(0, 20),
      relatedServiceIds: related.sort((a, b) => a.localeCompare(b)),
      evidence: item.evidence,
    };
  });

  areas.sort((a, b) => {
    const order = AREA_PRIORITY.indexOf(a.category) - AREA_PRIORITY.indexOf(b.category);
    if (order !== 0) {
      return order;
    }
    return b.confidence - a.confidence || a.name.localeCompare(b.name);
  });
  return areas;
}

function scoreAuth(
  context: ApplicationDetectionContext,
  surfaces: readonly UserFacingSurface[],
): AreaAccumulator | undefined {
  const acc = empty("authentication");
  const authPackages = SERVICE_CATALOG.filter((item) => item.area === "authentication").flatMap(
    (item) => item.packages,
  );
  addPackageSignals(context, acc, authPackages, 0.2, 0.25);
  for (const entry of SERVICE_CATALOG.filter((item) => item.area === "authentication")) {
    if (entry.packages.some((name) => hasPackage(context, name))) {
      acc.serviceNames.push(entry.name);
    }
  }
  const login = surfaces.find((surface) =>
    /login|sign-in|signin/i.test(surface.route ?? surface.name),
  );
  if (login) {
    acc.score += 0.2;
    acc.fileIds.push(login.fileId);
    acc.evidence.push(
      conventionEvidence("A login page was detected.", context.filesById.get(login.fileId), 0.2),
    );
  }
  const middleware = surfaces.find((surface) => surface.type === "middleware");
  if (middleware && acc.score > 0) {
    acc.score += 0.1;
    acc.fileIds.push(middleware.fileId);
  }
  addPathSignals(context, acc, /(^|\/)(auth|login|signin)(\/|\.|$)/i, 0.1);
  addSymbolSignals(context, acc, /^(signIn|signOut|getServerSession|auth|currentUser)$/, 0.1);
  return acc.score >= 0.35 ? acc : undefined;
}

function scorePayments(
  context: ApplicationDetectionContext,
  surfaces: readonly UserFacingSurface[],
): AreaAccumulator | undefined {
  const acc = empty("payments");
  addPackageSignals(context, acc, ["stripe"], 0.2, 0.25);
  addNamedFile(context, acc, /(^|\/)stripe\.(t|j)sx?$/, 0.1);
  const checkout = surfaces.find((surface) =>
    /checkout|billing|subscribe/i.test(surface.route ?? ""),
  );
  if (checkout && acc.score > 0) {
    acc.score += 0.15;
    acc.fileIds.push(checkout.fileId);
    acc.evidence.push(
      conventionEvidence(
        "A checkout or billing route was detected.",
        context.filesById.get(checkout.fileId),
        0.15,
      ),
    );
  }
  const webhook = surfaces.find(
    (surface) => /webhook/i.test(surface.route ?? "") && /stripe/i.test(surface.route ?? ""),
  );
  if (webhook && acc.score > 0) {
    acc.score += 0.15;
    acc.fileIds.push(webhook.fileId);
    acc.evidence.push(
      conventionEvidence(
        "A Stripe webhook route was detected.",
        context.filesById.get(webhook.fileId),
        0.15,
      ),
    );
  }
  if (acc.fileIds.length >= 2) {
    acc.score += 0.15;
    acc.evidence.push(
      conventionEvidence("Multiple payment-related files are connected.", undefined, 0.15),
    );
  }
  acc.serviceNames.push("Stripe");
  return acc.score >= 0.35 ? acc : undefined;
}

function scoreAi(
  context: ApplicationDetectionContext,
  surfaces: readonly UserFacingSurface[],
): AreaAccumulator | undefined {
  const acc = empty("ai");
  const aiPackages = SERVICE_CATALOG.filter((item) => item.area === "ai").flatMap(
    (item) => item.packages,
  );
  addPackageSignals(context, acc, aiPackages, 0.2, 0.25);
  addNamedFile(context, acc, /(openai|anthropic|llm|ai-client)/i, 0.15);
  const api = surfaces.find(
    (surface) =>
      surface.type === "api-endpoint" &&
      /compare|generate|complete|chat|ai/i.test(surface.route ?? ""),
  );
  if (api && acc.score > 0) {
    acc.score += 0.2;
    acc.fileIds.push(api.fileId);
    acc.evidence.push(
      conventionEvidence(
        "An API route is connected to AI-related naming.",
        context.filesById.get(api.fileId),
        0.2,
      ),
    );
  }
  if (acc.fileIds.length >= 2) {
    acc.score += 0.2;
  }
  for (const entry of SERVICE_CATALOG.filter((item) => item.area === "ai")) {
    if (
      entry.packages.some(
        (name) =>
          hasPackage(context, name) || (context.filesImportingPackage.get(name)?.length ?? 0) > 0,
      )
    ) {
      acc.serviceNames.push(entry.name);
    }
  }
  return acc.score >= 0.35 ? acc : undefined;
}

function scoreDatabase(context: ApplicationDetectionContext): AreaAccumulator | undefined {
  const acc = empty("database");
  const dbPackages = SERVICE_CATALOG.filter((item) => item.area === "database").flatMap(
    (item) => item.packages,
  );
  addPackageSignals(context, acc, dbPackages, 0.25, 0.3);
  addNamedFile(context, acc, /(^|\/)(db|database|prisma|schema)\.(t|j)s$/, 0.15);
  for (const entry of SERVICE_CATALOG.filter((item) => item.area === "database")) {
    if (entry.packages.some((name) => hasPackage(context, name))) {
      acc.serviceNames.push(entry.name);
    }
  }
  return acc.score >= 0.35 ? acc : undefined;
}

function scoreFiles(
  context: ApplicationDetectionContext,
  surfaces: readonly UserFacingSurface[],
): AreaAccumulator | undefined {
  const acc = empty("file-handling");
  const upload = surfaces.find((surface) => /upload/i.test(surface.route ?? surface.name));
  if (upload) {
    acc.score += 0.35;
    acc.fileIds.push(upload.fileId);
    acc.evidence.push(
      conventionEvidence(
        "An upload page or route was detected.",
        context.filesById.get(upload.fileId),
        0.35,
      ),
    );
  }
  addNamedFile(context, acc, /upload/i, 0.2);
  addSymbolSignals(context, acc, /^(FormData|File|Blob|multipart)/, 0.15);
  return acc.score >= 0.45 ? acc : undefined;
}

function scoreEmail(context: ApplicationDetectionContext): AreaAccumulator | undefined {
  const acc = empty("email");
  const packs = SERVICE_CATALOG.filter((item) => item.area === "email").flatMap(
    (item) => item.packages,
  );
  addPackageSignals(context, acc, packs, 0.25, 0.3);
  addNamedFile(context, acc, /email|mailer|resend/i, 0.15);
  for (const entry of SERVICE_CATALOG.filter((item) => item.area === "email")) {
    if (entry.packages.some((name) => hasPackage(context, name))) {
      acc.serviceNames.push(entry.name);
    }
  }
  return acc.score >= 0.4 ? acc : undefined;
}

function scoreAnalytics(context: ApplicationDetectionContext): AreaAccumulator | undefined {
  const acc = empty("analytics");
  const packs = SERVICE_CATALOG.filter((item) => item.area === "analytics").flatMap(
    (item) => item.packages,
  );
  addPackageSignals(context, acc, packs, 0.25, 0.3);
  for (const entry of SERVICE_CATALOG.filter((item) => item.area === "analytics")) {
    if (entry.packages.some((name) => hasPackage(context, name))) {
      acc.serviceNames.push(entry.name);
    }
  }
  return acc.score >= 0.4 ? acc : undefined;
}

function scoreSearch(
  context: ApplicationDetectionContext,
  surfaces: readonly UserFacingSurface[],
): AreaAccumulator | undefined {
  const acc = empty("search");
  addPackageSignals(
    context,
    acc,
    ["algoliasearch", "meilisearch", "@elastic/elasticsearch"],
    0.3,
    0.3,
  );
  const searchPage = surfaces.find((surface) => /^\/search$/i.test(surface.route ?? ""));
  if (searchPage) {
    acc.score += 0.3;
    acc.fileIds.push(searchPage.fileId);
  }
  return acc.score >= 0.5 ? acc : undefined;
}

function scoreDashboard(
  context: ApplicationDetectionContext,
  surfaces: readonly UserFacingSurface[],
): AreaAccumulator | undefined {
  const acc = empty("dashboard");
  const page = surfaces.find(
    (surface) => (surface.route ?? "").includes("dashboard") || surface.name === "Dashboard",
  );
  if (!page) {
    return undefined;
  }
  acc.score += 0.7;
  acc.fileIds.push(page.fileId);
  acc.evidence.push(
    conventionEvidence("A dashboard page was detected.", context.filesById.get(page.fileId), 0.7),
  );
  return acc;
}

function scoreSettings(
  context: ApplicationDetectionContext,
  surfaces: readonly UserFacingSurface[],
): AreaAccumulator | undefined {
  const acc = empty("settings");
  const page = surfaces.find((surface) =>
    /settings|profile|preferences/i.test(surface.route ?? surface.name),
  );
  if (!page) {
    return undefined;
  }
  acc.score += 0.65;
  acc.fileIds.push(page.fileId);
  acc.evidence.push(
    conventionEvidence(
      "A settings or profile page was detected.",
      context.filesById.get(page.fileId),
      0.65,
    ),
  );
  return acc;
}

function empty(category: ApplicationAreaCategory): AreaAccumulator {
  return {
    category,
    score: 0,
    evidence: [],
    fileIds: [],
    symbolIds: [],
    serviceNames: [],
    basis: "inferred",
  };
}

function addPackageSignals(
  context: ApplicationDetectionContext,
  acc: AreaAccumulator,
  packages: string[],
  packageWeight: number,
  importWeight: number,
): void {
  for (const name of packages) {
    if (hasPackage(context, name)) {
      acc.score += packageWeight;
      acc.evidence.push(
        packageEvidence(name, `${name} is listed in package metadata`, packageWeight),
      );
      acc.basis = "observed";
    }
    const importers = filesImportingAny(context, [name]);
    if (importers.length > 0) {
      acc.score += importWeight;
      acc.fileIds.push(...importers);
      const file = context.filesById.get(importers[0] ?? "");
      if (file) {
        acc.evidence.push(importEvidence(file, name, `${file.path} imports ${name}`, importWeight));
      }
      acc.basis = "observed";
    }
  }
}

function addNamedFile(
  context: ApplicationDetectionContext,
  acc: AreaAccumulator,
  pattern: RegExp,
  weight: number,
): void {
  for (const file of context.includedFiles) {
    if (pattern.test(file.path)) {
      acc.score += weight;
      acc.fileIds.push(file.id);
      acc.evidence.push(fileEvidence(file, `${file.path} matches a related filename`, weight));
    }
  }
}

function addPathSignals(
  context: ApplicationDetectionContext,
  acc: AreaAccumulator,
  pattern: RegExp,
  weight: number,
): void {
  addNamedFile(context, acc, pattern, weight);
}

function addSymbolSignals(
  context: ApplicationDetectionContext,
  acc: AreaAccumulator,
  pattern: RegExp,
  weight: number,
): void {
  for (const file of context.includedFiles) {
    for (const symbol of file.analysis?.symbols ?? []) {
      if (pattern.test(symbol.name)) {
        acc.score += weight;
        acc.fileIds.push(file.id);
        acc.symbolIds.push(symbol.id);
        acc.evidence.push({
          type: "symbol",
          fileId: file.id,
          symbolId: symbol.id,
          description: `Symbol ${symbol.name} matches a related name`,
          weight,
        });
      }
    }
  }
}

function rankFiles(context: ApplicationDetectionContext, fileIds: string[]): string[] {
  const unique = uniqueFileIds(fileIds);
  unique.sort((a, b) => {
    const scoreA = context.importanceByFile.get(a)?.score ?? 0;
    const scoreB = context.importanceByFile.get(b)?.score ?? 0;
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    const pathA = context.filesById.get(a)?.path ?? a;
    const pathB = context.filesById.get(b)?.path ?? b;
    return pathA.localeCompare(pathB);
  });
  return unique;
}

function descriptionFor(acc: AreaAccumulator): string {
  if (acc.category === "payments" && acc.serviceNames.includes("Stripe")) {
    return "Stripe is connected to this application.";
  }
  if (acc.category === "ai") {
    const provider = acc.serviceNames[0];
    if (provider) {
      return `The application connects to ${provider}.`;
    }
  }
  if (acc.category === "authentication" && acc.serviceNames.includes("Clerk")) {
    return "Clerk authentication is connected to this application.";
  }
  if (acc.category === "authentication" && acc.serviceNames.includes("Auth.js")) {
    return "Auth.js authentication is connected to this application.";
  }
  if (acc.category === "database" && acc.serviceNames.includes("Prisma")) {
    return "Prisma is used for data access.";
  }
  if (acc.category === "email" && acc.serviceNames[0]) {
    return `${acc.serviceNames[0]} is connected to this application.`;
  }
  return genericAreaDescription(acc.category);
}

export function fileFromId(context: ApplicationDetectionContext, id: string): FileNode | undefined {
  return context.filesById.get(id);
}
