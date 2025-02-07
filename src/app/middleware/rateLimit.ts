import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

export async function rateLimit(windowMs = 60000, maxRequests = 30) {
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  const walletAddress = headersList.get('x-wallet-address') || 'unknown';
  
  // Use combination of IP and wallet address as key
  const key = `${ip}:${walletAddress}`;
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  if (!entry || entry.resetTime <= now) {
    entry = {
      count: 0,
      resetTime: now + windowMs
    };
  }

  // Increment request count
  entry.count++;
  rateLimitStore.set(key, entry);

  // Check if rate limit exceeded
  if (entry.count > maxRequests) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    return {
      error: NextResponse.json(
        {
          error: 'Too many requests',
          resetIn: `${resetIn} seconds`
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetIn.toString()
          }
        }
      )
    };
  }

  return { success: true };
}

// Different rate limits for different actions
export const rateLimits = {
  train: () => rateLimit(60000, 30), // 30 requests per minute
  work: () => rateLimit(60000, 30),  // 30 requests per minute
  store: () => rateLimit(60000, 20), // 20 requests per minute
  invest: () => rateLimit(60000, 20), // 20 requests per minute
  leaderboard: () => rateLimit(60000, 60), // 60 requests per minute
};