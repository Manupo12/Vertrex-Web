"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/os/data/DataTable";
import { MobileCardList } from "@/components/os/data/MobileCardList";
import { Users, Copy } from "lucide-react";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { formatShortDate } from "@/lib/format";

type ClientRow = { id: string; slug: string; name: string; email: string | null; phone: string | null; status: string; createdAt: Date };

interface CrmListProps {
  clients: ClientRow[];
}

export function CrmList({ clients }: CrmListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = clients.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.slug.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const columns: ColumnDef<ClientRow>[] = [
    {
      accessorKey: "name",
      header: "Cliente",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">{row.original.name.charAt(0)}</div>
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{row.original.slug}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email || "-"}</span>,
    },
    {
      accessorKey: "phone",
      header: "Telefono",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.phone || "-"}</span>,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => <StatusBadge category="client" status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: "Creado",
      cell: ({ row }) => <span className="text-muted-foreground">{formatShortDate(row.original.createdAt)}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_URL || ""}/portal/${row.original.slug}`); toast.success("Link del portal copiado"); }}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aun no tienes clientes"
        description="Crea el primer cliente para activar su portal."
        actionLabel="Nuevo cliente"
        onAction={() => router.push("/os/crm/new")}
      />
    );
  }

  return (
    <div>
      <Toolbar
        searchPlaceholder="Buscar clientes..."
        onSearch={setQuery}
        resultCount={filtered.length}
        filters={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="paused">Pausados</option>
          </select>
        }
      />
      
      <div className="hidden sm:block mt-4">
        <DataTable 
          columns={columns} 
          data={filtered} 
          onRowClick={(row) => router.push(`/os/crm/${row.slug}`)} 
        />
      </div>

      <div className="mt-4 sm:hidden">
        <MobileCardList 
          data={filtered}
          renderCard={(c) => (
            <div onClick={() => router.push(`/os/crm/${c.slug}`)} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/30 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">{c.name.charAt(0)}</div>
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{c.slug}</p>
                  </div>
                </div>
                <StatusBadge category="client" status={c.status} />
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
