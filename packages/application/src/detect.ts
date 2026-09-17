import type { ApplicationModel, RepositoryAnalysis } from "@codetranslate/core";
import { assembleApplicationModel } from "./assemble";
import { buildDetectionContext } from "./context";

export function detectApplication(analysis: RepositoryAnalysis): ApplicationModel {
  const context = buildDetectionContext(analysis);
  return assembleApplicationModel(context);
}
