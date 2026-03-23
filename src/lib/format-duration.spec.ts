import { describe, expect, it } from "vitest";

import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it("should return '1 minute' for 60_000ms", () => {
    expect(formatDuration(60_000)).toBe("1 minute");
  });

  it("should return '30 minutes' for 1_800_000ms", () => {
    expect(formatDuration(1_800_000)).toBe("30 minutes");
  });

  it("should return '1 hour' for 3_600_000ms", () => {
    expect(formatDuration(3_600_000)).toBe("1 hour");
  });

  it("should return '2 hours' for 7_200_000ms", () => {
    expect(formatDuration(7_200_000)).toBe("2 hours");
  });

  it("should return '24 hours' for 86_400_000ms", () => {
    expect(formatDuration(86_400_000)).toBe("24 hours");
  });

  it("should round fractional minutes", () => {
    expect(formatDuration(90_000)).toBe("2 minutes");
  });
});
