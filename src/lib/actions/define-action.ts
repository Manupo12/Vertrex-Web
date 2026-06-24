import { requireOsUser, type OsSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/auth/permissions";
import { logActivity } from "@/lib/activity/log";
import type { EntityType } from "@/lib/db/actions/graph-types";

type ActionMeta = {
  module?: "finances"|"resources"|"legal"|"crm"|"projects"|"marketing"|"agenda"|"links"|"hub"|"team"|"settings"|"documents";
  level?: "read"|"write"|"admin";
  audit?: { verb: string; targetType: EntityType };
};

export function defineAction<I, O>(
  meta: ActionMeta,
  fn: (input: I, ctx: { actor: OsSession }) => Promise<O>
): (input: I) => Promise<O> {
  return async function (input: I): Promise<O> {
    const actor = await requireOsUser();
    if (meta.module) {
      await requireModuleAccess(actor.userId, meta.module, meta.level || "read");
    }
    const out = await fn(input, { actor });
    if (meta.audit && out && typeof out === "object" && "id" in out) {
      await logActivity({
        actorType: "team",
        actorId: actor.userId,
        verb: meta.audit.verb,
        targetType: meta.audit.targetType,
        targetId: String((out as any).id),
      });
    }
    return out;
  };
}
