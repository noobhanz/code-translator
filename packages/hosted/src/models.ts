import type { ApplicationModel, RepositoryAnalysis } from "@codetranslate/core";

export type ProjectVisibility = "public" | "private";

export type AnalysisStatus = "queued" | "running" | "completed" | "failed";

export interface HostedUser {
  id: string;
  githubUserId: string;
  githubLogin: string;
  name?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GitHubConnection {
  id: string;
  userId: string;
  installationId?: string;
  accountLogin?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GitHubAccount {
  userId: string;
  provider: "github";
  accessToken: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  sourceType: "github";
  githubOwner: string;
  githubRepo: string;
  githubRepoId: string;
  defaultBranch: string;
  visibility: ProjectVisibility;
  lastAnalyzedCommitSha?: string;
  latestAnalysisRunId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisRun {
  id: string;
  projectId: string;
  commitSha: string;
  analyzerVersion: string;
  schemaVersion: string;
  status: AnalysisStatus;
  startedAt?: Date;
  completedAt?: Date;
  errorCode?: string;
  errorMessage?: string;
  applicationModel?: ApplicationModel;
  repositoryAnalysis?: RepositoryAnalysis;
  filePaths: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisRunSummary {
  id: string;
  projectId: string;
  commitSha: string;
  analyzerVersion: string;
  schemaVersion: string;
  status: AnalysisStatus;
  startedAt?: Date;
  completedAt?: Date;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
}

export interface CreateUserInput {
  githubUserId: string;
  githubLogin: string;
  name?: string;
  avatarUrl?: string;
}

export interface CreateProjectInput {
  userId: string;
  name: string;
  githubOwner: string;
  githubRepo: string;
  githubRepoId: string;
  defaultBranch: string;
  visibility: ProjectVisibility;
}
