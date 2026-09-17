import type {
  ApplicationCapability,
  ApplicationModel,
  ApplicationRelationship,
  ApplicationSummary,
  ExternalServiceDetection,
  FrameworkDetection,
  UserFacingSurface,
} from "@codetranslate/core";
import type { ApplicationDetectionContext } from "./context";
import { detectAreas } from "./detectors/areas";
import { detectFrameworks } from "./detectors/frameworks";
import { detectDataStores, detectServices } from "./detectors/services";
import { detectSurfaces } from "./detectors/surfaces";
import { applicationEntityId } from "./ids";
import { clampConfidence } from "./scoring";

export function assembleApplicationModel(context: ApplicationDetectionContext): ApplicationModel {
  const frameworks = detectFrameworks(context);
  const { surfaces, entrypoints } = detectSurfaces(context, frameworks);
  const externalServices = detectServices(context);
  const dataStores = detectDataStores(context);
  const areas = detectAreas(context, surfaces, externalServices);
  const capabilities = capabilitiesFromAreas(context, areas);
  const relationships = buildRelationships(context, areas, externalServices, dataStores);
  const summary = buildSummary(context, frameworks, surfaces, areas, externalServices, dataStores);

  return {
    summary,
    frameworks,
    entrypoints,
    surfaces,
    areas,
    capabilities,
    externalServices,
    dataStores,
    relationships,
    flows: [],
    diagnostics: [],
  };
}

function buildSummary(
  context: ApplicationDetectionContext,
  frameworks: FrameworkDetection[],
  surfaces: UserFacingSurface[],
  areas: ReturnType<typeof detectAreas>,
  services: ExternalServiceDetection[],
  stores: ReturnType<typeof detectDataStores>,
): ApplicationSummary {
  const pages = surfaces.filter((surface) => surface.type === "page");
  const apis = surfaces.filter((surface) => surface.type === "api-endpoint");
  const next = frameworks.find((item) => item.name === "Next.js" && item.confidence >= 0.45);
  const vite = frameworks.find((item) => item.name === "Vite" && item.confidence >= 0.45);
  const express = frameworks.find((item) => item.name === "Express" && item.confidence >= 0.45);
  const workspaces = context.analysis.manifests.filter(
    (manifest) => manifest.type === "package.json" && (manifest.workspaces?.length ?? 0) > 0,
  );

  let primaryType: ApplicationSummary["primaryType"] = "unknown";
  let primaryFramework: string | undefined;
  let headline = "This appears to be a software project.";

  if (
    workspaces.length > 1 ||
    context.analysis.manifests.filter((item) => item.type === "package.json").length > 2
  ) {
    primaryType = "monorepo";
    headline = "This appears to be a monorepo.";
  }
  if (next && pages.length > 0) {
    primaryType = "fullstack-web-application";
    primaryFramework = "Next.js";
    headline = "A full-stack web application built with Next.js.";
  } else if (vite) {
    primaryType = "frontend-application";
    primaryFramework = "Vite";
    headline = "A React frontend built with Vite.";
    if (!frameworks.some((item) => item.name === "React")) {
      headline = "A frontend application built with Vite.";
    }
  } else if (express && pages.length === 0) {
    primaryType = "backend-api";
    primaryFramework = "Express";
    headline = "A backend API built with Express.";
  } else if (pages.length > 0) {
    primaryType = "frontend-application";
    headline = "This appears to be a web application.";
  }

  const visibleAreas = areas.filter((area) => area.confidence >= 0.55);
  const summary: ApplicationSummary = {
    primaryType,
    headline,
    pageCount: pages.length,
    apiEndpointCount: apis.length,
    mainAreaIds: visibleAreas.map((area) => area.id),
    externalServiceCount: services.filter((item) => item.confidence >= 0.55).length,
    dataStoreCount: stores.filter((item) => item.confidence >= 0.55).length,
  };
  if (primaryFramework) {
    summary.primaryFramework = primaryFramework;
  }
  return summary;
}

function capabilitiesFromAreas(
  context: ApplicationDetectionContext,
  areas: ReturnType<typeof detectAreas>,
): ApplicationCapability[] {
  const mapping: Array<
    [ReturnType<typeof detectAreas>[number]["category"], ApplicationCapability["category"], string]
  > = [
    ["authentication", "user-authentication", "User authentication"],
    ["payments", "payment-processing", "Payment processing"],
    ["ai", "ai-processing", "AI processing"],
    ["database", "data-persistence", "Data persistence"],
    ["file-handling", "file-upload", "File upload"],
    ["email", "email-sending", "Email sending"],
    ["analytics", "analytics-tracking", "Analytics tracking"],
    ["search", "search", "Search"],
  ];
  const capabilities: ApplicationCapability[] = [];
  for (const [areaCategory, category, name] of mapping) {
    const related = areas.filter(
      (area) => area.category === areaCategory && area.confidence >= 0.55,
    );
    if (related.length === 0) {
      continue;
    }
    capabilities.push({
      id: applicationEntityId("capability", `${context.analysis.repository.id}:${category}`),
      category,
      name,
      confidence: clampConfidence(Math.max(...related.map((area) => area.confidence))),
      relatedAreaIds: related.map((area) => area.id),
      evidence: related.flatMap((area) => area.evidence.slice(0, 2)),
    });
  }
  return capabilities;
}

function buildRelationships(
  context: ApplicationDetectionContext,
  areas: ReturnType<typeof detectAreas>,
  services: ExternalServiceDetection[],
  stores: ReturnType<typeof detectDataStores>,
): ApplicationRelationship[] {
  const relationships: ApplicationRelationship[] = [];
  for (const area of areas) {
    for (const serviceId of area.relatedServiceIds) {
      const service = services.find((item) => item.id === serviceId);
      if (!service) {
        continue;
      }
      relationships.push({
        id: applicationEntityId("rel", `${area.id}:${service.id}`),
        fromId: area.id,
        toId: service.id,
        type: "connects-to",
        confidence: clampConfidence(Math.min(area.confidence, service.confidence)),
        evidence: [
          {
            type: "inference",
            description: `${area.name} is connected to ${service.name}.`,
          },
        ],
      });
    }
  }
  for (const store of stores) {
    const dataArea = areas.find((area) => area.category === "database");
    if (!dataArea) {
      continue;
    }
    relationships.push({
      id: applicationEntityId("rel", `${dataArea.id}:${store.id}`),
      fromId: dataArea.id,
      toId: store.id,
      type: "stores-with",
      confidence: clampConfidence(Math.min(dataArea.confidence, store.confidence)),
      evidence: [
        {
          type: "inference",
          description: `${dataArea.name} uses ${store.name}.`,
        },
      ],
    });
  }
  relationships.sort((a, b) => a.id.localeCompare(b.id));
  return relationships;
}
