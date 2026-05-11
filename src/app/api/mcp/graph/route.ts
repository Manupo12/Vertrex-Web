import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, projects, entityLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const expectedToken = process.env.MCP_SECRET;
  
  if (!expectedToken || token !== expectedToken) {
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
