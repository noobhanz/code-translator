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

export interface HostedStore {
  createUser(input: CreateUserInput): Promise<HostedUser>;
  getUser(id: string): Promise<HostedUser | undefined>;
  getUserByGitHubId(githubUserId: string): Promise<HostedUser | undefined>;
  updateUser(id: string, patch: Partial<HostedUser>): Promise<HostedUser>;

  setGitHubAccount(account: GitHubAccount): Promise<void>;
  getGitHubAccount(userId: string): Promise<GitHubAccount | undefined>;

  setGitHubConnection(connection: GitHubConnection): Promise<void>;
  getGitHubConnection(userId: string): Promise<GitHubConnection | undefined>;

  createProject(input: CreateProjectInput): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getProjectByRepo(userId: string, githubRepoId: string): Promise<Project | undefined>;
  listProjects(userId: string): Promise<Project[]>;
  updateProject(id: string, patch: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  countProjects(userId: string): Promise<number>;

  createAnalysisRun(run: AnalysisRun): Promise<AnalysisRun>;
  getAnalysisRun(id: string): Promise<AnalysisRun | undefined>;
  listAnalysisRuns(projectId: string): Promise<AnalysisRunSummary[]>;
  findCompletedRun(input: {
    projectId: string;
    commitSha: string;
    analyzerVersion: string;
  }): Promise<AnalysisRun | undefined>;
  updateAnalysisRun(id: string, patch: Partial<AnalysisRun>): Promise<AnalysisRun>;
  deleteAnalysisRun(id: string): Promise<void>;
}
