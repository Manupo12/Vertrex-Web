import React, { useState } from "react";
import { 
  Zap, Plus, FolderKanban, 
  Users, FileText, Settings, Command, CornerDownLeft, 
  Sparkles, Calculator
} from "lucide-react";

export default function CommandCenter() {
  // Nota: En producción, este estado se controlaría vía Zustand y event listeners (keydown 'Cmd+K')
  const [isOpen, setIsOpen] = useState(true); 
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  return (
    <>
      {/* 1. BACKDROP & BLUR OVERLAY */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* 2. COMMAND PALETTE MODAL */}
      <div className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl z-[101] overflow-hidden flex flex-col transform transition-all animate-fade-in">
        
        {/* INPUT PRINCIPAL */}
        <div className="relative flex items-center px-4 py-4 border-b border-border/50 bg-background/50">
          <Command className="w-5 h-5 text-muted-foreground mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Escribe un comando, busca algo o habla con la IA..."
            className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground outline-none border-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {/* Indicador de IA Automático */}
          {query.startsWith("/") && (
            <div className="absolute right-4 flex items-center gap-2 bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/20 text-xs font-semibold animate-fade-in">
              <Zap className="w-3 h-3 fill-current" />
              Modo Comando
            </div>
          )}
          {query.toLowerCase().includes("resumir") && (
            <div className="absolute right-4 flex items-center gap-2 bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-md border border-purple-500/20 text-xs font-semibold animate-fade-in">
              <Sparkles className="w-3 h-3" />
              IA Activa
            </div>
          )}
        </div>

        {/* ÁREA SCROLLABLE DE RESULTADOS */}
        <div className="max-h-[50vh] overflow-y-auto no-scrollbar p-2 space-y-4">
          
          {/* SECCIÓN 1: Smart Actions (IA & Macros) */}
          <CommandSection title="Sugerencias Inteligentes">
            <CommandItem 
              icon={Sparkles} 
              iconColor="text-purple-400 bg-purple-400/10"
              title="Resumir el progreso de 'Proyecto Polaris'"
              subtitle="Generará un reporte con las últimas 48h de actividad"
              shortcut="Tab"
            />
            <CommandItem 
              icon={Plus} 
              iconColor="text-primary bg-primary/10"
              title="Crear tarea urgente para equipo Backend"
              subtitle="Atajo rápido: /crear tarea backend urgente"
              shortcut="↵"
            />
          </CommandSection>

          {/* SECCIÓN 2: Navegación & Vistas */}
          <CommandSection title="Ir a...">
            <CommandItem 
              icon={FolderKanban} 
              title="Proyectos Activos"
              shortcut="G P"
            />
            <CommandItem 
              icon={Users} 
              title="Pipeline de Ventas (CRM)"
              shortcut="G C"
            />
            <CommandItem 
              icon={Settings} 
              title="Vault & Credenciales"
              shortcut="G V"
            />
          </CommandSection>

          {/* SECCIÓN 3: Búsqueda Reciente (Entity Linking) */}
          <CommandSection title="Recientes">
            <CommandItem 
              icon={FileText} 
              iconColor="text-blue-400 bg-blue-500/10"
              title="PRD - Vertrex OS v6.0"
              subtitle="Documento • Actualizado ayer"
            />
            <CommandItem 
              icon={Calculator} 
              iconColor="text-emerald-400 bg-emerald-500/10"
              title="Acme Corp"
              subtitle="Cliente • Propuesta enviada"
            />
          </CommandSection>

        </div>

        {/* FOOTER: Atajos de teclado */}
        <div className="h-10 px-4 border-t border-border bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-background border border-border px-1.5 py-0.5 rounded font-mono text-[10px]">↑</kbd> <kbd className="bg-background border border-border px-1.5 py-0.5 rounded font-mono text-[10px]">↓</kbd> Navegar</span>
            <span className="flex items-center gap-1"><kbd className="bg-background border border-border px-1.5 py-0.5 rounded font-mono text-[10px]"><CornerDownLeft className="w-3 h-3"/></kbd> Seleccionar</span>
          </div>
          <span className="flex items-center gap-1"><kbd className="bg-background border border-border px-1.5 py-0.5 rounded font-mono text-[10px]">Esc</kbd> Cerrar</span>
        </div>

      </div>
    </>
  );
}

// ==========================================
// SUB-COMPONENTES DEL COMMAND CENTER
// ==========================================

function CommandSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="px-2">
      <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider px-2">
        {title}
      </h3>
      <div className="flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  );
}

function CommandItem({ icon: Icon, iconColor = "text-muted-foreground bg-secondary", title, subtitle, shortcut }: any) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer group hover:bg-primary/10 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg border border-border/50 group-hover:border-primary/30 transition-colors ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      {shortcut && (
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity font-mono">
          {shortcut}
        </div>
      )}
    </div>
  );
}