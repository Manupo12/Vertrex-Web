"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/os/data/DataTable";
import { MobileCardList } from "@/components/os/data/MobileCardList";
import { Scale, Eye } from "lucide-react";
import { formatShortDate } from "@/lib/format";
import { ColumnDef } from "@tanstack/react-table";

const LEGAL_TYPES: Record<string, string> = { contrato: "Contrato", cuenta_cobro: "Cuenta de cobro", acuerdo: "Acuerdo", otro: "Otro" };

type LegalRow = { id: string; name: string; type: string; isPublic: boolean; signedAt: Date | null; createdAt: Date };

export function LegalList({ documents }: { documents: LegalRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = documents.filter(d => {
    if (typeFilter && d.type !== typeFilter) return false;
    if (query && !d.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const columns: ColumnDef<LegalRow>[] = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => <Badge variant="neutral" className="text-[10px]">{LEGAL_TYPES[row.original.type] || row.original.type}</Badge>,
    },
    {
      accessorKey: "isPublic",
      header: "Portal",
      cell: ({ row }) => row.original.isPublic ? <Badge variant="info" className="text-[10px]"><Eye className="mr-1 h-3 w-3" />Visible</Badge> : <span className="text-muted-foreground">-</span>,
    },
    {
      id: "date",
      header: "Fecha",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.signedAt ? `Firmado: ${formatShortDate(row.original.signedAt)}` : formatShortDate(row.original.createdAt)}</span>,
    },
  ];

  if (documents.length === 0) {
    return <EmptyState icon={Scale} title="Sin documentos legales" description="Sube contratos, cuentas de cobro y acuerdos." />;
  }

  return (
    <div>
      <Toolbar searchPlaceholder="Buscar documentos legales..." onSearch={setQuery} resultCount={filtered.length} filters={
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todos</option><option value="contrato">Contratos</option><option value="cuenta_cobro">Cuentas de cobro</option><option value="acuerdo">Acuerdos</option><option value="otro">Otros</option>
        </select>
      } />
      
      <div className="hidden sm:block mt-4">
        <DataTable 
          columns={columns} 
          data={filtered} 
          onRowClick={(row) => router.push(`/os/legal/${row.id}`)} 
        />
      </div>

      <div className="mt-4 sm:hidden">
        <MobileCardList 
          data={filtered}
          renderCard={(d) => (
            <div onClick={() => router.push(`/os/legal/${d.id}`)} className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3">
                <Scale className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm text-foreground">{d.name}</p>
                  <div className="flex gap-1.5 mt-1">
                    <Badge variant="neutral" className="text-[10px]">{LEGAL_TYPES[d.type] || d.type}</Badge>
                    {d.isPublic && <Badge variant="info" className="text-[10px]"><Eye className="mr-0.5 h-2.5 w-2.5" />Portal</Badge>}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {d.signedAt ? <span className="text-success font-medium">Firmado</span> : "Pendiente"}
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
