import { formatDateLabel, getUserAnalysisRun, getUserProject } from "@codetranslate/hosted";
import { ApplicationOverview } from "../../../../../src/components/overview";
import { ProjectTabs } from "../../../../../src/components/project-tabs";
import { requireHostedMode } from "../../../../../src/lib/hosted-guard";
import { getHostedRuntime } from "../../../../../src/lib/hosted-runtime";
import { requireSessionUser } from "../../../../../src/lib/session";

export default async function HistoryRunPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  requireHostedMode();
  const { id, runId } = await params;
  const user = await requireSessionUser();
  const runtime = getHostedRuntime();
  const project = await getUserProject(runtime.store, user.id, id);
  const run = await getUserAnalysisRun(runtime.store, user.id, id, runId);
  const when = run.completedAt ?? run.createdAt;
  const isCurrent = run.id === project.latestAnalysisRunId;

  return (
    <section>
      <p className="muted">
        <a href="/apps">Your apps</a>
      </p>
      <h1>{project.name}</h1>
      <ProjectTabs projectId={project.id} current="history" />
      <p className="banner">
        Viewing version from {formatDateLabel(when)}
        {isCurrent ? " (current)" : ""}
      </p>
      {run.applicationModel ? (
        <ApplicationOverview model={run.applicationModel} files={run.filePaths} title="What you built" />
      ) : (
        <p className="error">{run.errorMessage ?? "We couldn't analyze this app."}</p>
      )}
    </section>
  );
}

export const dynamic = "force-dynamic";
