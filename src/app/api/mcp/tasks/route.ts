import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, projects, cycles, users, entityLinks } from "@/lib/db/schema";
import { eq, and, desc, sql, like, gt } from "drizzle-orm";
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
  const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const allTasks = await db.select().from(tasks).where(gt(tasks.updatedAt, since));

  const projectIds = [...new Set(allTasks.map(t => t.projectId).filter(Boolean) as string[])];
  const cycleIds = [...new Set(allTasks.map(t => t.cycleId).filter(Boolean) as string[])];
  const assigneeIds = [...new Set(allTasks.map(t => t.assigneeId).filter(Boolean) as string[])];

  const [allProjects, allCycles, allUsers, allLinks] = await Promise.all([
    projectIds.length ? db.select().from(projects).where(sql`${projects.id} = ANY(ARRAY[${sql.join(projectIds.map(id => sql`${id}::uuid`), sql`, `)}])`) : Promise.resolve([] as typeof projects.$inferSelect[]),
    cycleIds.length ? db.select().from(cycles).where(sql`${cycles.id} = ANY(ARRAY[${sql.join(cycleIds.map(id => sql`${id}::uuid`), sql`, `)}])`) : Promise.resolve([] as typeof cycles.$inferSelect[]),
    assigneeIds.length ? db.select().from(users).where(sql`${users.id} = ANY(ARRAY[${sql.join(assigneeIds.map(id => sql`${id}::uuid`), sql`, `)}])`) : Promise.resolve([] as typeof users.$inferSelect[]),
    db.select().from(entityLinks).where(
      and(
        sql`${entityLinks.sourceType} = 'task'`,
        sql`${entityLinks.sourceId} = ANY(ARRAY[${sql.join(allTasks.map(t => sql`${t.id}::uuid`), sql`, `)}])`
      )
    ),
  ]);

  const projectMap = new Map(allProjects.map(p => [p.id, p]));
  const cycleMap = new Map(allCycles.map(c => [c.id, c]));
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  const blocksMap = new Map<string, string[]>();
  const blockedByMap = new Map<string, string[]>();
  for (const link of allLinks) {
    if (link.relationType === "blocks") {
      if (!blocksMap.has(link.sourceId)) blocksMap.set(link.sourceId, []);
      blocksMap.get(link.sourceId)!.push(link.targetId);
      if (!blockedByMap.has(link.targetId)) blockedByMap.set(link.targetId, []);
      blockedByMap.get(link.targetId)!.push(link.sourceId);
    }
  }

  const subtaskCounts = new Map<string, number>();
  for (const task of allTasks) {
    if (task.parentTaskId) {
      subtaskCounts.set(task.parentTaskId, (subtaskCounts.get(task.parentTaskId) || 0) + 1);
    }
  }

  const result = allTasks.map(task => {
    const projectData = task.projectId ? projectMap.get(task.projectId) : null;
    const cycleData = task.cycleId ? cycleMap.get(task.cycleId) : null;
    const assigneeData = task.assigneeId ? userMap.get(task.assigneeId) : null;

    return {
      id: task.id,
      identifier: task.identifier,
      title: task.title,
      project: projectData ? { id: projectData.id, key: projectData.projectKey, name: projectData.name } : null,
      state: task.state,
      priority: task.priority,
      assignee: assigneeData ? { id: assigneeData.id, name: assigneeData.name } : null,
      cycle: cycleData ? { id: cycleData.id, name: cycleData.name } : null,
      milestone: task.milestoneId,
      due_date: task.dueDate?.toISOString() ?? null,
      subtasks_count: subtaskCounts.get(task.id) || 0,
      blocks: blocksMap.get(task.id) || [],
      blocked_by: blockedByMap.get(task.id) || [],
      updated_at: task.updatedAt.toISOString(),
    };
  });

  return NextResponse.json({
    tasks: result,
    since: since.toISOString(),
    now: new Date().toISOString(),
  });
}
