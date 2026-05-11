"use server";

import { and, eq, or, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { entityLinks } from "@/lib/db/schema";
import type { EntityType } from "@/lib/db/actions/graph-types";
import { SearchResult } from "@/lib/db/actions/search";
import { clients, projects, documents, legalDocuments, knowledgeNotes, resources, finances, agendaEvents, repositories, links, socialAccounts, users, tickets } from "@/lib/db/schema";
import { requireOsUser } from "@/lib/auth/session";

export async function linkEntities(
  sourceId: string,
  sourceType: EntityType,
  targetId: string,
  targetType: EntityType,
  relationType = "relates_to"
) {
  await requireOsUser();
  if (sourceId === targetId && sourceType === targetType) throw new Error("No se puede conectar una entidad consigo misma");

  const [existing] = await db
    .select()
    .from(entityLinks)
    .where(
      or(
        and(
          eq(entityLinks.sourceId, sourceId),
          eq(entityLinks.sourceType, sourceType),
          eq(entityLinks.targetId, targetId),
          eq(entityLinks.targetType, targetType)
        ),
        and(
          eq(entityLinks.sourceId, targetId),
          eq(entityLinks.sourceType, targetType),
          eq(entityLinks.targetId, sourceId),
          eq(entityLinks.targetType, sourceType)
        )
      )
    )
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(entityLinks)
    .values({ sourceId, sourceType, targetId, targetType, relationType })
    .returning();

  return created;
}

export async function unlinkEntity(linkId: string) {
  await requireOsUser();
  await db.delete(entityLinks).where(eq(entityLinks.id, linkId));
}

export async function getEntityConnections(entityId: string) {
  await requireOsUser();
  return db
    .select()
    .from(entityLinks)
    .where(or(eq(entityLinks.sourceId, entityId), eq(entityLinks.targetId, entityId)));
}

export async function getGraphSnapshot() {
  await requireOsUser();
  return db.select().from(entityLinks);
}

export type ResolvedConnection = SearchResult & { linkId: string; relationType: string; isSource: boolean };

export async function getResolvedEntityConnections(entityId: string): Promise<ResolvedConnection[]> {
  await requireOsUser();
  const connections = await getEntityConnections(entityId);
  if (connections.length === 0) return [];

  const targetsByType: Record<string, { id: string; linkId: string; relationType: string; isSource: boolean }[]> = {};

  for (const c of connections) {
    const isSource = c.sourceId === entityId;
    const targetId = isSource ? c.targetId : c.sourceId;
    const targetType = isSource ? c.targetType : c.sourceType;

    if (!targetsByType[targetType]) targetsByType[targetType] = [];
    targetsByType[targetType].push({ id: targetId, linkId: c.id, relationType: c.relationType, isSource });
  }

  const resolved: ResolvedConnection[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolveType = async (type: string, table: any, mapper: (row: any) => Pick<SearchResult, "label" | "subtitle" | "href">) => {
    if (!targetsByType[type] || targetsByType[type].length === 0) return;
    const ids = targetsByType[type].map(t => t.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await db.select().from(table as any).where(inArray((table as any).id, ids));
    for (const row of rows) {
      const targetData = targetsByType[type].find(t => t.id === row.id);
      if (targetData) {
        resolved.push({
          id: row.id,
          type: type as EntityType,
          linkId: targetData.linkId,
          relationType: targetData.relationType,
          isSource: targetData.isSource,
          ...mapper(row)
        });
      }
    }
  };

  await Promise.all([
    resolveType("client", clients, c => ({ label: c.name, subtitle: `Cliente (${c.slug})`, href: `/os/crm/${c.slug}` })),
    resolveType("project", projects, p => ({ label: p.name, subtitle: `Proyecto (${p.status})`, href: `/os/projects/${p.id}` })),
    resolveType("document", documents, d => ({ label: d.name, subtitle: `Documento`, href: `/os/documents/${d.id}` })),
    resolveType("legal", legalDocuments, l => ({ label: l.name, subtitle: `Legal (${l.type})`, href: `/os/legal/${l.id}` })),
    resolveType("idea", knowledgeNotes, n => ({ label: n.title, subtitle: `Idea`, href: `/os/hub/${n.id}` })),
    resolveType("note", knowledgeNotes, n => ({ label: n.title, subtitle: `Nota`, href: `/os/hub/${n.id}` })),
    resolveType("resource", resources, r => ({ label: r.title, subtitle: `Recurso (${r.type})`, href: `/os/resources/${r.id}` })),
    resolveType("finance", finances, f => ({ label: f.concept, subtitle: `Finanza (${f.type})`, href: `/os/finances/${f.id}` })),
    resolveType("agenda", agendaEvents, e => ({ label: e.title, subtitle: `Evento`, href: `/os/agenda` })),
    resolveType("repository", repositories, r => ({ label: `${r.owner}/${r.repoName}`, subtitle: `Repositorio GitHub`, href: `/os/links/${r.id}` })),
    resolveType("link", links, l => ({ label: l.title || l.url, subtitle: `Link (${l.type})`, href: `/os/links/${l.id}` })),
    resolveType("social_account", socialAccounts, s => ({ label: s.handle, subtitle: `Red Social (${s.platform})`, href: `/os/marketing/${s.id}` })),
    resolveType("team_member", users, u => ({ label: u.name, subtitle: `Equipo (${u.role})`, href: `/os/team/${u.id}` })),
    resolveType("ticket", tickets, t => ({ label: t.title, subtitle: `Ticket (${t.status})`, href: `/os/crm` })),
  ]);

  return resolved;
}
