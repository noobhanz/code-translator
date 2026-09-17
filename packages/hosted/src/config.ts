export interface HostedConfig {
  hostedMode: boolean;
  databaseUrl?: string;
  authSecret?: string;
  githubClientId?: string;
  githubClientSecret?: string;
  githubAppId?: string;
  githubAppPrivateKey?: string;
  githubAppSlug?: string;
  openSourceRepoUrl: string;
}

export function isHostedMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.HOSTED_MODE === "true";
}

export function readHostedConfig(env: NodeJS.ProcessEnv = process.env): HostedConfig {
  return {
    hostedMode: isHostedMode(env),
    databaseUrl: env.DATABASE_URL,
    authSecret: env.AUTH_SECRET,
    githubClientId: env.AUTH_GITHUB_ID ?? env.GITHUB_CLIENT_ID,
    githubClientSecret: env.AUTH_GITHUB_SECRET ?? env.GITHUB_CLIENT_SECRET,
    githubAppId: env.GITHUB_APP_ID,
    githubAppPrivateKey: normalizePrivateKey(env.GITHUB_APP_PRIVATE_KEY),
    githubAppSlug: env.GITHUB_APP_SLUG,
    openSourceRepoUrl: env.OPEN_SOURCE_REPO_URL ?? "https://github.com/noobhanz/code-translator",
  };
}

export function githubAppInstallUrl(slug: string): string {
  return `https://github.com/apps/${slug}/installations/new`;
}

function normalizePrivateKey(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.replaceAll("\\n", "\n");
}
