import type { DataStoreDetection, ExternalServiceDetection } from "@codetranslate/core";
import { SERVICE_CATALOG } from "../catalogs";
import type { ApplicationDetectionContext } from "../context";
import { filesImportingAny, hasPackage } from "../context";
import { importEvidence, packageEvidence } from "../evidence";
import { applicationEntityId } from "../ids";
import { clampConfidence } from "../scoring";

export function detectServices(context: ApplicationDetectionContext): ExternalServiceDetection[] {
  const services: ExternalServiceDetection[] = [];
  for (const entry of SERVICE_CATALOG) {
    const present = entry.packages.filter((name) => hasPackage(context, name));
    const importers = filesImportingAny(context, entry.packages);
    if (present.length === 0 && importers.length === 0) {
      continue;
    }
    let score = 0;
    const evidence = [];
    if (present.length > 0) {
      score += 0.45;
      evidence.push(
        packageEvidence(
          present[0] ?? entry.name,
          `${entry.name} appears in package metadata`,
          0.45,
        ),
      );
    }
    if (importers.length > 0) {
      score += 0.45;
      const file = context.filesById.get(importers[0] ?? "");
      if (file) {
        evidence.push(
          importEvidence(
            file,
            present[0] ?? entry.packages[0] ?? entry.name,
            `${file.path} imports ${entry.name}`,
            0.45,
          ),
        );
      }
    }
    services.push({
      id: applicationEntityId("service", `${context.analysis.repository.id}:${entry.name}`),
      name: entry.name,
      category: entry.category,
      confidence: clampConfidence(score),
      fileIds: [...importers].sort((a, b) => a.localeCompare(b)),
      evidence,
    });
  }
  services.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  return services;
}

export function detectDataStores(context: ApplicationDetectionContext): DataStoreDetection[] {
  const stores: DataStoreDetection[] = [];
  const seen = new Set<string>();
  for (const entry of SERVICE_CATALOG) {
    if (!entry.dataStore) {
      continue;
    }
    if (
      !entry.packages.some(
        (name) =>
          hasPackage(context, name) || (context.filesImportingPackage.get(name)?.length ?? 0) > 0,
      )
    ) {
      continue;
    }
    if (seen.has(entry.name)) {
      continue;
    }
    seen.add(entry.name);
    const imported = filesImportingAny(context, entry.packages).length > 0;
    stores.push({
      id: applicationEntityId("datastore", `${context.analysis.repository.id}:${entry.name}`),
      name: entry.name,
      category: entry.dataStore,
      confidence: clampConfidence(imported ? 0.85 : 0.5),
      evidence: [
        packageEvidence(
          entry.packages[0] ?? entry.name,
          `${entry.name} is referenced as data access`,
          imported ? 0.85 : 0.5,
        ),
      ],
    });
  }
  stores.sort((a, b) => a.name.localeCompare(b.name));
  return stores;
}
