import React from "react";
import { 
  X, Maximize2, MoreHorizontal, Link2, GitCommit, 
  Clock, User, Calendar, Paperclip, MessageSquare, 
  Zap, ArrowRight, Play, CheckCircle2, ChevronDown,
  Database, FileText
} from "lucide-react";

export default function TaskSlideOver() {
  return (
    <>
      {/* 1. BACKDROP OVERLAY */}
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 animate-fade-in" />

      {/* 2. PANEL LATERAL (SLIDE-OVER) */}
      <div className="fixed top-0 right-0 h-screen w-full max-w-[700px] bg-card border-l border-border shadow-2xl z-50 flex flex-col transform transition-transform duration-300 translate-x-0">
        
        {/* HEADER: Acciones Rápidas */}
        <header className="h-14 px-5 border-b border-border flex items-center justify-between shrink-0 bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
            <span className="hover:text-foreground cursor-pointer">NEXUS</span>
            <span>/</span>
            <span className="text-foreground font-semibold">NEX-140</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <button className="p-1.5 hover:bg-muted hover:text-foreground rounded-md transition-colors" title="Copiar Link">
              <Link2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-muted hover:text-foreground rounded-md transition-colors" title="Expandir">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-muted hover:text-foreground rounded-md transition-colors" title="Opciones">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-border mx-1"></div>
            <button className="p-1.5 hover:bg-destructive/20 hover:text-destructive rounded-md transition-colors" title="Cerrar">
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          <div className="p-6 md:p-8 space-y-8">
            
            {/* Título & Estado Principal */}
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight outline-none focus:ring-2 focus:ring-primary/50 rounded-md" contentEditable suppressContentEditableWarning>
                Implementar Omni-Switcher en Next.js
              </h1>
              
              {/* Botón de Acción Principal (Tracking) */}
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(0,255,135,0.1)] group">
                  <Play className="w-4 h-4 fill-current group-hover:text-primary-foreground" />
                  Iniciar Tracking
                </button>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> 00:00:00
                </span>
              </div>
            </div>

            {/* METADATOS (Grid de Propiedades) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 py-4 border-y border-border/50">
              <PropertyRow icon={CheckCircle2} label="Estado" value="En Progreso" valueColor="text-primary" />
              <PropertyRow icon={User} label="Asignado" value="Juan M." avatar="JM" />
              <PropertyRow icon={GitCommit} label="Prioridad" value="Urgente" valueColor="text-destructive" />
              <PropertyRow icon={Calendar} label="Due Date" value="Hoy" />
              <PropertyRow icon={Zap} label="Esfuerzo" value="3 Puntos" />
            </div>

            {/* 🔗 ENTITY LINKING (El superpoder de Vertrex) */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4" />
                Relaciones (Entity Graph)
              </h3>
              <div className="flex flex-col gap-2">
                {/* Link a Documento */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30 hover:border-primary/40 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">PRD - Interfaz Principal</p>
                      <p className="text-xs text-muted-foreground">Documento • Actualizado hace 2h</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* DESCRIPCIÓN (Rich Text Placeholder) */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Descripción</h3>
              <div className="text-sm text-foreground/80 leading-relaxed space-y-4">
                <p>El Omni-Switcher debe ser un componente flotante (HUD) en la parte inferior de la pantalla. No debe recargar la página cuando se cambia de contexto.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Usar <code className="bg-secondary px-1.5 py-0.5 rounded text-xs text-primary">useOSStore</code> para el estado global.</li>
                  <li>Animación de entrada <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">animate-fade-in</code>.</li>
                  <li>Efecto glassmorphism.</li>
                </ul>
              </div>
            </div>

            {/* IA AUTÓNOMA: Sugerencias y Resumen */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <div className="mt-0.5">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">IA COO sugiere</h4>
                <p className="text-sm text-muted-foreground mb-3">Esta tarea tiene dependencias bloqueantes con <span className="text-foreground underline decoration-border underline-offset-4 cursor-pointer">NEX-138</span>. ¿Quieres notificar a Seguridad?</p>
                <button className="text-xs font-semibold bg-background border border-border px-3 py-1.5 rounded-md hover:border-primary/50 hover:text-primary transition-colors">
                  Generar notificación
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER: Input de Comentarios (Fijo abajo) */}
        <div className="h-16 px-5 border-t border-border bg-background flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold shrink-0">
            JM
          </div>
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Añadir comentario o presiona / para comandos..." 
              className="w-full bg-secondary/50 border border-border rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-primary transition-colors">
              <Paperclip className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Sub-componente para el Grid de Propiedades
function PropertyRow({ icon: Icon, label, value, valueColor = "text-foreground", avatar }: { icon: React.ElementType; label: string; value: string; valueColor?: string; avatar?: string }) {
  return (
    <div className="flex flex-col gap-1.5 group cursor-pointer">
      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <div className="flex items-center gap-2 hover:bg-secondary/50 p-1 -ml-1 rounded-md transition-colors">
        {avatar && (
          <div className="w-5 h-5 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-[10px] font-bold">
            {avatar}
          </div>
        )}
        <span className={`text-sm font-medium flex items-center gap-1 ${valueColor}`}>
          {value} <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>
      </div>
    </div>
  );
}