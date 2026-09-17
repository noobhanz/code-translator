import { EMPTY_APPS_COPY } from "../lib/copy";

export { EMPTY_APPS_COPY };

export function EmptyApps() {
  return (
    <section className="hero">
      <h1>Your apps</h1>
      <p className="lede">Add your first app and we&apos;ll show you what your AI actually built.</p>
      <a className="button-link" href="/apps/add">
        Add an app
      </a>
    </section>
  );
}
