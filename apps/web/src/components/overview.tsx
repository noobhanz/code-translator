import type { ApplicationModel } from "@codetranslate/core";

export function ApplicationOverview({
  model,
  files,
  title = "My app",
}: {
  model: ApplicationModel;
  files: Record<string, string>;
  title?: string;
}) {
  const pages = model.surfaces.filter((surface) => surface.type === "page");
  const areas = model.areas.filter((area) => area.confidence >= 0.55);
  const services = model.externalServices.filter((service) => service.confidence >= 0.55);

  return (
    <section>
      <h2>{title}</h2>
      <p className="lede">{model.summary.headline}</p>

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
