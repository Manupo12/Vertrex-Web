"use client";
import { ChevronRight, Command, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { OsSession } from "@/lib/auth/session";

interface TopbarProps {
  user: OsSession | null;
}

const BREADCRUMB_MAP: Record<string, string> = {
  admin: "Dashboard",
  crm: "CRM",
  projects: "Proyectos",
  documents: "Documentos",
  legal: "Legal",
  hub: "Hub",
  resources: "Recursos",
  finances: "Finanzas",
  agenda: "Agenda",
  links: "Links",
  marketing: "Marketing",
  team: "Equipo",
  generator: "Generador",
  settings: "Configuracion",
};

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <div className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6">
      <nav className="flex items-center gap-1.5 text-sm">
        {segments.slice(1).map((seg, i, arr) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            <Link
              href={`/${segments.slice(0, i + 2).join("/")}`}
              className={cn(
                "transition-colors",
                i === arr.length - 1 ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {BREADCRUMB_MAP[seg] || seg}
            </Link>
          </span>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
        >
          <Command className="h-3.5 w-3.5" />
          <span>Buscar</span>
          <kbd className="rounded border border-border px-1 py-0.5 text-[10px]">Ctrl+K</kbd>
        </button>
        {user && (
          <div className="flex items-center gap-2 rounded-full bg-accent/50 px-3 py-1.5 text-xs">
            <User className="h-3.5 w-3.5" />
            <span className="font-medium">{user.name}</span>
            <span className="text-[10px] uppercase text-muted-foreground">{user.role}</span>
          </div>
        )}
      </div>
    </div>
  );
}
