"use client";

import { useState } from "react";
import { REFRESH_STAGES } from "../lib/copy";

export function ProjectActions({ projectId }: { projectId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string>(REFRESH_STAGES[0]);

  async function refresh() {
    setError(null);
    setMessage(null);
    setLoading(true);
    setStage(REFRESH_STAGES[0]);
    const timer = setInterval(() => {
      setStage((current) => {
        const index = REFRESH_STAGES.indexOf(current as (typeof REFRESH_STAGES)[number]);
        return REFRESH_STAGES[(index + 1) % REFRESH_STAGES.length] ?? current;
      });
    }, 800);
    try {
      const response = await fetch(`/api/hosted/projects/${projectId}/refresh`, { method: "POST" });
      const payload = (await response.json()) as { unchanged?: boolean; error?: string };
      if (!response.ok) {
        setError(payload.error ?? "We couldn't update your app.");
        return;
      }
      if (payload.unchanged) {
        setMessage("Your app is already up to date.");
        return;
      }
      window.location.reload();
    } catch {
      setError("We couldn't update your app.");
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }

  async function retry() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/hosted/projects/${projectId}/retry`, { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "We couldn't analyze this app.");
        return;
      }
      window.location.reload();
    } catch {
      setError("We couldn't analyze this app.");
    } finally {
      setLoading(false);
    }
  }

  async function removeApp() {
    if (!window.confirm("Remove this app from Code Translator?")) {
      return;
    }
    const response = await fetch(`/api/hosted/projects/${projectId}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "We couldn't remove that app.");
      return;
    }
    window.location.href = "/apps";
  }

  return (
    <div className="project-actions">
      <button type="button" onClick={() => void refresh()} disabled={loading}>
        Check for changes
      </button>
      <button type="button" className="danger" onClick={() => void removeApp()} disabled={loading}>
        Remove app
      </button>
      <button type="button" className="secondary" onClick={() => void retry()} disabled={loading}>
        Try again
      </button>
      {loading ? <p className="loading">{stage}</p> : null}
      {message ? <p className="muted">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
