import { HostedError, isHostedMode, type HostedUser } from "@codetranslate/hosted";
import { auth } from "./auth";
import { readGitHubSessionUser } from "./github-session";
import { peekHostedRuntime } from "./hosted-runtime";

export async function getSessionUser(): Promise<HostedUser | null> {
  const runtime = peekHostedRuntime();
  if (runtime?.user) {
    return runtime.user;
  }
  if (!isHostedMode()) {
    return null;
  }
  try {
    const session = await auth();
    const githubUser = readGitHubSessionUser(session?.user);
    if (!githubUser) {
      return null;
    }
    const user: HostedUser = {
      id: githubUser.id,
      githubUserId: githubUser.githubUserId,
      githubLogin: githubUser.githubLogin,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };
    if (githubUser.name) {
      user.name = githubUser.name;
    }
    if (githubUser.avatarUrl) {
      user.avatarUrl = githubUser.avatarUrl;
    }
    return user;
  } catch {
    return null;
  }
}

export async function requireSessionUser(): Promise<HostedUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new HostedError("UNAUTHORIZED", "Please sign in with GitHub.", 401);
  }
  return user;
}
