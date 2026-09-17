import type { RepositoryAnalysis } from "../schema/analysis";
import { repositoryAnalysisSchema } from "../schema/analysis";

export function serializeAnalysis(analysis: RepositoryAnalysis): string {
  const validated = repositoryAnalysisSchema.parse(analysis);
  return `${JSON.stringify(validated, null, 2)}\n`;
}

export function parseAnalysisJson(raw: string): RepositoryAnalysis {
  return repositoryAnalysisSchema.parse(JSON.parse(raw) as unknown);
}
