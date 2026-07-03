"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/os/data/DataTable";
import { MobileCardList } from "@/components/os/data/MobileCardList";
import {
  Users, Copy, TagsIcon, TrashIcon, Shuffle, SlidersHorizontal,
  ChevronLeft, ChevronRight, Globe, Wifi, WifiOff, Phone,
} from "lucide-react";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { formatShortDate } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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
  country: string | null;
  sector: string | null;
  whatsapp: string | null;
  instagram: string | null;
  webPresence: string | null;
  website: string | null;
  address: string | null;
  rating: string | null;
  reviewsCount: number | null;
  contactors: { id: string; name: string }[];
  createdAt: Date;
};

interface CrmListProps {
  clients: ClientRow[];
  stats: Record<string, number>;
  webPresenceStats: Record<string, number>;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  sectors: string[];
  cities: string[];
  countries: string[];
}

const CRM_STAGES = [
  { value: "no_contactado", label: "No contactado" },
  { value: "contactado", label: "Contactado" },
  { value: "interesado", label: "Interesado" },
  { value: "no_respondio", label: "No respondió" },
  { value: "reunion_completada", label: "1ª Reunión" },
  { value: "contrato_firmado", label: "Contrato firmado" },
  { value: "contrato_finalizado", label: "Finalizado" },
  { value: "continuidad", label: "Continuidad" },
];

const WEB_PRESENCE_OPTIONS = [
  { value: "all", label: "Presencia web (Todas)" },
  { value: "SIN WEB", label: "🚫 Sin web (oportunidad)" },
  { value: "Web propia", label: "🌐 Web propia" },
  { value: "Instagram", label: "📸 Solo Instagram" },
  { value: "Facebook", label: "📘 Solo Facebook" },
  { value: "Agenda/Link", label: "🔗 Agenda / Link" },
  { value: "con_web", label: "✅ Con presencia digital" },
];

export function CrmList({
  clients,
  stats = {},
  webPresenceStats = {},
  totalCount,
  totalPages,
  currentPage,
  sectors,
  cities,
  countries,
}: CrmListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);
  const [savedViews, setSavedViews] = useState<any[]>([]);

  useEffect(() => {
    listSavedViewsAction("/os/crm").then(setSavedViews);
  }, []);

  const statusFilter = searchParams.get("status") || "all";
  const priorityFilter = searchParams.get("priority") || "all";
  const sectorFilter = searchParams.get("sector") || "all";
  const cityFilter = searchParams.get("city") || "all";
  const countryFilter = searchParams.get("country") || "all";
  const ratingFilter = searchParams.get("rating") || "all";
  const webPresenceFilter = searchParams.get("webPresence") || "all";

  const buildUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (!v || v === "all") params.delete(k);
      else params.set(k, v);
    });
    params.delete("page"); // reset to page 1 on filter change
    return `${pathname}?${params.toString()}`;
  }, [pathname, searchParams]);

  const setFilter = (key: string, value: string) => {
    router.push(buildUrl({ [key]: value }));
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  // Stats derived
  const sinWeb = webPresenceStats["SIN WEB"] ?? 0;
  const conWeb = totalCount - sinWeb;
  const sinWebPct = totalCount > 0 ? Math.round((sinWeb / totalCount) * 100) : 0;
  const conInstagram = webPresenceStats["Instagram"] ?? 0;
  const conWebPropia = webPresenceStats["Web propia"] ?? 0;

  const handleRandomSelect = () => {
    if (clients.length === 0) {
      toast.error("No hay prospectos visibles para elegir al azar");
      return;
    }
    const randomIndex = Math.floor(Math.random() * clients.length);
    const randomClient = clients[randomIndex];
    toast.success(`Prospecto al azar: ${randomClient.name}`);
    router.push(`/os/crm/${randomClient.slug}`);
  };

  const selectedRows = clients.filter((_, i) => rowSelection[String(i)]);

  const bulkActions = [
    {
      label: "Etiquetar",
      icon: TagsIcon,
      onClick: () => {
        const ids = selectedRows.map((c) => c.id);
        const tagLabel = prompt("Ingresa la etiqueta (ej. VIP, Nuevo):");
        if (!tagLabel) return;
        bulkTagEntitiesAction(ids, "client", tagLabel)
          .then(() => { setRowSelection({}); toast.success(`${ids.length} cliente(s) etiquetado(s)`); })
          .catch((err) => toast.error("Error al etiquetar: " + err.message));
      },
    },
    {
      label: "Eliminar",
      icon: TrashIcon,
      variant: "danger" as const,
      onClick: () => {
        const ids = selectedRows.map((c) => c.id);
        if (!confirm(`¿Eliminar ${ids.length} contacto(s)?`)) return;
        bulkDeleteClientsAction(ids).then(() => {
          setRowSelection({});
          toast.success(`${ids.length} contacto(s) eliminado(s)`);
          router.refresh();
        });
      },
    },
  ];

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
              {row.original.sector || "Cliente"} {row.original.city ? `• ${row.original.city}${row.original.country ? `, ${row.original.country}` : ""}` : row.original.country ? `• ${row.original.country}` : ""}
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
        if (!val) return <span className="text-[var(--color-muted-foreground)]">—</span>;
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
      },
    },
    {
      accessorKey: "webPresence",
      header: "Presencia Web",
      cell: ({ row }) => {
        const wp = row.original.webPresence;
        const website = row.original.website;
        if (!wp || wp === "SIN WEB") {
          return (
            <span className="inline-flex items-center gap-1 text-xs text-orange-400 font-medium">
              <WifiOff className="h-3 w-3" /> Sin web
            </span>
          );
        }
        return (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <Wifi className="h-3 w-3" /> {wp}
            </span>
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[var(--color-primary)] hover:underline text-[10px] ml-1"
              >
                Ver ↗
              </a>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Contacto",
      cell: ({ row }) => {
        const { phone, whatsapp, instagram } = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--color-muted-foreground)]">{phone || "—"}</span>
            <div className="flex items-center gap-1">
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-green-500 hover:bg-green-500/10 rounded transition-colors" title="Abrir WhatsApp">
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.022-.08-.117-.146-.217-.196-.085-.04-1.013-.5-1.186-.563-.173-.063-.3-.094-.427.094-.128.19-.497.625-.61.753-.113.128-.227.144-.427.044-.2-.1-.84-.31-1.602-.99-.59-.525-.99-1.173-1.106-1.372-.116-.2-.013-.308.087-.408.09-.09.2-.233.3-.35.1-.117.135-.197.2-.33.065-.13.034-.247-.015-.347-.05-.1-.427-1.03-.585-1.41-.153-.372-.32-.322-.427-.327-.11-.005-.23-.006-.35-.006-.12 0-.317.045-.483.225-.166.18-.633.618-.633 1.507 0 .89.65 1.747.74 1.87.09.125 1.282 1.957 3.11 2.748.435.19.774.303 1.04.387.436.138.832.12 1.15.072.35-.055 1.013-.414 1.155-.815.14-.4.14-.75.097-.816-.044-.066-.17-.107-.29-.168zM12.004 2c-5.524 0-10.002 4.478-10.002 10.002 0 1.815.485 3.52 1.328 5.01L2 22l5.166-1.355c1.436.78 3.06 1.19 4.838 1.19 5.524 0 10.002-4.477 10.002-10.002C22.006 6.478 17.528 2 12.004 2z"/>
                  </svg>
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-pink-500 hover:bg-pink-500/10 rounded transition-colors" title="Instagram">
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
      },
    },
    {
      accessorKey: "rating",
      header: "Calificación",
      cell: ({ row }) => {
        const rating = row.original.rating;
        const reviews = row.original.reviewsCount;
        if (!rating) return <span className="text-[var(--color-muted-foreground)]">—</span>;
        return (
          <span className="text-xs text-[var(--color-muted-foreground)] flex items-center gap-1 font-mono">
            ⭐ <span className="text-foreground font-semibold">{rating}</span> ({reviews ? reviews.toLocaleString() : 0})
          </span>
        );
      },
    },
    {
      accessorKey: "contactors",
      header: "Contactado por",
      cell: ({ row }) => {
        const contactors = row.original.contactors || [];
        if (contactors.length === 0) return <span className="text-xs text-[var(--color-muted-foreground)]">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {contactors.map((member) => (
              <span key={member.id} className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-semibold border border-[var(--color-primary)]/20 uppercase tracking-wide">
                {member.name.split(" ")[0]}
              </span>
            ))}
          </div>
        );
      },
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
          <Button
            variant="ghost" size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/portal/${row.original.slug}`);
              toast.success("Link del portal copiado");
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const FiltersPanel = () => (
    <>
      <Select value={statusFilter} onValueChange={(v) => setFilter("status", v)}>
        <SelectTrigger className="w-[155px] bg-background"><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          {CRM_STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={priorityFilter} onValueChange={(v) => setFilter("priority", v)}>
        <SelectTrigger className="w-[145px] bg-background"><SelectValue placeholder="Prioridad" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Prioridad (Todas)</SelectItem>
          <SelectItem value="alta">🔥 Alta</SelectItem>
          <SelectItem value="media">Media</SelectItem>
          <SelectItem value="baja">Baja</SelectItem>
          <SelectItem value="none">Sin prioridad</SelectItem>
        </SelectContent>
      </Select>

      <Select value={webPresenceFilter} onValueChange={(v) => setFilter("webPresence", v)}>
        <SelectTrigger className="w-[175px] bg-background"><SelectValue placeholder="Presencia web" /></SelectTrigger>
        <SelectContent>
          {WEB_PRESENCE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={sectorFilter} onValueChange={(v) => setFilter("sector", v)}>
        <SelectTrigger className="w-[160px] bg-background"><SelectValue placeholder="Rubro/Sector" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Rubro (Todos)</SelectItem>
          {sectors.map((sec) => <SelectItem key={sec} value={sec}>{sec}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={countryFilter} onValueChange={(v) => setFilter("country", v)}>
        <SelectTrigger className="w-[145px] bg-background"><SelectValue placeholder="País" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">País (Todos)</SelectItem>
          {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={cityFilter} onValueChange={(v) => setFilter("city", v)}>
        <SelectTrigger className="w-[140px] bg-background"><SelectValue placeholder="Ciudad" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Ciudad (Todas)</SelectItem>
          {cities.map((cit) => <SelectItem key={cit} value={cit}>{cit}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={ratingFilter} onValueChange={(v) => setFilter("rating", v)}>
        <SelectTrigger className="w-[150px] bg-background"><SelectValue placeholder="Calificación" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Calificación (Todas)</SelectItem>
          <SelectItem value="4.5">Excelente (4.5+ ⭐)</SelectItem>
          <SelectItem value="4.0">Buena (4.0+ ⭐)</SelectItem>
          <SelectItem value="low">Baja (&lt; 4.0 ⭐)</SelectItem>
          <SelectItem value="none">Sin calificación</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline" type="button"
        onClick={handleRandomSelect}
        className="bg-background border-border hover:bg-accent/40 text-xs font-semibold gap-1.5 shrink-0 h-9"
        disabled={clients.length === 0}
        title="Elegir y abrir un prospecto al azar de la lista actual"
      >
        <Shuffle className="h-3.5 w-3.5 text-[var(--color-primary)]" />
        Al azar
      </Button>
    </>
  );

  return (
    <div>
      <SavedViewBar
        route="/os/crm"
        views={savedViews}
        currentViewId={currentViewId}
        onSelectView={(id) => {
          setCurrentViewId(id === "default" ? null : id);
          const view = savedViews.find((v) => v.id === id);
          if (view?.queryJson?.status) setFilter("status", view.queryJson.status as string);
          else setFilter("status", "all");
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

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 mb-6">
        <Card className="bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-primary)]/10 border-[var(--color-border)]">
          <CardContent className="p-4 flex flex-row items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Contactos</p>
              <p className="text-3xl font-extrabold text-foreground mt-1">{totalCount.toLocaleString()}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-[var(--color-primary)] shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-[var(--color-border)]">
          <CardContent className="p-4 flex flex-row items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sin Presencia Web</p>
              <p className="text-3xl font-extrabold text-foreground mt-1">{sinWeb.toLocaleString()}</p>
              <p className="text-[10px] text-orange-400 font-medium mt-0.5">{sinWebPct}% — Oportunidad 🎯</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-orange-500/15 flex items-center justify-center text-orange-500 shrink-0">
              <WifiOff className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-[var(--color-border)]">
          <CardContent className="p-4 flex flex-row items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Con Presencia Digital</p>
              <p className="text-3xl font-extrabold text-foreground mt-1">{conWeb.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                {conWebPropia.toLocaleString()} web · {conInstagram.toLocaleString()} IG
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
              <Globe className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500/5 to-pink-500/10 border-[var(--color-border)]">
          <CardContent className="p-4 flex flex-row items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">En vista actual</p>
              <p className="text-3xl font-extrabold text-foreground mt-1">{clients.length}</p>
              <p className="text-[10px] text-pink-400 font-medium mt-0.5">Pág. {currentPage} de {totalPages}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-pink-500/15 flex items-center justify-center text-pink-500 shrink-0">
              <Phone className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage pipeline */}
      <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
        {CRM_STAGES.map((stage) => {
          const cnt = stats[stage.value] || 0;
          const isActive = statusFilter === stage.value;
          return (
            <div
              key={stage.value}
              onClick={() => setFilter("status", isActive ? "all" : stage.value)}
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none text-center flex flex-col justify-between h-16 sm:h-20 ${
                isActive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-sm shadow-[var(--color-primary)]/10"
                  : "border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-muted)]/30"
              }`}
            >
              <p className="text-[9px] sm:text-[10px] text-[var(--color-muted-foreground)] font-semibold uppercase tracking-wider leading-tight">{stage.label}</p>
              <p className="text-lg sm:text-xl font-bold mt-1 text-[var(--color-foreground)]">{cnt.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <Toolbar
        searchPlaceholder="Buscar por nombre, rubro, ciudad, teléfono..."
        onSearch={(q) => {
          const params = new URLSearchParams(searchParams.toString());
          if (q) params.set("q", q); else params.delete("q");
          params.delete("page");
          router.push(`${pathname}?${params.toString()}`);
        }}
        resultCount={totalCount}
        filters={
          <div className="flex items-center gap-2">
            {/* Desktop filters */}
            <div className="hidden lg:flex flex-wrap items-center gap-2">
              <FiltersPanel />
            </div>

            {/* Mobile toggle */}
            <Button
              variant="outline" type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden bg-background border-border hover:bg-accent/40 text-xs font-semibold gap-1.5 shrink-0 h-9"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros {(statusFilter !== "all" || priorityFilter !== "all" || sectorFilter !== "all" || cityFilter !== "all" || ratingFilter !== "all" || webPresenceFilter !== "all") ? "●" : ""}
            </Button>
          </div>
        }
      />

      {/* Mobile filters panel */}
      {showMobileFilters && (
        <div className="lg:hidden p-4 rounded-xl border border-border bg-card/40 space-y-3 mb-4 mt-1">
          <div className="flex items-center justify-between pb-1 border-b border-border/40">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filtros</span>
            <Button
              variant="ghost" size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                router.push(pathname);
                setShowMobileFilters(false);
              }}
            >
              Limpiar todos
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estado</label>
              <Select value={statusFilter} onValueChange={(v) => setFilter("status", v)}>
                <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {CRM_STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Prioridad</label>
              <Select value={priorityFilter} onValueChange={(v) => setFilter("priority", v)}>
                <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="alta">🔥 Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="none">Sin prioridad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Presencia Web</label>
              <Select value={webPresenceFilter} onValueChange={(v) => setFilter("webPresence", v)}>
                <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WEB_PRESENCE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rubro</label>
              <Select value={sectorFilter} onValueChange={(v) => setFilter("sector", v)}>
                <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {sectors.map((sec) => <SelectItem key={sec} value={sec}>{sec}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">País</label>
              <Select value={countryFilter} onValueChange={(v) => setFilter("country", v)}>
                <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ciudad</label>
              <Select value={cityFilter} onValueChange={(v) => setFilter("city", v)}>
                <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {cities.map((cit) => <SelectItem key={cit} value={cit}>{cit}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Calificación</label>
              <Select value={ratingFilter} onValueChange={(v) => setFilter("rating", v)}>
                <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="4.5">Excelente (4.5+)</SelectItem>
                  <SelectItem value="4.0">Buena (4.0+)</SelectItem>
                  <SelectItem value="low">Baja (&lt;4.0)</SelectItem>
                  <SelectItem value="none">Sin calificación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" type="button" onClick={handleRandomSelect} className="w-full bg-background border-border text-xs font-semibold gap-1.5 h-9 mt-1" disabled={clients.length === 0}>
              <Shuffle className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              Elegir uno al azar
            </Button>
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin resultados"
          description="No hay contactos que coincidan con los filtros aplicados."
          actionLabel="Limpiar filtros"
          onAction={() => router.push(pathname)}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block mt-4">
            <DataTable
              columns={columns}
              data={clients}
              onRowClick={(row) => router.push(`/os/crm/${row.slug}`)}
              bulkActions={bulkActions}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
            />
          </div>

          {/* Mobile cards */}
          <div className="mt-4 sm:hidden">
            <MobileCardList
              data={clients}
              renderCard={(c) => (
                <div
                  onClick={() => router.push(`/os/crm/${c.slug}`)}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:bg-accent/30 cursor-pointer shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-semibold text-[var(--color-primary)] shrink-0 mt-0.5">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground leading-tight truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.sector || "Cliente"}{c.city ? ` • ${c.city}${c.country ? `, ${c.country}` : ""}` : c.country ? ` • ${c.country}` : ""}
                        </p>
                      </div>
                    </div>
                    <StatusBadge category="client" status={c.status} className="text-[10px] px-2 py-0.5 shrink-0" />
                  </div>

                  <div className="flex items-center justify-between text-xs border-t border-border/40 pt-2.5 gap-2 flex-wrap">
                    {/* Priority + rating */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {c.priority ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          c.priority.includes("Alta") || c.priority.includes("🔥") ? "bg-red-500/10 border-red-500/20 text-red-400" :
                          c.priority.includes("Media") ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                          "bg-slate-500/10 border-slate-500/20 text-slate-400"
                        }`}>{c.priority}</span>
                      ) : null}
                      {c.rating && (
                        <span className="font-mono text-muted-foreground text-[11px]">
                          ⭐ <span className="text-foreground font-semibold">{c.rating}</span> ({c.reviewsCount || 0})
                        </span>
                      )}
                    </div>

                    {/* Web presence badge */}
                    {c.webPresence && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        c.webPresence === "SIN WEB"
                          ? "bg-orange-500/10 text-orange-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}>
                        {c.webPresence === "SIN WEB" ? "🚫 Sin web" : `🌐 ${c.webPresence}`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 pt-2.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs font-mono text-muted-foreground">{c.phone || "Sin teléfono"}</span>
                    <div className="flex items-center gap-1.5">
                      {c.whatsapp && (
                        <a href={c.whatsapp} target="_blank" rel="noopener noreferrer"
                          className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors border border-green-500/10 bg-green-500/5">
                          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.022-.08-.117-.146-.217-.196-.085-.04-1.013-.5-1.186-.563-.173-.063-.3-.094-.427.094-.128.19-.497.625-.61.753-.113.128-.227.144-.427.044-.2-.1-.84-.31-1.602-.99-.59-.525-.99-1.173-1.106-1.372-.116-.2-.013-.308.087-.408.09-.09.2-.233.3-.35.1-.117.135-.197.2-.33.065-.13.034-.247-.015-.347-.05-.1-.427-1.03-.585-1.41-.153-.372-.32-.322-.427-.327-.11-.005-.23-.006-.35-.006-.12 0-.317.045-.483.225-.166.18-.633.618-.633 1.507 0 .89.65 1.747.74 1.87.09.125 1.282 1.957 3.11 2.748.435.19.774.303 1.04.387.436.138.832.12 1.15.072.35-.055 1.013-.414 1.155-.815.14-.4.14-.75.097-.816-.044-.066-.17-.107-.29-.168zM12.004 2c-5.524 0-10.002 4.478-10.002 10.002 0 1.815.485 3.52 1.328 5.01L2 22l5.166-1.355c1.436.78 3.06 1.19 4.838 1.19 5.524 0 10.002-4.477 10.002-10.002C22.006 6.478 17.528 2 12.004 2z"/>
                          </svg>
                        </a>
                      )}
                      {c.instagram && (
                        <a href={c.instagram} target="_blank" rel="noopener noreferrer"
                          className="p-2 text-pink-500 hover:bg-pink-500/10 rounded-lg transition-colors border border-pink-500/10 bg-pink-500/5">
                          <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                          </svg>
                        </a>
                      )}
                      {c.website && c.webPresence !== "SIN WEB" && (
                        <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                          target="_blank" rel="noopener noreferrer"
                          className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors border border-[var(--color-primary)]/10 bg-[var(--color-primary)]/5">
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * 50) + 1}–{Math.min(currentPage * 50, totalCount)} de {totalCount.toLocaleString()} contactos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="h-8 gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <span className="text-sm font-medium px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline" size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="h-8 gap-1"
                >
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
