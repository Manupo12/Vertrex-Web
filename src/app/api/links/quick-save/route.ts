import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { links, repositories } from "@/lib/db/schema";
import { parseGitHubUrl, fetchGitHubRepo, fetchOpenGraph } from "@/lib/links/service";

const rateLimitCache = new Map<string, { count: number; timestamp: number }>();
const MAX_REQUESTS = 20;
const WINDOW_MS = 60000;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

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

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const quickSaveToken = process.env.QUICK_SAVE_TOKEN;

  if (!quickSaveToken || token !== quickSaveToken) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { url, savedReason } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url es requerido" }, { status: 400 });
  }

  const githubInfo = parseGitHubUrl(url);

  if (githubInfo) {
    const repoData = await fetchGitHubRepo(url);
    const [saved] = await db
      .insert(repositories)
      .values({
        url: repoData.url,
        owner: repoData.owner,
        repoName: repoData.repoName,
        description: repoData.description,
        language: repoData.language,
        languageColor: repoData.languageColor,
        stars: repoData.stars,
        forks: repoData.forks,
        topics: repoData.topics,
        pushedAt: repoData.pushedAt,
        savedReason: savedReason || "quick-save",
      })
      .onConflictDoNothing()
      .returning();

    return NextResponse.json(saved, { status: 201 });
  }

  const ogData = await fetchOpenGraph(url);
  const [saved] = await db
    .insert(links)
    .values({
      url: ogData.url,
      title: ogData.title,
      description: ogData.description,
      imageUrl: ogData.imageUrl,
      type: ogData.type,
    })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json(saved, { status: 201 });
}
