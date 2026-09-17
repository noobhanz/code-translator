import { describe, expect, it } from "vitest";
import { isSensitivePath } from "./sensitive";

describe("sensitive files", () => {
  it("detects env files except examples", () => {
    expect(isSensitivePath(".env")).toBe(true);
    expect(isSensitivePath(".env.local")).toBe(true);
    expect(isSensitivePath(".env.production")).toBe(true);
    expect(isSensitivePath(".env.example")).toBe(false);
  });

  it("detects keys and credentials", () => {
    expect(isSensitivePath("certs/site.pem")).toBe(true);
    expect(isSensitivePath("id_rsa")).toBe(true);
    expect(isSensitivePath("credentials.json")).toBe(true);
    expect(isSensitivePath("server.key")).toBe(true);
  });
});
