import type { ApplicationModel } from "@codetranslate/core";
import { cardSummary, formatRelativeTime, type Project } from "@codetranslate/hosted";

export function AppCard({
  project,
  model,
  now,
}: {
  project: Project;
  model?: ApplicationModel;
  now?: Date;
}) {
  const summary = model ? cardSummary(model) : { services: [] };
  const bits = [summary.framework, ...summary.services].filter(Boolean);
  return (
    <article className="app-card">
      <div className="app-card-top">
        <h3>{project.name}</h3>
        {project.visibility === "private" ? <span className="badge">Private</span> : null}
      </div>
      <p className="muted">{bits.length > 0 ? bits.join(" · ") : "Overview saved"}</p>
      <p className="muted">Updated {formatRelativeTime(project.updatedAt, now)}</p>
      <a className="button-link" href={`/apps/${project.id}`}>
        Open
      </a>
    </article>
  );
}
