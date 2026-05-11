import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getProjectsForPicker() {
  return db.select({ id: projects.id, name: projects.name, status: projects.status }).from(projects).orderBy(projects.createdAt);
}
