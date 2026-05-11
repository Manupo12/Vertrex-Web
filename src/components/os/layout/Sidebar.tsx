"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, FolderKanban, FileText, Scale, BookOpen, Shield, DollarSign, Calendar, Link2, Megaphone, Users2, Wand2, Settings, Command, LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_GROUPS = [
  {
    label: "Operacion",
    items: [
      { href: "/os/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/os/crm", label: "CRM", icon: Users },
      { href: "/os/projects", label: "Proyectos", icon: FolderKanban },
      { href: "/os/documents", label: "Documentos", icon: FileText },
      { href: "/os/legal", label: "Legal", icon: Scale },
    ],
  },
  {
    label: "Inteligencia",
    items: [
      { href: "/os/hub", label: "Hub", icon: BookOpen },
      { href: "/os/links", label: "Links", icon: Link2 },
      { href: "/os/resources", label: "Recursos", icon: Shield },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: "/os/finances", label: "Finanzas", icon: DollarSign },
      { href: "/os/agenda", label: "Agenda", icon: Calendar },
      { href: "/os/marketing", label: "Marketing", icon: Megaphone },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/os/team", label: "Equipo", icon: Users2 },
      { href: "/os/generator", label: "Generador", icon: Wand2 },
      { href: "/os/settings", label: "Config", icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn("flex h-full flex-col border-r border-border bg-card", collapsed ? "w-[60px]" : "w-[280px]")}>
      <div className={cn("flex h-16 items-center border-b border-border px-4", collapsed ? "justify-center" : "gap-2")}>
        <Link href="/os/admin" className={cn("text-lg font-bold tracking-tight text-primary", collapsed && "text-base")}>
          {collapsed ? "V" : "Vertrex OS"}
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>}
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/os/admin" && pathname.startsWith(item.href));
              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }
              return link;
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-2 space-y-1">
        <button 
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
          className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors w-full", collapsed && "justify-center px-2")}
        >
          <Command className="h-4 w-4" />
          {!collapsed && <span className="flex-1 text-left">Comandos</span>}
          {!collapsed && <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px]">Ctrl+K</kbd>}
        </button>
        <Link href="/login" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors", collapsed && "justify-center px-2")}>
          <LogOut className="h-4 w-4" />
          {!collapsed && "Salir"}
        </Link>
      </div>
    </aside>
  );
}
