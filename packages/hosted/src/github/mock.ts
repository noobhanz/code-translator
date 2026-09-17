import fs from "node:fs/promises";
import path from "node:path";
import { HostedError } from "../errors";
import type { GitHubCommitRef, GitHubGateway, GitHubRepo, GitHubUserProfile } from "./types";

export class MockGitHubGateway implements GitHubGateway {
  repos: GitHubRepo[] = [];
  commits = new Map<string, string>();
  fixtureByRepo = new Map<string, string>();
  failDownload = false;
  deleted = new Set<string>();
  expired = false;

  async getAuthenticatedUser(): Promise<GitHubUserProfile> {
    if (this.expired) {
      throw new HostedError("UNAUTHORIZED", "GitHub access expired. Please sign in again.", 401);
    }
    return { id: "1", login: "demo-user" };
  }

  async listRepositories(query?: string): Promise<GitHubRepo[]> {
    const needle = query?.trim().toLowerCase();
    return this.repos.filter((repo) => {
      if (!needle) {
        return true;
      }
      return (
        repo.name.toLowerCase().includes(needle) ||
        repo.owner.toLowerCase().includes(needle) ||
        repo.fullName.toLowerCase().includes(needle)
      );
    });
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepo> {
    const key = `${owner}/${repo}`;
    if (this.deleted.has(key)) {
      throw new HostedError("NOT_FOUND", "We couldn't find that GitHub project.", 404);
    }
    const found = this.repos.find((item) => item.owner === owner && item.name === repo);
    if (!found) {
      throw new HostedError("NOT_FOUND", "We couldn't find that GitHub project.", 404);
    }
    return found;
  }

  async getCommit(owner: string, repo: string, branch: string): Promise<GitHubCommitRef> {
    const sha = this.commits.get(`${owner}/${repo}@${branch}`) ?? this.commits.get(`${owner}/${repo}`);
    if (!sha) {
      throw new HostedError("NOT_FOUND", "We couldn't find that GitHub project.", 404);
    }
    return { sha, branch };
  }

  async downloadTarball(owner: string, repo: string, _sha: string, destination: string): Promise<void> {
    if (this.failDownload) {
      throw new HostedError("ANALYSIS_FAILED", "We couldn't get this app from GitHub.");
    }
    if (this.expired) {
      throw new HostedError("UNAUTHORIZED", "GitHub access expired. Please sign in again.", 401);
    }
    const fixture = this.fixtureByRepo.get(`${owner}/${repo}`);
    if (!fixture) {
      throw new HostedError("NOT_FOUND", "We couldn't find that GitHub project.", 404);
    }
    const nested = path.join(destination, `${owner}-${repo}`);
    await fs.cp(fixture, nested, { recursive: true });
  }
}
