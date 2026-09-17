import type { ApplicationModel, RepositoryAnalysis } from "@codetranslate/core";

export function filePathMap(analysis: RepositoryAnalysis): Record<string, string> {
  const files: Record<string, string> = {};
  for (const file of analysis.files) {
    files[file.id] = file.path;
  }
  return files;
}

export function sanitizeRepositoryAnalysis(
  analysis: RepositoryAnalysis,
  input: { owner: string; repo: string; sha: string },
): RepositoryAnalysis {
  return {
    ...analysis,
    repository: {
      ...analysis.repository,
      source: {
        type: "local",
        path: `github:${input.owner}/${input.repo}@${input.sha}`,
      },
      rootPath: `github:${input.owner}/${input.repo}`,
    },
  };
}

export function cardSummary(model: ApplicationModel): { framework?: string; services: string[] } {
  const services = model.externalServices
    .filter((service) => service.confidence >= 0.55)
    .map((service) => service.name);
  const summary: { framework?: string; services: string[] } = { services };
  if (model.summary.primaryFramework) {
    summary.framework = model.summary.primaryFramework;
  }
  return summary;
}
