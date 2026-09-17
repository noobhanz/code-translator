import { HostedError } from "../errors";
import type { GitHubGateway } from "../github/types";
import { MAX_PROJECTS_PER_USER } from "../limits";
import type { AnalysisRun, Project } from "../models";
import type { HostedStore } from "../persistence/store";
import { analyzeHostedProject, requireOwnedProject } from "../analysis/orchestrate";

export async function addGitHubApp(input: {
  store: HostedStore;
  github: GitHubGateway;
  userId: string;
  owner: string;
  repo: string;
}): Promise<{ project: Project; run: AnalysisRun; created: boolean }> {
  const remote = await input.github.getRepository(input.owner, input.repo);
  const existing = await input.store.getProjectByRepo(input.userId, remote.id);
  if (existing) {
    const run = await analyzeHostedProject({
      store: input.store,
      github: input.github,
      userId: input.userId,
      projectId: existing.id,
    });
    const project = await requireOwnedProject(input.store, input.userId, existing.id);
    return { project, run, created: false };
  }

  const count = await input.store.countProjects(input.userId);
  if (count >= MAX_PROJECTS_PER_USER) {
    throw new HostedError(
      "PROJECT_LIMIT",
      "You've reached the current limit for saved apps.",
      400,
    );
  }

  const project = await input.store.createProject({
    userId: input.userId,
    name: remote.name,
    githubOwner: remote.owner,
    githubRepo: remote.name,
    githubRepoId: remote.id,
    defaultBranch: remote.defaultBranch,
    visibility: remote.visibility,
  });

  try {
    const run = await analyzeHostedProject({
      store: input.store,
      github: input.github,
      userId: input.userId,
      projectId: project.id,
    });
    const saved = await requireOwnedProject(input.store, input.userId, project.id);
    return { project: saved, run, created: true };
  } catch (error) {
    const saved = await requireOwnedProject(input.store, input.userId, project.id);
    const run = await latestRun(input.store, project.id);
    if (run) {
      return { project: saved, run, created: true };
    }
    throw error;
  }
}

export async function listUserProjects(store: HostedStore, userId: string): Promise<Project[]> {
  return store.listProjects(userId);
}

export async function getUserProject(
  store: HostedStore,
  userId: string,
  projectId: string,
): Promise<Project> {
  return requireOwnedProject(store, userId, projectId);
}

export async function removeUserProject(
  store: HostedStore,
  userId: string,
  projectId: string,
): Promise<void> {
  await requireOwnedProject(store, userId, projectId);
  await store.deleteProject(projectId);
}

export async function refreshUserProject(input: {
  store: HostedStore;
  github: GitHubGateway;
  userId: string;
  projectId: string;
}): Promise<{ project: Project; run: AnalysisRun; unchanged: boolean }> {
  const before = await requireOwnedProject(input.store, input.userId, input.projectId);
  const previousId = before.latestAnalysisRunId;
  const run = await analyzeHostedProject({
    store: input.store,
    github: input.github,
    userId: input.userId,
    projectId: input.projectId,
  });
  const project = await requireOwnedProject(input.store, input.userId, input.projectId);
  const unchanged = Boolean(previousId && run.id === previousId && run.status === "completed");
  return { project, run, unchanged };
}

export async function retryUserProject(input: {
  store: HostedStore;
  github: GitHubGateway;
  userId: string;
  projectId: string;
}): Promise<{ project: Project; run: AnalysisRun }> {
  await requireOwnedProject(input.store, input.userId, input.projectId);
  const run = await analyzeHostedProject({
    store: input.store,
    github: input.github,
    userId: input.userId,
    projectId: input.projectId,
    force: true,
  });
  const project = await requireOwnedProject(input.store, input.userId, input.projectId);
  return { project, run };
}

export async function getUserAnalysisRun(
  store: HostedStore,
  userId: string,
  projectId: string,
  runId: string,
): Promise<AnalysisRun> {
  await requireOwnedProject(store, userId, projectId);
  const run = await store.getAnalysisRun(runId);
  if (!run || run.projectId !== projectId) {
    throw new HostedError("NOT_FOUND", "We couldn't find that version.", 404);
  }
  return run;
}

async function latestRun(store: HostedStore, projectId: string): Promise<AnalysisRun | undefined> {
  const summaries = await store.listAnalysisRuns(projectId);
  const first = summaries[0];
  if (!first) {
    return undefined;
  }
  return store.getAnalysisRun(first.id);
}
