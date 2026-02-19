import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

const MAX_REQUESTS = 60;
const WINDOW_MS = 60_000; // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60_000; // 5 minutes

interface Entry {
  timestamps: number[];
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, Entry>();

  constructor() {
    // Periodically purge stale entries to prevent memory leaks
    setInterval(() => {
      const cutoff = Date.now() - WINDOW_MS;
      for (const [key, entry] of this.store) {
        entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
        if (entry.timestamps.length === 0) this.store.delete(key);
      }
    }, CLEANUP_INTERVAL_MS).unref();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip: string = request.ip ?? request.socket?.remoteAddress ?? 'unknown';
    const now = Date.now();
    const cutoff = now - WINDOW_MS;

    let entry = this.store.get(ip);
    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(ip, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

    if (entry.timestamps.length >= MAX_REQUESTS) {
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    entry.timestamps.push(now);
    return true;
  }
}
