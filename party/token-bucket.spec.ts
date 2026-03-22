import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TokenBucket } from "./token-bucket";

describe("TokenBucket", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return true when tokens are available within burst capacity", () => {
    const bucket = new TokenBucket(3, 3000);

    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(true);
  });

  it("should return false when bucket is empty", () => {
    const bucket = new TokenBucket(3, 3000);

    bucket.consume();
    bucket.consume();
    bucket.consume();

    expect(bucket.consume()).toBe(false);
  });

  it("should refill a token after the refill interval elapses", () => {
    const bucket = new TokenBucket(3, 3000);

    bucket.consume();
    bucket.consume();
    bucket.consume();

    expect(bucket.consume()).toBe(false);

    vi.advanceTimersByTime(3000);

    expect(bucket.consume()).toBe(true);
  });

  it("should not exceed capacity when refilling", () => {
    const bucket = new TokenBucket(3, 3000);

    vi.advanceTimersByTime(30_000);

    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(false);
  });

  it("should refill multiple tokens proportional to elapsed time", () => {
    const bucket = new TokenBucket(3, 3000);

    bucket.consume();
    bucket.consume();
    bucket.consume();

    vi.advanceTimersByTime(9000);

    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(false);
  });
});
