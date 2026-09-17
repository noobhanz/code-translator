"use client";

import { useEffect, useState } from "react";
import type { ApplicationModel } from "@codetranslate/core";
import { ApplicationOverview } from "../src/components/overview";

const STAGES = [
  "Reading your project...",
  "Finding the main parts...",
  "Understanding how they connect...",
  "Preparing your overview...",
];

export function OverviewApp() {
  const [path, setPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(STAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<ApplicationModel | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading) {
      return;
    }
    let index = 0;
    const timer = setInterval(() => {
      index = (index + 1) % STAGES.length;
      setStage(STAGES[index] ?? STAGES[0]);
    }, 900);
    return () => clearInterval(timer);
  }, [loading]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setModel(null);
    setLoading(true);
    setStage(STAGES[0]);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const payload = (await response.json()) as {
        application?: ApplicationModel;
        files?: Record<string, string>;
        error?: string;
      };
      if (!response.ok || !payload.application) {
        setError(payload.error ?? "We couldn't analyze that project.");
        return;
      }
      setModel(payload.application);
      setFiles(payload.files ?? {});
    } catch {
      setError("We couldn't analyze that project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="hero">
        <p>Code Translator</p>
        <h1>Understand the app you built.</h1>
        <p className="lede">
          Choose your project and Code Translator will show you what it contains and how the main
          parts fit together.
        </p>
        <p>
          <a href="/example">Try an example</a>
        </p>
      </section>

      <form onSubmit={onSubmit}>
        <label htmlFor="path">Development mode: local project path</label>
        <input
          id="path"
          type="text"
          value={path}
          onChange={(event) => setPath(event.target.value)}
          placeholder="/path/to/local/project"
        />
        <button type="submit">Explain my app</button>
      </form>

      {loading ? <p className="loading">{stage}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {model ? <ApplicationOverview model={model} files={files} /> : null}
    </>
  );
}
