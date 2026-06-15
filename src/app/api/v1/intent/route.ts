import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { ApiError } from "@/lib/api/errors";
import { parseIntent, isAllowedAction, type IntentAction } from "@/lib/api/intent";
import { createTaskAction, changeTaskStateAction, assignTaskAction, listTasksAction } from "@/lib/db/actions/tasks";
import { createKnowledgeNote } from "@/lib/db/actions/hub";
import { searchEntitiesAction } from "@/lib/db/actions/search";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";

export const POST = authed(async ({ req, session }) => {
  const body = await req.json().catch(() => ({}));
  const text: string = body?.intent ?? "";
  const execute: boolean = body?.execute === true;
  if (!text || typeof text !== "string") {
    throw new ApiError("bad_request", 400, "Campo 'intent' (string) requerido");
  }

  const parsed = parseIntent(text);
  if (!parsed.action) {
    return { plan: null, executed: false, reason: parsed.reason ?? "Intención no entendida" };
  }

  // revalidar allowlist (defensa en profundidad)
  if (!isAllowedAction(parsed.action.name)) {
    throw new ApiError("forbidden_action", 403, `Acción no permitida: ${parsed.action.name}`);
  }

  if (!execute) {
    // dry-run: devolver plan sin ejecutar
    return { plan: parsed.action, executed: false };
  }

  // ejecutar bajo RBAC explícito
  const a: IntentAction = parsed.action;
  switch (a.name) {
    case "create_task": {
      await assertPermission(session, "projects", "write");
      const r = await createTaskAction(a.args as any);
      return { plan: a, executed: true, result: r };
    }
    case "change_state": {
      await assertPermission(session, "projects", "write");
      const r = await changeTaskStateAction(a.args.id as string, a.args.state as string);
      return { plan: a, executed: true, result: r };
    }
    case "assign_task": {
      await assertPermission(session, "projects", "write");
      const r = await assignTaskAction(a.args.id as string, (a.args.assigneeId as string) ?? null);
      return { plan: a, executed: true, result: r };
    }
    case "create_note": {
      await assertPermission(session, "hub", "write");
      const fd = new FormData();
      fd.set("title", a.args.title as string);
      if (a.args.type) fd.set("type", a.args.type as string);
      const r = await createKnowledgeNote(fd);
      return { plan: a, executed: true, result: r };
    }
    case "list_tasks": {
      await assertPermission(session, "projects", "read");
      const r = await listTasksAction(a.args.projectId as string | undefined);
      return { plan: a, executed: true, result: r };
    }
    case "list_clients": {
      await assertPermission(session, "crm", "read");
      const r = await db.select().from(clients).orderBy(desc(clients.createdAt)).limit(100);
      return { plan: a, executed: true, result: r };
    }
    case "search": {
      // search no requiere permiso de módulo específico; se considera lectura general
      const r = await searchEntitiesAction(a.args.q as string);
      return { plan: a, executed: true, result: r };
    }
  }
});
