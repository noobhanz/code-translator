import type { ApplicationModel, RepositoryAnalysis } from "@codetranslate/core";
import { PrismaClient, type Prisma } from "@prisma/client";
import { HostedError } from "../errors";
import type {
  AnalysisRun,
  AnalysisRunSummary,
  CreateProjectInput,
  CreateUserInput,
  GitHubAccount,
  GitHubConnection,
  HostedUser,
  Project,
  ProjectVisibility,
} from "../models";
import type { HostedStore } from "./store";

export class PrismaHostedStore implements HostedStore {
  constructor(private readonly prisma: PrismaClient) {}

  async createUser(input: CreateUserInput): Promise<HostedUser> {
    const row = await this.prisma.user.create({
      data: {
        githubUserId: input.githubUserId,
        githubLogin: input.githubLogin,
        name: input.name,
        avatarUrl: input.avatarUrl,
        image: input.avatarUrl,
      },
    });
    return toUser(row);
  }

  async getUser(id: string): Promise<HostedUser | undefined> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toUser(row) : undefined;
  }

  async getUserByGitHubId(githubUserId: string): Promise<HostedUser | undefined> {
    const row = await this.prisma.user.findUnique({ where: { githubUserId } });
    return row ? toUser(row) : undefined;
  }

  async updateUser(id: string, patch: Partial<HostedUser>): Promise<HostedUser> {
    const row = await this.prisma.user.update({
      where: { id },
      data: {
        githubUserId: patch.githubUserId,
        githubLogin: patch.githubLogin,
        name: patch.name,
        avatarUrl: patch.avatarUrl,
        image: patch.avatarUrl,
      },
    });
    return toUser(row);
  }

  async setGitHubAccount(account: GitHubAccount): Promise<void> {
    const existing = await this.prisma.account.findFirst({
      where: { userId: account.userId, provider: "github" },
    });
    if (existing) {
      await this.prisma.account.update({
        where: { id: existing.id },
        data: { access_token: account.accessToken },
      });
      return;
    }
    await this.prisma.account.create({
      data: {
        userId: account.userId,
        type: "oauth",
        provider: "github",
        providerAccountId: account.userId,
        access_token: account.accessToken,
      },
    });
  }

  async getGitHubAccount(userId: string): Promise<GitHubAccount | undefined> {
    const row = await this.prisma.account.findFirst({
      where: { userId, provider: "github" },
    });
    if (!row?.access_token) {
      return undefined;
    }
    return { userId, provider: "github", accessToken: row.access_token };
  }

  async setGitHubConnection(connection: GitHubConnection): Promise<void> {
    await this.prisma.gitHubConnection.upsert({
      where: { userId: connection.userId },
      update: {
        installationId: connection.installationId,
        accountLogin: connection.accountLogin,
      },
      create: {
        id: connection.id,
        userId: connection.userId,
        installationId: connection.installationId,
        accountLogin: connection.accountLogin,
      },
    });
  }

  async getGitHubConnection(userId: string): Promise<GitHubConnection | undefined> {
    const row = await this.prisma.gitHubConnection.findUnique({ where: { userId } });
    if (!row) {
      return undefined;
    }
    return {
      id: row.id,
      userId: row.userId,
      ...(row.installationId ? { installationId: row.installationId } : {}),
      ...(row.accountLogin ? { accountLogin: row.accountLogin } : {}),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const row = await this.prisma.project.create({
      data: {
        userId: input.userId,
        name: input.name,
        sourceType: "github",
        githubOwner: input.githubOwner,
        githubRepo: input.githubRepo,
        githubRepoId: input.githubRepoId,
        defaultBranch: input.defaultBranch,
        visibility: input.visibility,
      },
    });
    return toProject(row);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const row = await this.prisma.project.findUnique({ where: { id } });
    return row ? toProject(row) : undefined;
  }

  async getProjectByRepo(userId: string, githubRepoId: string): Promise<Project | undefined> {
    const row = await this.prisma.project.findUnique({
      where: { userId_githubRepoId: { userId, githubRepoId } },
    });
    return row ? toProject(row) : undefined;
  }

  async listProjects(userId: string): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(toProject);
  }

  async updateProject(id: string, patch: Partial<Project>): Promise<Project> {
    const row = await this.prisma.project.update({
      where: { id },
      data: {
        name: patch.name,
        lastAnalyzedCommitSha: patch.lastAnalyzedCommitSha,
        latestAnalysisRunId: patch.latestAnalysisRunId,
        defaultBranch: patch.defaultBranch,
        visibility: patch.visibility,
      },
    });
    return toProject(row);
  }

  async deleteProject(id: string): Promise<void> {
    await this.prisma.project.delete({ where: { id } });
  }

  async countProjects(userId: string): Promise<number> {
    return this.prisma.project.count({ where: { userId } });
  }

  async createAnalysisRun(run: AnalysisRun): Promise<AnalysisRun> {
    const row = await this.prisma.analysisRun.create({
      data: toRunData(run),
    });
    return toRun(row);
  }

  async getAnalysisRun(id: string): Promise<AnalysisRun | undefined> {
    const row = await this.prisma.analysisRun.findUnique({ where: { id } });
    return row ? toRun(row) : undefined;
  }

  async listAnalysisRuns(projectId: string): Promise<AnalysisRunSummary[]> {
    const rows = await this.prisma.analysisRun.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        projectId: true,
        commitSha: true,
        analyzerVersion: true,
        schemaVersion: true,
        status: true,
        startedAt: true,
        completedAt: true,
        errorCode: true,
        errorMessage: true,
        createdAt: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      commitSha: row.commitSha,
      analyzerVersion: row.analyzerVersion,
      schemaVersion: row.schemaVersion,
      status: row.status as AnalysisRun["status"],
      ...(row.startedAt ? { startedAt: row.startedAt } : {}),
      ...(row.completedAt ? { completedAt: row.completedAt } : {}),
      ...(row.errorCode ? { errorCode: row.errorCode } : {}),
      ...(row.errorMessage ? { errorMessage: row.errorMessage } : {}),
      createdAt: row.createdAt,
    }));
  }

  async findCompletedRun(input: {
    projectId: string;
    commitSha: string;
    analyzerVersion: string;
  }): Promise<AnalysisRun | undefined> {
    const row = await this.prisma.analysisRun.findFirst({
      where: {
        projectId: input.projectId,
        commitSha: input.commitSha,
        analyzerVersion: input.analyzerVersion,
        status: "completed",
      },
      orderBy: { createdAt: "desc" },
    });
    return row ? toRun(row) : undefined;
  }

  async updateAnalysisRun(id: string, patch: Partial<AnalysisRun>): Promise<AnalysisRun> {
    const row = await this.prisma.analysisRun.update({
      where: { id },
      data: {
        status: patch.status,
        startedAt: patch.startedAt,
        completedAt: patch.completedAt,
        errorCode: patch.errorCode,
        errorMessage: patch.errorMessage,
        commitSha: patch.commitSha,
        analyzerVersion: patch.analyzerVersion,
        schemaVersion: patch.schemaVersion,
        applicationModel: patch.applicationModel as Prisma.InputJsonValue | undefined,
        repositoryAnalysis: patch.repositoryAnalysis as Prisma.InputJsonValue | undefined,
        filePaths: patch.filePaths as Prisma.InputJsonValue | undefined,
      },
    });
    return toRun(row);
  }

  async deleteAnalysisRun(id: string): Promise<void> {
    await this.prisma.analysisRun.delete({ where: { id } });
  }
}

let prisma: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new HostedError("UNAVAILABLE", "Hosted mode needs a database.", 500);
  }
  prisma ??= new PrismaClient();
  return prisma;
}

function toUser(row: {
  id: string;
  githubUserId: string | null;
  githubLogin: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}): HostedUser {
  if (!row.githubUserId || !row.githubLogin) {
    throw new HostedError("UNAUTHORIZED", "GitHub access expired. Please sign in again.", 401);
  }
  const user: HostedUser = {
    id: row.id,
    githubUserId: row.githubUserId,
    githubLogin: row.githubLogin,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  if (row.name) {
    user.name = row.name;
  }
  if (row.avatarUrl) {
    user.avatarUrl = row.avatarUrl;
  }
  return user;
}

function toProject(row: {
  id: string;
  userId: string;
  name: string;
  githubOwner: string;
  githubRepo: string;
  githubRepoId: string;
  defaultBranch: string;
  visibility: string;
  lastAnalyzedCommitSha: string | null;
  latestAnalysisRunId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Project {
  const project: Project = {
    id: row.id,
    userId: row.userId,
    name: row.name,
    sourceType: "github",
    githubOwner: row.githubOwner,
    githubRepo: row.githubRepo,
    githubRepoId: row.githubRepoId,
    defaultBranch: row.defaultBranch,
    visibility: row.visibility as ProjectVisibility,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  if (row.lastAnalyzedCommitSha) {
    project.lastAnalyzedCommitSha = row.lastAnalyzedCommitSha;
  }
  if (row.latestAnalysisRunId) {
    project.latestAnalysisRunId = row.latestAnalysisRunId;
  }
  return project;
}

function toRun(row: {
  id: string;
  projectId: string;
  commitSha: string;
  analyzerVersion: string;
  schemaVersion: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  applicationModel: Prisma.JsonValue | null;
  repositoryAnalysis: Prisma.JsonValue | null;
  filePaths: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}): AnalysisRun {
  const run: AnalysisRun = {
    id: row.id,
    projectId: row.projectId,
    commitSha: row.commitSha,
    analyzerVersion: row.analyzerVersion,
    schemaVersion: row.schemaVersion,
    status: row.status as AnalysisRun["status"],
    filePaths: (row.filePaths as Record<string, string> | null) ?? {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  if (row.startedAt) {
    run.startedAt = row.startedAt;
  }
  if (row.completedAt) {
    run.completedAt = row.completedAt;
  }
  if (row.errorCode) {
    run.errorCode = row.errorCode;
  }
  if (row.errorMessage) {
    run.errorMessage = row.errorMessage;
  }
  if (row.applicationModel) {
    run.applicationModel = row.applicationModel as ApplicationModel;
  }
  if (row.repositoryAnalysis) {
    run.repositoryAnalysis = row.repositoryAnalysis as RepositoryAnalysis;
  }
  return run;
}

function toRunData(run: AnalysisRun) {
  return {
    id: run.id,
    projectId: run.projectId,
    commitSha: run.commitSha,
    analyzerVersion: run.analyzerVersion,
    schemaVersion: run.schemaVersion,
    status: run.status,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    errorCode: run.errorCode,
    errorMessage: run.errorMessage,
    applicationModel: run.applicationModel as Prisma.InputJsonValue | undefined,
    repositoryAnalysis: run.repositoryAnalysis as Prisma.InputJsonValue | undefined,
    filePaths: run.filePaths as Prisma.InputJsonValue,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}
