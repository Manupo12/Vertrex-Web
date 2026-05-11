import React from "react";
import { 
  X, Building2, Mail, Phone, 
  Activity, 
  Zap, MapPin, MoreHorizontal, Link2, 
  CheckCircle2, ArrowUpRight,
  MessageSquare
} from "lucide-react";

export default function ClientDetailSlideOver() {
  return (
    <>
      {/* 1. BACKDROP OVERLAY */}
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60] animate-fade-in" />

      {/* 2. PANEL LATERAL (SLIDE-OVER MASIVO) */}
      <div className="fixed top-0 right-0 h-screen w-full max-w-[850px] bg-card border-l border-border shadow-2xl z-[70] flex flex-col transform transition-transform duration-300 translate-x-0">
        
        {/* HEADER: Acciones Rápidas y Metadata */}
        <header className="px-6 py-4 border-b border-border flex items-start justify-between shrink-0 bg-background/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-semibold text-foreground leading-none">GlobalBank Corp</h1>
                <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" /> Cliente Activo
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 hover:text-foreground cursor-pointer"><GlobeIcon className="w-3.5 h-3.5" /> globalbank.com</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> New York, US</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <button className="p-1.5 hover:bg-secondary hover:text-foreground rounded-md transition-colors" title="Copiar Link CRM"><Link2 className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-secondary hover:text-foreground rounded-md transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-border mx-1"></div>
            <button className="p-1.5 hover:bg-destructive/20 hover:text-destructive rounded-md transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </header>

        {/* NAVEGACIÓN INTERNA (Sub-vistas comprimidas) */}
        <div className="px-6 border-b border-border bg-background/30 shrink-0 flex gap-6">
          <TabButton active label="Resumen & Datos" />
          <TabButton label="Historial (Timeline)" count={12} />
          <TabButton label="Contratos & Docs" count={3} />
          <TabButton label="Finanzas & Pagos" />
        </div>

        {/* MAIN SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          <div className="p-6 space-y-8">
            
            {/* IA COO: HEALTH SCORE & INSIGHTS */}
            <div className="bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Inteligencia de Cuenta</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      La probabilidad de renovación en Q3 es del <strong>85%</strong>. Sin embargo, no hay reuniones agendadas en los últimos 30 días. Sugiero enviar el reporte de métricas automatizado para mantener el engagement.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-primary font-mono">92/100</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Health Score</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-primary/10 flex gap-2">
                <button className="text-xs font-semibold bg-background border border-border px-3 py-1.5 rounded-lg hover:border-primary/50 hover:text-primary transition-colors flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Redactar Follow-up
                </button>
                <button className="text-xs font-medium bg-background border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
                  Generar Reporte Q2
                </button>
              </div>
            </div>

            {/* GRID DE DATOS Y CONTACTOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Contactos Clave */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> Contactos Clave
                </h4>
                <div className="space-y-2">
                  <ContactCard name="Elena Rostova" role="CTO" isPrimary />
                  <ContactCard name="Marcus Vance" role="Lead Procurement" />
                </div>
              </div>

              {/* Metadatos y Campos Personalizados */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Información CRM</h4>
                <div className="bg-card border border-border rounded-xl p-3 space-y-3">
                  <MetadataRow label="Industria" value="Fintech / Banking" />
                  <MetadataRow label="Tamaño de Empresa" value="1,000 - 5,000 emp." />
                  <MetadataRow label="MRR Actual" value="$15,000.00" isMono isPrimary />
                  <MetadataRow label="Origen del Lead" value="Inbound (Referral)" />
                </div>
              </div>
            </div>

            {/* SUB-VISTA: PROYECTOS ACTIVOS (Entity Linking) */}
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> Proyectos Vinculados
              </h4>
              <div className="space-y-2">
                <ProjectPill id="NEX" name="Migración Core Bancario v2" status="En Progreso" progress={65} />
                <ProjectPill id="SEC" name="Auditoría de Seguridad Q1" status="Completado" progress={100} />
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER: QUICK NOTE / ACCIÓN (Fijo abajo) */}
        <div className="h-16 px-6 border-t border-border bg-background flex items-center gap-3 shrink-0">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Añadir nota rápida, registrar llamada o /comando..." 
              className="w-full bg-secondary/50 border border-border rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-primary transition-colors">
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ==========================================
// SUB-COMPONENTES DEL SLIDE-OVER
// ==========================================

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
}

function TabButton({ label, count, active }: { label: string; count?: number; active?: boolean }) {
  return (
    <button className={`py-3 border-b-2 text-sm font-medium transition-colors flex items-center gap-2 ${
      active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
    }`}>
      {label}
      {count && <span className="bg-secondary text-muted-foreground text-[10px] font-mono px-1.5 py-0.5 rounded">{count}</span>}
    </button>
  );
}

function ContactCard({ name, role, isPrimary }: { name: string; role: string; isPrimary?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            {name} {isPrimary && <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-1 rounded uppercase">Principal</span>}
          </p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 bg-secondary hover:bg-background border border-transparent hover:border-border rounded-md text-muted-foreground hover:text-foreground"><Mail className="w-3.5 h-3.5" /></button>
        <button className="p-1.5 bg-secondary hover:bg-background border border-transparent hover:border-border rounded-md text-muted-foreground hover:text-foreground"><Phone className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function MetadataRow({ label, value, isMono, isPrimary }: { label: string; value: string; isMono?: boolean; isPrimary?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm ${isMono ? 'font-mono font-semibold' : 'font-medium'} ${isPrimary ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}

function ProjectPill({ id, name, status, progress }: { id: string; name: string; status: string; progress: number }) {
  const isDone = progress === 100;
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30 hover:border-primary/40 cursor-pointer transition-colors group">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-md ${isDone ? 'bg-background text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
          {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground bg-background px-1 rounded border border-border">{id}</span>
            {name}
          </p>
          <p className="text-xs text-muted-foreground">{status}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden border border-border">
          <div className={`h-full ${isDone ? 'bg-muted-foreground' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}