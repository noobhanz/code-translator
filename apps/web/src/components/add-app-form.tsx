"use client";

import { useMemo, useState } from "react";
import { FIRST_ANALYSIS_STAGES } from "../lib/copy";

interface GitHubRepo {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  visibility: "public" | "private";
}

export function AddAppForm({
  repos,
  installUrl,
}: {
  repos: GitHubRepo[];
  installUrl?: string;
}) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string>(FIRST_ANALYSIS_STAGES[0]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return repos;
    }
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(needle) ||
        repo.owner.toLowerCase().includes(needle) ||
        repo.fullName.toLowerCase().includes(needle),
    );
  }, [query, repos]);

  async function addRepo(repo: GitHubRepo) {
    setError(null);
    setLoading(true);
    setStage(FIRST_ANALYSIS_STAGES[0]);
    const timer = setInterval(() => {
      setStage((current) => {
        const index = FIRST_ANALYSIS_STAGES.indexOf(
          current as (typeof FIRST_ANALYSIS_STAGES)[number],
        );
        return FIRST_ANALYSIS_STAGES[(index + 1) % FIRST_ANALYSIS_STAGES.length] ?? current;
      });
    }, 900);
    try {
      const response = await fetch("/api/hosted/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ owner: repo.owner, repo: repo.name }),
      });
      const payload = (await response.json()) as { project?: { id: string }; error?: string };
      if (!response.ok || !payload.project) {
        setError(payload.error ?? "We couldn't add that app.");
        return;
      }
      window.location.href = `/apps/${payload.project.id}`;
    } catch {
      setError("We couldn't add that app.");
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }

  if (repos.length === 0) {
    return (
      <section>
        <h1>Choose an app</h1>
        <p className="lede">Choose which apps Code Translator can access, then pick one to explain.</p>
        {installUrl ? (
          <a className="button-link" href={installUrl}>
            Choose GitHub access
          </a>
        ) : (
          <p className="muted">No GitHub projects were available for this account.</p>
        )}
      </section>
    );
  }

  return (
    <section>
      <h1>Choose an app</h1>
      <p className="lede">Search your GitHub projects...</p>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name"
        disabled={loading}
      />
      {loading ? <p className="loading">{stage}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <ul className="repo-list">
        {visible.map((repo) => (
          <li key={repo.id}>
            <button type="button" className="repo-button" disabled={loading} onClick={() => addRepo(repo)}>
              <strong>{repo.name}</strong>
              <span className="muted">
                {repo.owner}
                {repo.visibility === "private" ? " · Private" : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
