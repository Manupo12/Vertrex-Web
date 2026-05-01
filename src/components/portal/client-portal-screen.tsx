"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  CircleDashed,
  Clock,
  CreditCard,
  FileText,
  FolderOpen,
  Key,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquare,
  ShieldCheck,
  UploadCloud,
  Zap,
} from "lucide-react";

import {
  getDocumentGeneratorHref,
  getPortalQuickTemplates,
  type DocumentTemplateDefinition,
} from "@/lib/docs/template-catalog";
import { getPortalPath } from "@/lib/portal/routing";
import {
  resolvePortalClient,
  type PortalChecklistItem,
  type PortalClient,
  type PortalDocument,
  type PortalFile,
  type PortalInvoice,
  type PortalProjectSummary,
  type PortalTask,
  type PortalTicket,
  type PortalTimelineItem,
  type PortalView,
} from "@/lib/portal/client-portal-data";
import { useUIStore, type UIStore } from "@/lib/store/ui";

type ClientPortalScreenProps = {
  clientId: string;
  view?: string;
  initialClient?: PortalClient;
};

type OpenOverlay = UIStore["open"];

const portalViews: Array<{
  key: PortalView;
  label: string;
  icon: typeof LayoutDashboard;
  alert?: string;
}> = [
  { key: "overview", label: "Dashboard General", icon: LayoutDashboard },
  { key: "progress", label: "Progreso & Tareas", icon: CheckCircle2 },
  { key: "documents", label: "Documentos Legales", icon: FileText },
  { key: "billing", label: "Pagos & Facturación", icon: CreditCard, alert: "Pago Pendiente" },
  { key: "credentials", label: "Credenciales & Accesos", icon: Key },
  { key: "files", label: "Archivos Compartidos", icon: UploadCloud },
  { key: "support", label: "Soporte Técnico", icon: LifeBuoy },
  { key: "chat", label: "Chat Directo", icon: MessageSquare },
];

export default function ClientPortalScreen({ clientId, view, initialClient }: ClientPortalScreenProps) {
  const router = useRouter();
  const client = initialClient ?? resolvePortalClient(clientId);
  const activeView = isPortalView(view) ? view : "overview";
  const open: OpenOverlay = useUIStore((store) => store.open);
  const quickTemplates = getPortalQuickTemplates(client.id);

  const openDocument = (document: PortalDocument) => {
    if (document.href) {
      window.open(document.href, "_blank", "noopener,noreferrer");
      return;
    }

    if (document.overlay === "contract") {
      open("contractDetail", document.overlayId);
      return;
    }

    if (document.overlay === "asset") {
      open("assetDetail", document.overlayId);
      return;
    }

    open("ticketDetail", document.overlayId);
  };

  const handleTemplateSelection = (id: string) => {
    router.push(
      getDocumentGeneratorHref({
        templateId: id,
        clientId: client.id,
        source: "portal",
      }),
    );
  };

  const openTemplateSelector = () => {
    open("templateSelector", {
      onSelect: handleTemplateSelection,
    });
  };

  const openFile = (file: PortalFile) => {
    if (file.href) {
      window.open(file.href, "_blank", "noopener,noreferrer");
      return;
    }

    open("assetDetail", file.id);
  };

  const handlePrimaryAction = () => {
    if (client.nextActionContext.toLowerCase().includes("legal")) {
      const contractDocument = client.documents.find((document) => document.overlay === "contract");

      if (contractDocument) {
        openDocument(contractDocument);
        return;
      }
    }

    if (client.nextActionContext.toLowerCase().includes("factur")) {
      router.push(getPortalHref(client.id, "billing"));
      return;
    }

    if (client.nextActionContext.toLowerCase().includes("soporte")) {
      router.push(getPortalHref(client.id, "support"));
      return;
    }

    if (client.nextActionContext.toLowerCase().includes("credencial")) {
      open("connectCredential");
      return;
    }

    if (client.documents.length > 0) {
      router.push(getPortalHref(client.id, "documents"));
      return;
    }

    router.push(getPortalHref(client.id, "progress"));
  };

  const handleNavigateToView = (nextView: PortalView) => {
    router.push(getPortalHref(client.id, nextView));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A] font-sans text-white selection:bg-[#00FA82]/30">
      <aside className="relative z-20 flex w-[280px] shrink-0 flex-col border-r border-white/10 bg-[#050505]">
        <div className="border-b border-white/10 p-6">
          <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Portal de Cliente
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-2">
              <Building2 className="h-full w-full text-black" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">{client.brand}</h2>
              <p className="mt-1 font-mono text-xs text-[#00FA82]">{client.statusLabel}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4 no-scrollbar">
          {portalViews.slice(0, 6).map((item) => (
            <PortalNavItem
              key={item.key}
              clientId={client.id}
              view={item.key}
              icon={item.icon}
              label={item.label}
              active={activeView === item.key}
              alert={item.alert}
            />
          ))}
          <div className="mt-4 border-t border-white/10 pt-4">
            {portalViews.slice(6).map((item) => (
              <PortalNavItem
                key={item.key}
                clientId={client.id}
                view={item.key}
                icon={item.icon}
                label={item.label}
                active={activeView === item.key}
                alert={item.alert}
              />
            ))}
          </div>
        </nav>

        <div className="border-t border-white/10 bg-[#111] p-4">
          <div className="flex items-center gap-2 font-mono text-xs text-gray-400">
            <Zap className="h-3.5 w-3.5 text-[#00FA82]" /> Powered by Vertrex
          </div>
          <button
            className="mt-3 flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-left text-xs font-bold uppercase tracking-widest text-gray-400 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="relative flex-1 overflow-y-auto custom-scrollbar">
        <div className="absolute left-0 top-0 -z-10 h-[300px] w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00FA82]/5 via-[#0A0A0A] to-[#0A0A0A]"></div>

        <div className="mx-auto max-w-[1200px] space-y-8 p-8 pb-32 md:p-12">
          <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">{client.welcomeTitle}</h1>
              <p className="mt-2 text-sm text-gray-400">{client.welcomeDescription}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {client.statusHighlights.map((highlight) => (
                  <span
                    key={highlight.label}
                    className="rounded-full border border-white/10 bg-[#111] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400"
                  >
                    {highlight.label}: <span className="text-white">{highlight.value}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#111] p-2 pr-4">
              <div className="rounded-lg bg-[#00FA82]/10 p-2 text-[#00FA82]">
                <CircleDashed className="h-5 w-5 animate-[spin_4s_linear_infinite]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Fase Actual</p>
                <p className="text-sm font-bold text-white">{client.phase}</p>
              </div>
            </div>
          </header>

          {renderPortalView(
            activeView,
            client,
            openDocument,
            openFile,
            open,
            quickTemplates,
            openTemplateSelector,
            handleTemplateSelection,
            handlePrimaryAction,
            handleNavigateToView,
          )}
        </div>
      </main>

      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
        <div className="max-w-[250px] rounded-2xl rounded-br-none border border-white/10 bg-[#111] p-3 shadow-2xl animate-fade-in-up">
          <p className="text-xs leading-relaxed text-gray-300">
            ¡Hola! Soy el asistente IA de Vertrex. Puedo explicarte el avance técnico o recibir tus dudas.
          </p>
        </div>
        <button
          className="flex h-14 w-14 items-center justify-center rounded-none border border-[#00FA82] bg-[#00FA82] text-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          onClick={() => open("threadDetail", "support-thread")}
        >
          <Bot className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}

function PortalChecklistRow({ item, onOpen }: { item: PortalChecklistItem; onOpen: () => void }) {
  const icon =
    item.status === "done"
      ? <Check className="h-3.5 w-3.5 text-black" />
      : item.status === "active"
        ? <Clock className="h-3.5 w-3.5 text-[#00FA82]" />
        : <CircleDashed className="h-3.5 w-3.5 text-gray-500" />;
  const iconClassName =
    item.status === "done"
      ? "border-transparent bg-[#00FA82]"
      : item.status === "active"
        ? "border-[#00FA82]/30 bg-[#00FA82]/10"
        : "border-white/10 bg-black/40";

  return (
    <button
      className="flex w-full items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-left transition-colors hover:border-[#00FA82]/20 hover:bg-black/40"
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${iconClassName}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{item.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.description}</p>
        </div>
      </div>
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#00FA82]">
        {item.ctaLabel ?? "Abrir"}
      </span>
    </button>
  );
}

function PortalProjectCard({ project, compact = false }: { project: PortalProjectSummary; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white">{project.name}</p>
          <p className="mt-1 text-xs text-gray-500">{project.focusLabel}</p>
        </div>
        <StatusChip status={project.status} />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full border border-white/10 bg-black">
        <div className="h-full bg-[#00FA82] shadow-[0_0_10px_rgba(0,250,130,0.4)]" style={{ width: `${project.progress}%` }} />
      </div>
      <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-3"}`}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Progreso</p>
          <p className="mt-2 font-mono text-sm font-black text-white">{project.progress}%</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tareas</p>
          <p className="mt-2 font-mono text-sm font-black text-white">{project.openTasks}</p>
        </div>
        {!compact ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Docs</p>
            <p className="mt-2 font-mono text-sm font-black text-white">{project.documents}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-4 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[10px] font-mono text-gray-500">
        Último update · {project.lastUpdate}
      </div>
    </div>
  );
}

function ChatView({ client, open }: { client: PortalClient; open: OpenOverlay }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState(client.messages);

  useEffect(() => {
    setMessages(client.messages);
  }, [client.messages]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/portal/messages");
        if (res.ok) {
          const data = await res.json();
          if (data?.messages && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        }
      } catch {
        // silent fail on polling
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = draft.trim();

    if (!message) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/portal/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "No fue posible enviar tu mensaje.");
      }

      setDraft("");
      if (payload?.messages) {
        setMessages(payload.messages);
      } else {
        router.refresh();
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible enviar tu mensaje.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_0.9fr]">
      <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight text-white">Chat operativo con Vertrex</h3>
            <p className="mt-1 text-sm text-gray-400">Historial reciente entre tu equipo, Vertrex y el asistente IA del proyecto.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#00FA82]/20 bg-[#00FA82]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#00FA82]">
            <span className="h-2 w-2 rounded-full bg-[#00FA82]"></span>
            Equipo en línea
          </div>
        </div>

        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map((message) => {
              const isClient = message.role === "client";
              const isAssistant = message.role === "assistant";

              return (
                <div key={message.id} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl border px-4 py-3 ${
                      isClient
                        ? "border-[#00FA82]/30 bg-[#00FA82]/10 text-white"
                        : isAssistant
                          ? "border-blue-500/20 bg-blue-500/10 text-blue-50"
                          : "border-white/10 bg-black/40 text-white"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <span>{message.sender}</span>
                      <span className="text-gray-600">•</span>
                      <span>{message.at}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{message.body}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <PortalEmptyState
              title="Aún no hay mensajes en este canal"
              description="Cuando tu equipo o Vertrex escriban desde el portal, el historial aparecerá aquí en tiempo real."
            />
          )}
        </div>

        <form className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4" onSubmit={handleSubmit}>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">Responder en el canal</label>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribe tu mensaje, solicitud o pregunta para Vertrex..."
            className="mt-3 min-h-28 w-full resize-none rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-[#00FA82]/40"
            disabled={submitting}
          />
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              {error ? <p className="text-xs text-amber-500">{error}</p> : <p className="text-xs text-gray-500">Tu mensaje se guarda en el historial real del portal y genera respuesta IA contextual.</p>}
            </div>
            <button
              type="submit"
              disabled={submitting || draft.trim().length === 0}
              className="rounded-lg bg-[#00FA82] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#00FA82]/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Enviando..." : "Enviar mensaje"}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-[#00FA82]/30 bg-[#111] p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#00FA82]">
            <Bot className="h-4 w-4" /> Asistencia inteligente
          </h3>
          <p className="mt-3 text-sm text-gray-400">Puedes abrir un hilo con IA contextual sobre progreso, facturas, documentos y próximos hitos.</p>
          <div className="mt-4 flex gap-2">
            <button className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 transition-colors hover:bg-white/5" onClick={() => open("threadDetail", "support-thread")}>Abrir hilo IA</button>
            <button className="rounded-lg bg-[#00FA82] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#00FA82]/90" onClick={() => open("createTicket")}>Escalar soporte</button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Contexto rápido</h3>
          <div className="mt-4 space-y-3">
            <FinanceLine icon={<CheckCircle2 className="h-3.5 w-3.5 text-[#00FA82]" />} label="Fase" value={client.phase} />
            <FinanceLine icon={<FileText className="h-3.5 w-3.5 text-white" />} label="Documentos" value={String(client.documents.length)} />
            <FinanceLine icon={<CreditCard className="h-3.5 w-3.5 text-amber-500" />} label="Pendiente" value={client.pending} valueClassName="text-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateRequestCard({
  template,
  onSelect,
}: {
  template: DocumentTemplateDefinition;
  onSelect: () => void;
}) {
  return (
    <button
      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-4 text-left transition-colors hover:border-[#00FA82]/30 hover:bg-black/60"
      onClick={onSelect}
    >
      <div>
        <p className="text-sm font-bold text-white">{template.title}</p>
        <p className="mt-1 text-xs text-gray-500">{template.type} · {template.kind}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[#00FA82]" />
    </button>
  );
}

function renderPortalView(
  activeView: PortalView,
  client: PortalClient,
  openDocument: (document: PortalDocument) => void,
  openFile: (file: PortalFile) => void,
  open: OpenOverlay,
  quickTemplates: DocumentTemplateDefinition[],
  onRequestDocument: () => void,
  onQuickTemplateSelect: (id: string) => void,
  onPrimaryAction: () => void,
  onNavigateToView: (view: PortalView) => void,
) {
  switch (activeView) {
    case "progress":
      return <ProgressView client={client} open={open} />;
    case "documents":
      return (
        <DocumentsView
          client={client}
          openDocument={openDocument}
          open={open}
          quickTemplates={quickTemplates}
          onRequestDocument={onRequestDocument}
          onQuickTemplateSelect={onQuickTemplateSelect}
        />
      );
    case "billing":
      return <BillingView client={client} open={open} />;
    case "credentials":
      return <CredentialsView client={client} open={open} />;
    case "files":
      return <FilesView client={client} open={open} openFile={openFile} />;
    case "support":
      return <SupportView client={client} open={open} />;
    case "chat":
      return <ChatView client={client} open={open} />;
    default:
      return <OverviewView client={client} openDocument={openDocument} open={open} onPrimaryAction={onPrimaryAction} onNavigateToView={onNavigateToView} />;
  }
}

function OverviewView({
  client,
  openDocument,
  open,
  onPrimaryAction,
  onNavigateToView,
}: {
  client: PortalClient;
  openDocument: (document: PortalDocument) => void;
  open: OpenOverlay;
  onPrimaryAction: () => void;
  onNavigateToView: (view: PortalView) => void;
}) {
  const reentrySummary = client.reentrySummary ?? buildPortalReentrySummary(client);
  const onboardingChecklist = client.onboardingChecklist ?? buildPortalOnboardingChecklist(client);
  const completedChecklistItems = onboardingChecklist.filter((item) => item.status === "done").length;
  const projectPortfolio = client.projects ?? [];

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-2xl border border-[#00FA82]/20 bg-[#111] p-6 shadow-[0_0_25px_rgba(0,250,130,0.04)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="rounded-full border border-[#00FA82]/20 bg-[#00FA82]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#00FA82]">
                Resumen de reentrada
              </span>
              <h3 className="mt-4 text-2xl font-black tracking-tight text-white">{reentrySummary.title}</h3>
              <p className="mt-2 text-sm text-gray-400">
                Punto recomendado: <span className="text-white">{reentrySummary.recommendedLabel}</span>
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:border-[#00FA82]/30 hover:text-[#00FA82]"
              onClick={() => onNavigateToView(reentrySummary.recommendedView)}
            >
              Abrir vista recomendada <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Último update</p>
              <p className="mt-3 text-sm font-semibold text-white">{reentrySummary.lastUpdateLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Momentum</p>
              <p className="mt-3 text-sm font-semibold text-white">{reentrySummary.momentumLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Atención</p>
              <p className="mt-3 text-sm font-semibold text-white">{reentrySummary.attentionLabel}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-[#00FA82] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#00FA82]/90"
              onClick={onPrimaryAction}
            >
              {client.nextActionCta} <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 transition-colors hover:border-white/20 hover:text-white"
              onClick={() => onNavigateToView("progress")}
            >
              Volver al roadmap <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Onboarding guiado</h3>
              <p className="mt-2 text-sm text-gray-500">Ruta mínima para ponerte al día y destrabar el proyecto desde el portal.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              {completedChecklistItems}/{onboardingChecklist.length}
            </span>
          </div>
          <div className="mt-6 space-y-3">
            {onboardingChecklist.map((item) => (
              <PortalChecklistRow
                key={item.id}
                item={item}
                onOpen={item.view ? () => onNavigateToView(item.view!) : onPrimaryAction}
              />
            ))}
          </div>
        </section>
      </div>

      {projectPortfolio.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-[#111] p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Portafolio activo</h3>
              <p className="mt-2 text-sm text-gray-500">Vista consolidada de los tracks y proyectos visibles para tu cuenta.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              {projectPortfolio.length} proyectos
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {projectPortfolio.map((project) => (
              <PortalProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#111] p-6">
          <div className="absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-[#00FA82]/5 blur-3xl"></div>
          <div className="relative z-10 mb-6 flex items-start justify-between">
            <div className="rounded-xl border border-white/10 bg-black p-2.5">
              <CheckCircle2 className="h-5 w-5 text-[#00FA82]" />
            </div>
            <span className="font-mono text-3xl font-black">{client.progress}%</span>
          </div>
          <div className="relative z-10">
            <h3 className="mb-1 text-sm font-bold text-white">Progreso del Proyecto</h3>
            <p className="mb-4 text-xs text-gray-400">
              {client.completedTasks} de {client.totalTasks} tareas completadas
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black">
              <div
                className="h-full bg-[#00FA82] shadow-[0_0_10px_rgba(0,250,130,0.5)]"
                style={{ width: `${client.progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111] p-6">
          <div className="relative z-10 mb-4 flex items-start justify-between">
            <div className="rounded-xl border border-white/10 bg-black p-2.5">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Total Inversión
              </span>
              <span className="font-mono text-xl font-black">{client.totalInvestment}</span>
            </div>
          </div>
          <div className="relative z-10 space-y-3 border-t border-white/10 pt-2">
            <FinanceLine icon={<Check className="h-3.5 w-3.5 text-[#00FA82]" />} label="Pagado" value={client.paid} />
            <FinanceLine icon={<Clock className="h-3.5 w-3.5 text-amber-500" />} label="Pendiente" value={client.pending} valueClassName="text-amber-500" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#00FA82]/30 bg-[#111] p-6">
          <div>
            <h3 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#00FA82]">
              <Zap className="h-4 w-4" /> Requiere tu acción
            </h3>
            <p className="mt-2 text-sm text-gray-400">{client.nextAction}</p>
          </div>
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#00FA82] py-2.5 text-xs font-bold text-black transition-colors hover:bg-[#00FA82]/90"
            onClick={onPrimaryAction}
          >
            {client.nextActionCta} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
          <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-gray-400">
            Próximos Entregables
          </h3>
          {client.timeline.length > 0 ? (
            <div className="relative space-y-5 before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-px before:bg-white/10">
              {client.timeline.map((item) => (
                <PortalTimeline key={`${item.title}-${item.date}`} item={item} />
              ))}
            </div>
          ) : (
            <PortalEmptyState
              title="Sin entregables programados todavía"
              description="Los próximos hitos aparecerán aquí cuando existan tareas, documentos o eventos sincronizados para tu proyecto."
            />
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
              Archivos & Legal
            </h3>
            <Link
              href={getPortalHref(client.id, "documents")}
              className="text-[10px] font-bold uppercase text-[#00FA82] hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {client.documents.length > 0 ? (
              client.documents.slice(0, 3).map((document) => (
                <PortalDocRow key={document.id} document={document} onOpen={() => openDocument(document)} />
              ))
            ) : (
              <PortalEmptyState
                title="No hay documentos compartidos aún"
                description="Aquí verás contratos, entregables y soportes cuando estén disponibles en el proyecto."
              />
            )}
          </div>
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-3 text-xs font-bold text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            onClick={() => open("uploadFile", { context: "Portal" })}
          >
            <UploadCloud className="h-4 w-4" /> Subir material nuevo
          </button>
        </div>
      </div>
    </>
  );
}

function ProgressView({ client, open }: { client: PortalClient; open: OpenOverlay }) {
  return (
    <div className="space-y-6">
      {client.projects && client.projects.length > 1 ? (
        <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Tracks del cliente</h3>
            <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              {client.projects.length} frentes
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {client.projects.map((project) => (
              <PortalProjectCard key={project.id} project={project} compact />
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Roadmap & Estado</h3>
            <span className="rounded-full border border-[#00FA82]/20 bg-[#00FA82]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#00FA82]">
              {client.progress}% completado
            </span>
          </div>
          {client.timeline.length > 0 ? (
            <div className="relative space-y-5 before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-px before:bg-white/10">
              {client.timeline.map((item) => (
                <PortalTimeline key={`${item.title}-${item.date}`} item={item} />
              ))}
            </div>
          ) : (
            <PortalEmptyState
              title="Aún no hay roadmap visible"
              description="Cuando Vertrex sincronice hitos, tareas o eventos, el estado del proyecto aparecerá aquí."
            />
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Tareas del cliente</h3>
            {client.tasks.length > 0 ? <button className="text-[10px] font-bold uppercase text-[#00FA82] hover:underline" onClick={() => open("taskDetail", client.tasks[0].id)}>Abrir tablero</button> : null}
          </div>
          <div className="space-y-3">
            {client.tasks.length > 0 ? (
              client.tasks.map((task) => (
                <PortalTaskRow key={task.id} task={task} onOpen={() => open("taskDetail", task.id)} />
              ))
            ) : (
              <PortalEmptyState
                title="No hay tareas activas todavía"
                description="Las tareas visibles para tu equipo aparecerán aquí cuando se creen o sincronicen desde Vertrex OS."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentsView({
  client,
  openDocument,
  open,
  quickTemplates,
  onRequestDocument,
  onQuickTemplateSelect,
}: {
  client: PortalClient;
  openDocument: (document: PortalDocument) => void;
  open: OpenOverlay;
  quickTemplates: DocumentTemplateDefinition[];
  onRequestDocument: () => void;
  onQuickTemplateSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-white">Documentación y entregables</h3>
          <p className="mt-1 text-sm text-gray-400">Contratos, soportes, entregables y assets compartidos con trazabilidad.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 transition-colors hover:bg-white/5" onClick={onRequestDocument}>Solicitar documento</button>
          <button className="rounded-lg bg-[#00FA82] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#00FA82]/90" onClick={() => open("uploadFile", { context: "Portal" })}>Subir archivo</button>
        </div>
      </div>
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {quickTemplates.map((template) => (
          <TemplateRequestCard key={template.id} template={template} onSelect={() => onQuickTemplateSelect(template.id)} />
        ))}
      </div>
      <div className="space-y-3">
        {client.documents.length > 0 ? (
          client.documents.map((document) => (
            <PortalDocRow key={document.id} document={document} onOpen={() => openDocument(document)} />
          ))
        ) : (
          <PortalEmptyState
            title="No hay documentos en esta sección"
            description="Puedes solicitar un documento o subir archivos nuevos desde el portal cuando lo necesites."
          />
        )}
      </div>
    </div>
  );
}

function BillingView({ client, open }: { client: PortalClient; open: OpenOverlay }) {
  const invoiceSupportId = client.invoices.find((invoice) => invoice.status !== "paid")?.supportId ?? client.tickets[0]?.id ?? null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard label="Total contratado" value={client.totalInvestment} tone="primary" />
        <MetricCard label="Pagado" value={client.paid} tone="success" />
        <MetricCard label="Pendiente" value={client.pending} tone="warning" />
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight text-white">Facturación y pagos</h3>
            <p className="mt-1 text-sm text-gray-400">Historial de invoices, estados y soporte sobre cobros.</p>
          </div>
          <button className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 transition-colors hover:bg-white/5" onClick={() => (invoiceSupportId ? open("ticketDetail", invoiceSupportId) : open("createTicket"))}>Solicitar soporte de pago</button>
        </div>
        <div className="space-y-3">
          {client.invoices.length > 0 ? (
            client.invoices.map((invoice) => (
              <PortalInvoiceRow key={invoice.id} invoice={invoice} onOpen={() => open("ticketDetail", invoice.supportId)} />
            ))
          ) : (
            <PortalEmptyState
              title="No hay invoices registradas"
              description="Las facturas y estados de cobro aparecerán aquí cuando existan movimientos reales para tu cuenta."
            />
          )}
        </div>

        {client.invoices.some((i) => i.status !== "paid") && (
          <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-[#00FA82]/20 bg-black/30 p-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-[#00FA82]">Pago en línea</h4>
            <p className="text-sm text-gray-400">Paga tu saldo pendiente de forma segura con tarjeta de crédito o débito.</p>
            <a
              href={`https://buy.stripe.com/test_sample?client_reference_id=${client.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#00FA82] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#00FA82]/90"
            >
              <CreditCard className="h-4 w-4" />
              Pagar con Stripe
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function CredentialsView({ client, open }: { client: PortalClient; open: OpenOverlay }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-white">Credenciales y accesos</h3>
          <p className="mt-1 text-sm text-gray-400">Solicitudes pendientes, credenciales compartidas y últimas actualizaciones.</p>
        </div>
        <button className="rounded-lg bg-[#00FA82] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#00FA82]/90" onClick={() => open("connectCredential")}>Compartir acceso</button>
      </div>
      <div className="space-y-3">
        {client.credentials.length > 0 ? (
          client.credentials.map((credential) => (
            <CredentialRow key={credential.id} credential={credential} onOpen={() => open("connectCredential")} />
          ))
        ) : (
          <PortalEmptyState
            title="No hay credenciales compartidas"
            description="Desde aquí podrás ver accesos solicitados o compartidos en cuanto existan en la operación real."
          />
        )}
      </div>
    </div>
  );
}

function FilesView({ client, open, openFile }: { client: PortalClient; open: OpenOverlay; openFile: (file: PortalFile) => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-white">Archivos compartidos</h3>
          <p className="mt-1 text-sm text-gray-400">Material subido por tu equipo y entregables compartidos por Vertrex.</p>
        </div>
        <button className="rounded-lg bg-[#00FA82] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#00FA82]/90" onClick={() => open("uploadFile", { context: "Portal" })}>Subir material</button>
      </div>
      <div className="space-y-3">
        {client.files.length > 0 ? (
          client.files.map((file) => (
            <PortalFileRow key={file.id} file={file} onOpen={() => openFile(file)} />
          ))
        ) : (
          <PortalEmptyState
            title="No hay archivos cargados todavía"
            description="Cuando tu equipo o Vertrex suban materiales, aparecerán aquí con trazabilidad completa."
          />
        )}
      </div>
    </div>
  );
}

function SupportView({ client, open }: { client: PortalClient; open: OpenOverlay }) {
  const [ticketForm, setTicketForm] = useState({ title: "", description: "", requestType: "general" });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleCreateTicket = async () => {
    if (!ticketForm.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "ticket",
          payload: {
            title: ticketForm.title,
            summary: ticketForm.description,
            clientSlug: client.id,
            requestType: ticketForm.requestType,
            priority: "medium",
          },
        }),
      });
      if (res.ok) {
        setTicketForm({ title: "", description: "", requestType: "general" });
        setShowForm(false);
        window.location.reload();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#00FA82]/30 bg-[#111] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#00FA82]">
              <Bot className="h-4 w-4" /> Asistente IA de soporte
            </h3>
            <p className="mt-2 text-sm text-gray-400">Puedes abrir un hilo con la IA o escalar a soporte humano sin salir del portal.</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 transition-colors hover:bg-white/5" onClick={() => open("threadDetail", "support-thread")}>Abrir IA</button>
            <button className="rounded-lg bg-[#00FA82] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#00FA82]/90" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancelar" : "Nuevo ticket"}
            </button>
          </div>
        </div>
        {showForm && (
          <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-black/40 p-4">
            <input
              value={ticketForm.title}
              onChange={(e) => setTicketForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Título del ticket"
              className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500"
            />
            <textarea
              value={ticketForm.description}
              onChange={(e) => setTicketForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe tu solicitud..."
              rows={3}
              className="w-full resize-none rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500"
            />
            <div className="flex items-center gap-3">
              <select
                value={ticketForm.requestType}
                onChange={(e) => setTicketForm((f) => ({ ...f, requestType: e.target.value }))}
                className="rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-white"
              >
                <option value="general">General</option>
                <option value="soporte">Soporte</option>
                <option value="incidencia_bloqueante">Incidencia bloqueante</option>
                <option value="revision_entregable">Revisión entregable</option>
                <option value="solicitud_cambio">Solicitud cambio</option>
              </select>
              <button
                onClick={handleCreateTicket}
                disabled={submitting || !ticketForm.title.trim()}
                className="rounded-lg bg-[#00FA82] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#00FA82]/90 disabled:opacity-40"
              >
                {submitting ? "Enviando..." : "Crear ticket"}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-black tracking-tight text-white">Tickets y solicitudes</h3>
          <span className="text-xs font-mono text-gray-500">{client.tickets.length} registros</span>
        </div>
        <div className="space-y-3">
          {client.tickets.length > 0 ? (
            client.tickets.map((ticket) => (
              <PortalTicketRow key={ticket.id} ticket={ticket} onOpen={() => open("ticketDetail", ticket.id)} />
            ))
          ) : (
            <PortalEmptyState
              title="No hay tickets abiertos"
              description="Tu historial de soporte aparecerá aquí cuando existan solicitudes reales registradas para tu cuenta."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PortalNavItem({
  clientId,
  view,
  icon: Icon,
  label,
  active,
  alert,
}: {
  clientId: string;
  view: PortalView;
  icon: typeof LayoutDashboard;
  label: string;
  active: boolean;
  alert?: string;
}) {
  return (
    <Link
      href={getPortalHref(clientId, view)}
      className={`group flex w-full items-center justify-between rounded-xl p-3 transition-all ${
        active ? "border border-white/10 bg-[#111] text-white" : "text-gray-500 hover:bg-[#111]/50 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-4 w-4 ${active ? "text-[#00FA82]" : "group-hover:text-white"}`} />
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {alert ? (
        <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-500">
          {alert}
        </span>
      ) : null}
    </Link>
  );
}

function PortalTimeline({ item }: { item: PortalTimelineItem }) {
  const config =
    item.status === "done"
      ? { color: "bg-[#00FA82]", dot: "border-transparent", icon: <Check className="h-2.5 w-2.5 text-black" /> }
      : item.status === "active"
        ? {
            color: "bg-[#0A0A0A]",
            dot: "border-2 border-[#00FA82] shadow-[0_0_8px_rgba(0,250,130,0.5)]",
            icon: null,
          }
        : { color: "bg-[#0A0A0A]", dot: "border-2 border-white/20", icon: null };

  return (
    <div className="relative z-10 flex items-start gap-4">
      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${config.color} ${config.dot}`}>
        {config.icon}
      </div>
      <div className="pb-2">
        <p className={`text-sm font-bold ${item.status === "pending" ? "text-gray-500" : "text-white"}`}>
          {item.title}
        </p>
        <p className="mt-1 font-mono text-xs text-gray-500">{item.date}</p>
      </div>
    </div>
  );
}

function PortalEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-gray-500">{description}</p>
    </div>
  );
}

function PortalDocRow({ document, onOpen }: { document: PortalDocument; onOpen: () => void }) {
  return (
    <button
      className="group flex w-full items-center justify-between rounded-xl border border-white/5 bg-black/50 p-3 text-left transition-colors hover:bg-[#111]"
      onClick={onOpen}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div
          className={`rounded-lg p-2 ${document.highlight ? "bg-[#00FA82]/10 text-[#00FA82]" : "bg-white/5 text-gray-400"}`}
        >
          {document.type === "Assets" ? <UploadCloud className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white transition-colors group-hover:text-[#00FA82]">
            {document.name}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-gray-500">{document.date}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden rounded bg-white/5 px-2 py-1 text-[9px] font-bold uppercase text-gray-500 sm:block">
          {document.type}
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-600 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </button>
  );
}

function PortalTaskRow({ task, onOpen }: { task: PortalTask; onOpen: () => void }) {
  return (
    <button
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 p-4 text-left transition-colors hover:border-[#00FA82]/30 hover:bg-black/60"
      onClick={onOpen}
    >
      <div>
        <p className="text-sm font-bold text-white">{task.title}</p>
        <p className="mt-1 text-xs text-gray-500">{task.owner} · {task.dueLabel}</p>
      </div>
      <StatusChip status={task.status} />
    </button>
  );
}

function PortalInvoiceRow({ invoice, onOpen }: { invoice: PortalInvoice; onOpen: () => void }) {
  return (
    <button
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 p-4 text-left transition-colors hover:border-[#00FA82]/30 hover:bg-black/60"
      onClick={onOpen}
    >
      <div>
        <p className="text-sm font-bold text-white">{invoice.label}</p>
        <p className="mt-1 text-xs text-gray-500">
          {invoice.invoiceNumber} · {invoice.dueDate}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold text-white">{invoice.amount}</span>
        <StatusChip status={invoice.status} />
      </div>
    </button>
  );
}

function CredentialRow({
  credential,
  onOpen,
}: {
  credential: PortalClient["credentials"][number];
  onOpen: () => void;
}) {
  return (
    <button
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 p-4 text-left transition-colors hover:border-[#00FA82]/30 hover:bg-black/60"
      onClick={onOpen}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-black p-2 text-[#00FA82]">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{credential.title}</p>
          <p className="mt-1 text-xs text-gray-500">
            {credential.scope} · {credential.updatedAt}
          </p>
        </div>
      </div>
      <StatusChip status={credential.status} />
    </button>
  );
}

function PortalFileRow({ file, onOpen }: { file: PortalFile; onOpen: () => void }) {
  return (
    <button
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 p-4 text-left transition-colors hover:border-[#00FA82]/30 hover:bg-black/60"
      onClick={onOpen}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-black p-2 text-[#00FA82]">
          <FolderOpen className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{file.name}</p>
          <p className="mt-1 text-xs text-gray-500">
            {file.category} · {file.size} · {file.uploadedAt}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {file.provider ? <span className="rounded bg-white/5 px-2 py-1 text-[9px] font-bold uppercase text-gray-500">{file.provider}</span> : null}
        <span className="rounded bg-white/5 px-2 py-1 text-[9px] font-bold uppercase text-gray-400">
          {file.source === "client" ? "Cliente" : "Vertrex"}
        </span>
      </div>
    </button>
  );
}

function PortalTicketRow({ ticket, onOpen }: { ticket: PortalTicket; onOpen: () => void }) {
  return (
    <button
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 p-4 text-left transition-colors hover:border-[#00FA82]/30 hover:bg-black/60"
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-white/10 bg-black p-2 text-[#00FA82]">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{ticket.title}</p>
          <p className="mt-1 text-xs text-gray-500">{ticket.summary}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-gray-300">
              {ticket.requestTypeLabel}
            </span>
            <span className="text-[10px] font-mono text-gray-500">{ticket.slaWindowLabel}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 text-right">
        <StatusChip status={ticket.status} />
        <StatusChip status={ticket.slaStatus} label={ticket.slaLabel} />
        <p className="mt-2 text-[10px] font-mono text-gray-500">{ticket.updatedAt}</p>
      </div>
    </button>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "success" | "warning";
}) {
  const toneClassName =
    tone === "primary"
      ? "text-white"
      : tone === "success"
        ? "text-[#00FA82]"
        : "text-amber-500";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
      <p className={`mt-3 font-mono text-3xl font-black ${toneClassName}`}>{value}</p>
    </div>
  );
}

function FinanceLine({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-1.5 text-gray-400">
        {icon}
        {label}
      </span>
      <span className={`font-mono font-bold ${valueClassName ?? "text-white"}`}>{value}</span>
    </div>
  );
}

function StatusChip({ status, label }: { status: string; label?: string }) {
  const value = status.toLowerCase();
  const className =
    value === "done" || value === "paid" || value === "resolved" || value === "shared"
      ? "border-[#00FA82]/20 bg-[#00FA82]/10 text-[#00FA82]"
      : value === "on_track"
        ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
      : value === "active" || value === "in_progress" || value === "updated"
        ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
        : value === "pending" || value === "requested" || value === "at_risk"
          ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
          : value === "breached"
            ? "border-red-500/20 bg-red-500/10 text-red-400"
          : "border-white/10 bg-white/5 text-gray-400";

  return (
    <span className={`rounded border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${className}`}>
      {(label ?? value).replace(/_/g, " ")}
    </span>
  );
}

function buildPortalReentrySummary(client: PortalClient) {
  const lastUpdateLabel =
    client.statusHighlights.find((highlight) => highlight.label.toLowerCase().includes("último"))?.value
    ?? client.timeline[0]?.date
    ?? client.messages[client.messages.length - 1]?.at
    ?? "Sin actualización reciente";
  const activeTimeline = client.timeline.find((item) => item.status === "active");
  const requestedCredentials = client.credentials.filter((credential) => credential.status === "requested").length;
  const overdueInvoices = client.invoices.filter((invoice) => invoice.status === "overdue").length;
  const openTickets = client.tickets.filter((ticket) => ticket.status !== "resolved").length;

  if (overdueInvoices > 0) {
    return {
      title: "Hay una acción financiera clave antes de seguir avanzando.",
      lastUpdateLabel,
      momentumLabel: activeTimeline?.title ?? `${client.completedTasks}/${client.totalTasks} tareas completadas`,
      attentionLabel: `${overdueInvoices} cobros requieren revisión.`,
      recommendedView: "billing" as const,
      recommendedLabel: "Pagos & facturación",
    };
  }

  if (requestedCredentials > 0) {
    return {
      title: "El proyecto ya tiene tracción, pero faltan accesos por resolver.",
      lastUpdateLabel,
      momentumLabel: activeTimeline?.title ?? `${client.progress}% del proyecto completado`,
      attentionLabel: `${requestedCredentials} credenciales siguen pendientes.`,
      recommendedView: "credentials" as const,
      recommendedLabel: "Credenciales & accesos",
    };
  }

  if (openTickets > 0) {
    return {
      title: "Hay conversación activa con Vertrex y el proyecto sigue avanzando.",
      lastUpdateLabel,
      momentumLabel: activeTimeline?.title ?? `${client.progress}% del proyecto completado`,
      attentionLabel: `${openTickets} solicitudes activas necesitan seguimiento.`,
      recommendedView: "support" as const,
      recommendedLabel: "Soporte técnico",
    };
  }

  return {
    title: "Tu cuenta está al día y puedes retomar el proyecto desde el roadmap.",
    lastUpdateLabel,
    momentumLabel: activeTimeline?.title ?? `${client.completedTasks}/${client.totalTasks} tareas completadas`,
    attentionLabel: client.nextActionContext,
    recommendedView: "progress" as const,
    recommendedLabel: "Progreso & tareas",
  };
}

function buildPortalOnboardingChecklist(client: PortalClient): PortalChecklistItem[] {
  const legalDocuments = client.documents.filter((document) => document.type === "Legal").length;
  const requestedCredentials = client.credentials.filter((credential) => credential.status === "requested").length;
  const sharedCredentials = client.credentials.filter((credential) => credential.status === "shared" || credential.status === "updated").length;
  const pendingCents = parseCurrencyLabel(client.pending);
  const paidCents = parseCurrencyLabel(client.paid);

  return [
    {
      id: "legal-base",
      title: "Base documental del proyecto",
      description: legalDocuments > 0 ? `${legalDocuments} documentos legales o de alcance ya están visibles en el portal.` : "Revisa contrato, alcance o anexos compartidos por Vertrex.",
      status: legalDocuments > 0 ? "done" : client.nextActionContext.toLowerCase().includes("legal") ? "active" : "pending",
      view: "documents",
      ctaLabel: "Ver docs",
    },
    {
      id: "billing-readiness",
      title: "Contexto financiero alineado",
      description: pendingCents > 0 ? `Tienes ${client.pending} aún pendiente o por revisar en la operación.` : "No hay saldo pendiente por atender ahora mismo.",
      status: pendingCents === 0 ? "done" : paidCents > 0 ? "active" : "pending",
      view: "billing",
      ctaLabel: "Ver pagos",
    },
    {
      id: "credential-handoff",
      title: "Accesos y handoff técnico",
      description: requestedCredentials > 0 ? `${requestedCredentials} accesos siguen esperando respuesta para avanzar.` : sharedCredentials > 0 ? "Los accesos principales ya están compartidos o actualizados." : "Aún no hay credenciales sincronizadas en el portal.",
      status: requestedCredentials > 0 ? "active" : sharedCredentials > 0 ? "done" : "pending",
      view: "credentials",
      ctaLabel: "Abrir accesos",
    },
    {
      id: "communication-channel",
      title: "Canal operativo activo",
      description: client.messages.length > 0 ? "Ya tienes historial y canal directo con Vertrex para resolver dudas o desbloqueos." : "Abre el chat para dejar contexto y coordinar los siguientes pasos del proyecto.",
      status: client.messages.length > 0 ? "done" : client.tickets.length > 0 ? "active" : "pending",
      view: "chat",
      ctaLabel: "Ir al chat",
    },
  ];
}

function parseCurrencyLabel(value: string) {
  return Number.parseInt(value.replace(/[^\d-]/g, "") || "0", 10);
}

function isPortalView(view: string | undefined): view is PortalView {
  return portalViews.some((item) => item.key === view);
}

function getPortalHref(clientId: string, view: PortalView) {
  return getPortalPath(clientId, view);
}
