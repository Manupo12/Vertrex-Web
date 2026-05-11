# Vertrex OS V3 — Sistema de Tareas tipo Linear

**Documento hermano de:** `vertrex-os-v3-prd.md`
**Scope:** Especificación funcional y de UX detallada del módulo Proyectos V3, donde se introduce un sistema operativo de ejecución con tareas, subtareas, ciclos y grafo cross-módulo.
**Inspiración:** Linear (Cycles, Triage, Roadmap, Identifiers, Velocity), GitHub Projects (Vistas guardadas), Height (Inbox).
**No es:** Jira. No tiene épicas obligatorias, workflows configurables ni roles complejos. Es opinionado y minimalista.

---

## 1. Por qué este sistema existe

V1/V2 dejaron a Vertrex con un OS donde se podía registrar todo (clientes, proyectos, documentos, finanzas) pero **no decidir qué hacer mañana**. El equipo seguía usando un tablero externo o notas sueltas. V3 corrige esa brecha. La ejecución diaria debe vivir donde vive el grafo: dentro del OS, conectada a todo lo demás.

### Tres reglas innegociables

1. **Una tarea siempre pertenece a un proyecto.** No hay tareas huérfanas en estado estable. La excepción es la **Inbox de triage**, donde una tarea recién capturada puede vivir hasta que el equipo le asigne proyecto. Solo la inbox permite `project_id = NULL` y solo de forma transitoria.
2. **Una tarea es un nodo del grafo.** Toda tarea aparece en `entity_links` con relaciones canónicas. Esto significa que se puede conectar a documentos, ideas, repos, agenda, finanzas, clientes y tickets — todos los módulos.
3. **El estado de la tarea cuenta.** Cuando se cierra una tarea bloqueante, las tareas bloqueadas reciben notificación y se desbloquean. Cuando se cierran todas las tareas de un milestone, el milestone se marca como `completed`. El sistema observa, no solo registra.

---

## 2. Modelo de Datos

### 2.1 Tabla `tasks`

```
id              uuid PK
project_id      uuid references projects(id) on delete cascade   -- NULL solo en Inbox
parent_task_id  uuid references tasks(id) on delete cascade
identifier      text NOT NULL UNIQUE                              -- "VTX-142"
title           text NOT NULL
description_json jsonb NOT NULL default('{}')                     -- BlockNote JSON
state           text NOT NULL default('backlog')
priority        integer NOT NULL default(0)
estimate_points integer
assignee_id     uuid references users(id)
cycle_id        uuid references cycles(id) on delete set null
milestone_id   uuid references milestones(id) on delete set null
order_index     integer NOT NULL default(0)
due_date        timestamp
started_at      timestamp
completed_at    timestamp
created_by      uuid references users(id)
created_at      timestamp NOT NULL default(now())
updated_at      timestamp NOT NULL default(now())
```

Estados permitidos para `state`:
- `backlog` — registrado, no priorizado.
- `todo` — priorizado, listo para tomar.
- `in_progress` — alguien lo está haciendo.
- `in_review` — completo desde el ejecutor, esperando revisión/QA.
- `done` — cerrado satisfactoriamente.
- `cancelled` — descartado.

Prioridades:
- `0` = sin prioridad.
- `1` = urgente (rojo).
- `2` = alta (naranja).
- `3` = media (amarillo).
- `4` = baja (gris).

Estimates: Fibonacci sugerido (1, 2, 3, 5, 8, 13). Campo es entero libre; UI sugiere Fibonacci pero no obliga.

### 2.2 Tabla `cycles`

```
id            uuid PK
project_id    uuid NOT NULL references projects(id) on delete cascade
name          text NOT NULL
starts_at     timestamp NOT NULL
ends_at       timestamp NOT NULL
status        text NOT NULL default('planned')      -- 'planned' | 'active' | 'completed'
goal          text                                  -- meta corta de 1-2 líneas
created_at    timestamp NOT NULL
```

Reglas:
- Solo un ciclo `active` por proyecto a la vez. Al activar uno nuevo, el anterior pasa a `completed` automáticamente con timestamp.
- Cierre del ciclo: las tareas no completadas se mueven al backlog del proyecto (se desconectan del `cycle_id`) salvo que el usuario marque "Mover al siguiente ciclo" durante el cierre.

### 2.3 Tabla `milestones`

```
id            uuid PK
project_id    uuid NOT NULL references projects(id) on delete cascade
name          text NOT NULL
description   text
target_date   timestamp
status        text NOT NULL default('open')         -- 'open' | 'completed' | 'missed'
order_index   integer NOT NULL default(0)
created_at    timestamp NOT NULL
```

Reglas:
- Un milestone se marca `completed` automáticamente cuando todas sus tareas (`milestone_id`) están en estado `done` o `cancelled`.
- Un milestone se marca `missed` automáticamente cuando `target_date < hoy` y no está `completed`.
- Una finanza puede declarar `bills_for` un milestone, indicando que ese cobro está condicionado al cierre del hito. UI muestra esto explícitamente en el detalle de finanzas.

### 2.4 Tabla `tags` y `task_labels`

```
tags
id          uuid PK
slug        text NOT NULL UNIQUE
label       text NOT NULL
color       text NOT NULL default('#64748b')
scope       text NOT NULL default('global')         -- 'global' | 'project' | 'client'
scope_id    uuid
created_at  timestamp NOT NULL

task_labels
task_id   uuid NOT NULL references tasks(id) on delete cascade
tag_id    uuid NOT NULL references tags(id) on delete cascade
PRIMARY KEY (task_id, tag_id)
```

Reglas:
- `tags` es cross-módulo: puede etiquetar notas, documentos, links, recursos. Para ellos se usa `entity_links` con `relation_type='tagged_with'`.
- Para tareas se usa la tabla pivote `task_labels` por performance y para mantener integridad referencial (cascade delete).

### 2.5 Identifiers automáticos

- Cada `projects.project_key` es único, 2-5 letras mayúsculas, generado a partir del nombre del proyecto en la creación. Si colisiona, sufijo numérico.
- Al insertar una tarea, el `identifier` se calcula como `{project_key}-{N}` donde `N` es el siguiente entero por proyecto. Se garantiza unicidad global mediante el `UNIQUE` constraint y reintento en caso de colisión (race-safe usando `SELECT MAX(n)` + `INSERT ON CONFLICT DO NOTHING` o transacción serializable).

### 2.6 Conexiones cross-módulo

Toda relación de la tarea con entidades fuera de su proyecto se modela en `entity_links`:

| Cuándo | Relación | Ejemplo |
|---|---|---|
| Tarea creada en proyecto X | `belongs_to` task→project | sistema |
| Subtarea de Y | `parent_of` Y→T | sistema |
| Bloquea/bloqueada | `blocks` / `blocked_by` | manual UI |
| Asignada a U | `assigned_to` task→user | sistema |
| Tarea adjunta documento | `attaches` task→document | manual UI |
| Tarea menciona cliente | `mentions` task→client | inline `@` |
| Tarea ligada a evento agenda | `tracks` agenda→task | manual UI |
| Tarea referencia repo | `references` task→repository | manual UI |
| Tarea conectada a idea origen | `relates_to` task→idea | manual UI |
| Finanza factura tarea/hito | `bills_for` finance→task o finance→milestone | manual UI |

Las relaciones internas tarea↔ciclo y tarea↔milestone NO se replican en `entity_links` porque ya tienen FK directa (`cycle_id`, `milestone_id`). Solo se exponen en lectura cuando el sidebar del grafo construye su vista.

---

## 3. Vistas y rutas

### 3.1 Inbox global — `/os/projects/inbox`

- Renderiza todas las tareas con `project_id IS NULL` ordenadas por `created_at DESC`.
- Acción primaria: "Mover a proyecto" que abre un `Sheet` con búsqueda de proyectos.
- Acción secundaria: "Cancelar" (estado `cancelled`).
- EmptyState: "La bandeja está vacía. Presiona Ctrl+. para capturar una tarea sin destino."
- Cualquier captura rápida (`Ctrl/Cmd + .`) sin proyecto cae aquí.

### 3.2 Mis tareas — `/os/projects/mine`

- Tareas donde `assignee_id = session.userId`.
- Agrupación por defecto: por proyecto, dentro de cada proyecto por estado (`todo > in_progress > in_review > backlog`).
- Filtros: estado, prioridad, ciclo, fecha vencimiento.
- Acción primaria: "Capturar tarea" (asigna automáticamente al usuario actual).
- Ordenación por urgencia: prioridad ASC, due_date ASC, created_at DESC.
- Vista alternativa: kanban con columnas por estado.

### 3.3 Roadmap — `/os/projects/roadmap`

- Timeline horizontal de los próximos 12 meses (scroll horizontal).
- Filas: proyectos activos.
- Marcas: milestones (con color por status) y duraciones de ciclos.
- Vista de solo lectura en V3.0; edición vendrá en V3.1.

### 3.4 Detalle de proyecto — `/os/projects/[id]`

Mantiene Overview de V2 y añade tabs:
- `Tareas` → redirige a `/os/projects/[id]/tasks`.
- `Tablero` → `/os/projects/[id]/board`.
- `Ciclos` → `/os/projects/[id]/cycles`.
- `Hitos` → `/os/projects/[id]/milestones`.

En Overview, panel "Resumen de ejecución":
- Total tareas, %done, tareas en progreso, tareas bloqueadas, vencidas.
- Ciclo activo (si hay) con burndown simple.
- Próximo milestone con días restantes.

### 3.5 Lista de tareas — `/os/projects/[id]/tasks`

DataTable Linear-like:
- Columnas: identifier, title, state, priority, assignee (avatar), cycle, due_date, points, tags.
- Filtros en toolbar: estado, prioridad, asignado, ciclo, tag, hidden subtasks toggle.
- Agrupación opcional: por estado, por asignado, por ciclo, por milestone.
- Inline edit: estado, prioridad, asignado (click → menu).
- Selección múltiple → bulk actions.
- Row click: abre `Sheet` con detalle. `Shift+click`: abre página completa `/os/projects/[id]/tasks/[taskId]`.

### 3.6 Tablero kanban — `/os/projects/[id]/board`

- Columnas: `backlog | todo | in_progress | in_review | done`. `cancelled` oculto por defecto, toggle "Mostrar canceladas".
- Drag & drop entre columnas (HTML5 DnD nativo o `@dnd-kit` si ya instalado por otra razón; no obligatorio en V3.0).
- Filtros: prioridad, asignado, ciclo, milestone, tag.
- Switch: agrupar por prioridad en lugar de estado.

### 3.7 Detalle de tarea — `/os/projects/[id]/tasks/[taskId]`

Layout 2 columnas:
- **Izquierda (70%):**
  - Header sticky con identifier + título editable inline, badges estado/prioridad/ciclo, botón menú acciones (Eliminar, Duplicar, Convertir en milestone).
  - Descripción en BlockEditor con soporte de menciones `@` (proyectos, clientes, tareas, repos, docs, ideas).
  - Sección subtareas: lista compacta con checkboxes, crear inline al final.
  - Sección bloqueos: lista de `blocks` y `blocked_by`.
  - Sección comentarios: timeline cronológico con menciones.
- **Derecha (30%):**
  - Card propiedades: estado, prioridad, asignado, ciclo, milestone, due_date, estimate, tags, creado_por.
  - Card adjuntos: documentos conectados, botón subir → llama `SmartUploader` con autoconexión `attaches`.
  - Card relaciones cross-módulo: clientes, ideas, repos, agenda, finanzas (vía `EntitySidebar` filtrado).
  - Card actividad: últimos cambios de estado, asignación, comentarios.

Atajos en detalle:
- `e` editar título.
- `a` asignar.
- `s` cambiar estado.
- `p` prioridad.
- `c` agregar comentario.
- `Ctrl+Enter` guardar campo en edición.

### 3.8 Detalle de ciclo — `/os/projects/[id]/cycles/[cycleId]`

- Header con nombre, fechas, goal, status.
- Stats: scope inicial, scope agregado, completado, restante.
- Burndown chart simple (SVG inline, sin librería pesada): puntos completados vs. tiempo.
- Lista de tareas del ciclo, agrupada por estado.
- Acciones: agregar tareas (Sheet de búsqueda dentro del proyecto), activar ciclo, cerrar ciclo.

### 3.9 Hitos — `/os/projects/[id]/milestones`

- Lista cards: nombre, descripción, target_date, status, progress (tareas done / totales).
- Drag para reordenar.
- Click hito: abre Sheet con tareas del hito.

---

## 4. Flujos clave

### 4.1 Captura rápida de tarea

- Atajo `Ctrl/Cmd + .` o botón "+ Tarea" en sidebar.
- Modal mínimo con:
  - Campo único de título.
  - Selector inline opcional de proyecto (default: último usado o "Inbox").
  - Selector inline opcional de asignado (default: yo).
- Enter guarda con state=`todo`, priority=0. Quedan editables después.

### 4.2 Triage de inbox

- Vista `/os/projects/inbox`.
- Para cada tarea: botón "Mover" abre Sheet con tres campos: proyecto (obligatorio), ciclo (opcional), milestone (opcional). Botón "Cancelar" como secundaria.

### 4.3 Crear subtarea

- Desde detalle de tarea, en sección "Subtareas", input inline al final de la lista.
- Subtarea hereda `project_id` del padre.
- Identifier propio, ej. `VTX-142.1` (sufijo punto-N).

### 4.4 Marcar bloqueo

- Desde detalle, sección "Bloqueos", botón "Añadir bloqueo".
- Sheet con dos opciones: "Esta tarea bloquea otra" / "Esta tarea está bloqueada por otra".
- Búsqueda de la tarea destino dentro del mismo proyecto (default) o cross-proyecto (toggle).
- Al guardar, crea `entity_link` con relación `blocks` o `blocked_by` correspondiente.
- Si tarea destino está en estado `done`, la relación se crea pero se marca visualmente como "resuelto".

### 4.5 Mover tarea a ciclo o milestone

- Desde DataTable o detalle, dropdown inline.
- Mover a ciclo activo dispara notification al asignado.

### 4.6 Cerrar tarea con bloqueados pendientes

- Al cambiar estado a `done`, si la tarea tiene tareas `blocked_by ← esta`:
  - Confirmación: "Esta tarea desbloquea N tareas. Continuar."
  - Al confirmar, las tareas dependientes pasan a recibir notificación "Desbloqueada por X".

### 4.7 Cierre de ciclo

- Acción en detalle ciclo: "Cerrar ciclo".
- Confirmación lista tareas no completadas y pregunta destino:
  - Mover al siguiente ciclo (si existe `planned` futuro).
  - Mover al backlog del proyecto.
- Marca `status='completed'` y registra cierre en `activity`.

### 4.8 Conversión idea → proyecto (mejora V3)

V2 ya soportaba "Convertir idea en proyecto". V3 lo extiende:
- Modal al convertir pregunta si crear estructura inicial:
  - Sin tareas (default V2).
  - Desde plantilla (landing / app web / marketing).
- Las plantillas crean N tareas iniciales con relación `belongs_to` al nuevo proyecto y `relates_to` a la idea original.

---

## 5. Mentions inline `@`

Dentro del BlockEditor de descripción de tarea o de comentario:

| Sintaxis | Resultado |
|---|---|
| `@VTX-15` | Inserta tarea, crea `entity_link` `references` task→task |
| `@cliente:slug` o `@@slug` | Inserta cliente, crea `mentions` |
| `@doc:nombre` | Inserta documento |
| `@repo:owner/repo` | Inserta repositorio |
| `@nota:slug` | Inserta nota |

Implementación: el dropdown se dispara con `@` y muestra resultados de `searchEntitiesAction` con scope opcional. Al seleccionar, se inserta un nodo BlockNote tipo `mention` con `data` que apunta al id de la entidad. El backend procesa la descripción al guardar y materializa las relaciones en `entity_links`.

---

## 6. Notificaciones gatilladas por tareas

| Evento | Notification creada para |
|---|---|
| Tarea asignada a U | U |
| Asignación cambia | nuevo asignado |
| Tarea pasa a `in_review` | creador, asignado anterior si distinto |
| Comentario en tarea | autores previos del hilo + asignado actual |
| Tarea vence hoy | asignado |
| Tarea desbloqueada (bloqueante cerrado) | asignado de la tarea desbloqueada |
| Tarea movida a ciclo activo | asignado |

---

## 7. Endpoints / Server actions claves

```
src/lib/db/actions/tasks.ts
  - createTaskAction(input)
  - updateTaskAction(id, patch)
  - moveTaskToProjectAction(id, projectId, cycleId?, milestoneId?)
  - changeTaskStateAction(id, state)
  - assignTaskAction(id, userId|null)
  - setTaskPriorityAction(id, priority)
  - createSubtaskAction(parentId, input)
  - linkTaskBlocksAction(fromId, toId)
  - unlinkTaskBlocksAction(linkId)
  - listTasksAction(filters)
  - getTaskDetailAction(id)
  - bulkUpdateTasksAction(ids, patch)

src/lib/db/actions/cycles.ts
  - createCycleAction(projectId, input)
  - activateCycleAction(cycleId)
  - closeCycleAction(cycleId, opts)
  - addTasksToCycleAction(cycleId, taskIds)

src/lib/db/actions/milestones.ts
  - createMilestoneAction(projectId, input)
  - updateMilestoneAction(id, patch)
  - completeMilestoneAction(id)  // manual, normalmente automático
  - addTasksToMilestoneAction(milestoneId, taskIds)

src/lib/db/actions/tags.ts
  - createTagAction
  - tagTaskAction(taskId, tagId)
  - untagTaskAction(taskId, tagId)
  - tagEntityAction(entityId, entityType, tagId)  // cross-módulo
```

Reglas comunes:
- Todas las actions exigen `requireOsUser()`.
- Todas las que mutan disparan `activity` correspondiente.
- Cambios sensibles para portal (ej. comentario público) no se exponen desde tareas; eso pasa por aprobaciones (entidad separada).

---

## 8. API MCP V3 para tareas

`GET /api/mcp/tasks?since=ISO` retorna:
```json
{
  "tasks": [
    {
      "id": "...",
      "identifier": "VTX-142",
      "title": "Implementar autenticación de portal multiusuario",
      "project": { "id": "...", "key": "VTX", "name": "Vertrex OS" },
      "state": "in_progress",
      "priority": 2,
      "assignee": { "id": "...", "name": "Manu" },
      "cycle": { "id": "...", "name": "Sprint 18" },
      "milestone": null,
      "due_date": "2026-05-20T00:00:00.000Z",
      "subtasks_count": 3,
      "blocks": [{ "id": "...", "identifier": "VTX-145" }],
      "blocked_by": [],
      "updated_at": "2026-05-11T13:42:01.000Z"
    }
  ],
  "since": "2026-05-11T00:00:00.000Z",
  "now": "2026-05-11T18:00:00.000Z"
}
```

`POST /api/mcp/intent` recibe intents tipo:
```json
{ "intent": "create_task", "payload": { "project_key": "VTX", "title": "...", "assignee_email": "manu@vertrex.com" } }
{ "intent": "move_task", "payload": { "identifier": "VTX-142", "state": "in_progress" } }
{ "intent": "comment", "payload": { "identifier": "VTX-142", "body": "..." } }
```
En V3.0 retorna `501 Not Implemented` documentado; en V3.1 se implementa para OpenClaw.

---

## 9. UX micro-decisiones específicas

### 9.1 Identifier visual
- En cualquier listado, el identifier va a la izquierda en monospace y color muted (#94a3b8). Click copia al portapapeles con toast "Copiado VTX-142".
- En URL de detalle, se acepta `/os/projects/[id]/tasks/[taskId]` Y también `/t/VTX-142` (shortcut redirect server-side).

### 9.2 Densidad
- Default `comfortable`: row height 44px.
- Toggle a `compact`: 32px. Persistente en `users.preferences` (campo nuevo `preferences jsonb`).

### 9.3 Drag & drop
- Kanban: drag entre columnas dispara `changeTaskStateAction`.
- Lista agrupada por asignado: drag a otra zona reasigna.
- Roadmap: no drag en V3.0.

### 9.4 Empty states específicos
- Inbox: "Sin tareas para triage. Presiona Ctrl+. para capturar."
- Mis tareas: "Estás al día." con ilustración suave.
- Lista proyecto vacía: "No hay tareas aún. Crea la primera o importa desde plantilla."
- Tablero vacío: "Crea la primera tarea para activar el tablero."

### 9.5 Estados con texto humano (portal y notificaciones)
| `state` | Texto humano portal |
|---|---|
| `backlog` | "En lista de espera" |
| `todo` | "Pendiente" |
| `in_progress` | "En desarrollo" |
| `in_review` | "En revisión" |
| `done` | "Listo" |
| `cancelled` | "Cancelado" |

---

## 10. Definición de "terminado" para esta spec

El módulo Proyectos V3 con sistema de tareas se considera terminado cuando:

1. Existen las tablas `tasks`, `cycles`, `milestones`, `tags`, `task_labels` con índices.
2. Toda mutación de tarea inserta `activity` y, cuando aplica, `notifications`.
3. El grafo (`entity_links`) refleja `belongs_to`, `parent_of`, `blocks`, `assigned_to`, `cycled_in` automáticamente.
4. Las rutas `/os/projects/inbox`, `/os/projects/mine`, `/os/projects/roadmap`, `/os/projects/[id]/tasks`, `/os/projects/[id]/board`, `/os/projects/[id]/cycles`, `/os/projects/[id]/cycles/[cycleId]`, `/os/projects/[id]/milestones` y `/os/projects/[id]/tasks/[taskId]` existen y cumplen su UX spec.
5. Captura rápida (`Ctrl+.`), atajos en detalle (`e/a/s/p/c`) y atajos de navegación (`g+t`) funcionan.
6. Mentions `@` resuelven entidades y materializan relaciones en `entity_links` al guardar.
7. Cierre de ciclo, cierre automático de milestone, cierre de tarea con bloqueados gatillan los efectos descritos en Secciones 4 y 6.
8. MCP `GET /api/mcp/tasks` retorna el contrato JSON definido en Sección 8.
9. `npm run typecheck && npm run build` pasan sin errores.
10. Las rutas pasan el `vertrex-os-v3-ux-checklist.md`.
