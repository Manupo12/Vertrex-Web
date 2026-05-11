import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";

export async function getProjectsForPicker() {
  return db.select({ id: projects.id, name: projects.name, status: projects.status }).from(projects).orderBy(projects.createdAt);
}
