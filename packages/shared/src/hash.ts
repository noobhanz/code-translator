import { createHash } from "node:crypto";

export function sha256Hex(data: string | Buffer | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export function compactId(prefix: string, material: string): string {
  return `${prefix}_${sha256Hex(material).slice(0, 16)}`;
}

export function repositoryIdFromPath(normalizedAbsolutePath: string): string {
  return compactId("repo", normalizeIdPath(normalizedAbsolutePath));
}

export function fileIdFrom(repositoryId: string, normalizedRelativePath: string): string {
  return compactId("file", `${repositoryId}:${normalizedRelativePath}`);
}

function normalizeIdPath(value: string): string {
  return value.replaceAll("\\", "/").replace(/\/+$/, "");
}
