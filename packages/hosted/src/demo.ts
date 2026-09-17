import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ApplicationModel } from "@codetranslate/core";
import { inspectRepository } from "@codetranslate/ingest";
import { DEMO_APP_NAME } from "./limits";
import { filePathMap } from "./analysis/sanitize";

export interface DemoOverview {
  name: string;
  application: ApplicationModel;
  files: Record<string, string>;
}

let cached: DemoOverview | undefined;

export function demoFixturePath(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../fixtures/app-saas-basic");
}

export async function getDemoOverview(): Promise<DemoOverview> {
  if (cached) {
    return cached;
  }
  const { analysis } = await inspectRepository(demoFixturePath());
  if (!analysis.application) {
    throw new Error("Demo fixture did not produce an application overview.");
  }
  cached = {
    name: DEMO_APP_NAME,
    application: analysis.application,
    files: filePathMap(analysis),
  };
  return cached;
}
