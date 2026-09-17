import {
  HostedError,
  PrismaHostedStore,
  RestGitHubGateway,
  getPrisma,
  isHostedMode,
  readHostedConfig,
  type GitHubGateway,
  type HostedStore,
  type HostedUser,
} from "@codetranslate/hosted";

export interface HostedRuntime {
  store: HostedStore;
  user?: HostedUser;
  githubForUser: (user: HostedUser) => Promise<GitHubGateway>;
}

let override: HostedRuntime | undefined;

export function setHostedRuntimeForTests(runtime?: HostedRuntime): void {
  override = runtime;
}

export function peekHostedRuntime(): HostedRuntime | undefined {
  return override;
}

export function getHostedRuntime(): HostedRuntime {
  if (override) {
    return override;
  }
  if (!isHostedMode()) {
    throw new HostedError("UNAVAILABLE", "Hosted mode is turned off.", 404);
  }
  const store = new PrismaHostedStore(getPrisma());
  const config = readHostedConfig();
  return {
    store,
    githubForUser: async (user) => {
      const account = await store.getGitHubAccount(user.id);
      const connection = await store.getGitHubConnection(user.id);
      return new RestGitHubGateway({
        ...(account?.accessToken ? { userAccessToken: account.accessToken } : {}),
        ...(connection?.installationId ? { installationId: connection.installationId } : {}),
        ...(config.githubAppId ? { appId: config.githubAppId } : {}),
        ...(config.githubAppPrivateKey ? { privateKey: config.githubAppPrivateKey } : {}),
      });
    },
  };
}
