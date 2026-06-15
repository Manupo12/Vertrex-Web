import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { createProjectAction, updateProjectAction, getProjectById } from "@/lib/db/actions/projects";
import { createProjectSchema, updateProjectSchema } from "@/lib/validation/v1/projects";
import { jsonToFormData } from "@/lib/api/form";
import { ApiError } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";

export const GET = authed(async ({ req, session }) => {
  await assertPermission(session, "projects", "read");
  const sp = new URL(req.url).searchParams;
  const limit = Number(sp.get("limit") || 100);
  return db.select().from(projects).orderBy(desc(projects.createdAt)).limit(limit);
});

export const POST = authed(async ({ req, session }) => {
  await assertPermission(session, "projects", "write");
  const parsed = createProjectSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError("bad_request", 400, "Datos inválidos", parsed.error.flatten());
  return createProjectAction(jsonToFormData(parsed.data as Record<string, unknown>));
});
