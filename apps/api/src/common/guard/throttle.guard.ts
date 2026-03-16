import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { Socket } from 'socket.io';

/**
 * Configuration for different event types
 */
const RATE_LIMITS = {
  // General events: 20 per second
  default: { points: 20, duration: 1 },

  // Answer submission: 2 per second (prevent spam answers)
  answer: { points: 2, duration: 1 },

  // Room creation: 3 per minute (prevent room spam)
  roomCreate: { points: 3, duration: 60 },

  // Power-ups: 1 per second
  powerup: { points: 1, duration: 1 },
} as const;

@Injectable()
export class ThrottleGuard implements CanActivate {
  private readonly logger = new Logger(ThrottleGuard.name);
  private readonly limiters = new Map<string, RateLimiterMemory>();

  constructor() {
    // Initialize limiters for each type
    Object.entries(RATE_LIMITS).forEach(([key, config]) => {
      this.limiters.set(
        key,
        new RateLimiterMemory({
          points: config.points,
          duration: config.duration,
        }),
      );
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const pattern = this.getEventPattern(context);

    // Get appropriate limiter
    const limiterKey = this.getLimiterKey(pattern);
    const limiter = this.limiters.get(limiterKey) || this.limiters.get('default')!;

    // Use socket ID as key
    const key = `ws:${client.id}`;

    try {
      await limiter.consume(key);
      return true;
    } catch (rateLimiterRes) {
      const res = rateLimiterRes as RateLimiterRes;
      const retryAfter = Math.ceil(res.msBeforeNext / 1000);

      this.logger.warn(
        `Rate limit exceeded for socket ${client.id} on ${pattern}. Retry after ${retryAfter}s`,
      );

      throw new WsException({
        message: 'Trop de requêtes. Ralentis un peu ! 🐌',
        retryAfter,
        type: 'RATE_LIMIT_EXCEEDED',
      });
    }
  }

  private getEventPattern(context: ExecutionContext): string {
    const handler = context.getHandler();
    return handler.name || 'unknown';
  }

  private getLimiterKey(pattern: string): string {
    if (pattern.includes('answer') || pattern.includes('Answer')) {
      return 'answer';
    }
    if (pattern.includes('create') || pattern.includes('Create')) {
      return 'roomCreate';
    }
    if (pattern.includes('powerup') || pattern.includes('PowerUp')) {
      return 'powerup';
    }
    return 'default';
  }

  /**
   * 🆕 Get current rate limit status for a client (useful for debugging)
   */
  async getRateLimitStatus(socketId: string, limiterKey: string = 'default') {
    const limiter = this.limiters.get(limiterKey);
    if (!limiter) return null;

    const key = `ws:${socketId}`;
    try {
      const res = await limiter.get(key);
      return {
        consumed: res?.consumedPoints || 0,
        remaining:
          res?.remainingPoints || RATE_LIMITS[limiterKey as keyof typeof RATE_LIMITS].points,
        resetAt: res?.msBeforeNext ? Date.now() + res.msBeforeNext : null,
      };
    } catch {
      return null;
    }
  }
}
