# Vertrex OS V3 Phase 0-1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare V3 execution by confirming scope, verifying environment readiness, and installing required dependencies for V3.0/3.1.

**Architecture:** No feature behavior is added here. This phase is strictly preflight: scope confirmation, dependency readiness, and environment verification to unblock later phases without breaking V2.

**Tech Stack:** Next.js 15, Node.js, npm, Drizzle, Resend, pdf-lib, date-fns.

---

## File map

- Verify only:
  - `docs/md/vertrex-os-v3-prd.md`
  - `docs/md/vertrex-os-v3-implementation-plan.md`
  - `docs/md/vertrex-os-v3-tasks-linear-spec.md`
  - `docs/md/vertrex-os-v3-gap-matrix.md`
  - `docs/md/vertrex-os-v3-ux-spec.md`
  - `docs/md/vertrex-os-v3-ux-implementation-plan.md`
  - `docs/md/vertrex-os-v3-quality-gate.md`
  - `docs/md/vertrex-os-v3-ux-checklist.md`
  - `docs/md/vertrex-os-prd(1).md` (V1)
  - `docs/md/vertrex-os-v2-gap-matrix.md`
  - `docs/md/vertrex-os-v2-remediation-plan.md`
  - `docs/md/vertrex-os-v2-quality-gate.md`
  - `.env.local` (no cambios)
- Modify (solo si faltan dependencias):
  - `package.json`
  - `package-lock.json`

---

### Task 1: Confirmar alcance y decisiones V3 (V3-0)

**Files:**
- Verify: `docs/md/vertrex-os-v3-prd.md`
- Verify: `docs/md/vertrex-os-v3-implementation-plan.md`
- Verify: `docs/md/vertrex-os-v3-tasks-linear-spec.md`
- Verify: `docs/md/vertrex-os-v3-gap-matrix.md`
- Verify: `docs/md/vertrex-os-v3-ux-spec.md`
- Verify: `docs/md/vertrex-os-v3-ux-implementation-plan.md`

- [ ] **Step 1: Leer PRD V3 y confirmar scope 3.0 + 3.1**

Leer `docs/md/vertrex-os-v3-prd.md` secciones 0, 2, 3, 8 y 10.
Resultado esperado: scope confirmado como V3.0 + V3.1 (incluye 3.1).

- [ ] **Step 2: Leer plan tecnico V3 y listar dependencias requeridas**

Leer `docs/md/vertrex-os-v3-implementation-plan.md` Fase V3-0 y V3-1.
Resultado esperado: lista clara de dependencias nuevas (Resend o SMTP, pdf-lib, date-fns, dnd-kit si aplica).

- [ ] **Step 3: Confirmar reglas del sistema de tareas**

Leer `docs/md/vertrex-os-v3-tasks-linear-spec.md` secciones 2, 4 y 6.
Resultado esperado: reglas de identificadores, estados y notificaciones entendidas.

- [ ] **Step 4: Registrar decisiones de implementacion**

Registrar en el log de ejecucion (o nota de trabajo) estas decisiones confirmadas:
- Email: Resend.
- Kanban: sin drag & drop (menu de cambio de estado).
- PDF: Playwright HTML -> PDF.
- OpenClaw: stub documentado (fuera por ahora).
- Calendar sync: Service Account + calendario compartido.
- Realtime: SSE in-memory por instancia.
- PWA: basica (manifest + icons + SW shell cache).
- Time tracking: manual por tarea.

Resultado esperado: decisiones registradas antes de tocar codigo.

---

### Task 2: Verificar y preparar dependencias (V3-1)

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Verificar dependencias actuales en package.json**

Abrir `package.json` y confirmar si existen:
- `resend`
- `pdf-lib`
- `date-fns`

Resultado esperado: estado de presencia identificado para cada dependencia.

- [ ] **Step 2: Instalar dependencias faltantes**

Si falta alguna, instalar solo las faltantes (no instalar dnd-kit porque no se usara):

```bash
npm install resend pdf-lib
```

Resultado esperado: `package.json` y `package-lock.json` actualizados por npm.

- [ ] **Step 3: Verificar dependencias instaladas**

```bash
npm ls resend pdf-lib date-fns
```

Resultado esperado: salida con `resend@...`, `pdf-lib@...`, `date-fns@...` y exit code 0.

- [ ] **Step 4: Commit (solo si el usuario lo solicito)**

```bash
git add package.json package-lock.json
git commit -m "chore(v3): add v3 dependencies"
```

Resultado esperado: commit creado con cambios de dependencias.

---

### Task 3: Verificar variables de entorno (V3-0)

**Files:**
- Verify: `.env.local`

- [ ] **Step 1: Validar variables base**

Abrir `.env.local` y confirmar que existen (sin imprimir valores):
- `DATABASE_URL`
- `ENCRYPTION_KEY`
- `AUTH_SECRET`
- `MCP_SECRET`

Resultado esperado: variables base presentes o registradas como faltantes.

- [ ] **Step 2: Validar variables nuevas V3**

Confirmar que existen (sin imprimir valores):
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `PORTAL_NOTIFICATIONS_ENABLED`
- `PUBLIC_APP_URL`
- `SHARE_TOKEN_DEFAULT_TTL_HOURS`
- `GOOGLE_CALENDAR_PUBLIC_ICS`

Resultado esperado: variables V3 presentes o registradas como faltantes para el owner.

---

### Task 4: Checkpoint V3-1 (dependencias)

**Files:** none

- [ ] **Step 1: Verificar dependencias nuevas**

```bash
npm ls resend pdf-lib date-fns
```

Resultado esperado: exit code 0 sin errores.

- [ ] **Step 2: Registrar estado del checkpoint**

Anotar en el log de ejecucion: "Checkpoint V3-1 OK".

---

## Verificacion final del plan

- Cobertura: V3-0 y V3-1 completas segun plan tecnico.
- Sin placeholders: cada paso incluye archivo, comando o accion concreta.
- Sin cambios a `.env.local`.
