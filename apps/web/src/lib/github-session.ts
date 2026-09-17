export interface GitHubSessionUser {
  id: string;
  githubLogin: string;
  githubUserId: string;
  name?: string;
  avatarUrl?: string;
}

export function readGitHubSessionUser(user: unknown): GitHubSessionUser | null {
  if (!user || typeof user !== "object") {
    return null;
  }
  const record = user as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : "";
  const githubLogin = typeof record.githubLogin === "string" ? record.githubLogin : "";
  if (!id || !githubLogin) {
    return null;
  }
  const result: GitHubSessionUser = {
    id,
    githubLogin,
    githubUserId: typeof record.githubUserId === "string" ? record.githubUserId : id,
  };
  if (typeof record.name === "string") {
    result.name = record.name;
  }
  const avatar = record.avatarUrl ?? record.image;
  if (typeof avatar === "string") {
    result.avatarUrl = avatar;
  }
  return result;
}
