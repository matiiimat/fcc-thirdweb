interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
}

class LocalCache {
  private static instance: LocalCache;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  private constructor() {
    // Clean up expired cache entries every minute
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  public static getInstance(): LocalCache {
    if (!LocalCache.instance) {
      LocalCache.instance = new LocalCache();
    }
    return LocalCache.instance;
  }

  private getFullKey(key: string): string {
    return `game_cache_${key}`;
  }

  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    if (typeof window === 'undefined') return;

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(
        this.getFullKey(key),
        JSON.stringify(entry)
      );
    } catch (error) {
      console.error('Cache write error:', error);
      this.cleanup(); // Try to free up space
    }
  }

  get<T>(key: string, options: CacheOptions = {}): T | null {
    if (typeof window === 'undefined') return null;

    const ttl = options.ttl || this.defaultTTL;
    const fullKey = this.getFullKey(key);

    try {
      const item = localStorage.getItem(fullKey);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();

      if (now - entry.timestamp > ttl) {
        localStorage.removeItem(fullKey);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.getFullKey(key));
  }

  private cleanup(): void {
    if (typeof window === 'undefined') return;

    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('game_cache_')) {
          const item = localStorage.getItem(key);
          if (item) {
            const entry: CacheEntry<unknown> = JSON.parse(item);
            if (now - entry.timestamp > this.defaultTTL) {
              keysToRemove.push(key);
            }
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }
}

// Cache keys
export const CACHE_KEYS = {
  PLAYER: (id: string) => `player_${id}`,
  LEADERBOARD: 'leaderboard',
  PLAYER_STATS: (id: string) => `player_stats_${id}`,
};

// Export singleton instance
export const cache = LocalCache.getInstance();