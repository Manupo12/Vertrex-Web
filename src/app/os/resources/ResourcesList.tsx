"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/os/data/DataTable";
import { MobileCardList } from "@/components/os/data/MobileCardList";
import { Shield } from "lucide-react";
import { formatShortDate } from "@/lib/format";
import { ColumnDef } from "@tanstack/react-table";
import { RevealButton } from "./[id]/RevealButton";

type ResourceRow = { id: string; title: string; type: string; createdAt: Date };

export function ResourcesList({ resources }: { resources: ResourceRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = resources.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (query && !r.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const columns: ColumnDef<ResourceRow>[] = [
    {
      accessorKey: "title",
      header: "Titulo",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => <Badge variant="neutral" className="text-[10px]">{row.original.type}</Badge>,
    },
    {
      accessorKey: "createdAt",
      header: "Creado",
      cell: ({ row }) => <span className="text-muted-foreground">{formatShortDate(row.original.createdAt)}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right flex justify-end" onClick={(e) => e.stopPropagation()}>
          <RevealButton resourceId={row.original.id} />
        </div>
      ),
    },
  ];

  if (resources.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="Boveda vacia"
        description="Guarda API keys, credenciales y variables de entorno."
        actionLabel="Nuevo recurso"
        onAction={() => router.push("/os/resources/new")}
      />
    );
  }

  return (
    <div>
      <Toolbar
        searchPlaceholder="Buscar recursos..."
        onSearch={setQuery}
        resultCount={filtered.length}
        filters={
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>
            <option value="api_key">API Key</option>
            <option value="env">.env</option>
            <option value="password">Password</option>
            <option value="credential">Credencial</option>
            <option value="otro">Otro</option>
          </select>
        }
      />
      
      <div className="hidden sm:block mt-4">
        <DataTable 
          columns={columns} 
          data={filtered} 
          onRowClick={(row) => router.push(`/os/resources/${row.id}`)} 
        />
      </div>

      <div className="mt-4 sm:hidden">
        <MobileCardList 
          data={filtered}
          renderCard={(r) => (
            <div
              onClick={() => router.push(`/os/resources/${r.id}`)}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/30"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <div className="mt-0.5 flex gap-1.5">
                    <Badge variant="neutral" className="text-[10px]">{r.type}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <RevealButton resourceId={r.id} />
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
