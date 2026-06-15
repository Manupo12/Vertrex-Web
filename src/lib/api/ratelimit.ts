import "server-only";
import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

const limiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, "60 s"), analytics: true })
  : null;

const mem = new Map<string, { count: number; ts: number }>();

export async function rateLimit(req: NextRequest): Promise<{ ok: boolean }> {
  const key = req.headers.get("authorization") || req.headers.get("x-forwarded-for") || "unknown";
  if (limiter) {
    const r = await limiter.limit(key);
    return { ok: r.success };
  }
  const now = Date.now();
  const info = mem.get(key) || { count: 0, ts: now };
  if (now - info.ts > 60000) {
    info.count = 1;
    info.ts = now;
  } else {
    info.count += 1;
  }
  mem.set(key, info);
  return { ok: info.count <= 100 };
}
