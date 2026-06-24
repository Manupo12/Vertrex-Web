"use client";

import { useState, useEffect } from "react";
import { setModulePermissionAction, getModulePermissionsAction } from "@/lib/db/actions/team";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Props {
  userId: string;
}

const MODULES = [
  { id: "projects", label: "Proyectos" },
  { id: "documents", label: "Documentos" },
  { id: "finances", label: "Finanzas" },
  { id: "crm", label: "CRM" },
  { id: "agenda", label: "Agenda" },
  { id: "legal", label: "Legal" },
  { id: "resources", label: "Recursos (Vault)" },
  { id: "marketing", label: "Marketing" },
  { id: "links", label: "Enlaces" },
  { id: "hub", label: "Hub de Conocimiento" },
  { id: "team", label: "Equipo" },
  { id: "settings", label: "Configuración" },
];

export function PermissionsEditor({ userId }: Props) {
  const [permissions, setPermissions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModulePermissionsAction(userId)
      .then((res) => {
        const map: Record<string, string> = {};
        for (const p of res) {
          map[p.module] = p.permission;
        }
        setPermissions(map);
      })
      .catch(() => toast.error("Error al cargar permisos"))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleChange = async (module: string, level: string) => {
    try {
      await setModulePermissionAction(userId, module, level as any);
      setPermissions((prev) => ({ ...prev, [module]: level }));
      toast.success(`Permiso de ${module} actualizado a ${level}`);
    } catch (err: any) {
      toast.error("Error al guardar permiso: " + err.message);
    }
  };

  if (loading) {
    return <div className="text-sm text-[var(--color-muted-foreground)]">Cargando permisos...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Permisos de Módulos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {MODULES.map((m) => {
          const current = permissions[m.id] || "none";
          return (
            <div key={m.id} className="flex items-center justify-between text-sm py-1 border-b border-[var(--color-border)]/50 last:border-0">
              <span className="font-medium text-[var(--color-foreground)]">{m.label}</span>
              <select
                value={current}
                onChange={(e) => handleChange(m.id, e.target.value)}
                className="rounded-md border border-[var(--color-border)] bg-background px-2.5 py-1 text-xs text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="none">Ninguno</option>
                <option value="read">Lectura</option>
                <option value="write">Escritura</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
