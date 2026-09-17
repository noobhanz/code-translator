import { describe, expect, it } from "vitest";
import { formatDateLabel, formatRelativeTime, shortSha } from "./time";

describe("human time", () => {
  const now = new Date("2026-09-17T18:00:00.000Z");

  it("describes recent updates without commit language", () => {
    expect(formatRelativeTime(new Date("2026-09-17T17:52:00.000Z"), now)).toBe("8 minutes ago");
    expect(formatRelativeTime(new Date("2026-09-16T18:00:00.000Z"), now)).toBe("yesterday");
  });

  it("labels history days", () => {
    expect(formatDateLabel(new Date("2026-09-17T14:32:00.000Z"), now)).toBe("Today");
    expect(formatDateLabel(new Date("2026-09-16T18:14:00.000Z"), now)).toBe("Yesterday");
  });

  it("shortens SHAs only for details", () => {
    expect(shortSha("a83c1d2ffff")).toBe("a83c1d2");
  });
});
