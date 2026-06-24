import { 
  clients, projects, documents, legalDocuments, knowledgeNotes, resources, finances, 
  agendaEvents, repositories, links, socialAccounts, users, tickets,
  tasks, cycles, milestones, tags
} from "@/lib/db/schema";
import type { EntityType } from "@/lib/db/actions/graph-types";
import { eq, ne } from "drizzle-orm";

export type EntityDisplay = { label: string; subtitle: string; href: string };

export type EntityDescriptor<TRow = any> = {
  type: EntityType;
  table: any;                 // tabla drizzle
  searchColumns: any[];       // columnas para ilike
  toDisplay: (row: TRow) => EntityDisplay;
  portalVisible?: boolean;    // usado en Fase 5
  where?: (table: any) => any; // filtro drizzle opcional
  limit?: number;             // límite en búsqueda genérica
};

export const ENTITY_REGISTRY: Record<string, EntityDescriptor> = {
  client: {
    type: "client",
    table: clients,
    searchColumns: [clients.name, clients.slug],
    toDisplay: (c: any) => ({
      label: c.name,
      subtitle: `Cliente (${c.slug})`,
      href: `/os/crm/${c.slug}`,
    }),
    limit: 10,
    portalVisible: true,
  },
  project: {
    type: "project",
    table: projects,
    searchColumns: [projects.name],
    toDisplay: (p: any) => ({
      label: p.name,
      subtitle: `Proyecto (${p.status})`,
      href: `/os/projects/${p.id}`,
    }),
    limit: 10,
    portalVisible: true,
  },
  document: {
    type: "document",
    table: documents,
    searchColumns: [documents.name],
    toDisplay: (d: any) => ({
      label: d.name,
      subtitle: "Documento",
      href: `/os/documents/${d.id}`,
    }),
    limit: 10,
    portalVisible: true,
  },
  legal: {
    type: "legal",
    table: legalDocuments,
    searchColumns: [legalDocuments.name],
    toDisplay: (l: any) => ({
      label: l.name,
      subtitle: `Legal (${l.type})`,
      href: `/os/legal/${l.id}`,
    }),
    limit: 10,
    portalVisible: true,
  },
  idea: {
    type: "idea",
    table: knowledgeNotes,
    searchColumns: [knowledgeNotes.title],
    where: (table: any) => eq(table.type, "software_idea"),
    toDisplay: (n: any) => ({
      label: n.title,
      subtitle: "Idea",
      href: `/os/hub/${n.id}`,
    }),
    limit: 10,
  },
  note: {
    type: "note",
    table: knowledgeNotes,
    searchColumns: [knowledgeNotes.title],
    where: (table: any) => ne(table.type, "software_idea"),
    toDisplay: (n: any) => ({
      label: n.title,
      subtitle: "Nota",
      href: `/os/hub/${n.id}`,
    }),
    limit: 10,
  },
  resource: {
    type: "resource",
    table: resources,
    searchColumns: [resources.title],
    toDisplay: (r: any) => ({
      label: r.title,
      subtitle: `Recurso (${r.type})`,
      href: `/os/resources/${r.id}`,
    }),
    limit: 10,
  },
  finance: {
    type: "finance",
    table: finances,
    searchColumns: [finances.concept],
    toDisplay: (f: any) => ({
      label: f.concept,
      subtitle: `Finanza (${f.type})`,
      href: `/os/finances/${f.id}`,
    }),
    limit: 10,
    portalVisible: true,
  },
  agenda: {
    type: "agenda",
    table: agendaEvents,
    searchColumns: [agendaEvents.title],
    toDisplay: (e: any) => ({
      label: e.title,
      subtitle: "Evento",
      href: `/os/agenda`,
    }),
    limit: 10,
  },
  repository: {
    type: "repository",
    table: repositories,
    searchColumns: [repositories.repoName, repositories.savedReason],
    toDisplay: (r: any) => ({
      label: `${r.owner}/${r.repoName}`,
      subtitle: "Repositorio GitHub",
      href: `/os/links/${r.id}`,
    }),
    limit: 10,
  },
  link: {
    type: "link",
    table: links,
    searchColumns: [links.title, links.url],
    toDisplay: (l: any) => ({
      label: l.title || l.url,
      subtitle: `Link (${l.type})`,
      href: `/os/links/${l.id}`,
    }),
    limit: 10,
  },
  social_account: {
    type: "social_account",
    table: socialAccounts,
    searchColumns: [socialAccounts.handle, socialAccounts.platform],
    toDisplay: (s: any) => ({
      label: s.handle,
      subtitle: `Red Social (${s.platform})`,
      href: `/os/marketing/${s.id}`,
    }),
    limit: 10,
  },
  team_member: {
    type: "team_member",
    table: users,
    searchColumns: [users.name, users.email],
    toDisplay: (u: any) => ({
      label: u.name,
      subtitle: `Equipo (${u.role})`,
      href: `/os/team/${u.id}`,
    }),
    limit: 10,
  },
  ticket: {
    type: "ticket",
    table: tickets,
    searchColumns: [tickets.title],
    toDisplay: (t: any) => ({
      label: t.title,
      subtitle: `Ticket (${t.status})`,
      href: "/os/crm",
    }),
    limit: 10,
    portalVisible: true,
  },
  task: {
    type: "task",
    table: tasks,
    searchColumns: [tasks.title, tasks.identifier],
    toDisplay: (t: any) => ({
      label: t.title,
      subtitle: `Tarea (${t.identifier})`,
      href: `/t/${t.identifier}`,
    }),
    limit: 15,
  },
  cycle: {
    type: "cycle",
    table: cycles,
    searchColumns: [cycles.name],
    toDisplay: (c: any) => ({
      label: c.name,
      subtitle: `Ciclo (${c.status})`,
      href: `/os/projects/${c.projectId}/cycles/${c.id}`,
    }),
    limit: 5,
  },
  milestone: {
    type: "milestone",
    table: milestones,
    searchColumns: [milestones.name],
    toDisplay: (m: any) => ({
      label: m.name,
      subtitle: `Hito (${m.status})`,
      href: `/os/projects/${m.projectId}/milestones`,
    }),
    limit: 5,
  },
  tag: {
    type: "tag",
    table: tags,
    searchColumns: [tags.label],
    toDisplay: (t: any) => ({
      label: t.label,
      subtitle: "Etiqueta",
      href: "#",
    }),
    limit: 5,
  },
};

export function getDescriptor(type: EntityType): EntityDescriptor | undefined {
  return ENTITY_REGISTRY[type];
}

export function listSearchableDescriptors(): EntityDescriptor[] {
  // Retorna todos los descriptores excepto 'task', ya que task se maneja con filtros específicos
  return Object.values(ENTITY_REGISTRY).filter(d => d.type !== "task");
}
