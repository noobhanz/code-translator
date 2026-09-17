import { describe, expect, it } from "vitest";
import { DependencyGraph } from "./dependency-graph";

describe("dependency graph", () => {
  it("tracks incoming/outgoing adjacency and finds paths", () => {
    const graph = new DependencyGraph();
    graph.addNode({ id: "a", type: "file", label: "a.ts", fileId: "a" });
    graph.addNode({ id: "b", type: "file", label: "b.ts", fileId: "b" });
    graph.addNode({ id: "c", type: "package", label: "react", packageName: "react" });
    graph.addEdge({ id: "e1", from: "a", to: "b", type: "imports", confidence: 1 });
    graph.addEdge({ id: "e2", from: "a", to: "c", type: "imports", confidence: 1 });

    expect(graph.getOutgoing("a").map((edge) => edge.to)).toEqual(["b", "c"]);
    expect(graph.getIncoming("b").map((edge) => edge.from)).toEqual(["a"]);
    expect(
      graph
        .neighbors("a")
        .map((node) => node.id)
        .sort(),
    ).toEqual(["b", "c"]);
    expect(graph.findPath("a", "b")).toEqual(["a", "b"]);
    expect(graph.findPath("b", "c")).toBeUndefined();
  });

  it("does not duplicate edges with the same id", () => {
    const graph = new DependencyGraph();
    graph.addNode({ id: "a", type: "file", label: "a.ts" });
    graph.addNode({ id: "b", type: "file", label: "b.ts" });
    graph.addEdge({ id: "e1", from: "a", to: "b", type: "imports", confidence: 1 });
    graph.addEdge({ id: "e1", from: "a", to: "b", type: "imports", confidence: 1 });
    expect(graph.getOutgoing("a")).toHaveLength(1);
  });

  it("serializes nodes and edges in stable order", () => {
    const graph = new DependencyGraph();
    graph.addNode({ id: "b", type: "file", label: "b.ts" });
    graph.addNode({ id: "a", type: "file", label: "a.ts" });
    graph.addEdge({ id: "e2", from: "b", to: "a", type: "imports", confidence: 1 });
    graph.addEdge({ id: "e1", from: "a", to: "b", type: "imports", confidence: 1 });
    const serialized = graph.serialize();
    expect(serialized.nodes.map((node) => node.label)).toEqual(["a.ts", "b.ts"]);
    expect(serialized.edges.map((edge) => edge.id)).toEqual(["e1", "e2"]);
  });
});
