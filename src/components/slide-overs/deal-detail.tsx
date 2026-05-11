import React from "react";
import { 
  X, Building2, Mail, Link2, 
  MoreHorizontal, CheckCircle2, 
  DollarSign, Zap, TrendingUp, 
  CalendarDays, Percent, Target, FileText, 
  UserCircle, ArrowRight,
  ShieldCheck, FileSignature
} from "lucide-react";

export default function DealDetailSlideOver() {
  return (
    <>
      {/* 1. BACKDROP OVERLAY */}
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60] animate-fade-in" />

      {/* 2. PANEL LATERAL (SLIDE-OVER) */}
      <div className="fixed top-0 right-0 h-screen w-full max-w-[850px] bg-card border-l border-border shadow-2xl z-[70] flex flex-col transform transition-transform duration-300 translate-x-0">
        
        {/* HEADER: Título, Estado y Acciones */}
        <header className="px-6 py-4 border-b border-border flex items-start justify-between shrink-0 bg-background/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-semibold text-foreground leading-none">Vertrex OS - Enterprise</h1>
                <span className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  Propuesta Enviada
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <Building2 className="w-3.5 h-3.5" />
                <span className="font-medium hover:text-foreground cursor-pointer transition-colors">GlobalBank Corp</span>
                <span className="mx-1">•</span>
                <span className="flex items-center gap-1 text-primary"><Zap className="w-3 h-3" /> Score: 85/100</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <button className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:shadow-[0_0_15px_rgba(0,255,135,0.3)] transition-all">
              Avanzar Etapa
            </button>
            <div className="w-px h-4 bg-border mx-1"></div>
            <button className="p-1.5 hover:bg-secondary hover:text-foreground rounded-md transition-colors" title="Copiar Link"><Link2 className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-secondary hover:text-foreground rounded-md transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-destructive/20 hover:text-destructive rounded-md transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </header>

        {/* NAVEGACIÓN INTERNA */}
        <div className="px-6 border-b border-border bg-background/30 shrink-0 flex gap-6 overflow-x-auto no-scrollbar">
          <TabButton active label="Resumen del Trato" />
          <TabButton label="Timeline & Actividad" count={14} />
          <TabButton label="Documentos & Cotizaciones" count={2} />
          <TabButton label="Contactos" count={3} />
        </div>

        {/* MAIN SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          <div className="p-6 space-y-8">
            
            {/* 1. MÉTRICAS FINANCIERAS DEL TRATO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-secondary/20 border border-border rounded-xl p-4">
              <DealMetric 
                icon={DollarSign} label="Valor (TCV)" value="$180,000" 
                badge="ARR" badgeColor="text-primary border-primary/20 bg-primary/5"
              />
              <div className="flex flex-col gap-1.5 border-l border-border/50 pl-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5">
                  <Percent className="w-3 h-3" /> Probabilidad
                </span>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold font-mono text-foreground">65%</span>
                </div>
                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden border border-border mt-1">
                  <div className="h-full bg-primary" style={{ width: '65%' }}></div>
                </div>
              </div>
              <DealMetric 
                icon={CalendarDays} label="Cierre Estimado" value="15 May, 2026" 
                borderLeft
              />
              <DealMetric 
                icon={TrendingUp} label="Ciclo de Venta" value="Día 42" 
                subtext="Promedio histórico: 60 días"
                borderLeft
              />
            </div>

            {/* 2. AI DEAL COACH (Inteligencia Estratégica) */}
            <div className="bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/20 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      Análisis de Riesgo (AI Deal Coach)
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      El trato lleva <strong>7 días sin actividad</strong> en la etapa de <em>Propuesta Enviada</em>. 
                      Históricamente, los tratos con el sector bancario que superan los 10 días en esta etapa reducen su probabilidad de cierre al 20%. 
                      El contacto principal (Elena Rostova) suele responder mejor a los correos a primera hora de la mañana.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-500/10 flex gap-2">
                <button className="text-xs font-semibold bg-amber-500 text-amber-950 px-4 py-1.5 rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-sm">
                  <Zap className="w-3.5 h-3.5" /> Redactar Follow-up (IA)
                </button>
                <button className="text-xs font-medium bg-background border border-border px-4 py-1.5 rounded-lg hover:bg-secondary transition-colors">
                  Programar Alerta
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* 3. CONTACTOS Y ROLES DE COMPRA */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <UserCircle className="w-4 h-4" /> Comité de Compras
                </h4>
                <div className="space-y-3">
                  <ContactRoleCard 
                    name="Elena Rostova" role="CTO" 
                    dealRole="Decision Maker" dealRoleColor="text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                    email="elena@globalbank.com"
                  />
                  <ContactRoleCard 
                    name="Marcus Vance" role="Lead Procurement" 
                    dealRole="Legal / Blocker" dealRoleColor="text-amber-500 bg-amber-500/10 border-amber-500/20"
                    email="mvance@globalbank.com"
                  />
                </div>
              </div>

              {/* 4. DOCUMENTOS RELACIONADOS (Entity Linking) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <FileSignature className="w-4 h-4" /> Propuestas & NDAs
                  </h4>
                  <button className="text-[10px] uppercase font-bold text-primary hover:underline">Añadir</button>
                </div>
                <div className="space-y-2">
                  <DocLinkPill title="Propuesta_Vertrex_GlobalBank_v2.pdf" type="Cotización" date="Hace 4 días" />
                  <DocLinkPill title="NDA_GlobalBank_Signed.pdf" type="Legal" date="Hace 2 semanas" isSigned />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* FOOTER: QUICK NOTE / LOG ACTIVITY (Fijo abajo) */}
        <div className="p-4 border-t border-border bg-background flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2 mb-1 px-1">
            <button className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground bg-secondary/50 px-2 py-1 rounded transition-colors border border-border">Nota</button>
            <button className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary/50 px-2 py-1 rounded transition-colors">Llamada</button>
            <button className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary/50 px-2 py-1 rounded transition-colors">Email</button>
            <button className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors ml-auto flex items-center gap-1">
              <Zap className="w-3 h-3" /> Resumir con IA
            </button>
          </div>
          <div className="relative">
            <textarea 
              placeholder="Registrar interacción, notas de la reunión o siguientes pasos..." 
              className="w-full bg-secondary/30 border border-border rounded-xl pl-3 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all resize-none h-[60px]"
            ></textarea>
            <button className="absolute right-3 bottom-3 p-1.5 bg-primary text-primary-foreground rounded-lg hover:shadow-[0_0_15px_rgba(0,255,135,0.4)] transition-all">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </>
  );
}

// ==========================================
// SUB-COMPONENTES DEL DEAL DETAIL
// ==========================================

function TabButton({ label, count, active }: { label: string; count?: number; active?: boolean }) {
  return (
    <button className={`py-3 border-b-2 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
      active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
    }`}>
      {label}
      {count && <span className="bg-secondary text-muted-foreground text-[10px] font-mono px-1.5 py-0.5 rounded">{count}</span>}
    </button>
  );
}

function DealMetric({ icon: Icon, label, value, subtext, borderLeft, badge, badgeColor }: { icon: React.ElementType; label: string; value: string; subtext?: string; borderLeft?: boolean; badge?: string; badgeColor?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${borderLeft ? 'border-l border-border/50 pl-4' : 'pl-1'}`}>
      <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold font-mono text-foreground">{value}</span>
        {badge && (
          <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      {subtext && <span className="text-[10px] text-muted-foreground">{subtext}</span>}
    </div>
  );
}

function ContactRoleCard({ name, role, dealRole, dealRoleColor, email }: { name: string; role: string; dealRole: string; dealRoleColor: string; email: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            {name}
            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${dealRoleColor}`}>
              {dealRole}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">{role} • <span className="font-mono">{email}</span></p>
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 bg-secondary hover:bg-background border border-transparent hover:border-border rounded-md text-muted-foreground hover:text-foreground"><Mail className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function DocLinkPill({ title, type, date, isSigned }: { title: string; type: string; date: string; isSigned?: boolean }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-secondary/30 hover:border-primary/40 cursor-pointer transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-1.5 rounded-md ${isSigned ? 'bg-emerald-500/10 text-emerald-500' : 'bg-background text-muted-foreground'} transition-colors`}>
          {isSigned ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {title}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
            <span className="uppercase font-sans font-bold">{type}</span> • {date}
          </p>
        </div>
      </div>
      <MoreHorizontal className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  );
}