# Vertrex CLI (MVP) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar un CLI `vertrex` + una API de agente `/api/v1/*` que permita a personas y a un agente de IA consultar y editar el núcleo de Vertrex OS (tareas, proyectos, clientes, agenda, notas, actividad, búsqueda), con login multiusuario, RBAC y auditoría.

**Architecture:** El CLI (paquete TS aislado en `cli/`, framework oclif) habla por HTTPS con rutas Next.js `/api/v1/*`. Cada ruta autentica un token personal (PAT), resuelve el usuario, aplica RBAC y **reutiliza la capa de acciones existente** (`src/lib/db/actions/*`) ejecutándola dentro de un contexto de actor (`AsyncLocalStorage`), de modo que `requireOsUser()` funcione sin cookies. Toda mutación se audita en la tabla `activity`.

**Tech Stack:** Next.js 15 (App Router, route handlers, runtime nodejs), Drizzle ORM + Postgres/Neon, zod, jose/bcryptjs/otpauth (auth existente), Upstash (rate-limit), oclif + TypeScript (CLI), Vitest (tests).

**Spec de referencia:** `docs/superpowers/specs/2026-06-14-vertrex-cli-design.md` (leer primero).

---

## Preludio — Léeme antes de empezar (contexto y decisiones cerradas)

1. **No reimplementar el dominio.** La lógica vive en `src/lib/db/actions/*`. La API solo añade un caparazón: auth → RBAC → validación zod → llamar la acción → serializar → auditar.
2. **El acoplamiento a cookies es real.** Las acciones llaman `requireOsUser()` (de `src/lib/auth/session.ts`), que lee cookies y hace `redirect("/login")`. La **Tarea 1** introduce un seam de actor con `AsyncLocalStorage` y modifica SOLO `requireOsUser` para que consulte primero el actor inyectado. Con eso, todas las acciones funcionan bajo token sin tocarlas. El web sigue igual (nunca inyecta actor → cae al cookie).
3. **Runtime Node.** Toda ruta `/api/v1/*` debe declarar `export const runtime = "nodejs"` (usa `AsyncLocalStorage` y `postgres`).
4. **Acciones con `FormData`.** Algunas acciones reciben `FormData` (no objeto): `createProjectAction`, `updateProjectAction`(objeto), `createClientAction`, `updateClientAction`(slug,FormData), `createAgendaEventAction`, `updateAgendaEventAction`, `createKnowledgeNote`, `createTeamMemberAction`. Para esas, la ruta construye un `FormData` desde el JSON validado con el helper `jsonToFormData` (Tarea 12b).
5. **Lecturas sin acción.** Algunos dominios no tienen acción de listar/leer (p.ej. `activity.ts` no exporta nada; agenda no tiene `list`). En esos casos la ruta GET hace un `db.select(...)` directo (decoplado y simple).
6. **Nombres de módulos RBAC.** `requireModuleAccess(userId, module, level)` usa un `module` string que debe coincidir con los valores en la tabla `module_permissions`. Mapa asumido: tareas/proyectos/ciclos/hitos → `"projects"`; clientes → `"crm"`; agenda → `"agenda"`; notas → `"hub"`; actividad/búsqueda → lectura general. **Confírmalo** revisando usos de `requireModuleAccess`/la UI de settings antes de la Tarea 12. `getModulePermission` devuelve `"write"` por defecto si no hay fila (permisivo) y los `admin` saltan RBAC.
7. **Clave del secreto 2FA.** `loginTeam` solo checa `preferences.twoFactorEnabled`. Para verificar el OTP necesitas el secreto; **lee `src/app/api/auth/2fa/verify/route.ts`** para confirmar bajo qué clave de `user.preferences` se guarda (asumido `twoFactorSecret`) y úsala en la Tarea 8.
8. **TDD + commits frecuentes.** Mantén verde `npm run typecheck && npm run lint && npm run vitest` (o `npx vitest run`). El proyecto ya tiene Vitest configurado y un patrón de mocks (`src/lib/db/actions/__tests__/tasks.test.ts`).

---

## Mapa de archivos (qué se crea / se toca)

**API (dentro de la app Next):**
- `src/lib/auth/actor-context.ts` *(crear)* — seam `AsyncLocalStorage`.
- `src/lib/auth/session.ts` *(modificar `requireOsUser`)*.
- `src/lib/db/schema.ts` *(añadir `apiTokens`)* + migración Drizzle.
- `src/lib/api/tokens.ts` *(crear)* — generar/hashear PAT.
- `src/lib/api/ratelimit.ts` *(crear)* — extraído del patrón de `/api/mcp/*`.
- `src/lib/api/errors.ts` *(crear)* — `ApiError`.
- `src/lib/api/rbac.ts` *(crear)* — `assertPermission`.
- `src/lib/api/handler.ts` *(crear)* — wrapper `authed()`.
- `src/lib/api/form.ts` *(crear)* — `jsonToFormData`.
- `src/lib/db/actions/api-tokens.ts` *(crear)* — CRUD de PAT + `resolveActorFromToken`.
- `src/lib/validation/v1/*.ts` *(crear)* — esquemas zod por recurso.
- `src/app/api/v1/auth/{login,whoami,tokens}/route.ts`, `tokens/[id]/route.ts` *(crear)*.
- `src/app/api/v1/{tasks,projects,clients,agenda,notes,activity,search,intent,commands}/**` *(crear)*.

**CLI (paquete aislado):**
- `cli/package.json`, `cli/tsconfig.json`, `cli/bin/run.js` *(crear)*.
- `cli/src/lib/{config,client,output}.ts` *(crear)*.
- `cli/src/commands/**` *(crear)*.
- `cli/AGENT.md`, `cli/README.md` *(crear)*.
- Raíz `package.json` *(añadir `"workspaces": ["cli"]`)*.

**Skill / docs:**
- `.claude/skills/vertrex-os/SKILL.md` *(crear)*.
- `docs/openapi/vertrex.json` *(generado, opcional MVP)*.

**Índice de tareas:** Fase 0 (cimientos): T1–T11 · Fase 1 (recursos + capa de agente): T12–T19.

---

# FASE 0 — Cimientos

### Task 1: Seam de actor (AsyncLocalStorage)

**Files:**
- Create: `src/lib/auth/actor-context.ts`
- Modify: `src/lib/auth/session.ts` (función `requireOsUser`, ~línea 64)
- Test: `src/lib/auth/__tests__/actor-context.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/auth/__tests__/actor-context.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: () => undefined })) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("REDIRECT"); }) }));

describe("actor context seam", () => {
  it("requireOsUser returns the injected actor without touching cookies", async () => {
    const { runWithActor } = await import("../actor-context");
    const { requireOsUser } = await import("../session");
    const actor = { userId: "u1", email: "a@b.c", name: "A", role: "admin" as const };
    const result = await runWithActor(actor, () => requireOsUser());
    expect(result).toEqual(actor);
  });

  it("requireOsUser redirects when no actor and no cookie", async () => {
    const { requireOsUser } = await import("../session");
    await expect(requireOsUser()).rejects.toThrow("REDIRECT");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/auth/__tests__/actor-context.test.ts`
Expected: FAIL (`../actor-context` no existe).

- [ ] **Step 3: Create the actor context**

```ts
// src/lib/auth/actor-context.ts
import { AsyncLocalStorage } from "node:async_hooks";
import type { OsSession } from "@/lib/auth/session";

const actorStore = new AsyncLocalStorage<OsSession>();

export function runWithActor<T>(session: OsSession, fn: () => Promise<T>): Promise<T> {
  return actorStore.run(session, fn);
}

export function getInjectedActor(): OsSession | null {
  return actorStore.getStore() ?? null;
}
```

- [ ] **Step 4: Modify `requireOsUser` to consult the actor first**

In `src/lib/auth/session.ts`, add the import near the top:

```ts
import { getInjectedActor } from "@/lib/auth/actor-context";
```

Replace the body of `requireOsUser` with:

```ts
export async function requireOsUser() {
  const injected = getInjectedActor();
  if (injected) return injected;
  const session = await getOsSession();
  if (!session) redirect("/login");
  return session;
}
```

> `import type { OsSession }` en `actor-context.ts` es solo-tipo (se borra en runtime), por lo que NO hay ciclo de importación real.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/auth/__tests__/actor-context.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth/actor-context.ts src/lib/auth/session.ts src/lib/auth/__tests__/actor-context.test.ts
git commit -m "feat(api): add actor-context seam so actions run under token auth"
```

---

### Task 2: Tabla `apiTokens` + migración

**Files:**
- Modify: `src/lib/db/schema.ts` (añadir al final, antes del EOF)
- Create (generado): `drizzle/0003_*.sql`

- [ ] **Step 1: Add the table to the schema**

```ts
// src/lib/db/schema.ts  (al final del archivo)
export const apiTokens = pgTable("api_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  prefix: text("prefix").notNull(),
  scopes: jsonb("scopes").notNull().default(sql`'[]'::jsonb`),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  userIdx: index("api_tokens_user_idx").on(table.userId),
}));
```

- [ ] **Step 2: Generate the migration**

Run: `npm run db:generate`
Expected: nuevo archivo `drizzle/0003_*.sql` con `CREATE TABLE "api_tokens"`.

- [ ] **Step 3: Apply the migration (DB de desarrollo)**

Run: `npm run db:migrate`
Expected: migración aplicada sin error.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat(db): add api_tokens table for personal access tokens"
```

---

### Task 3: Utilidad de tokens (generar/hashear)

**Files:**
- Create: `src/lib/api/tokens.ts`
- Test: `src/lib/api/__tests__/tokens.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/api/__tests__/tokens.test.ts
import { describe, it, expect } from "vitest";
import { generateApiToken, hashApiToken } from "../tokens";

describe("api tokens", () => {
  it("generates a vtx_ token with hash and prefix", () => {
    const { token, tokenHash, prefix } = generateApiToken();
    expect(token.startsWith("vtx_")).toBe(true);
    expect(prefix).toBe(token.slice(0, 12));
    expect(hashApiToken(token)).toBe(tokenHash);
  });
  it("hash is deterministic and differs per token", () => {
    const a = generateApiToken(); const b = generateApiToken();
    expect(hashApiToken(a.token)).toBe(a.tokenHash);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/api/__tests__/tokens.test.ts` → FAIL (módulo no existe).

- [ ] **Step 3: Implement**

```ts
// src/lib/api/tokens.ts
import { randomBytes, createHash } from "node:crypto";

const TOKEN_PREFIX = "vtx_";

export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateApiToken(): { token: string; tokenHash: string; prefix: string } {
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  return { token, tokenHash: hashApiToken(token), prefix: token.slice(0, 12) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/api/__tests__/tokens.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/tokens.ts src/lib/api/__tests__/tokens.test.ts
git commit -m "feat(api): add PAT generation and hashing util"
```

---

### Task 4: Acciones de api-tokens + `resolveActorFromToken`

**Files:**
- Create: `src/lib/db/actions/api-tokens.ts`
- Test: `src/lib/db/actions/__tests__/api-tokens.test.ts`

- [ ] **Step 1: Write the failing test** (sigue el patrón de mocks existente)

```ts
// src/lib/db/actions/__tests__/api-tokens.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ db: { insert: vi.fn(), select: vi.fn(), update: vi.fn() } }));

describe("resolveActorFromToken", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null for unknown token", async () => {
    const { db } = await import("@/lib/db");
    (db.select as any).mockReturnValue({ from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValue([]) }) }) });
    const { resolveActorFromToken } = await import("../api-tokens");
    expect(await resolveActorFromToken("vtx_bad")).toBeNull();
  });

  it("returns an OsSession for a valid token and bumps lastUsedAt", async () => {
    const { db } = await import("@/lib/db");
    const tokenRow = { id: "t1", userId: "u1", revokedAt: null, expiresAt: null };
    const userRow = { id: "u1", email: "a@b.c", name: "A", role: "admin", isActive: true };
    (db.select as any)
      .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValue([tokenRow]) }) }) })
      .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValue([userRow]) }) }) });
    (db.update as any).mockReturnValue({ set: () => ({ where: vi.fn().mockResolvedValue(undefined) }) });
    const { resolveActorFromToken } = await import("../api-tokens");
    const s = await resolveActorFromToken("vtx_good");
    expect(s).toEqual({ userId: "u1", email: "a@b.c", name: "A", role: "admin" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/db/actions/__tests__/api-tokens.test.ts` → FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/db/actions/api-tokens.ts
import "server-only";
import { db } from "@/lib/db";
import { apiTokens, users } from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { generateApiToken, hashApiToken } from "@/lib/api/tokens";
import type { OsSession } from "@/lib/auth/session";

export async function createApiTokenForUser(userId: string, name: string, expiresAt?: Date) {
  const { token, tokenHash, prefix } = generateApiToken();
  const [record] = await db.insert(apiTokens)
    .values({ userId, name, tokenHash, prefix, expiresAt: expiresAt ?? null })
    .returning();
  return { token, record }; // `token` se muestra UNA sola vez
}

export async function listApiTokensForUser(userId: string) {
  return db.select({
    id: apiTokens.id, name: apiTokens.name, prefix: apiTokens.prefix,
    lastUsedAt: apiTokens.lastUsedAt, expiresAt: apiTokens.expiresAt,
    revokedAt: apiTokens.revokedAt, createdAt: apiTokens.createdAt,
  }).from(apiTokens).where(eq(apiTokens.userId, userId)).orderBy(desc(apiTokens.createdAt));
}

export async function revokeApiToken(userId: string, tokenId: string) {
  await db.update(apiTokens).set({ revokedAt: new Date() })
    .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.userId, userId)));
}

export async function resolveActorFromToken(token: string): Promise<OsSession | null> {
  const [row] = await db.select().from(apiTokens)
    .where(and(eq(apiTokens.tokenHash, hashApiToken(token)), isNull(apiTokens.revokedAt))).limit(1);
  if (!row) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;
  const [user] = await db.select().from(users)
    .where(and(eq(users.id, row.userId), eq(users.isActive, true))).limit(1);
  if (!user) return null;
  await db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, row.id));
  return { userId: user.id, email: user.email, name: user.name, role: user.role };
}
```

- [ ] **Step 4: Run test to verify it passes** → PASS.
- [ ] **Step 5: Commit**

```bash
git add src/lib/db/actions/api-tokens.ts src/lib/db/actions/__tests__/api-tokens.test.ts
git commit -m "feat(api): add api-token actions and token->actor resolver"
```

---

### Task 5: Rate-limit reutilizable + errores + RBAC + request auth

> Tres archivos pequeños y de bajo riesgo; un solo commit. Extraen y centralizan patrones ya presentes.

**Files:**
- Create: `src/lib/api/ratelimit.ts`, `src/lib/api/errors.ts`, `src/lib/api/rbac.ts`, `src/lib/api/auth.ts`
- Test: `src/lib/api/__tests__/rbac.test.ts`

- [ ] **Step 1: Implement `ratelimit.ts`** (copiado del patrón de `src/app/api/mcp/tasks/route.ts`)

```ts
// src/lib/api/ratelimit.ts
import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN }) : null;
const limiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, "60 s"), analytics: true }) : null;
const mem = new Map<string, { count: number; ts: number }>();

export async function rateLimit(req: NextRequest): Promise<{ ok: boolean }> {
  const key = req.headers.get("authorization") || req.headers.get("x-forwarded-for") || "unknown";
  if (limiter) return { ok: (await limiter.limit(key)).success };
  const now = Date.now();
  const info = mem.get(key) || { count: 0, ts: now };
  if (now - info.ts > 60000) { info.count = 1; info.ts = now; } else { info.count += 1; }
  mem.set(key, info);
  return { ok: info.count <= 100 };
}
```

- [ ] **Step 2: Implement `errors.ts`**

```ts
// src/lib/api/errors.ts
export class ApiError extends Error {
  constructor(public code: string, public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}
```

- [ ] **Step 3: Implement `auth.ts`**

```ts
// src/lib/api/auth.ts
import "server-only";
import { NextRequest } from "next/server";
import { resolveActorFromToken } from "@/lib/db/actions/api-tokens";
import type { OsSession } from "@/lib/auth/session";

export function extractBearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.slice(7) : null;
}

export async function authenticateRequest(req: NextRequest): Promise<OsSession | null> {
  const token = extractBearer(req);
  return token ? resolveActorFromToken(token) : null;
}
```

- [ ] **Step 4: Write the failing test for `rbac.ts`**

```ts
// src/lib/api/__tests__/rbac.test.ts
import { describe, it, expect, vi } from "vitest";
vi.mock("@/lib/auth/permissions", () => ({ getModulePermission: vi.fn() }));

const admin = { userId: "u1", email: "a", name: "A", role: "admin" as const };
const team = { userId: "u2", email: "b", name: "B", role: "team" as const };

describe("assertPermission", () => {
  it("lets admins through without checking", async () => {
    const { assertPermission } = await import("../rbac");
    await expect(assertPermission(admin, "crm", "admin")).resolves.toBeUndefined();
  });
  it("throws ApiError 403 when level insufficient", async () => {
    const { getModulePermission } = await import("@/lib/auth/permissions");
    (getModulePermission as any).mockResolvedValue("read");
    const { assertPermission } = await import("../rbac");
    await expect(assertPermission(team, "crm", "write")).rejects.toMatchObject({ status: 403, code: "forbidden" });
  });
  it("allows when level sufficient", async () => {
    const { getModulePermission } = await import("@/lib/auth/permissions");
    (getModulePermission as any).mockResolvedValue("write");
    const { assertPermission } = await import("../rbac");
    await expect(assertPermission(team, "crm", "write")).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 5: Run it → FAIL.** `npx vitest run src/lib/api/__tests__/rbac.test.ts`

- [ ] **Step 6: Implement `rbac.ts`** (espeja `requireModuleAccess` pero lanza `ApiError`)

```ts
// src/lib/api/rbac.ts
import { getModulePermission } from "@/lib/auth/permissions";
import { ApiError } from "@/lib/api/errors";
import type { OsSession } from "@/lib/auth/session";

const ORDER = { none: 0, read: 1, write: 2, admin: 3 } as const;
type Level = "read" | "write" | "admin";

export async function assertPermission(session: OsSession, module: string, level: Level) {
  if (session.role === "admin") return;
  const current = await getModulePermission(session.userId, module);
  if (ORDER[current] < ORDER[level]) {
    throw new ApiError("forbidden", 403, `Sin permiso "${level}" en módulo "${module}"`);
  }
}
```

- [ ] **Step 7: Run it → PASS.**
- [ ] **Step 8: Commit**

```bash
git add src/lib/api/ratelimit.ts src/lib/api/errors.ts src/lib/api/auth.ts src/lib/api/rbac.ts src/lib/api/__tests__/rbac.test.ts
git commit -m "feat(api): add ratelimit, ApiError, request auth, and rbac guard"
```

---

### Task 6: Wrapper `authed()` (corazón de cada ruta)

**Files:**
- Create: `src/lib/api/handler.ts`
- Test: `src/lib/api/__tests__/handler.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/api/__tests__/handler.test.ts
import { describe, it, expect, vi } from "vitest";
vi.mock("@/lib/api/ratelimit", () => ({ rateLimit: vi.fn().mockResolvedValue({ ok: true }) }));
vi.mock("@/lib/api/auth", () => ({ authenticateRequest: vi.fn() }));

function reqWith(token?: string) {
  return new Request("http://x/api/v1/x", { headers: token ? { authorization: `Bearer ${token}` } : {} }) as any;
}

describe("authed wrapper", () => {
  it("returns 401 when unauthenticated", async () => {
    const { authenticateRequest } = await import("@/lib/api/auth");
    (authenticateRequest as any).mockResolvedValue(null);
    const { authed } = await import("../handler");
    const res = await authed(async () => ({ ok: true }))(reqWith(), { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("unauthorized");
  });

  it("runs handler under actor and wraps result in {data}", async () => {
    const { authenticateRequest } = await import("@/lib/api/auth");
    (authenticateRequest as any).mockResolvedValue({ userId: "u1", email: "a", name: "A", role: "admin" });
    const { authed } = await import("../handler");
    const res = await authed(async ({ session }) => ({ who: session.userId }))(reqWith("vtx_x"), { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ who: "u1" });
  });
});
```

- [ ] **Step 2: Run it → FAIL.**

- [ ] **Step 3: Implement**

```ts
// src/lib/api/handler.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { runWithActor } from "@/lib/auth/actor-context";
import { rateLimit } from "@/lib/api/ratelimit";
import { ApiError } from "@/lib/api/errors";
import type { OsSession } from "@/lib/auth/session";

type Ctx<P> = { req: NextRequest; session: OsSession; params: P };
type Handler<P> = (ctx: Ctx<P>) => Promise<unknown>;

export function authed<P = Record<string, string>>(handler: Handler<P>) {
  return async (req: NextRequest, route?: { params: Promise<P> }) => {
    try {
      if (!(await rateLimit(req)).ok) throw new ApiError("rate_limited", 429, "Demasiadas solicitudes");
      const session = await authenticateRequest(req);
      if (!session) throw new ApiError("unauthorized", 401, "Token inválido o ausente");
      const params = (route?.params ? await route.params : {}) as P;
      const data = await runWithActor(session, () => handler({ req, session, params }));
      return NextResponse.json({ data });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

function errorResponse(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: { code: e.code, message: e.message, details: e.details ?? null } }, { status: e.status });
  }
  const msg = e instanceof Error ? e.message : "Error interno";
  const status = /no encontr|not found/i.test(msg) ? 404
    : /sin permiso|insuficiente|no autorizado/i.test(msg) ? 403
    : /inválid|invalid|requerid|transición/i.test(msg) ? 400 : 500;
  return NextResponse.json({ error: { code: status === 500 ? "internal" : "error", message: msg } }, { status });
}
```

- [ ] **Step 4: Run it → PASS.**
- [ ] **Step 5: Commit**

```bash
git add src/lib/api/handler.ts src/lib/api/__tests__/handler.test.ts
git commit -m "feat(api): add authed() route wrapper (auth+rbac envelope+actor)"
```

---

### Task 7: Endpoints de auth (`login`, `whoami`, `tokens`)

**Files:**
- Create: `src/app/api/v1/auth/login/route.ts`, `src/app/api/v1/auth/whoami/route.ts`, `src/app/api/v1/auth/tokens/route.ts`, `src/app/api/v1/auth/tokens/[id]/route.ts`
- Test: `src/app/api/v1/auth/__tests__/login.test.ts`

> **Antes:** lee `src/app/api/auth/2fa/verify/route.ts` y confirma la clave del secreto 2FA en `user.preferences` (asumido `twoFactorSecret`).

- [ ] **Step 1: Write the failing test for login**

```ts
// src/app/api/v1/auth/__tests__/login.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@/lib/api/ratelimit", () => ({ rateLimit: vi.fn().mockResolvedValue({ ok: true }) }));
vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }));
vi.mock("@/lib/auth/session", () => ({ verifyPassword: vi.fn() }));
vi.mock("@/lib/db/actions/api-tokens", () => ({ createApiTokenForUser: vi.fn() }));

const post = async (body: any) => {
  const { POST } = await import("../login/route");
  return POST(new Request("http://x/api/v1/auth/login", { method: "POST", body: JSON.stringify(body) }) as any);
};
const selectUser = (u: any) => {
  const { db } = require("@/lib/db");
  (db.select as any).mockReturnValue({ from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValue(u ? [u] : []) }) }) });
};

describe("POST /api/v1/auth/login", () => {
  beforeEach(() => vi.clearAllMocks());
  it("401 on bad credentials", async () => {
    selectUser({ id: "u1", passwordHash: "h", isActive: true, preferences: {} });
    const { verifyPassword } = await import("@/lib/auth/session");
    (verifyPassword as any).mockResolvedValue(false);
    const res = await post({ email: "a@b.c", password: "x" });
    expect(res.status).toBe(401);
  });
  it("mints a token on success", async () => {
    selectUser({ id: "u1", email: "a@b.c", name: "A", role: "admin", passwordHash: "h", isActive: true, preferences: {} });
    const { verifyPassword } = await import("@/lib/auth/session");
    (verifyPassword as any).mockResolvedValue(true);
    const { createApiTokenForUser } = await import("@/lib/db/actions/api-tokens");
    (createApiTokenForUser as any).mockResolvedValue({ token: "vtx_abc", record: { id: "t1" } });
    const res = await post({ email: "a@b.c", password: "ok" });
    expect(res.status).toBe(200);
    expect((await res.json()).data.token).toBe("vtx_abc");
  });
});
```

- [ ] **Step 2: Run it → FAIL.**

- [ ] **Step 3: Implement `login/route.ts`**

```ts
// src/app/api/v1/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/session";
import { verifyTwoFactorToken } from "@/lib/auth/two-factor";
import { createApiTokenForUser } from "@/lib/db/actions/api-tokens";
import { rateLimit } from "@/lib/api/ratelimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req)).ok) return NextResponse.json({ error: { code: "rate_limited", message: "Demasiadas solicitudes" } }, { status: 429 });
  const body = await req.json().catch(() => null);
  const email = body?.email, password = body?.password, otp = body?.otp, tokenName = body?.tokenName;
  if (!email || !password) return NextResponse.json({ error: { code: "bad_request", message: "email y password requeridos" } }, { status: 400 });

  const [user] = await db.select().from(users).where(and(eq(users.email, email), eq(users.isActive, true))).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: { code: "invalid_credentials", message: "Credenciales inválidas" } }, { status: 401 });
  }
  const prefs = (user.preferences ?? {}) as Record<string, any>;
  if (prefs.twoFactorEnabled) {
    if (!otp) return NextResponse.json({ data: { twoFactorRequired: true } });
    const secret = prefs.twoFactorSecret; // CONFIRMAR clave exacta en 2fa/verify/route.ts
    if (!secret || !verifyTwoFactorToken(secret, otp)) {
      return NextResponse.json({ error: { code: "invalid_otp", message: "Código 2FA inválido" } }, { status: 401 });
    }
  }
  const { token, record } = await createApiTokenForUser(user.id, tokenName || "vertrex-cli");
  return NextResponse.json({ data: { token, tokenId: record.id, user: { id: user.id, email: user.email, name: user.name, role: user.role } } });
}
```

- [ ] **Step 4: Implement `whoami/route.ts`**

```ts
// src/app/api/v1/auth/whoami/route.ts
import { authed } from "@/lib/api/handler";
import { getUserModulePermissions } from "@/lib/auth/permissions";
export const runtime = "nodejs";
export const GET = authed(async ({ session }) => ({
  user: session,
  permissions: await getUserModulePermissions(session.userId),
}));
```

- [ ] **Step 5: Implement `tokens/route.ts` y `tokens/[id]/route.ts`**

```ts
// src/app/api/v1/auth/tokens/route.ts
import { authed } from "@/lib/api/handler";
import { listApiTokensForUser, createApiTokenForUser } from "@/lib/db/actions/api-tokens";
export const runtime = "nodejs";
export const GET = authed(async ({ session }) => listApiTokensForUser(session.userId));
export const POST = authed(async ({ req, session }) => {
  const body = await req.json().catch(() => ({}));
  const { token, record } = await createApiTokenForUser(session.userId, body?.name || "token", body?.expiresAt ? new Date(body.expiresAt) : undefined);
  return { token, id: record.id, name: record.name };
});
```

```ts
// src/app/api/v1/auth/tokens/[id]/route.ts
import { authed } from "@/lib/api/handler";
import { revokeApiToken } from "@/lib/db/actions/api-tokens";
export const runtime = "nodejs";
export const DELETE = authed<{ id: string }>(async ({ session, params }) => {
  await revokeApiToken(session.userId, params.id);
  return { revoked: params.id };
});
```

- [ ] **Step 6: Run tests → PASS.** `npx vitest run src/app/api/v1/auth`
- [ ] **Step 7: Commit**

```bash
git add src/app/api/v1/auth
git commit -m "feat(api): v1 auth endpoints (login+2FA, whoami, token CRUD)"
```

---

### Task 8: Scaffold del CLI (oclif) + workspace

**Files:**
- Create: `cli/package.json`, `cli/tsconfig.json`, `cli/bin/run.js`, `cli/src/commands/whoami.ts` (humo)
- Modify: `package.json` raíz (añadir `workspaces`)

- [ ] **Step 1: Create `cli/package.json`**

```json
{
  "name": "@vertrex/cli",
  "version": "0.1.0",
  "description": "CLI para operar Vertrex OS (humanos y agentes)",
  "bin": { "vertrex": "./bin/run.js" },
  "type": "module",
  "files": ["bin", "dist", "oclif.manifest.json"],
  "dependencies": {
    "@oclif/core": "^4",
    "yaml": "^2"
  },
  "devDependencies": {
    "oclif": "^4",
    "typescript": "^5",
    "@types/node": "^20"
  },
  "oclif": {
    "bin": "vertrex",
    "dirname": "vertrex",
    "commands": "./dist/commands",
    "topicSeparator": " "
  },
  "scripts": {
    "build": "tsc -b",
    "postpack": "oclif manifest",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: Create `cli/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "Node16", "moduleResolution": "Node16",
    "outDir": "dist", "rootDir": "src", "strict": true, "declaration": true,
    "esModuleInterop": true, "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create `cli/bin/run.js`**

```js
#!/usr/bin/env node
import { execute } from "@oclif/core";
await execute({ dir: import.meta.url });
```

- [ ] **Step 4: Add workspace to root `package.json`**

Añade (no rompe Next; `cli/` está fuera de `src/`):

```json
"workspaces": ["cli"],
```

- [ ] **Step 5: Install + smoke**

```bash
npm install
cd cli && npm run build && ./bin/run.js --help
```
Expected: ayuda de oclif lista (aún sin comandos reales).

- [ ] **Step 6: Verify Next build unaffected**

Run (en raíz): `npm run build`
Expected: build de Next OK (ignora `cli/`).

- [ ] **Step 7: Commit**

```bash
git add cli package.json package-lock.json
git commit -m "feat(cli): scaffold @vertrex/cli (oclif) as npm workspace"
```

---

### Task 9: Núcleo del CLI — config, client, output

**Files:**
- Create: `cli/src/lib/config.ts`, `cli/src/lib/client.ts`, `cli/src/lib/output.ts`
- Test: `cli/src/lib/__tests__/output.test.ts` (Vitest en el workspace cli)

- [ ] **Step 1: Implement `config.ts`** (credenciales en `~/.config/vertrex/credentials.json`, modo 600)

```ts
// cli/src/lib/config.ts
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";

const dir = process.env.VERTREX_CONFIG_DIR || join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "vertrex");
const file = join(dir, "credentials.json");

export type Profile = { apiUrl: string; token: string; user?: { id: string; email: string; name: string; role: string } };
type Store = { profiles: Record<string, Profile> };

function read(): Store { try { return JSON.parse(readFileSync(file, "utf8")); } catch { return { profiles: {} }; } }
function write(s: Store) { mkdirSync(dir, { recursive: true }); writeFileSync(file, JSON.stringify(s, null, 2)); chmodSync(file, 0o600); }

export function saveProfile(name: string, p: Profile) { const s = read(); s.profiles[name] = p; write(s); }
export function getProfile(name = process.env.VERTREX_PROFILE || "default"): Profile | null { return read().profiles[name] ?? null; }
export function deleteProfile(name = "default") { const s = read(); delete s.profiles[name]; write(s); }
export const defaultApiUrl = process.env.VERTREX_API_URL || "http://localhost:3000";
```

- [ ] **Step 2: Implement `client.ts`** (envelope + exit codes sysexits)

```ts
// cli/src/lib/client.ts
import { getProfile, defaultApiUrl } from "./config";

export class CliError extends Error { constructor(message: string, public exitCode = 1) { super(message); } }

export async function api<T = unknown>(method: string, path: string, opts: { body?: unknown; profile?: string; apiUrl?: string; token?: string } = {}): Promise<T> {
  const prof = getProfile(opts.profile);
  const apiUrl = opts.apiUrl || prof?.apiUrl || defaultApiUrl;
  const token = opts.token ?? prof?.token;
  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = json?.error?.code, msg = json?.error?.message || res.statusText;
    const exit = res.status === 401 || res.status === 403 ? 77 /*EX_NOPERM*/ : res.status === 404 ? 69 /*EX_UNAVAILABLE*/ : res.status >= 500 ? 70 /*EX_SOFTWARE*/ : 65 /*EX_DATAERR*/;
    throw new CliError(`${code ? `[${code}] ` : ""}${msg}`, exit);
  }
  return json.data as T;
}
```

- [ ] **Step 3: Write failing test for `output.ts`**

```ts
// cli/src/lib/__tests__/output.test.ts
import { describe, it, expect } from "vitest";
import { format } from "../output";
describe("format", () => {
  it("json", () => expect(format([{ a: 1 }], "json")).toContain('"a": 1'));
  it("csv header", () => expect(format([{ a: 1, b: 2 }], "csv").split("\n")[0]).toBe("a,b"));
  it("table includes value", () => expect(format([{ a: "x" }], "table")).toContain("x"));
});
```

- [ ] **Step 4: Run it → FAIL.** `cd cli && npx vitest run src/lib/__tests__/output.test.ts`

- [ ] **Step 5: Implement `output.ts`**

```ts
// cli/src/lib/output.ts
import { stringify as toYaml } from "yaml";
export type Fmt = "table" | "json" | "yaml" | "csv";

export function format(data: unknown, fmt: Fmt): string {
  if (fmt === "json") return JSON.stringify(data, null, 2);
  if (fmt === "yaml") return toYaml(data);
  const rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0) return "(sin resultados)";
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r ?? {}))));
  if (fmt === "csv") return [cols.join(","), ...rows.map((r: any) => cols.map((c) => csv(r?.[c])).join(","))].join("\n");
  const w = cols.map((c) => Math.max(c.length, ...rows.map((r: any) => String(r?.[c] ?? "").length)));
  const line = (cells: string[]) => cells.map((s, i) => s.padEnd(w[i])).join("  ");
  return [line(cols), line(w.map((n) => "-".repeat(n))), ...rows.map((r: any) => line(cols.map((c) => String(r?.[c] ?? ""))))].join("\n");
}
function csv(v: unknown) { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
```

- [ ] **Step 6: Run it → PASS.**
- [ ] **Step 7: Commit**

```bash
git add cli/src/lib
git commit -m "feat(cli): config store, api client, output formatters"
```

---

### Task 10: Comandos de auth del CLI (`login`, `logout`, `whoami`)

**Files:**
- Create: `cli/src/commands/login.ts`, `cli/src/commands/logout.ts`, `cli/src/commands/whoami.ts`, `cli/src/lib/base.ts`

- [ ] **Step 1: Base command con flags globales**

```ts
// cli/src/lib/base.ts
import { Command, Flags } from "@oclif/core";
import { format, Fmt } from "./output";
export abstract class BaseCommand extends Command {
  static baseFlags = {
    format: Flags.string({ options: ["table", "json", "yaml", "csv"], default: "table" }),
    json: Flags.boolean({ description: "atajo de --format json" }),
    profile: Flags.string({ description: "perfil de credenciales" }),
    "api-url": Flags.string({ description: "URL base de la API" }),
    yes: Flags.boolean({ char: "y", description: "confirmar operaciones destructivas" }),
    "dry-run": Flags.boolean({ description: "mostrar sin ejecutar" }),
  };
  print(data: unknown, fmt: string, json: boolean) { this.log(format(data, (json ? "json" : fmt) as Fmt)); }
}
```

- [ ] **Step 2: `login.ts`**

```ts
// cli/src/commands/login.ts
import { Flags, ux } from "@oclif/core";
import { BaseCommand } from "../lib/base";
import { api } from "../lib/client";
import { saveProfile, defaultApiUrl } from "../lib/config";

export default class Login extends BaseCommand {
  static description = "Iniciar sesión y guardar un token personal";
  static flags = { email: Flags.string({}), "api-url": Flags.string({}), profile: Flags.string({ default: "default" }) };
  async run() {
    const { flags } = await this.parse(Login);
    const apiUrl = flags["api-url"] || defaultApiUrl;
    const email = flags.email || (await ux.prompt("Email"));
    const password = await ux.prompt("Password", { type: "hide" });
    let res: any = await api("POST", "/api/v1/auth/login", { apiUrl, token: "", body: { email, password } });
    if (res?.twoFactorRequired) {
      const otp = await ux.prompt("Código 2FA");
      res = await api("POST", "/api/v1/auth/login", { apiUrl, token: "", body: { email, password, otp } });
    }
    saveProfile(flags.profile!, { apiUrl, token: res.token, user: res.user });
    this.log(`✓ Sesión iniciada como ${res.user.email} (${res.user.role}). Token guardado en perfil "${flags.profile}".`);
  }
}
```

- [ ] **Step 3: `whoami.ts` y `logout.ts`**

```ts
// cli/src/commands/whoami.ts
import { BaseCommand } from "../lib/base";
import { api } from "../lib/client";
export default class Whoami extends BaseCommand {
  static description = "Mostrar el usuario autenticado y sus permisos";
  static flags = { ...BaseCommand.baseFlags };
  async run() {
    const { flags } = await this.parse(Whoami);
    const data = await api("GET", "/api/v1/auth/whoami", { profile: flags.profile });
    this.print(data, flags.format, flags.json);
  }
}
```

```ts
// cli/src/commands/logout.ts
import { BaseCommand } from "../lib/base";
import { deleteProfile } from "../lib/config";
export default class Logout extends BaseCommand {
  static description = "Borrar las credenciales locales";
  static flags = { profile: BaseCommand.baseFlags.profile };
  async run() { const { flags } = await this.parse(Logout); deleteProfile(flags.profile || "default"); this.log("✓ Sesión cerrada."); }
}
```

- [ ] **Step 4: Build + manual e2e contra dev server**

```bash
cd cli && npm run build
# en otra terminal: npm run dev (raíz)
./bin/run.js login --email <admin@correo>   # usa SEED_ADMIN_*
./bin/run.js whoami --json
```
Expected: login guarda token; `whoami` imprime el usuario y permisos.

- [ ] **Step 5: Commit**

```bash
git add cli/src
git commit -m "feat(cli): login, logout, whoami commands"
```

**✅ Definición de hecho — Fase 0:** un usuario puede `vertrex login` (con 2FA si aplica) y `vertrex whoami`; la API valida PAT, aplica el envelope `{data}`/`{error}` y ejecuta bajo el actor. Tests verdes.

---

# FASE 1 — Recursos del MVP + capa de agente

> Las rutas de recurso siguen DOS patrones (definidos una vez aquí). Cada recurso posterior indica solo sus *sustituciones* concretas — el agente ejecutor aplica el patrón. Esto es intencional (DRY/legibilidad); el código del patrón está completo abajo.

### Patrón A — acción con objeto tipado (ej. tasks)
```ts
export const POST = authed(async ({ req, session }) => {
  await assertPermission(session, "<module>", "write");
  const input = <zodSchema>.parse(await req.json());
  return <createXAction>(input);   // corre bajo runWithActor → requireOsUser = session
});
```
### Patrón B — acción con `FormData` (ej. projects/clients/agenda/notes)
```ts
export const POST = authed(async ({ req, session }) => {
  await assertPermission(session, "<module>", "write");
  const input = <zodSchema>.parse(await req.json());
  return <createXAction>(jsonToFormData(input));
});
```
### Patrón C — lectura sin acción (query directo)
```ts
export const GET = authed(async ({ req, session }) => {
  await assertPermission(session, "<module>", "read");
  // db.select().from(<table>).where(<filtros de searchParams>)...
});
```

---

### Task 11: Helper `jsonToFormData` + esquemas zod base

**Files:**
- Create: `src/lib/api/form.ts`, `src/lib/validation/v1/tasks.ts`
- Test: `src/lib/api/__tests__/form.test.ts`

- [ ] **Step 1: Test → FAIL**

```ts
// src/lib/api/__tests__/form.test.ts
import { describe, it, expect } from "vitest";
import { jsonToFormData } from "../form";
describe("jsonToFormData", () => {
  it("maps primitives and skips undefined", () => {
    const fd = jsonToFormData({ name: "X", n: 3, skip: undefined });
    expect(fd.get("name")).toBe("X"); expect(fd.get("n")).toBe("3"); expect(fd.has("skip")).toBe(false);
  });
});
```

- [ ] **Step 2: Implement `form.ts`**

```ts
// src/lib/api/form.ts
export function jsonToFormData(obj: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    fd.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  return fd;
}
```

- [ ] **Step 3: Implement zod schema de tasks**

```ts
// src/lib/validation/v1/tasks.ts
import { z } from "zod";
export const createTaskSchema = z.object({
  title: z.string().min(1),
  projectId: z.string().uuid().optional(),
  parentTaskId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  priority: z.number().int().min(0).max(4).optional(),
  cycleId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  taskType: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  state: z.string().optional(),
});
export const updateTaskSchema = createTaskSchema.partial();
```

- [ ] **Step 4: Run form test → PASS.** Commit.

```bash
git add src/lib/api/form.ts src/lib/api/__tests__/form.test.ts src/lib/validation/v1/tasks.ts
git commit -m "feat(api): jsonToFormData helper + v1 task zod schemas"
```

---

### Task 12: Recurso `task` — rutas API (referencia completa del Patrón A)

**Files:**
- Create: `src/app/api/v1/tasks/route.ts`, `tasks/[id]/route.ts`, `tasks/[id]/state/route.ts`, `tasks/[id]/assign/route.ts`, `tasks/[id]/move/route.ts`, `tasks/[id]/subtasks/route.ts`, `tasks/[id]/block/route.ts`
- Test: `src/app/api/v1/tasks/__tests__/tasks.route.test.ts`

> Módulo RBAC asumido: `"projects"`. Acciones reutilizadas (de `src/lib/db/actions/tasks.ts`): `listTasksAction`, `createTaskAction`, `getTaskDetailAction`, `updateTaskAction`, `deleteTaskAction`, `changeTaskStateAction`, `assignTaskAction`, `moveTaskToProjectAction`, `createSubtaskAction`, `linkTaskBlocksAction`, `unlinkTaskBlocksAction`.

- [ ] **Step 1: Write failing test (create + list)**

```ts
// src/app/api/v1/tasks/__tests__/tasks.route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@/lib/api/ratelimit", () => ({ rateLimit: vi.fn().mockResolvedValue({ ok: true }) }));
vi.mock("@/lib/api/auth", () => ({ authenticateRequest: vi.fn().mockResolvedValue({ userId: "u1", email: "a", name: "A", role: "admin" }) }));
vi.mock("@/lib/db/actions/tasks", () => ({ createTaskAction: vi.fn(), listTasksAction: vi.fn() }));

const call = async (mod: string, method: string, body?: any) => {
  const r = await import(mod);
  const req = new Request("http://x/api/v1/tasks", { method, body: body ? JSON.stringify(body) : undefined }) as any;
  return (r as any)[method](req, { params: Promise.resolve({}) });
};

describe("POST/GET /api/v1/tasks", () => {
  beforeEach(() => vi.clearAllMocks());
  it("creates a task", async () => {
    const { createTaskAction } = await import("@/lib/db/actions/tasks");
    (createTaskAction as any).mockResolvedValue({ id: "t1", title: "X" });
    const res = await call("../route", "POST", { title: "X" });
    expect(res.status).toBe(200);
    expect((await res.json()).data).toMatchObject({ id: "t1" });
  });
  it("400 on invalid body", async () => {
    const res = await call("../route", "POST", { title: "" });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `tasks/route.ts`**

```ts
// src/app/api/v1/tasks/route.ts
import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { createTaskAction, listTasksAction } from "@/lib/db/actions/tasks";
import { createTaskSchema } from "@/lib/validation/v1/tasks";
import { ApiError } from "@/lib/api/errors";
export const runtime = "nodejs";

export const GET = authed(async ({ req, session }) => {
  await assertPermission(session, "projects", "read");
  const projectId = new URL(req.url).searchParams.get("project") || undefined;
  return listTasksAction(projectId);
});

export const POST = authed(async ({ req, session }) => {
  await assertPermission(session, "projects", "write");
  const parsed = createTaskSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError("bad_request", 400, "Datos inválidos", parsed.error.flatten());
  return createTaskAction(parsed.data);
});
```

- [ ] **Step 4: Implement `tasks/[id]/route.ts`**

```ts
// src/app/api/v1/tasks/[id]/route.ts
import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { getTaskDetailAction, updateTaskAction, deleteTaskAction } from "@/lib/db/actions/tasks";
import { updateTaskSchema } from "@/lib/validation/v1/tasks";
import { ApiError } from "@/lib/api/errors";
export const runtime = "nodejs";

export const GET = authed<{ id: string }>(async ({ session, params }) => {
  await assertPermission(session, "projects", "read");
  const task = await getTaskDetailAction(params.id);
  if (!task) throw new ApiError("not_found", 404, "Tarea no encontrada");
  return task;
});
export const PATCH = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "projects", "write");
  const parsed = updateTaskSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError("bad_request", 400, "Datos inválidos", parsed.error.flatten());
  const patch: any = { ...parsed.data };
  if (patch.dueDate) patch.dueDate = new Date(patch.dueDate);
  return updateTaskAction(params.id, patch);
});
export const DELETE = authed<{ id: string }>(async ({ session, params }) => {
  await assertPermission(session, "projects", "write");
  await deleteTaskAction(params.id);
  return { deleted: params.id };
});
```

- [ ] **Step 5: Implement sub-rutas (`state`, `assign`, `move`, `subtasks`, `block`)**

```ts
// src/app/api/v1/tasks/[id]/state/route.ts
import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { changeTaskStateAction } from "@/lib/db/actions/tasks";
import { ApiError } from "@/lib/api/errors";
export const runtime = "nodejs";
export const POST = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "projects", "write");
  const { state } = await req.json().catch(() => ({}));
  if (!state) throw new ApiError("bad_request", 400, "state requerido");
  return changeTaskStateAction(params.id, state);
});
```
```ts
// src/app/api/v1/tasks/[id]/assign/route.ts
import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { assignTaskAction } from "@/lib/db/actions/tasks";
export const runtime = "nodejs";
export const POST = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "projects", "write");
  const { assigneeId } = await req.json().catch(() => ({}));
  return assignTaskAction(params.id, assigneeId ?? null);
});
```
```ts
// src/app/api/v1/tasks/[id]/move/route.ts
import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { moveTaskToProjectAction } from "@/lib/db/actions/tasks";
import { ApiError } from "@/lib/api/errors";
export const runtime = "nodejs";
export const POST = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "projects", "write");
  const { projectId, cycleId, milestoneId } = await req.json().catch(() => ({}));
  if (!projectId) throw new ApiError("bad_request", 400, "projectId requerido");
  return moveTaskToProjectAction(params.id, projectId, cycleId, milestoneId);
});
```
```ts
// src/app/api/v1/tasks/[id]/subtasks/route.ts
import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { createSubtaskAction } from "@/lib/db/actions/tasks";
import { ApiError } from "@/lib/api/errors";
export const runtime = "nodejs";
export const POST = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "projects", "write");
  const { title } = await req.json().catch(() => ({}));
  if (!title) throw new ApiError("bad_request", 400, "title requerido");
  return createSubtaskAction(params.id, title);
});
```
```ts
// src/app/api/v1/tasks/[id]/block/route.ts
import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { linkTaskBlocksAction, unlinkTaskBlocksAction } from "@/lib/db/actions/tasks";
import { ApiError } from "@/lib/api/errors";
export const runtime = "nodejs";
export const POST = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "projects", "write");
  const { on } = await req.json().catch(() => ({}));
  if (!on) throw new ApiError("bad_request", 400, "'on' (id de la tarea bloqueada) requerido");
  await linkTaskBlocksAction(params.id, on);
  return { from: params.id, blocks: on };
});
export const DELETE = authed<{ id: string }>(async ({ req, session }) => {
  await assertPermission(session, "projects", "write");
  const linkId = new URL(req.url).searchParams.get("linkId");
  if (!linkId) throw new ApiError("bad_request", 400, "linkId requerido");
  await unlinkTaskBlocksAction(linkId);
  return { unlinked: linkId };
});
```

- [ ] **Step 6: Run tests → PASS.** `npx vitest run src/app/api/v1/tasks`
- [ ] **Step 7: Commit**

```bash
git add src/app/api/v1/tasks
git commit -m "feat(api): v1 tasks endpoints (CRUD + state/assign/move/subtask/block)"
```

---

### Task 13: Recurso `task` — comandos CLI (referencia completa)

**Files:**
- Create: `cli/src/commands/task/{list,get,create,update,state,assign,move,subtask,delete}.ts`

- [ ] **Step 1: `task/list.ts` y `task/create.ts` (plantilla)**

```ts
// cli/src/commands/task/list.ts
import { Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base";
import { api } from "../../lib/client";
export default class TaskList extends BaseCommand {
  static description = "Listar tareas";
  static flags = { ...BaseCommand.baseFlags, project: Flags.string({ description: "filtrar por projectId" }) };
  async run() {
    const { flags } = await this.parse(TaskList);
    const qs = flags.project ? `?project=${encodeURIComponent(flags.project)}` : "";
    const data = await api("GET", `/api/v1/tasks${qs}`, { profile: flags.profile, apiUrl: flags["api-url"] });
    this.print(data, flags.format, flags.json);
  }
}
```
```ts
// cli/src/commands/task/create.ts
import { Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base";
import { api } from "../../lib/client";
export default class TaskCreate extends BaseCommand {
  static description = "Crear una tarea";
  static flags = {
    ...BaseCommand.baseFlags,
    title: Flags.string({ required: true }),
    project: Flags.string({}), assignee: Flags.string({}),
    priority: Flags.integer({}), due: Flags.string({ description: "ISO date" }),
    parent: Flags.string({}),
  };
  async run() {
    const { flags } = await this.parse(TaskCreate);
    const body = { title: flags.title, projectId: flags.project, assigneeId: flags.assignee, priority: flags.priority, dueDate: flags.due, parentTaskId: flags.parent };
    if (flags["dry-run"]) return this.print({ wouldPOST: "/api/v1/tasks", body }, flags.format, flags.json);
    const data = await api("POST", "/api/v1/tasks", { body, profile: flags.profile, apiUrl: flags["api-url"] });
    this.print(data, flags.format, flags.json);
  }
}
```

- [ ] **Step 2: `task/get.ts`, `task/update.ts`, `task/delete.ts`**

```ts
// cli/src/commands/task/get.ts
import { Args } from "@oclif/core";
import { BaseCommand } from "../../lib/base";
import { api } from "../../lib/client";
export default class TaskGet extends BaseCommand {
  static args = { id: Args.string({ required: true }) };
  static flags = { ...BaseCommand.baseFlags };
  async run() {
    const { args, flags } = await this.parse(TaskGet);
    this.print(await api("GET", `/api/v1/tasks/${args.id}`, { profile: flags.profile }), flags.format, flags.json);
  }
}
```
```ts
// cli/src/commands/task/delete.ts
import { Args } from "@oclif/core";
import { BaseCommand } from "../../lib/base";
import { api, CliError } from "../../lib/client";
export default class TaskDelete extends BaseCommand {
  static args = { id: Args.string({ required: true }) };
  static flags = { ...BaseCommand.baseFlags };
  async run() {
    const { args, flags } = await this.parse(TaskDelete);
    if (!flags.yes && !flags["dry-run"]) throw new CliError("Operación destructiva: re-ejecuta con --yes", 64);
    if (flags["dry-run"]) return this.print({ wouldDELETE: `/api/v1/tasks/${args.id}` }, flags.format, flags.json);
    this.print(await api("DELETE", `/api/v1/tasks/${args.id}`, { profile: flags.profile }), flags.format, flags.json);
  }
}
```
> `task/update.ts` espeja `create` con `PATCH /api/v1/tasks/:id`. `task/state.ts` → `POST .../state {state}`; `task/assign.ts` → `POST .../assign {assigneeId}`; `task/move.ts` → `POST .../move {projectId,cycleId,milestoneId}`; `task/subtask.ts` → `POST .../subtasks {title}`. Cada uno usa `Args`/`Flags` análogos y `api(...)`.

- [ ] **Step 3: Build + e2e manual**

```bash
cd cli && npm run build
./bin/run.js task create --title "Probar CLI" --json
./bin/run.js task list
```
Expected: crea y lista la tarea.

- [ ] **Step 4: Commit**

```bash
git add cli/src/commands/task
git commit -m "feat(cli): task commands (list/get/create/update/state/assign/move/subtask/delete)"
```

---

### Task 14: Recursos `project`, `client`, `agenda`, `note`

> Aplica Patrón A/B (write) + Patrón C (read). Crea `src/lib/validation/v1/<recurso>.ts` con un zod mínimo por recurso (campos del schema correspondiente). Crea comandos CLI espejo (`<recurso> list|get|create|update|delete`). Un commit por recurso.

**Tabla de implementación (exacta):**

| Recurso | Módulo RBAC | Crear (write) | Actualizar | Leer/Get | Listar (Patrón C, tabla) |
|---|---|---|---|---|---|
| `project` | `projects` | `createProjectAction(FormData)` (B) | `updateProjectAction(id, data)` (A) | `getProjectById(id)` | `db.select().from(projects)` |
| `client` | `crm` | `createClientAction(FormData)` (B) | `updateClientAction(slug, FormData)` (B) | `getClientBySlug(slug)` | `db.select().from(clients)` |
| `agenda` | `agenda` | `createAgendaEventAction(FormData)` (B) | `updateAgendaEventAction(id, FormData)` (B) | `db.select…where(eq(id))` | `db.select().from(agendaEvents)` (filtros `from`/`to` sobre `startsAt`) |
| `note` | `hub` | `createKnowledgeNote(FormData)` (B) | `saveKnowledgeNote(id, input)` (A) | `getKnowledgeNoteById(id)` | `db.select().from(knowledgeNotes)` |

**Rutas a crear por recurso:** `src/app/api/v1/<recurso>/route.ts` (GET list + POST create), `src/app/api/v1/<recurso>/[id]/route.ts` (GET + PATCH + DELETE).
- DELETE: `project`/`agenda`/`note` → `db.delete(<table>).where(eq(<table>.id, id))` dentro de la ruta (no hay acción de borrado dedicada salvo `bulkDeleteClientsAction` para clientes → úsala con `[id]`).
- `client` usa `slug` como identificador público; acepta id o slug en `[id]` (resuelve por slug con `getClientBySlug`, y si no, por `clients.id`).

**Pasos por recurso (repetir 4 veces):**
- [ ] Crear zod schema `src/lib/validation/v1/<recurso>.ts`.
- [ ] Escribir test de ruta (copiar el de tasks, sustituir mocks por la acción del recurso) → FAIL.
- [ ] Implementar `route.ts` y `[id]/route.ts` con Patrón A/B/C según la tabla.
- [ ] Crear comandos CLI `cli/src/commands/<recurso>/{list,get,create,update,delete}.ts` (espejo de `task/*`).
- [ ] `npx vitest run src/app/api/v1/<recurso>` → PASS; `cd cli && npm run build`.
- [ ] Commit: `feat(api+cli): <recurso> endpoints and commands`.

> **Ejemplo Patrón B (create project):**
> ```ts
> export const POST = authed(async ({ req, session }) => {
>   await assertPermission(session, "projects", "write");
>   const input = createProjectSchema.parse(await req.json());
>   return createProjectAction(jsonToFormData(input));
> });
> ```

---

### Task 15: Recursos de lectura `activity` y `search`

**Files:**
- Create: `src/app/api/v1/activity/route.ts`, `src/app/api/v1/search/route.ts`
- Create: `cli/src/commands/activity/list.ts`, `cli/src/commands/search.ts`

- [ ] **Step 1: `activity/route.ts`** (Patrón C — no hay acción)

```ts
// src/app/api/v1/activity/route.ts
import { authed } from "@/lib/api/handler";
import { db } from "@/lib/db";
import { activity } from "@/lib/db/schema";
import { desc, gt, and, eq } from "drizzle-orm";
export const runtime = "nodejs";
export const GET = authed(async ({ req }) => {
  const sp = new URL(req.url).searchParams;
  const since = sp.get("since") ? new Date(sp.get("since")!) : new Date(Date.now() - 7 * 864e5);
  const targetType = sp.get("entity");
  const where = targetType ? and(gt(activity.createdAt, since), eq(activity.targetType, targetType as any)) : gt(activity.createdAt, since);
  return db.select().from(activity).where(where).orderBy(desc(activity.createdAt)).limit(200);
});
```

- [ ] **Step 2: `search/route.ts`** (reusa `searchEntitiesAction`)

```ts
// src/app/api/v1/search/route.ts
import { authed } from "@/lib/api/handler";
import { searchEntitiesAction } from "@/lib/db/actions/search";
import { ApiError } from "@/lib/api/errors";
export const runtime = "nodejs";
export const GET = authed(async ({ req }) => {
  const q = new URL(req.url).searchParams.get("q");
  if (!q) throw new ApiError("bad_request", 400, "parámetro q requerido");
  return searchEntitiesAction(q);
});
```

- [ ] **Step 3: comandos CLI** `activity list [--since --entity]` y `search "<q>"` (espejo de `task/list`, ruta `/api/v1/activity` y `/api/v1/search?q=`).

- [ ] **Step 4: Tests de ruta → PASS; build CLI.**
- [ ] **Step 5: Commit** `feat(api+cli): activity and search (read-only)`

---

### Task 16: `intent` + comando `vertrex do`

> Reemplaza el stub 501 de `/api/mcp/intent`. MVP **conservador**: por defecto devuelve un *plan* (dry-run) y solo ejecuta con confirmación. Usa el SDK `openai` (ya en dependencias) con function-calling acotado a las acciones del MVP, o un parser de reglas si se prefiere sin coste de IA.

**Files:**
- Create: `src/app/api/v1/intent/route.ts`, `cli/src/commands/do.ts`

- [ ] **Step 1: `intent/route.ts`** — recibe `{ intent, execute?: boolean }`, autentica con `authed`, mapea a una de las acciones MVP (`create_task`, `change_state`, `assign_task`, `create_note`, `search`). Si `execute` es falso → responde `{ plan: { action, args } }` sin ejecutar. Si `true` → ejecuta la acción correspondiente (las mismas del action-layer, ya bajo `runWithActor`) y responde el resultado. Valida la acción propuesta contra una allowlist antes de ejecutar.

- [ ] **Step 2: `do.ts`** — `vertrex do "<texto>"`: por defecto muestra el plan (dry-run); con `--yes` añade `execute:true`. Imprime el plan/resultado.

- [ ] **Step 3: Test** del mapeo (mock del cliente OpenAI → acción esperada; verificar que sin `execute` no llama la acción). PASS.
- [ ] **Step 4: Commit** `feat(api+cli): natural-language intent endpoint and 'vertrex do'`

---

### Task 17: Catálogo de comandos + OpenAPI + `AGENT.md`

**Files:**
- Create: `src/app/api/v1/commands/route.ts`, `cli/src/commands/commands.ts`, `cli/AGENT.md`, `cli/README.md`
- (Opcional) `docs/openapi/vertrex.json` vía `@asteasolutions/zod-to-openapi`.

- [ ] **Step 1: `cli/src/commands/commands.ts`** — imprime el catálogo desde el manifiesto de oclif (`this.config.commands` → `{id, description, flags, args}`); con `--json` salida legible por máquina.
- [ ] **Step 2: `/api/v1/commands/route.ts`** — devuelve el OpenAPI/catálogo de endpoints (estático generado o derivado de los zod). Público o con `authed` (decidir; recomendado `authed`).
- [ ] **Step 3: `cli/AGENT.md`** — guía para agentes:
  - cómo autenticar (cuenta de servicio + PAT en `VERTREX_API_URL`/perfil),
  - convención `vertrex <recurso> <acción> --json`,
  - **reglas de seguridad** (usar `--dry-run`; destructivo requiere `--yes`; respeta permisos; toda mutación se audita),
  - 5–8 flujos de ejemplo (crear tarea, mover a proyecto, listar clientes, buscar, registrar nota).
- [ ] **Step 4: Commit** `feat(cli): commands catalog, OpenAPI scaffold, AGENT.md`

---

### Task 18: Skill de Claude `vertrex-os`

**Files:**
- Create: `.claude/skills/vertrex-os/SKILL.md`

- [ ] **Step 1:** Frontmatter con `name: vertrex-os` y `description:` que dispare cuando el usuario quiera consultar/editar Vertrex OS o "organizar la empresa". Cuerpo: cómo invocar el CLI (`vertrex ...`), cuándo usar `--json`, los recursos disponibles, las reglas de seguridad, y 3–5 recetas. Apunta a `cli/AGENT.md` como referencia.
- [ ] **Step 2: Commit** `feat(skills): add vertrex-os Claude skill wrapping the CLI`

---

### Task 19: Verificación final (Fase 1)

- [ ] **Step 1:** `npm run typecheck`
- [ ] **Step 2:** `npm run lint`
- [ ] **Step 3:** `npx vitest run`
- [ ] **Step 4:** `npm run build`
- [ ] **Step 5:** `cd cli && npm run build && ./bin/run.js commands --json`
- [ ] **Step 6: e2e humo** (dev server arriba): `login` → `task create` → `task list` → `search` → `whoami` → revoca token → confirma 401.
- [ ] **Step 7: Commit** `chore: green typecheck/lint/test/build for vertrex CLI MVP`

**✅ Definición de hecho — MVP:** una cuenta de servicio puede, solo con el CLI y respetando permisos, autenticarse y gestionar tareas/proyectos/clientes/agenda/notas, buscar y leer actividad, con toda mutación auditada en `activity`, y descubrir todos los comandos vía `vertrex commands --json`. `typecheck`, `lint`, `vitest` y `build` en verde.

---

## Self-review (hecho por el autor del plan)

**1. Cobertura del spec:**
- Componente A (API v1): T1, T5–T7, T11–T17 ✔ · Componente B (CLI): T8–T10, T13–T17 ✔ · Componente C (descubribilidad): T16–T18 ✔
- Auth multiusuario/PAT/2FA/RBAC/audit: T1–T7 ✔ · Seguridad escritura (dry-run/--yes/audit/rate-limit): T6, T12–T13, T16 ✔ (idempotency-key queda para Fase 2 — anotado).
- Recursos MVP (task, project, client, agenda, note, activity, search): T12–T15 ✔
- Fuera de MVP (finance/document/legal/resource/ticket/marketing/link/team, grafo, OpenCLI-browser): **plan aparte** (Fase 2/3) — no en este documento.

**2. Placeholders:** las repeticiones de recurso (T14) usan tablas concretas + patrones de código completos (A/B/C), no "TODO". `task/update|state|assign|move|subtask` y los comandos espejo se describen con su ruta/payload exactos. `intent` (T16) es deliberadamente de más alto nivel por su naturaleza (IA) y marcado como conservador.

**3. Consistencia de tipos:** `OsSession` usada uniformemente; `authed()` siempre devuelve `{data}`; errores `{error:{code,message,details}}`; nombres de acción tomados literalmente del código (`createTaskAction`, `getClientBySlug`, `saveKnowledgeNote`, `searchEntitiesAction`, etc.).

**Riesgos confirmados a vigilar durante la ejecución:** (a) clave del secreto 2FA (T7), (b) nombres de módulos RBAC (Preludio §6), (c) `npm workspaces` no debe romper el build de Next (T8 step 6), (d) `revalidatePath` dentro de acciones se ejecuta en route handlers sin efecto adverso.

## Fases siguientes (planes aparte, no en este documento)
- **Plan Fase 2:** `finance, document, legal, resource, ticket, marketing, link, team` + `bulk-update` + idempotency-key.
- **Plan Fase 3:** grafo `entityLinks`, `savedViews`, cliente TS generado desde OpenAPI, y (opcional) adaptador OpenCLI-browser.
- **Plan Proyecto 2 (independiente):** refactor de arquitectura de la landing (`src/app/page.tsx`) con la skill `improve-codebase-architecture`.
