"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Clock,
  Copy,
  CreditCard,
  Database,
  Download,
  Eye,
  FileSignature,
  FileText,
  FolderKanban,
  Globe,
  Image as ImageIcon,
  Key,
  LifeBuoy,
  Link2,
  Lock,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  User,
  Video,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import {
  useUIStore,
  type UIActionPayload,
  type UIOverlayKey,
} from "@/lib/store/ui";
import type { WorkspaceSnapshot } from "@/lib/ops/workspace-service";
import { useWorkspaceSnapshot } from "@/lib/ops/use-workspace-snapshot";
import {
  documentTemplates,
  getDocumentGeneratorHref,
} from "@/lib/docs/template-catalog";
import { canonicalDealStageOptions, dealPipelineGroups, getDealPipelineGroup } from "@/lib/ops/deal-stages";
import { isOpenTaskStatus } from "@/lib/ops/status-catalog";
import { workspaceRequestTypeOptions } from "@/lib/ops/request-governance";
import ClientDetailSheet from "@/components/overlays/client-detail-sheet";
import DealDetailSheet from "@/components/overlays/deal-detail-sheet";
import TaskDetailSheet from "@/components/overlays/task-detail-sheet";
import TicketDetailSheet from "@/components/overlays/ticket-detail-sheet";

type OverlayActionHandler = (key: UIOverlayKey, payload?: UIActionPayload) => void;

type CommandCenterItem = {
  id: string;
  title: string;
  description: string;
  icon: typeof FolderKanban;
  badge?: string | null;
  shortcut?: string | null;
  searchText: string;
  run: () => void;
};

type TaskDetailRecord = {
  code: string;
  title: string;
  status: string;
  assignee: string;
  priority: string;
  dueDate: string;
  description: string;
  relations: string[];
  activity: string[];
};

type ClientDetailRecord = {
  name: string;
  segment: string;
  health: string;
  owner: string;
  email: string;
  phone: string;
  projects: string[];
  summary: string;
};

type DealDetailRecord = {
  title: string;
  company: string;
  stage: string;
  value: string;
  probability: string;
  nextStep: string;
  notes: string;
};

type EventDetailRecord = {
  title: string;
  description: string;
  time: string;
  duration: string;
  client: string;
  project: string;
  attendees: string[];
};

type AssetDetailRecord = {
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  preview: string;
  tags: string[];
  relations: string[];
};

type TicketDetailRecord = {
  title: string;
  status: string;
  requestType: string;
  sla: string;
  priority: string;
  client: string;
  project: string;
  activity: string[];
};

const templateOptions = documentTemplates;
const linkKindOptions = [
  { value: "url", label: "URL general" },
  { value: "dashboard", label: "Dashboard" },
  { value: "saas", label: "SaaS" },
  { value: "social_profile", label: "Perfil social" },
  { value: "github_repo", label: "Repositorio GitHub" },
  { value: "tiktok_account", label: "Cuenta TikTok" },
  { value: "streaming_community", label: "Comunidad streaming" },
  { value: "document_reference", label: "Referencia documental" },
  { value: "other", label: "Otro" },
];

function getPortalClientSlugFromPath(pathname: string | null) {
  if (!pathname) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  return segments[0] === "portal" ? segments[1] ?? null : null;
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function toIsoValue(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseAmountToCents(value: string | null) {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/[^0-9.-]/g, "");
  const numeric = Number(normalized);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return Math.round(numeric * 100);
}

function parsePercentValue(value: string | null) {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/[^0-9.-]/g, "");
  const numeric = Number(normalized);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

async function requestMutation(url: string, init: RequestInit, fallbackMessage: string) {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? fallbackMessage);
  }

  return payload;
}

function formatMoney(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function formatDateTimeLabel(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatEventRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Horario pendiente";
  }

  const dateLabel = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(start);
  const startLabel = new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  }).format(end);

  return `${dateLabel} · ${startLabel} - ${endLabel}`;
}

function formatDurationLabel(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Pendiente";
  }

  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
  }

  return `${minutes} min`;
}

function compactStrings(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value));
}

function getTaskRecord(id: string | null, snapshot?: WorkspaceSnapshot): TaskDetailRecord {
  const task = snapshot?.tasks.find((item) => item.id === id);

  if (task) {
    return {
      code: task.id.slice(0, 8).toUpperCase(),
      title: task.title,
      status: task.status,
      assignee: task.owner ?? "Sin asignar",
      priority: task.status === "review" ? "Alta" : task.status === "in_progress" ? "En progreso" : "Media",
      dueDate: task.dueLabel ?? "Sin fecha",
      description:
        [
          task.projectName ? `Proyecto vinculado: ${task.projectName}.` : null,
          task.clientName ? `Cliente: ${task.clientName}.` : null,
        ]
          .filter((value): value is string => Boolean(value))
          .join(" ") || "Tarea sincronizada desde el workspace operativo.",
      relations: compactStrings([task.clientName, task.projectName]),
      activity: [`Última actualización: ${formatDateTimeLabel(task.updatedAt)}`],
    };
  }

  if (id === "thread-task") {
    return {
      code: "OPS-221",
      title: "Convertir hilo de soporte en plan de acción",
      status: "En revisión",
      assignee: "IA COO",
      priority: "Alta",
      dueDate: "Hoy, 6:00 PM",
      description:
        "Organizar el hilo del cliente en una tarea operativa con checklist, responsables y respuesta propuesta.",
      relations: ["Thread #soporte-budaphone", "Ticket TCK-204", "Portal /support"],
      activity: [
        "IA generó el resumen inicial del hilo.",
        "Soporte adjuntó capturas y contexto adicional.",
        "Pendiente aprobación antes de responder al cliente.",
      ],
    };
  }

  return {
    code: id?.toUpperCase() ?? "NEX-140",
    title: "Implementar Omni-Switcher en el shell operativo",
    status: "En progreso",
    assignee: "Juan M.",
    priority: "Urgente",
    dueDate: "Mañana, 10:00 AM",
    description:
      "Conectar el shell del OS con estado global, cambios de contexto y acciones rápidas sin recargar la vista actual.",
    relations: ["PRD Frontend v3", "Calendar / EventDetail", "Docs / Generator"],
    activity: [
      "Diseño aprobado por producto.",
      "Falta abrir detalles y modales desde el store global.",
      "Se necesita QA en desktop y tablet.",
    ],
  };
}

function getClientRecord(id: string | null, snapshot?: WorkspaceSnapshot): ClientDetailRecord {
  const client = snapshot?.clients.find((item) => item.id === id || item.slug === id);

  if (client) {
    const projects = snapshot?.projects.filter((project) => project.clientId === client.id).map((project) => project.name) ?? [];

    return {
      name: client.name,
      segment: client.company ?? client.phase ?? client.status,
      health: `${client.progress}/100`,
      owner: client.brand || "Vertrex",
      email: client.email ?? "Sin email",
      phone: "No registrado",
      projects: projects.length > 0 ? projects : ["Sin proyectos vinculados"],
      summary: `${client.projectCount} proyectos, ${client.taskCount} tareas y ${client.openTicketCount} tickets abiertos para este cliente.`,
    };
  }

  if (id === "budaphone") {
    return {
      name: "Budaphone",
      segment: "Retail & ecommerce",
      health: "84/100",
      owner: "Carlos M.",
      email: "distribuidorabudaphone@gmail.com",
      phone: "314 461 8379",
      projects: ["Budaphone ecommerce", "Portal cliente", "Assets onboarding"],
      summary:
        "Cliente activo con alto nivel de colaboración. Tiene pagos al día y solicitudes frecuentes sobre avance y entregables.",
    };
  }

  return {
    name: "GlobalBank Corp",
    segment: "Enterprise / Fintech",
    health: "92/100",
    owner: "Sarah R.",
    email: "elena@globalbank.com",
    phone: "+1 212 555 0140",
    projects: ["Core bancario v2", "Security audit", "Executive portal"],
    summary:
      "Cuenta enterprise con múltiples stakeholders y pipeline de expansión. Riesgo bajo, pero requiere seguimiento ejecutivo constante.",
  };
}

function getDealRecord(id: string | null, snapshot?: WorkspaceSnapshot): DealDetailRecord {
  const deal = snapshot?.deals.find((item) => item.id === id);

  if (deal) {
    const syncedNotes = compactStrings([deal.projectName ? `Proyecto: ${deal.projectName}.` : null, deal.owner ? `Owner: ${deal.owner}.` : null]).join(" ");

    return {
      title: deal.title,
      company: deal.clientName ?? "Sin cliente",
      stage: getDealPipelineGroup(deal.stage).title,
      value: `${formatMoney(deal.valueCents)} · ${deal.billingModel}`,
      probability: `${deal.probability}%`,
      nextStep: deal.expectedCloseAt ? `Cierre estimado: ${formatDateTimeLabel(deal.expectedCloseAt)}` : "Actualizar seguimiento comercial",
      notes: deal.summary ?? (syncedNotes || "Deal sincronizado desde el pipeline real."),
    };
  }

  if (id === "acme-renewal") {
    return {
      title: "Renovación + Upsell plataforma",
      company: "Acme Corp",
      stage: getDealPipelineGroup("propuesta_enviada").title,
      value: "$5,000 MRR",
      probability: "85%",
      nextStep: "Enviar propuesta final anualizada",
      notes:
        "La oportunidad viene acompañada de expansión a dos módulos adicionales. El cliente respondió positivamente al paquete ARR.",
    };
  }

  return {
    title: "Vertrex OS Enterprise",
    company: "GlobalBank Corp",
    stage: getDealPipelineGroup("pendiente_anticipo_50").title,
    value: "$180,000 ARR",
    probability: "65%",
    nextStep: "Revisión legal del MSA",
    notes:
      "El trato está listo para cierre técnico. Se recomienda follow-up ejecutivo y envío de versión contractual actualizada.",
  };
}

function getEventRecord(id: string | null, snapshot?: WorkspaceSnapshot): EventDetailRecord {
  const event = snapshot?.events.find((item) => item.id === id);

  if (event) {
    return {
      title: event.title,
      description: event.description ?? "Evento sincronizado desde la agenda operativa.",
      time: formatEventRange(event.startsAt, event.endsAt),
      duration: formatDurationLabel(event.startsAt, event.endsAt),
      client: event.clientName ?? "Interno",
      project: event.projectName ?? event.kind,
      attendees: event.attendees.length > 0 ? event.attendees : ["Sin asistentes"],
    };
  }

  if (id === "nexus-review") {
    return {
      title: "Sprint review · Proyecto Nexus",
      description: "Revisión de sprint con backlog, riesgos y próximos entregables.",
      time: "Mañana · 9:00 AM - 9:45 AM",
      duration: "45 min",
      client: "Proyecto Nexus",
      project: "Migración DB / Omni-Switcher",
      attendees: ["Juan M.", "Sarah R.", "IA COO"],
    };
  }

  return {
    title: "Presentación propuesta GlobalBank",
    description: "Sesión comercial con brief técnico, costos y plan de implementación.",
    time: "Hoy · 11:00 AM - 12:30 PM",
    duration: "90 min",
    client: "GlobalBank Corp",
    project: "Vertrex OS Enterprise",
    attendees: ["Juan M.", "Sarah R.", "Carlos L."],
  };
}

function getAssetRecord(id: string | null, snapshot?: WorkspaceSnapshot): AssetDetailRecord {
  const file = snapshot?.files.find((item) => item.id === id);

  if (file) {
    return {
      name: file.name,
      type: file.category ?? file.provider,
      size: file.sizeLabel ?? "Tamaño no disponible",
      uploadedAt: file.uploadedAt,
      uploadedBy: file.source === "client" ? file.clientName ?? "Cliente" : "Vertrex",
      preview: file.provider === "drive" ? "Archivo sincronizado desde Google Drive" : "Archivo almacenado en Vertrex",
      tags: [file.category ?? "general", file.provider, file.source],
      relations: compactStrings([file.clientName, file.clientSlug, file.storageKey]),
    };
  }

  if (id === "manual-usuario") {
    return {
      name: "Manual_Usuario_v6.pdf",
      type: "PDF",
      size: "12.4 MB",
      uploadedAt: "Ayer",
      uploadedBy: "Sarah R.",
      preview: "Documento técnico",
      tags: ["Legacy", "User Guide", "Portal"],
      relations: ["Docs / Shared", "Client / Budaphone", "Legal repository"],
    };
  }

  return {
    name: "app-icon-final.png",
    type: "Imagen",
    size: "450 KB",
    uploadedAt: "Hace 2 min",
    uploadedBy: "Juan M.",
    preview: "Preview de recurso visual",
    tags: ["UI", "Brand", "App"],
    relations: ["Proyecto Nexus", "Assets / Branding", "Portal / files"],
  };
}

function getVaultRecord(id: string | null) {
  if (id === "figma-account") {
    return {
      title: "Figma Enterprise",
      type: "credential",
      content: [
        "Usuario: design@vertrex.com",
        "Contraseña: •••••••••••••",
        "URL: https://figma.com",
      ],
      audit: ["Vista por Sarah R. hace 2 horas", "Última rotación: hace 15 días"],
    };
  }

  if (id === "twitter-totp") {
    return {
      title: "X Corporativo",
      type: "totp",
      content: ["Código actual: 845 102", "Expira en 23s", "QR disponible para re-enrolamiento"],
      audit: ["Usado por Marketing hace 35 min", "2FA activo desde enero"],
    };
  }

  return {
    title: "Proyecto Nexus · Production .env",
    type: "env",
    content: [
      "DATABASE_URL=neon://...",
      "BLOB_READ_WRITE_TOKEN=...",
      "OPENAI_API_KEY=...",
    ],
    audit: ["Último acceso por Juan M.", "Rotación sugerida por IA en 7 días"],
  };
}

function getThreadRecord(id: string | null) {
  if (id === "support-thread") {
    return {
      title: "Hilo de soporte · Budaphone",
      channel: "Portal / support",
      messages: [
        "Cliente: el pago pendiente no refleja el estado correcto en el portal.",
        "Soporte: estamos validando la sincronización entre invoice y transacciones.",
        "IA COO: propongo crear tarea para revisión del flujo de pagos.",
      ],
    };
  }

  return {
    title: "Hilo #dev-nexus",
    channel: "Chat / menciones",
    messages: [
      "Sarah: ¿puedes revisar el PR de navegación interna?",
      "Carlos: ya conecté el shell al store global.",
      "IA COO: la tarea puede derivarse al board con contexto automático.",
    ],
  };
}

function getContractRecord(id: string | null) {
  if (id === "budaphone-contract") {
    return {
      title: "SOW · Budaphone ecommerce",
      status: "Vence pronto",
      signatories: ["Budaphone", "Vertrex"],
      milestones: ["Versión 1.8 enviada", "Firma pendiente", "Compartido con portal"],
      preview: "Documento contractual con alcance, pagos y cronograma operativo.",
    };
  }

  return {
    title: "Contrato marco · GlobalBank",
    status: "Vigente",
    signatories: ["GlobalBank Corp", "Vertrex"],
    milestones: ["v2.4 aprobada", "PDF final disponible", "Renovación en 2027"],
    preview: "Documento base de prestación de servicios enterprise y anexos operativos.",
  };
}

function getTicketRecord(id: string | null, snapshot?: WorkspaceSnapshot): TicketDetailRecord {
  const ticket = snapshot?.tickets.find((item) => item.id === id);

  if (ticket) {
    return {
      title: ticket.title,
      status: ticket.status,
      requestType: ticket.requestTypeLabel,
      sla: `${ticket.slaLabel} · ${ticket.slaWindowLabel}`,
      priority: ticket.priority ?? (ticket.status === "open" ? "Alta" : ticket.status === "in_progress" ? "Media" : "Baja"),
      client: ticket.clientName ?? "Sin cliente",
      project: ticket.projectName ?? "Sin proyecto vinculado",
      activity: [ticket.summary ?? "Sin resumen disponible.", `Última actualización: ${formatDateTimeLabel(ticket.updatedAt)}`],
    };
  }

  if (id === "payment-sync") {
    return {
      title: "Pago pendiente no actualizado",
      status: "In progress",
      requestType: "Soporte",
      sla: "SLA en tiempo · Resolución 48h",
      priority: "Alta",
      client: "Budaphone",
      project: "Portal cliente",
      activity: [
        "Cliente reportó inconsistencia de pagos.",
        "Finanzas validó invoice #INV-042.",
        "Pendiente parche del frontend para refresco de estado.",
      ],
    };
  }

  return {
    title: "Acceso al entorno de staging",
    status: "Open",
    requestType: "Acceso",
    sla: "SLA en riesgo · Acuse 24h",
    priority: "Media",
    client: "GlobalBank Corp",
    project: "Executive portal",
    activity: [
      "Ticket creado por cliente vía portal.",
      "Asignado a operaciones.",
      "Esperando respuesta con credenciales temporales.",
    ],
  };
}

export default function OSOverlayManager() {
  const router = useRouter();
  const pathname = usePathname();
  const ui = useUIStore((store) => store);
  const isPortalRoute = pathname?.startsWith("/portal/") ?? false;
  const { snapshot } = useWorkspaceSnapshot({ enabled: !isPortalRoute });
  const portalClientSlug = getPortalClientSlugFromPath(pathname);

  return (
    <>
      <CommandCenterDialog
        open={ui.commandCenter}
        snapshot={snapshot}
        currentPath={pathname ?? "/os"}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("commandCenter");
          }
        }}
        onAction={(key, payload) => {
          ui.close("commandCenter");
          ui.open(key, payload);
        }}
      />
      <OmniCreatorDialog
        open={ui.omniCreator}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("omniCreator");
          }
        }}
        onAction={(key, payload) => {
          ui.close("omniCreator");
          ui.open(key, payload);
        }}
      />
      <UniversalInboxDialog
        open={ui.universalInbox}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("universalInbox");
          }
        }}
        onOpenTicket={(id) => {
          ui.close("universalInbox");
          ui.open("ticketDetail", id);
        }}
        onOpenThread={(id) => {
          ui.close("universalInbox");
          ui.open("threadDetail", id);
        }}
      />
      <TaskDetailSheet
        open={ui.taskDetail.open}
        id={ui.taskDetail.id}
        snapshot={snapshot}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("taskDetail");
          }
        }}
      />
      <ClientDetailSheet
        open={ui.clientDetail.open}
        id={ui.clientDetail.id}
        snapshot={snapshot}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("clientDetail");
          }
        }}
      />
      <DealDetailSheet
        open={ui.dealDetail.open}
        id={ui.dealDetail.id}
        snapshot={snapshot}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("dealDetail");
          }
        }}
      />
      <EventDetailSheet
        open={ui.eventDetail.open}
        id={ui.eventDetail.id}
        snapshot={snapshot}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("eventDetail");
          }
        }}
        onEdit={() => {
          ui.close("eventDetail");
          ui.open("createEvent");
        }}
      />
      <AssetDetailSheet
        open={ui.assetDetail.open}
        id={ui.assetDetail.id}
        snapshot={snapshot}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("assetDetail");
          }
        }}
      />
      <VaultEntrySheet
        open={ui.vaultEntry.open}
        id={ui.vaultEntry.id}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("vaultEntry");
          }
        }}
        onEdit={() => {
          ui.close("vaultEntry");
          ui.open("connectCredential");
        }}
      />
      <ThreadDetailSheet
        open={ui.threadDetail.open}
        id={ui.threadDetail.id}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("threadDetail");
          }
        }}
        onConvert={() => {
          ui.close("threadDetail");
          ui.open("taskDetail", "thread-task");
        }}
      />
      <ContractDetailSheet
        open={ui.contractDetail.open}
        id={ui.contractDetail.id}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("contractDetail");
          }
        }}
        onNewVersion={() => {
          ui.open("templateSelector");
        }}
      />
      <TicketDetailSheet
        open={ui.ticketDetail.open}
        id={ui.ticketDetail.id}
        snapshot={snapshot}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("ticketDetail");
          }
        }}
      />
      <UploadFileDialog
        open={ui.uploadFile.open}
        context={ui.uploadFile.context}
        portalMode={isPortalRoute}
        portalClientSlug={portalClientSlug}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("uploadFile");
          }
        }}
      />
      <ImportDocumentDialog
        open={ui.importDocument}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("importDocument");
          }
        }}
      />
      <RegisterTransactionDialog
        open={ui.registerTransaction.open}
        transactionType={ui.registerTransaction.type}
        portalClientSlug={portalClientSlug}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("registerTransaction");
          }
        }}
      />
      <CreateLinkDialog
        open={ui.createLink}
        portalClientSlug={portalClientSlug}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("createLink");
          }
        }}
      />
      <ConnectCredentialDialog
        open={ui.connectCredential}
        portalMode={isPortalRoute}
        portalClientSlug={portalClientSlug}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("connectCredential");
          }
        }}
      />
      <CreateDealDialog
        open={ui.createDeal}
        portalClientSlug={portalClientSlug}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("createDeal");
          }
        }}
      />
      <CreateEventDialog
        open={ui.createEvent}
        portalClientSlug={portalClientSlug}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("createEvent");
          }
        }}
      />
      <CreateTicketDialog
        open={ui.createTicket}
        portalMode={isPortalRoute}
        portalClientSlug={portalClientSlug}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("createTicket");
          }
        }}
      />
      <CreateAutomationDialog
        open={ui.createAutomation}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("createAutomation");
          }
        }}
      />
      <TemplateSelectorDialog
        open={ui.templateSelector.open}
        onOpenChange={(open) => {
          if (!open) {
            ui.close("templateSelector");
          }
        }}
        onSelect={(id) => {
          if (ui.templateSelector.onSelect) {
            ui.templateSelector.onSelect(id);
          } else {
            router.push(getDocumentGeneratorHref({ templateId: id, source: "overlay" }));
          }
          ui.close("templateSelector");
        }}
      />
    </>
  );
}

type DialogFrameProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
};

function DialogFrame({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
  maxWidthClassName = "max-w-3xl",
}: DialogFrameProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-start justify-center p-4 pt-[10vh]">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={`relative z-[141] flex w-full ${maxWidthClassName} flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border/60 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-lg border border-border bg-secondary/50 p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className="border-t border-border/60 bg-background/60 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type SheetFrameProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

function SheetFrame({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
}: SheetFrameProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[140]">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="absolute inset-y-0 right-0 z-[141] flex w-full max-w-2xl flex-col border-l border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border/60 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-lg border border-border bg-secondary/50 p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer ? (
          <div className="border-t border-border/60 bg-background/60 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof FileText; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span>{title}</span>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function TagChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
      <Tag className="h-3 w-3" />
      {label}
    </span>
  );
}

function ActivityList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground"
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function TextInput({
  label,
  placeholder,
  defaultValue,
  name,
  type = "text",
  required,
  disabled,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  name?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-muted-foreground">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={value == null ? defaultValue : undefined}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

function TextArea({
  label,
  placeholder,
  defaultValue,
  name,
  required,
  disabled,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-muted-foreground">
      <span>{label}</span>
      <textarea
        name={name}
        defaultValue={value == null ? defaultValue : undefined}
        placeholder={placeholder}
        rows={4}
        required={required}
        disabled={disabled}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

function SelectInput({
  label,
  name,
  options,
  defaultValue,
  required,
  disabled,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-muted-foreground">
      <span>{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"
      >
        {options.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PrimaryButton({
  children,
  onClick,
  type,
  form,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  form?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      form={form}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  type,
  form,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  form?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      form={form}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function CommandCenterDialog({
  open,
  snapshot,
  currentPath,
  onOpenChange,
  onAction,
}: {
  open: boolean;
  snapshot: WorkspaceSnapshot;
  currentPath: string;
  onOpenChange: (open: boolean) => void;
  onAction: OverlayActionHandler;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (!open) {
      setQuery("");
    }

    setSelectedIndex(0);
  }, [open]);

  const navigateTo = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  const navigationItems: CommandCenterItem[] = [
    {
      id: "nav-dashboard",
      title: "Dashboard",
      description: "Visión general, timeline operativo e insights del negocio.",
      icon: Sparkles,
      badge: isCommandPathActive(currentPath, "/os") ? "Actual" : null,
      shortcut: "G D",
      searchText: buildCommandSearchText("dashboard overview home os visión general"),
      run: () => navigateTo("/os"),
    },
    {
      id: "nav-my-day",
      title: "Mi día",
      description: "Prioridades, agenda inmediata y actividad reciente del equipo.",
      icon: CheckSquare,
      badge: isCommandPathActive(currentPath, "/os/my-day") ? "Actual" : null,
      shortcut: "G M",
      searchText: buildCommandSearchText("mi dia my day focus today prioridades agenda actividad equipo"),
      run: () => navigateTo("/os/my-day"),
    },
    {
      id: "nav-health",
      title: "Salud operacional",
      description: "Riesgos, alertas críticas y cobertura del workspace.",
      icon: ShieldCheck,
      badge: isCommandPathActive(currentPath, "/os/health") ? "Actual" : null,
      shortcut: "G H",
      searchText: buildCommandSearchText("health salud riesgos alertas workspace", String(snapshot.summary.clients), String(snapshot.summary.projects)),
      run: () => navigateTo("/os/health"),
    },
    {
      id: "nav-projects",
      title: "Proyectos",
      description: "Delivery activo, milestones y progreso por cuenta.",
      icon: FolderKanban,
      badge: isCommandPathActive(currentPath, "/os/projects") ? "Actual" : null,
      shortcut: "G P",
      searchText: buildCommandSearchText("projects proyectos delivery milestones roadmap"),
      run: () => navigateTo("/os/projects"),
    },
    {
      id: "nav-docs",
      title: "Documentos",
      description: "Expedientes, contratos, oficios y generator documental.",
      icon: FileText,
      badge: isCommandPathActive(currentPath, "/os/docs") ? "Actual" : null,
      shortcut: "G D O",
      searchText: buildCommandSearchText("docs documentos generator contratos oficio legal"),
      run: () => navigateTo("/os/docs"),
    },
    {
      id: "nav-assets",
      title: "Recursos",
      description: "Assets, archivos y librería compartida.",
      icon: Database,
      badge: isCommandPathActive(currentPath, "/os/assets") ? "Actual" : null,
      shortcut: "G A",
      searchText: buildCommandSearchText("assets recursos archivos library"),
      run: () => navigateTo("/os/assets"),
    },
    {
      id: "nav-crm",
      title: "CRM",
      description: "Deals, clientes activos y activaciones comerciales.",
      icon: Building2,
      badge: isCommandPathActive(currentPath, "/os/crm") ? "Actual" : null,
      shortcut: "G C",
      searchText: buildCommandSearchText("crm deals pipeline clientes comerciales ventas"),
      run: () => navigateTo("/os/crm"),
    },
    {
      id: "nav-finance",
      title: "Finanzas",
      description: "Facturas, movimientos y cobro operativo.",
      icon: Wallet,
      badge: isCommandPathActive(currentPath, "/os/finance") ? "Actual" : null,
      shortcut: "G F",
      searchText: buildCommandSearchText("finance finanzas invoices movimientos billing cobro"),
      run: () => navigateTo("/os/finance"),
    },
    {
      id: "nav-calendar",
      title: "Agenda",
      description: "Eventos, kickoff y coordinación del tiempo.",
      icon: CalendarDays,
      badge: isCommandPathActive(currentPath, "/os/calendar") ? "Actual" : null,
      shortcut: "G L",
      searchText: buildCommandSearchText("calendar agenda eventos kickoff meetings"),
      run: () => navigateTo("/os/calendar"),
    },
    {
      id: "nav-chat",
      title: "Chat",
      description: "Conversaciones operativas y soporte contextual.",
      icon: MessageSquare,
      badge: isCommandPathActive(currentPath, "/os/chat") ? "Actual" : null,
      shortcut: "G T",
      searchText: buildCommandSearchText("chat conversaciones soporte threads"),
      run: () => navigateTo("/os/chat"),
    },
    {
      id: "nav-analytics",
      title: "Analytics",
      description: "Métricas ejecutivas y lectura agregada del negocio.",
      icon: Globe,
      badge: isCommandPathActive(currentPath, "/os/analytics") ? "Actual" : null,
      shortcut: "G X",
      searchText: buildCommandSearchText("analytics métricas kpis executive"),
      run: () => navigateTo("/os/analytics"),
    },
    {
      id: "nav-ai",
      title: "AI Control Center",
      description: "Memoria, runs autónomos y estado de OpenClaw.",
      icon: Bot,
      badge: isCommandPathActive(currentPath, "/os/ai") ? "Actual" : null,
      shortcut: "G I",
      searchText: buildCommandSearchText("ai control center autonomous openclaw memory"),
      run: () => navigateTo("/os/ai"),
    },
    {
      id: "nav-automations",
      title: "Automatizaciones",
      description: "Playbooks persistidos y logs auditables.",
      icon: Zap,
      badge: isCommandPathActive(currentPath, "/os/automations") ? "Actual" : null,
      shortcut: "G Z",
      searchText: buildCommandSearchText("automations automatizaciones playbooks logs audit"),
      run: () => navigateTo("/os/automations"),
    },
  ];

  const actionItems: CommandCenterItem[] = [
    {
      id: "action-create-deal",
      title: "Nuevo trato",
      description: "Abre el modal de entrada rápida para CRM.",
      icon: Building2,
      shortcut: "N D",
      searchText: buildCommandSearchText("nuevo trato deal crm crear negocio"),
      run: () => onAction("createDeal"),
    },
    {
      id: "action-create-event",
      title: "Nuevo evento",
      description: "Agenda reunión, bloqueo o follow-up.",
      icon: CalendarDays,
      shortcut: "N E",
      searchText: buildCommandSearchText("nuevo evento agenda calendar follow up"),
      run: () => onAction("createEvent"),
    },
    {
      id: "action-create-ticket",
      title: "Nuevo ticket",
      description: "Crea soporte desde OS o Portal.",
      icon: LifeBuoy,
      shortcut: "N T",
      searchText: buildCommandSearchText("nuevo ticket soporte request sla"),
      run: () => onAction("createTicket"),
    },
    {
      id: "action-create-automation",
      title: "Nueva automatización",
      description: "Publica un playbook operativo desde el overlay rápido.",
      icon: Zap,
      shortcut: "N A",
      searchText: buildCommandSearchText("nueva automatización automation playbook"),
      run: () => onAction("createAutomation"),
    },
    {
      id: "action-income",
      title: "Registrar ingreso",
      description: "Abre finanzas con tipo ingreso preseleccionado.",
      icon: Wallet,
      shortcut: "N I",
      searchText: buildCommandSearchText("registrar ingreso finanzas income transaction"),
      run: () => onAction("registerTransaction", { type: "income" }),
    },
    {
      id: "action-expense",
      title: "Registrar egreso",
      description: "Abre finanzas con tipo expense preseleccionado.",
      icon: Wallet,
      shortcut: "N G",
      searchText: buildCommandSearchText("registrar egreso gasto finanzas expense transaction"),
      run: () => onAction("registerTransaction", { type: "expense" }),
    },
    {
      id: "action-upload",
      title: "Subir archivo",
      description: "Carga activos para docs, assets o portal.",
      icon: UploadCloud,
      shortcut: "N U",
      searchText: buildCommandSearchText("subir archivo upload assets portal docs"),
      run: () => onAction("uploadFile", { context: "Assets" }),
    },
    {
      id: "action-create-link",
      title: "Nuevo link",
      description: "Registra un acceso, dashboard o referencia en Knowledge Hub.",
      icon: Link2,
      shortcut: "N K",
      searchText: buildCommandSearchText("nuevo link hub knowledge acceso dashboard saas referencia"),
      run: () => onAction("createLink"),
    },
    {
      id: "action-template-selector",
      title: "Selector de plantillas",
      description: "Abre la galería de plantillas HTML disponibles.",
      icon: FileText,
      shortcut: "N P",
      searchText: buildCommandSearchText("plantillas templates docs generator selector"),
      run: () => onAction("templateSelector"),
    },
    {
      id: "action-inbox",
      title: "Inbox universal",
      description: "Unifica alertas, menciones y tickets.",
      icon: Bell,
      shortcut: "Ctrl/Cmd + I",
      searchText: buildCommandSearchText("inbox universal alertas menciones tickets"),
      run: () => onAction("universalInbox"),
    },
  ];

  const entityItems: CommandCenterItem[] = [
    ...snapshot.projects.slice(0, 4).map((project) => ({
      id: `project-${project.id}`,
      title: project.name,
      description: `${project.clientName ?? "Sin cliente"} · ${project.openTasks} tareas abiertas · ${project.progress}% progreso.`,
      icon: FolderKanban,
      badge: "Proyecto",
      searchText: buildCommandSearchText("project proyecto", project.name, project.clientName, project.description, project.status),
      run: () => navigateTo(`/os/projects/${project.id}`),
    })),
    ...snapshot.clients.slice(0, 4).map((client) => ({
      id: `client-${client.id}`,
      title: client.name,
      description: `${client.projectCount} proyectos · ${client.openTicketCount} tickets abiertos · ${client.phase ?? "Sin fase"}.`,
      icon: Building2,
      badge: "Cliente",
      searchText: buildCommandSearchText("client cliente", client.name, client.slug, client.company, client.phase),
      run: () => onAction("clientDetail", client.id),
    })),
    ...snapshot.tasks.filter((task) => isOpenTaskStatus(task.status)).slice(0, 4).map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      description: `${task.projectName ?? task.clientName ?? "Sin contexto"} · ${task.status}${task.owner ? ` · ${task.owner}` : ""}.`,
      icon: CheckSquare,
      badge: "Tarea",
      searchText: buildCommandSearchText("task tarea", task.title, task.projectName, task.clientName, task.owner, task.status),
      run: () => onAction("taskDetail", task.id),
    })),
    ...snapshot.tickets.slice(0, 4).map((ticket) => ({
      id: `ticket-${ticket.id}`,
      title: ticket.title,
      description: `${ticket.clientName ?? "Sin cliente"} · ${ticket.requestTypeLabel} · ${ticket.slaLabel}.`,
      icon: LifeBuoy,
      badge: "Ticket",
      searchText: buildCommandSearchText("ticket soporte request", ticket.title, ticket.clientName, ticket.projectName, ticket.requestTypeLabel, ticket.slaLabel),
      run: () => onAction("ticketDetail", ticket.id),
    })),
  ];

  const navigationResults = navigationItems.filter((item) => matchesCommandQuery(item, normalizedQuery));
  const actionResults = actionItems.filter((item) => matchesCommandQuery(item, normalizedQuery));
  const entityResults = entityItems.filter((item) => matchesCommandQuery(item, normalizedQuery));
  const sections = [
    { id: "navigation", title: "Navegación", items: navigationResults },
    { id: "actions", title: "Acciones rápidas", items: actionResults },
    { id: "entities", title: normalizedQuery ? "Entidades encontradas" : "Recientes", items: entityResults },
  ].filter((section) => section.items.length > 0);
  const flatResults = sections.flatMap((section) => section.items);
  const selectedItem = flatResults[selectedIndex] ?? null;

  useEffect(() => {
    if (flatResults.length === 0) {
      setSelectedIndex(0);
      return;
    }

    setSelectedIndex((current) => Math.min(current, flatResults.length - 1));
  }, [flatResults.length]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (flatResults.length > 0) {
        setSelectedIndex((current) => (current + 1) % flatResults.length);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (flatResults.length > 0) {
        setSelectedIndex((current) => (current - 1 + flatResults.length) % flatResults.length);
      }
      return;
    }

    if (event.key === "Enter" && selectedItem) {
      event.preventDefault();
      selectedItem.run();
    }
  };

  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Command Center"
      subtitle="Busca vistas, abre overlays globales y dispara acciones rápidas del OS."
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Atajos: Ctrl/Cmd + K, ↑↓, Enter, N, I · Esc</span>
          <div className="flex items-center gap-2">
            <SecondaryButton onClick={() => navigateTo("/os/projects")}>Ir a Proyectos</SecondaryButton>
            <PrimaryButton onClick={() => (selectedItem ? selectedItem.run() : navigateTo("/os/ai"))}>
              <Sparkles className="h-4 w-4" />
              {selectedItem ? "Abrir selección" : "Ir a IA"}
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            placeholder="Busca entidades, comandos o módulos..."
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        {sections.length > 0 ? (
          <div className="space-y-4">
            {(() => {
              let offset = 0;

              return sections.map((section) => {
                const startIndex = offset;
                offset += section.items.length;

                return (
                  <div key={section.id} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {section.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{section.items.length}</span>
                    </div>
                    <div className="space-y-2">
                      {section.items.map((item, itemIndex) => {
                        const absoluteIndex = startIndex + itemIndex;

                        return (
                          <CommandCenterItemRow
                            key={item.id}
                            item={item}
                            active={absoluteIndex === selectedIndex}
                            onClick={item.run}
                            onHover={() => setSelectedIndex(absoluteIndex)}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/10 px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">No encontré coincidencias para `{query}`.</p>
            <p className="mt-2 text-sm text-muted-foreground">Prueba con nombres de clientes, proyectos, tickets o acciones como “nuevo trato”, “finanzas” o “automatización”.</p>
          </div>
        )}
      </div>
    </DialogFrame>
  );
}

function CommandCenterItemRow({
  item,
  active,
  onClick,
  onHover,
}: {
  item: CommandCenterItem;
  active: boolean;
  onClick: () => void;
  onHover: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
        active
          ? "border-primary/40 bg-primary/8"
          : "border-border bg-secondary/10 hover:border-primary/20 hover:bg-secondary/30"
      }`}
      onClick={onClick}
      onMouseEnter={onHover}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-xl border p-2 ${active ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}>
          <item.icon className="h-4 w-4" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            {item.badge ? (
              <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {item.badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
        </div>
      </div>
      {item.shortcut ? (
        <span className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-mono text-muted-foreground">
          {item.shortcut}
        </span>
      ) : null}
    </button>
  );
}

function buildCommandSearchText(...values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join(" ")
    .toLowerCase();
}

function matchesCommandQuery(item: CommandCenterItem, query: string) {
  if (!query) {
    return true;
  }

  const terms = query.split(/\s+/).filter(Boolean);
  return terms.every((term) => item.searchText.includes(term));
}

function isCommandPathActive(currentPath: string, path: string) {
  if (path === "/os") {
    return currentPath === "/os";
  }

  return currentPath === path || currentPath.startsWith(`${path}/`);
}

function OmniCreatorDialog({
  open,
  onOpenChange,
  onAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: OverlayActionHandler;
}) {
  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Omni Creator"
      subtitle="Entrada rápida para entidades y acciones frecuentes."
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton>Cancelar</SecondaryButton>
          <PrimaryButton>
            <Zap className="h-4 w-4" />
            Guardar borrador
          </PrimaryButton>
        </div>
      }
      maxWidthClassName="max-w-2xl"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <ActionCard
          icon={CheckSquare}
          title="Crear tarea"
          description="Abre la vista de detalle de tarea para completar contexto y seguimiento."
          onClick={() => onAction("taskDetail", { context: null })}
        />
        <ActionCard
          icon={Building2}
          title="Nuevo trato CRM"
          description="Inicia deal, cliente, valor y stage inicial."
          onClick={() => onAction("createDeal")}
        />
        <ActionCard
          icon={CalendarDays}
          title="Crear evento"
          description="Agenda reunión con cliente o evento interno."
          onClick={() => onAction("createEvent")}
        />
        <ActionCard
          icon={UploadCloud}
          title="Subir archivos"
          description="Carga recursos, documentos o material del cliente."
          onClick={() => onAction("uploadFile", { context: "Portal" })}
        />
        <ActionCard
          icon={Link2}
          title="Registrar link"
          description="Añade dashboards, SaaS o referencias al Knowledge Hub."
          onClick={() => onAction("createLink")}
        />
      </div>
    </DialogFrame>
  );
}

function UniversalInboxDialog({
  open,
  onOpenChange,
  onOpenTicket,
  onOpenThread,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenTicket: (id: string) => void;
  onOpenThread: (id: string) => void;
}) {
  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Inbox universal"
      subtitle="Unifica menciones, alertas IA y tickets del portal."
      maxWidthClassName="max-w-4xl"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <InboxCard
          icon={MessageSquare}
          title="Mención en #dev-nexus"
          description="Sarah pidió revisar la navegación del shell y los shortcuts."
          actionLabel="Abrir hilo"
          onClick={() => onOpenThread("dev-thread")}
        />
        <InboxCard
          icon={Bell}
          title="Ticket portal · Budaphone"
          description="Pago pendiente no actualizado después de una transacción validada."
          actionLabel="Ver ticket"
          onClick={() => onOpenTicket("payment-sync")}
        />
        <InboxCard
          icon={Bot}
          title="IA CFO sugiere recordatorio"
          description="La invoice #INV-042 vence hoy y aún no se envió aviso al cliente."
          actionLabel="Ver soporte"
          onClick={() => onOpenTicket("payment-sync")}
        />
        <InboxCard
          icon={Sparkles}
          title="Resumen listo"
          description="La IA preparó minuta y tareas del kickoff con GlobalBank."
          actionLabel="Abrir hilo"
          onClick={() => onOpenThread("support-thread")}
        />
      </div>
    </DialogFrame>
  );
}




function EventDetailSheet({
  open,
  id,
  snapshot,
  onOpenChange,
  onEdit,
}: {
  open: boolean;
  id: string | null;
  snapshot: WorkspaceSnapshot;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}) {
  const record = getEventRecord(id, snapshot);

  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title={record.title}
      subtitle={record.time}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton>
            <Trash2 className="h-4 w-4" />
            Eliminar
          </SecondaryButton>
          <SecondaryButton>
            <Video className="h-4 w-4" />
            Agregar a calendario
          </SecondaryButton>
          <PrimaryButton>
            <CalendarDays className="h-4 w-4" />
            Editar
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          <MetricRow label="Duración" value={record.duration} />
          <MetricRow label="Cliente" value={record.client} />
          <MetricRow label="Proyecto" value={record.project} />
          <MetricRow label="Horario" value={record.time} />
        </div>
        <div>
          <SectionTitle icon={CalendarDays} title="Descripción" />
          <p className="rounded-2xl border border-border/60 bg-secondary/20 p-4 text-sm text-muted-foreground">
            {record.description}
          </p>
        </div>
        <div>
          <SectionTitle icon={User} title="Asistentes" />
          <div className="flex flex-wrap gap-2">
            {record.attendees.map((attendee) => (
              <TagChip key={attendee} label={attendee} />
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button className="text-sm font-medium text-primary" onClick={onEdit}>
            Abrir editor de evento
          </button>
        </div>
      </div>
    </SheetFrame>
  );
}

function AssetDetailSheet({ open, id, snapshot, onOpenChange }: { open: boolean; id: string | null; snapshot: WorkspaceSnapshot; onOpenChange: (open: boolean) => void }) {
  const record = getAssetRecord(id, snapshot);

  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title={record.name}
      subtitle={`${record.type} · ${record.size}`}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton>
            <Download className="h-4 w-4" />
            Descargar
          </SecondaryButton>
          <SecondaryButton>
            <Globe className="h-4 w-4" />
            Compartir con cliente
          </SecondaryButton>
          <PrimaryButton>
            <Trash2 className="h-4 w-4" />
            Eliminar
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex h-56 items-center justify-center rounded-2xl border border-border/60 bg-secondary/20">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
            <span className="text-sm">{record.preview}</span>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <MetricRow label="Subido por" value={record.uploadedBy} />
          <MetricRow label="Fecha" value={record.uploadedAt} />
          <MetricRow label="Tipo" value={record.type} />
          <MetricRow label="Tamaño" value={record.size} />
        </div>
        <div>
          <SectionTitle icon={Tag} title="Tags IA" />
          <div className="flex flex-wrap gap-2">
            {record.tags.map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </div>
        </div>
        <div>
          <SectionTitle icon={FolderKanban} title="Vinculado a" />
          <div className="space-y-2">
            {record.relations.map((relation) => (
              <MetricRow key={relation} label="Entidad" value={relation} />
            ))}
          </div>
        </div>
      </div>
    </SheetFrame>
  );
}

function VaultEntrySheet({
  open,
  id,
  onOpenChange,
  onEdit,
}: {
  open: boolean;
  id: string | null;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}) {
  const record = getVaultRecord(id);

  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title={record.title}
      subtitle={`Tipo: ${record.type}`}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton>
            <Copy className="h-4 w-4" />
            Copiar
          </SecondaryButton>
          <SecondaryButton onClick={onEdit}>
            <Key className="h-4 w-4" />
            Editar
          </SecondaryButton>
          <PrimaryButton>
            <ShieldCheck className="h-4 w-4" />
            Revocar
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2 rounded-2xl border border-border/60 bg-background p-4 font-mono text-sm text-foreground">
          {record.content.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
        <div>
          <SectionTitle icon={Clock} title="Historial de accesos" />
          <ActivityList items={record.audit} />
        </div>
      </div>
    </SheetFrame>
  );
}

function ThreadDetailSheet({
  open,
  id,
  onOpenChange,
  onConvert,
}: {
  open: boolean;
  id: string | null;
  onOpenChange: (open: boolean) => void;
  onConvert: () => void;
}) {
  const record = getThreadRecord(id);

  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title={record.title}
      subtitle={record.channel}
      footer={
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
            Responder inline...
          </div>
          <SecondaryButton>
            <AtSignPlaceholder />
            Menciones
          </SecondaryButton>
          <PrimaryButton>
            <CheckSquare className="h-4 w-4" />
            Enviar
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-3">
        {record.messages.map((message) => (
          <div
            key={message}
            className="rounded-2xl border border-border/60 bg-secondary/20 p-4 text-sm text-muted-foreground"
          >
            {message}
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <button className="text-sm font-medium text-primary" onClick={onConvert}>
            Convertir a tarea
          </button>
        </div>
      </div>
    </SheetFrame>
  );
}

function ContractDetailSheet({
  open,
  id,
  onOpenChange,
  onNewVersion,
}: {
  open: boolean;
  id: string | null;
  onOpenChange: (open: boolean) => void;
  onNewVersion: () => void;
}) {
  const record = getContractRecord(id);

  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title={record.title}
      subtitle={`Estado: ${record.status}`}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton>
            <Send className="h-4 w-4" />
            Enviar a firma
          </SecondaryButton>
          <SecondaryButton>
            <Download className="h-4 w-4" />
            Descargar PDF
          </SecondaryButton>
          <PrimaryButton>
            <FileSignature className="h-4 w-4" />
            Compartir con cliente
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 text-sm text-muted-foreground">
          {record.preview}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <MetricRow label="Firmantes" value={record.signatories.join(" · ")} />
          <MetricRow label="Estado" value={record.status} />
        </div>
        <div>
          <SectionTitle icon={Clock} title="Timeline de versiones" />
          <ActivityList items={record.milestones} />
        </div>
        <div className="flex justify-end">
          <button className="text-sm font-medium text-primary" onClick={onNewVersion}>
            Crear nueva versión desde plantilla
          </button>
        </div>
      </div>
    </SheetFrame>
  );
}

function UploadFileDialog({
  open,
  context,
  portalMode,
  portalClientSlug,
  onOpenChange,
}: {
  open: boolean;
  context: string | null;
  portalMode: boolean;
  portalClientSlug: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formId = "upload-file-dialog-form";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setError("Debes seleccionar un archivo válido.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      formData.set("target", readFormText(formData, "target") ?? "auto");

      if (portalMode) {
        await requestMutation("/api/portal/files", { method: "POST", body: formData }, "No fue posible subir el archivo.");
      } else {
        formData.set("source", "vertrex");
        if (!readFormText(formData, "clientSlug") && portalClientSlug) {
          formData.set("clientSlug", portalClientSlug);
        }
        await requestMutation("/api/admin/workspace/files", { method: "POST", body: formData }, "No fue posible subir el archivo.");
      }

      router.refresh();
      onOpenChange(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible subir el archivo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Subir archivo"
      subtitle={`Contexto actual: ${context ?? "General"}`}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" form={formId} disabled={submitting}>
            <UploadCloud className="h-4 w-4" />
            {submitting ? "Subiendo..." : portalMode ? "Subir al portal" : "Subir a Vertrex"}
          </PrimaryButton>
        </div>
      }
      maxWidthClassName="max-w-2xl"
    >
      <form id={formId} className="space-y-5" onSubmit={handleSubmit}>
        <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10">
          <span>Selecciona el archivo que quieres subir al flujo operativo real.</span>
          <input name="file" type="file" className="mt-4 block text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-primary-foreground" disabled={submitting} required />
        </label>
        <div className={`grid gap-4 ${portalMode ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {!portalMode ? <TextInput name="clientSlug" label="Cliente (slug)" placeholder="budaphone" defaultValue={portalClientSlug ?? undefined} disabled={submitting} /> : null}
          <TextInput name="category" label="Categoría" placeholder="branding, legal, portal" disabled={submitting} />
          <TextInput name="target" label="Destino" defaultValue="auto" disabled={submitting} />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : <p className="text-sm text-muted-foreground">El archivo queda disponible en el workspace y en el portal según el flujo actual.</p>}
      </form>
    </DialogFrame>
  );
}

function ImportDocumentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [clientSlug, setClientSlug] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setUrl("");
    setName("");
    setClientSlug("");
    setProjectName("");
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!url && !fileInputRef.current?.files?.length) {
      setError("Proporciona una URL o selecciona un archivo");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (url) formData.append("url", url);
      if (fileInputRef.current?.files?.[0]) {
        formData.append("file", fileInputRef.current.files[0]);
      }
      formData.append("name", name);
      formData.append("clientSlug", clientSlug);
      formData.append("projectName", projectName);

      const response = await fetch("/api/admin/documents/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setSuccess(true);
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && fileInputRef.current) {
      fileInputRef.current.files = files;
    }
  };

  return (
    <DialogFrame
      open={open}
      onOpenChange={(open) => {
        if (!open) resetForm();
        onOpenChange(open);
      }}
      title="Importar documento"
      subtitle="Ingiere PDF, DOCX, TXT o Markdown por URL o carga directa."
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton onClick={handleSubmit} disabled={loading || (!url && !fileInputRef.current?.files?.length)}>
            {loading ? <span className="animate-spin">⟳</span> : <FileText className="h-4 w-4" />}
            Importar
          </PrimaryButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="URL del documento"
          placeholder="https://.../documento.pdf"
          value={url}
          onChange={(value) => setUrl(value)}
        />
        <TextInput
          label="Nombre resultante"
          placeholder="Contrato Marco · Cliente"
          value={name}
          onChange={(value) => setName(value)}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Cliente vinculado"
            placeholder="Budaphone"
            value={clientSlug}
            onChange={(value) => setClientSlug(value)}
          />
          <TextInput
            label="Proyecto vinculado"
            placeholder="Portal cliente"
            value={projectName}
            onChange={(value) => setProjectName(value)}
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
        />
        <div
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-2xl border border-dashed border-border bg-secondary/20 p-6 text-center text-sm text-muted-foreground cursor-pointer hover:bg-secondary/30 transition-colors"
        >
          {fileInputRef.current?.files?.[0]
            ? `Archivo: ${fileInputRef.current.files[0].name}`
            : "O arrastra aquí el archivo a importar (PDF, DOCX, TXT, MD)"}
        </div>
        {success && <p className="text-sm text-success">Documento importado exitosamente</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </DialogFrame>
  );
}

function RegisterTransactionDialog({
  open,
  transactionType,
  portalClientSlug,
  onOpenChange,
}: {
  open: boolean;
  transactionType: "income" | "expense" | null;
  portalClientSlug: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formId = "register-transaction-dialog-form";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amountCents = parseAmountToCents(readFormText(formData, "amount"));

    if (amountCents <= 0) {
      setError("Debes indicar un monto válido.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await requestMutation(
        "/api/admin/workspace",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kind: "transaction",
            payload: {
              type: readFormText(formData, "type") === "expense" ? "expense" : "income",
              amountCents,
              category: readFormText(formData, "category"),
              clientSlug: readFormText(formData, "clientSlug") ?? portalClientSlug,
              occurredAt: toIsoValue(readFormText(formData, "occurredAt")),
              description: readFormText(formData, "description"),
            },
          }),
        },
        "No fue posible registrar la transacción.",
      );

      router.refresh();
      onOpenChange(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible registrar la transacción.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar transacción"
      subtitle={`Tipo preseleccionado: ${transactionType === "expense" ? "Gasto" : transactionType === "income" ? "Ingreso" : "Definir"}`}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" form={formId} disabled={submitting}>
            <Wallet className="h-4 w-4" />
            {submitting ? "Guardando..." : "Guardar movimiento"}
          </PrimaryButton>
        </div>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput name="amount" label="Monto" placeholder="180000" disabled={submitting} required />
          <TextInput name="category" label="Categoría" placeholder="MRR, infra, nómina" disabled={submitting} />
          <TextInput name="clientSlug" label="Cliente (slug)" placeholder="budaphone" defaultValue={portalClientSlug ?? undefined} disabled={submitting} />
          <TextInput name="type" label="Tipo" defaultValue={transactionType ?? "income"} disabled={submitting} />
          <TextInput name="occurredAt" label="Fecha" type="datetime-local" disabled={submitting} />
        </div>
        <TextArea name="description" label="Descripción" placeholder="Detalle de la transacción" disabled={submitting} />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </DialogFrame>
  );
}

function ConnectCredentialDialog({
  open,
  portalMode,
  portalClientSlug,
  onOpenChange,
}: {
  open: boolean;
  portalMode: boolean;
  portalClientSlug: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formId = "connect-credential-dialog-form";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      title: readFormText(formData, "title"),
      scope: readFormText(formData, "scope"),
      status: readFormText(formData, "status") ?? (portalMode ? "shared" : "requested"),
      secret: readFormText(formData, "secret"),
      linkUrl: readFormText(formData, "linkUrl"),
    };

    if (!payload.title) {
      setError("Debes indicar un nombre para la credencial.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (portalMode) {
        await requestMutation(
          "/api/portal/credentials",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
          "No fue posible guardar la credencial.",
        );
      } else {
        await requestMutation(
          "/api/admin/workspace",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              kind: "credential",
              payload: {
                ...payload,
                clientSlug: readFormText(formData, "clientSlug") ?? portalClientSlug,
              },
            }),
          },
          "No fue posible guardar la credencial.",
        );
      }

      router.refresh();
      onOpenChange(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible guardar la credencial.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Conectar credencial"
      subtitle="Define tipo, campos dinámicos y destino antes de cifrar con el vault."
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" form={formId} disabled={submitting}>
            <Lock className="h-4 w-4" />
            {submitting ? "Guardando..." : "Guardar credencial"}
          </PrimaryButton>
        </div>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <div className={`grid gap-4 ${portalMode ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          <TextInput name="title" label="Nombre" placeholder="Figma Enterprise" disabled={submitting} required />
          {!portalMode ? <TextInput name="clientSlug" label="Cliente (slug)" placeholder="budaphone" defaultValue={portalClientSlug ?? undefined} disabled={submitting} /> : null}
          <TextInput name="scope" label="Scope" placeholder="staging, diseño, producción" disabled={submitting} />
          <TextInput name="status" label="Estado" defaultValue={portalMode ? "shared" : "requested"} disabled={submitting} />
          <TextInput name="linkUrl" label="URL" placeholder="https://app.figma.com" disabled={submitting} />
        </div>
        <TextArea name="secret" label="Secreto / notas" placeholder="Contraseña, TOTP o contenido libre" disabled={submitting} />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </DialogFrame>
  );
}

function CreateLinkDialog({ open, portalClientSlug, onOpenChange }: { open: boolean; portalClientSlug: string | null; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formId = "create-link-dialog-form";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = readFormText(formData, "title");
    const url = readFormText(formData, "url");

    if (!title) {
      setError("Debes indicar un título para el link.");
      return;
    }

    if (!url) {
      setError("Debes indicar una URL válida para el link.");
      return;
    }

    let inferredDomain: string | null = null;

    try {
      inferredDomain = new URL(url).hostname;
    } catch {
      setError("Debes indicar una URL válida para el link.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await requestMutation(
        "/api/admin/workspace",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kind: "link",
            payload: {
              title,
              url,
              kind: readFormText(formData, "kind") ?? "url",
              description: readFormText(formData, "description"),
              imageUrl: readFormText(formData, "imageUrl"),
              clientSlug: readFormText(formData, "clientSlug") ?? portalClientSlug,
              projectId: readFormText(formData, "projectId"),
              domain: readFormText(formData, "domain") ?? inferredDomain,
            },
          }),
        },
        "No fue posible crear el link.",
      );

      router.refresh();
      onOpenChange(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible crear el link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar link"
      subtitle="Crea un acceso operativo real para dashboards, SaaS, repositorios o referencias del Hub."
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" form={formId} disabled={submitting}>
            <Link2 className="h-4 w-4" />
            {submitting ? "Guardando..." : "Guardar link"}
          </PrimaryButton>
        </div>
      }
      maxWidthClassName="max-w-3xl"
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput name="title" label="Título" placeholder="Dashboard operativo · Cliente" disabled={submitting} required />
          <SelectInput name="kind" label="Tipo" options={linkKindOptions} defaultValue="url" disabled={submitting} />
          <TextInput name="url" label="URL" placeholder="https://app.cliente.com" disabled={submitting} required />
          <TextInput name="domain" label="Dominio" placeholder="app.cliente.com" disabled={submitting} />
          <TextInput name="clientSlug" label="Cliente (slug)" placeholder="budaphone" defaultValue={portalClientSlug ?? undefined} disabled={submitting} />
          <TextInput name="projectId" label="Proyecto (UUID opcional)" placeholder="550e8400-e29b-41d4-a716-446655440000" disabled={submitting} />
          <TextInput name="imageUrl" label="Imagen (URL opcional)" placeholder="https://.../preview.png" disabled={submitting} />
        </div>
        <TextArea name="description" label="Descripción" placeholder="Contexto, uso operativo o notas para el equipo." disabled={submitting} />
        {error ? <p className="text-sm text-destructive">{error}</p> : <p className="text-sm text-muted-foreground">El link quedará disponible inmediatamente en el snapshot del Hub y en los exports operativos.</p>}
      </form>
    </DialogFrame>
  );
}

function CreateDealDialog({ open, portalClientSlug, onOpenChange }: { open: boolean; portalClientSlug: string | null; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formId = "create-deal-dialog-form";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = readFormText(formData, "title");

    if (!title) {
      setError("Debes indicar un título para el trato.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await requestMutation(
        "/api/admin/workspace",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kind: "deal",
            payload: {
              title,
              clientSlug: readFormText(formData, "clientSlug") ?? portalClientSlug,
              valueCents: parseAmountToCents(readFormText(formData, "amount")),
              billingModel: readFormText(formData, "billingModel") ?? "one-time",
              stage: readFormText(formData, "stage") ?? "sin_contactar",
              expectedCloseAt: toIsoValue(readFormText(formData, "expectedCloseAt")),
              probability: parsePercentValue(readFormText(formData, "probability")),
              owner: readFormText(formData, "owner"),
              summary: readFormText(formData, "summary"),
            },
          }),
        },
        "No fue posible crear el deal.",
      );

      router.refresh();
      onOpenChange(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible crear el deal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Crear deal"
      subtitle="Entrada rápida para pipeline, valor, stage y fecha estimada de cierre."
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" form={formId} disabled={submitting}>
            <Building2 className="h-4 w-4" />
            {submitting ? "Creando..." : "Crear trato"}
          </PrimaryButton>
        </div>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput name="title" label="Título" placeholder="Vertrex OS Enterprise" disabled={submitting} required />
          <TextInput name="clientSlug" label="Cliente (slug)" placeholder="globalbank" defaultValue={portalClientSlug ?? undefined} disabled={submitting} />
          <TextInput name="amount" label="Valor" placeholder="180000" disabled={submitting} />
          <TextInput name="billingModel" label="Modelo" defaultValue="annual" disabled={submitting} />
          <SelectInput name="stage" label="Etapa inicial" defaultValue="sin_contactar" options={canonicalDealStageOptions} disabled={submitting} />
          <TextInput name="expectedCloseAt" label="Cierre estimado" type="date" disabled={submitting} />
          <TextInput name="probability" label="Probabilidad" defaultValue="65" disabled={submitting} />
          <TextInput name="owner" label="Owner" placeholder="Sarah R." disabled={submitting} />
        </div>
        <TextArea name="summary" label="Notas" placeholder="Contexto comercial, riesgos y siguiente paso" disabled={submitting} />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </DialogFrame>
  );
}

function CreateEventDialog({ open, portalClientSlug, onOpenChange }: { open: boolean; portalClientSlug: string | null; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formId = "create-event-dialog-form";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = readFormText(formData, "title");
    const startsAt = toIsoValue(readFormText(formData, "startsAt"));
    const endsAt = toIsoValue(readFormText(formData, "endsAt"));

    if (!title || !startsAt || !endsAt) {
      setError("Debes indicar título, inicio y fin válidos.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await requestMutation(
        "/api/admin/workspace",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kind: "event",
            payload: {
              title,
              clientSlug: readFormText(formData, "clientSlug") ?? portalClientSlug,
              kind: readFormText(formData, "kind") ?? "meeting",
              location: readFormText(formData, "location"),
              meetUrl: readFormText(formData, "meetUrl"),
              startsAt,
              endsAt,
              attendees: (readFormText(formData, "attendees") ?? "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              description: readFormText(formData, "description"),
            },
          }),
        },
        "No fue posible crear el evento.",
      );

      router.refresh();
      onOpenChange(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible crear el evento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Crear evento"
      subtitle="Agenda reuniones, bloqueos de foco o follow-ups recurrentes."
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" form={formId} disabled={submitting}>
            <CalendarDays className="h-4 w-4" />
            {submitting ? "Guardando..." : "Guardar evento"}
          </PrimaryButton>
        </div>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput name="title" label="Título" placeholder="Kickoff cliente" disabled={submitting} required />
          <TextInput name="clientSlug" label="Cliente (slug)" placeholder="budaphone" defaultValue={portalClientSlug ?? undefined} disabled={submitting} />
          <TextInput name="kind" label="Tipo" defaultValue="meeting" disabled={submitting} />
          <TextInput name="location" label="Ubicación" placeholder="Google Meet / oficina" disabled={submitting} />
          <TextInput name="meetUrl" label="Meet URL" placeholder="https://meet.google.com/..." disabled={submitting} />
          <TextInput name="attendees" label="Asistentes" placeholder="pm@vertrex.co, cliente@empresa.com" disabled={submitting} />
          <TextInput name="startsAt" label="Inicio" type="datetime-local" disabled={submitting} required />
          <TextInput name="endsAt" label="Fin" type="datetime-local" disabled={submitting} required />
        </div>
        <TextArea name="description" label="Descripción" placeholder="Agenda, contexto y asistentes" disabled={submitting} />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </DialogFrame>
  );
}

function CreateTicketDialog({
  open,
  portalMode,
  portalClientSlug,
  onOpenChange,
}: {
  open: boolean;
  portalMode: boolean;
  portalClientSlug: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formId = "create-ticket-dialog-form";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = readFormText(formData, "title");

    if (!title) {
      setError("Debes indicar un título para el ticket.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (portalMode) {
        await requestMutation(
          "/api/portal/tickets",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title,
              summary: readFormText(formData, "summary"),
              requestType: readFormText(formData, "requestType"),
              priority: readFormText(formData, "priority"),
              assignedTo: readFormText(formData, "assignedTo"),
            }),
          },
          "No fue posible crear el ticket.",
        );
      } else {
        await requestMutation(
          "/api/admin/workspace",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              kind: "ticket",
              payload: {
                title,
                clientSlug: readFormText(formData, "clientSlug") ?? portalClientSlug,
                summary: readFormText(formData, "summary"),
                requestType: readFormText(formData, "requestType"),
                priority: readFormText(formData, "priority"),
                assignedTo: readFormText(formData, "assignedTo"),
                channel: readFormText(formData, "channel") ?? "operations",
                status: "open",
              },
            }),
          },
          "No fue posible crear el ticket.",
        );
      }

      router.refresh();
      onOpenChange(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible crear el ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Crear ticket"
      subtitle="Nuevo soporte para portal, operaciones o incidencias internas."
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" form={formId} disabled={submitting}>
            <LifeBuoy className="h-4 w-4" />
            {submitting ? "Creando..." : "Crear ticket"}
          </PrimaryButton>
        </div>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <div className={`grid gap-4 ${portalMode ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          <TextInput name="title" label="Título" placeholder="Pago no sincronizado" disabled={submitting} required />
          <SelectInput name="requestType" label="Tipo de request" defaultValue="soporte" options={workspaceRequestTypeOptions} disabled={submitting} />
          <TextInput name="priority" label="Prioridad" defaultValue="high" disabled={submitting} />
          {!portalMode ? <TextInput name="clientSlug" label="Cliente (slug)" placeholder="budaphone" defaultValue={portalClientSlug ?? undefined} disabled={submitting} /> : null}
          <TextInput name="assignedTo" label="Asignado a" placeholder="Operaciones" disabled={submitting} />
          <TextInput name="channel" label="Canal" defaultValue={portalMode ? "portal" : "operations"} disabled={submitting} />
        </div>
        <TextArea name="summary" label="Descripción" placeholder="Detalle del problema y evidencia" disabled={submitting} />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </DialogFrame>
  );
}

function CreateAutomationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formId = "create-automation-dialog-form";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = readFormText(formData, "title");
    const trigger = readFormText(formData, "trigger");
    const action = readFormText(formData, "action");

    if (!title) {
      setError("Debes indicar un nombre para el playbook.");
      return;
    }

    if (!trigger) {
      setError("Debes indicar un trigger para la automatización.");
      return;
    }

    if (!action) {
      setError("Debes indicar la acción principal del playbook.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await requestMutation(
        "/api/admin/workspace",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kind: "automationPlaybook",
            payload: {
              title,
              clientSlug: readFormText(formData, "clientSlug"),
              trigger,
              action,
              result: readFormText(formData, "result"),
              summary: readFormText(formData, "summary"),
              status: readFormText(formData, "status") ?? "active",
            },
          }),
        },
        "No fue posible crear la automatización.",
      );

      router.refresh();
      onOpenChange(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible crear la automatización.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Crear automatización"
      subtitle="Entrada rápida para trigger + acción antes de abrir el canvas completo."
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" form={formId} disabled={submitting}>
            <Zap className="h-4 w-4" />
            {submitting ? "Creando..." : "Crear flujo"}
          </PrimaryButton>
        </div>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput name="title" label="Nombre" placeholder="Onboarding cliente enterprise" disabled={submitting} required />
          <TextInput name="clientSlug" label="Cliente (slug)" placeholder="budaphone" disabled={submitting} />
          <TextInput name="trigger" label="Trigger" defaultValue="Nuevo proyecto creado" disabled={submitting} required />
          <TextInput name="action" label="Acción principal" defaultValue="Crear tarea" disabled={submitting} required />
          <TextInput name="result" label="Resultado" defaultValue="Abrir canvas" disabled={submitting} />
          <SelectInput
            name="status"
            label="Estado"
            defaultValue="active"
            disabled={submitting}
            options={[
              { value: "draft", label: "Draft" },
              { value: "active", label: "Activo" },
              { value: "paused", label: "Pausado" },
            ]}
          />
        </div>
        <TextArea name="summary" label="Resumen" placeholder="Qué debe pasar cuando se active el flujo" disabled={submitting} />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </DialogFrame>
  );
}

function TemplateSelectorDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "universales" | "cliente">("all");
  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return templateOptions.filter((template) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "universales"
            ? template.clientId === "universales"
            : template.clientId !== "universales";

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [template.title, template.description, template.type, template.clientLabel]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [filter, query]);

  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Selector de plantillas"
      subtitle="Explora plantillas universales y por cliente con preview y uso inmediato."
      maxWidthClassName="max-w-5xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Filtros sugeridos: universales, cliente, legal, comercial.</span>
          <SecondaryButton onClick={() => onOpenChange(false)}>Cerrar</SecondaryButton>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              placeholder="Buscar por nombre o tipo..."
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <SecondaryButton onClick={() => setFilter(filter === "universales" ? "all" : "universales")}>Universales</SecondaryButton>
          <SecondaryButton onClick={() => setFilter(filter === "cliente" ? "all" : "cliente")}>Por cliente</SecondaryButton>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              className="rounded-2xl border border-border bg-secondary/20 p-4 text-left transition-colors hover:border-primary/40 hover:bg-secondary/40"
              onClick={() => onSelect(template.id)}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="rounded-xl border border-border bg-background p-2 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {template.kind}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{template.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{template.type}</span>
                <span className="text-primary">Usar plantilla</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </DialogFrame>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof FolderKanban;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-2xl border border-border bg-secondary/20 p-4 text-left transition-colors hover:border-primary/40 hover:bg-secondary/40"
      onClick={onClick}
    >
      <div className="mb-3 rounded-xl border border-border bg-background p-2 text-primary w-fit">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

function InboxCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onClick,
}: {
  icon: typeof MessageSquare;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-2xl border border-border bg-secondary/20 p-4 text-left transition-colors hover:border-primary/40 hover:bg-secondary/40"
      onClick={onClick}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="rounded-xl border border-border bg-background p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">
        {actionLabel}
      </div>
    </button>
  );
}

function AtSignPlaceholder() {
  return <span className="text-xs font-semibold">@</span>;
}
