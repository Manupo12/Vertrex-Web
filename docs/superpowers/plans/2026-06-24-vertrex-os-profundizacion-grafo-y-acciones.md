# Vertrex OS — Plan de profundización: Registro de Entidades, Grafo real y Costura de Acciones

> **For agentic workers:** SUB-SKILL RECOMENDADA: usar `superpowers:subagent-driven-development` (un subagente fresco por tarea) o `superpowers:executing-plans`. Los pasos usan checkbox (`- [ ]`).
>
> Idioma del producto: **español** (toda la copy de UI y mensajes al usuario en español).

**Goal:** Convertir el "core" relacional de Vertrex OS (hoy superficial y duplicado) en módulos profundos —un Registro de Entidades, un Motor de Grafo tipado y una Costura de Acciones unificada (actor + auditoría + permisos)— y sobre esa base sanear acción-por-acción el OS interno y el portal del cliente, eliminando stubs, huecos de auth y features falsas.

**Architecture:** Hoy el mapeo `tipo de entidad → tabla → {búsqueda, etiqueta, subtítulo, href}` está copiado a mano en 4+ sitios; las relaciones (`entity_links`) son genéricas pero el grafo que las consume es de 1 salto, estático y ciego al tipo de relación; y las server actions aplican auth/auditoría/permisos de forma inconsistente. El plan introduce **un solo módulo profundo por concepto** (Registro de Entidades, Registro de Relaciones, wrapper de acciones) y colapsa los call-sites superficiales sobre ellos. Luego usa esos módulos como apoyo para arreglar cada feature.

**Tech Stack:** Next.js 15 (App Router, Server Actions, `"use server"`), React 19, Drizzle ORM + Postgres (Neon), `@xyflow/react` (React Flow), Zod 4, Tailwind 4, Vitest + Testing Library, Playwright (e2e). Auth: JWT en cookie (`jose`) + tokens personales (`api_tokens`) + `AsyncLocalStorage` (actor seam).

---

## ⚠️ REGLA DE ORO PARA EL EJECUTOR

1. **NO confíes en los `.md` de auditoría de la raíz** (`AUDITORIA_*.md`, `MEJORAS_*.md`, `ROADMAP_*.md`, `PRD_*.md`, `PRODUCTION_READINESS.md`). Están **desactualizados** y describen bugs que ya se arreglaron (p. ej. afirman que el detalle de tareas es read-only — es **falso**, hoy es totalmente editable). Trátalos como ruido histórico.
2. **La única fuente de verdad es el código actual.** Antes de cada tarea, **abre los archivos citados y verifica `file:line`**. Si la realidad no coincide con lo descrito aquí, ajusta y deja una nota en el commit. Este plan se escribió leyendo el código el 2026-06-24, pero el repo se mueve.
3. **No re-implementes lo que ya funciona.** El módulo de Tareas (CRUD, detalle editable, máquina de estados, bloqueos, subtareas, notificaciones, recálculo de progreso con `progressMode`) está sano. Solo se tocan sus huecos puntuales listados aquí.
4. **Plan-first:** este documento fue producido por un agente arquitecto. Quien ejecuta hace el código. No hagas commits a `main` directamente sin pedirlo; trabaja en rama o worktree.

---

## Global Constraints (verificado en código, respétalo en cada tarea)

- **El actor seam ya existe.** `src/lib/auth/session.ts` → `requireOsUser()` primero consulta `getInjectedActor()` (`src/lib/auth/actor-context.ts`) y, si no hay actor inyectado, cae a la cookie. Los tokens personales se resuelven con `resolveActorFromToken` (`src/lib/db/actions/api-tokens.ts`). **No rompas esta cadena**: cualquier wrapper de acciones debe seguir pasando por `requireOsUser()`/`requirePortalClient()`.
- **Dos enums de tipos de entidad DEBEN permanecer sincronizados** hasta que el Registro los unifique: `entityTypeEnum` en `src/lib/db/schema.ts:5-30` (24 valores) y `ENTITY_TYPES` en `src/lib/db/actions/graph-types.ts:1-26`. El valor de BD (`pgEnum`) no se puede cambiar sin migración Drizzle.
- **El portal usa su propia costura de auth:** `requirePortalClient(slug)` (`src/lib/auth/portal.ts`). Las acciones disparadas desde el portal NO deben usar `requireOsUser`.
- **Toda mutación debe quedar auditada** en la tabla `activity` vía `logActivity` (`src/lib/activity/log.ts`) y, cuando aplique, emitir notificación vía `pushNotification` (`src/lib/notifications/service.ts`).
- **Drizzle:** cambios de esquema → `npm run db:generate` y `npm run db:migrate` (config `drizzle.config.ts`). Nunca edites SQL de `drizzle/` a mano.
- **Verificación base de cada fase:** `npm run typecheck` (tsc --noEmit) y `npm run lint` deben pasar. Tests: `npx vitest run`. E2E: `npx playwright test`.
- **Estética:** sigue el sistema visual existente (variables `var(--color-*)`, componentes en `src/components/ui` y `src/components/os`). No introduzcas un design system nuevo.

---

# PARTE I — Reporte de arquitectura: oportunidades de profundización

> Esta es la salida que normalmente iría en el reporte HTML de la skill `improve-codebase-architecture`, embebida aquí en texto. Vocabulario de diseño usado con precisión: **módulo, interfaz, implementación, profundidad, profundo/superficial, costura (seam), adaptador, apalancamiento (leverage), localidad (locality)**.
>
> Leyenda de los diagramas: `█` = módulo profundo · `▢` = módulo superficial · `→` llamada · `⇢ (rojo)` = fuga a través de la costura · `· · ·` = costura.

## Candidato 1 — Registro de Entidades  ·  **Strong**  ·  `in-process`

**Archivos involucrados**
```
src/lib/db/actions/graph-types.ts      (ENTITY_TYPES — enum duplicado)
src/lib/db/schema.ts:5-30              (entityTypeEnum — enum duplicado)
src/lib/db/actions/search.ts:29-75     (17 bloques inline tipo→tabla→display)
src/lib/db/actions/graph.ts:96-134     (17 resolveType — misma tabla→display)
src/lib/db/actions/mentions.ts:34      (m.props.type as any → linkEntities)
src/app/portal/[slug]/page.tsx:24-34   (resuelve conexiones por tipo a mano)
src/lib/activity/log.ts:8              (targetType: any — sin tipar)
```

**Problema** — El conocimiento "qué tabla, qué columnas se buscan, cómo se etiqueta y a qué URL navega cada tipo de entidad" está **copiado a mano en al menos 4 lugares**. Añadir un tipo de entidad (o cambiar un `href`) obliga a editar todos. La interfaz de cada call-site es tan ancha como su implementación: es **superficial**, y la lógica de presentación **se fuga** por todas las costuras.

**Solución** — Un único **módulo profundo** `entity-registry`: un mapa `EntityType → EntityDescriptor` donde cada descriptor declara `table`, `searchColumns`, y un proyector `toResult(row) → { label, subtitle, href }`. `search`, `graph`, `mentions` y el dashboard del portal se reducen a iterar el registro.

**Antes**
```
search.ts   ▢──┐
graph.ts    ▢──┤   cada uno reimplementa
portal page ▢──┤   tipo→tabla→{label,subtitle,href}   ⇢⇢ presentación fugada x4
mentions.ts ▢──┘
```
**Después**
```
                 ┌──────────────────────────────┐
search.ts   →    │  ███ entity-registry ███      │
graph.ts    →    │  EntityType → {table,         │
portal page →    │   searchColumns, toResult}    │
mentions.ts →    └──────────────────────────────┘
                  una interfaz, N call-sites
```

**Wins**
- locality: el mapeo vive en un módulo, los bugs se concentran ahí.
- leverage: una interfaz, 4+ consumidores; nuevo tipo = 1 descriptor.
- la interfaz encoge; la implementación absorbe los 4 bloques.
- prueba de borrado: ✅ borrarlo concentra complejidad (los 4 dispatchers colapsan).
- tipa `logActivity`/`comments`/`approvals`/`notifications.targetType` desde un solo lugar.

## Candidato 2 — Motor de Grafo (relaciones tipadas + explorador)  ·  **Strong**  ·  `in-process`

**Archivos involucrados**
```
src/lib/db/actions/graph.ts                    (linkEntities, relationType = string libre)
src/components/os/Graph/EntityGraph.tsx        (radial, 1 salto, ignora relationType)
src/components/os/Graph/EntitySidebar.tsx
src/components/os/actions/EntityConnectSheet.tsx
src/app/os/projects/[id]/tasks/[taskId]/page.tsx:22-25  (consulta "blocked_by" — nadie lo crea)
src/lib/db/actions/tasks.ts:230-238            (linkTaskBlocksAction escribe solo "blocks")
```

**Problema** — La tabla `entity_links` es genérica y está bien, pero todo lo que la consume es **superficial**: `EntityGraph` dibuja un radial de **1 solo salto**, **ignora `relationType`** (todas las aristas se ven igual), es **estático** (no se crea/expande/borra desde el lienzo) y solo está cableado en 2 páginas. `relationType` es texto libre con convenciones dispersas (`relates_to`, `blocks`, `mentions`) y sin inversa: la página de tarea consulta `relationType="blocked_by"` que **ningún código escribe** → el panel "Bloqueada por" jamás se llena. El "core de grafo" del producto no existe como experiencia.

**Solución** — (a) Un **Registro de Relaciones** que tipa cada `relationType` con su etiqueta, dirección e inversa (`blocks`⇄`blocked_by`, `mentions`⇄`mentioned_by`, `relates_to` simétrica). (b) Profundizar `EntityGraph` para que lea ese registro (aristas etiquetadas y dirigidas), permita **expandir nodos (multi-salto)** y **crear/borrar conexiones desde el lienzo**. (c) Un **explorador global** del grafo en `/os/graph` (hoy no existe).

**Antes**                                   **Después**
```
   ▢ EntityGraph (1 salto, mudo)             █ Motor de Grafo
        ↑ relates_to? blocks? mentions?        - aristas tipadas (registro)
        (todas iguales, sin dirección)         - expandir N saltos
   bug: "blocked_by" se consulta              - crear/borrar en lienzo
        pero nunca se escribe  ⇢ (rojo)       - /os/graph global
```

**Wins**
- leverage: una semántica de relación, consumida por grafo + tarea + portal.
- locality: la inversa `blocks⇄blocked_by` se define una vez (arregla el bug de raíz).
- el grafo pasa de adorno a herramienta navegable (el "core" prometido).
- prueba de borrado: ✅ el registro de relaciones concentra la convención hoy dispersa.

## Candidato 3 — Costura de Acciones (actor + auditoría + permisos + envelope)  ·  **Strong**  ·  `in-process`

**Archivos involucrados**
```
src/lib/db/actions/*.ts        (~40 server actions con guardas inconsistentes)
src/lib/db/actions/rbac.ts     (enforceAccess existe… casi nadie lo usa)
src/lib/auth/permissions.ts    (requireModuleAccess)
src/lib/activity/log.ts        (logActivity manual, opcional)
src/lib/auth/session.ts        (requireOsUser / requireAdminUser)
```

**Problema** — Cada acción reimplementa su propio preámbulo: unas llaman `requireOsUser()`, otras no (p. ej. `setTaskPriorityAction` en `tasks.ts:205` **no tiene guarda de auth**); la auditoría (`logActivity`) se llama a mano y de forma desigual; `enforceAccess`/`modulePermissions` (RBAC por módulo) **existe pero las acciones siguen usando `requireOsUser`/`requireAdminUser`**, así que los permisos por módulo no se aplican. La política transversal está **fugada** dentro de cada implementación.

**Solución** — Una **costura** `defineAction` (wrapper de orden superior) que envuelve cada server action y aplica, declarativamente: resolución de actor → chequeo de permiso de módulo → ejecución → auditoría → envelope de error uniforme. La acción concreta solo contiene su lógica de dominio.

**Antes**                                  **Después**
```
cada acción:                               defineAction({ module:"projects",
  requireOsUser()? (a veces)                 audit:"task.priority", level:"write" },
  enforceAccess()? (casi nunca)              (input, actor) => { ...dominio... })
  logActivity()? (desigual)
  try/catch propio (o ninguno)             █ una costura, política en un lugar
  ⇢ política fugada en ~40 sitios
```

**Wins**
- locality: auth + permisos + auditoría en un módulo; las acciones quedan flacas.
- leverage: activar RBAC real = configurar el wrapper, no editar 40 archivos.
- cierra huecos de auth de raíz (imposible olvidar la guarda).
- la interfaz del dominio encoge; el wrapper absorbe el preámbulo.

## Candidato 4 — Consolidar las dos superficies de API de agente  ·  **Worth exploring**  ·  `ports & adapters`

**Archivos involucrados**
```
src/app/api/mcp/{graph,tasks,activity,intent}/route.ts   (V3 antiguo, "Stub V3.0")
src/app/api/v1/**/route.ts                                (superficie nueva y rica)
src/app/os/settings/page.tsx:77-100                       (pestaña MCP apunta al viejo)
```

**Problema** — Coexisten **dos costuras de agente**: `/api/mcp/*` (4 rutas, etiquetadas "Stub V3.0") y `/api/v1/*` (auth por token, clients/projects/tasks/agenda/notes/activity/search/intent/commands). Dos adaptadores que hacen lo mismo = confusión y deriva. La pestaña de Settings documenta el viejo.

**Solución** — Declarar `/api/v1/*` **canónica**. Convertir `/api/mcp/*` en alias delgados que reusan los mismos handlers, o deprecarla. Actualizar la pestaña MCP de Settings para apuntar a `/api/v1` y reflejar el `intent`/`commands` reales (ya no son stub).

**Wins**
- "dos adaptadores justifican la costura" — aquí no se justifican: uno sobra.
- leverage: una sola superficie que mantener para el agente que opera el OS.

## 🏆 Recomendación principal

Empezar por el **Candidato 1 (Registro de Entidades)**. Es la pieza de mayor apalancamiento: desbloquea de inmediato búsqueda, grafo, menciones y portal, y le da tipos al resto del sistema. El Candidato 3 (Costura de Acciones) es el segundo cimiento. Con ambos en su sitio, el Candidato 2 (Grafo real) y todo el saneamiento de módulos se vuelven mecánicos.

---

# PARTE II — Plan de ejecución por fases

Orden elegido (de cimiento a hoja): **Fase 0** Registro de Entidades → **Fase 1** Costura de Acciones → **Fase 2** Motor de Grafo real → **Fase 3** Consolidar API de agente + Settings reales → **Fase 4** Saneamiento del OS módulo-por-módulo (verify-driven) → **Fase 5** Portal del cliente a fondo → **Fase 6** Calidad y QA.

Cada fase produce software funcionando y testeable por sí sola. Commits frecuentes. TDD donde haya lógica pura.

---

## FASE 0 — Registro de Entidades (módulo profundo)

**Objetivo:** un solo módulo declara, por cada `EntityType`, su tabla, columnas de búsqueda y proyección de presentación. `search`, `graph`, `mentions` y el portal se colapsan sobre él.

### Task 0.1 — Crear el módulo `entity-registry` con su interfaz y descriptores

**Files:**
- Create: `src/lib/entities/registry.ts`
- Test: `src/lib/entities/__tests__/registry.test.ts`
- Reference (leer, no romper): `src/lib/db/actions/graph-types.ts`, `src/lib/db/actions/search.ts:29-75`, `src/lib/db/actions/graph.ts:96-134`

**Interfaces:**
- Produces:
  ```ts
  // src/lib/entities/registry.ts
  import type { EntityType } from "@/lib/db/actions/graph-types";
  export type EntityDisplay = { label: string; subtitle: string; href: string };
  export type EntityDescriptor<TRow = any> = {
    type: EntityType;
    table: any;                 // tabla drizzle
    searchColumns: any[];       // columnas para ilike
    toDisplay: (row: TRow) => EntityDisplay;
    portalVisible?: boolean;    // usado en Fase 5
  };
  export const ENTITY_REGISTRY: Partial<Record<EntityType, EntityDescriptor>>;
  export function getDescriptor(type: EntityType): EntityDescriptor | undefined;
  export function listSearchableDescriptors(): EntityDescriptor[];
  ```

- [ ] **Step 1: Escribir test que falla** — el registro cubre todos los tipos resolubles hoy y proyecta bien.
  ```ts
  // src/lib/entities/__tests__/registry.test.ts
  import { describe, it, expect } from "vitest";
  import { ENTITY_REGISTRY, getDescriptor } from "@/lib/entities/registry";

  describe("entity-registry", () => {
    it("incluye los tipos resolubles del grafo actual", () => {
      const required = ["client","project","document","legal","note","idea","resource",
        "finance","agenda","repository","link","social_account","team_member","ticket",
        "task","cycle","milestone","tag"] as const;
      for (const t of required) expect(getDescriptor(t), `falta ${t}`).toBeTruthy();
    });
    it("proyecta un cliente a label/subtitle/href", () => {
      const d = getDescriptor("client")!;
      const out = d.toDisplay({ id: "x", name: "ACME", slug: "acme" });
      expect(out).toEqual({ label: "ACME", subtitle: "Cliente (acme)", href: "/os/crm/acme" });
    });
  });
  ```
- [ ] **Step 2: Correr y ver fallar** — `npx vitest run src/lib/entities/__tests__/registry.test.ts` → FAIL (módulo no existe).
- [ ] **Step 3: Implementar el registro.** Portar **literalmente** los mismos `label/subtitle/href` que hoy producen `search.ts` y `graph.ts` (cópialos verbatim de `graph.ts:116-133` para no cambiar comportamiento). Un descriptor por tipo. `searchColumns` = las columnas que hoy usa `search.ts` por tipo (p. ej. `client`: `[clients.name, clients.slug]`).
- [ ] **Step 4: Correr y ver pasar.** `npx vitest run src/lib/entities/__tests__/registry.test.ts` → PASS.
- [ ] **Step 5: Commit.** `git add src/lib/entities && git commit -m "feat(entities): registro de entidades (tipo→tabla→display)"`

### Task 0.2 — Reescribir `searchEntitiesAction` sobre el registro

**Files:**
- Modify: `src/lib/db/actions/search.ts`
- Test: `src/lib/db/actions/__tests__/search.test.ts` (crear)

**Interfaces:**
- Consumes: `listSearchableDescriptors()`, `getDescriptor()` (Task 0.1).
- Produces: misma firma pública `searchEntitiesAction(query): Promise<SearchResult[]>` y mismo `SearchResult` (no cambiar — lo consumen `CommandMenu`, `EntityConnectSheet`, `MentionInput`, `RepoMentionPicker`, `api/v1/search`, `api/v1/intent`).

- [ ] **Step 1:** Test: una búsqueda devuelve resultados con `type/label/subtitle/href` y respeta el filtro especial `is:task` (hoy en `search.ts:26`) y los operadores `assignee:/priority:/state:/project:/due:<Nd` (`search.ts:82-121`). Conserva ese parser de tareas tal cual.
- [ ] **Step 2:** Correr → FAIL.
- [ ] **Step 3:** Reemplazar los 17 bloques inline (`search.ts:29-75`) por un bucle sobre `listSearchableDescriptors()` que arma `ilike(or(...searchColumns))` y mapea con `toDisplay`. **Mantén intacto** el bloque de tareas con operadores (es lógica de dominio específica, no presentación).
- [ ] **Step 4:** Correr → PASS. Además `npm run typecheck`.
- [ ] **Step 5:** Commit `refactor(search): colapsar dispatch sobre entity-registry`.

### Task 0.3 — Reescribir `getResolvedEntityConnections` sobre el registro

**Files:**
- Modify: `src/lib/db/actions/graph.ts:78-137`
- Test: `src/lib/db/actions/__tests__/graph.test.ts` (crear)

**Interfaces:**
- Consumes: `getDescriptor()`.
- Produces: misma firma `getResolvedEntityConnections(entityId): Promise<ResolvedConnection[]>` (lo consume `EntitySidebar`, `projects/[id]/page.tsx`, `links/[id]/page.tsx`).

- [ ] **Step 1:** Test con `entity_links` sembradas → resuelve label/subtitle/href correctos y conserva `linkId/relationType/isSource`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Reemplazar las 18 llamadas `resolveType(...)` (`graph.ts:115-134`) por un bucle: agrupar por tipo, para cada tipo `getDescriptor(type)`, `select` por `inArray(table.id, ids)`, mapear con `toDisplay`. Borrar el helper `resolveType` interno.
- [ ] **Step 4:** PASS + `npm run typecheck`.
- [ ] **Step 5:** Commit `refactor(graph): resolver conexiones vía entity-registry`.

### Task 0.4 — Tipar `logActivity` y materializar menciones vía registro

**Files:**
- Modify: `src/lib/activity/log.ts:8` (`targetType: any` → `EntityType`)
- Modify: `src/lib/db/actions/mentions.ts:24-37`

- [ ] **Step 1:** Cambiar `targetType: any` por `targetType: EntityType` (import desde `graph-types`). Corregir cualquier call-site que rompa `typecheck`.
- [ ] **Step 2:** En `materializeMentions`, validar `m.props.type` contra `getDescriptor(...)` antes de `linkEntities`; descartar menciones a tipos desconocidos (hoy hace `as any` ciego).
- [ ] **Step 3:** `npm run typecheck` → PASS.
- [ ] **Step 4:** Commit `refactor(activity,mentions): tipar targetType con entity-registry`.

**Criterio de aceptación Fase 0:** `search.ts` y `graph.ts` ya no contienen listas de 17 tablas; añadir un tipo de entidad es 1 descriptor; `npm run typecheck`, `npm run lint`, `npx vitest run` verdes.

---

## FASE 1 — Costura de Acciones (actor + auditoría + permisos + envelope)

**Objetivo:** una sola costura aplica auth, permisos por módulo, auditoría y manejo de error uniforme. Cierra huecos de auth y enciende RBAC real sin tocar 40 archivos a mano.

### Task 1.1 — Crear `defineAction` (wrapper de orden superior)

**Files:**
- Create: `src/lib/actions/define-action.ts`
- Test: `src/lib/actions/__tests__/define-action.test.ts`

**Interfaces:**
- Consumes: `requireOsUser` (`session.ts`), `requireModuleAccess` (`permissions.ts`), `logActivity` (`activity/log.ts`).
- Produces:
  ```ts
  type ActionMeta = {
    module?: "finances"|"resources"|"legal"|"crm"|"projects"|"marketing"|"agenda"|"links"|"hub"|"team"|"settings"|"documents";
    level?: "read"|"write"|"admin";
    audit?: { verb: string; targetType: EntityType };  // opcional
  };
  export function defineAction<I, O>(
    meta: ActionMeta,
    fn: (input: I, ctx: { actor: OsSession }) => Promise<O>
  ): (input: I) => Promise<O>;
  ```

- [ ] **Step 1:** Test: (a) sin actor → la acción no ejecuta el dominio y lanza/redirige como `requireOsUser`; (b) con `module` + `level`, llama `requireModuleAccess`; (c) si `audit` está, tras éxito inserta en `activity` con `verb/targetType` y `actorId` del actor; (d) pasa `input` y `ctx.actor` a `fn`. Usa mocks de `session`/`permissions`/`activity`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar: resolver actor → si `meta.module` → `requireModuleAccess(actor.userId, module, level)` → `const out = await fn(input,{actor})` → si `meta.audit` y `out` tiene `id`, `logActivity(...)` → return. Mantén la semántica de `requireOsUser` (que ya cubre actor inyectado del CLI).
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(actions): defineAction (actor+rbac+audit seam)`.

### Task 1.2 — Cerrar el hueco de auth en `setTaskPriorityAction` (y barrido)

**Files:**
- Modify: `src/lib/db/actions/tasks.ts:205-209`
- Reference: salida del barrido (abajo)

- [ ] **Step 1:** Añadir `await requireOsUser();` al inicio de `setTaskPriorityAction` (hoy no la tiene) y `logActivity` (verb `priority_changed`).
- [ ] **Step 2: Barrido de huecos.** Ejecutar y revisar **a mano** cada resultado (el grep da falsos positivos en multi-línea y en getters legítimamente públicos):
  ```bash
  grep -L "require\(OsUser\|AdminUser\|ModuleAccess\)\|requirePortalClient\|getOsSession\|enforceAccess\|enforceAdmin" src/lib/db/actions/*.ts
  ```
  Para cada **mutación** sin guarda, añadir la guarda correcta. Getters de solo lectura usados por componentes server ya autenticados pueden quedarse, pero documenta por qué en el commit.
- [ ] **Step 3:** `npm run typecheck` + `npx vitest run src/lib/db/actions/__tests__/tasks.test.ts`.
- [ ] **Step 4:** Commit `fix(actions): cerrar huecos de auth en mutaciones`.

### Task 1.3 — Migrar acciones sensibles a `defineAction` + RBAC real

**Files:**
- Modify (incremental, por módulo): `src/lib/db/actions/{finances,resources,legal,team,marketing,crm,projects}.ts`

- [ ] **Step 1:** Migrar primero las acciones de módulos sensibles (`finances`, `resources`/vault, `legal`, `team`) a `defineAction({ module, level, audit })`. Una acción a la vez, corriendo `typecheck` entre cada una.
- [ ] **Step 2:** Verificar que la UI sigue funcionando (las firmas públicas no deben cambiar; `defineAction` devuelve una función con la misma firma de input/output).
- [ ] **Step 3:** Confirmar que `modulePermissions` ahora se aplica: con un usuario sin permiso de `finances`, la acción debe rechazar. (Test de integración o verificación manual con un usuario `team` sin permiso.)
- [ ] **Step 4:** Commit por módulo: `refactor(<módulo>): mover acciones a defineAction + RBAC`.

> Nota: NO es necesario migrar las ~40 acciones en esta fase. Migra las sensibles ahora; el resto puede migrar de forma oportunista en la Fase 4 cuando toques cada módulo.

**Criterio de aceptación Fase 1:** ninguna mutación sin guarda; `defineAction` cubierta por tests; RBAC por módulo demostrablemente aplicado en al menos finances/resources/legal/team.

---

## FASE 2 — Motor de Grafo real

**Objetivo:** relaciones tipadas con inversa, arreglar el bug `blocked_by`, y un grafo navegable (expandible, editable, con explorador global).

### Task 2.1 — Registro de Relaciones (tipos + inversa + etiqueta)

**Files:**
- Create: `src/lib/entities/relations.ts`
- Test: `src/lib/entities/__tests__/relations.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type RelationType = "relates_to"|"blocks"|"blocked_by"|"mentions"|"mentioned_by";
  export type RelationDef = { type: RelationType; label: string; inverse: RelationType; symmetric: boolean };
  export const RELATION_REGISTRY: Record<RelationType, RelationDef>;
  export function inverseOf(t: RelationType): RelationType;
  ```

- [ ] **Step 1:** Test: `inverseOf("blocks")==="blocked_by"`, `inverseOf("relates_to")==="relates_to"` (simétrica), `mentions⇄mentioned_by`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar el registro.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(entities): registro de relaciones con inversa`.

### Task 2.2 — Arreglar el bug "Bloqueada por" de raíz

**Contexto verificado:** `tasks.ts:230` (`linkTaskBlocksAction`) escribe **solo** un link `relationType:"blocks"`. Pero `tasks/[taskId]/page.tsx:24-25` consulta `relationType:"blocked_by"`, que **nadie escribe** → ese panel nunca se llena. Hay que decidir una representación y hacerla consistente.

**Files:**
- Modify: `src/lib/db/actions/tasks.ts:230-244`
- Modify: `src/app/os/projects/[id]/tasks/[taskId]/page.tsx:22-37`

- [ ] **Step 1:** Test: crear un bloqueo A→B y verificar que (a) en A aparece "esta tarea bloquea B" y (b) en B aparece "bloqueada por A", **sin** depender de dos filas. Decisión recomendada: **una sola fila `blocks` (A→B)**; "bloqueada por" se deriva consultando links donde `targetId == taskId AND relationType=="blocks"` (no `"blocked_by"`).
- [ ] **Step 2:** FAIL (hoy consulta `blocked_by`).
- [ ] **Step 3:** En `page.tsx`, cambiar la query de `blockedByLinks` a `eq(relationType,"blocks")` con `targetId==taskId` (en vez de `"blocked_by"`). Ajustar el mapeo `blockedByTasks` (source = quien bloquea). Dejar `linkTaskBlocksAction` escribiendo solo `"blocks"`.
- [ ] **Step 4:** PASS + verificación manual en `/os/projects/[id]/tasks/[taskId]`.
- [ ] **Step 5:** Commit `fix(graph): derivar "bloqueada por" de links blocks (elimina relationType fantasma)`.

### Task 2.3 — `EntityGraph` lee el registro de relaciones (aristas tipadas)

**Files:**
- Modify: `src/components/os/Graph/EntityGraph.tsx`
- Modify: `src/lib/db/actions/graph.ts` (incluir `relationType` en `ResolvedConnection` — ya lo expone)

- [ ] **Step 1:** Pasar `relationType` a cada `conn` y renderizar `label` de arista con `RELATION_REGISTRY[rel].label`; dirección según la semántica (no según `isSource` ciego). Color de arista por tipo (p. ej. rojo para `blocks`).
- [ ] **Step 2:** Verificación manual: en un proyecto con conexiones de varios tipos, las aristas muestran su etiqueta y dirección.
- [ ] **Step 3:** Commit `feat(graph): aristas tipadas y dirigidas en EntityGraph`.

### Task 2.4 — Crear/borrar conexiones desde el lienzo + expandir nodos

**Files:**
- Modify: `src/components/os/Graph/EntityGraph.tsx`
- Reuse: `src/components/os/actions/EntityConnectSheet.tsx` (ya hace search+linkEntities), `linkEntities`/`unlinkEntity` (`graph.ts`)

- [ ] **Step 1:** Botón por nodo "expandir" → llama una nueva action `getResolvedEntityConnections(nodeId)` y añade ese vecindario al lienzo (multi-salto incremental). Evitar duplicar nodos (set por id).
- [ ] **Step 2:** Acción en arista "quitar conexión" → `unlinkEntity(linkId)` con confirmación (`ConfirmActionDialog`). Acción en nodo central "conectar" → reusar `EntityConnectSheet`.
- [ ] **Step 3:** Verificación manual: expandir 2 saltos, crear y borrar una conexión, refrescar y persistir.
- [ ] **Step 4:** Commit `feat(graph): expandir multi-salto + crear/borrar conexiones en lienzo`.

### Task 2.5 — Explorador global de grafo `/os/graph`

**Files:**
- Create: `src/app/os/graph/page.tsx`
- Create: `src/app/os/graph/GraphExplorer.tsx`
- Reuse: `getGraphSnapshot()` (`graph.ts:71`) + entity-registry para etiquetar nodos
- Modify: `src/components/os/layout/Sidebar.tsx` (añadir entrada "Grafo")

- [ ] **Step 1:** Página server que carga `getGraphSnapshot()` y resuelve etiquetas de nodos vía registro (en lote, no N+1: agrupar ids por tipo). Pasar nodos+aristas al cliente.
- [ ] **Step 2:** `GraphExplorer` cliente: React Flow con todo el grafo, filtros por `EntityType` y por `relationType`, búsqueda para centrar un nodo, layout con `fitView`. Para grafos grandes, limitar nodos iniciales y cargar vecindarios bajo demanda.
- [ ] **Step 3:** Añadir "Grafo" al `Sidebar`.
- [ ] **Step 4:** Verificación manual en `/os/graph`.
- [ ] **Step 5:** Commit `feat(graph): explorador global en /os/graph`.

**Criterio de aceptación Fase 2:** aristas tipadas; "bloqueada por" se llena; se puede expandir/crear/borrar desde el lienzo; existe `/os/graph` navegable.

---

## FASE 3 — Consolidar API de agente + Settings reales

### Task 3.1 — `/api/v1` canónica; `/api/mcp` alias o deprecada

**Files:**
- Modify: `src/app/api/mcp/{graph,tasks,activity,intent}/route.ts`
- Reference: `src/app/api/v1/**/route.ts`

- [ ] **Step 1:** Decidir (recomendado): convertir cada `route.ts` de `/api/mcp/*` en un reexport/handler delgado que llama la lógica de `/api/v1/*` equivalente, **o** responder `308` a la ruta v1. No duplicar lógica.
- [ ] **Step 2:** Verificar con `curl` que ambas rutas devuelven lo mismo (o redirigen).
- [ ] **Step 3:** Commit `refactor(api): /api/v1 canónica, /api/mcp como alias`.

### Task 3.2 — Settings: arreglar pestaña Integraciones y MCP

**Files:**
- Modify: `src/app/os/settings/page.tsx:43-100`

- [ ] **Step 1: Integraciones.** Hoy muestra "Conectado (OAuth2)"/"Activo" **hardcodeado** (`:49`, `:59`) y "Renovar token" sin `onClick` (`:51`). Reemplazar por estado real: comprobar presencia de credenciales (Drive/GitHub) y mostrar Conectado/Desconectado según realidad; el botón debe disparar una acción real o, si no hay flujo, ocultarse.
- [ ] **Step 2: MCP.** Actualizar la pestaña para apuntar a `/api/v1/*`, quitar el rótulo "Stub V3.0" del intent (ya existe `/api/v1/intent` y `/api/v1/commands` reales) y enlazar la gestión de tokens (`/api/v1/auth/tokens`).
- [ ] **Step 3:** Verificación manual + `typecheck`.
- [ ] **Step 4:** Commit `fix(settings): estado real de integraciones y MCP→v1`.

### Task 3.3 — Settings: verificar persistencia de Notificaciones/Apariencia

**Files:**
- Read+verify: `src/app/os/settings/SettingsNotifications.tsx`, `src/app/os/settings/SettingsAppearance.tsx`, `src/lib/db/actions/settings.ts`

- [ ] **Step 1:** Abrir cada componente y comprobar si **persisten** (a `users.preferences` jsonb) o son decorativos. `settings.ts` hoy solo expone `changePasswordAction`.
- [ ] **Step 2:** Si son decorativos: crear `updateUserPreferencesAction(prefs)` (vía `defineAction`, escribe `users.preferences`) y cablear los toggles. Si ya persisten, marcar la tarea como verificada y seguir.
- [ ] **Step 3:** Commit `feat(settings): persistir preferencias de usuario` (si aplica).

---

## FASE 4 — Saneamiento del OS módulo-por-módulo (verify-driven)

> **Cómo ejecutar esta fase:** para cada módulo, primero **lee los archivos y verifica el estado real** (no asumas los bugs viejos). Luego, para cada criterio de aceptación que NO se cumpla, crea sub-tareas TDD/verify→fix. Usa el inventario de acciones existentes para no reinventar. Aprovecha para migrar las acciones de ese módulo a `defineAction` (Fase 1).

**Inventario de acciones por módulo (verificado 2026-06-24)** — úsalo como mapa:
- `crm.ts`: create/update Client, generatePin, getBySlug, bulkDelete, getClientGraphSummary
- `projects.ts`: create/update, referenceLinks add/remove, getById, hasPaidAdvance
- `finances.ts`: create/markPaid/exportCSV/update/delete, monthlySummary, getById, generateInvoice, getProjectPnL
- `agenda.ts`: createEvent, connectEntity, updateEvent, getUpcomingReminders
- `documents.ts`: privacy, folders, move, uploadVersion, shareToken create/revoke
- `legal.ts`: updateSettings, createTemplate, generateFromTemplate, requestSignature
- `marketing.ts`: socialAccount CRUD, revealPassword, contentPlan, hashtags, stats/engagement
- `links.ts`: saveExternalRef, repo status/priority/readme, link reading status, collections, quickSave
- `hub.ts`: quickCapture, knowledgeNote CRUD, idea status/score, convertToProject, dailyNote
- `team.ts`: member CRUD, role, deactivate, status, workload, modulePermissions get/set
- `resources.ts`: create/reveal, connectEntity, rotation, folders, visibility, exportVault
- `tags.ts`, `cycles.ts`, `milestones.ts`, `comments.ts`, `approvals.ts`, `saved-views.ts`, `portal-users.ts`

### Task 4.1 — CRM
**Criterios de aceptación (verificar y, si falta, implementar):**
- [ ] Las bulk actions de la lista (`src/app/os/crm/CrmList.tsx`) ejecutan acciones reales (etiquetar/eliminar), no `console.log`. Verifica el estado actual antes de tocar.
- [ ] El `SavedViewBar` del CRM usa `listSavedViewsAction` real, no `mockViews`.
- [ ] Activación formal cliente→portal: al crear cliente con PIN se puede provisionar portal user (`portal-users.ts`).
- [ ] `getClientGraphSummary` se muestra en la ficha del cliente.

### Task 4.2 — Finanzas
- [ ] CRUD completo cableado en UI (create/update/delete/markPaid existen en `finances.ts`).
- [ ] `generateInvoiceAction` produce un PDF/registro real (revisar `src/lib/pdf`, `src/lib/finance`).
- [ ] `getProjectPnLAction` y `getMonthlyFinanceSummary` se muestran en `/os/finances`.
- [ ] Export CSV (`exportFinancesCSVAction`) accesible desde la UI.
- [ ] Migrar acciones a `defineAction({module:"finances"})`.

### Task 4.3 — Agenda
- [ ] Eventos recurrentes (`recurrenceRule`, lib `rrule` ya instalada) se **expanden** en la vista de calendario, no solo como icono.
- [ ] `reminderMinutes` se respeta por el cron de recordatorios (`src/app/api/cron/reminders`).
- [ ] Integración Google Calendar: revisar `src/app/api/cron/calendar-sync` y `externalProvider/externalId` en `agenda_events`.

### Task 4.4 — Documentos
- [ ] Versionado (`uploadDocumentVersionAction`) y carpetas (`FolderTree`) funcionan end-to-end.
- [ ] Share tokens (`createShareTokenAction`/`revokeShareTokenAction`) generan enlaces en `/share/[token]` con expiración real.
- [ ] Privacidad (`updateDocumentPrivacyAction`) controla visibilidad en portal.

### Task 4.5 — Marketing
- [ ] Content plan CRUD + calendario (`/os/marketing/calendar`) operativos.
- [ ] `revealSocialPasswordAction` exige re-auth/registro de acceso (es dato sensible).
- [ ] Hashtags y stats cableados.

### Task 4.6 — Links / Hub
- [ ] `quickSaveAction` + `loadRepositoryReadmeAction` (GitHub) funcionan; estado real de token GitHub.
- [ ] Hub: `convertIdeaToProject`, daily notes, idea score cableados en UI.

### Task 4.7 — Legal (OS)
- [ ] `generateLegalFromTemplateAction` **guarda el HTML resultante** (revisar que no guarde solo `sizeBytes`). Verifica el estado actual en `legal.ts`.
- [ ] `requestSignatureAction` **envía email real** al firmante (Resend ya instalado; ver `src/lib/email`). Hoy puede solo marcar un flag.

### Task 4.8 — Team / Admin
- [ ] UI para asignar `modulePermissions` (`setModulePermissionAction`/`getModulePermissionsAction` existen) en `/os/team/[userId]` o `/os/admin`.
- [ ] Invitación por email a nuevos miembros (en vez de teclear contraseña a mano).
- [ ] Reset/recuperación de contraseña end-to-end (endpoints `/api/auth/forgot-password`, `/reset-password` existen — verificar que la UI los use).
- [ ] 2FA: verificar que `loginTeam` valide el TOTP cuando el usuario lo tenga activo (`src/lib/auth/two-factor.ts`, `/api/auth/2fa/*`).

> Cada sub-tarea: TDD donde haya lógica pura; verificación manual donde sea UI; commit por criterio cumplido.

---

## FASE 5 — Portal del cliente a fondo

### Task 5.1 — Bug de visibilidad: portal legal muestra documentos de OTROS clientes
**Contexto verificado:** `src/app/portal/[slug]/legal/page.tsx` trae **TODOS** los `legalDocuments` con `isPublic=true` ("For V3 spec simplicity"), no los del cliente. Mismo riesgo a auditar en files/finances/approvals del portal.

**Files:** `src/app/portal/[slug]/legal/page.tsx`, `src/app/portal/[slug]/files/page.tsx`, `src/app/portal/[slug]/page.tsx`

- [ ] **Step 1:** Test/verificación: con 2 clientes, cada uno solo ve SUS documentos.
- [ ] **Step 2:** Filtrar por `entity_links` (cliente↔documento/legal/finance) usando el patrón del dashboard (`portal/[slug]/page.tsx:24-34`), idealmente vía un helper del entity-registry `getPortalEntitiesForClient(clientId, type)` que centralice esa resolución (reusa el registro de Fase 0; marca `portalVisible` en descriptores).
- [ ] **Step 3:** Verificación manual con dos slugs distintos.
- [ ] **Step 4:** Commit `fix(portal): aislar documentos por cliente vía entity_links`.

### Task 5.2 — Firma legal real desde el portal
**Contexto verificado:** `src/app/portal/[slug]/legal/LegalView.tsx:20` — "In a real implementation this would call a server action pointing to /api/portal/signature". La firma no persiste de verdad.

**Files:** `LegalView.tsx`, `src/app/api/portal/signature/route.ts` (existe — verificar), `src/lib/db/actions/legal.ts`, tabla `signatures`

- [ ] **Step 1:** Verificar qué hace hoy `/api/portal/signature`. 
- [ ] **Step 2:** Cablear `SignaturePad` → POST a `/api/portal/signature` → inserta en `signatures` (con `clientId`, `portalUserId`, `ipAddress`, `userAgent`, `pdfHash`), marca `legalDocuments.signedAt`, audita (`logActivity actorType:"client"`) y notifica al equipo.
- [ ] **Step 3:** Generar el PDF firmado (pdf-lib ya instalado; `src/lib/pdf`) y guardarlo (`pdfUrl`).
- [ ] **Step 4:** Verificación manual: firmar desde el portal persiste y aparece en el OS.
- [ ] **Step 5:** Commit `feat(portal): firma legal real con registro de evidencia`.

### Task 5.3 — Endurecer auth del portal en sus acciones
- [ ] Verificar que las acciones disparadas desde el portal (`respondApprovalFromPortalAction`, tickets, account, signature) validen `requirePortalClient(slug)` y que el recurso pertenece a ese cliente (no solo que exista). Aprovecha el patrón de `defineAction` pero con guarda de portal.
- [ ] Commit `fix(portal): autorización por cliente en acciones del portal`.

### Task 5.4 — Portal: actividad, comentarios y estados vivos
- [ ] Comentarios cliente↔equipo (`comments.ts` con `authorType:"client"`) visibles en ambos lados.
- [ ] Feed de actividad del cliente (de la tabla `activity` filtrada por sus entidades).
- [ ] Verificar que tickets (`/portal/[slug]/tickets`) crean filas reales y el equipo las ve en el OS.

**Criterio de aceptación Fase 5:** cada cliente solo ve lo suyo; firma legal persiste con evidencia; acciones del portal autorizadas por cliente.

---

## FASE 6 — Calidad y QA

### Task 6.1 — Tests de los módulos profundos
- [ ] Cobertura unitaria de `entity-registry`, `relations`, `defineAction` (ya creada en fases previas) + tests de `search`/`graph` colapsados.
- [ ] Test de integración: RBAC niega a un `team` sin permiso en un módulo sensible.

### Task 6.2 — E2E de los flujos críticos (Playwright)
- [ ] OS: crear proyecto → crear tarea → editar detalle → mover en tablero → conectar entidades → ver en `/os/graph`.
- [ ] Portal: login cliente → ver solo sus docs → firmar legal → abrir ticket → aprobar una solicitud.
- [ ] Correr: `npx playwright test`.

### Task 6.3 — Barrido final
- [ ] `npm run typecheck` + `npm run lint` + `npx vitest run` verdes.
- [ ] Buscar stubs restantes: `grep -rinE "real implementation|stub|hardcoded|console\.log|test_sample" src/app src/components` → cero en rutas OS/portal de producción.
- [ ] Actualizar/retirar los `.md` de auditoría obsoletos de la raíz (mover a `docs/archive/` o borrar) para que no confundan a futuros agentes.

---

## Self-review del plan (cobertura vs hallazgos)

| Hallazgo verificado | Cubierto por |
|---|---|
| Mapeo tipo→tabla→display duplicado x4 + enum duplicado | Fase 0 (0.1–0.4) |
| `relationType` libre, sin inversa | Fase 2.1 |
| Bug `blocked_by` nunca escrito | Fase 2.2 |
| `EntityGraph` 1 salto, mudo, estático; sin explorador global | Fase 2.3–2.5 |
| `setTaskPriorityAction` sin auth; auditoría/RBAC inconsistentes | Fase 1 (1.1–1.3) |
| Dos superficies de API de agente (`/api/mcp` vs `/api/v1`) | Fase 3.1 |
| Settings Integraciones decorativo; MCP apunta a viejo | Fase 3.2 |
| Portal legal muestra docs de otros clientes | Fase 5.1 |
| Firma legal del portal falsa | Fase 5.2 |
| Stubs/features falsas por módulo | Fase 4 (verify-driven) + 6.3 |
| Tareas (ya sano) | Explícitamente excluido salvo huecos puntuales |

## Handoff de ejecución

Plan listo. Opciones para ejecutarlo (no ejecutar sin tu visto bueno — tu flujo es plan-first):
1. **Subagent-driven (recomendado):** un subagente fresco por tarea con review entre tareas (`superpowers:subagent-driven-development`).
2. **Inline:** ejecución por lotes con checkpoints (`superpowers:executing-plans`).

Empezar por **Fase 0** (mayor apalancamiento). Antes de cada tarea: abrir los `file:line` citados y verificar contra el código actual.
