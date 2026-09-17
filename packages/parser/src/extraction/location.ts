import type { SourceLocation } from "@codetranslate/core";
import type { SyntaxNode } from "../tree-sitter/parse";

/** Convert Tree-sitter 0-based coordinates to 1-based IR locations. */
export function locationFromNode(node: SyntaxNode): SourceLocation {
  return {
    startLine: node.startPosition.row + 1,
    startColumn: node.startPosition.column + 1,
    endLine: node.endPosition.row + 1,
    endColumn: node.endPosition.column + 1,
  };
}

export function compareLocations(a: SourceLocation, b: SourceLocation): number {
  if (a.startLine !== b.startLine) {
    return a.startLine - b.startLine;
  }
  if (a.startColumn !== b.startColumn) {
    return a.startColumn - b.startColumn;
  }
  if (a.endLine !== b.endLine) {
    return a.endLine - b.endLine;
  }
  return a.endColumn - b.endColumn;
}

export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function extractJsdoc(source: string, startIndex: number): string | undefined {
  const before = source.slice(0, startIndex);
  const match = /\/\*\*([\s\S]*?)\*\/\s*$/.exec(before);
  if (!match?.[1]) {
    return undefined;
  }
  const body = match[1]
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\* ?/, "").trimEnd())
    .join("\n")
    .trim();
  return body.length > 0 ? body : undefined;
}
