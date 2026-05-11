"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/os/data/DataTable";
import { MobileCardList } from "@/components/os/data/MobileCardList";
import { Users, Copy, TagsIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { formatShortDate } from "@/lib/format";
import { useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedViewBar } from "@/components/os/SavedViews/SavedViewBar";

type ClientRow = { id: string; slug: string; name: string; email: string | null; phone: string | null; status: string; createdAt: Date };

interface CrmListProps {
  clients: ClientRow[];
}

export function CrmList({ clients }: CrmListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const statusFilter = searchParams.get("status") || "all";
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);

  const setStatusFilter = (newStatus: string) => {
    const params = new URLSearchParams(searchParams);
    if (newStatus && newStatus !== "all") params.set("status", newStatus);
    else params.delete("status");
    router.push(`/os/crm?${params.toString()}`);
  };

  const filtered = clients.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.slug.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const columns: ColumnDef<ClientRow>[] = [
    {
      accessorKey: "name",
      header: "Cliente",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-medium text-[var(--color-primary)]">{row.original.name.charAt(0).toUpperCase()}</div>
          <div>
            <p className="font-medium text-[var(--color-foreground)]">{row.original.name}</p>
            <p className="text-xs text-[var(--color-muted-foreground)] font-mono">{row.original.slug}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-[var(--color-muted-foreground)]">{row.original.email || "-"}</span>,
    },
    {
      accessorKey: "phone",
      header: "Telefono",
      cell: ({ row }) => <span className="text-[var(--color-muted-foreground)]">{row.original.phone || "-"}</span>,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => <StatusBadge category="client" status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: "Creado",
      cell: ({ row }) => <span className="text-[var(--color-muted-foreground)]">{formatShortDate(row.original.createdAt)}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/portal/${row.original.slug}`); toast.success("Link del portal copiado"); }}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const bulkActions = [
    { label: "Etiquetar", icon: TagsIcon, onClick: () => console.log("Etiquetar") },
    { label: "Eliminar", icon: TrashIcon, variant: "danger" as const, onClick: () => console.log("Eliminar") }
  ];

  const mockViews = [
    { id: "active", name: "Activos" },
    { id: "paused", name: "Pausados" }
  ];

  if (clients.length === 0 && statusFilter === "all" && !query) {
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
      <SavedViewBar 
        route="/os/crm" 
        views={mockViews} 
        currentViewId={currentViewId} 
        onSelectView={(id) => {
          setCurrentViewId(id === 'default' ? null : id);
          if (id === 'active') setStatusFilter('active');
          else if (id === 'paused') setStatusFilter('paused');
          else setStatusFilter('all');
        }} 
        onSaveView={() => toast.success("Vista guardada")}
      />
      
      <Toolbar
        searchPlaceholder="Buscar clientes..."
        onSearch={setQuery}
        resultCount={filtered.length}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
              <SelectItem value="paused">Pausados</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      
      <div className="hidden sm:block mt-4">
        <DataTable 
          columns={columns} 
          data={filtered} 
          onRowClick={(row) => router.push(`/os/crm/${row.slug}`)} 
          bulkActions={bulkActions}
        />
      </div>

      <div className="mt-4 sm:hidden">
        <MobileCardList 
          data={filtered}
          renderCard={(c) => (
            <div onClick={() => router.push(`/os/crm/${c.slug}`)} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/30 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-medium text-[var(--color-primary)]">{c.name.charAt(0).toUpperCase()}</div>
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
