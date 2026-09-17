const TOKEN_PATTERNS = [
  /gho_[A-Za-z0-9_]+/g,
  /ghu_[A-Za-z0-9_]+/g,
  /ghs_[A-Za-z0-9_]+/g,
  /ghr_[A-Za-z0-9_]+/g,
  /github_pat_[A-Za-z0-9_]+/g,
  /Bearer\s+\S+/gi,
];

export function redactSecrets(value: string): string {
  let result = value;
  for (const pattern of TOKEN_PATTERNS) {
    result = result.replace(pattern, "[redacted]");
  }
  return result;
}

export function assertNoSecrets(value: string): void {
  if (redactSecrets(value) !== value) {
    throw new Error("Secret material must not be logged or returned to clients.");
  }
}
