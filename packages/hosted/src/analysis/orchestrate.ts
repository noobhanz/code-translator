import { InspectError, type RepositoryAnalysis } from "@codetranslate/core";
import { inspectRepository } from "@codetranslate/ingest";
import { ANALYZER_VERSION, SCHEMA_VERSION } from "@codetranslate/shared";
import { HostedError, humanHostedError } from "../errors";
import { checkoutGitHubRepository, type CheckoutResult } from "../github/checkout";
import type { GitHubGateway } from "../github/types";
import { newId } from "../ids";
import { MAX_HISTORY_RUNS_PER_PROJECT } from "../limits";
import type { AnalysisRun, Project } from "../models";
import type { HostedStore } from "../persistence/store";
import { filePathMap, sanitizeRepositoryAnalysis } from "./sanitize";

export interface AnalyzeHostedProjectInput {
  store: HostedStore;
  github: GitHubGateway;
  userId: string;
  projectId: string;
  force?: boolean;
  analyzerVersion?: string;
  schemaVersion?: string;
  inspect?: (rootPath: string) => Promise<{ analysis: RepositoryAnalysis }>;
  checkout?: (input: {
    gateway: GitHubGateway;
    owner: string;
    repo: string;
    sha: string;
  }) => Promise<CheckoutResult>;
  now?: () => Date;
}

export async function analyzeHostedProject(input: AnalyzeHostedProjectInput): Promise<AnalysisRun> {
  const project = await requireOwnedProject(input.store, input.userId, input.projectId);
  const analyzerVersion = input.analyzerVersion ?? ANALYZER_VERSION;
  const schemaVersion = input.schemaVersion ?? SCHEMA_VERSION;
  const inspect = input.inspect ?? inspectRepository;
  const checkout = input.checkout ?? checkoutGitHubRepository;
  const now = input.now ?? (() => new Date());

  const commit = await input.github.getCommit(project.githubOwner, project.githubRepo, project.defaultBranch);

  if (!input.force) {
    const existing = await input.store.findCompletedRun({
      projectId: project.id,
      commitSha: commit.sha,
      analyzerVersion,
    });
    if (existing) {
      if (project.latestAnalysisRunId !== existing.id) {
        await input.store.updateProject(project.id, {
          latestAnalysisRunId: existing.id,
          lastAnalyzedCommitSha: commit.sha,
        });
      }
      return existing;
    }
  }

  const runId = newId("run");
  const createdAt = now();
  let run = await input.store.createAnalysisRun({
    id: runId,
    projectId: project.id,
    commitSha: commit.sha,
    analyzerVersion,
    schemaVersion,
    status: "queued",
    filePaths: {},
    createdAt,
    updatedAt: createdAt,
  });

  run = await input.store.updateAnalysisRun(run.id, {
    status: "running",
    startedAt: now(),
  });

  let checkoutResult: CheckoutResult | undefined;
  try {
    checkoutResult = await checkout({
      gateway: input.github,
      owner: project.githubOwner,
      repo: project.githubRepo,
      sha: commit.sha,
    });
    const { analysis } = await inspect(checkoutResult.rootPath);
    if (!analysis.application) {
      throw new HostedError("ANALYSIS_FAILED", "We couldn't analyze this app.");
    }
    const completedAt = now();
    run = await input.store.updateAnalysisRun(run.id, {
      status: "completed",
      completedAt,
      applicationModel: analysis.application,
      repositoryAnalysis: sanitizeRepositoryAnalysis(analysis, {
        owner: project.githubOwner,
        repo: project.githubRepo,
        sha: commit.sha,
      }),
      filePaths: filePathMap(analysis),
      errorCode: undefined,
      errorMessage: undefined,
    });
    await input.store.updateProject(project.id, {
      lastAnalyzedCommitSha: commit.sha,
      latestAnalysisRunId: run.id,
    });
    await pruneHistory(input.store, project.id, run.id);
    return run;
  } catch (error) {
    const message = mapAnalyzeError(error);
    run = await input.store.updateAnalysisRun(run.id, {
      status: "failed",
      completedAt: now(),
      errorCode: error instanceof HostedError ? error.code : "ANALYSIS_FAILED",
      errorMessage: message,
    });
    throw new HostedError(
      error instanceof HostedError ? error.code : "ANALYSIS_FAILED",
      message,
      error instanceof HostedError ? error.httpStatus : 400,
    );
  } finally {
    if (checkoutResult) {
      await checkoutResult.cleanup();
    }
  }
}

export async function requireOwnedProject(
  store: HostedStore,
  userId: string,
  projectId: string,
): Promise<Project> {
  const project = await store.getProject(projectId);
  if (!project || project.userId !== userId) {
    throw new HostedError("NOT_FOUND", "We couldn't find that app.", 404);
  }
  return project;
}

async function pruneHistory(store: HostedStore, projectId: string, keepId: string): Promise<void> {
  const runs = await store.listAnalysisRuns(projectId);
  if (runs.length <= MAX_HISTORY_RUNS_PER_PROJECT) {
    return;
  }
  const extra = runs.filter((run) => run.id !== keepId).slice(MAX_HISTORY_RUNS_PER_PROJECT - 1);
  for (const run of extra) {
    await store.deleteAnalysisRun(run.id);
  }
}

function mapAnalyzeError(error: unknown): string {
  if (error instanceof HostedError) {
    return error.message;
  }
  if (error instanceof InspectError) {
    return humanHostedError(error);
  }
  return humanHostedError(error);
}
