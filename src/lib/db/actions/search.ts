"use server";

import { db } from "@/lib/db";
import { ilike, or, and, eq, gt, lte, gte, inArray } from "drizzle-orm";
import { 
  clients, projects, documents, legalDocuments, knowledgeNotes, resources, finances, 
  agendaEvents, repositories, links, socialAccounts, users, tickets,
  tasks, cycles, milestones, tags
} from "@/lib/db/schema";
import type { EntityType } from "@/lib/db/actions/graph-types";
import { getOsSession } from "@/lib/auth/session";

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
    const foundClients = await db.select().from(clients).where(or(ilike(clients.name, q), ilike(clients.slug, q))).limit(10);
    for (const c of foundClients) results.push({ id: c.id, label: c.name, subtitle: `Cliente (${c.slug})`, type: "client", href: `/os/crm/${c.slug}` });

    const foundProjects = await db.select().from(projects).where(ilike(projects.name, q)).limit(10);
    for (const p of foundProjects) results.push({ id: p.id, label: p.name, subtitle: `Proyecto (${p.status})`, type: "project", href: `/os/projects/${p.id}` });

    const foundDocs = await db.select().from(documents).where(ilike(documents.name, q)).limit(10);
    for (const d of foundDocs) results.push({ id: d.id, label: d.name, subtitle: `Documento`, type: "document", href: `/os/documents/${d.id}` });

    const foundLegal = await db.select().from(legalDocuments).where(ilike(legalDocuments.name, q)).limit(10);
    for (const l of foundLegal) results.push({ id: l.id, label: l.name, subtitle: `Legal (${l.type})`, type: "legal", href: `/os/legal/${l.id}` });

    const foundNotes = await db.select().from(knowledgeNotes).where(ilike(knowledgeNotes.title, q)).limit(10);
    for (const n of foundNotes) results.push({ id: n.id, label: n.title, subtitle: n.type === "software_idea" ? "Idea" : "Nota", type: n.type === "software_idea" ? "idea" : "note", href: `/os/hub/${n.id}` });

    const foundResources = await db.select().from(resources).where(ilike(resources.title, q)).limit(10);
    for (const r of foundResources) results.push({ id: r.id, label: r.title, subtitle: `Recurso (${r.type})`, type: "resource", href: `/os/resources/${r.id}` });

    const foundFinances = await db.select().from(finances).where(ilike(finances.concept, q)).limit(10);
    for (const f of foundFinances) results.push({ id: f.id, label: f.concept, subtitle: `Finanza (${f.type})`, type: "finance", href: `/os/finances/${f.id}` });

    const foundEvents = await db.select().from(agendaEvents).where(ilike(agendaEvents.title, q)).limit(10);
    for (const e of foundEvents) results.push({ id: e.id, label: e.title, subtitle: `Evento`, type: "agenda", href: `/os/agenda` });

    const foundRepos = await db.select().from(repositories).where(or(ilike(repositories.repoName, q), ilike(repositories.savedReason, q))).limit(10);
    for (const r of foundRepos) results.push({ id: r.id, label: `${r.owner}/${r.repoName}`, subtitle: `Repositorio GitHub`, type: "repository", href: `/os/links/${r.id}` });

    const foundLinks = await db.select().from(links).where(or(ilike(links.title, q), ilike(links.url, q))).limit(10);
    for (const l of foundLinks) results.push({ id: l.id, label: l.title || l.url, subtitle: `Link (${l.type})`, type: "link", href: `/os/links/${l.id}` });

    const foundSocial = await db.select().from(socialAccounts).where(or(ilike(socialAccounts.handle, q), ilike(socialAccounts.platform, q))).limit(10);
    for (const s of foundSocial) results.push({ id: s.id, label: s.handle, subtitle: `Red Social (${s.platform})`, type: "social_account", href: `/os/marketing/${s.id}` });

    const foundUsers = await db.select().from(users).where(or(ilike(users.name, q), ilike(users.email, q))).limit(10);
    for (const u of foundUsers) results.push({ id: u.id, label: u.name, subtitle: `Equipo (${u.role})`, type: "team_member", href: `/os/team/${u.id}` });

    const foundTickets = await db.select().from(tickets).where(ilike(tickets.title, q)).limit(10);
    for (const t of foundTickets) results.push({ id: t.id, label: t.title, subtitle: `Ticket (${t.status})`, type: "ticket", href: `/os/crm` });

    const foundCycles = await db.select().from(cycles).where(ilike(cycles.name, q)).limit(5);
    for (const c of foundCycles) results.push({ id: c.id, label: c.name, subtitle: `Ciclo (${c.status})`, type: "cycle", href: `/os/projects/${c.projectId}/cycles/${c.id}` });

    const foundMilestones = await db.select().from(milestones).where(ilike(milestones.name, q)).limit(5);
    for (const m of foundMilestones) results.push({ id: m.id, label: m.name, subtitle: `Hito (${m.status})`, type: "milestone", href: `/os/projects/${m.projectId}/milestones` });
    
    const foundTags = await db.select().from(tags).where(ilike(tags.label, q)).limit(5);
    for (const t of foundTags) results.push({ id: t.id, label: t.label, subtitle: `Etiqueta`, type: "tag", href: `#` });
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
