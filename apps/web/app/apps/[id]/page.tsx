import { analysisStatusCopy, cardSummary, formatRelativeTime } from "@codetranslate/hosted";
import { ApplicationOverview } from "../../../src/components/overview";
import { ProjectActions } from "../../../src/components/project-actions";
import { ProjectTabs } from "../../../src/components/project-tabs";
import { getHostedRuntime } from "../../../src/lib/hosted-runtime";
import { requireHostedMode } from "../../../src/lib/hosted-guard";
import { requireSessionUser } from "../../../src/lib/session";
import { getUserProject } from "@codetranslate/hosted";

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  requireHostedMode();
  const { id } = await params;
  const user = await requireSessionUser();
  const runtime = getHostedRuntime();
  const project = await getUserProject(runtime.store, user.id, id);
  const run = project.latestAnalysisRunId
    ? await runtime.store.getAnalysisRun(project.latestAnalysisRunId)
    : undefined;
  const summary = run?.applicationModel ? cardSummary(run.applicationModel) : { services: [] };
  const bits = [summary.framework, ...summary.services].filter(Boolean);

  return (
    <section>
      <p className="muted">
        <a href="/apps">Your apps</a>
      </p>
      <div className="page-heading">
        <div>
          <h1>{project.name}</h1>
          <p className="muted">
            Updated {formatRelativeTime(project.updatedAt)}
            {project.visibility === "private" ? " · Private" : ""}
          </p>
          {bits.length > 0 ? <p className="muted">{bits.join(" · ")}</p> : null}
        </div>
        <ProjectActions projectId={project.id} />
      </div>
      <ProjectTabs projectId={project.id} current="overview" />
      {!run || run.status !== "completed" || !run.applicationModel ? (
        <div>
          <p className="lede">{analysisStatusCopy(run?.status ?? "queued")}</p>
          {run?.status === "failed" ? (
            <p className="error">{run.errorMessage ?? "We couldn't analyze this app."}</p>
          ) : null}
        </div>
      ) : (
        <ApplicationOverview
          model={run.applicationModel}
          files={run.filePaths}
          title="What you built"
        />
      )}
    </section>
  );
}

export const dynamic = "force-dynamic";
