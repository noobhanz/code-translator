export function ProjectTabs({
  projectId,
  current,
}: {
  projectId: string;
  current: "overview" | "history";
}) {
  return (
    <nav className="tabs">
      <a className={current === "overview" ? "active" : undefined} href={`/apps/${projectId}`}>
        Overview
      </a>
      <a className={current === "history" ? "active" : undefined} href={`/apps/${projectId}/history`}>
        History
      </a>
    </nav>
  );
}
