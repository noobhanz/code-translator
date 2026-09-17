import { inspectRepository } from "@codetranslate/ingest";
import { humanAnalyzeError } from "@codetranslate/application";
import { InspectError, type ApplicationModel } from "@codetranslate/core";

export interface AnalyzeLocalResult {
  application: ApplicationModel;
  files: Record<string, string>;
}

export async function analyzeLocalProject(projectPath: string): Promise<AnalyzeLocalResult> {
  const trimmed = projectPath.trim();
  if (!trimmed) {
    throw new InspectError("We couldn't find that project folder.");
  }
  const { analysis } = await inspectRepository(trimmed);
  if (!analysis.application) {
    throw new InspectError("We couldn't prepare an application overview for that project.");
  }
  const files: Record<string, string> = {};
  for (const file of analysis.files) {
    files[file.id] = file.path;
  }
  return { application: analysis.application, files };
}

export function toUserError(error: unknown): string {
  if (error instanceof InspectError) {
    return humanAnalyzeError(error.message);
  }
  if (error instanceof Error) {
    return humanAnalyzeError(error.message);
  }
  return "We couldn't analyze that project.";
}
