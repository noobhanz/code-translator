export interface GitHubRepo {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  description?: string;
  visibility: "public" | "private";
  defaultBranch: string;
  installationId?: string;
}

export interface GitHubCommitRef {
  sha: string;
  branch: string;
}

export interface GitHubUserProfile {
  id: string;
  login: string;
  name?: string;
  avatarUrl?: string;
}

export interface GitHubGateway {
  getAuthenticatedUser(): Promise<GitHubUserProfile>;
  listRepositories(query?: string): Promise<GitHubRepo[]>;
  getRepository(owner: string, repo: string): Promise<GitHubRepo>;
  getCommit(owner: string, repo: string, branch: string): Promise<GitHubCommitRef>;
  downloadTarball(owner: string, repo: string, sha: string, destination: string): Promise<void>;
}
