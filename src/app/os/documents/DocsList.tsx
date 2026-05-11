"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/os/data/DataTable";
import { MobileCardList } from "@/components/os/data/MobileCardList";
import { FileText, Download } from "lucide-react";
import { formatFileSize, formatShortDate } from "@/lib/format";
import { ColumnDef } from "@tanstack/react-table";
import { SmartUploader } from "@/components/os/Uploader/SmartUploader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DocRow = { id: string; name: string; sizeBytes: number; storageProvider: string; mimeType: string | null; createdAt: Date };

interface DocsListProps {
  documents: DocRow[];
}

export function DocsList({ documents }: DocsListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [storageFilter, setStorageFilter] = useState("all");
  const [mimeFilter, setMimeFilter] = useState("all");

  const filtered = documents.filter(d => {
    if (query && !d.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (storageFilter !== "all" && d.storageProvider !== storageFilter) return false;
    if (mimeFilter !== "all" && d.mimeType !== mimeFilter) return false;
    return true;
  });

  const uniqueMimes = Array.from(new Set(documents.map(d => d.mimeType).filter(Boolean))) as string[];

  const columns: ColumnDef<DocRow>[] = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium text-foreground">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "sizeBytes",
      header: "Tamano",
      cell: ({ row }) => <span className="text-muted-foreground">{formatFileSize(row.original.sizeBytes)}</span>,
    },
    {
      accessorKey: "storageProvider",
      header: "Almacenamiento",
      cell: ({ row }) => <StatusBadge category="storage" status={row.original.storageProvider} className="text-[10px]" />,
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
          <a href={`/api/documents/${row.original.id}`} onClick={(e) => e.stopPropagation()} className="inline-flex rounded-lg border border-border p-1.5 hover:bg-accent transition-colors"><Download className="h-4 w-4" /></a>
        </div>
      ),
    },
  ];

  if (documents.length === 0 && query === "" && storageFilter === "all" && mimeFilter === "all") {
    return (
      <div className="space-y-4">
        <EmptyState icon={FileText} title="Aun no has subido documentos" description="Sube tu primer documento. Archivos menores de 1.5 MB se guardan en Neon, los demas en Drive." actionLabel="Subir documento" onAction={() => {}} />
        <div className="max-w-md mx-auto">
          <SmartUploader source="os" variant="button" className="w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toolbar searchPlaceholder="Buscar documentos..." onSearch={setQuery} resultCount={filtered.length} filters={
        <div className="flex flex-wrap gap-2">
          <Select value={storageFilter} onValueChange={setStorageFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Almacenamiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="neon">Neon</SelectItem>
              <SelectItem value="drive">Google Drive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={mimeFilter} onValueChange={setMimeFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Tipo de archivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueMimes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <SmartUploader source="os" variant="button" />
        </div>
      } />

      <div className="hidden sm:block mt-4">
        <DataTable 
          columns={columns} 
          data={filtered} 
          onRowClick={(row) => router.push(`/os/documents/${row.id}`)} 
        />
      </div>

      <div className="mt-4 sm:hidden">
        <MobileCardList 
          data={filtered}
          renderCard={(d) => (
            <div onClick={() => router.push(`/os/documents/${d.id}`)} className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm text-foreground truncate max-w-[150px]">{d.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{formatFileSize(d.sizeBytes)}</span>
                    <StatusBadge category="storage" status={d.storageProvider} className="text-[10px]" />
                  </div>
                </div>
              </div>
              <a href={`/api/documents/${d.id}`} onClick={(e) => e.stopPropagation()} className="rounded-lg border border-border p-2 hover:bg-accent transition-colors"><Download className="h-5 w-5 text-muted-foreground" /></a>
            </div>
          )}
        />
      </div>
    </div>
  );
}
