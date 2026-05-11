import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, projects, entityLinks } from "@/lib/db/schema";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Upstash rate limiting
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

const ratelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
}) : null;

// Basic in-memory fallback for local dev or if redis is not configured
const rateLimitCache = new Map<string, { count: number; timestamp: number }>();
const MAX_REQUESTS = 100;
const WINDOW_MS = 60000;

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      console.warn(`[MCP] Rate limit exceeded for IP: ${ip} (Upstash)`);
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  } else {
    // Fallback to in-memory
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
      console.warn(`[MCP] Rate limit exceeded for IP: ${ip} (In-memory)`);
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const expectedToken = process.env.MCP_SECRET;
  
  if (!expectedToken || token !== expectedToken) {
    console.warn(`[MCP] Unauthorized access attempt from IP: ${ip}`);
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [allClients, allProjects, allLinks] = await Promise.all([
    db.select().from(clients),
    db.select({ id: projects.id, name: projects.name, status: projects.status, progress: projects.progress, currentVersion: projects.currentVersion }).from(projects),
    db.select().from(entityLinks),
  ]);

  return NextResponse.json({
    clients: allClients,
    projects: allProjects,
    entity_links: allLinks,
    timestamp: new Date().toISOString(),
  });
}
