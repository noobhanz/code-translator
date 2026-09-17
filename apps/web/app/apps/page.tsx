import { AppCard } from "../../src/components/app-card";
import { EmptyApps } from "../../src/components/empty-apps";
import { requireHostedMode } from "../../src/lib/hosted-guard";
import { getHostedRuntime } from "../../src/lib/hosted-runtime";
import { requireSessionUser } from "../../src/lib/session";

export default async function AppsPage() {
  requireHostedMode();
  const user = await requireSessionUser();
  const { store } = getHostedRuntime();
  const projects = await store.listProjects(user.id);
  if (projects.length === 0) {
    return <EmptyApps />;
  }

  const cards = await Promise.all(
    projects.map(async (project) => {
      const run = project.latestAnalysisRunId
        ? await store.getAnalysisRun(project.latestAnalysisRunId)
        : undefined;
      return { project, model: run?.applicationModel };
    }),
  );

  return (
    <section>
      <div className="page-heading">
        <h1>Your apps</h1>
        <a className="button-link" href="/apps/add">
          + Add app
        </a>
      </div>
      <div className="app-grid">
        {cards.map(({ project, model }) => (
          <AppCard key={project.id} project={project} model={model} />
        ))}
      </div>
    </section>
  );
}

export const dynamic = "force-dynamic";
