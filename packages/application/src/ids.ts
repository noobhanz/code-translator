import { compactId } from "@codetranslate/shared";

export function applicationEntityId(kind: string, material: string): string {
  return compactId(kind, material);
}
