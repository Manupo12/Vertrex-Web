"use client";

import { Badge } from "@/components/ui/badge";

type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "info" | "purple";

const clientStatusMap: Record<string, BadgeVariant> = {
  active: "success",
  inactive: "neutral",
  paused: "warning",
};

const projectStatusMap: Record<string, BadgeVariant> = {
  active: "success",
  paused: "warning",
  completed: "info",
  cancelled: "danger",
};

const financeStatusMap: Record<string, BadgeVariant> = {
  paid: "success",
  pending: "warning",
  overdue: "danger",
};

const ticketStatusMap: Record<string, BadgeVariant> = {
  open: "warning",
  in_progress: "info",
  resolved: "success",
};

const ideaStatusMap: Record<string, BadgeVariant> = {
  semilla: "success",
  laboratorio: "purple",
  ejecutar: "warning",
  congelador: "info",
};

const repoStatusMap: Record<string, BadgeVariant> = {
  pendiente: "neutral",
  probando: "warning",
  en_uso: "success",
  descartado: "danger",
};

const storageProviderMap: Record<string, BadgeVariant> = {
  neon: "info",
  drive: "purple",
};

const labelMap: Record<string, Record<string, string>> = {
  client: {
    active: "Activo",
    inactive: "Inactivo",
    paused: "Pausado",
  },
  project: {
    active: "Activo",
    paused: "Pausado",
    completed: "Completado",
    cancelled: "Cancelado",
  },
  finance: {
    paid: "Pagado",
    pending: "Pendiente",
    overdue: "Vencido",
  },
  ticket: {
    open: "Abierto",
    in_progress: "En Progreso",
    resolved: "Resuelto",
  },
  idea: {
    semilla: "Semilla",
    laboratorio: "Laboratorio",
    ejecutar: "Ejecutar",
    congelador: "Congelador",
  },
  repo: {
    pendiente: "Pendiente",
    probando: "Probando",
    en_uso: "En Uso",
    descartado: "Descartado",
  },
  storage: {
    neon: "Neon",
    drive: "Drive",
  },
};

const variantMap: Record<string, Record<string, BadgeVariant>> = {
  client: clientStatusMap,
  project: projectStatusMap,
  finance: financeStatusMap,
  ticket: ticketStatusMap,
  idea: ideaStatusMap,
  repo: repoStatusMap,
  storage: storageProviderMap,
};

export type StatusCategory = keyof typeof variantMap;

export interface StatusBadgeProps {
  status: string;
  category: StatusCategory;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, category, label, className }: StatusBadgeProps) {
  const categoryMap = variantMap[category];
  const variant = categoryMap?.[status] ?? "neutral";

  const resolvedLabel =
    label ??
    (labelMap[category] as Record<string, string> | undefined)?.[status] ??
    status;

  return (
    <Badge variant={variant} className={className}>
      {resolvedLabel}
    </Badge>
  );
}
