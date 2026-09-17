import type { GraphNode, RepositoryAnalysis } from "@codetranslate/core";
import type { Logger } from "@codetranslate/shared";

export function printDependencies(analysis: RepositoryAnalysis, logger: Logger): void {
  logger.info("Dependencies");
  logger.info("");

  const nodes = new Map(analysis.graph.nodes.map((node) => [node.id, node]));
  const files = analysis.files.filter((file) => !file.ignored);
  let printed = 0;

  for (const file of files) {
    const outgoing = analysis.graph.edges.filter((edge) => edge.from === file.id);
    if (outgoing.length === 0) {
      continue;
    }
    printed += 1;
    logger.info(file.path);
    const seen = new Set<string>();
    for (const edge of outgoing) {
      const target = nodes.get(edge.to);
      if (!target) {
        continue;
      }
      const key = `${kindLabel(target)}:${target.label}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      logger.info(`  ${kindLabel(target).padEnd(12, " ")} → ${target.label}`);
    }
    logger.info("");
  }

  if (printed === 0) {
    logger.info("No module dependencies found.");
  }
}

export function serializeDependenciesJson(analysis: RepositoryAnalysis): string {
  const nodes = new Map(analysis.graph.nodes.map((node) => [node.id, node]));
  const files = analysis.files
    .filter((file) => !file.ignored)
    .map((file) => ({
      path: file.path,
      fileId: file.id,
      dependencies: analysis.graph.edges
        .filter((edge) => edge.from === file.id)
        .map((edge) => {
          const target = nodes.get(edge.to);
          return {
            kind: target ? kindLabel(target) : "unresolved",
            label: target?.label ?? edge.to,
            edgeType: edge.type,
            nodeId: edge.to,
          };
        }),
    }))
    .filter((file) => file.dependencies.length > 0);

  return `${JSON.stringify(
    {
      schemaVersion: analysis.schemaVersion,
      repository: { id: analysis.repository.id, name: analysis.repository.name },
      files,
    },
    null,
    2,
  )}\n`;
}

function kindLabel(node: GraphNode): "internal" | "external" | "builtin" {
  if (node.type === "file") {
    return "internal";
  }
  if (node.type === "builtin") {
    return "builtin";
  }
  return "external";
}
