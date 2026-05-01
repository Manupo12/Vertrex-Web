"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  Calendar,
  CheckSquare,
  ChevronRight,
  Database,
  FileText,
  FolderKanban,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Terminal,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import {
  type WorkspaceHealthModuleKey,
  type WorkspaceHealthStatus,
} from "@/lib/ops/workspace-health";
import { useWorkspaceHealth } from "@/lib/ops/use-workspace-health";
import { useUIStore } from "@/lib/store/ui";

type OSShellProps = {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    role: "team" | "client";
  };
};

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  healthTarget?: WorkspaceHealthModuleKey | "overall";
  showCriticalCount?: boolean;
};

const getOSPath = (path = "") => {
  if (!path || path === "/") {
    return "/os";
  }

  return path.startsWith("/os") ? path : `/os${path.startsWith("/") ? path : `/${path}`}`;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: getOSPath(), healthTarget: "overall" },
  { label: "Mi día", icon: CheckSquare, path: getOSPath("/my-day") },
  { label: "Salud", icon: ShieldAlert, path: getOSPath("/health"), healthTarget: "overall", showCriticalCount: true },
  { label: "Proyectos", icon: FolderKanban, path: getOSPath("/projects"), healthTarget: "projects" },
  { label: "Documentos", icon: FileText, path: getOSPath("/docs"), healthTarget: "documents" },
  { label: "Recursos", icon: Database, path: getOSPath("/assets"), healthTarget: "assets" },
  { label: "Knowledge Hub", icon: Link2, path: getOSPath("/hub"), healthTarget: "hub" },
  { label: "CRM", icon: Users, path: getOSPath("/crm"), healthTarget: "crm" },
  { label: "Finanzas", icon: Wallet, path: getOSPath("/finance"), healthTarget: "finance" },
  { label: "Agenda", icon: Calendar, path: getOSPath("/calendar"), healthTarget: "calendar" },
  { label: "Chat", icon: MessageSquare, path: getOSPath("/chat"), healthTarget: "chat" },
  { label: "Tickets", icon: LifeBuoy, path: getOSPath("/tickets"), healthTarget: "tickets" },
  { label: "Knowledge Base", icon: BookOpen, path: getOSPath("/kb"), healthTarget: "hub" },
];

export default function OSShell({ children, user }: OSShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const open = useUIStore((store) => store.open);
  const toggle = useUIStore((store) => store.toggle);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const breadcrumbs = useMemo(() => {
    if (!pathname.startsWith("/os")) return [];
    const parts = pathname.slice(3).split("/").filter(Boolean);
    return parts.map((part, i) => {
      const path = "/os/" + parts.slice(0, i + 1).join("/");
      const label = part.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      return { path, label };
    });
  }, [pathname]);
  const { snapshot: healthSnapshot } = useWorkspaceHealth({ enabled: user.role === "team" });
  const moduleHealthMap = new Map(healthSnapshot.modules.map((module) => [module.key, module]));

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="vertrex-os-theme flex h-screen w-full overflow-hidden bg-background text-foreground">
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] flex-col justify-between border-r border-border bg-card/30 transition-transform duration-200 md:static md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div>
          <div className="flex h-16 items-center justify-between border-b border-border/50 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-black tracking-tighter text-primary-foreground shadow-[0_0_15px_rgba(0,255,135,0.3)]">
                V
              </div>
              <div>
                <span className="block text-sm font-semibold tracking-wide">Vertrex OS</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Operational shell</span>
              </div>
            </div>
            <button
              className="rounded-lg border border-border bg-secondary/40 p-2 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              onClick={() => open("commandCenter")}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-1 p-4">
            <div className="mb-3 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Operaciones</div>
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.path);
              const healthStatus = item.healthTarget === "overall"
                ? healthSnapshot.overallStatus
                : item.healthTarget
                  ? (moduleHealthMap.get(item.healthTarget)?.status ?? "healthy")
                  : null;

              return (
                <Link
                  key={item.label}
                  href={item.path}
                  className={`group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 ${
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  {item.label}
                  <div className="ml-auto flex items-center gap-2">
                    {healthStatus ? <span className={`h-2 w-2 rounded-full ${getHealthIndicatorClass(healthStatus)}`} /> : null}
                    {item.showCriticalCount && healthSnapshot.counts.critical > 0 ? (
                      <span className="rounded-full border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
                        {healthSnapshot.counts.critical}
                      </span>
                    ) : null}
                    {active ? <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,135,0.8)]" /> : null}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-1 border-t border-border/50 p-4">
          <Link
            href={getOSPath("/automations")}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
              isActivePath(pathname, getOSPath("/automations"))
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Zap className="h-4 w-4 text-amber-400" />
            Automatizaciones
          </Link>
          <Link
            href={getOSPath("/settings")}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
              isActivePath(pathname, getOSPath("/settings"))
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Settings className="h-4 w-4" />
            Configuración
          </Link>
          <button
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex flex-1 items-center gap-3">
            <button
              className="rounded-lg border border-border bg-secondary/40 p-2 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <Menu className="h-4 w-4" />
            </button>
            {breadcrumbs.length > 0 && (
              <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
                <Link href="/os" className="hover:text-foreground">
                  <Home className="h-3.5 w-3.5" />
                </Link>
                <ChevronRight className="h-3 w-3" />
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.path} className="flex items-center gap-1">
                    <Link href={crumb.path} className="transition-colors hover:text-foreground">
                      {crumb.label}
                    </Link>
                    {i < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3" />}
                  </span>
                ))}
              </nav>
            )}
            <button
              className="flex w-full max-w-md items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground transition-colors ring-offset-background hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => toggle("commandCenter")}
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>Buscar o ejecutar comando...</span>
              </div>
              <kbd className="hidden h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="hidden items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground md:flex"
              onClick={() => open("omniCreator")}
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </button>
            <button
              className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => toggle("universalInbox")}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-background bg-primary"></span>
            </button>
            <div className="mx-2 h-6 w-px bg-border"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-semibold text-white">{user.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{user.role}</div>
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary text-xs font-semibold"
                onClick={handleLogout}
              >
                {getInitials(user.name)}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 no-scrollbar scroll-smooth">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>

        <div className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="glass group flex items-center gap-2 rounded-2xl px-2 py-2 shadow-2xl animate-fade-in">
            <button
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 transition-colors hover:border-primary/50"
              onClick={() => open("commandCenter")}
            >
              <Terminal className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{getContextLabel(pathname)}</span>
              <ChevronRight className="ml-2 h-4 w-4 text-muted-foreground" />
            </button>

            <button
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_rgba(0,255,135,0.15)] transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(0,255,135,0.3)]"
              onClick={() => open("omniCreator")}
            >
              <Sparkles className="h-4 w-4" />
              Ejecutar IA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function isActivePath(pathname: string, path: string) {
  if (path === "/os") {
    return pathname === "/os";
  }

  if (path === "/") {
    return pathname === "/";
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

function getContextLabel(pathname: string) {
  const normalizedPath = pathname.startsWith("/os") ? pathname.slice(3) || "/" : pathname;

  if (normalizedPath.startsWith("/my-day")) {
    return "Mi día · En foco";
  }

  if (normalizedPath.startsWith("/crm")) {
    return "CRM · Pipeline";
  }

  if (normalizedPath.startsWith("/finance")) {
    return "Finance · Operativo";
  }

  if (normalizedPath.startsWith("/health")) {
    return "Health · Riesgos";
  }

  if (normalizedPath.startsWith("/calendar")) {
    return "Agenda · Semana";
  }

  if (normalizedPath.startsWith("/docs")) {
    return "Docs · Generator";
  }

  if (normalizedPath.startsWith("/assets")) {
    return "Assets · Library";
  }

  if (pathname.startsWith("/portal")) {
    return "Portal · Cliente";
  }

  return "Global · Empresa";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getHealthIndicatorClass(status: WorkspaceHealthStatus) {
  return status === "critical"
    ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.8)]"
    : status === "warning"
      ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]"
      : "bg-primary shadow-[0_0_8px_rgba(0,255,135,0.8)]";
}
