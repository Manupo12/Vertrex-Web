"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { LayoutDashboard, Users, FolderKanban, FileText, Lightbulb, Link2, Calendar, BookOpen } from "lucide-react";
import { searchEntitiesAction, SearchResult } from "@/lib/db/actions/search";
import { DialogTitle } from "@/components/ui/dialog";

const ACTIONS = [
  { icon: LayoutDashboard, label: "Ir al Dashboard", action: "navigate", href: "/os/admin" },
  { icon: Users, label: "Nuevo cliente", action: "navigate", href: "/os/crm/new" },
  { icon: FolderKanban, label: "Nuevo proyecto", action: "navigate", href: "/os/projects/new" },
  { icon: Lightbulb, label: "Capturar idea (Ctrl+I)", action: "navigate", href: "/os/hub?view=ideas" },
  { icon: FileText, label: "Subir documento", action: "navigate", href: "/os/documents" },
  { icon: Link2, label: "Guardar link", action: "navigate", href: "/os/links" },
  { icon: Calendar, label: "Nuevo evento", action: "navigate", href: "/os/agenda" },
  { icon: BookOpen, label: "Nueva nota", action: "navigate", href: "/os/hub?view=notes" },
];

const ROUTES = [
  { label: "Dashboard", href: "/os/admin" },
  { label: "CRM", href: "/os/crm" },
  { label: "Proyectos", href: "/os/projects" },
  { label: "Documentos", href: "/os/documents" },
  { label: "Legal", href: "/os/legal" },
  { label: "Hub", href: "/os/hub" },
  { label: "Recursos", href: "/os/resources" },
  { label: "Finanzas", href: "/os/finances" },
  { label: "Agenda", href: "/os/agenda" },
  { label: "Links", href: "/os/links" },
  { label: "Marketing", href: "/os/marketing" },
  { label: "Equipo", href: "/os/team" },
  { label: "Generador", href: "/os/generator" },
  { label: "Configuracion", href: "/os/settings" },
];

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSearchResults([]);
    }
  }, [open]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length >= 2) {
        try {
          const res = await searchEntitiesAction(query);
          setSearchResults(res);
        } catch {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };
    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const runAction = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Command Menu" className="fixed inset-0 z-50">
      <DialogTitle className="sr-only">Menu de Comandos</DialogTitle>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="fixed left-1/2 top-[10%] w-full max-w-2xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar paginas, acciones o entidades..."
          className="w-full border-b border-border bg-transparent px-4 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none" 
        />
        <Command.List className="max-h-[50vh] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">Sin resultados.</Command.Empty>
          
          {searchResults.length > 0 && (
            <Command.Group heading="Entidades" className="[&_[data-value]]:text-xs [&_[data-value]]:font-medium [&_[data-value]]:text-muted-foreground [&_[data-value]]:mb-1 [&_[data-value]]:px-2 [&_[data-value]]:pt-2">
              {searchResults.map((item) => (
                <Command.Item key={item.id} onSelect={() => runAction(item.href)} className="flex flex-col items-start gap-1 rounded-lg px-3 py-2 text-sm text-foreground cursor-pointer hover:bg-accent aria-selected:bg-accent">
                  <span className="font-semibold text-base">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {query.length < 2 && (
            <>
              <Command.Group heading="Acciones rapidas" className="[&_[data-value]]:text-xs [&_[data-value]]:font-medium [&_[data-value]]:text-muted-foreground [&_[data-value]]:mb-1 [&_[data-value]]:px-2 [&_[data-value]]:pt-2">
                {ACTIONS.map((item) => (
                  <Command.Item key={item.label} onSelect={() => runAction(item.href)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-foreground cursor-pointer hover:bg-accent aria-selected:bg-accent">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    {item.label}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Navegacion" className="[&_[data-value]]:text-xs [&_[data-value]]:font-medium [&_[data-value]]:text-muted-foreground [&_[data-value]]:mb-1 [&_[data-value]]:px-2 [&_[data-value]]:pt-2">
                {ROUTES.map((item) => (
                  <Command.Item key={item.href} onSelect={() => runAction(item.href)} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground cursor-pointer hover:bg-accent aria-selected:bg-accent">
                    {item.label}
                  </Command.Item>
                ))}
              </Command.Group>
            </>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
