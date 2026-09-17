"use client";

import { useEffect, useState } from "react";
import type { ApplicationModel } from "@codetranslate/core";

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
      {model ? <Results model={model} files={files} /> : null}
    </>
  );
}

function Results({ model, files }: { model: ApplicationModel; files: Record<string, string> }) {
  const pages = model.surfaces.filter((surface) => surface.type === "page");
  const areas = model.areas.filter((area) => area.confidence >= 0.55);
  const services = model.externalServices.filter((service) => service.confidence >= 0.55);

  return (
    <section>
      <h2>My app</h2>
      <p>{model.summary.headline}</p>

      <h3>Main parts</h3>
      {areas.length === 0 ? (
        <p className="muted">
          We found the project structure, but couldn&apos;t confidently identify its main features
          yet.
        </p>
      ) : (
        <div className="cards">
          {areas.map((area) => (
            <article className="card" key={area.id}>
              <h3>{area.name}</h3>
              <p className="muted">{area.description}</p>
              <details>
                <summary>Show details</summary>
                <p className="muted">Relevant files</p>
                <ul>
                  {area.primaryFileIds.slice(0, 5).map((fileId) => (
                    <li key={fileId}>{files[fileId] ?? "Related file"}</li>
                  ))}
                </ul>
                <p className="muted">Why we think this</p>
                <ul>
                  {area.evidence.slice(0, 4).map((item, index) => (
                    <li key={`${area.id}-ev-${index}`}>{item.description ?? item.type}</li>
                  ))}
                </ul>
              </details>
            </article>
          ))}
        </div>
      )}

      {pages.length > 0 ? (
        <>
          <h3>Pages</h3>
          <div className="chips">
            {pages.map((page) => (
              <span className="chip" key={page.id}>
                {page.name}
              </span>
            ))}
          </div>
        </>
      ) : null}

      {services.length > 0 ? (
        <>
          <h3>Connected services</h3>
          <div className="chips">
            {services.map((service) => (
              <span className="chip" key={service.id}>
                {service.name}
              </span>
            ))}
          </div>
        </>
      ) : null}

      {model.relationships.length > 0 ? (
        <>
          <h3>How the parts connect</h3>
          <div className="flow">
            {model.relationships.slice(0, 6).map((relationship, index) => (
              <span key={relationship.id}>
                {index > 0 ? <span className="arrow"> → </span> : null}
                {labelFor(model, relationship.fromId)} → {labelFor(model, relationship.toId)}
              </span>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function labelFor(model: ApplicationModel, id: string): string {
  return (
    model.areas.find((item) => item.id === id)?.name ??
    model.externalServices.find((item) => item.id === id)?.name ??
    model.dataStores.find((item) => item.id === id)?.name ??
    "Part"
  );
}
