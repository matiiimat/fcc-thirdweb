import NodeCache from 'node-cache';

// Cache with default TTL of 5 minutes and check period of 10 minutes
const cache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

export const CACHE_KEYS = {
  PLAYER: (id: string) => `player_${id}`,
  PLAYER_BY_ADDRESS: (address: string) => `player_addr_${address.toLowerCase()}`,
  TEAM: (id: string) => `team_${id}`,
  TEAM_BY_NAME: (name: string) => `team_name_${name}`,
  LEADERBOARD: 'leaderboard',
  TEAM_LEADERBOARD: 'team_leaderboard',
  MATCHES: 'matches',
  TEAM_MATCHES: (teamId: string) => `team_matches_${teamId}`,
  PLAYER_MATCHES: (playerId: string) => `player_matches_${playerId}`,
  SEASON: (id: string) => `season_${id}`,
  CURRENT_SEASON: 'current_season',
};

// Helper functions for common cache operations
export function getFromCache<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function setInCache<T>(key: string, value: T, ttl?: number): boolean {
  if (ttl !== undefined) {
    return cache.set(key, value, ttl);
  }
  return cache.set(key, value);
}

export function removeFromCache(key: string): number {
  return cache.del(key);
}

export function flushCache(): void {
  cache.flushAll();
}

export function invalidatePlayerCache(playerId: string, ethAddress?: string): void {
  cache.del(CACHE_KEYS.PLAYER(playerId));
  if (ethAddress) {
    cache.del(CACHE_KEYS.PLAYER_BY_ADDRESS(ethAddress));
  }
  // Also invalidate leaderboard since player stats might have changed
  cache.del(CACHE_KEYS.LEADERBOARD);
}

export function invalidateTeamCache(teamId: string, teamName?: string): void {
  cache.del(CACHE_KEYS.TEAM(teamId));
  if (teamName) {
    cache.del(CACHE_KEYS.TEAM_BY_NAME(teamName));
  }
  // Also invalidate team leaderboard
  cache.del(CACHE_KEYS.TEAM_LEADERBOARD);
}

export default cache;