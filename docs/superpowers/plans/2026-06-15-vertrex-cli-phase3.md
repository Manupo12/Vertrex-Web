# Vertrex CLI — Fase 3 (grafo, OpenAPI, e2e del CLI y prueba "todo funciona")

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development o superpowers:executing-plans. Steps con checkbox (`- [ ]`).

**Goal:** Cerrar el CLI con el grafo de relaciones, comentarios/aprobaciones/vistas/tags, un contrato **OpenAPI** como fuente de verdad, y —el foco del usuario— **pruebas que demuestran que TODO funciona**: una suite de integración de flujo completo + un **e2e que ejecuta el binario `vertrex` real** contra un servidor con BD real, más CI que lo corre en cada push.

**Architecture:** mismos patrones (`authed()`, `assertPermission`, `crud.ts`). Novedades: generación OpenAPI desde los zod de `src/lib/validation/v1/*`, un runner e2e que lanza `cli/bin/run.js` por `child_process` contra `next start` apuntando a `DATABASE_URL_TEST`, y GitHub Actions con servicio Postgres.

**Prerequisito:** Fases 0–2 en `main`, incluido el arnés de integración (`vitest.integration.config.ts`, `src/test/factories.ts`).

---

# Bloque A — Recursos finales

### Task 1: Grafo de relaciones (`entityLinks`)
**Acciones (`graph.ts`):** `linkEntities({...})` *(lee `src/lib/db/actions/graph.ts:15-57` para el shape exacto del objeto: sourceId/sourceType/targetId/targetType/relationType)*, `unlinkEntity(linkId)`, `getEntityConnections(entityId)`, `getResolvedEntityConnections(entityId)`, `getGraphSnapshot()`. Tipos en `graph-types.ts` (`ENTITY_TYPES`). **Módulo RBAC:** usar el del recurso fuente o un genérico `graph` (verificar); lectura = `read`, link/unlink = `write`.

**Files:** `src/app/api/v1/graph/route.ts` (POST link / GET snapshot), `graph/[entityId]/route.ts` (GET conexiones resueltas), `graph/links/[id]/route.ts` (DELETE unlink); CLI `cli/src/commands/graph/{link,unlink,show,snapshot}.ts`; Test `graph.itest.ts`.

- [ ] **Step 1: ruta**

```ts
// src/app/api/v1/graph/route.ts
import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { linkEntities, getGraphSnapshot } from "@/lib/db/actions/graph";
import { createLinkSchema } from "@/lib/validation/v1/graph";
import { ApiError } from "@/lib/api/errors";
export const runtime = "nodejs";
export const GET = authed(async ({ session }) => { await assertPermission(session, "graph", "read"); return getGraphSnapshot(); });
export const POST = authed(async ({ req, session }) => {
  await assertPermission(session, "graph", "write");
  const parsed = createLinkSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError("bad_request", 400, "Datos inválidos", parsed.error.flatten());
  return linkEntities(parsed.data as any);
});
```
`graph/[entityId]/route.ts` → `getResolvedEntityConnections(params.entityId)`. `graph/links/[id]/route.ts` → `unlinkEntity(params.id)`.

- [ ] **Step 2: zod** `src/lib/validation/v1/graph.ts` con `entityType` = `z.enum(ENTITY_TYPES)`.
- [ ] **Step 3: CLI** `graph link --from <id>:<type> --to <id>:<type> [--relation relates_to]`, `graph show <entityId>`, `graph snapshot`, `graph unlink <linkId>`.
- [ ] **Step 4: integration test** — crear 2 entidades (p.ej. task+project), `link`, luego `graph show` resuelve la conexión; `unlink` la elimina.
- [ ] **Step 5: Commit** `feat(api+cli): entity graph (link/unlink/show/snapshot) + integration test`

### Task 2: `comment`, `approval`, `saved-view`, `tag` (un commit por recurso)
Patrón ya conocido. Cada uno: ruta(s) + CLI + **test de integración** (crear → asserts en BD/auditoría) + un caso RBAC donde aplique.

| Recurso | Acciones | Rutas API | CLI | Notas |
|---|---|---|---|---|
| `comment` | `addCommentAction(targetType,targetId,body)`, `listCommentsAction(targetType,targetId)` | `comments/route.ts` GET(`?targetType&targetId`)+POST | `comment add --on <type>:<id> --body`, `comment list --on <type>:<id>` | polimórfico; módulo del target |
| `approval` | `requestApprovalAction(data)`, `respondApprovalAction(id,status,note?)` | `approvals/route.ts` GET+POST, `[id]/respond/route.ts` POST | `approval request …`, `approval respond <id> --status approved` | `status: approved\|changes_requested` |
| `saved-view` | `createSavedViewAction(name,route,queryJson)`, `updateSavedViewAction(id,data)`, `deleteSavedViewAction(id)`, `listSavedViewsAction(route)` | `saved-views/route.ts` GET(`?route`)+POST, `[id]` PATCH/DELETE | `view list/create/update/delete` | propias del usuario |
| `tag` | `createTagAction(...)`, `tagEntityAction(entityId,type,tagId)`, `untagEntityAction(...)`, `tagTaskAction`/`untagTaskAction` | `tags/route.ts` GET+POST, `tags/assign/route.ts` POST, `tags/unassign/route.ts` POST | `tag list/create`, `tag add --to <type>:<id> --tag <id>`, `tag remove …` | |

- [ ] Implementar los 4 (zod + rutas + CLI factorías + unit + integration). Commit por recurso: `feat(api+cli): <recurso> + integration test`.

---

# Bloque B — Contrato OpenAPI y tipos

### Task 3: Generar OpenAPI desde los zod
**Files:** `scripts/gen-openapi.ts`, `docs/openapi/vertrex.json`, `src/app/api/v1/openapi/route.ts`; Test `src/lib/api/__tests__/openapi.test.ts`. Dep: `@asteasolutions/zod-to-openapi`.

- [ ] **Step 1:** instalar `@asteasolutions/zod-to-openapi`; registrar cada esquema de `src/lib/validation/v1/*` y declarar paths por recurso en `scripts/gen-openapi.ts` (genera `docs/openapi/vertrex.json`).
- [ ] **Step 2:** `npm run gen:openapi` (añadir script `"gen:openapi":"tsx scripts/gen-openapi.ts"`).
- [ ] **Step 3:** `GET /api/v1/openapi` sirve el JSON (público o `authed` — recomendado `authed`).
- [ ] **Step 4: contract test** — el JSON parsea, `openapi==="3.x"`, e incluye paths clave (`/api/v1/tasks`, `/api/v1/finances`, `/api/v1/graph`). Snapshot del set de paths.
- [ ] **Step 5: Commit** `feat(api): generate OpenAPI spec from zod + /api/v1/openapi + contract test`

### Task 4: Tipos generados para el cliente del CLI
**Files:** `cli/src/lib/api-types.ts` (generado), script `"gen:cli-types"`. Dep dev: `openapi-typescript`.
- [ ] `npx openapi-typescript docs/openapi/vertrex.json -o cli/src/lib/api-types.ts`; tipar `api<T>()` con esas defs donde aplique; `cd cli && npm run build` (typecheck pasa). Commit `chore(cli): typed client from OpenAPI`.

---

# Bloque C — Pruebas que demuestran que TODO funciona (foco del usuario)

### Task 5: Runner e2e del binario `vertrex` real
**Files:** `tests/e2e-cli/helpers.ts`, `tests/e2e-cli/smoke.e2e.ts`, `vitest.e2e.config.ts`, scripts.

- [ ] **Step 1: `vitest.e2e.config.ts`** — `include: ["tests/e2e-cli/**/*.e2e.ts"]`, `fileParallelism:false`, `hookTimeout: 180000`, sin mocks.

- [ ] **Step 2: `tests/e2e-cli/helpers.ts`** — arranca servidor real + siembra token + ejecuta el binario:

```ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const pexec = promisify(execFile);

export function makeConfigDir(apiUrl: string, token: string) {
  const dir = mkdtempSync(join(tmpdir(), "vtx-"));
  writeFileSync(join(dir, "credentials.json"), JSON.stringify({ profiles: { default: { apiUrl, token } } }));
  return dir;
}

export async function vertrex(args: string[], env: Record<string, string>) {
  try {
    const { stdout } = await pexec("node", ["cli/bin/run.js", ...args], { env: { ...process.env, ...env } });
    return { code: 0, stdout };
  } catch (e: any) {
    return { code: e.code ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}
```
> El servidor real: usar `next start` sobre un build, con `DATABASE_URL=$DATABASE_URL_TEST`, lanzado en `globalSetup` del config (o documentar `npm run start` aparte). Sembrar el token con `seedUserWithToken` (reutiliza `src/test/factories.ts`) ejecutado vía `tsx` contra la misma BD, y pasar `VERTREX_CONFIG_DIR=makeConfigDir(...)`.

- [ ] **Step 3: `smoke.e2e.ts`** — el binario habla con el servidor:

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { vertrex, makeConfigDir } from "./helpers";

let env: Record<string, string>;
beforeAll(async () => {
  const apiUrl = process.env.E2E_API_URL || "http://localhost:3000";
  const token = process.env.E2E_TOKEN!; // sembrado por globalSetup
  env = { VERTREX_CONFIG_DIR: makeConfigDir(apiUrl, token), VERTREX_API_URL: apiUrl };
});

it("whoami devuelve el usuario", async () => {
  const r = await vertrex(["whoami", "--json"], env);
  expect(r.code).toBe(0);
  expect(JSON.parse(r.stdout).user.email).toContain("@");
});

it("crea y lista una tarea por el binario", async () => {
  const c = await vertrex(["task", "create", "--title", "E2E", "--json"], env);
  expect(c.code).toBe(0);
  const id = JSON.parse(c.stdout).id;
  const l = await vertrex(["task", "list", "--json"], env);
  expect(l.stdout).toContain(id);
});

it("operación destructiva sin --yes sale con código 64", async () => {
  const r = await vertrex(["task", "delete", "00000000-0000-0000-0000-000000000000"], env);
  expect(r.code).toBe(64);
});
```

- [ ] **Step 4:** script `"test:e2e":"vitest run --config vitest.e2e.config.ts"`. Documentar prerequisitos en `tests/e2e-cli/README.md`.
- [ ] **Step 5: Commit** `test(e2e): run the real vertrex binary against a live server`

### Task 6: Suite demostrativa "organiza la empresa" (flujo completo)
**Files:** `tests/integration/full-workflow.test.ts` (integración) y `tests/e2e-cli/workflow.e2e.ts` (binario).

- [ ] **Step 1: integración** — un test que recorre y verifica el flujo real, asegurando efectos en BD y el rastro de auditoría:

```ts
import { describe, it, expect } from "vitest";
import { seedUserWithToken, callRoute } from "@/test/factories";
import { db } from "@/lib/db";
import { activity } from "@/lib/db/schema";

describe("[integration] flujo completo de organización", () => {
  it("cliente→proyecto→tarea→asignar→avanzar→comentar→finanza→buscar→auditoría", async () => {
    const { token, user } = await seedUserWithToken({ role: "admin" });
    const post = (mod: string, url: string, body: unknown, params?: any) => callRoute(mod, "POST", url, { token, body, params });

    const client = await (await post("@/app/api/v1/clients/route", "http://x/api/v1/clients", { name: "ACME", slug: "acme", pin: "1234" })).json();
    const project = await (await post("@/app/api/v1/projects/route", "http://x/api/v1/projects", { name: "Web ACME", projectKey: "ACME" })).json();
    const task = await (await post("@/app/api/v1/tasks/route", "http://x/api/v1/tasks", { title: "Diseñar", projectId: project.data.id })).json();
    await post("@/app/api/v1/tasks/[id]/assign/route", `http://x/api/v1/tasks/${task.data.id}/assign`, { assigneeId: user.id }, { id: task.data.id });
    await post("@/app/api/v1/tasks/[id]/state/route", `http://x/api/v1/tasks/${task.data.id}/state`, { state: "todo" }, { id: task.data.id });
    const fin = await (await post("@/app/api/v1/finances/route", "http://x/api/v1/finances", { type: "income", concept: "Anticipo", amountCop: 500000 })).json();
    expect(client.data.id && project.data.id && task.data.id && fin.data.id).toBeTruthy();

    const search = await (await callRoute("@/app/api/v1/search/route", "GET", "http://x/api/v1/search?q=ACME", { token })).json();
    expect(JSON.stringify(search.data)).toContain("ACME");

    const trail = await db.select().from(activity);
    expect(trail.length).toBeGreaterThanOrEqual(3); // created/assigned/status_changed…
  });
});
```
> Ajusta los payloads de `clients` (slug/pin) a los campos que pide `createClientAction`/su zod real.

- [ ] **Step 2: e2e por binario** — `workflow.e2e.ts` repite la secuencia con `vertrex(...)` (project create → task create → assign → state → finance create → search), validando `--json` y exit code 0 en cada paso.
- [ ] **Step 3: Commit** `test: full "organize the company" workflow (integration + CLI e2e)`

### Task 7: Cobertura + CI
**Files:** `.github/workflows/cli.yml`.

- [ ] **Step 1:** habilitar cobertura (`vitest run --coverage`, `@vitest/coverage-v8`), umbral razonable (p.ej. 70% en `src/lib/api` y `src/app/api/v1`).
- [ ] **Step 2: workflow** con servicio Postgres:

```yaml
name: cli
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: vertrex_test }
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready" --health-interval 10s --health-timeout 5s --health-retries 5
    env:
      DATABASE_URL_TEST: postgres://postgres:postgres@localhost:5432/vertrex_test
      AUTH_SECRET: test-auth-secret-for-testing-only-32bytes!!
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run build
      - run: cd cli && npm ci && npm run build && npm test
      # e2e del binario: arrancar `npm run start` con DATABASE_URL=$DATABASE_URL_TEST, sembrar token, luego `npm run test:e2e`
```

- [ ] **Step 3: Commit** `ci: run unit+integration+build+cli e2e with postgres service`

---

# Bloque D — Opcional: adaptador OpenCLI-browser

### Task 8 (opcional): adaptador para flujos solo-web
Para vistas que existan únicamente en la UI (p.ej. un tablero visual), autorar un adaptador OpenCLI siguiendo su skill `opencli-adapter-author`: `opencli browser recon` sobre `/os/...`, auth `COOKIE` reutilizando sesión logueada, y 2–3 comandos (`open`, `extract`). Marcar claramente como complemento, no núcleo. Smoke test manual. Commit `feat(opencli): optional browser adapter for UI-only views`.

---

### Task 9: Verificación final + cierre de rama
- [ ] `npm run typecheck && npm run lint && npm run test:unit && npm run test:integration && npm run build`
- [ ] `cd cli && npm run build && npm test`
- [ ] `npm run test:e2e` (servidor real arriba con BD de prueba)
- [ ] Usa **superpowers:finishing-a-development-branch** para decidir merge/PR.
- [ ] Commit `chore: green full test matrix for vertrex CLI (phases 2-3)`

**✅ Definición de hecho — Fase 3:** grafo + comments/approvals/views/tags operables; OpenAPI como contrato + tipos del CLI; y la prueba de que **todo funciona** en tres niveles — unit (mock), integración (BD real, flujo completo con auditoría) y **e2e ejecutando el binario `vertrex` real** contra un servidor vivo — todo corriendo en CI.

## Self-review
- **Cobertura del spec (Fase 3):** grafo ✔, saved-views ✔, comments/approvals/tags ✔, cliente generado desde OpenAPI ✔, OpenCLI-browser opcional ✔.
- **Foco del usuario (tests reales):** T5 (binario real), T6 (flujo completo integración + e2e), T7 (CI con Postgres) — tres niveles que demuestran funcionamiento real, no solo mocks ✔.
- **Placeholders:** los recursos pequeños (T2) van en tabla con nombres de acción REALES; el código novel (grafo, OpenAPI, runner e2e, suite de flujo) está completo. Ajustes señalados explícitamente (shape de `linkEntities`, payload real de `clients`).
- **Riesgos:** (a) `next start` para e2e necesita build + BD de prueba sembrada (documentado); (b) módulo RBAC del grafo a confirmar; (c) cobertura: empezar con umbral bajo y subir.
