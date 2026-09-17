import { OPEN_SOURCE_REPO_URL, githubAppInstallUrl, readHostedConfig } from "@codetranslate/hosted";
import { requireHostedMode } from "../../src/lib/hosted-guard";
import { requireSessionUser } from "../../src/lib/session";
import { signOut } from "../../src/lib/auth";

export default async function AccountPage() {
  requireHostedMode();
  const user = await requireSessionUser();
  const config = readHostedConfig();
  return (
    <section>
      <h1>Account</h1>
      <p className="lede">
        GitHub account
        <br />
        Connected as @{user.githubLogin}
      </p>
      {config.githubAppSlug ? (
        <p>
          <a href={githubAppInstallUrl(config.githubAppSlug)}>Manage GitHub access</a>
        </p>
      ) : null}
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit">Sign out</button>
      </form>
      <p className="muted">
        <a href={OPEN_SOURCE_REPO_URL}>View open-source engine</a>
      </p>
    </section>
  );
}

export const dynamic = "force-dynamic";
