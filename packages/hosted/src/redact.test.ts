import { describe, expect, it } from "vitest";
import { assertNoSecrets, redactSecrets } from "./redact";

describe("secret redaction", () => {
  it("removes GitHub tokens and bearer headers", () => {
    const raw = "Authorization: Bearer gho_secretTokenValue123 token=ghu_anotherToken";
    const redacted = redactSecrets(raw);
    expect(redacted).not.toContain("gho_");
    expect(redacted).not.toContain("ghu_");
    expect(redacted).toContain("[redacted]");
  });

  it("rejects leaking strings", () => {
    expect(() => assertNoSecrets("gho_abc")).toThrow(/Secret material/);
  });
});
