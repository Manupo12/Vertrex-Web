"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/os/data/DataTable";
import { MobileCardList } from "@/components/os/data/MobileCardList";
import { Users2 } from "lucide-react";
import { formatShortDate } from "@/lib/format";
import { ColumnDef } from "@tanstack/react-table";

type TeamMemberRow = { id: string; name: string; email: string; role: string; isActive: boolean; createdAt: Date };

export function TeamList({ users }: { users: TeamMemberRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = users.filter(u => !query || u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()));

  const columns: ColumnDef<TeamMemberRow>[] = [
    {
      accessorKey: "name",
      header: "Miembro",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium">{row.original.name.charAt(0)}</div>
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => <Badge variant={row.original.role === "admin" ? "purple" : "neutral"} className="text-[10px]">{row.original.role}</Badge>,
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => <Badge variant={row.original.isActive ? "success" : "danger"} className="text-[10px]">{row.original.isActive ? "Activo" : "Inactivo"}</Badge>,
    },
    {
      accessorKey: "createdAt",
      header: "Creado",
      cell: ({ row }) => <span className="text-muted-foreground">{formatShortDate(row.original.createdAt)}</span>,
    },
  ];

  if (users.length === 0) {
    return <EmptyState icon={Users2} title="Sin miembros" description="Agrega miembros del equipo." />;
  }

  return (
    <div>
      <Toolbar searchPlaceholder="Buscar miembros..." onSearch={setQuery} resultCount={filtered.length} />
      
      <div className="hidden sm:block mt-4">
        <DataTable 
          columns={columns} 
          data={filtered} 
          onRowClick={(row) => router.push(`/os/team/${row.id}`)} 
        />
      </div>

      <div className="mt-4 sm:hidden">
        <MobileCardList 
          data={filtered}
          renderCard={(u) => (
            <div onClick={() => router.push(`/os/team/${u.id}`)} className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-medium">{u.name.charAt(0)}</div>
                <div><p className="font-medium text-sm text-foreground">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={u.role === "admin" ? "purple" : "neutral"} className="text-[10px]">{u.role}</Badge>
                <Badge variant={u.isActive ? "success" : "danger"} className="text-[10px]">{u.isActive ? "Activo" : "Inactivo"}</Badge>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
