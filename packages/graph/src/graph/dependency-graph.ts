import type { GraphEdge, GraphNode, RepositoryDependencyGraph } from "@codetranslate/core";

export class DependencyGraph {
  readonly nodes = new Map<string, GraphNode>();
  readonly outgoing = new Map<string, GraphEdge[]>();
  readonly incoming = new Map<string, GraphEdge[]>();

  addNode(node: GraphNode): void {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
    }
  }

  addEdge(edge: GraphEdge): void {
    if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to)) {
      return;
    }
    const existing = this.outgoing.get(edge.from) ?? [];
    if (existing.some((item) => item.id === edge.id)) {
      return;
    }
    existing.push(edge);
    this.outgoing.set(edge.from, existing);
    const incoming = this.incoming.get(edge.to) ?? [];
    incoming.push(edge);
    this.incoming.set(edge.to, incoming);
  }

  getOutgoing(nodeId: string): GraphEdge[] {
    return [...(this.outgoing.get(nodeId) ?? [])];
  }

  getIncoming(nodeId: string): GraphEdge[] {
    return [...(this.incoming.get(nodeId) ?? [])];
  }

  neighbors(nodeId: string): GraphNode[] {
    const ids = new Set<string>();
    for (const edge of this.getOutgoing(nodeId)) {
      ids.add(edge.to);
    }
    for (const edge of this.getIncoming(nodeId)) {
      ids.add(edge.from);
    }
    return [...ids]
      .map((id) => this.nodes.get(id))
      .filter((node): node is GraphNode => node !== undefined);
  }

  findPath(from: string, to: string): string[] | undefined {
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      return undefined;
    }
    if (from === to) {
      return [from];
    }
    const queue: string[] = [from];
    const prev = new Map<string, string>();
    const seen = new Set<string>([from]);
    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined) {
        break;
      }
      for (const edge of this.getOutgoing(current)) {
        if (seen.has(edge.to)) {
          continue;
        }
        seen.add(edge.to);
        prev.set(edge.to, current);
        if (edge.to === to) {
          const path = [to];
          let cursor: string | undefined = to;
          while (cursor && cursor !== from) {
            cursor = prev.get(cursor);
            if (cursor) {
              path.push(cursor);
            }
          }
          return path.reverse();
        }
        queue.push(edge.to);
      }
    }
    return undefined;
  }

  serialize(): RepositoryDependencyGraph {
    const nodes = [...this.nodes.values()].sort(compareNodes);
    const edges = [...this.outgoing.values()].flat().sort(compareEdges);
    return { nodes, edges };
  }
}

function compareNodes(a: GraphNode, b: GraphNode): number {
  if (a.type !== b.type) {
    return a.type.localeCompare(b.type);
  }
  if (a.label !== b.label) {
    return a.label.localeCompare(b.label);
  }
  return a.id.localeCompare(b.id);
}

function compareEdges(a: GraphEdge, b: GraphEdge): number {
  if (a.from !== b.from) {
    return a.from.localeCompare(b.from);
  }
  if (a.to !== b.to) {
    return a.to.localeCompare(b.to);
  }
  if (a.type !== b.type) {
    return a.type.localeCompare(b.type);
  }
  return a.id.localeCompare(b.id);
}
