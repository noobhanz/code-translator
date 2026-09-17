import { HostedError } from "../errors";
import { createInstallationToken, githubHeaders } from "./app-auth";
import { downloadGitHubTarball } from "./checkout";
import type { GitHubCommitRef, GitHubGateway, GitHubRepo, GitHubUserProfile } from "./types";

export interface RestGitHubGatewayOptions {
  userAccessToken?: string;
  installationId?: string;
  appId?: string;
  privateKey?: string;
  fetchImpl?: typeof fetch;
}

interface GitHubRepoPayload {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  owner: { login: string };
}

export class RestGitHubGateway implements GitHubGateway {
  constructor(private readonly options: RestGitHubGatewayOptions) {}

  async getAuthenticatedUser(): Promise<GitHubUserProfile> {
    const token = await this.token();
    const payload = await this.githubJson<Record<string, unknown>>("/user", token);
    return {
      id: String(payload.id),
      login: String(payload.login),
      ...(typeof payload.name === "string" ? { name: payload.name } : {}),
      ...(typeof payload.avatar_url === "string" ? { avatarUrl: payload.avatar_url } : {}),
    };
  }

  async listRepositories(query?: string): Promise<GitHubRepo[]> {
    const token = await this.token();
    const repos: GitHubRepo[] = [];
    if (this.options.installationId && this.options.appId && this.options.privateKey) {
      const payload = await this.githubJson<{ repositories: GitHubRepoPayload[] }>(
        "/installation/repositories?per_page=100",
        token,
      );
      repos.push(...payload.repositories.map((item) => toRepo(item, this.options.installationId)));
    } else if (this.options.installationId) {
      const payload = await this.githubJson<{ repositories: GitHubRepoPayload[] }>(
        `/user/installations/${this.options.installationId}/repositories?per_page=100`,
        token,
      );
      repos.push(...payload.repositories.map((item) => toRepo(item, this.options.installationId)));
    } else {
      const installations = await this.githubJson<{ installations: { id: number }[] }>(
        "/user/installations",
        token,
      ).catch(() => ({ installations: [] }));
      if (installations.installations.length > 0) {
        for (const installation of installations.installations) {
          const payload = await this.githubJson<{ repositories: GitHubRepoPayload[] }>(
            `/user/installations/${installation.id}/repositories?per_page=100`,
            token,
          );
          repos.push(...payload.repositories.map((item) => toRepo(item, String(installation.id))));
        }
      } else {
        const payload = await this.githubJson<GitHubRepoPayload[]>(
          "/user/repos?per_page=100&sort=full_name&affiliation=owner,collaborator,organization_member",
          token,
        );
        repos.push(...payload.map((item) => toRepo(item)));
      }
    }
    const needle = query?.trim().toLowerCase();
    const filtered = needle
      ? repos.filter(
          (repo) =>
            repo.name.toLowerCase().includes(needle) ||
            repo.owner.toLowerCase().includes(needle) ||
            repo.fullName.toLowerCase().includes(needle),
        )
      : repos;
    return filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepo> {
    const token = await this.token();
    const payload = await this.githubJson<GitHubRepoPayload>(`/repos/${owner}/${repo}`, token);
    return toRepo(payload, this.options.installationId);
  }

  async getCommit(owner: string, repo: string, branch: string): Promise<GitHubCommitRef> {
    const token = await this.token();
    const payload = await this.githubJson<{ commit?: { sha?: string }; sha?: string }>(
      `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`,
      token,
    );
    const sha = payload.commit?.sha ?? payload.sha ?? "";
    if (!sha) {
      throw new HostedError("NOT_FOUND", "We couldn't find that GitHub project.", 404);
    }
    return { sha, branch };
  }

  async downloadTarball(owner: string, repo: string, sha: string, destination: string): Promise<void> {
    const token = await this.token();
    await downloadGitHubTarball({
      owner,
      repo,
      sha,
      destination,
      token,
      ...(this.options.fetchImpl ? { fetchImpl: this.options.fetchImpl } : {}),
    });
  }

  private async token(): Promise<string> {
    if (this.options.appId && this.options.privateKey && this.options.installationId) {
      return createInstallationToken({
        appId: this.options.appId,
        privateKey: this.options.privateKey,
        installationId: this.options.installationId,
        ...(this.options.fetchImpl ? { fetchImpl: this.options.fetchImpl } : {}),
      });
    }
    if (this.options.userAccessToken) {
      return this.options.userAccessToken;
    }
    throw new HostedError("UNAUTHORIZED", "GitHub access expired. Please sign in again.", 401);
  }

  private async githubJson<T>(pathname: string, token: string): Promise<T> {
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const response = await fetchImpl(`https://api.github.com${pathname}`, {
      headers: githubHeaders(token),
    });
    if (response.status === 401) {
      throw new HostedError("UNAUTHORIZED", "GitHub access expired. Please sign in again.", 401);
    }
    if (response.status === 403) {
      throw new HostedError("GITHUB_PERMISSION", "We couldn't access that GitHub project.", 403);
    }
    if (response.status === 404) {
      throw new HostedError("NOT_FOUND", "We couldn't find that GitHub project.", 404);
    }
    if (!response.ok) {
      throw new HostedError("ANALYSIS_FAILED", "We couldn't reach GitHub right now.");
    }
    return (await response.json()) as T;
  }
}

function toRepo(payload: GitHubRepoPayload, installationId?: string): GitHubRepo {
  const repo: GitHubRepo = {
    id: String(payload.id),
    owner: payload.owner.login,
    name: payload.name,
    fullName: payload.full_name,
    visibility: payload.private ? "private" : "public",
    defaultBranch: payload.default_branch,
  };
  if (payload.description) {
    repo.description = payload.description;
  }
  if (installationId) {
    repo.installationId = installationId;
  }
  return repo;
}
