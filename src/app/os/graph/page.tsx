import { db } from "@/lib/db";
import { getGraphSnapshot } from "@/lib/db/actions/graph";
import { getDescriptor } from "@/lib/entities/registry";
import type { EntityType } from "@/lib/db/actions/graph-types";
import { inArray } from "drizzle-orm";
import { GraphExplorer } from "./GraphExplorer";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";

export default async function GraphPage() {
  await requireOsUser();
  const links = await getGraphSnapshot();

  const idsByType: Record<string, Set<string>> = {};
  for (const l of links) {
    if (!idsByType[l.sourceType]) idsByType[l.sourceType] = new Set();
    idsByType[l.sourceType].add(l.sourceId);

    if (!idsByType[l.targetType]) idsByType[l.targetType] = new Set();
    idsByType[l.targetType].add(l.targetId);
  }

  const nodeInfos: Record<string, { label: string; type: string; href: string }> = {};
  
  await Promise.all(Object.entries(idsByType).map(async ([type, idSet]) => {
    const ids = Array.from(idSet);
    if (ids.length === 0) return;
    const desc = getDescriptor(type as EntityType);
    if (!desc) return;

    const rows = await db.select().from(desc.table).where(inArray(desc.table.id, ids));
    for (const r of rows) {
      const info = desc.toDisplay(r);
      nodeInfos[r.id] = { label: info.label, type, href: info.href };
    }
  }));

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Explorador de Grafo" 
        breadcrumbs={[{ label: "Grafo" }]}
      />
      <GraphExplorer initialLinks={links} nodeInfos={nodeInfos} />
    </div>
  );
}
