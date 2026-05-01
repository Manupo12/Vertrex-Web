import { requireTeamSession } from "@/lib/auth/session";
import { buildJsonErrorResponse } from "@/lib/api/error-response";
import {
  createWorkspaceAutomationPlaybook,
  createWorkspaceAutomationRun,
  createWorkspaceClient,
  createWorkspaceCredential,
  createWorkspaceDeal,
  createWorkspaceEvent,
  createWorkspaceInvoice,
  createWorkspaceLink,
  createWorkspaceMilestone,
  createWorkspaceMessage,
  createWorkspaceProject,
  createWorkspaceTask,
  createWorkspaceTicket,
  createWorkspaceTransaction,
  getWorkspaceSnapshot,
} from "@/lib/ops/workspace-service";
import { workspaceAdminCommandSchema } from "@/lib/ops/workspace-schemas";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { evaluateTrigger } from "@/lib/automation/trigger-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireTeamSession();
    const snapshot = await getWorkspaceSnapshot();
    return Response.json(snapshot);
  } catch (error) {
    return buildJsonErrorResponse(error, "No fue posible consultar el workspace operativo.");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireTeamSession();
    const command = workspaceAdminCommandSchema.parse(await request.json());
    enforceRateLimit({
      request,
      namespace: "admin-workspace-command",
      max: 60,
      windowMs: 5 * 60 * 1000,
      identifier: `${session.user.id}:${command.kind}`,
      message: "Demasiadas acciones operativas en poco tiempo. Espera un momento antes de seguir ejecutando comandos del workspace.",
    });
    const options = {
      actor: {
        userId: session.user.id,
        role: session.user.role,
        name: session.user.name,
        email: session.user.email,
      },
    };

    let result;
    switch (command.kind) {
      case "client":
        result = await createWorkspaceClient(command.payload, options);
        await evaluateTrigger("client.created", { clientId: (result as Record<string, unknown>)?.id, ...command.payload });
        return Response.json(result, { status: 201 });
      case "project":
        result = await createWorkspaceProject(command.payload, options);
        return Response.json(result, { status: 201 });
      case "task":
        result = await createWorkspaceTask(command.payload, options);
        return Response.json(result, { status: 201 });
      case "milestone":
        result = await createWorkspaceMilestone(command.payload, options);
        return Response.json(result, { status: 201 });
      case "deal":
        result = await createWorkspaceDeal(command.payload, options);
        if ((command.payload as Record<string, unknown>)?.stage === "won") {
          await evaluateTrigger("deal.won", { dealId: (result as Record<string, unknown>)?.id, ...command.payload });
        }
        return Response.json(result, { status: 201 });
      case "event":
        result = await createWorkspaceEvent(command.payload, options);
        return Response.json(result, { status: 201 });
      case "transaction":
        result = await createWorkspaceTransaction(command.payload, options);
        return Response.json(result, { status: 201 });
      case "invoice":
        result = await createWorkspaceInvoice(command.payload, options);
        if ((command.payload as Record<string, unknown>)?.status === "overdue") {
          await evaluateTrigger("invoice.overdue", { invoiceId: (result as Record<string, unknown>)?.id, ...command.payload });
        }
        return Response.json(result, { status: 201 });
      case "credential":
        result = await createWorkspaceCredential(command.payload, options);
        return Response.json(result, { status: 201 });
      case "link":
        result = await createWorkspaceLink(command.payload, options);
        return Response.json(result, { status: 201 });
      case "ticket":
        result = await createWorkspaceTicket(command.payload, options);
        await evaluateTrigger("ticket.created", { ticketId: (result as Record<string, unknown>)?.id, ...command.payload });
        return Response.json(result, { status: 201 });
      case "message":
        result = await createWorkspaceMessage(command.payload, options);
        return Response.json(result, { status: 201 });
      case "automationPlaybook":
        result = await createWorkspaceAutomationPlaybook(command.payload, options);
        return Response.json(result, { status: 201 });
      case "automationRun":
        result = await createWorkspaceAutomationRun(command.payload, options);
        return Response.json(result, { status: 201 });
      default:
        return Response.json({ error: "Comando no soportado." }, { status: 400 });
    }
  } catch (error) {
    return buildJsonErrorResponse(error, "No fue posible ejecutar la acción operativa.");
  }
}
