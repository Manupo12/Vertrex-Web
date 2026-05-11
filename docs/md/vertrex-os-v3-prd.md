# PRD — Vertrex OS V3
**Versión:** 3.0
**Fecha:** Mayo 2026
**Autor:** Vertrex
**Idioma del sistema:** Español
**Moneda principal:** Peso colombiano (COP) · Soporte secundario: USD
**Estado:** Listo para implementación
**Documentos hermanos:**
- `vertrex-os-v3-tasks-linear-spec.md` — Sistema operativo de tareas tipo Linear (módulo Proyectos V3).
- `vertrex-os-v3-implementation-plan.md` — Plan técnico de migración V2 → V3.
- `vertrex-os-v3-ux-spec.md` — Especificación visual V3.
- `vertrex-os-v3-ux-implementation-plan.md` — Plan UX V3 paso a paso.
- `vertrex-os-v3-gap-matrix.md` — Matriz de gaps V2 → V3.
- `vertrex-os-v3-quality-gate.md` — Quality gate V3.
- `vertrex-os-v3-ux-checklist.md` — Checklist UX por ruta V3.

---

## 0. Cambio de paradigma V3

V1 estableció el grafo universal y los módulos base. V2 cerró rutas rotas, seguridad y UX premium. **V3 convierte el OS en una herramienta operativa diaria**, no solo un repositorio bien estructurado. Tres pilares:

1. **Ejecución diaria real:** se introduce un sistema operativo de tareas tipo Linear dentro del módulo Proyectos. Toda tarea es un nodo del grafo y puede conectarse con cualquier entidad (documentos, finanzas, ideas, repositorios, clientes, agenda).
2. **Inteligencia de contexto:** notificaciones, feed de actividad, vistas guardadas, búsqueda global y comandos por entidad. El usuario no busca: el OS le entrega lo relevante.
3. **Portal de cliente activo:** multi-usuario por cliente, aprobaciones, comentarios sobre documentos y firma simple. El portal deja de ser solo lectura.

V3 NO rompe la arquitectura del grafo de V1/V2. La extiende con nuevos tipos de entidad y nuevas relaciones semánticas.

---

## 1. Visión General V3

Vertrex OS V3 es el centro operativo de Vertrex. Sigue siendo un OS interno + portal de cliente sobre el mismo repositorio que la landing pública. La novedad clave es que toda **ejecución** (qué se hace mañana, qué bloquea qué, quién tiene qué pendiente) vive dentro del grafo, conectada a clientes, finanzas, documentos, repos, ideas y agenda.

### Principios de diseño V3
- **Todo se conecta con todo:** el grafo sigue siendo la columna vertebral. Las tareas son nodos de primera clase.
- **La ejecución es un grafo, no una lista:** una tarea puede bloquear otra, depender de un documento, gatillar una factura, vivir en un sprint y pertenecer a un cliente — todo simultáneamente.
- **Cero fricción para captura:** atajos globales, command palette, captura rápida de ideas y de tareas. La inbox de triage absorbe lo que no se sabe dónde poner.
- **El portal participa:** el cliente comenta, aprueba, firma y recibe notificaciones por email.
- **Almacenamiento inteligente:** sin cambios respecto a V1/V2. Archivos < 1.5 MB en Neon, archivos ≥ 1.5 MB en Drive vía OAuth2 Refresh Token (V2.x).
- **Single-tenant:** sigue siendo de uso exclusivo de Vertrex.

---

## 2. Arquitectura de Datos V3

### 2.1 Extensiones al grafo universal

Se añaden los siguientes valores al enum `entity_type`:

```
task            -- tarea/subtarea del sistema Linear-like
cycle           -- ciclo/sprint
milestone       -- hito de proyecto
comment         -- comentario sobre cualquier entidad
approval        -- solicitud y respuesta de aprobación
signature       -- firma electrónica simple sobre documento legal
notification    -- notificación interna o de portal
activity        -- evento del feed de actividad
saved_view      -- vista guardada de cualquier listado
tag             -- etiqueta cross-módulo
```

El total queda en `entity_type`:
`client | project | document | resource | finance | agenda | link | repository | ticket | note | idea | legal | social_account | team_member | task | cycle | milestone | comment | approval | signature | notification | activity | saved_view | tag`

### 2.2 Nuevas relaciones semánticas (`relation_type`)

Aunque la columna `relation_type` ya existía en V1, V3 estandariza un vocabulario operativo. Estas son las relaciones canónicas:

| Relación | Significado | Ejemplo |
|---|---|---|
| `relates_to` | conexión genérica | nota ↔ proyecto |
| `belongs_to` | pertenencia jerárquica | tarea → proyecto |
| `parent_of` | jerarquía padre→hijo | tarea → subtarea |
| `blocks` | bloquea ejecución | tarea A → tarea B |
| `blocked_by` | inverso de `blocks` | tarea B → tarea A |
| `duplicates` | duplicado | tarea → tarea |
| `references` | cita o usa | nota → repositorio |
| `attaches` | adjunta archivo | tarea → documento |
| `mentions` | mención inline `@entity` | nota → cliente |
| `assigned_to` | responsable | tarea → team_member |
| `created_by` | autoría | tarea → team_member |
| `commented_on` | comentario sobre | comment → cualquier entidad |
| `approves` | flujo de aprobación | approval → documento |
| `signed_by` | firma | signature → cliente |
| `tracks` | ítem de calendario | agenda → tarea |
| `bills_for` | finanza ligada a trabajo | finance → milestone |
| `became_project` | conversión de idea | idea → proyecto |
| `triggers_notification` | gatilla notificación | tarea → notification |
| `cycled_in` | pertenece a ciclo | tarea → cycle |
| `tagged_with` | etiquetado | cualquier → tag |

**Regla:** cualquier código que cree un `entity_link` debe usar `relation_type` del vocabulario anterior. Las relaciones libres (`relates_to`) siguen permitidas para conexiones manuales del usuario, pero las acciones automáticas deben usar relaciones semánticas.

### 2.3 Índices nuevos sobre `entity_links`

Además de los índices V1 `(source_id, source_type)` y `(target_id, target_type)`, añadir:

- `(relation_type)` — necesario para listados tipo "todo lo bloqueado por X".
- `(source_type, relation_type, target_type)` — necesario para queries de tipo "todas las tareas asignadas a este team_member".

---

## 3. Sistema de Tareas tipo Linear (Módulo Proyectos V3)

El módulo Proyectos pasa de ser una lista de cards con progreso a un sistema operativo de ejecución. Toda la especificación detallada vive en `vertrex-os-v3-tasks-linear-spec.md`. Aquí se resume el contrato a nivel PRD.

### 3.1 Entidades nuevas

**`tasks`**
```
id              uuid PK
project_id      uuid NOT NULL references projects(id) on delete cascade
parent_task_id  uuid references tasks(id) on delete cascade
identifier      text NOT NULL UNIQUE       -- ej. "VTX-142", autogenerado por proyecto
title           text NOT NULL
description_json jsonb NOT NULL default('{}')  -- BlockNote JSON, soporta mentions
state           text NOT NULL default('backlog')  -- 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled'
priority        integer NOT NULL default(0)  -- 0=ninguna, 1=urgente, 2=alta, 3=media, 4=baja
estimate_points integer                      -- 1, 2, 3, 5, 8 (Fibonacci opcional)
assignee_id     uuid references users(id)
cycle_id        uuid references cycles(id)
milestone_id    uuid references milestones(id)
order_index     integer NOT NULL default(0)
due_date        timestamp
started_at      timestamp
completed_at    timestamp
created_by      uuid references users(id)
created_at      timestamp NOT NULL default(now())
updated_at      timestamp NOT NULL default(now())
```

**`cycles`** (sprints)
```
id            uuid PK
project_id    uuid NOT NULL references projects(id) on delete cascade
name          text NOT NULL                -- "Sprint 1", "Semana 18"
starts_at     timestamp NOT NULL
ends_at       timestamp NOT NULL
status        text NOT NULL default('planned')  -- 'planned' | 'active' | 'completed'
created_at    timestamp NOT NULL
```

**`milestones`**
```
id            uuid PK
project_id    uuid NOT NULL references projects(id) on delete cascade
name          text NOT NULL                -- "MVP", "Launch", "Cierre 50%"
description   text
target_date   timestamp
status        text NOT NULL default('open')  -- 'open' | 'completed' | 'missed'
created_at    timestamp NOT NULL
```

**`task_labels`** (relación N:M con `tags`)
```
task_id   uuid NOT NULL references tasks(id) on delete cascade
tag_id    uuid NOT NULL references tags(id) on delete cascade
PRIMARY KEY (task_id, tag_id)
```

**`tags`** (cross-módulo, no solo tareas)
```
id          uuid PK
slug        text NOT NULL UNIQUE
label       text NOT NULL
color       text NOT NULL default('#64748b')
scope       text NOT NULL default('global')  -- 'global' | 'project' | 'client'
scope_id    uuid                              -- id del proyecto/cliente si scope != 'global'
created_at  timestamp NOT NULL
```

### 3.2 Reglas clave del sistema de tareas

- Cada tarea pertenece a **un solo** proyecto (`project_id NOT NULL`). Para colaboración cruzada se usa el grafo, no FK.
- Una subtarea (`parent_task_id`) debe pertenecer al mismo `project_id` que su padre. El árbol soporta más de un nivel (subtarea de subtarea), pero la UI por defecto sólo expone dos niveles para evitar caos.
- El `identifier` es único globalmente y sigue patrón `{PROJECT_KEY}-{N}`, donde `PROJECT_KEY` se deriva del nombre del proyecto (3 letras mayúsculas) y `N` es contador secuencial por proyecto.
- Toda tarea aparece automáticamente en el grafo como nodo `task`. Las relaciones canónicas: `belongs_to` → proyecto, `parent_of` ↔ subtareas, `assigned_to` → user, `cycled_in` → cycle, `blocks/blocked_by` ↔ otras tareas.
- Conexión cross-módulo: una tarea puede tener `entity_links` hacia documentos, finanzas, agenda, ideas, repositorios, clientes y tickets. Estas conexiones se crean desde el detalle de la tarea (`EntityConnectSheet`) o por menciones inline `@entity` en su descripción.
- El cierre de una tarea con `blocks` activos requiere confirmación (`AlertDialog`).
- El progreso de un proyecto se recalcula automáticamente: `progress = done_tasks / total_tasks * 100`, redondeado a entero. El campo manual de `projects.progress` queda como override opcional. Si el proyecto no tiene tareas, se usa el valor manual.

### 3.3 Vistas obligatorias del módulo

- **Inbox / Triage** (`/os/projects/inbox`): bandeja global de tareas sin proyecto asignado o sin estado válido. Solo este lugar permite tareas sin `project_id` durante captura rápida, antes de moverlas.
- **Mis tareas** (`/os/projects/mine`): tareas asignadas al usuario autenticado, agrupadas por proyecto y por estado.
- **Lista** (`/os/projects/[id]/tasks`): vista tabular tipo Linear.
- **Kanban** (`/os/projects/[id]/board`): columnas por `state` con drag & drop.
- **Roadmap** (`/os/projects/roadmap`): timeline de hitos y ciclos por proyecto.
- **Cycle planning** (`/os/projects/[id]/cycles/[cycleId]`): planificación de sprint.

El detalle completo de UX vive en `vertrex-os-v3-ux-spec.md` y la spec funcional en `vertrex-os-v3-tasks-linear-spec.md`.

---

## 4. Módulos del Sistema — Mejoras V3 por módulo

Esta sección lista **lo que cambia** respecto a V1/V2. Todo lo no listado se conserva igual.

### 4.1 Dashboard / Admin (`/os/admin`)

**Nuevo en V3:**
- Stat cards adicionales: tareas activas asignadas a mí, tareas vencidas globales, hitos próximos (próximos 14 días), aprobaciones pendientes.
- Panel `Mi día`: 5 tareas prioritarias del usuario + próxima reunión + próxima entrega financiera.
- Panel `Pulso del sistema`: salud DB, % almacenamiento Neon, integraciones (Drive, GitHub) con badge OK/Warn/Error.
- Feed de actividad reciente (últimos 20 eventos).

### 4.2 CRM (`/os/crm`)

**Nuevo en V3:**
- **Health score** (0-100) calculado por cliente, derivado de: status del proyecto activo, % anticipo pagado, tickets abiertos, días desde última actividad. La fórmula vive en `crm.ts` server actions.
- **Tags** globales o por cliente (`scope='client'`).
- **Multi-PIN:** cada cliente puede tener hasta 5 PINs activos, cada uno asociado a una persona del lado cliente (nombre, email, rol). Tabla nueva `client_portal_users`.
- **Timeline de actividad** por cliente: agrega eventos de proyectos, tickets, finanzas, agenda, comentarios y firmas relacionados con ese cliente.
- **Recordatorios manuales** por cliente (entidad nueva `client_reminders` ligera, no es notificación todavía hasta que se gatilla).

```
client_portal_users
id           uuid PK
client_id    uuid NOT NULL references clients(id) on delete cascade
name         text NOT NULL
email        text
role_label   text                          -- "CEO", "Gerente", "Diseñador"
pin_hash     text NOT NULL
is_active    boolean NOT NULL default(true)
created_at   timestamp NOT NULL
```

**Compatibilidad V2:** la columna `clients.pin_hash` se conserva como PIN maestro de fallback. Si un cliente solo tiene PIN maestro, sigue funcionando.

### 4.3 Proyectos (`/os/projects`)

**Cambio mayor:** ver Sección 3 y `vertrex-os-v3-tasks-linear-spec.md`. Resumen:
- Tareas y subtareas con grafo.
- Cycles y milestones.
- Progreso automático.
- Templates de proyecto (estructura de tareas predefinidas según tipo: landing, app web, marketing).

**Otras mejoras V3:**
- Soporte de **clave de proyecto** (`project_key`, ej. `VTX`, `LND`) para los identifiers de tarea.
- Vista timeline tipo Gantt simple (solo lectura) cuando hay milestones.
- `reference_links` ahora soportan iconos por tipo (figma, github, vercel, staging) y se renderizan como chips.

### 4.4 Documentos (`/os/documents`)

**Nuevo en V3:**
- **Folders / colecciones** (entidad `document_folders`) para organizar documentos por proyecto o por tipo.
- **Versionado simple:** al re-subir un archivo con el mismo nombre dentro del mismo folder, se crea una nueva fila `documents` con `version = previa+1` y se enlaza la anterior vía `entity_links` con `relation_type='version_of'`.
- **Comentarios** sobre documento (entidad `comments`).
- **Tokens de compartir** expirables (entidad `share_tokens`): permite enviar un link público con expiración para un documento puntual sin tener que dar acceso al portal.
- **Búsqueda en contenido:** para texto plano y markdown (no PDFs en V3.0, opcional V3.1).

```
document_folders
id          uuid PK
name        text NOT NULL
parent_id   uuid references document_folders(id)
created_at  timestamp NOT NULL

documents
+ folder_id   uuid references document_folders(id)
+ version     integer NOT NULL default(1)
+ parent_id   uuid references documents(id)

share_tokens
id           uuid PK
document_id  uuid NOT NULL references documents(id) on delete cascade
token        text NOT NULL UNIQUE
expires_at   timestamp NOT NULL
created_by   uuid references users(id)
created_at   timestamp NOT NULL
```

### 4.5 Legal (`/os/legal`)

**Nuevo en V3:**
- **Plantillas** con variables `{{VAR}}` reutilizando el motor del generador (Sección 4.14). Las plantillas se guardan como filas en `legal_templates`.
- **Alertas de vencimiento:** si `expires_at` existe y faltan ≤30 días, badge amarillo; ≤7 días, badge rojo; cumplida, badge gris.
- **Firma electrónica simple** (entidad `signatures`): el cliente, desde el portal, acepta términos con checkbox + nombre + IP + timestamp. Se genera un PDF firmado con metadata embebida. Sin integración con DocuSign en V3.
- **Renovación:** al marcar un documento como vencido, opción "Crear renovación" que duplica el documento como nuevo borrador.
- **Auditoría:** toda acción sobre legales (subir, firmar, marcar visible, marcar vencido) se registra en `activity` (Sección 5.4).

```
legal_documents
+ expires_at         timestamp
+ template_id        uuid references legal_templates(id)

legal_templates
id          uuid PK
name        text NOT NULL
type        text NOT NULL
body_html   text NOT NULL
variables   jsonb NOT NULL default('[]')   -- array de {key, label, required}
created_at  timestamp NOT NULL

signatures
id              uuid PK
legal_id        uuid NOT NULL references legal_documents(id) on delete cascade
signer_name     text NOT NULL
signer_email    text
client_id       uuid references clients(id)
portal_user_id  uuid references client_portal_users(id)
ip_address      text
user_agent      text
signed_at       timestamp NOT NULL default(now())
```

### 4.6 Knowledge Hub (`/os/hub`)

**Nuevo en V3:**
- **Backlinks bidireccionales:** al mencionar `[[Nota X]]` o `@nota:X` en una nota, ambas notas muestran el enlace en su sidebar. Se implementa sobre `entity_links` con `relation_type='references'`.
- **Daily notes:** ruta `/os/hub/daily/[YYYY-MM-DD]` que crea o abre una nota del día. Útil para journaling de trabajo.
- **Tags** (entidad `tags` compartida con tareas).
- **Score de ideas:** campo `score` entero (0-10) opcional, editable inline. Permite priorizar las ideas en estado `laboratorio`.
- **Evolución de idea:** timeline de cambios de `idea_status` por idea (entidad `activity`).
- **Templates de idea**: al crear una idea, opción de partir de plantilla (landing, app móvil, automatización, side project).
- **Sugerencias de `next_step`** (placeholder V3.0, real cuando OpenClaw entre): botón "Sugerir siguiente paso" que llama endpoint `/api/ai/suggest-next-step` (en V3.0 retorna stub determinista basado en `idea_status`).

### 4.7 Recursos (`/os/resources`)

**Nuevo en V3:**
- **Rotación recordada:** campo `rotation_due_at`. Si vencido, badge rojo "Rotación pendiente".
- **Categorías / carpetas** (entidad `resource_folders`).
- **Audit log** de accesos: cada vez que se llama `revealResourceAction`, se inserta un `activity` con `actor`, `resource_id`, `revealed_at`. Solo admin puede ver el log.
- **Compartir granular:** marcar quién del equipo puede ver un recurso. En V2 cualquier miembro autenticado podía revelar; en V3 se introduce `visibility = 'team' | 'admin' | 'owner'`.
- **Exportación cifrada** (admin only): genera un JSON cifrado con todos los recursos del equipo, descargable una sola vez con segundo factor opcional.

```
resources
+ rotation_due_at  timestamp
+ visibility       text NOT NULL default('team')
+ folder_id        uuid references resource_folders(id)
+ owner_id         uuid references users(id)

resource_folders
id          uuid PK
name        text NOT NULL
parent_id   uuid references resource_folders(id)
created_at  timestamp NOT NULL

resource_access_log
id            uuid PK
resource_id   uuid NOT NULL references resources(id) on delete cascade
actor_id      uuid NOT NULL references users(id)
action        text NOT NULL                -- 'reveal' | 'edit' | 'delete'
created_at    timestamp NOT NULL default(now())
```

### 4.8 Finanzas (`/os/finances`)

**Nuevo en V3:**
- **Soporte multi-moneda:** campo `currency` (`'COP' | 'USD'`). COP sigue siendo moneda principal. Conversión manual al insertar registro (no se consulta tasa en vivo).
- **Recurrencia:** campo `recurrence` (`'none' | 'monthly' | 'yearly'`). Al marcar pagado un gasto recurrente, se autoinserta el siguiente periodo en `pending`.
- **Cuentas de cobro / facturas:** generador de PDF con plantilla HTML que toma datos del proyecto y cliente. Se guarda como `legal_documents` con tipo `cuenta_cobro` y se conecta al proyecto/cliente.
- **P&L por proyecto:** vista `/os/finances/projects` que agrupa ingresos y gastos por proyecto conectado vía grafo y muestra margen.
- **Proyección de caja:** vista 90 días con ingresos pendientes y gastos recurrentes.
- **Alerta de presupuesto** opcional por proyecto: campo `projects.budget_cop`. Si suma de gastos conectados al proyecto supera 80% del budget, badge amarillo; 100%, badge rojo.
- **IVA** (Colombia): campo opcional `vat_amount_cop` y `vat_rate` para tracking básico.

```
finances
+ currency           text NOT NULL default('COP')
+ recurrence         text NOT NULL default('none')
+ next_due_date      timestamp
+ vat_amount_cop     integer NOT NULL default(0)
+ vat_rate           integer NOT NULL default(0)
+ invoice_number     text

projects
+ budget_cop         integer
+ project_key        text                   -- ej. 'VTX', autogenerado, único
```

### 4.9 Agenda (`/os/agenda`)

**Nuevo en V3:**
- **Recurrencia** de eventos (`recurrence_rule` simplificado: `'none' | 'daily' | 'weekly' | 'monthly'`). La generación de instancias es lógica (no se crean filas por recurrencia, se calculan en lectura).
- **Time zone** explícita por evento (`timezone` IANA, default `America/Bogota`).
- **Sync de solo lectura con Google Calendar** del equipo (opcional, via Service Account o calendario público compartido). Si configurado, eventos externos aparecen en la agenda marcados como `external`.
- **Notas de reunión:** cada evento puede tener una `knowledge_note` enlazada con `relation_type='tracks'`. Botón "Abrir notas de reunión" crea la nota si no existe.
- **Recordatorios:** trigger N minutos antes del evento → inserta en `notifications`.

```
agenda_events
+ recurrence_rule   text NOT NULL default('none')
+ timezone          text NOT NULL default('America/Bogota')
+ external_provider text                    -- 'google' si es importado
+ external_id       text
+ reminder_minutes  integer
```

### 4.10 Links + Repositorios GitHub (`/os/links`)

**Nuevo en V3:**
- **Read-later queue:** estado `triage` por defecto en links nuevos; el usuario puede mover a `to_read`, `reading`, `done`. Se renderiza una columna especial "Para leer" en la vista de links generales.
- **Colecciones / listas** (entidad `link_collections`) — útil para "Inspiración Landing 2026", "Ejemplos de pricing", etc.
- **Bookmarklet** documentado (script JS que el usuario pega como bookmark en su navegador) para guardar links rápidamente vía endpoint `/api/links/quick-save` autenticado por token de usuario.
- **Digest semanal:** vista `/os/links/digest` que muestra los repos guardados esta semana con `saved_reason` resaltado, para revisión rápida en reunión semanal.
- **Implementación cruzada:** un repositorio puede vincularse explícitamente a una tarea o proyecto con `relation_type='references'` desde el detalle del repo, no solo desde notas.

```
link_collections
id          uuid PK
name        text NOT NULL
description text
created_at  timestamp NOT NULL

links
+ collection_id    uuid references link_collections(id)
+ reading_status   text NOT NULL default('triage')

repositories
+ collection_id    uuid references link_collections(id)
```

### 4.11 Marketing (`/os/marketing`)

**Nuevo en V3:**
- **Vista calendario mensual** de contenido planeado por cuenta.
- **Templates de contenido** (textos base, hashtags por nicho).
- **Biblioteca de assets**: conectar `content_plan` con `documents` vía grafo. Los assets visuales viven en Documentos, no se duplican.
- **Registro manual de engagement** post-publicación: campos `reach`, `likes`, `comments`, `saves` editables después de marcar `publicado`.
- **Hashtag library** (entidad `marketing_hashtags`): conjunto reutilizable de hashtags por tema/cuenta.

```
content_plan
+ asset_document_ids jsonb NOT NULL default('[]')  -- redundante por velocidad; la fuente es el grafo
+ reach              integer
+ likes              integer
+ comments           integer
+ saves              integer

marketing_hashtags
id          uuid PK
label       text NOT NULL
tags        jsonb NOT NULL default('[]')   -- array de strings
account_id  uuid references social_accounts(id)
created_at  timestamp NOT NULL
```

### 4.12 Equipo (`/os/team`)

**Nuevo en V3:**
- **Permisos granulares por módulo:** rol no es solo `team | admin`, sino que se añade tabla `module_permissions` por usuario para sobreescritura fina. La regla por defecto es:
  - `admin`: acceso total.
  - `team`: acceso a todo excepto `/os/team`, `/os/settings/system`, `/os/resources` con `visibility='admin'`, exportaciones.
- **Workload view** (admin): muestra cuántas tareas activas y vencidas tiene cada miembro, próximas entregas, último acceso.
- **Status del miembro** (`'active' | 'focused' | 'away' | 'offline'`), editable por el propio usuario. Se muestra como dot junto al avatar.
- **1:1 templates**: una nota tipo "1:1" con plantilla fija, disponible desde el detalle del miembro.

```
users
+ status   text NOT NULL default('active')

module_permissions
id           uuid PK
user_id      uuid NOT NULL references users(id) on delete cascade
module       text NOT NULL                -- 'finances' | 'resources' | 'legal' | etc.
permission   text NOT NULL default('read')  -- 'none' | 'read' | 'write' | 'admin'
created_at   timestamp NOT NULL
UNIQUE (user_id, module)
```

### 4.13 Portal Cliente (`/portal/[slug]`)

**Nuevo en V3:**
- **Multi-usuario por cliente:** login con `slug` + email + PIN propio. El portal sabe qué persona está logueada (nombre, rol) y firma con su identidad.
- **Comentarios sobre documentos y entregables:** el cliente puede comentar dentro del portal. Los comentarios se insertan en `comments` y aparecen en el OS conectados al documento/proyecto.
- **Aprobaciones:** el equipo crea solicitudes (`approvals`) sobre un documento, entregable o milestone. El cliente las ve con CTA grande "Aprobar" o "Pedir cambios". La respuesta se registra y notifica al equipo.
- **Firma electrónica simple** de documentos legales marcados como `requires_signature`.
- **Notificaciones por email** (digest opcional): cuando se crea un comentario del equipo, un nuevo documento se publica al cliente o se crea una solicitud de aprobación.
- **Onboarding al primer login**: tour guiado simple de 4 pasos explicando dónde están proyectos, archivos, pagos y soporte.
- **Estado humanizado** del proyecto: en lugar de `in_progress`, se muestra `"En desarrollo"`. Mapping de estados a textos humanos centralizado.

```
approvals
id              uuid PK
title           text NOT NULL
description     text
target_type     entity_type NOT NULL
target_id       uuid NOT NULL
client_id       uuid NOT NULL references clients(id)
status          text NOT NULL default('pending')  -- 'pending' | 'approved' | 'changes_requested'
requested_by    uuid references users(id)
responded_at    timestamp
responded_by    uuid references client_portal_users(id)
response_note   text
created_at      timestamp NOT NULL

comments
id              uuid PK
author_type     text NOT NULL                -- 'team' | 'client'
author_id       uuid NOT NULL                -- users.id o client_portal_users.id
target_type     entity_type NOT NULL
target_id       uuid NOT NULL
body            text NOT NULL
created_at      timestamp NOT NULL
```

### 4.14 Generador de Plantillas (`/os/generator`)

**Nuevo en V3:**
- **Persistencia opcional:** las plantillas pueden guardarse en BD (`generator_templates`) si el usuario marca "Guardar para reutilizar".
- **Integración con Legal:** generar legal desde plantilla (Sección 4.5) reutiliza el motor del generador.
- **Variables tipadas:** sintaxis extendida `{{VAR:tipo}}` con tipos `text | number | date | currency | boolean`. Validación opcional por tipo.

### 4.15 Configuración (`/os/settings`)

**Nuevo en V3:**
- **Tab Notificaciones:** preferencias del usuario (email digest sí/no, frecuencia, qué eventos).
- **Tab Integraciones:** estado de Google Drive (OAuth2 token), GitHub token, Google Calendar opcional. Botón "Probar conexión".
- **Tab Apariencia:** preferencias de densidad (`comfortable | compact`).
- **Endpoint MCP extendido:**
  - `GET /api/mcp/graph` (V1) — sigue retornando snapshot completo.
  - `GET /api/mcp/tasks` (V3) — tareas con asignado, estado, prioridad y proyecto.
  - `GET /api/mcp/activity?since=ISO` (V3) — feed de actividad delta.
  - `POST /api/mcp/intent` (V3, stub V3.0) — entrada para agentes IA externos para crear/mover tareas. En V3.0 retorna 501 hasta integración real con OpenClaw.

---

## 5. Capacidades cross-módulo nuevas en V3

### 5.1 Notificaciones internas

Entidad `notifications`. Se crean automáticamente para:
- Tarea asignada / reasignada / vencida.
- Comentario sobre algo que tú creaste.
- Aprobación solicitada o respondida.
- Anticipo 50% pendiente cuando un proyecto pasa a `active`.
- Documento legal a punto de vencer (≤30 días).
- Recurso con rotación vencida.

```
notifications
id           uuid PK
user_id      uuid NOT NULL references users(id) on delete cascade
type         text NOT NULL                -- 'task_assigned' | 'comment_replied' | ...
title        text NOT NULL
body         text
target_type  entity_type
target_id    uuid
read_at      timestamp
created_at   timestamp NOT NULL default(now())
```

UI: indicador con número rojo en topbar. Click abre `Sheet` con lista cronológica. "Marcar todo leído" disponible.

### 5.2 Feed de actividad

Entidad `activity`. Toda mutación importante inserta una fila. Se usa para:
- Timeline en CRM por cliente.
- Timeline en cada tarea.
- Dashboard "Actividad reciente".
- Audit (admin).

```
activity
id           uuid PK
actor_type   text NOT NULL                -- 'team' | 'client' | 'system'
actor_id     uuid
verb         text NOT NULL                -- 'created' | 'updated' | 'completed' | 'commented' | 'signed' | 'approved' | 'rejected'
target_type  entity_type NOT NULL
target_id    uuid NOT NULL
payload      jsonb NOT NULL default('{}')  -- diff o info contextual
created_at   timestamp NOT NULL default(now())
```

### 5.3 Búsqueda global mejorada

Extiende `searchEntitiesAction` de V2:
- Incluye `tasks`, `cycles`, `milestones`, `comments`, `tags`.
- Soporta operadores: `is:task`, `assignee:me`, `project:VTX`, `priority:high`, `due:<7d`.
- Resultados agrupados por tipo en el `CommandMenu` con orden por relevancia.

### 5.4 Saved views

El usuario puede guardar el conjunto `query + filtros + columnas + ordenamiento` de cualquier listado como `saved_view`. Aparecen en la sidebar bajo "Mis vistas".

```
saved_views
id          uuid PK
owner_id    uuid NOT NULL references users(id) on delete cascade
name        text NOT NULL
route       text NOT NULL                 -- '/os/projects/[id]/tasks' o '/os/crm'
query_json  jsonb NOT NULL default('{}')
is_shared   boolean NOT NULL default(false)
created_at  timestamp NOT NULL
```

### 5.5 Bulk operations

En cualquier `DataTable`, la selección múltiple permite:
- Cambiar estado (tareas).
- Asignar (tareas).
- Conectar a entidad (cualquier listado).
- Etiquetar (cualquier listado).
- Eliminar con `AlertDialog`.

### 5.6 Atajos globales V3 (consolidado)

| Atajo | Acción |
|---|---|
| `Ctrl/Cmd + K` | Command menu |
| `Ctrl/Cmd + I` | Capturar idea rápida |
| `Ctrl/Cmd + .` | Capturar tarea rápida (V3) |
| `Ctrl/Cmd + /` | Abrir búsqueda global |
| `Ctrl/Cmd + Enter` | Submit en cualquier formulario |
| `g + t` | Ir a mis tareas |
| `g + p` | Ir a proyectos |
| `g + h` | Ir al hub |
| `g + c` | Ir a CRM |
| `Esc` | Cerrar modal/sheet |

### 5.7 Realtime ligero (opcional V3.1, planificado en V3.0)

Para portal y notificaciones, se reserva el endpoint `/api/realtime/[channel]` (Server-Sent Events). En V3.0 puede dejarse como noop documentado; en V3.1 se conecta para empujar comentarios y aprobaciones sin refrescar.

---

## 6. Rutas Completas V3

```
# Landing pública — sin cambios
/                          → Landing
/api/mcp/graph             → MCP snapshot
/api/mcp/tasks             → MCP tasks (NUEVO V3)
/api/mcp/activity          → MCP activity delta (NUEVO V3)
/api/mcp/intent            → MCP intent in (stub V3.0)

# OS interno
/os                        → Redirect a /os/admin
/os/admin                  → Dashboard + Mi día

# CRM
/os/crm                    → Lista clientes
/os/crm/[slug]             → Detalle cliente
/os/crm/[slug]/timeline    → Timeline actividad (NUEVO V3)
/os/crm/[slug]/portal-users → Multi-PIN (NUEVO V3)

# Proyectos
/os/projects               → Lista/Kanban proyectos
/os/projects/inbox         → Triage tareas (NUEVO V3)
/os/projects/mine          → Mis tareas (NUEVO V3)
/os/projects/roadmap       → Roadmap (NUEVO V3)
/os/projects/[id]          → Detalle proyecto
/os/projects/[id]/tasks    → Lista tareas (NUEVO V3)
/os/projects/[id]/board    → Tablero kanban tareas (NUEVO V3)
/os/projects/[id]/cycles   → Ciclos (NUEVO V3)
/os/projects/[id]/cycles/[cycleId]   → Detalle ciclo (NUEVO V3)
/os/projects/[id]/milestones         → Hitos (NUEVO V3)
/os/projects/[id]/tasks/[taskId]     → Detalle tarea (NUEVO V3)

# Documentos
/os/documents              → Lista
/os/documents/folders      → Carpetas (NUEVO V3)
/os/documents/[id]         → Detalle
/os/documents/[id]/versions → Versiones (NUEVO V3)
/os/documents/[id]/share   → Compartir con token (NUEVO V3)

# Legal
/os/legal                  → Lista
/os/legal/templates        → Plantillas (NUEVO V3)
/os/legal/[id]             → Detalle
/os/legal/[id]/signatures  → Firmas (NUEVO V3)

# Hub
/os/hub                    → Notas + Incubadora
/os/hub/daily/[date]       → Daily note (NUEVO V3)
/os/hub/[id]               → Detalle nota/idea

# Recursos
/os/resources              → Lista
/os/resources/folders      → Carpetas (NUEVO V3)
/os/resources/audit        → Log de accesos (admin) (NUEVO V3)
/os/resources/[id]         → Detalle

# Finanzas
/os/finances               → Lista
/os/finances/projects      → P&L por proyecto (NUEVO V3)
/os/finances/cashflow      → Proyección 90 días (NUEVO V3)
/os/finances/invoices      → Cuentas de cobro (NUEVO V3)
/os/finances/[id]          → Detalle

# Agenda
/os/agenda                 → Calendario

# Links
/os/links                  → Galería
/os/links/digest           → Digest semanal (NUEVO V3)
/os/links/collections      → Colecciones (NUEVO V3)
/os/links/[id]             → Detalle

# Marketing
/os/marketing              → Cuentas
/os/marketing/calendar     → Calendario contenido (NUEVO V3)
/os/marketing/hashtags     → Hashtag library (NUEVO V3)
/os/marketing/[id]         → Detalle cuenta

# Equipo
/os/team                   → Lista
/os/team/workload          → Workload view (admin, NUEVO V3)
/os/team/[userId]          → Detalle

# Settings
/os/settings               → Configuración (tabs: Cuenta, Notificaciones, Integraciones, Variables, MCP, Apariencia, Sistema)

# Otros
/os/generator              → Generador
/os/notifications          → Centro de notificaciones (Sheet en topbar, ruta también disponible) (NUEVO V3)
/os/activity               → Feed global de actividad (admin) (NUEVO V3)

# Portal
/portal/login              → Login (slug + email + PIN)
/portal/[slug]             → Dashboard
/portal/[slug]/files       → Archivos
/portal/[slug]/tickets     → Tickets
/portal/[slug]/approvals   → Aprobaciones (NUEVO V3)
/portal/[slug]/legal       → Documentos legales con firma (NUEVO V3)
/portal/[slug]/account     → Mis datos / preferencias notificaciones (NUEVO V3)

# Compartir público
/share/[token]             → Acceso público temporal a un documento (NUEVO V3)
```

---

## 7. Stack Técnico V3

Sin cambios mayores frente a V2 salvo:

| Capa | Tecnología | Cambio V3 |
|---|---|---|
| Framework | Next.js 15 | — |
| BD | Neon PostgreSQL | — |
| ORM | Drizzle | nuevas tablas y migraciones |
| Auth interna | `jose` + `bcryptjs` | — |
| Portal auth | `jose` cookie HTTP-only | ahora soporta `portal_user_id` además de `client_id` |
| Editor rico | BlockNote | menciones inline `@` (V3) |
| Grafo visual | `@xyflow/react` | nuevo: subgrafo "tareas relacionadas" |
| Drive | OAuth2 Refresh Token | (V2.x ya migró desde Service Account; V3 lo asume estable) |
| Tablas | `@tanstack/react-table` | añadir selección múltiple/bulk actions |
| Toasts | `sonner` | — |
| PDF (firma + invoices) | renderizado HTML→PDF server (puede usar `playwright-chromium` o `pdf-lib` según evaluación en plan técnico) | NUEVO V3 |
| Realtime | Server-Sent Events (`/api/realtime/[channel]`) | NUEVO V3 (lazy en V3.0) |
| Email | proveedor SMTP/Resend a definir en plan técnico | NUEVO V3 (digests opcionales) |

---

## 8. Variables de Entorno V3

```env
# V1/V2
DATABASE_URL=
ENCRYPTION_KEY=
AUTH_SECRET=
MCP_SECRET=
GITHUB_TOKEN=
NODE_ENV=

# Drive OAuth2 (V2.x)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=

# NUEVAS V3
EMAIL_FROM=
EMAIL_SMTP_HOST=
EMAIL_SMTP_PORT=
EMAIL_SMTP_USER=
EMAIL_SMTP_PASS=
PORTAL_NOTIFICATIONS_ENABLED=        # 'true' | 'false'
PUBLIC_APP_URL=                       # ej. https://os.vertrex.com — para links de portal y firma
SHARE_TOKEN_DEFAULT_TTL_HOURS=        # default 168 (7 días)
GOOGLE_CALENDAR_PUBLIC_ICS=           # opcional, URL ICS pública del calendario del equipo
```

---

## 9. Compatibilidad y Migración V2 → V3

- **Sin rompimientos de schema:** todas las nuevas columnas en tablas existentes (`projects`, `clients`, `documents`, `legal_documents`, `finances`, `resources`, `users`, `agenda_events`, `content_plan`) se añaden como nullable o con default. No se eliminan columnas V2.
- **Migración de datos:**
  - `projects.project_key` se backfillea de forma idempotente a partir de las 3 primeras letras del nombre, sufijo numérico si colisiona.
  - `clients.pin_hash` se conserva como PIN maestro hasta que el cliente cree al menos un `client_portal_user`.
  - `documents.version=1` por defecto en todas las filas existentes.
- **Migración de UX:** las rutas nuevas se publican junto con las viejas. No se eliminan rutas V2.
- **MCP retrocompatible:** `/api/mcp/graph` no cambia su contrato. Los nuevos endpoints son aditivos.

---

## 10. Alcance V3.0 — Qué SÍ y qué NO

### Incluido en V3.0
- Tareas, subtareas, cycles, milestones, identifiers automáticos.
- Tags cross-módulo.
- Notifications internas.
- Activity feed.
- Comentarios y aprobaciones.
- Firma electrónica simple.
- Multi-PIN portal.
- Health score CRM.
- Tokens compartir documento.
- Vista P&L y cashflow finanzas.
- Daily notes hub.
- Workload view team.
- Saved views.
- Bulk operations.
- Atajos globales `g+t`, `g+p`, `Ctrl+.`.

### Pospuesto a V3.1
- SSE realtime real (V3.0 deja endpoint en stub).
- Integración OpenClaw / IA contextual (V3.0 deja `/api/mcp/intent` y `/api/ai/suggest-next-step` en stub).
- Sync bidireccional con Google Calendar (V3.0 sólo lectura ICS pública opcional).
- App móvil PWA optimizada (V3.0 mantiene responsivo a 390px).
- Permisos UI granular completa (V3.0 sólo expone backend de `module_permissions` y respeta lectura/escritura; UI completa de admin para editarlos viene en V3.1).
- Multi-empresa: no, sigue single-tenant.

### Explícitamente fuera de V3
- App nativa.
- Time tracking automatizado (sólo manual opcional en V3.1).
- Multi-idioma (español sigue siendo único).
- Pagos en línea integrados (sólo se generan cuentas de cobro PDF; el pago sigue manual).

---

## 11. Resumen del grafo extendido V3

| Entidad | Tabla | Puede conectarse con |
|---|---|---|
| Cliente | `clients` | proyectos, documentos, legales, finanzas, agenda, tickets, comentarios, aprobaciones, firmas, tareas |
| Proyecto | `projects` | clientes, documentos, legales, finanzas, agenda, recursos, notas, tareas, ciclos, milestones |
| Tarea | `tasks` | proyectos (FK), subtareas, otras tareas (`blocks`), documentos, finanzas, agenda, ideas, repositorios, clientes, tickets, comentarios |
| Cycle | `cycles` | proyecto, tareas |
| Milestone | `milestones` | proyecto, tareas, finanzas (`bills_for`) |
| Documento | `documents` | clientes, proyectos, legales, tareas, comentarios, share_tokens |
| Legal | `legal_documents` | clientes, proyectos, firmas, plantilla |
| Nota | `knowledge_notes` (note) | proyectos, recursos, links, repositorios, daily notes, tags |
| Idea | `knowledge_notes` (idea) | proyectos, recursos, repositorios, notas, tags |
| Recurso | `resources` | proyectos, clientes, notas, tareas |
| Finanza | `finances` | proyectos, clientes, milestones |
| Evento agenda | `agenda_events` | clientes, proyectos, tareas, notas |
| Link | `links` | proyectos, notas, recursos, colección |
| Repositorio | `repositories` | proyectos, notas, ideas, recursos, tareas, colección |
| Ticket | `tickets` | clientes, proyectos, tareas, comentarios |
| Cuenta social | `social_accounts` | content_plan |
| Comentario | `comments` | cualquier entidad |
| Aprobación | `approvals` | cualquier entidad target |
| Firma | `signatures` | legales, clientes |
| Notificación | `notifications` | usuario, target arbitrario |
| Actividad | `activity` | actor, target arbitrario |
| Saved view | `saved_views` | usuario |
| Tag | `tags` | cualquier entidad |

---

## 12. Definición de "terminado" para V3.0

V3.0 se considera entregada cuando:

1. Todas las rutas listadas en Sección 6 marcadas como NUEVO V3 funcionan sin 404.
2. El módulo Proyectos cumple `vertrex-os-v3-tasks-linear-spec.md` completo.
3. El grafo soporta los nuevos `entity_type` y las relaciones canónicas listadas en 2.2.
4. El portal cliente soporta multi-PIN, comentarios, aprobaciones y firma simple.
5. `npm run typecheck && npm run build` pasan con 0 errores.
6. `vertrex-os-v3-ux-checklist.md` aprobado al 100% para rutas V3.
7. `vertrex-os-v3-quality-gate.md` aprobado al 100% para gates obligatorios.
8. La migración V2 → V3 no rompe datos existentes (verificado con seed de V2 cargado y subido a V3).

V3.0 NO requiere que estén entregados los ítems "Pospuesto a V3.1" del Capítulo 10.
