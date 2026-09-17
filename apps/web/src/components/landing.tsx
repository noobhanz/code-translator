import { OPEN_SOURCE_REPO_URL } from "@codetranslate/hosted";
import { LANDING_HEADLINE, LANDING_SUPPORT } from "../lib/copy";
import { GitHubSignInButton } from "./github-sign-in";

export { LANDING_HEADLINE, LANDING_SUPPORT };

export function HostedLanding() {
  return (
    <>
      <section className="hero">
        <p>Code Translator</p>
        <h1>{LANDING_HEADLINE}</h1>
        <p className="lede">{LANDING_SUPPORT}</p>
        <div className="actions">
          <GitHubSignInButton />
          <a className="button-secondary" href="/example">
            Try an example
          </a>
        </div>
        <p className="muted">
          <a href={OPEN_SOURCE_REPO_URL}>Open source on GitHub</a>
        </p>
      </section>

      <section className="split">
        <article className="card">
          <h3>Open source</h3>
          <p className="muted">
            Run Code Translator locally and keep everything on your machine.
          </p>
        </article>
        <article className="card">
          <h3>Hosted</h3>
          <p className="muted">
            Connect GitHub and let Code Translator keep your app overview ready for you.
          </p>
        </article>
      </section>
    </>
  );
}
