import { githubAppInstallUrl, readHostedConfig } from "@codetranslate/hosted";
import { AddAppForm } from "../../../src/components/add-app-form";
import { requireHostedMode } from "../../../src/lib/hosted-guard";
import { getHostedRuntime } from "../../../src/lib/hosted-runtime";
import { requireSessionUser } from "../../../src/lib/session";

export default async function AddAppPage() {
  requireHostedMode();
  const user = await requireSessionUser();
  const runtime = getHostedRuntime();
  const github = await runtime.githubForUser(user);
  const repos = await github.listRepositories().catch(() => []);
  const config = readHostedConfig();
  return (
    <AddAppForm
      repos={repos}
      {...(config.githubAppSlug ? { installUrl: githubAppInstallUrl(config.githubAppSlug) } : {})}
    />
  );
}

export const dynamic = "force-dynamic";
