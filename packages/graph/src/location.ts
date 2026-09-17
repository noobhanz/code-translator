import type { SourceLocation } from "@codetranslate/core";

export function compareLocations(a: SourceLocation, b: SourceLocation): number {
  if (a.startLine !== b.startLine) {
    return a.startLine - b.startLine;
  }
  if (a.startColumn !== b.startColumn) {
    return a.startColumn - b.startColumn;
  }
  return a.endLine - b.endLine || a.endColumn - b.endColumn;
}
