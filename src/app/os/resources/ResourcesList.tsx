"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/os/data/DataTable";
import { MobileCardList } from "@/components/os/data/MobileCardList";
import { Shield, AlertCircleIcon, EyeOffIcon, UsersIcon } from "lucide-react";
import { formatShortDate } from "@/lib/format";
import { ColumnDef } from "@tanstack/react-table";
import { RevealButton } from "./[id]/RevealButton";
import { FolderTree } from "@/components/os/Documents/FolderTree";

type ResourceRow = { id: string; title: string; type: string; createdAt: Date; folderId?: string | null; visibility: string; rotationDueAt?: Date | null };

export function ResourcesList({ resources, folders = [] }: { resources: ResourceRow[], folders?: any[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const filtered = resources.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (query && !r.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (selectedFolderId && r.folderId !== selectedFolderId) return false;
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
          {row.original.rotationDueAt && new Date(row.original.rotationDueAt) < new Date() && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded ml-2">
              <AlertCircleIcon className="h-3 w-3" /> Rotación pendiente
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => <Badge variant="neutral" className="text-[10px]">{row.original.type}</Badge>,
    },
    {
      accessorKey: "visibility",
      header: "Visibilidad",
      cell: ({ row }) => (
        <div className="text-muted-foreground" title={`Visibilidad: ${row.original.visibility}`}>
          {row.original.visibility === 'admin' ? <Shield className="h-4 w-4" /> :
           row.original.visibility === 'owner' ? <EyeOffIcon className="h-4 w-4" /> :
           <UsersIcon className="h-4 w-4" />}
        </div>
      )
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

  if (resources.length === 0 && query === "" && typeFilter === "" && !selectedFolderId) {
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
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      <FolderTree 
        folders={folders} 
        selectedFolderId={selectedFolderId} 
        onSelect={setSelectedFolderId} 
        className="h-full rounded-xl bg-[var(--color-card)]"
      />
      
      <div className="flex-1 overflow-hidden flex flex-col">
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
        
        <div className="hidden sm:block mt-4 flex-1 overflow-y-auto">
          <DataTable 
            columns={columns} 
            data={filtered} 
            onRowClick={(row) => router.push(`/os/resources/${row.id}`)} 
          />
        </div>

        <div className="mt-4 sm:hidden flex-1 overflow-y-auto">
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
                    <div className="mt-0.5 flex items-center gap-2">
                      <Badge variant="neutral" className="text-[10px]">{r.type}</Badge>
                      {r.rotationDueAt && new Date(r.rotationDueAt) < new Date() && (
                        <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                          Rotación pendiente
                        </span>
                      )}
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
    </div>
  );
}
