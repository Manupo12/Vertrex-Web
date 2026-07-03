# Bot de Telegram notificador de tareas — Plan de implementación

> **For agentic workers:** SUB-SKILL RECOMENDADA: `superpowers:subagent-driven-development` o `superpowers:executing-plans`. Pasos con checkbox (`- [ ]`).
>
> Idioma del producto: **español** (toda la copy de los mensajes de Telegram y la UI en español).

**Goal:** Un bot de Telegram que vive en el grupo del equipo y avisa, mencionando con `@` a cada responsable, cuando: (a) se le asigna una tarea, (b) tiene tareas vencidas (resumen diario), (c) tiene tareas que vencen hoy/mañana, y (d) hay tareas activas sin responsable.

**Architecture:** Integración **solo saliente (outbound)** sobre la infraestructura existente. Un módulo profundo `src/lib/telegram/` encapsula el cliente del Bot API y el armado de mensajes. La lógica de "qué notificar" vive en un módulo `task-digest` consumido por **dos adaptadores**: un endpoint HTTP (`/api/cron/telegram`) para cuando se despliegue, y un **script standalone** (`scripts/telegram-cron.ts`) que corre por el cron de la PC local SIN necesitar el servidor Next levantado. La notificación "al asignar" se engancha en las server actions de tareas que ya existen. No hay webhook ni URL pública: el bot solo hace `POST` a `api.telegram.org`.

**Tech Stack:** Node/TypeScript, Telegram **Bot API** (HTTP, sin librería externa — `fetch` nativo), Drizzle ORM + Postgres (Neon), Next.js 15 (route handler para el cron HTTP), `tsx` (ya instalado) para el script local, `date-fns` (ya instalado) para fechas/zona horaria, Vitest para tests. **No se añade webhook ni dependencias de runtime nuevas.**

---

## Contexto verificado en el código (2026-06-27)

- **No existe nada de Telegram aún** (greenfield).
- **Punto único de notificación:** `src/lib/notifications/service.ts` → `pushNotification({ userId, type, title, body, targetType, targetId, sendEmail })` crea fila en `notifications` y manda email opcional. **NO lo sobrecargamos** (es per-usuario/DM); el aviso al grupo es semántica distinta y va por el módulo `telegram`.
- **Las server actions de tareas ya notifican** al asignar: `createTaskAction` (`src/lib/db/actions/tasks.ts:60-70`) y `assignTaskAction` (`tasks.ts:195-200`) ya llaman `pushNotification`. Son los puntos de enganche para el aviso "al asignar".
- **Patrón de cron existente:** `src/app/api/cron/reminders/route.ts` valida `Authorization: Bearer ${CRON_SECRET}`. Lo replicamos para el endpoint HTTP opcional.
- **Esquema relevante** (`src/lib/db/schema.ts`): `users` (id, name, email, `preferences` jsonb — **sin** campos de Telegram todavía); `tasks` (id, identifier, title, state, assigneeId, projectId, dueDate); `projects` (status). Estados de tarea válidos: `backlog, todo, in_progress, in_review, done, cancelled`.
- **Email provider** como referencia de estilo (config por env): `src/lib/email/provider.ts` (`sendEmail`).

## Global Constraints

- **Solo outbound.** Nada de webhook, polling ni rutas públicas de entrada. El bot únicamente envía mensajes.
- **Hosting local (PC) por ahora.** Los crons los dispara el `crontab`/programador de la PC ejecutando `scripts/telegram-cron.ts`. El endpoint HTTP `/api/cron/telegram` se crea igual (mismo código compartido) para el día que se despliegue, pero NO es la vía principal hoy.
- **Zona horaria:** `America/Bogota`. El "resumen diario" y "hoy/mañana" se calculan en esa zona.
- **Mención real:** se usa el `@username` de Telegram del miembro (texto plano; Telegram auto-enlaza y notifica si el usuario está en el grupo). Si un miembro no tiene `@username` configurado, se usa su nombre sin `@` y se incluye una nota para que un admin lo configure.
- **Secretos en `.env.local`** (NO commitear): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_GROUP_CHAT_ID`, `CRON_SECRET` (ya existe). Añadir también a `.env.local.example` con valores vacíos.
- **Idempotencia/anti-spam:** los crons corren **una vez al día** (resumen). No re-notificar la misma tarea en cada corrida. "Al asignar" se dispara una vez por evento, de forma natural.
- **Verificación por fase:** `npm run typecheck`, `npm run lint`, `npx vitest run` en verde.

---

## FASE 0 — Cliente de Telegram (módulo profundo) + prueba de conexión

**Objetivo:** un módulo que sabe hablar con el Bot API y armar menciones; verificable de inmediato enviando un mensaje de prueba al grupo.

### Task 0.1 — Configuración y secretos

**Files:**
- Modify: `.env.local` (local, no commitear) y `.env.local.example`

- [ ] **Step 1:** Crear el bot con **@BotFather** en Telegram → obtener `TELEGRAM_BOT_TOKEN`. Añadir el bot al grupo del equipo como miembro (y, si el grupo restringe, darle permiso de enviar mensajes). **Desactivar "Group Privacy"** no es necesario (solo enviamos, no leemos).
- [ ] **Step 2:** Obtener el `chat_id` del grupo: enviar cualquier mensaje en el grupo y consultar `https://api.telegram.org/bot<TOKEN>/getUpdates`; el `chat.id` del grupo es un número **negativo** (ej. `-1001234567890`). Guardarlo en `TELEGRAM_GROUP_CHAT_ID`.
- [ ] **Step 3:** Añadir a `.env.local`:
  ```
  TELEGRAM_BOT_TOKEN=123456:ABC...
  TELEGRAM_GROUP_CHAT_ID=-1001234567890
  TELEGRAM_NOTIFICATIONS_ENABLED=true
  ```
  Y a `.env.local.example` las mismas claves con valor vacío + comentario.
- [ ] **Step 4:** Commit solo del `.env.local.example`: `git add .env.local.example && git commit -m "chore(telegram): variables de entorno de ejemplo"`

### Task 0.2 — Cliente del Bot API

**Files:**
- Create: `src/lib/telegram/client.ts`
- Test: `src/lib/telegram/__tests__/client.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // src/lib/telegram/client.ts
  export function isTelegramEnabled(): boolean;
  /** Envía un mensaje al grupo configurado. Lanza si falla y el bot está habilitado. */
  export async function sendGroupMessage(text: string): Promise<{ ok: boolean; messageId?: number }>;
  ```

- [ ] **Step 1:** Test (mockear `global.fetch`): `sendGroupMessage("hola")` hace `POST` a `https://api.telegram.org/bot<token>/sendMessage` con body `{ chat_id, text, disable_web_page_preview: true }`; si `TELEGRAM_NOTIFICATIONS_ENABLED!=="true"` devuelve `{ ok:false }` sin llamar fetch; si la API responde `ok:false` lanza error legible.
- [ ] **Step 2:** Correr → FAIL. `npx vitest run src/lib/telegram/__tests__/client.test.ts`
- [ ] **Step 3:** Implementar con `fetch` nativo. Leer `TELEGRAM_BOT_TOKEN`/`TELEGRAM_GROUP_CHAT_ID` de `process.env`. `isTelegramEnabled()` = flag `==="true"` y token y chat_id presentes. Sin `parse_mode` (texto plano: las menciones `@user` se auto-enlazan). Timeout defensivo (`AbortController`, ~8s). Reintento simple (1 reintento ante error de red).
- [ ] **Step 4:** Correr → PASS.
- [ ] **Step 5:** Commit `feat(telegram): cliente del Bot API (sendGroupMessage)`.

### Task 0.3 — Prueba de conexión (script de humo)

**Files:**
- Create: `scripts/telegram-ping.ts`

- [ ] **Step 1:** Script que importa `sendGroupMessage` y manda `"✅ Vertrex Bot conectado al grupo."`.
- [ ] **Step 2:** Ejecutar: `npx tsx scripts/telegram-ping.ts` y **confirmar que el mensaje llega al grupo**. (Verificación manual real, no asumida.)
- [ ] **Step 3:** Commit `chore(telegram): script de prueba de conexión`.

**Criterio de aceptación Fase 0:** llega un mensaje real al grupo desde la PC.

---

## FASE 1 — Mapeo miembro ↔ Telegram (admin pone el @username)

### Task 1.1 — Columna `telegramUsername` en `users`

**Files:**
- Modify: `src/lib/db/schema.ts` (tabla `users`)
- Migration: generada por Drizzle

- [ ] **Step 1:** Añadir a `users`: `telegramUsername: text("telegram_username")` (nullable). (Opcional, para la Fase 2 con comandos del futuro: `telegramUserId: text("telegram_user_id")` — déjalo previsto pero no obligatorio.)
- [ ] **Step 2:** `npm run db:generate` → revisar el SQL en `drizzle/`. Luego `npm run db:migrate`.
- [ ] **Step 3:** `npm run typecheck`.
- [ ] **Step 4:** Commit `feat(db): users.telegram_username`.

### Task 1.2 — Acción para guardar el @username + normalización

**Files:**
- Create/Modify: `src/lib/db/actions/team.ts` → `setTelegramUsernameAction`
- Create: `src/lib/telegram/mention.ts`
- Test: `src/lib/telegram/__tests__/mention.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // src/lib/telegram/mention.ts
  /** Normaliza "@Juan", "Juan", "https://t.me/Juan" → "juan" (sin @, minúsculas). "" si inválido. */
  export function normalizeTelegramUsername(raw: string): string;
  /** Devuelve "@juan" si hay username, o el nombre a secas si no. */
  export function mentionFor(user: { name: string; telegramUsername: string | null }): string;
  // src/lib/db/actions/team.ts
  export async function setTelegramUsernameAction(userId: string, raw: string): Promise<void>; // admin only
  ```

- [ ] **Step 1:** Test de `normalizeTelegramUsername` (varios formatos) y `mentionFor` (con y sin username).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar `mention.ts`. Implementar `setTelegramUsernameAction` con guarda admin (usar `requireAdminUser` o `defineAction({module:"team",level:"admin"})` si ya existe la costura), normalizar antes de guardar, auditar con `logActivity` (verb `telegram_linked`).
- [ ] **Step 4:** PASS + `npm run typecheck`.
- [ ] **Step 5:** Commit `feat(team): vincular @username de Telegram por miembro`.

### Task 1.3 — UI admin para el @username

**Files:**
- Modify: `src/app/os/team/[userId]/` (ficha del miembro) — añadir campo "Usuario de Telegram"
- Reference: patrón de formularios existentes en team

- [ ] **Step 1:** Input con el `@username` actual, botón guardar → llama `setTelegramUsernameAction`. Mostrar ayuda: "Sin @, debe estar en el grupo del equipo". Toast de éxito/error.
- [ ] **Step 2:** Verificación manual: guardar y recargar persiste.
- [ ] **Step 3:** Commit `feat(team): UI para @username de Telegram`.

**Criterio de aceptación Fase 1:** cada miembro puede tener su `@username` guardado desde el OS.

---

## FASE 2 — Aviso "al asignar una tarea" (tiempo real)

> Engancha en las acciones que YA notifican. Requiere el servidor Next corriendo (en local, mientras trabajas). Si no está corriendo, la tarea igual será capturada por el resumen diario de la Fase 3.

### Task 2.1 — Notificador de asignación al grupo

**Files:**
- Create: `src/lib/telegram/notify-tasks.ts`
- Test: `src/lib/telegram/__tests__/notify-tasks.test.ts`

**Interfaces:**
- Consumes: `sendGroupMessage` (0.2), `mentionFor` (1.2).
- Produces:
  ```ts
  export async function notifyTaskAssigned(params: {
    assignee: { id: string; name: string; telegramUsername: string | null };
    task: { identifier: string; title: string; dueDate: Date | null };
    assignedByName: string;
  }): Promise<void>;
  ```

- [ ] **Step 1:** Test: arma un texto que incluye `mentionFor(assignee)`, el `identifier`, el `title` y, si hay `dueDate`, "vence el …". Si Telegram está deshabilitado, no lanza (no-op).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar. Mensaje ejemplo:
  ```
  📌 Nueva tarea para @juan
  WEB-42 · Rediseñar el header
  🗓 Vence: vie 4 jul
  Asignada por María
  ```
  Envolver en try/catch que loguea pero **no rompe** la server action si Telegram falla.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(telegram): aviso de asignación al grupo`.

### Task 2.2 — Enganchar en `createTaskAction` y `assignTaskAction`

**Files:**
- Modify: `src/lib/db/actions/tasks.ts` (`createTaskAction:60-70`, `assignTaskAction:195-200`)

- [ ] **Step 1:** Tras el `pushNotification` existente en cada acción (cuando hay `assigneeId` y es distinto del actor), cargar el `assignee` (con `telegramUsername`) y llamar `notifyTaskAssigned(...)`. Reusar el nombre del actor (`user`/`requireOsUser`) como `assignedByName`.
- [ ] **Step 2:** Verificación manual: asignar una tarea a un miembro con `@username` → llega el aviso al grupo mencionándolo.
- [ ] **Step 3:** `npm run typecheck` + tests de tasks.
- [ ] **Step 4:** Commit `feat(tasks): disparar aviso Telegram al asignar`.

**Criterio de aceptación Fase 2:** asignar una tarea publica y menciona en el grupo en tiempo real (con la app corriendo).

---

## FASE 3 — Resumen diario: vencidas / por vencer / sin responsable

### Task 3.1 — Módulo `task-digest` (lógica pura de qué notificar)

**Files:**
- Create: `src/lib/telegram/task-digest.ts`
- Test: `src/lib/telegram/__tests__/task-digest.test.ts`

**Interfaces:**
- Consumes: `db`, `tasks`/`users`/`projects` (schema), `mentionFor`.
- Produces:
  ```ts
  export type DigestSection = { kind: "overdue"|"due_soon"|"unassigned"; lines: string[]; count: number };
  /** Consulta la BD y devuelve las secciones (no envía nada). `now` inyectable para tests. */
  export async function buildTaskDigest(now?: Date): Promise<DigestSection[]>;
  /** Arma el texto final del mensaje del grupo a partir de las secciones. "" si no hay nada. */
  export function renderDigest(sections: DigestSection[]): string;
  ```

- [ ] **Step 1:** Tests con datos sembrados (BD de test o mocks del `db`):
  - **Vencidas:** `dueDate < now` y `state NOT IN (done, cancelled)` → agrupadas por responsable, cada línea menciona al responsable.
  - **Por vencer:** `dueDate` entre hoy 00:00 y mañana 23:59 (America/Bogota) y no done/cancelled.
  - **Sin responsable:** `assigneeId IS NULL` y la tarea pertenece a un `project` con `status="active"` (o sin proyecto pero no archivada — definir: solo proyectos activos).
  - `renderDigest([])==="" ` (nada que decir → no se manda mensaje).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar las queries Drizzle (un `select` por sección, con `leftJoin` a `users` para el responsable y a `projects` para filtrar activos). Agrupar por responsable. `renderDigest` produce algo como:
  ```
  📋 Resumen de tareas — vie 27 jun

  🔴 Vencidas (3)
  @juan — WEB-12 Migrar API (venció hace 2 d)
  @ana — APP-7 Tests E2E (venció ayer)

  🟠 Vencen pronto (2)
  @juan — WEB-15 Deploy (hoy)

  ⚪ Sin responsable (1)
  INBOX-9 Revisar contrato → ¿quién la toma?
  ```
  Usar `date-fns` con zona `America/Bogota` para los cálculos y el formato.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(telegram): task-digest (vencidas/por vencer/sin responsable)`.

### Task 3.2 — Runner compartido + adaptador script (PC local)

**Files:**
- Create: `src/lib/telegram/run-digest.ts` (`export async function runDailyDigest(): Promise<{ sent: boolean; sections: number }>` → `buildTaskDigest` + `renderDigest` + `sendGroupMessage`)
- Create: `scripts/telegram-cron.ts` (adaptador CLI: llama `runDailyDigest`, imprime resultado, `process.exit`)
- Test: `src/lib/telegram/__tests__/run-digest.test.ts`

- [ ] **Step 1:** Test de `runDailyDigest`: si el digest está vacío → no llama `sendGroupMessage` y `sent:false`; si hay contenido → llama una vez.
- [ ] **Step 2:** FAIL → implementar → PASS.
- [ ] **Step 3:** `scripts/telegram-cron.ts`: `import { runDailyDigest }`, ejecutar, log, salir con código 0/1. Debe funcionar con `npx tsx scripts/telegram-cron.ts` **sin** levantar el servidor Next (conecta directo a la BD vía `src/lib/db`).
- [ ] **Step 4:** Verificación manual: `npx tsx scripts/telegram-cron.ts` → llega el resumen real al grupo (o "nada que notificar" en consola si no hay tareas).
- [ ] **Step 5:** Commit `feat(telegram): runner de resumen diario + script CLI`.

### Task 3.3 — Adaptador HTTP (para despliegue futuro)

**Files:**
- Create: `src/app/api/cron/telegram/route.ts`

- [ ] **Step 1:** `GET` que valida `Authorization: Bearer ${CRON_SECRET}` (igual que `reminders/route.ts`), llama `runDailyDigest`, devuelve JSON `{ sent, sections }`.
- [ ] **Step 2:** Verificación: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/telegram` (con la app corriendo) responde y, si hay tareas, publica.
- [ ] **Step 3:** Commit `feat(api): endpoint cron de Telegram (despliegue futuro)`.

**Criterio de aceptación Fase 3:** el resumen agrupa por responsable, menciona a cada uno y no manda nada si no hay tareas.

---

## FASE 4 — Programación en la PC local

> Objetivo: que el resumen salga solo, todos los días, sin levantar el servidor.

### Task 4.1 — Cron del sistema (crontab)

**Files:**
- Create: `scripts/run-telegram-cron.sh` (wrapper que hace `cd` al repo, carga `.env.local` y ejecuta `npx tsx scripts/telegram-cron.ts`)
- Doc: añadir sección al `README.md` o `docs/` con la línea de crontab

- [ ] **Step 1:** Wrapper `run-telegram-cron.sh`:
  ```bash
  #!/usr/bin/env bash
  set -euo pipefail
  cd /mnt/datos/Proyectos/Web/Vertrex-Website
  set -a; source .env.local; set +a
  npx tsx scripts/telegram-cron.ts >> /tmp/vertrex-telegram-cron.log 2>&1
  ```
  `chmod +x scripts/run-telegram-cron.sh`.
- [ ] **Step 2:** Añadir al crontab del usuario (`crontab -e`) — ejemplo 8:00 (hora de Bogotá; ajustar a la zona del sistema de la PC):
  ```
  0 8 * * * /mnt/datos/Proyectos/Web/Vertrex-Website/scripts/run-telegram-cron.sh
  ```
  (Si la PC se apaga de noche, elige una hora en la que esté encendida.)
- [ ] **Step 3:** Probar manualmente el wrapper: `./scripts/run-telegram-cron.sh` y revisar el log + el grupo.
- [ ] **Step 4:** Commit `chore(telegram): wrapper de cron local + doc de crontab`.

> Alternativa (opcional) si prefieres no usar crontab: un mini-worker con `node-cron` (`scripts/telegram-scheduler.ts`) que quede corriendo. NO se recomienda para la PC (si se cierra, deja de correr). Crontab es más robusto.

**Criterio de aceptación Fase 4:** el resumen se envía solo a la hora fijada.

---

## FASE 5 — Robustez y pulido

### Task 5.1 — Anti-spam y mensajes largos
- [ ] Si una sección tiene muchas tareas, **paginar** el mensaje (Telegram limita ~4096 caracteres): partir en varios `sendGroupMessage` o resumir ("… y 7 más"). Test del partido.
- [ ] Confirmar que correr el cron dos veces el mismo día no duplica de forma molesta (es un resumen, es aceptable; documentarlo). Si se quiere evitar, registrar `last_digest_at` en una fila de config y saltar si ya corrió hoy.

### Task 5.2 — Miembros sin @username
- [ ] En el digest y en el aviso de asignación, si el responsable no tiene `@username`, mostrar su nombre y, **una vez al día**, una línea recordatorio al final: "⚙️ Configura el Telegram de: Pedro, Lucía (en el OS → Equipo)".

### Task 5.3 — Tolerancia a fallos
- [ ] Toda llamada a Telegram va en try/catch que **nunca** rompe una server action ni el script (loguea y sigue). Verificado en código.
- [ ] Si `TELEGRAM_NOTIFICATIONS_ENABLED!=="true"`, todo es no-op silencioso (útil en dev/local sin bot).

---

## FASE 6 — Pruebas y cierre

- [ ] `npm run typecheck` + `npm run lint` + `npx vitest run` en verde.
- [ ] **Prueba E2E manual del flujo completo:**
  1. Configurar `@username` de 2 miembros en el OS.
  2. Asignar una tarea a uno → llega aviso mencionándolo.
  3. Crear una tarea con `dueDate` de ayer y otra para hoy, y una sin responsable.
  4. Ejecutar `./scripts/run-telegram-cron.sh` → el resumen llega agrupado y mencionando.
- [ ] Documentar en `README.md`: cómo crear el bot, variables, y la línea de crontab.

---

## Resumen de archivos

```
Crear:
  src/lib/telegram/client.ts            (Bot API)
  src/lib/telegram/mention.ts           (normalizar @username, mentionFor)
  src/lib/telegram/notify-tasks.ts      (aviso al asignar)
  src/lib/telegram/task-digest.ts       (lógica de vencidas/por vencer/sin responsable)
  src/lib/telegram/run-digest.ts        (runner compartido)
  src/lib/telegram/__tests__/*          (tests)
  src/app/api/cron/telegram/route.ts    (adaptador HTTP, despliegue futuro)
  scripts/telegram-ping.ts              (prueba de conexión)
  scripts/telegram-cron.ts              (adaptador CLI para la PC)
  scripts/run-telegram-cron.sh          (wrapper crontab)
Modificar:
  src/lib/db/schema.ts                  (users.telegram_username)
  src/lib/db/actions/team.ts            (setTelegramUsernameAction)
  src/lib/db/actions/tasks.ts           (enganchar notifyTaskAssigned)
  src/app/os/team/[userId]/*            (UI del @username)
  .env.local(.example)                  (TELEGRAM_BOT_TOKEN, _GROUP_CHAT_ID, _NOTIFICATIONS_ENABLED)
```

## Decisiones tomadas (de la sesión)
- **Solo outbound** (sin webhook/comandos) — Fase 1 del bot.
- **Vinculación:** admin pone el `@username` (sin autoservicio por ahora).
- **Eventos:** al asignar, vencidas (diario), por vencer, sin responsable.
- **Hosting:** PC local; crons por `crontab` ejecutando un script `tsx` que NO requiere el servidor Next.

## Ampliaciones futuras (fuera de alcance hoy)
- Webhook + comandos (`/vincular CODIGO`, `/mistareas`) → capturaría el `telegram_user_id` para mencionar a quien no tenga `@username` (vía `text_mention`).
- Mover de la PC a Vercel Cron usando el endpoint `/api/cron/telegram` ya creado.
- DM directo a cada miembro (no solo grupo) reutilizando el mismo cliente.
- Botones inline (aceptar/posponer tarea) — requiere webhook.

## Handoff
Plan listo en `docs/superpowers/plans/2026-06-27-telegram-bot-notificador-tareas.md`. Empezar por **Fase 0** (prueba de humo: que llegue un mensaje al grupo) antes de tocar la BD. Cada tarea: verificar contra el código actual, TDD donde hay lógica pura, commits frecuentes.
