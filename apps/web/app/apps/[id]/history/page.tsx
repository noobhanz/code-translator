import { formatClock, formatDateLabel, getUserProject, shortSha } from "@codetranslate/hosted";
import { ProjectTabs } from "../../../../src/components/project-tabs";
import { requireHostedMode } from "../../../../src/lib/hosted-guard";
import { getHostedRuntime } from "../../../../src/lib/hosted-runtime";
import { requireSessionUser } from "../../../../src/lib/session";

export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  requireHostedMode();
  const { id } = await params;
  const user = await requireSessionUser();
  const runtime = getHostedRuntime();
  const project = await getUserProject(runtime.store, user.id, id);
  const runs = await runtime.store.listAnalysisRuns(project.id);

  return (
    <section>
      <p className="muted">
        <a href="/apps">Your apps</a>
      </p>
      <h1>{project.name}</h1>
      <ProjectTabs projectId={project.id} current="history" />
      <h2>History</h2>
      {runs.length === 0 ? (
        <p className="muted">No saved versions yet.</p>
      ) : (
        <ol className="history">
          {runs.map((run) => {
            const when = run.completedAt ?? run.createdAt;
            const current = run.id === project.latestAnalysisRunId;
            return (
              <li key={run.id}>
                <a href={`/apps/${project.id}/history/${run.id}`}>
                  <strong>{formatDateLabel(when)}</strong>
                  <span className="muted">
                    {formatClock(when)}
                    {current ? " · Current version" : ""}
                    {run.status === "failed" ? " · Couldn’t update" : ""}
                  </span>
                  <span className="muted details-sha">Details: {shortSha(run.commitSha)}</span>
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export const dynamic = "force-dynamic";
