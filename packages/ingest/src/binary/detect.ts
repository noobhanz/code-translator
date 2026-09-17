import { getExtension } from "@codetranslate/shared";

export const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".bmp",
  ".avif",
  ".pdf",
  ".zip",
  ".gz",
  ".tgz",
  ".7z",
  ".rar",
  ".mp4",
  ".mov",
  ".webm",
  ".mp3",
  ".wav",
  ".ogg",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".class",
  ".wasm",
  ".lockb",
]);

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".mdx",
  ".css",
  ".scss",
  ".html",
  ".yml",
  ".yaml",
  ".toml",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".rb",
  ".php",
  ".sql",
  ".sh",
  ".txt",
  ".svg",
]);

export function hasBinaryExtension(relativePath: string): boolean {
  const extension = getExtension(relativePath);
  if (extension === ".lockb") {
    return true;
  }
  return BINARY_EXTENSIONS.has(extension);
}

export function looksBinary(buffer: Uint8Array): boolean {
  if (buffer.length === 0) {
    return false;
  }

  let nonPrintable = 0;
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  for (const byte of sample) {
    if (byte === 0) {
      return true;
    }
    if (byte < 7 || (byte > 14 && byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)) {
      nonPrintable += 1;
    }
  }

  return nonPrintable / sample.length > 0.3;
}

export function isProbablyTextExtension(relativePath: string): boolean {
  return TEXT_EXTENSIONS.has(getExtension(relativePath));
}
