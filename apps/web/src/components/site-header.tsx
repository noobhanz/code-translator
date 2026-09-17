import { OPEN_SOURCE_REPO_URL } from "@codetranslate/hosted";
import { getSessionUser } from "../lib/session";

export async function SiteHeader() {
  const user = await getSessionUser().catch(() => null);
  return (
    <header className="site-header">
      <a className="brand" href={user ? "/apps" : "/"}>
        Code Translator
      </a>
      <nav>
        {user ? <a href="/apps">Your apps</a> : null}
        <a href={OPEN_SOURCE_REPO_URL}>Open source</a>
        {user ? <a href="/account">Account</a> : null}
      </nav>
    </header>
  );
}
