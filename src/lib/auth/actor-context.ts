import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import type { OsSession } from "@/lib/auth/session";

const actorStore = new AsyncLocalStorage<OsSession>();

export function runWithActor<T>(session: OsSession, fn: () => Promise<T>): Promise<T> {
  return actorStore.run(session, fn);
}

export function getInjectedActor(): OsSession | null {
  return actorStore.getStore() ?? null;
}
