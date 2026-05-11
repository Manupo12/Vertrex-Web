# Vertrex OS V3 — Especificación UI/UX

Este documento extiende `vertrex-os-ux-spec.md` (V1/V2). Las reglas globales de V2 se mantienen: dark mode premium para OS, claro accesible para portal, prohibición de UI básica, componentes tipados, estados completos (loading/empty/error/success), responsive a 390px.

**Lo nuevo aquí:** patrones específicos del sistema de tareas tipo Linear y de los módulos que evolucionan en V3.

---

## 1. Identidad visual V3

Sin cambios mayores en la paleta. Se incorporan tokens nuevos:

- `--os-priority-urgent: #ef4444`
- `--os-priority-high: #f97316`
- `--os-priority-medium: #facc15`
- `--os-priority-low: #94a3b8`
- `--os-state-backlog: #64748b`
- `--os-state-todo: #94a3b8`
- `--os-state-in-progress: #3b82f6`
- `--os-state-in-review: #a855f7`
- `--os-state-done: #22c55e`
- `--os-state-cancelled: #475569`

La pill de estado y la dot de prioridad se reutilizan en todo el OS y en MCP UI.

### Densidad

Toggle "comfortable | compact" en topbar (icono pequeño). Persistente en `users.preferences.density`. Afecta `DataTable` y listados. Default `comfortable` (44px row), `compact` 32px.

---

## 2. Componentes nuevos obligatorios

| Componente | Path | Propósito |
|---|---|---|
| `TaskRow` | `components/os/Tasks/TaskRow.tsx` | Fila reutilizable para listas de tareas |
| `TaskStatePill` | `components/os/Tasks/TaskStatePill.tsx` | Pill `backlog/todo/in_progress/in_review/done/cancelled` |
| `PriorityDot` | `components/os/Tasks/PriorityDot.tsx` | Dot color + label opcional |
| `TaskQuickEditMenu` | `components/os/Tasks/TaskQuickEditMenu.tsx` | DropdownMenu para asignado, estado, prioridad inline |
| `IdentifierChip` | `components/os/Tasks/IdentifierChip.tsx` | Monospace clickable copy-to-clipboard |
| `TaskAssigneeSelect` | `components/os/Tasks/TaskAssigneeSelect.tsx` | Select con avatares + opción `Nadie` + `Yo` |
| `MentionInput` | `components/os/Editor/MentionInput.tsx` | Plugin BlockNote para `@` |
| `BulkActionBar` | `components/os/data/BulkActionBar.tsx` | Barra flotante inferior cuando hay selección múltiple |
| `SavedViewBar` | `components/os/SavedViews/SavedViewBar.tsx` | Chips de vistas guardadas y CTA "Guardar vista" |
| `NotificationBell` | `components/os/Notifications/NotificationBell.tsx` | Icono topbar con badge y Sheet |
| `ActivityItem` | `components/os/Activity/ActivityItem.tsx` | Fila del feed cronológico |
| `BurndownChart` | `components/os/Tasks/BurndownChart.tsx` | SVG inline para ciclo |
| `RoadmapTimeline` | `components/os/Tasks/RoadmapTimeline.tsx` | Timeline horizontal milestones+cycles |
| `KanbanColumn` (gen) | `components/os/data/KanbanColumn.tsx` | Columna con header sticky, contador, drop zone |
| `EntityMentionRenderer` | `components/os/Editor/EntityMentionRenderer.tsx` | Render inline de menciones en lectura |
| `CommentThread` | `components/os/Comments/CommentThread.tsx` | Hilo cronológico con avatares team/cliente |
| `ApprovalCard` | `components/os/Approvals/ApprovalCard.tsx` | Card con CTA Aprobar/Pedir cambios |
| `SignaturePad` | `components/os/Legal/SignaturePad.tsx` | UI portal: nombre + checkbox + firma textual |

---

## 3. Sistema de tareas — UX detallada

### 3.1 Vista lista `/os/projects/[id]/tasks`

Layout:
- `PageHeader` con título "Tareas", descripción "Backlog y ejecución del proyecto", acción primaria `Nueva tarea`, secundarias `Importar plantilla`, `Tablero`, `Ciclos`.
- `Toolbar`: búsqueda con debounce 300ms, filtros (estado, prioridad, asignado, ciclo, milestone, tag), agrupación (None | Estado | Asignado | Ciclo | Milestone | Prioridad), toggle subtareas anidadas, `SavedViewBar`.
- `DataTable`:
  - Columnas default: identifier, title, state, priority, assignee, cycle, due, points, tags, updated.
  - Sticky header.
  - Group headers colapsables cuando agrupación activa.
  - Subtareas anidadas con sangría visual (chevron expand/collapse).
  - Inline edit: click en celda estado/prioridad/asignado abre DropdownMenu.
  - Row hover muestra `…` con acciones (Duplicar, Convertir en milestone, Mover a proyecto, Eliminar).
  - Row click → `TaskDetailSheet`. Shift+click → página completa.
- `BulkActionBar`: aparece flotante al seleccionar ≥1 fila. Acciones: estado, asignado, ciclo, milestone, tag, eliminar.

Loading: skeleton de toolbar + 8 filas con avatares pulsantes.
Empty: "No hay tareas aún" + CTA grande "Crear primera tarea" + atajo visible `Ctrl+.`.
Error: ErrorState con "Reintentar".

Mobile (390px):
- Toolbar colapsa filtros en `Sheet`.
- Tabla colapsa a `MobileCardList`: card con identifier, título, badges.

### 3.2 Tablero `/os/projects/[id]/board`

Layout:
- `PageHeader` igual a lista, switch primario "Tablero".
- 5 columnas horizontales `backlog | todo | in_progress | in_review | done` con scroll horizontal en mobile.
- Cada columna:
  - Header sticky con título, color del estado, contador de tareas, contador de puntos opcional, botón `+` que abre QuickCreate inline en columna.
  - Cards verticales con drag handle.
  - Card: identifier, title, footer con avatar asignado, due_date si próximo, priority dot, badges tags.
- Toggle "Agrupar por prioridad" cambia columnas a `urgente | alta | media | baja | sin prioridad`.
- Toggle "Mostrar canceladas" añade columna gris al final.

Drag & drop:
- Si `@dnd-kit` instalado: drop entre columnas dispara `changeTaskStateAction`. Loading state visual.
- Si no: card tiene menú con cambio de estado.

Loading: `KanbanSkeleton` con 5 columnas y 3 cards por columna.
Empty (proyecto sin tareas): card grande centrada con CTA "Crear primera tarea".

### 3.3 Detalle de tarea `/os/projects/[id]/tasks/[taskId]`

Layout 70/30:

**Izquierda:**
- Header sticky:
  - `IdentifierChip` + título editable inline (click + Enter, Esc cancela).
  - Línea de badges: `TaskStatePill`, `PriorityDot+label`, ciclo, milestone si existe.
  - Acciones: menú `…` con Duplicar, Convertir en milestone, Mover a proyecto, Eliminar (AlertDialog).
- Sección descripción: `BlockEditor` con `MentionInput`. Botón "Guardar" cuando hay cambios; auto-save cada 8s si activo.
- Sección **Subtareas**:
  - Lista compacta con checkbox (toggle `state` done/todo).
  - Hover muestra `…` con cambiar estado, asignar, abrir.
  - Input inline al final "Añadir subtarea…" con Enter.
- Sección **Bloqueos**:
  - Bloque A: "Esta tarea bloquea" → lista cards de tareas dependientes (identifier + título + estado).
  - Bloque B: "Bloqueada por" → idem.
  - Botón "Añadir bloqueo" abre Sheet.
- Sección **Comentarios**:
  - `CommentThread` cronológico.
  - Input con `MentionInput` al final.
  - Atajo `c` enfoca el input.

**Derecha (panel propiedades):**
- Card "Propiedades":
  - Estado (`TaskQuickEditMenu`).
  - Prioridad.
  - Asignado (`TaskAssigneeSelect`).
  - Ciclo.
  - Milestone.
  - Due date (date picker).
  - Estimate (input numérico, sugerencia Fibonacci).
  - Tags (chips + agregar).
  - Creado por, creado el.
- Card "Adjuntos": documentos conectados, `SmartUploader` que auto-conecta con `attaches`.
- Card "Relaciones": `EntitySidebar` filtrado a entidades cross-módulo (clientes, ideas, repos, agenda, finanzas).
- Card "Actividad": últimos 10 cambios.

Atajos del detalle:
- `e` editar título.
- `a` abrir asignado.
- `s` abrir estado.
- `p` abrir prioridad.
- `c` enfocar comentario.
- `Ctrl+Enter` guardar campo activo.

### 3.4 Inbox `/os/projects/inbox`

Layout:
- `PageHeader` "Inbox de triage", descripción "Tareas capturadas sin proyecto. Asígnales destino o cancélalas.", acción primaria "Capturar tarea".
- Lista vertical compacta, ordenada por `created_at DESC`.
- Cada fila: identifier provisional (sin project_key, ej. `INBOX-12`), título, autor, fecha, acciones rápidas "Mover" y "Cancelar".
- "Mover" abre Sheet con búsqueda de proyecto, ciclo opcional, milestone opcional, asignado opcional.
- Empty: "Bandeja vacía. Presiona Ctrl+. para capturar."

### 3.5 Mis tareas `/os/projects/mine`

Layout:
- `PageHeader` "Mis tareas", descripción "Lo que tienes asignado", acción primaria "Capturar".
- Tabs: `Por hacer` (todo+in_progress+in_review), `Backlog`, `Completadas` (últimos 30 días).
- Vista por defecto: lista agrupada por proyecto, dentro por estado.
- Toggle "Tablero" (kanban personal con columnas por estado).
- Filtros: prioridad, ciclo, fecha vencimiento.

Empty (estás al día): card central con ilustración suave + "Estás al día. Buen trabajo." + CTA "Ir al roadmap".

### 3.6 Roadmap `/os/projects/roadmap`

Layout:
- `PageHeader` "Roadmap", descripción "Próximos 12 meses por proyecto", controles de zoom (mes / trimestre / año).
- Timeline horizontal con filas = proyectos activos. Cada fila muestra:
  - Barras horizontales = ciclos (color por status).
  - Marcadores triangulares = milestones (color por status).
  - Hover muestra tooltip con nombre y fechas.
- Scroll horizontal en desktop y mobile.
- Toggle "Solo proyectos con cliente" filtra.

Empty: "No hay ciclos ni hitos planificados." + CTA "Crear ciclo en un proyecto".

### 3.7 Ciclo `/os/projects/[id]/cycles/[cycleId]`

Layout:
- `PageHeader` con título "Sprint N · {nombre}", descripción goal del ciclo, badges status y rango fechas, acciones: "Activar" / "Cerrar" / "Editar".
- 4 `StatCard`: scope inicial (puntos), agregado, completado, restante.
- `BurndownChart` SVG.
- Lista de tareas del ciclo agrupada por estado, con inline edit.
- Sheet "Añadir tareas" con búsqueda dentro del proyecto.

### 3.8 Hitos `/os/projects/[id]/milestones`

Layout:
- `PageHeader` "Hitos", acción "Nuevo hito".
- Lista cards horizontales:
  - Nombre grande, descripción 2 líneas, target_date prominente, progress bar (done/total).
  - Status badge.
  - Click abre Sheet con tareas del hito.
- Drag handle en hover para reordenar.

---

## 4. Captura rápida de tarea (`Ctrl/Cmd + .`)

Modal centrado, ancho 560px:
- Single line input grande (autofocus) con placeholder "Captura una tarea…".
- Footer pequeño con 3 selectores compactos:
  - Proyecto: dropdown con últimos 5 + buscar. Default = último usado o Inbox.
  - Asignado: dropdown con Yo + Nadie + miembros. Default = Yo.
  - Prioridad: 5 dots. Default = sin prioridad.
- Botones: `Esc` cancelar, `Enter` guardar.
- Toast tras guardar: "Tarea creada · VTX-148" con link.

---

## 5. Notificaciones

### 5.1 NotificationBell

- Icono campana en topbar, derecha.
- Badge rojo con contador de no leídas (cap a 99+).
- Click abre `Sheet` lateral derecho de ancho 420px.

### 5.2 Sheet de notificaciones

- Header "Notificaciones" con acción "Marcar todo leído".
- Lista cronológica con grupos "Hoy", "Ayer", "Antes".
- Cada notificación: avatar/icono por tipo, título corto, body, hora relativa, dot azul si no leída.
- Click navega al target y marca leído.
- Empty: "Sin notificaciones por ahora."

### 5.3 Centro `/os/notifications`

- Vista completa con filtros por tipo y `read | unread`.
- Bulk: marcar leídas, eliminar.

---

## 6. Activity feed

### 6.1 Patrón visual

- Lista cronológica con avatares (team con foto, cliente con iniciales sobre color de marca claro, system con icono engranaje).
- Cada item: `{actor} {verb_humanizado} {target_con_link}` + hora relativa.
- Diff opcional debajo en monospace si hay cambio de campo.

### 6.2 Dónde aparece

- Dashboard: panel "Actividad reciente" (últimos 20).
- Detalle cliente: tab "Timeline".
- Detalle tarea: card "Actividad".
- Admin: ruta `/os/activity` con filtros.

---

## 7. Comentarios y aprobaciones

### 7.1 CommentThread

- Lista vertical con cards muy planas.
- Cada comentario: avatar (team = foto, cliente = badge cliente), nombre + rol, fecha, body con menciones renderizadas, acciones `Responder`, `Editar` (autor only), `Eliminar` (autor o admin).
- Input al final con `MentionInput`, botón "Comentar" con pending state.
- Mobile: ancho 100%, padding generoso.

### 7.2 RequestApprovalSheet

- Sheet con: título, descripción opcional, target (preseleccionado), cliente (preseleccionado si aplica).
- Selector de portal_users del cliente a notificar.
- Botón "Crear solicitud" con toast "Aprobación pedida".

### 7.3 ApprovalCard (portal)

- Card grande, fondo claro destacado.
- Header con título "Solicitud de aprobación" + chip target ("Mockup landing v3").
- Body con descripción del equipo.
- Botones grandes: `Aprobar` (verde) y `Pedir cambios` (outline).
- Si "Pedir cambios", abre textarea para nota obligatoria.
- Tras responder: card cambia a estado con timestamp y respuesta.

### 7.4 SignaturePad (portal)

- Form simple, no canvas dibujable en V3.0.
- Campos: nombre completo (preusertname si logueado), email (preuser if available, editable), checkbox "He leído y acepto los términos del documento" (obligatorio).
- Pequeño bloque legal con IP, UA y timestamp visibles antes de firmar.
- Botón grande "Firmar documento" verde.
- Tras firma: pantalla de éxito con descarga PDF firmado.

---

## 8. Documentos V3

- Vista lista mantiene UX V2; añade:
  - Filtro `folder`.
  - Sidebar izquierdo opcional con árbol de folders (colapsable).
  - Badge "v{n}" en filas que sean versión > 1.
- Detalle añade tab `Versiones` y acciones `Crear nueva versión` (re-upload), `Compartir con link` (CreateShareToken Sheet con expiración).

### Share Sheet

- Sheet con selector de TTL (24h, 7d, 30d, custom).
- Link generado visible con botón copiar + QR.
- Lista de tokens activos con `revocar`.

---

## 9. Legal V3

- Lista añade columna `Vence` con badge color según proximidad.
- Detalle añade:
  - Tab `Plantilla` (si fue generado desde una).
  - Tab `Firmas` con tabla de firmantes y descarga del PDF firmado.
  - Toggle `Requiere firma` y botón "Pedir firma" que abre Sheet con selector de portal_users.

---

## 10. Recursos V3

- Lista mantiene UX V2 + nuevo árbol de folders en sidebar izquierdo.
- Filas con `visibility` icon (ojo / candado / candado doble) y `rotation_due_at` badge si próximo.
- Detalle añade tab `Auditoría` (admin only) con tabla de accesos.

---

## 11. Finanzas V3

- Lista añade selector currency (COP/USD) en toolbar y stat cards multi-moneda.
- Filas con badge recurrencia (icono refresh).
- Vista `Cuentas de cobro`: tabla con generador "Nueva cuenta de cobro" → Sheet con: proyecto, milestone, ítems (line items), totales en vivo, generar PDF.
- Vista `Cashflow`: timeline 90 días con barras semanales positivas (ingresos esperados) y negativas (gastos recurrentes).

---

## 12. Hub V3

- Sidebar izquierdo nuevo "Daily" con calendario mini para saltar a daily note.
- `BlockEditor` con menciones `@` y `[[Nota]]` para backlinks.
- Card "Notas que enlazan aquí" en sidebar derecho del detalle.
- Filtros Hub: tags, type, idea_status.

---

## 13. Portal V3

- Login: campo email + slug + PIN. Si el cliente solo tiene PIN maestro, email opcional.
- Header del portal muestra avatar/iniciales del portal_user logueado + selector dropdown si tiene acceso a múltiples clientes (futuro: single en V3.0).
- Dashboard añade:
  - Card "Aprobaciones pendientes" con conteo y CTA grande.
  - Card "Documentos a firmar" si aplica.
  - Mini onboarding (4 pasos): aparece solo en primer login del portal_user.
- Comentarios disponibles en documentos y entregables: input grande, lista cronológica con avatares team color de marca y cliente color cálido.

---

## 14. Settings V3

Tabs en orden:
- `Cuenta`: cambiar contraseña, status, preferencias densidad.
- `Notificaciones`: toggles por tipo, email digest sí/no, frecuencia.
- `Integraciones`: estado Drive (OAuth), GitHub token, Google Calendar URL ICS, botones probar conexión.
- `Variables internas`: gestión `resources` con `visibility='admin'` (admin only).
- `MCP`: lista endpoints con botón copiar, regenerar `MCP_SECRET` (admin only).
- `Apariencia`: densidad, preferencia tema (portal toggle si aplica).
- `Sistema`: salud DB, almacenamiento Neon (estimado), enlaces externos.

---

## 15. Reglas duras V3 (extensión a §7 V2)

- Prohibido mostrar `identifier` sin monospace.
- Prohibido mostrar prioridad como número crudo en UI (siempre dot+label).
- Prohibido renderizar mention plain (debe usar `EntityMentionRenderer`).
- Prohibido cerrar tarea con bloqueados sin `AlertDialog`.
- Prohibido permitir tarea sin proyecto fuera de la Inbox.
- Prohibido capturar tarea sin atajo visible para el usuario al menos una vez en la UI.
- Prohibido mostrar columnas de DataTable que no respondan al toggle de densidad.
- Prohibido permitir bulk delete sin AlertDialog detallando cuántas filas se eliminan.
- Prohibido portal sin texto humano de estado (mapping del Tasks spec §9.5).
- Prohibido firma sin IP, UA y timestamp visibles antes de firmar.

---

## 16. Quality gate visual V3

Antes de aprobar cualquier ruta V3, verificar:

1. ¿`PageHeader` y acción primaria existen?
2. ¿`Toolbar` con búsqueda y filtros aplica donde lista datos?
3. ¿Loading skeleton imita la forma final?
4. ¿`EmptyState` tiene CTA específico?
5. ¿`ErrorState` permite `Reintentar`?
6. ¿Acciones async muestran pending + toast?
7. ¿Atajos visibles (chips `Ctrl+.`, `Ctrl+K`, `Ctrl+I`) son descubribles?
8. ¿`BulkActionBar` aparece en listados con selección múltiple?
9. ¿`SavedViewBar` opera correctamente con la URL?
10. ¿La ruta a 390px no rompe scroll horizontal?
11. ¿Las menciones se renderizan como `EntityMentionRenderer`?
12. ¿Las pills de estado y dots de prioridad usan los tokens V3?
13. ¿Hay `NotificationBell` accesible siempre?
14. ¿Detalle de tarea respeta los atajos `e/a/s/p/c`?
15. ¿Burndown del ciclo renderiza incluso con 0 tareas (estado "Sin tareas todavía")?
