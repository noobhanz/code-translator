import { HostedError } from "../errors";
import { newId } from "../ids";
import type {
  AnalysisRun,
  AnalysisRunSummary,
  CreateProjectInput,
  CreateUserInput,
  GitHubAccount,
  GitHubConnection,
  HostedUser,
  Project,
} from "../models";
import type { HostedStore } from "./store";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryHostedStore implements HostedStore {
  private readonly users = new Map<string, HostedUser>();
  private readonly accounts = new Map<string, GitHubAccount>();
  private readonly connections = new Map<string, GitHubConnection>();
  private readonly projects = new Map<string, Project>();
  private readonly runs = new Map<string, AnalysisRun>();

  async createUser(input: CreateUserInput): Promise<HostedUser> {
    const now = new Date();
    const user: HostedUser = {
      id: newId("user"),
      githubUserId: input.githubUserId,
      githubLogin: input.githubLogin,
      createdAt: now,
      updatedAt: now,
    };
    if (input.name) {
      user.name = input.name;
    }
    if (input.avatarUrl) {
      user.avatarUrl = input.avatarUrl;
    }
    this.users.set(user.id, user);
    return clone(user);
  }

  async getUser(id: string): Promise<HostedUser | undefined> {
    const user = this.users.get(id);
    return user ? clone(user) : undefined;
  }

  async getUserByGitHubId(githubUserId: string): Promise<HostedUser | undefined> {
    const user = [...this.users.values()].find((item) => item.githubUserId === githubUserId);
    return user ? clone(user) : undefined;
  }

  async updateUser(id: string, patch: Partial<HostedUser>): Promise<HostedUser> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new HostedError("NOT_FOUND", "We couldn't find that account.", 404);
    }
    const updated = { ...existing, ...patch, id: existing.id, updatedAt: new Date() };
    this.users.set(id, updated);
    return clone(updated);
  }

  async setGitHubAccount(account: GitHubAccount): Promise<void> {
    this.accounts.set(account.userId, { ...account });
  }

  async getGitHubAccount(userId: string): Promise<GitHubAccount | undefined> {
    const account = this.accounts.get(userId);
    return account ? { ...account } : undefined;
  }

  async setGitHubConnection(connection: GitHubConnection): Promise<void> {
    this.connections.set(connection.userId, clone(connection));
  }

  async getGitHubConnection(userId: string): Promise<GitHubConnection | undefined> {
    const connection = this.connections.get(userId);
    return connection ? clone(connection) : undefined;
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const now = new Date();
    const project: Project = {
      id: newId("project"),
      userId: input.userId,
      name: input.name,
      sourceType: "github",
      githubOwner: input.githubOwner,
      githubRepo: input.githubRepo,
      githubRepoId: input.githubRepoId,
      defaultBranch: input.defaultBranch,
      visibility: input.visibility,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(project.id, project);
    return clone(project);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const project = this.projects.get(id);
    return project ? clone(project) : undefined;
  }

  async getProjectByRepo(userId: string, githubRepoId: string): Promise<Project | undefined> {
    const project = [...this.projects.values()].find(
      (item) => item.userId === userId && item.githubRepoId === githubRepoId,
    );
    return project ? clone(project) : undefined;
  }

  async listProjects(userId: string): Promise<Project[]> {
    return [...this.projects.values()]
      .filter((project) => project.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map((project) => clone(project));
  }

  async updateProject(id: string, patch: Partial<Project>): Promise<Project> {
    const existing = this.projects.get(id);
    if (!existing) {
      throw new HostedError("NOT_FOUND", "We couldn't find that app.", 404);
    }
    const updated = { ...existing, ...patch, id: existing.id, userId: existing.userId, updatedAt: new Date() };
    this.projects.set(id, updated);
    return clone(updated);
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
    for (const [runId, run] of this.runs) {
      if (run.projectId === id) {
        this.runs.delete(runId);
      }
    }
  }

  async countProjects(userId: string): Promise<number> {
    return [...this.projects.values()].filter((project) => project.userId === userId).length;
  }

  async createAnalysisRun(run: AnalysisRun): Promise<AnalysisRun> {
    this.runs.set(run.id, clone(run));
    return clone(run);
  }

  async getAnalysisRun(id: string): Promise<AnalysisRun | undefined> {
    const run = this.runs.get(id);
    return run ? clone(run) : undefined;
  }

  async listAnalysisRuns(projectId: string): Promise<AnalysisRunSummary[]> {
    return [...this.runs.values()]
      .filter((run) => run.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((run) => toSummary(run));
  }

  async findCompletedRun(input: {
    projectId: string;
    commitSha: string;
    analyzerVersion: string;
  }): Promise<AnalysisRun | undefined> {
    const match = [...this.runs.values()]
      .filter(
        (run) =>
          run.projectId === input.projectId &&
          run.commitSha === input.commitSha &&
          run.analyzerVersion === input.analyzerVersion &&
          run.status === "completed",
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    return match ? clone(match) : undefined;
  }

  async updateAnalysisRun(id: string, patch: Partial<AnalysisRun>): Promise<AnalysisRun> {
    const existing = this.runs.get(id);
    if (!existing) {
      throw new HostedError("NOT_FOUND", "We couldn't find that analysis.", 404);
    }
    const updated = { ...existing, ...patch, id: existing.id, projectId: existing.projectId, updatedAt: new Date() };
    this.runs.set(id, updated);
    return clone(updated);
  }

  async deleteAnalysisRun(id: string): Promise<void> {
    this.runs.delete(id);
  }
}

function toSummary(run: AnalysisRun): AnalysisRunSummary {
  const summary: AnalysisRunSummary = {
    id: run.id,
    projectId: run.projectId,
    commitSha: run.commitSha,
    analyzerVersion: run.analyzerVersion,
    schemaVersion: run.schemaVersion,
    status: run.status,
    createdAt: run.createdAt,
  };
  if (run.startedAt) {
    summary.startedAt = run.startedAt;
  }
  if (run.completedAt) {
    summary.completedAt = run.completedAt;
  }
  if (run.errorCode) {
    summary.errorCode = run.errorCode;
  }
  if (run.errorMessage) {
    summary.errorMessage = run.errorMessage;
  }
  return summary;
}
