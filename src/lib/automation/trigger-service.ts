import { isDatabaseConfigured } from "@/lib/db";
import { createAutomationRun, startAutomationRun, logExecutionStep, completeAutomationRun } from "./execution-service";

export type AutomationTrigger = {
  id: string;
  name: string;
  event: string;
  condition?: (payload: Record<string, unknown>) => boolean;
  actions: AutomationAction[];
  active: boolean;
};

export type AutomationAction = {
  type: "send_email" | "create_task" | "slack_notification" | "create_event" | "webhook";
  config: Record<string, unknown>;
};

const defaultTriggers: AutomationTrigger[] = [
  {
    id: "new-client-onboarding",
    name: "Nuevo cliente - crear tareas de onboarding",
    event: "client.created",
    actions: [
      { type: "create_task", config: { title: "Onboarding: Reunión de kickoff", priority: "high" } },
      { type: "create_task", config: { title: "Onboarding: Configurar accesos", priority: "medium" } },
    ],
    active: true,
  },
  {
    id: "deal-won-celebration",
    name: "Deal ganado - notificar al equipo",
    event: "deal.won",
    actions: [
      { type: "slack_notification", config: { message: "🎉 Nuevo deal ganado" } },
      { type: "create_task", config: { title: "Preparar contrato para firma", priority: "high" } },
    ],
    active: true,
  },
  {
    id: "ticket-created-alert",
    name: "Ticket nuevo - alertar al responsable",
    event: "ticket.created",
    actions: [
      { type: "send_email", config: { subject: "Nuevo ticket asignado" } },
    ],
    active: true,
  },
  {
    id: "invoice-overdue-reminder",
    name: "Invoice vencido - recordatorio de pago",
    event: "invoice.overdue",
    actions: [
      { type: "send_email", config: { subject: "Recordatorio de pago pendiente" } },
    ],
    active: true,
  },
  {
    id: "task-overdue-escalation",
    name: "Tarea vencida - escalar a manager",
    event: "task.overdue",
    actions: [
      { type: "slack_notification", config: { message: "⚠️ Tarea vencida requiere atención" } },
    ],
    active: true,
  },
];

export function getActiveTriggers(): AutomationTrigger[] {
  return defaultTriggers.filter((t) => t.active);
}

export async function evaluateTrigger(
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const triggers = getActiveTriggers().filter((t) => t.event === event);
  for (const trigger of triggers) {
    if (trigger.condition && !trigger.condition(payload)) {
      continue;
    }
    const run = await createAutomationRun({
      playbookId: trigger.id,
      clientId: (payload.clientId as string) ?? null,
      projectId: (payload.projectId as string) ?? null,
      title: trigger.name,
      summary: `Triggered by ${event}`,
      triggeredBy: "system",
      triggerSource: event,
    });
    if (!run) continue;
    await startAutomationRun(run.id);
    let stepNum = 1;
    for (const action of trigger.actions) {
      await logExecutionStep(run.id, {
        stepNumber: stepNum,
        action: action.type,
        status: "running",
        input: action.config,
        logs: [`Executing ${action.type}`],
      });
      try {
        const result = await executeAction(action, payload);
        await logExecutionStep(run.id, {
          stepNumber: stepNum,
          action: action.type,
          status: "completed",
          output: result,
          logs: [`${action.type} completed successfully`],
        });
      } catch (error) {
        await logExecutionStep(run.id, {
          stepNumber: stepNum,
          action: action.type,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
          logs: [`${action.type} failed: ${error instanceof Error ? error.message : String(error)}`],
        });
      }
      stepNum++;
    }
    await completeAutomationRun(run.id, "completed", { trigger, payload });
  }
}

async function executeAction(
  action: AutomationAction,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  switch (action.type) {
    case "send_email":
      return { sent: true, subject: action.config.subject };
    case "create_task":
      if (!isDatabaseConfigured()) return { created: false, reason: "db offline" };
      return { created: true, title: action.config.title };
    case "slack_notification":
      return { notified: true, message: action.config.message };
    case "create_event":
      return { created: true, title: action.config.title };
    case "webhook":
      return { called: true, url: action.config.url };
    default:
      return { skipped: true };
  }
}
