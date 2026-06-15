# Spec de diseño — CLI `vertrex` (CLI de todo el OS)

- **Fecha:** 2026-06-14
- **Estado:** Aprobado (diseño) → pendiente de plan de implementación
- **Autor:** Manu (con Claude)
- **Proyecto:** 1 de 2 (este = CLI; el refactor de la landing es un spec aparte)
- **Prioridad:** Alta (es lo primero a ejecutar)

> **Para el agente ejecutor:** este documento describe **qué** construir y **por qué**. El **cómo** (pasos ordenados) vive en el plan de implementación hermano: `docs/superpowers/plans/2026-06-14-vertrex-cli-plan.md`. No escribas código sin leer ambos.

---

## 1. Contexto y problema

Vertrex OS es una app Next.js 15 (App Router, React 19, Mantine, Tailwind v4) con Drizzle ORM sobre Postgres/Neon. El dominio abarca ~33 tablas: CRM (`clients`), gestión de proyectos estilo Linear (`projects`, `cycles`, `milestones`, `tasks`), documentos + legal + firmas, knowledge hub (`knowledgeNotes`), recursos, finanzas, agenda, links, marketing, tickets, más transversales (`entityLinks` = grafo de relaciones, `comments`, `approvals`, `notifications`, `activity`, `savedViews`).

**Toda la lógica de dominio ya existe** en una capa de acciones reutilizable: `src/lib/db/actions/*` (29 módulos con CRUD completo; p.ej. `tasks.ts` expone `createTaskAction`, `updateTaskAction`, `listTasksAction`, `changeTaskStateAction`, `assignTaskAction`, `deleteTaskAction`, `bulkUpdateTasksAction`, etc.).

Hoy esas acciones se invocan desde server components, server actions y un puñado de rutas API. Existe una superficie incipiente para agentes en `/api/mcp/*` (`tasks`, `graph`, `activity` son **solo GET**; `intent` acepta POST con lenguaje natural), autenticada con un **único** `MCP_SECRET` (Bearer) y rate-limit Upstash.

**Problema:** no hay forma programática, segura y multiusuario de **operar todo el OS desde fuera de la web** —ni para personas en terminal, ni (sobre todo) para un agente de IA que organice la empresa—. La capacidad de escritura ya existe en el action-layer pero no está expuesta de forma controlada.

**No existe** ningún CLI ni tooling de CLI en el repo (verificado: sin `bin`/oclif/commander/clipanion/citty/yargs). `vertrex-os/` es un scaffold Next vacío y abandonado (ignorar).

## 2. Objetivos

1. Un CLI `vertrex` que permita **consultar y editar** las entidades del OS desde la terminal.
2. **AI-native:** un agente debe poder descubrir y ejecutar comandos sin intervención humana (catálogo legible por máquina, `AGENT.md`, skill de Claude).
3. **Multiusuario y seguro:** cada persona/agente se autentica con su propio token y opera **bajo el RBAC existente**; todo lo que muta queda auditado.
4. **Reutilizar, no reescribir:** la lógica de dominio vive en `src/lib/db/actions/*`; el CLI no la duplica.
5. **Cero infra nueva:** la API viaja dentro de la app Next.js y despliega con ella.

## 3. No-objetivos (fuera de alcance)

- Rediseño visual de nada (la landing se trata en su propio spec; aquí, nada de UI).
- Reescritura del dominio o de la BD.
- Adaptador OpenCLI-browser (manejar la web con Chrome logueado): **opcional, Fase 3**. El núcleo es determinista vía API, no DOM.
- Cobertura de las 33 tablas en la primera entrega (ver fases; aplicar YAGNI).

## 4. Decisiones tomadas (con el usuario)

| Decisión | Elección | Implicación |
|---|---|---|
| Enfoque del CLI | **CLI nativo + API de agente** (no OpenCLI-browser) | Determinista, rápido, reutiliza el action-layer |
| Acceso | **Multiusuario por permisos** (token por persona) | Nueva tabla `apiTokens`; se aplica el RBAC existente; auditoría por actor |
| Orden | **CLI primero**, landing después | Este spec primero; landing en spec hermano |

**Referencia de diseño (OpenCLI, jackwener):** adoptamos sus *convenciones* (sustantivo-verbo, `--format`, exit codes `sysexits.h`, descubrimiento legible por máquina, `AGENT.md`), **no** su runtime de browser.

## 5. Arquitectura

```
Persona / Agente IA
      │  vertrex <recurso> <acción>  [--json | --format table|yaml|csv]
      ▼
┌──────────────┐   HTTPS + token personal (Bearer)   ┌────────────────────────────┐
│ CLI vertrex  │ ──────────────────────────────────► │  API de Agente  /api/v1/*   │
│ (TS, oclif)  │ ◄────────────────────────────────── │  auth + RBAC + zod + audit  │
└──────────────┘            JSON estable              └─────────────┬──────────────┘
                                                                    │ reutiliza (no reimplementa)
                                                                    ▼
                                                     src/lib/db/actions/*  (29 módulos)
                                                                    ▼
                                                       Drizzle ORM → Postgres (Neon)
```

Tres componentes, tres responsabilidades aisladas. El **contrato HTTP (OpenAPI)** es el único acoplamiento entre CLI y app.

### 5.1 Componente A — API de Agente `/api/v1/*` (el corazón)

- Vive en `src/app/api/v1/**` dentro de la app Next.js. Despliega con la app (Vercel). Sin servicios nuevos.
- Cada handler es **fino**: (1) autentica el token, (2) resuelve el usuario y sus permisos, (3) valida input con `zod` (reutiliza `src/lib/validation`), (4) llama a la acción existente en `src/lib/db/actions/*`, (5) serializa una respuesta estable, (6) audita en `activity` si mutó.
- **Versionada** (`/api/v1`) porque el agente depende de un contrato estable. Las rutas `/api/mcp/*` actuales se **absorben/reescriben** aquí (incluido `intent`).
- Helpers compartidos nuevos en `src/lib/api/`: `authenticateToken()`, `requirePermission(module, action)`, `serialize*()`, `auditMutation()`, manejo uniforme de errores `{error:{code,message,details}}`.
- **OpenAPI** generado desde los esquemas `zod` (p.ej. `@asteasolutions/zod-to-openapi`) → única fuente de verdad que (a) documenta la API y (b) alimenta el catálogo `vertrex commands`.

### 5.2 Componente B — CLI `vertrex`

- **Paquete propio** en `cli/` (workspace npm; añadir `"workspaces": ["cli"]` a la raíz). Compila a binario distribuible (`npx vertrex` / `npm i -g @vertrex/cli`).
- **Desacoplado:** el CLI **no** importa internals de la app; solo conoce el contrato HTTP (cliente generado desde OpenAPI o cliente fino a mano). Esto lo hace testeable de forma aislada.
- **Framework: oclif** (estructura recurso→acción que escala a docenas de comandos, `--json` nativo, help legible por máquina, plugins). Alternativa ligera evaluada: `citty`. Decisión: oclif por el `--json` y el catálogo de comandos para agentes.
- **Convención de comandos:** `vertrex <recurso> <acción> [args] [--flags]` (sustantivo-verbo, Unix).
- **Flags globales:** `--format table|json|yaml|csv`, `--json` (atajo de `--format json`), `--profile <nombre>` (multi-cuenta), `--api-url <url>`, `--dry-run`, `--yes` (omitir confirmación), `--quiet`.
- **Exit codes** de `sysexits.h` (0 OK, 64 uso incorrecto, 69 servicio no disponible, 77 sin permiso, etc.).
- **Salida determinista:** JSON con esquema estable para máquinas; tablas legibles para humanos. Errores siempre estructurados.

### 5.3 Componente C — Descubribilidad para agentes (lo "AI-native")

- `vertrex commands [--json]` → catálogo completo (recurso, acción, args, flags, descripción) generado desde la metadata de oclif + OpenAPI. Es el mecanismo de descubrimiento estilo OpenCLI.
- `vertrex do "<intención en lenguaje natural>"` → POST a `/api/v1/intent` (reutiliza/mejora el `/api/mcp/intent` actual, que ya usa OpenAI) y mapea intención → acciones.
- **`cli/AGENT.md`** → instrucciones para agentes: cómo autenticarse, flujos comunes, reglas de seguridad (cuándo usar `--dry-run`, qué es destructivo), formato de salida.
- **Skill de Claude `vertrex-os`** (`.claude/skills/vertrex-os/SKILL.md`) que envuelve el CLI → tu agente la descubre y la usa nativamente. Incluye ejemplos de los flujos top ("crea una tarea", "lista clientes con facturas vencidas", etc.).

## 6. Modelo de datos (cambios)

Una tabla nueva (Drizzle, en `src/lib/db/schema.ts`) + su migración:

```
apiTokens
  id          uuid pk
  userId      uuid fk -> users.id (cascade)
  name        text            -- "laptop Manu", "agente-orquestador"
  tokenHash   text unique     -- sha256 del token; NUNCA se guarda el token en claro
  prefix      text            -- primeros chars para mostrar en listados (p.ej. "vtx_3f9…")
  scopes      jsonb/text[]     -- opcional: acota por módulo/acción ADEMÁS del RBAC del usuario
  lastUsedAt  timestamp null
  expiresAt   timestamp null   -- null = sin caducidad (cuenta de servicio)
  revokedAt   timestamp null
  createdAt   timestamp default now
```

- Formato del token: `vtx_<random urlsafe>`. Se muestra **una sola vez** al crearlo.
- Validación: `tokenHash = sha256(token)`; lookup por hash; chequear `revokedAt`/`expiresAt`; actualizar `lastUsedAt`.

## 7. Autenticación y permisos

- `vertrex login` → email + contraseña → si el usuario tiene 2FA (ya soportado vía `otpauth`/`src/lib/auth/two-factor.ts`), pide OTP → el servidor emite un **PAT** con el rol del usuario → se guarda en `~/.config/vertrex/credentials.json` (modo `600`), soporta múltiples `--profile`.
- **Cuenta de servicio del agente:** un usuario dedicado con rol acotado + un PAT de larga duración, creado por un admin con `vertrex auth tokens create --name agente` o desde Settings en la web.
- **RBAC server-side:** cada endpoint resuelve PAT → usuario → permisos vía `src/lib/auth/permissions.ts` + tabla `modulePermissions`, y exige el permiso del módulo (p.ej. `finance:write`). El CLI **nunca** es la única barrera; la API es la puerta.
- **Rate-limit por token** (reutiliza el patrón Upstash de `/api/mcp/tasks`).

## 8. Seguridad para escritura del agente

Como un agente autónomo podrá crear/editar/borrar por toda la empresa:

- **RBAC en el servidor** (no confiar en el cliente).
- **`--dry-run`** muestra el efecto sin ejecutar; **operaciones destructivas exigen `--yes`** (o token de confirmación).
- **Idempotency-key** en `create` → un reintento del agente no duplica.
- **Auditoría:** toda mutación escribe en `activity` con el actor real (usuario del token). (`resourceAccessLog` para recursos.)
- **Scopes opcionales** por token (p.ej. token de solo-lectura, o limitado a ciertos módulos) por encima del RBAC.

## 9. Superficie de comandos y API

> Mapean 1:1 con acciones existentes; sin lógica nueva de dominio. Lista concreta, no placeholder.

### 9.1 Fase 1 (MVP) — núcleo "organiza la empresa"

**Global / auth**
- `vertrex login` · `logout` · `whoami`
- `vertrex auth tokens {list|create|revoke}`
- `vertrex commands [--json]`
- `vertrex do "<intent>"`

**`task`** (← `src/lib/db/actions/tasks.ts`)
- `task list [--project --assignee me|<id> --state --priority --cycle --since]`
- `task get <id|identifier>`
- `task create --title <t> [--project --priority --assignee --due --parent]`
- `task update <id> [--title --state --priority --assignee --due]`
- `task state <id> <state>` · `task assign <id> <user|me|none>`
- `task move <id> --project <p> [--cycle --milestone]`
- `task block <id> --on <id>` · `task unblock <linkId>`
- `task subtask <parentId> --title <t>` · `task delete <id> --yes`

**`project`** (← `projects.ts`, `cycles.ts`, `milestones.ts`): `list|get|create|update|delete`, `project cycles <id>`, `project milestones <id>`
**`client`** (← `crm.ts`, `portal-users.ts`): `list|get|create|update`, `client portal-users <id>`, `client timeline <id>`
**`agenda`** (← `agenda.ts`): `list [--from --to] |get|create|update|delete`
**`note`** (← `hub.ts`): `list|get|create|update|delete`
**`activity`** (← `activity.ts`): `list [--since --entity --actor]`
**`search`** (← `search.ts`): `search "<query>" [--type task|project|client|…]`

**Endpoints API (MVP), espejo de lo anterior:**
- `POST /api/v1/auth/login`, `POST /api/v1/auth/2fa`, `POST|GET|DELETE /api/v1/auth/tokens`, `GET /api/v1/auth/whoami`
- `GET|POST /api/v1/tasks`, `GET|PATCH|DELETE /api/v1/tasks/:id`, `POST /api/v1/tasks/:id/{state,assign,move,block,subtasks}`
- `GET|POST /api/v1/projects` (+ `:id`, `/cycles`, `/milestones`), idem `clients`, `agenda`, `notes`
- `GET /api/v1/activity`, `GET /api/v1/search`, `POST /api/v1/intent`, `GET /api/v1/commands` (catálogo/OpenAPI)

### 9.2 Fase 2 — resto de módulos
`finance` (`finances.ts`, `finance-rules.ts`), `document` (`documents.ts`), `legal` (`legal.ts`), `resource` (`resources.ts`), `ticket` (`tickets.ts`), `marketing` (`marketing.ts`), `link` (`links.ts`), `team` (`team.ts`, `rbac.ts`). Más `--dry-run`/`--yes` consistentes y `bulk-update`.

### 9.3 Fase 3 — avanzado / opcional
Grafo `entityLinks` (`graph.ts`), `savedViews`, `approvals`, `comments`, cliente TS generado desde OpenAPI publicado, y **opcional** adaptador OpenCLI-browser para flujos que solo existan en la web.

## 10. Estructura en el repo

```
cli/                                  # NUEVO workspace
  package.json            # bin: { "vertrex": "./bin/run" }
  bin/run
  src/commands/<recurso>/<acción>.ts
  src/lib/{api-client,config,output,auth-store}.ts
  AGENT.md
  README.md
src/app/api/v1/**                     # API de agente (en la app)
src/lib/api/{auth,rbac,errors,serializers,audit}.ts   # helpers compartidos
src/lib/db/schema.ts                  # + tabla apiTokens (+ migración drizzle)
.claude/skills/vertrex-os/SKILL.md    # skill de Claude que envuelve el CLI
docs/openapi/vertrex.json             # OpenAPI generado
```

## 11. Testing

- **API:** tests de integración por endpoint con Vitest (ya configurado; ver `src/lib/db/actions/__tests__/tasks.test.ts`), incluyendo casos de permisos (autorizado / sin permiso / token revocado).
- **CLI:** tests de comando con el harness de oclif contra una API mockeada + unos pocos e2e contra BD de prueba.
- **Contrato:** snapshot test de `vertrex commands --json` y validación del OpenAPI.
- Mantener verde: `npm run typecheck && npm run lint && npm run build`.

## 12. Fases / hitos

1. **Fase 0 — Cimientos:** tabla `apiTokens` + migración; helpers `src/lib/api/*` (auth de token, RBAC guard, errores, audit); scaffolding OpenAPI.
2. **Fase 1 — MVP:** endpoints + comandos del §9.1; `vertrex login`/`whoami`/`commands`/`do`; `AGENT.md`; skill `vertrex-os`; tests del núcleo. **Entregable usable por tu agente.**
3. **Fase 2 — Cobertura:** módulos del §9.2.
4. **Fase 3 — Avanzado/opcional:** §9.3.

## 13. Riesgos y preguntas abiertas

- **Docs stale:** el README menciona `src/lib/os-api-router.ts` y `os-route-renderer.ts` que **no existen**. El agente ejecutor debe ignorarlos y basarse en este spec.
- **2FA en CLI:** el flujo OTP por terminal debe probarse bien (usa `otpauth`, ya presente).
- **Acoplamiento de tipos:** el MVP mantiene el CLI desacoplado (solo tipos del contrato HTTP). No importar internals del app Next.
- **Distribución del binario:** npm privado vs release de GitHub → decidir antes de Fase 1 final.
- **Coste/seguridad de `do` (intent):** usa OpenAI; acotar prompt y validar la acción resultante antes de ejecutar (preferir `--dry-run` por defecto en `do`).
- **Workspaces:** la raíz no es workspace hoy; añadir `"workspaces": ["cli"]` con cuidado de no romper el build de Next.

## 14. Definición de "hecho" (Fase 1)

Un agente con una cuenta de servicio puede, **solo con el CLI** y respetando permisos: autenticarse, listar/crear/actualizar/mover/asignar/cerrar tareas, gestionar proyectos/clientes/agenda/notas, buscar y leer actividad — con toda mutación auditada — y descubrir todos los comandos vía `vertrex commands --json`. `typecheck`, `lint`, `build` y tests en verde.
