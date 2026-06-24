"use server";

import { db } from "@/lib/db";
import { ilike, or, and, eq, gt, lte, gte, inArray } from "drizzle-orm";
import { tasks, projects } from "@/lib/db/schema";
import type { EntityType } from "@/lib/db/actions/graph-types";
import { getOsSession } from "@/lib/auth/session";
import { listSearchableDescriptors } from "@/lib/entities/registry";

export type SearchResult = {
  id: string;
  label: string;
  subtitle: string;
  type: EntityType;
  href: string;
};

export async function searchEntitiesAction(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const q = `%${query.trim()}%`;
  const results: SearchResult[] = [];

  const isTaskSearch = query.includes("is:task");
  
  if (!isTaskSearch) {
    const descriptors = listSearchableDescriptors();
    for (const desc of descriptors) {
      const ilikes = desc.searchColumns.map(col => ilike(col, q));
      const searchCondition = ilikes.length > 1 ? or(...ilikes) : ilikes[0];
      const whereClause = desc.where ? and(searchCondition, desc.where(desc.table)) : searchCondition;
      
      const foundRows = await db
        .select()
        .from(desc.table)
        .where(whereClause)
        .limit(desc.limit || 10);

      for (const row of foundRows) {
        results.push({
          id: row.id,
          type: desc.type,
          ...desc.toDisplay(row),
        });
      }
    }
  }

  let cleanQ = query.replace(/is:task/g, "").trim();
  const session = await getOsSession();
  const conditions: any[] = [];

  const assigneeMatch = cleanQ.match(/assignee:(\w+)/);
  if (assigneeMatch) {
    if (assigneeMatch[1] === "me" && session) {
      conditions.push(eq(tasks.assigneeId, session.userId));
    }
    cleanQ = cleanQ.replace(/assignee:\w+/g, "").trim();
  }

  const priorityMatch = cleanQ.match(/priority:(\w+)/);
  if (priorityMatch) {
    const level = priorityMatch[1];
    if (level === "high") conditions.push(lte(tasks.priority, 2));
    else if (level === "medium") conditions.push(eq(tasks.priority, 3));
    else if (level === "low") conditions.push(gte(tasks.priority, 4));
    cleanQ = cleanQ.replace(/priority:\w+/g, "").trim();
  }

  const stateMatch = cleanQ.match(/state:(\w+)/);
  if (stateMatch) {
    conditions.push(eq(tasks.state, stateMatch[1]));
    cleanQ = cleanQ.replace(/state:\w+/g, "").trim();
  }

  const projectMatch = cleanQ.match(/project:(\w+)/);
  if (projectMatch) {
    const projectKey = projectMatch[1];
    const [proj] = await db.select().from(projects).where(eq(projects.name, projectKey)).limit(1);
    if (proj) conditions.push(eq(tasks.projectId, proj.id));
    cleanQ = cleanQ.replace(/project:\w+/g, "").trim();
  }

  const dueMatch = cleanQ.match(/due:<(\d+)d/);
  if (dueMatch) {
    const days = parseInt(dueMatch[1], 10);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    conditions.push(lte(tasks.dueDate, futureDate));
    conditions.push(gt(tasks.dueDate, new Date()));
    cleanQ = cleanQ.replace(/due:<(\d+)d/g, "").trim();
  }

  cleanQ = cleanQ.trim();
  const taskQ = `%${cleanQ}%`;

  if (cleanQ.length >= 2 || isTaskSearch) {
    const textCondition = or(ilike(tasks.title, taskQ), ilike(tasks.identifier, taskQ));
    const whereClause = conditions.length > 0 ? and(...conditions, textCondition) : textCondition;
    const foundTasks = await db.select().from(tasks).where(whereClause).limit(15);
    for (const t of foundTasks) {
      results.push({ id: t.id, label: t.title, subtitle: `Tarea (${t.identifier})`, type: "task", href: `/t/${t.identifier}` });
    }
  }

  return results.slice(0, 20);
}
