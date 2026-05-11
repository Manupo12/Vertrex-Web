import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { identifier } = await params;

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.identifier, identifier))
    .limit(1);

  if (!task) return new Response("Task not found", { status: 404 });

  redirect(`/os/projects/${task.projectId}/tasks/${task.id}`);
}
