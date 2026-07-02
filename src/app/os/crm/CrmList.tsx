"use client";
import { useState, useEffect } from "react";
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
import { bulkDeleteClientsAction } from "@/lib/db/actions/crm";
import { bulkTagEntitiesAction } from "@/lib/db/actions/tags";
import { listSavedViewsAction, createSavedViewAction, updateSavedViewAction, deleteSavedViewAction } from "@/lib/db/actions/saved-views";

type ClientRow = {
  id: string;
  slug: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  priority: string | null;
  city: string | null;
  sector: string | null;
  whatsapp: string | null;
  instagram: string | null;
  webPresence: string | null;
  website: string | null;
  address: string | null;
  rating: string | null;
  reviewsCount: number | null;
  createdAt: Date;
};

interface CrmListProps {
  clients: ClientRow[];
  stats: Record<string, number>;
}

const CRM_STAGES = [
  { value: "no_contactado", label: "No contactado" },
  { value: "contactado", label: "Contactado" },
  { value: "interesado", label: "Interesado" },
  { value: "no_respondio", label: "No respondió" },
  { value: "reunion_completada", label: "1ª Reunión" },
  { value: "contrato_firmado", label: "Contrato firmado" },
  { value: "contrato_finalizado", label: "Contrato finalizado" },
  { value: "continuidad", label: "Continuidad" }
];

export function CrmList({ clients, stats = {} }: CrmListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const statusFilter = searchParams.get("status") || "all";
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);
  const [savedViews, setSavedViews] = useState<any[]>([]);

  useEffect(() => {
    listSavedViewsAction("/os/crm").then(setSavedViews);
  }, []);

  const setStatusFilter = (newStatus: string) => {
    const params = new URLSearchParams(searchParams);
    if (newStatus && newStatus !== "all") params.set("status", newStatus);
    else params.delete("status");
    router.push(`/os/crm?${params.toString()}`);
  };

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const filtered = clients.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.slug.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const columns: ColumnDef<ClientRow>[] = [
    {
      accessorKey: "name",
      header: "Prospecto / Cliente",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-medium text-[var(--color-primary)] shrink-0">
            {row.original.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[var(--color-foreground)] truncate">{row.original.name}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {row.original.sector || "Cliente"} {row.original.city ? `• ${row.original.city}` : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Prioridad",
      cell: ({ row }) => {
        const val = row.original.priority;
        if (!val) return <span className="text-[var(--color-muted-foreground)]">-</span>;
        const isHigh = val.includes("Alta") || val.includes("🔥");
        const isMedium = val.includes("Media");
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
            isHigh ? "bg-red-500/10 border-red-500/20 text-red-400" :
            isMedium ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
            "bg-slate-500/10 border-slate-500/20 text-slate-400"
          }`}>
            {val}
          </span>
        );
      }
    },
    {
      accessorKey: "phone",
      header: "Contacto",
      cell: ({ row }) => {
        const { phone, whatsapp, instagram } = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--color-muted-foreground)]">{phone || "-"}</span>
            <div className="flex items-center gap-1">
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="p-1 text-green-500 hover:bg-green-500/10 rounded transition-colors" title="Abrir WhatsApp">
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.022-.08-.117-.146-.217-.196-.085-.04-1.013-.5-1.186-.563-.173-.063-.3-.094-.427.094-.128.19-.497.625-.61.753-.113.128-.227.144-.427.044-.2-.1-.84-.31-1.602-.99-.59-.525-.99-1.173-1.106-1.372-.116-.2-.013-.308.087-.408.09-.09.2-.233.3-.35.1-.117.135-.197.2-.33.065-.13.034-.247-.015-.347-.05-.1-.427-1.03-.585-1.41-.153-.372-.32-.322-.427-.327-.11-.005-.23-.006-.35-.006-.12 0-.317.045-.483.225-.166.18-.633.618-.633 1.507 0 .89.65 1.747.74 1.87.09.125 1.282 1.957 3.11 2.748.435.19.774.303 1.04.387.436.138.832.12 1.15.072.35-.055 1.013-.414 1.155-.815.14-.4.14-.75.097-.816-.044-.066-.17-.107-.29-.168zM12.004 2c-5.524 0-10.002 4.478-10.002 10.002 0 1.815.485 3.52 1.328 5.01L2 22l5.166-1.355c1.436.78 3.06 1.19 4.838 1.19 5.524 0 10.002-4.477 10.002-10.002C22.006 6.478 17.528 2 12.004 2z"/>
                  </svg>
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" className="p-1 text-pink-500 hover:bg-pink-500/10 rounded transition-colors" title="Abrir Instagram">
                  <svg className="h-3.5 w-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "rating",
      header: "Calificación",
      cell: ({ row }) => {
        const rating = row.original.rating;
        const reviews = row.original.reviewsCount;
        if (!rating) return <span className="text-[var(--color-muted-foreground)]">-</span>;
        return (
          <span className="text-xs text-[var(--color-muted-foreground)] flex items-center gap-1 font-mono">
            ⭐ <span className="text-foreground font-semibold">{rating}</span> ({reviews ? reviews.toLocaleString() : 0})
          </span>
        );
      }
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
    { label: "Etiquetar", icon: TagsIcon, onClick: () => {
      const ids = filtered.filter((_, i) => rowSelection[String(i)]).map(c => c.id);
      const tagLabel = prompt("Ingresa la etiqueta (ej. VIP, Nuevo):");
      if (!tagLabel) return;
      bulkTagEntitiesAction(ids, "client", tagLabel).then(() => {
        setRowSelection({});
        toast.success(`${ids.length} cliente(s) etiquetado(s)`);
      }).catch(err => {
        toast.error("Error al etiquetar: " + err.message);
      });
    } },
    { label: "Eliminar", icon: TrashIcon, variant: "danger" as const, onClick: () => {
      const ids = filtered.filter((_, i) => rowSelection[String(i)]).map(c => c.id);
      bulkDeleteClientsAction(ids).then(() => {
        setRowSelection({});
        toast.success(`${ids.length} cliente(s) eliminado(s)`);
      });
    }}
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
        views={savedViews} 
        currentViewId={currentViewId} 
        onSelectView={(id) => {
          setCurrentViewId(id === 'default' ? null : id);
          const view = savedViews.find(v => v.id === id);
          if (view?.queryJson?.status) {
            setStatusFilter(view.queryJson.status as string);
          } else {
            setStatusFilter('all');
          }
        }} 
        onSaveView={async () => {
          const name = prompt("Nombre de la vista:");
          if (!name) return;
          await createSavedViewAction(name, "/os/crm", { status: statusFilter !== "all" ? statusFilter : undefined } as Record<string, unknown>);
          setSavedViews(await listSavedViewsAction("/os/crm"));
          toast.success("Vista guardada");
        }}
        onUpdateView={async (viewId) => {
          await updateSavedViewAction(viewId, { queryJson: { status: statusFilter !== "all" ? statusFilter : undefined } as Record<string, unknown> });
          setSavedViews(await listSavedViewsAction("/os/crm"));
          toast.success("Vista actualizada");
        }}
        onDeleteView={async (viewId) => {
          await deleteSavedViewAction(viewId);
          setSavedViews(await listSavedViewsAction("/os/crm"));
          toast.success("Vista eliminada");
        }}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-4 mb-6">
        {CRM_STAGES.map(stage => {
          const count = stats[stage.value] || 0;
          const isActive = statusFilter === stage.value;
          return (
            <div 
              key={stage.value}
              onClick={() => setStatusFilter(isActive ? "all" : stage.value)}
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none text-center flex flex-col justify-between h-20 ${
                isActive 
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-sm shadow-[var(--color-primary)]/10" 
                  : "border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-muted)]/30"
              }`}
            >
              <p className="text-[10px] text-[var(--color-muted-foreground)] font-semibold uppercase tracking-wider truncate">{stage.label}</p>
              <p className="text-xl font-bold mt-1 text-[var(--color-foreground)]">{count.toLocaleString()}</p>
            </div>
          );
        })}
      </div>
      
      <Toolbar
        searchPlaceholder="Buscar prospectos..."
        onSearch={setQuery}
        resultCount={filtered.length}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activo (Portal)</SelectItem>
              <SelectItem value="inactive">Inactivo (Portal)</SelectItem>
              <SelectItem value="paused">Pausado (Portal)</SelectItem>
              {CRM_STAGES.map(stage => (
                <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
              ))}
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
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
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
