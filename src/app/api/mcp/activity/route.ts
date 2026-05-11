import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activity } from "@/lib/db/schema";
import { gt } from "drizzle-orm";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

const ratelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
}) : null;

const rateLimitCache = new Map<string, { count: number; timestamp: number }>();
const MAX_REQUESTS = 100;
const WINDOW_MS = 60000;

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  } else {
    const now = Date.now();
    const rateLimitInfo = rateLimitCache.get(ip) || { count: 0, timestamp: now };
    if (now - rateLimitInfo.timestamp > WINDOW_MS) {
      rateLimitInfo.count = 1;
      rateLimitInfo.timestamp = now;
    } else {
      rateLimitInfo.count += 1;
    }
    rateLimitCache.set(ip, rateLimitInfo);
    if (rateLimitInfo.count > MAX_REQUESTS) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const expectedToken = process.env.MCP_SECRET;

  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sinceParam = request.nextUrl.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 24 * 60 * 60 * 1000);

  const entries = await db
    .select()
    .from(activity)
    .where(gt(activity.createdAt, since))
    .orderBy(activity.createdAt);

  return NextResponse.json({
    activity: entries.map(e => ({
      id: e.id,
      actorType: e.actorType,
      actorId: e.actorId,
      verb: e.verb,
      targetType: e.targetType,
      targetId: e.targetId,
      payload: e.payload,
      createdAt: e.createdAt.toISOString(),
    })),
    since: since.toISOString(),
    now: new Date().toISOString(),
  });
}
