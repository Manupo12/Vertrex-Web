"use server";

import { db } from "@/lib/db";
import { ilike, or } from "drizzle-orm";
import { clients, projects, documents, legalDocuments, knowledgeNotes, resources, finances, agendaEvents, repositories, links, socialAccounts, users, tickets } from "@/lib/db/schema";
import type { EntityType } from "@/lib/db/actions/graph-types";

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

  return results.slice(0, 20);
}
