"use client";

import { useMemo, useState } from "react";
import { Database, FileText, HardDriveUpload, Search, Sparkles, UploadCloud } from "lucide-react";

import {
  EmptyWorkspacePanel,
  ErrorWorkspacePanel,
  LoadingWorkspacePanel,
  formatDateTime,
  formatNumber,
} from "@/components/os/workspace-ui";
import { useWorkspaceSnapshot } from "@/lib/ops/use-workspace-snapshot";
import type { WorkspaceFileRecord } from "@/lib/ops/workspace-service";
import type { UIStore } from "@/lib/store/ui";

type AssetsWorkspaceScreenProps = {
  open: UIStore["open"];
};

export default function AssetsWorkspaceScreen({ open }: AssetsWorkspaceScreenProps) {
  const { snapshot, loading, error, refresh } = useWorkspaceSnapshot();
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "drive" | "vertrex">("all");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const filteredFiles = useMemo(() => {
    return snapshot.files.filter((file) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [file.name, file.category, file.clientName, file.clientSlug, file.provider]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesSource =
        sourceFilter === "all" ||
        (sourceFilter === "drive" ? file.provider === "drive" : file.provider !== "drive");
      const matchesFolder = activeFolder === null || file.category === activeFolder;

      return matchesQuery && matchesSource && matchesFolder;
    });
  }, [query, snapshot.files, sourceFilter, activeFolder]);

  const driveFiles = snapshot.files.filter((file) => file.provider === "drive");
  const vertrexFiles = snapshot.files.filter((file) => file.provider !== "drive");
  const categories = buildCategorySummary(snapshot.files);

  if (loading) {
    return <LoadingWorkspacePanel label="Cargando biblioteca real de assets..." />;
  }

  if (error) {
    return <ErrorWorkspacePanel message={error} onRetry={refresh} />;
  }

  if (snapshot.files.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyWorkspacePanel
          title="Aún no hay archivos reales en la biblioteca"
          description="Sube documentos, contratos, manuales o assets creativos para activar el storage operativo del workspace."
        />
        <div className="flex gap-3">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => open("uploadFile", { context: "assets" })}>
            Subir archivo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Assets</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Biblioteca operativa sincronizada con {formatNumber(snapshot.files.length)} archivos reales y storage híbrido.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80" onClick={refresh}>
            Actualizar
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_15px_rgba(0,255,135,0.2)] transition-all hover:shadow-[0_0_25px_rgba(0,255,135,0.35)]" onClick={() => open("uploadFile", { context: "assets" })}>
            <span className="inline-flex items-center gap-2">
              <UploadCloud className="h-4 w-4" /> Subir archivo
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total archivos" value={String(snapshot.summary.files)} subtitle="Biblioteca operativa" icon={FileText} />
        <MetricCard title="Vertrex Space" value={String(vertrexFiles.length)} subtitle="Archivos locales operativos" icon={Database} />
        <MetricCard title="Google Drive" value={String(driveFiles.length)} subtitle={snapshot.storage.googleDriveConfigured ? snapshot.storage.driveSharedAccount ?? "Conectado" : "No configurado"} icon={HardDriveUpload} />
        <MetricCard title="Categorías" value={String(categories.length)} subtitle={categories[0] ? categories[0].label : "Sin categorías"} icon={Sparkles} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Search className="h-5 w-5 text-muted-foreground" /> Búsqueda semántica
            </div>
            <div className="space-y-4">
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>Buscar por nombre, cliente, categoría o provider</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="portal, contrato, budaphone" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40" />
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "Todos" },
                  { key: "vertrex", label: "Vertrex" },
                  { key: "drive", label: "Drive" },
                ].map((option) => (
                  <button key={option.key} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${sourceFilter === option.key ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"}`} onClick={() => setSourceFilter(option.key as "all" | "drive" | "vertrex")}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">Carpetas</h2>
            </div>
            <div className="space-y-1 p-4">
              <button
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ${activeFolder === null ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-secondary/40"}`}
                onClick={() => setActiveFolder(null)}
              >
                <span>Todos</span>
                <span className="text-muted-foreground">{snapshot.files.length}</span>
              </button>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <button
                    key={category.label}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ${activeFolder === category.label ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-secondary/40"}`}
                    onClick={() => setActiveFolder(category.label)}
                  >
                    <span>{category.label}</span>
                    <span className="text-muted-foreground">{category.count}</span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sin carpetas detectadas.</p>
              )}
            </div>
          </section>
        </aside>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-foreground">Biblioteca</h2>
            <span className="text-xs text-muted-foreground">{filteredFiles.length} resultados</span>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => <AssetCard key={file.id} file={file} onOpen={open} />)
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-secondary/20 px-6 py-12 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
                No encontramos archivos con los filtros actuales.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function buildCategorySummary(files: WorkspaceFileRecord[]) {
  const totals = new Map<string, number>();

  for (const file of files) {
    const key = file.category?.trim() || "general";
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }

  return Array.from(totals.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count);
}

function MetricCard({ title, value, subtitle, icon: Icon }: { title: string; value: string; subtitle: string; icon: typeof FileText }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</h3>
        </div>
        <div className="rounded-xl bg-secondary/60 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function AssetCard({ file, onOpen }: { file: WorkspaceFileRecord; onOpen: UIStore["open"] }) {
  function handleOpen() {
    if (file.href) {
      window.open(file.href, "_blank", "noopener,noreferrer");
      return;
    }

    onOpen("assetDetail", file.id);
  }

  return (
    <button className="rounded-2xl border border-border/60 bg-secondary/20 p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5" onClick={handleOpen}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{file.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{file.clientName ?? file.clientSlug ?? "Sin cliente"}</p>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          {file.provider}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        <span className="rounded-full border border-border bg-background px-2 py-1">{file.category ?? "general"}</span>
        <span className="rounded-full border border-border bg-background px-2 py-1">{file.source}</span>
      </div>
      <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between gap-3">
          <span>Tamaño</span>
          <span>{file.sizeLabel ?? "No disponible"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Subido</span>
          <span>{formatDateTime(file.uploadedAt)}</span>
        </div>
      </div>
    </button>
  );
}
