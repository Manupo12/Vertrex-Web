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

type DocRow = { id: string; name: string; sizeBytes: number; storageProvider: string; mimeType: string | null; createdAt: Date; folderId?: string | null; version?: number };

interface DocsListProps {
  documents: DocRow[];
  folders?: any[];
}

import { FolderTree } from "@/components/os/Documents/FolderTree";

export function DocsList({ documents, folders = [] }: DocsListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [storageFilter, setStorageFilter] = useState("all");
  const [mimeFilter, setMimeFilter] = useState("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Group by parentId to only show the latest version of each document
  const getLatestVersions = () => {
    const parentMap = new Map<string, DocRow>();
    const rootDocs: DocRow[] = [];
    
    // Simple V3 approach: if a document has parentId, it's a version.
    // In a real app we'd need the parentId property in DocRow to group properly.
    // Assuming documents only come with version, we just render them all for now or 
    // filter those with version > 1 if we had parentId.
    return documents;
  };

  const filtered = getLatestVersions().filter(d => {
    if (query && !d.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (storageFilter !== "all" && d.storageProvider !== storageFilter) return false;
    if (mimeFilter !== "all" && d.mimeType !== mimeFilter) return false;
    if (selectedFolderId && d.folderId !== selectedFolderId) return false;
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
          {row.original.version && row.original.version > 1 && (
            <span className="text-[10px] uppercase font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-1.5 py-0.5 rounded">v{row.original.version}</span>
          )}
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

  if (documents.length === 0 && query === "" && storageFilter === "all" && mimeFilter === "all" && !selectedFolderId) {
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
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      <FolderTree 
        folders={folders} 
        selectedFolderId={selectedFolderId} 
        onSelect={setSelectedFolderId} 
        className="h-full rounded-xl bg-[var(--color-card)]"
      />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <Toolbar searchPlaceholder="Buscar documentos..." onSearch={setQuery} resultCount={filtered.length} filters={
          <div className="flex flex-wrap gap-2">
            {folders && folders.length > 0 && (
              <div className="md:hidden">
                <Select value={selectedFolderId || "all"} onValueChange={(val) => setSelectedFolderId(val === "all" ? null : val)}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Carpeta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las carpetas</SelectItem>
                    {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

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

        <div className="hidden sm:block mt-4 flex-1 overflow-y-auto">
          <DataTable 
            columns={columns} 
            data={filtered} 
            onRowClick={(row) => router.push(`/os/documents/${row.id}`)} 
          />
        </div>

        <div className="mt-4 sm:hidden flex-1 overflow-y-auto">
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
    </div>
  );
}
