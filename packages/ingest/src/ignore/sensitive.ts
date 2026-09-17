import { fileName, pathSegments } from "@codetranslate/shared";

const SENSITIVE_BASENAMES = new Set([
  "id_rsa",
  "id_dsa",
  "id_ecdsa",
  "id_ed25519",
  "credentials.json",
  "secrets.json",
  "serviceaccount.json",
]);

const SENSITIVE_EXTENSIONS = new Set([".pem", ".key", ".p12", ".pfx"]);

const ENV_ALLOWLIST = new Set([".env.example", ".env.sample", ".env.template"]);

export function isSensitivePath(relativePath: string): boolean {
  const base = fileName(relativePath).toLowerCase();

  if (SENSITIVE_BASENAMES.has(base)) {
    return true;
  }

  for (const ext of SENSITIVE_EXTENSIONS) {
    if (base.endsWith(ext)) {
      return true;
    }
  }

  if (base === ".env") {
    return true;
  }

  if (base.startsWith(".env.") && !ENV_ALLOWLIST.has(base)) {
    return true;
  }

  const segments = pathSegments(relativePath).map((segment) => segment.toLowerCase());
  if (segments.includes(".ssh") && (base.startsWith("id_") || base === "authorized_keys")) {
    return true;
  }

  return false;
}
