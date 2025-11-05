/**
 * Rate limiting utility for authentication attempts
 * Prevents brute force attacks by limiting login/registration attempts
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs: number; // How long to block after max attempts
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5, // 5 attempts
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // 30 minutes
};

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanup();
  }

  /**
   * Start periodic cleanup of old entries
   */
  private startCleanup(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.storage.entries()) {
        // Remove entries that are old and not blocked
        if (!entry.blockedUntil && now - entry.firstAttempt > this.config.windowMs) {
          this.storage.delete(key);
        }
        // Remove entries where block has expired
        if (entry.blockedUntil && now > entry.blockedUntil) {
          this.storage.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get storage key for identifier
   */
  private getKey(identifier: string, action: string): string {
    return `${action}:${identifier.toLowerCase()}`;
  }

  /**
   * Check if action is allowed for identifier
   */
  isAllowed(identifier: string, action: string = 'login'): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    blockedUntil?: number;
  } {
    const key = this.getKey(identifier, action);
    const now = Date.now();
    const entry = this.storage.get(key);

    // No previous attempts
    if (!entry) {
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
        resetAt: now + this.config.windowMs,
      };
    }

    // Currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        blockedUntil: entry.blockedUntil,
      };
    }

    // Block period expired, reset
    if (entry.blockedUntil && now >= entry.blockedUntil) {
      this.storage.delete(key);
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
        resetAt: now + this.config.windowMs,
      };
    }

    // Time window expired, reset
    if (now - entry.firstAttempt > this.config.windowMs) {
      this.storage.delete(key);
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
        resetAt: now + this.config.windowMs,
      };
    }

    // Within time window
    const remaining = this.config.maxAttempts - entry.attempts;
    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
      resetAt: entry.firstAttempt + this.config.windowMs,
    };
  }

  /**
   * Record an attempt
   */
  recordAttempt(identifier: string, action: string = 'login'): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    blockedUntil?: number;
  } {
    const key = this.getKey(identifier, action);
    const now = Date.now();
    const entry = this.storage.get(key);

    if (!entry) {
      // First attempt
      this.storage.set(key, {
        attempts: 1,
        firstAttempt: now,
      });
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
        resetAt: now + this.config.windowMs,
      };
    }

    // Time window expired, reset
    if (now - entry.firstAttempt > this.config.windowMs) {
      this.storage.set(key, {
        attempts: 1,
        firstAttempt: now,
      });
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
        resetAt: now + this.config.windowMs,
      };
    }

    // Increment attempts
    entry.attempts++;

    // Check if we've hit the limit
    if (entry.attempts >= this.config.maxAttempts) {
      entry.blockedUntil = now + this.config.blockDurationMs;
      this.storage.set(key, entry);
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        blockedUntil: entry.blockedUntil,
      };
    }

    this.storage.set(key, entry);
    return {
      allowed: true,
      remaining: this.config.maxAttempts - entry.attempts,
      resetAt: entry.firstAttempt + this.config.windowMs,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string, action: string = 'login'): void {
    const key = this.getKey(identifier, action);
    this.storage.delete(key);
  }
}

// Create singleton instance
export const authRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // 30 minutes block
});

// Helper function to format time remaining
export function formatTimeRemaining(ms: number): string {
  const minutes = Math.ceil(ms / (60 * 1000));
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}
