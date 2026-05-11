import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
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

  return NextResponse.json({
    status: 501,
    message: "MCP Intent not yet implemented",
    expected_payload: {
      intent: "create_task | move_task | comment",
      payload: { "...": "..." },
    },
    docs: "See vertrex-os-v3-tasks-linear-spec.md §8",
  }, { status: 501 });
}
