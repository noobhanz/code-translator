/**
 * Internal ignore rules applied regardless of the repository `.gitignore`.
 * These prevent scanning dependency trees, VCS metadata, and our own output.
 */
export const DEFAULT_IGNORE_PATTERNS: readonly string[] = [
  ".git/",
  "node_modules/",
  ".next/",
  "dist/",
  "build/",
  "coverage/",
  ".cache/",
  ".turbo/",
  ".vercel/",
  "target/",
  "__pycache__/",
  ".codetranslate/",
  "vendor/",
  ".generated/",
  ".DS_Store",
];
