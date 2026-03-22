export class TokenBucket {
  private lastRefillTime: number;
  private tokens: number;

  constructor(
    private readonly capacity: number,
    private readonly refillRateMs: number,
  ) {
    this.tokens = capacity;
    this.lastRefillTime = Date.now();
  }

  consume(): boolean {
    this.refill();

    if (this.tokens < 1) {
      return false;
    }

    this.tokens -= 1;

    return true;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;
    const tokensToAdd = Math.floor(elapsed / this.refillRateMs);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefillTime = now;
    }
  }
}
