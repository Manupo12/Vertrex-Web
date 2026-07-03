# Vertrex CLI — Fase 2 (cobertura total + arnés de pruebas reales)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Extender el CLI/API a los módulos restantes (finanzas, tickets, links, vault de recursos, marketing, documentos, legal, equipo), añadir `bulk-update` e idempotencia, y —sobre todo— montar un **arnés de pruebas de integración real contra una BD** que demuestre que cada capa (token → auth → RBAC → acción → BD → auditoría) funciona de verdad, no solo con mocks.

**Architecture:** Sin cambios estructurales. Se replican los patrones YA implementados en el MVP: rutas `authed()` en `src/app/api/v1/<recurso-plural>/`, esquemas zod en `src/lib/validation/v1/`, comandos CLI en `cli/src/commands/<recurso-singular>/` usando las factorías `cli/src/lib/crud.ts`. La novedad es el **arnés de integración** (BD real desechable) y pruebas de seguridad/RBAC por recurso.

**Tech Stack:** igual que el MVP + Vitest "integration project" contra Postgres de pruebas (`DATABASE_URL_TEST`).

**Prerequisito:** el MVP (Fase 0+1) ya está en `main` (commits `c0c4340…1458785`). Lee, como plantillas REALES a copiar:
- API list/create: `src/app/api/v1/projects/route.ts` · API `[id]`: `src/app/api/v1/projects/[id]/route.ts`
- CLI create: `cli/src/commands/project/create.ts` · CLI list/get/delete: factorías en `cli/src/lib/crud.ts`
- Test unitario (mock): `src/app/api/v1/tasks/__tests__/tasks.route.test.ts`
- Wrapper: `src/lib/api/handler.ts` (`authed<P>` → `{data}`), guard: `src/lib/api/rbac.ts` (`assertPermission`).

---

## Convenciones confirmadas (del código real del MVP)

- **Ruta API (plural):** `export const runtime="nodejs"` + `export const GET/POST/PATCH/DELETE = authed(async ({req,session,params})=>{ await assertPermission(session,"<module>","read|write"); ... })`.
- **Validación:** `const parsed = <schema>.safeParse(await req.json().catch(()=>({}))); if(!parsed.success) throw new ApiError("bad_request",400,"Datos inválidos",parsed.error.flatten());`.
- **Acción `FormData`:** `return <action>(jsonToFormData(parsed.data as Record<string,unknown>))`. **Acción objeto:** `return <action>(parsed.data)`.
- **Lectura sin acción / borrado sin acción:** `db.select()/db.delete()` directo en la ruta.
- **CLI (singular):** create = clase propia (ver `project/create.ts`); list/get/delete = `export default makeListCommand(path,desc)` etc. desde `crud.ts`.
- **Módulos RBAC** (string que pasa `assertPermission`): usar `finances`, `documents`, `legal`, `resources`, `tickets`, `marketing`, `links`, `team`. **Verifica** que coincidan con los que ya usan las acciones (`grep -rn requireModuleAccess src/lib/db/actions`) y con el seed de `module_permissions`.

---

# Bloque A — Arnés de pruebas de integración real (la base de "todo funciona")

### Task 1: Configuración del proyecto de integración Vitest

**Files:**
- Create: `vitest.integration.config.ts`, `src/test/integration-setup.ts`, `src/test/factories.ts`, `.env.test.example`
- Modify: `package.json` (scripts)

- [ ] **Step 1: `vitest.integration.config.ts`** (NO mockea db ni auth; corre serial)

```ts
import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
dotenv.config({ path: ".env.local" });

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.itest.ts", "tests/integration/**/*.test.ts"],
    setupFiles: ["./src/test/integration-setup.ts"],
    fileParallelism: false,        // una sola BD: evita carreras entre archivos
    hookTimeout: 120000,
    env: {
      NODE_ENV: "test",
      AUTH_SECRET: process.env.AUTH_SECRET || "test-auth-secret-for-testing-only-32bytes!!",
      DATABASE_URL: process.env.DATABASE_URL_TEST || "",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./src/test/mocks/server-only.ts"),
    },
  },
});
```

- [ ] **Step 2: `src/test/integration-setup.ts`** (guardia anti-producción + migrar + truncar entre tests)

```ts
import { beforeAll, afterEach } from "vitest";
import { execSync } from "node:child_process";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

beforeAll(() => {
  const url = process.env.DATABASE_URL || "";
  if (!url || !(process.env.DATABASE_URL_TEST || /test/i.test(url))) {
    throw new Error("Integración abortada: define DATABASE_URL_TEST apuntando a una BD DESECHABLE.");
  }
  execSync("npm run db:migrate", { stdio: "inherit", env: process.env });
});

afterEach(async () => {
  await db.execute(sql`DO $$ DECLARE r RECORD; BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public')
    LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE'; END LOOP; END $$;`);
});
```

- [ ] **Step 3: `src/test/factories.ts`** (sembrar usuario + token + permisos)

```ts
import { db } from "@/lib/db";
import { users, modulePermissions, apiTokens } from "@/lib/db/schema";
import { createPasswordHash } from "@/lib/auth/session";
import { generateApiToken } from "@/lib/api/tokens";

type Perm = "read" | "write" | "admin";

export async function seedUserWithToken(opts: { role?: "team" | "admin"; perms?: Record<string, Perm> } = {}) {
  const [user] = await db.insert(users).values({
    email: `u_${Date.now()}_${Math.random().toString(36).slice(2)}@test.local`,
    name: "Test User",
    passwordHash: await createPasswordHash("pw-123456"),
    role: opts.role ?? "team",
  }).returning();
  for (const [module, permission] of Object.entries(opts.perms ?? {})) {
    await db.insert(modulePermissions).values({ userId: user.id, module, permission });
  }
  const { token, tokenHash, prefix } = generateApiToken();
  await db.insert(apiTokens).values({ userId: user.id, name: "itest", tokenHash, prefix });
  return { user, token };
}

export const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

export async function callRoute(modPath: string, method: string, url: string, opts: { token?: string; body?: unknown; params?: any } = {}) {
  const mod = await import(modPath);
  const req = new Request(url, {
    method,
    headers: { "content-type": "application/json", ...(opts.token ? bearer(opts.token) : {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  }) as any;
  return (mod as any)[method](req, { params: Promise.resolve(opts.params ?? {}) });
}
```

- [ ] **Step 4: scripts en `package.json`**

```json
"test": "vitest run",
"test:unit": "vitest run",
"test:integration": "vitest run --config vitest.integration.config.ts",
"test:all": "npm run test:unit && npm run test:integration"
```
Y `.env.test.example` con `DATABASE_URL_TEST=postgres://...vertrex_test`.

- [ ] **Step 5: Commit**

```bash
git add vitest.integration.config.ts src/test/integration-setup.ts src/test/factories.ts .env.test.example package.json
git commit -m "test: real DB integration harness (config, setup, factories)"
```

---

### Task 2: Prueba de integración que demuestra el MVP de extremo a extremo

> Esto prueba que la cadena completa YA funciona, antes de añadir recursos. Es la prueba "que demuestra que todo funciona" para el núcleo.

**Files:** Create `src/app/api/v1/tasks/__tests__/tasks.itest.ts`

- [ ] **Step 1: Write the integration test**

```ts
import { describe, it, expect } from "vitest";
import { seedUserWithToken, callRoute } from "@/test/factories";
import { db } from "@/lib/db";
import { tasks, activity } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("[integration] /api/v1/tasks", () => {
  it("create→DB→audit con token real (sin mocks)", async () => {
    const { token, user } = await seedUserWithToken({ role: "admin" });
    const res = await callRoute("@/app/api/v1/tasks/route", "POST", "http://x/api/v1/tasks", { token, body: { title: "Tarea real" } });
    expect(res.status).toBe(200);
    const { data } = await res.json();
    const [row] = await db.select().from(tasks).where(eq(tasks.id, data.id));
    expect(row.title).toBe("Tarea real");
    const audit = await db.select().from(activity).where(eq(activity.targetId, data.id));
    expect(audit.some((a) => a.verb === "created" && a.actorId === user.id)).toBe(true);
  });

  it("RBAC: usuario sin write en 'projects' → 403", async () => {
    const { token } = await seedUserWithToken({ role: "team", perms: { projects: "read" } });
    const res = await callRoute("@/app/api/v1/tasks/route", "POST", "http://x/api/v1/tasks", { token, body: { title: "No" } });
    expect(res.status).toBe(403);
  });

  it("token revocado → 401", async () => {
    const { token } = await seedUserWithToken({ role: "admin" });
    const { db: d } = await import("@/lib/db");
    const { apiTokens } = await import("@/lib/db/schema");
    await d.update(apiTokens).set({ revokedAt: new Date() });
    const res = await callRoute("@/app/api/v1/tasks/route", "GET", "http://x/api/v1/tasks", { token });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run** `npm run test:integration` (con `DATABASE_URL_TEST` puesto) → PASS (3 tests).
- [ ] **Step 3: Commit** `test: end-to-end integration proof for v1 tasks (auth+rbac+audit)`

---

### Task 3: Idempotencia en creación (anti-duplicado del agente)

**Files:**
- Modify: `src/lib/db/schema.ts` (+ `idempotencyKeys`) + migración
- Create: `src/lib/api/idempotency.ts`
- Modify: rutas POST de `tasks` y `projects` (envolver con `withIdempotency`)
- Test: `src/lib/api/__tests__/idempotency.itest.ts`

- [ ] **Step 1: tabla**

```ts
export const idempotencyKeys = pgTable("idempotency_keys", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  responseJson: jsonb("response_json").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (t) => ({ uniq: unique().on(t.userId, t.key) }));
```
`npm run db:generate && npm run db:migrate`.

- [ ] **Step 2: helper**

```ts
// src/lib/api/idempotency.ts
import { db } from "@/lib/db";
import { idempotencyKeys } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function withIdempotency<T>(req: NextRequest, userId: string, run: () => Promise<T>): Promise<T> {
  const key = req.headers.get("idempotency-key");
  if (!key) return run();
  const [hit] = await db.select().from(idempotencyKeys).where(and(eq(idempotencyKeys.userId, userId), eq(idempotencyKeys.key, key))).limit(1);
  if (hit) return hit.responseJson as T;
  const result = await run();
  await db.insert(idempotencyKeys).values({ userId, key, responseJson: result as any }).onConflictDoNothing();
  return result;
}
```

- [ ] **Step 3:** En `tasks/route.ts` y `projects/route.ts`, envolver el cuerpo del POST: `return withIdempotency(req, session.userId, () => createXAction(...))`.

- [ ] **Step 4: Integration test** — POST dos veces con la misma `Idempotency-Key` → una sola fila en BD, misma respuesta.

```ts
it("misma Idempotency-Key no duplica", async () => {
  const { token } = await seedUserWithToken({ role: "admin" });
  const headers = { "content-type": "application/json", authorization: `Bearer ${token}`, "idempotency-key": "abc" };
  const mk = () => new Request("http://x/api/v1/tasks", { method: "POST", headers, body: JSON.stringify({ title: "once" }) }) as any;
  const { POST } = await import("@/app/api/v1/tasks/route");
  const r1 = await POST(mk(), { params: Promise.resolve({}) });
  const r2 = await POST(mk(), { params: Promise.resolve({}) });
  const { tasks } = await import("@/lib/db/schema");
  const { db } = await import("@/lib/db");
  expect((await db.select().from(tasks)).length).toBe(1);
  expect((await r1.json()).data.id).toBe((await r2.json()).data.id);
});
```

- [ ] **Step 5: Commit** `feat(api): idempotency-key support for create endpoints`

---

### Task 4: `bulk-update` de tareas

**Files:** Create `src/app/api/v1/tasks/bulk/route.ts`, `cli/src/commands/task/bulk-update.ts`; Test `src/app/api/v1/tasks/__tests__/bulk.itest.ts`

- [ ] **Step 1: ruta** (reusa `bulkUpdateTasksAction(ids, patch)`)

```ts
// src/app/api/v1/tasks/bulk/route.ts
import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { bulkUpdateTasksAction } from "@/lib/db/actions/tasks";
import { ApiError } from "@/lib/api/errors";
export const runtime = "nodejs";
export const POST = authed(async ({ req, session }) => {
  await assertPermission(session, "projects", "write");
  const { ids, set } = await req.json().catch(() => ({}));
  if (!Array.isArray(ids) || ids.length === 0 || !set) throw new ApiError("bad_request", 400, "ids[] y set{} requeridos");
  await bulkUpdateTasksAction(ids, set);
  return { updated: ids.length };
});
```

- [ ] **Step 2: CLI** `task bulk-update --ids a,b,c --set state=done` (parsea `key=value` repetible a un objeto, POST a `/api/v1/tasks/bulk`).
- [ ] **Step 3: Integration test** — crear 2 tareas, bulk-update a `priority=4`, verificar ambas filas.
- [ ] **Step 4: Commit** `feat(api+cli): bulk-update tasks`

---

# Bloque B — Recursos restantes (un commit por recurso; cada uno con test unitario + integración)

> **Plantilla de pasos por recurso** (repetir): (1) zod en `src/lib/validation/v1/<r>.ts`; (2) rutas `src/app/api/v1/<plural>/route.ts` y `[id]/route.ts` copiando `projects/*`; (3) comandos CLI `cli/src/commands/<singular>/{list,get,create,update,delete}.ts` (list/get/delete con factorías de `crud.ts`); (4) **test unitario** (mock, estilo `tasks.route.test.ts`) + **test de integración** (`<r>.itest.ts` con `seedUserWithToken`/`callRoute`, asserts en BD + auditoría + un caso RBAC 403); (5) `npm run test:all`; (6) `cd cli && npm run build`; (7) commit `feat(api+cli): <recurso> endpoints, commands, unit+integration tests`.

### Task 5: `finance` (referencia completa del bloque)

**Acciones (de `finances.ts`):** `createFinanceAction(FormData)`, `updateFinanceAction(id,FormData)`, `deleteFinanceAction(id)`, `markFinancePaidAction(id)`, `getFinanceById(id)`, `getMonthlyFinanceSummary()`, `getProjectPnLAction(projectId)`, `generateInvoiceAction(projectId,milestoneId,items)`, `exportFinancesCSVAction()`. **Módulo RBAC:** `finances`.

**Rutas:**
- `finances/route.ts`: GET (db.select finances, filtros `status`,`type`,`limit`) · POST (createFinanceAction ← FormData).
- `finances/[id]/route.ts`: GET (getFinanceById, 404) · PATCH (updateFinanceAction ← FormData) · DELETE (deleteFinanceAction).
- `finances/[id]/pay/route.ts`: POST → markFinancePaidAction(id).
- `finances/summary/route.ts`: GET → getMonthlyFinanceSummary().
- `finances/invoice/route.ts`: POST `{projectId,milestoneId,items[]}` → generateInvoiceAction(...).
- `finances/export/route.ts`: GET → exportFinancesCSVAction() (responder texto CSV con `content-type: text/csv`).

**CLI (`cli/src/commands/finance/`):** `list`, `get`, `create --type --amount --concept --due [...]`, `update`, `delete`, `pay <id>`, `summary`, `invoice --project --items '...'`, `export`.

- [ ] **Step 1: zod** `src/lib/validation/v1/finances.ts` (reusa/espeja `src/lib/validators/finances.ts` existente).
- [ ] **Step 2: rutas** (copiar patrón `projects/route.ts` y `[id]`; sub-rutas pay/summary/invoice/export).
- [ ] **Step 3: comandos CLI** (create propio; list/get/delete por factorías).
- [ ] **Step 4: unit test** `finances.route.test.ts` (mock acción; 200 create, 400 inválido).
- [ ] **Step 5: integration test** `finances.itest.ts`:

```ts
it("crea, marca pagada y refleja en BD", async () => {
  const { token } = await seedUserWithToken({ role: "admin" });
  const c = await callRoute("@/app/api/v1/finances/route", "POST", "http://x/api/v1/finances", { token, body: { type: "income", concept: "Anticipo", amountCop: 100000 } });
  const { data } = await c.json();
  await callRoute("@/app/api/v1/finances/[id]/pay/route", "POST", `http://x/api/v1/finances/${data.id}/pay`, { token, params: { id: data.id } });
  const { finances } = await import("@/lib/db/schema"); const { db } = await import("@/lib/db"); const { eq } = await import("drizzle-orm");
  const [row] = await db.select().from(finances).where(eq(finances.id, data.id));
  expect(row.status).toBe("paid");
});
it("team sin write en finances → 403", async () => {
  const { token } = await seedUserWithToken({ role: "team", perms: { finances: "read" } });
  const r = await callRoute("@/app/api/v1/finances/route", "POST", "http://x/api/v1/finances", { token, body: { type: "income", concept: "x", amountCop: 1 } });
  expect(r.status).toBe(403);
});
```

- [ ] **Step 6:** `npm run test:all` → PASS; `cd cli && npm run build`.
- [ ] **Step 7: Commit** `feat(api+cli): finance endpoints, commands, unit+integration tests`

### Task 6: `ticket` (sin capa de acción → BD directa + auditoría manual)
`tickets.ts` no exporta acciones. Implementar en la ruta: GET `db.select(tickets)`, POST `db.insert(tickets).values({clientId,title,description})` + `logActivity({actorType:"team",actorId:session.userId,verb:"created",targetType:"ticket",targetId})`, PATCH status, DELETE. **Módulo RBAC:** `tickets` (o `crm` si así está en el seed — verificar). zod en `src/lib/validation/v1/tickets.ts` (reusa `validators/tickets.ts`). CLI `ticket list/get/create/update/delete`. Unit + integration (crear ticket → fila + actividad; RBAC 403). Commit.

### Task 7: `link` (links + repositorios + colecciones)
**Acciones (`links.ts`):** `saveExternalReferenceAction(url,savedReason?)`, `quickSaveAction(url,savedReason?)`, `getLinkById(id)`, `getRepositoryById(id)`, `updateLinkReadingStatusAction(id,status)`, `updateRepositoryStatusAction(id,status)`, `updateRepositoryPriorityAction(id,priority)`, `createCollectionAction(name,desc?)`, `loadRepositoryReadmeAction(id)`. **Módulo:** `links`. Rutas: `links/route.ts` (GET db.select links; POST saveExternalReference), `links/[id]/route.ts` (GET getLinkById; PATCH reading-status; DELETE), `links/quick-save/route.ts` (POST), `repositories/route.ts` + `[id]` (status/priority/readme), `link-collections/route.ts` (POST createCollection; GET list). CLI `link list/get/save/quick-save/status`, `repo status/priority/readme`, `collection create/list`. Unit + integration. Commit.

### Task 8: `resource` (vault cifrado — SENSIBLE)
**Acciones (`resources.ts`):** `createResourceAction(FormData)` (cifra server-side), `revealResourceAction(id)` (descifra + registra en `resourceAccessLog`, exige visibilidad), `setRotationAction(id,date)`, `setResourceVisibilityAction(id,vis)`, `createResourceFolderAction(name,parent?)`, `connectResourceEntityAction(...)`. **Módulo:** `resources`.
**Seguridad (obligatoria):**
- `reveal` requiere `assertPermission(session,"resources","admin")` **además** de las reglas de visibilidad de la acción; el acceso ya queda en `resourceAccessLog`.
- En `cli/AGENT.md`: marcar `resource reveal` como sensible; el agente solo debe usarlo con autorización explícita.
- Considerar un **scope de token** que excluya `reveal` para el token del agente (anotar; el scope se aplica en `assertPermission`/handler).
Rutas: `resources/route.ts` (GET metadata SIN `encryptedValue`; POST create), `resources/[id]/route.ts` (GET metadata; PATCH rotation/visibility; DELETE), `resources/[id]/reveal/route.ts` (POST → revealResourceAction, admin). CLI `resource list/get/create/reveal/rotate/visibility`, `resource-folder create`.
**Tests de seguridad (integration):**
```ts
it("team NO puede revelar (403) y queda registrado solo el admin", async () => { /* seed team read → reveal → 403; seed admin → reveal → 200 + fila en resourceAccessLog */ });
it("list nunca expone encryptedValue", async () => { /* crear → GET list → expect(rows[0].encryptedValue).toBeUndefined() */ });
```
Unit + integration + seguridad. Commit.

### Task 9: `marketing` (social + content plan + hashtags; password sensible)
**Acciones (`marketing.ts`):** `createSocialAccountAction(FormData)`, `revealSocialPasswordAction(id)` (SENSIBLE → admin + auditar), `createContentPlanAction(FormData)`, `updateContentPlanStatusAction(id,status)`, `updateContentPlanEngagementAction(...)`, `createHashtagAction(label,tags[],accountId)`, `listHashtagsAction(accountId?)`, `updateHashtagAction(id,data)`, `deleteHashtagAction(id)`. **Módulo:** `marketing`. Rutas: `social-accounts/route.ts`+`[id]` (+`/reveal-password` admin), `content-plan/route.ts`+`[id]`(+`/status`,`/engagement`), `hashtags/route.ts`+`[id]`. CLI `social …`, `content …`, `hashtag …`. `reveal-password` con misma guardia/aviso que `resource reveal`. Unit + integration (+ seguridad password). Commit.

### Task 10: `document` (metadatos, carpetas, share tokens, privacidad)
**Acciones (`documents.ts`):** `createFolderAction(name,parent?)`, `moveDocumentToFolderAction(docId,folderId?)`, `updateDocumentPrivacyAction(id,isPublic)`, `createShareTokenAction(documentId,ttlHours)`, `revokeShareTokenAction(tokenId)`, `uploadDocumentVersionAction(FormData)`. **Módulo:** `documents`. (CLI no sube binarios crudos en Fase 2: `upload` opcional vía `--file` → base64; marcar opcional.) Rutas: `documents/route.ts` (GET db.select; POST opcional upload), `documents/[id]/route.ts` (GET; PATCH privacy/move; DELETE), `documents/[id]/share/route.ts` (POST crea token; DELETE revoca), `document-folders/route.ts`. CLI `document list/get/privacy/move`, `document share/unshare`, `document-folder create`. Unit + integration. Commit.

### Task 11: `legal` (plantillas + generar + firma)
**Acciones (`legal.ts`):** `createLegalTemplateAction(name,type,bodyHtml,variables[])`, `generateLegalFromTemplateAction(templateId,vars,clientId,projectId?)`, `requestSignatureAction(legalId,clientId,portalUserIds[])`, `updateLegalSettingsAction(id,isPublic,signedAt)`. **Módulo:** `legal`. Rutas: `legal/route.ts` (GET db.select legalDocuments), `legal/[id]/route.ts` (GET; PATCH settings; DELETE), `legal-templates/route.ts` (GET/POST), `legal/generate/route.ts` (POST), `legal/[id]/request-signature/route.ts` (POST). CLI `legal list/get`, `legal-template create/list`, `legal generate`, `legal request-signature`. Unit + integration (generar desde plantilla crea `legalDocuments` fila). Commit.

### Task 12: `team` (usuarios + permisos — solo admin)
**Acciones (`team.ts`):** `createTeamMemberAction(FormData)`, `updateTeamMemberRoleAction(userId,role)`, `deactivateTeamMemberAction(userId)`, `updateUserStatusAction(userId,status)`, `getWorkloadAction()`, `setModulePermissionAction(userId,module,permission)`, `getModulePermissionsAction(userId)`. **Módulo RBAC:** `team` con nivel **admin** en todas las escrituras (gestionar personas/permisos es sensible). Rutas: `team/route.ts` (GET list users; POST create — admin), `team/[id]/route.ts` (GET; PATCH role/status; DELETE deactivate), `team/[id]/permissions/route.ts` (GET/PUT setModulePermission), `team/workload/route.ts` (GET). CLI `team list/get/create/role/status/deactivate`, `team permissions get/set`, `team workload`. Unit + integration (**clave:** team con rol team → 403 en crear miembro; admin → 200). Commit.

---

# Bloque C — Cierre Fase 2

### Task 13: Actualizar catálogo, AGENT.md y skill `vertrex-os`
- [ ] Regenerar/verificar `vertrex commands --json` incluye los nuevos recursos.
- [ ] Añadir a `cli/AGENT.md`: nuevos recursos, y una sección **"Operaciones sensibles"** (`resource reveal`, `social reveal-password`, `team *`) con la regla: requieren permiso admin y autorización explícita.
- [ ] Actualizar `.claude/skills/vertrex-os/SKILL.md` con ejemplos de finanzas/tickets/links/equipo.
- [ ] Commit `docs(cli): catalog, AGENT.md, vertrex-os skill updated for phase 2`.

### Task 14: Verificación Fase 2
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test:unit`
- [ ] `npm run test:integration` (con `DATABASE_URL_TEST`)
- [ ] `npm run build` · `cd cli && npm run build`
- [ ] Commit `chore: green typecheck/lint/unit/integration/build for phase 2`

**✅ Definición de hecho — Fase 2:** todos los módulos del OS operables por CLI/API con RBAC y auditoría; idempotencia y bulk-update; y **cada recurso tiene una prueba de integración real** (token→auth→RBAC→acción→BD→auditoría) más casos de seguridad para los recursos sensibles. `test:all` y `build` en verde.

## Self-review
- **Cobertura del spec (Fase 2 del spec):** finance, document, legal, resource, ticket, marketing, link, team ✔ · bulk-update ✔ · idempotency ✔.
- **Énfasis del usuario (tests reales):** Bloque A monta integración real; T2 demuestra el MVP de punta a punta; cada recurso (T5–T12) incluye integración + RBAC; recursos sensibles incluyen pruebas de seguridad ✔.
- **Placeholders:** T5 (finance) está completo como referencia; T6–T12 son tablas concretas (nombres de acción REALES del código) que aplican el patrón ya implementado en `projects/*` + `crud.ts`. Sin "TODO".
- **Consistencia:** módulos RBAC nombrados explícitamente (verificar contra seed); `{data}`/`{error}` y `seedUserWithToken`/`callRoute` usados uniformemente.
- **Riesgos:** (a) nombres de módulo RBAC deben coincidir con el seed/acciones; (b) `DATABASE_URL_TEST` obligatorio (guardia anti-prod incluida); (c) `exportFinancesCSV` y `documents upload` tienen formatos no-JSON → manejar content-type.

**Continúa en:** `2026-06-15-vertrex-cli-phase3.md` (grafo, OpenAPI, e2e del CLI y la suite demostrativa "todo funciona").
