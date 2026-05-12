# Auditoría completa Vertrex OS + Plan de ejecución

> Fecha del análisis: 2026-05-12
> Alcance: revisión archivo por archivo del workspace OS, portal de clientes, API, server actions, autenticación y configuración. Severidad: **C** = Crítico (bloquea uso real), **A** = Alto, **M** = Medio, **B** = Bajo. Cada hallazgo incluye archivo y línea cuando aplica para que el agente programador pueda actuar de inmediato.

---

## TL;DR de los hallazgos más graves (lee esto antes que nada)

Estos no son detalles cosméticos: son funcionalidades que el usuario cree que existen, pero **no se persisten o están desconectadas**:

1. **Las aprobaciones del portal de cliente son falsas.** `src/app/portal/[slug]/approvals/ApprovalsView.tsx:18` tiene literalmente el comentario *"In a real implementation this would call a server action"* y la respuesta del cliente solo modifica el estado local. Al recargar, la aprobación vuelve a aparecer como pendiente. **Los socios no pueden aprobar nada de verdad.**
2. **Marcar notificaciones como leídas no se persiste.** `src/app/os/notifications/NotificationsView.tsx:15-22` solo cambia `useState`; las acciones servidor `markNotificationReadAction` / `markAllNotificationsReadAction` existen en `src/lib/db/actions/notifications.ts` pero la UI no las llama.
3. **La descripción al crear una tarea se pierde.** `src/components/os/Tasks/QuickTaskModal.tsx:47-68`: hay un `useState` `description`, hay un textarea que escribe en él, pero `createTaskAction` se llama sin ese campo. Lo que escribas se descarta.
4. **En el detalle de una tarea no se puede editar la descripción.** `src/app/os/projects/[id]/tasks/[taskId]/page.tsx:56-60`: el `BlockEditor` está hardcodeado `editable={false}` y `onChange={() => {}}`. El sidebar de propiedades en esa misma página es 100% read-only (no permite cambiar estado, prioridad, asignado, fecha, tipo, ciclo, hito).
5. **Solo aparece el texto "Descripción de la tarea..." en el sheet lateral.** `src/components/os/Tasks/TaskDetailSheet.tsx:107`: es un placeholder estático, jamás se renderiza `task.descriptionJson`.
6. **Stripe es un stub.** `src/app/api/payments/create-checkout/route.ts:14` siempre devuelve `https://buy.stripe.com/test_sample` aunque exista `STRIPE_SECRET_KEY`. Imposible cobrar a clientes reales.
7. **2FA es inalcanzable.** Los endpoints `/api/auth/2fa/setup` y `/verify` existen y funcionan, pero ninguna UI los llama y, peor, `loginTeam` en `src/lib/auth/session.ts:76-89` **no verifica el TOTP en el login** — así que aunque alguien lo activara, podría seguir entrando solo con email+password.
8. **El progreso del proyecto que pongas a mano se borra solo.** `src/lib/db/actions/tasks.ts:93-99` (`recalculateProjectProgress`) corre cada vez que cambia el estado de una tarea y sobrescribe `projects.progress`. Por eso no puedes dejar fijo "50%".
9. **El componente `TaskFilters` (con state/priority/assignee/ciclo/hito/tag/tipo/búsqueda/groupBy) existe pero no se usa en ninguna vista.** Está completo pero huérfano (`src/components/os/Tasks/TaskFilters.tsx`).
10. **El feed SSE de tiempo real solo manda heartbeats.** `src/app/api/realtime/[channel]/route.ts` no publica eventos; nada empuja datos al cliente.
11. **`createTaskAction` siempre fuerza `state: "todo"`** (`src/lib/db/actions/tasks.ts:45`). Aunque la futura UI te deje elegir backlog, lo pisa.
12. **Bulk actions del CRM son `console.log`.** `src/app/os/crm/CrmList.tsx:91-92` ("Etiquetar" y "Eliminar"). El SavedViewBar también usa `mockViews` hardcodeados.
13. **Settings → Notificaciones / Integraciones / Apariencia / Sistema son decorativos.** En `src/app/os/settings/page.tsx`: los checkboxes son `defaultChecked` sin `onChange`, los botones "Guardar" / "Aplicar" no tienen `onClick`, los estados "Conectado" / "Activo" están hardcodeados, la versión "3.0.0" hardcodeada.
14. **El templating legal guarda `sizeBytes: bodyHtml.length` pero no guarda el HTML resultante** (`src/lib/db/actions/legal.ts:42`). El documento generado queda vacío.
15. **`requestSignatureAction` no envía email** (`src/lib/db/actions/legal.ts`). Solo marca un flag en BD. El cliente nunca se entera.
16. **Eventos recurrentes en agenda se guardan pero no se expanden** en ninguna vista (`recurrenceRule` solo se muestra como icono). `reminderMinutes` igual: nadie lo lee.
17. **Permisos por módulo: la tabla y `setModulePermissionAction` existen, pero no hay UI para asignar permisos**, y las server actions sólo usan `requireOsUser` / `requireAdminUser`, no `requireModuleAccess`.
18. **No hay reset/recuperación de contraseña.** Tampoco invitación por email a nuevos miembros del equipo: el admin teclea la contraseña manualmente en `src/lib/db/actions/team.ts:14-21`.
19. **Rate-limit del login está roto:** usa `ip = "server-action"` constante (`src/app/login/actions.ts:11`), es un contador global, no per-IP.
20. **Empty states de tareas dicen "Presiona Ctrl+." en lugar de mostrar el botón visible** (TasksView, InboxView). El botón existe pero no aparece cuando la lista está vacía.

---

## 1. Tareas y Tablero (el módulo que más te bloquea hoy)

Archivos principales:
- `src/app/os/projects/[id]/tasks/{page.tsx, TasksView.tsx, [taskId]/page.tsx, [taskId]/AddSubtaskForm.tsx}`
- `src/app/os/projects/[id]/board/{page.tsx, BoardView.tsx}`
- `src/app/os/projects/[id]/{cycles, milestones}/*`
- `src/app/os/projects/{inbox, mine, roadmap}/*`
- `src/components/os/Tasks/{TaskCreateButton, QuickTaskModal, QuickTaskProvider, TaskDetailSheet, TaskRow, TaskFilters, BurndownChart, RoadmapTimeline, TaskQuickEditMenu, ...}.tsx`
- `src/lib/db/actions/tasks.ts`, `src/lib/db/schema.ts:121-177`

### 1.1 Creación de tareas
- **C — descripción que escribes se descarta.** `QuickTaskModal.tsx:47` define `description`, `:233-241` lo enlaza al textarea, pero `:57-68` no lo pasa a `createTaskAction`. Hay que añadirlo como `descriptionJson` (convertir a estructura BlockNote básica o guardar como texto plano).
- **C — `createTaskAction` ignora `state`.** `tasks.ts:45` siempre fuerza `state: "todo"`. Cuando agregues selector de estado en el modal, también hay que aceptar `state` y validar contra el enum.
- **A — Empty states no muestran el botón.** `TasksView.tsx:48-58` y `InboxView.tsx:17-27` muestran "Presiona Ctrl+." en lugar del `<TaskCreateButton/>`. Idem `BoardView.tsx:28-39` que redirige en vez de invitar a crear. Reemplazar por el botón directo.
- **A — `TaskCreateButton` no recibe `cycles` ni `milestones` desde `TasksView` ni `BoardView`** (`TasksView.tsx:65`, `BoardView.tsx:58`). El modal sí soporta esos selectores, pero llegan vacíos. Hay que pasarlos desde la página servidor.
- **M — `description` debería ser BlockNote, no textarea.** El esquema `descriptionJson` es jsonb. Acepta string plano (no aprovechas el editor) pero idealmente integra el `BlockEditor` ya existente.
- **M — sin "+ Nueva tarea" desde la card del proyecto en /os/projects.** No es bloqueante pero acelera flujo.

### 1.2 Edición de tareas (lo más roto)
- **C — `tasks/[taskId]/page.tsx:56-60`**: `BlockEditor` con `editable={false}` y `onChange={() => {}}`. Hay que crear un wrapper cliente que llame a `updateTaskAction({ descriptionJson })` al guardar.
- **C — sidebar de propiedades sin edición.** Mismo archivo, líneas 119-141: estado, prioridad, asignado, fecha de vencimiento y tipo se muestran pero **no son editables**. Reemplazar por controles vivos (selects, inputs) que llamen a `updateTaskAction`/`changeTaskStateAction`/`assignTaskAction`/`setTaskPriorityAction`.
- **C — falta poder cambiar `taskType`, `dueDate`, `estimatePoints`, `cycleId`, `milestoneId`, `parentTaskId` desde la UI.** `updateTaskAction` lo soporta vía `Partial<typeof tasks.$inferInsert>`, pero ningún control la invoca con esos campos.
- **A — `TaskDetailSheet` no muestra la descripción real** (`TaskDetailSheet.tsx:106-108`). Reemplazar por `<BlockEditor initialContent={task.descriptionJson} editable={true} onChange=...>` o, mínimo, mostrar texto del jsonb.
- **A — no se puede editar el título** desde ningún lado (ni sheet, ni página completa).
- **A — Subtareas: el panel detalle solo muestra check visual; no permite marcar done, abrir la subtarea, ni reordenar.** `tasks/[taskId]/page.tsx:66-79`.
- **B — comentarios solo en el `TaskDetailSheet`, no en la página completa.** Sería más natural mostrarlos también en `tasks/[taskId]/page.tsx`.

### 1.3 Tablero (drag & drop) — tu hallazgo del arrastre
- **C/A — el drag SÍ existe, pero compite con el click.** `BoardView.tsx:65-87` envuelve cada card con `onClick={() => setSelectedTask(t)}`. El `KanbanBoard` usa `useSortable` con `distance: 5` (`KanbanBoard.tsx:50`) para minimizar conflicto, pero en la práctica si arrastras menos de 5px se interpreta como click y se abre el sheet. Cuando arrastras más, a veces el navegador desencadena selección de texto.

  Solución estándar: separar un "drag handle" (un icono `⋮⋮` en la esquina superior izquierda de la card) que sea el único que dispare `useSortable`, y dejar la card limpia para `onClick`.

- **A — empty state del tablero redirige a la lista** en lugar de mostrar el botón crear (`BoardView.tsx:30-38`).
- **A — sin reordenamiento dentro de la columna.** `orderIndex` está en schema (`tasks` table) pero `changeTaskStateAction` no lo actualiza al soltar.
- **A — sin agrupar por asignado, ciclo o hito.** El componente `TaskFilters` ya tiene `groupBy` pero no está conectado.
- **M — sin "WIP limits" por columna ni códigos de color/aviso.**

### 1.4 Filtros y vistas
- **C — `TaskFilters` está construido pero NUNCA SE USA.** El archivo existe (`src/components/os/Tasks/TaskFilters.tsx`) con todos los selectores (state, priority, assignee, cycle, milestone, tag, type, search, groupBy) pero ningún `import TaskFilters` en componentes de página. Es código muerto que debe integrarse en `TasksView`, `BoardView`, `MineView`, `InboxView`.
- **A — Saved Views** (`saved_views` table + `SavedViewBar`) está parcialmente cableado, pero recibe `mockViews` en CRM y no se usa en proyectos.

### 1.5 Ciclos y hitos
- **A — `closeCycleAction` existe** y mueve tareas al backlog, pero no hay UI que lo invoque desde `/cycles/[cycleId]`.
- **A — `addTasksToCycleAction` existe** (`cycles.ts:62`) pero no hay multiselección en `TasksView` para invocarla.
- **A — sin validación `endsAt > startsAt`** en `CreateCycleDialog`.
- **A — `BurndownChart` componente existe** pero no veo donde se use; conectarlo a la página de ciclo individual.
- **M — `milestones.targetDate` se acepta pero no se valida** ni hay alertas si está vencido.

### 1.6 Subtareas, bloqueos y relaciones
- **A — `linkTaskBlocksAction` / `unlinkTaskBlocksAction` existen**, la página `tasks/[taskId]/page.tsx:84-115` muestra "Bloquea / Bloqueada por" pero **no hay UI para crear o quitar bloqueos**. Solo se ven los que ya existen.
- **M — subtareas se crean con `AddSubtaskForm`** pero no se pueden mover entre estados desde el padre.

### 1.7 Progreso del proyecto (otro de tus hallazgos)
- **C — `recalculateProjectProgress` (`tasks.ts:93-99`) pisa el valor manual del usuario** cada vez que cambia el estado de una tarea. Si pones 50% a mano, basta con que alguien cambie una tarea para que se recalcule.

  Solución: agregar columna `projects.progressMode` (`auto | manual`) o un `progressOverride` numerable que tenga precedencia. La UI debe mostrar claramente si está en auto o manual y permitir alternar. `EditProjectForm` debería poder fijar el modo.

---

## 2. CRM / Clientes

Archivos: `src/app/os/crm/*`, `src/lib/db/actions/crm.ts`

- **C — Bulk actions falsas.** `CrmList.tsx:91-92`: `Etiquetar` y `Eliminar` son `console.log()`. Hay que implementar `bulkTagClientsAction` y `bulkDeleteClientsAction`.
- **A — Sin pipeline de oportunidades / deals.** No existe tabla `opportunities`/`deals` en el schema. Para un CRM real con socios hay que añadirla (etapas, monto estimado, probabilidad, cliente, owner, fecha de cierre, motivo de pérdida) y una vista Kanban.
- **A — Sin notas / interacciones por cliente.** Aunque `knowledgeNotes` existe, no se conecta visualmente al cliente. Agregar tab "Notas" en `crm/[slug]/page.tsx` con CRUD propio.
- **A — Timeline está creada pero no la inspeccioné a fondo** (`crm/[slug]/timeline/page.tsx`). Verificar que ya muestre el feed real de `activity` filtrado por entidad.
- **A — `SavedViewBar` recibe `mockViews` hardcodeados** (`CrmList.tsx:95-98`). Hay que conectar `saved_views` real (acción `listSavedViewsAction` + `saveViewAction`).
- **M — Sin campos custom por cliente** (industria, fuente, etiquetas, valor LTV).
- **M — Sin gestión de múltiples contactos por cliente desde la UI principal** (la tabla `client_portal_users` existe; gestión sí está en `crm/[slug]/portal-users/`).

---

## 3. Finanzas

Archivos: `src/app/os/finances/*`, `src/lib/db/actions/finances.ts`

- **A — Formulario de creación pobre.** `finances/[id]/page.tsx:24-106` (cuando `id === "new"`) solo pide concepto, tipo, monto, estado, vencimiento. Faltan: **IVA**, **recurrencia**, **moneda** (`currency` en schema), **invoice number**, **proyecto/cliente** vinculados, **categoría**.
- **A — Sin edición.** El detalle solo permite "Marcar como pagado", nada más. Falta formulario completo de edición y botón eliminar.
- **A — Sin exportación.** No hay CSV/XLSX ni PDF. Con `pdf-lib` en deps puede generarse factura.
- **A — Facturas (`/finances/invoices`).** No verifiqué a fondo, pero es muy probable que sea listado parcial sin generar PDFs reales (alinear con `invoiceNumber`, `vatRate`, `vatAmountCop`).
- **A — Alertas de vencimiento.** `dueDate`/`nextDueDate` existen pero ninguna notificación se dispara automáticamente.
- **M — Cashflow ya funciona** (`finances/cashflow/page.tsx`) pero solo tabla, sin gráfico. Aceptable.
- **M — Sin proyección por proyecto / cliente / categoría agregada.**
- **B — Hardcoded `COP`**; `currency` está en schema pero la UI no la expone.

---

## 4. Documentos

Archivos: `src/app/os/documents/*`, `src/lib/db/actions/documents.ts`, `src/app/api/upload/route.ts`, `src/lib/drive/service.ts`

- **C — Botón "Compartir con enlace" sin acción.** `documents/[id]/page.tsx:~38` es un `<button>` sin `onClick`. El `ShareDocumentSheet` se importa pero no se monta. Falta cablearlo.
- **A — `DocsList.tsx:37-46` admite código incompleto en el agrupado por `parentId`** (versiones). El comentario dice "In a real app we'd need the parentId property in DocRow". Documentos versionados aparecen duplicados en la lista.
- **A — No hay botón "Crear documento nuevo" (editor BlockNote inline).** Solo subir archivo. Si tu flujo incluye notas de proyecto largas, conviene `documents/new` con BlockEditor que persista en Neon.
- **A — Sin búsqueda full-text.** Solo por nombre.
- **A — Permisos por documento son boolean (`isPublic`).** Falta ACL real por cliente/portal_user/rol.
- **M — Sin OCR ni preview de Office docs.**

---

## 5. Marketing

Archivos: `src/app/os/marketing/*`, `src/lib/db/actions/marketing.ts`

- **A — Sin publicación automática.** No hay integración con APIs de redes (Instagram Graph, LinkedIn, X, etc.). El status `publicado` se marca a mano.
- **A — Métricas manuales.** `StatsUpdateDialog` permite escribir followers/reach a mano. No hay polling automático.
- **A — Sin asset manager.** `assetDocumentIds` (jsonb) en `content_plan` pero no hay UI para adjuntar.
- **M — Calendario ya está** (`marketing/calendar/page.tsx`) pero es solo lectura; los items del calendario no se pueden arrastrar para reprogramar.
- **M — Hashtags** (`marketingHashtags`) funcionan a nivel CRUD pero sin sugerencias.

---

## 6. Agenda

Archivos: `src/app/os/agenda/*`, `src/lib/db/actions/agenda.ts`

- **C — `recurrenceRule` se guarda pero no se expande.** En `AgendaView.tsx` solo se muestra un icono "Recurrente". Un evento weekly aparece UNA sola vez en el calendario. Hay que usar `rrule` (no está en deps; instalar `rrule`) y expandir entre `viewStart` y `viewEnd`.
- **C — `reminderMinutes` no dispara nada.** Ningún cron / job lee el campo. Hay que crear un endpoint cron en Vercel (`/api/cron/reminders`) que mande email y notificación X minutos antes.
- **A — Sin Google Calendar sync.** `externalProvider`/`externalId` existen, `googleapis` está en deps. Falta cablear OAuth + sync bidireccional.
- **A — Sin detección de conflictos** (eventos solapados del mismo usuario/cliente).
- **A — Sin edición desde el detalle del evento.** La acción `updateAgendaEventAction` existe; falta UI.
- **M — Sin participantes ni lista de asistencia.**

---

## 7. Recursos / Credenciales

Archivos: `src/app/os/resources/*`, `src/lib/db/actions/resources.ts`

- Es el módulo mejor implementado: CRUD, cifrado, audit log y carpetas funcionan.
- **A — Sin alerta de rotación.** `rotationDueAt` se guarda pero nada notifica cuando vence.
- **M — Sin compartir credencial vía link temporal seguro.**
- **B — Sin importación masiva** (CSV de 1Password / Bitwarden).

---

## 8. Legal

Archivos: `src/app/os/legal/*`, `src/lib/db/actions/legal.ts`, `src/app/api/portal/signature/route.ts`

- **C — `generateLegalFromTemplateAction` no guarda el contenido generado.** `legal.ts:42` hace `bodyHtml` con replace y luego inserta `legalDocuments` con `sizeBytes: bodyHtml.length` pero **no almacena `bodyHtml` en ningún lado** (no hay columna `bodyHtml` en `legal_documents` ni se sube a Drive/Neon). El documento queda como un registro vacío.
- **C — `bodyHtml` en `legal_templates` se acepta sin sanitizar.** Si se renderiza con `dangerouslySetInnerHTML` (probable en preview), es XSS. Usar `DOMPurify` o sanitizar al ingresar.
- **C — `requestSignatureAction` solo marca el flag.** No envía email al cliente con link al portal para firmar. Implementar con Resend + token temporal.
- **A — Firma del portal solo guarda IP/UA/timestamp.** No genera PDF firmado descargable ni hash de integridad. Para vínculo legal serio hay que generar PDF con `pdf-lib`, hashearlo (SHA-256) y guardar el hash.
- **A — `legal/page.tsx` no tiene botón "Generar desde plantilla" desde la lista.** Solo en `legal/templates/`.
- **A — `expiresAt` y `signedAt` no disparan recordatorios** de renovación.
- **M — Sin envío múltiple a varios firmantes.**

---

## 9. Links / Hub / Generator

- `links/quick-save` (`src/app/api/links/quick-save/route.ts`) funciona con bearer token (`QUICK_SAVE_TOKEN`).
- Hub: `hub/new` se resuelve por `[id]/page.tsx:27` con `id === "new"`. Funciona. Editor BlockNote existe en `NoteEditor.tsx`.
- Generator (`generator/page.tsx`): autocontenido, funcional al 100%.
- **A — `/api/ai/suggest-next-step`** es un stub con sugerencias hardcodeadas por `ideaStatus` (4 respuestas posibles). Si quieres asistente IA real, conectar OpenAI (ya en deps).
- **M — Repositorios no se actualizan automáticamente** (stars/forks). El servicio `fetchGitHubRepo` existe pero solo se llama en quick-save inicial.

---

## 10. Portal del cliente

Archivos: `src/app/portal/*`, `src/app/api/portal/*`, `src/lib/auth/portal.ts`

- **C — Aprobaciones falsas.** `ApprovalsView.tsx:18-30` no llama al servidor. Crear `respondApprovalAction(approvalId, status, note)` y reemplazar. Además, registrar `respondedBy` con el `portalUserId` real.
- **A — Sin notificaciones al cliente** cuando se sube doc, se solicita firma, se publica aprobación o se actualiza estado de proyecto.
- **A — Comentarios del cliente** (`/api/portal/comments/route.ts`) funcionan pero solo si `session.portalUserId` existe; los logins PIN-only del cliente principal no comentan. Decidir si queremos permitirlo.
- **A — Tickets desde portal sí guardan** (`/api/tickets/route.ts`), pero no hay listado/respuesta de tickets desde el portal — solo el form de envío.
- **A — Stripe stub** (`/api/payments/create-checkout/route.ts:14`). Implementar con `stripe` (no está en deps; añadirlo).
- **M — `clientPortalUsers` se puede crear desde el OS, pero el cliente no puede gestionar sus propios contactos** desde el portal.
- **B — Estilos del portal usan `text-gray-*` y `bg-green-*` hardcoded** (no usan las CSS variables del OS).

---

## 11. Notificaciones

Archivos: `src/app/os/notifications/*`, `src/lib/notifications/service.ts`, `src/lib/db/actions/notifications.ts`

- **C — UI no persiste lecturas.** `NotificationsView.tsx:15-22` solo cambia estado local. Conectar a `markNotificationReadAction` y `markAllNotificationsReadAction`.
- **A — Emails apagados por defecto.** `pushNotification` (`service.ts:27`) solo manda email si `PORTAL_NOTIFICATIONS_ENABLED === "true"`. Encender en producción y documentar.
- **A — Preferencias por usuario no funcionales.** El tab `/settings/notificaciones` es decorativo (sin onChange, sin onClick). Hay que persistir en `users.preferences` y consultarlo en `pushNotification`.
- **A — Sin push Web (Service Worker / Web Push API).** Polling DB o nada.
- **A — `realtime/[channel]` solo manda heartbeats** (`route.ts`). No hay publisher de eventos. Quitar o implementar pub/sub real (BroadcastChannel + SSE, o Pusher / Ably / Redis Streams).
- **M — Sin digest semanal real.** Existe `src/lib/email/digest.ts`, pero no se programa.

---

## 12. Team / Admin / Settings

Archivos: `src/app/os/{team, admin, settings}/*`, `src/lib/db/actions/team.ts`, `src/lib/db/actions/settings.ts`, `src/lib/auth/permissions.ts`

- **C — No hay invitación por email.** `createTeamMemberAction` (`team.ts:11-21`) pide al admin que escriba la contraseña. Cambiar a flujo: admin crea miembro, sistema envía email con magic link de "establecer contraseña" (token firmado JWT, 24h).
- **C — Sin reset/recuperación de contraseña** ("Olvidé mi contraseña"). Crear `/api/auth/forgot-password` + `/login/reset/[token]`.
- **C — 2FA inalcanzable.** Endpoints `/api/auth/2fa/setup` y `/verify` están listos y bien escritos, pero:
  - No hay UI en `/os/settings` que los invoque (mostrar QR + input para verificar).
  - **`loginTeam` no verifica TOTP**. Hay que extender `loginAction` para que si `preferences.twoFactorEnabled === true`, exija paso `POST /api/auth/2fa/login-verify` antes de firmar la sesión.
- **A — Permisos por módulo huérfanos.** `setModulePermissionAction` (`team.ts:74-87`) funciona, `requireModuleAccess` existe (`permissions.ts`), pero:
  - Ninguna server action usa `requireModuleAccess`. Todas confían en `requireOsUser` / `requireAdminUser`.
  - No hay UI en `/os/team/[userId]` o `/os/settings` para asignar permisos por usuario × módulo (matriz).
  - El `permissions.ts` retorna `none` si no hay registro, lo cual implicaría bloquear todo, pero como nadie llama `requireModuleAccess` no se nota.
- **A — Rate limit de login roto.** `login/actions.ts:11`: `const ip = "server-action"` constante. Sustituir por `(await headers()).get("x-forwarded-for")` o usar `@upstash/ratelimit`.
- **A — `SettingsAccount` cambia contraseña** vía server action `changePasswordAction` ✓. PERO `settings/page.tsx` tabs **Notificaciones / Integraciones / Apariencia / Sistema son decorativos**:
  - Notificaciones: checkboxes con `defaultChecked` sin `onChange`, "Guardar preferencias" sin `onClick`.
  - Integraciones: "Conectado (OAuth2)" y "Activo" hardcoded, "Renovar token" sin acción.
  - Apariencia: radios sin `onChange`, "Aplicar cambios" sin `onClick`.
  - Sistema: versión `3.0.0` hardcoded.
- **A — Falta el panel de 2FA y "cerrar todas las sesiones"** en `/settings`.
- **M — Health endpoint expone cuenta de usuarios** (`/api/health`). Reducir a `{ db: "ok" }`.
- **M — `AUTH_SECRET` tiene fallback inseguro** (`session.ts:14`). En `NODE_ENV=production` el `throw` mitiga, pero por hábito quitar el fallback global.

---

## 13. AI / MCP

- `/api/mcp/{activity, graph, intent, tasks}` funcionan con rate limit Upstash. Útiles para integraciones externas. ✓
- `/api/mcp/intent` es stub admitido (`settings/page.tsx:119`).
- `/api/ai/suggest-next-step`: stub trivial. Para asistente real, integrar OpenAI con prompts contextuales (tareas del usuario, recientes en activity, etc.).

---

## 14. Actividad

- `/os/activity/page.tsx` consulta `activity` ordenada por fecha y delega a `ActivityFeed`. ✓ Funcional.
- **M — Sin filtros** por actor, tipo de entidad, verbo, rango de fechas.
- **M — Sin paginación**; tope de 50.

---

## 15. Seguridad y plataforma transversal

- **C — `zod` no se usa en server actions ni API routes** aunque esté en deps. Toda validación es manual (chequeos `if (!x)`). Crear esquemas Zod en `src/lib/validators/*` y reemplazar.
- **C — Stripe sin implementación real.**
- **C — Falta CSRF.** Las server actions de Next mitigan algo, pero los `POST` JSON a `/api/*` no validan origin ni token.
- **A — Sanitización HTML faltante** en legal templates y en cualquier sitio donde se inserte contenido del usuario en `dangerouslySetInnerHTML`. Instalar `dompurify` (o `isomorphic-dompurify`) y aplicar.
- **A — Sin logger / Sentry.** Errores se imprimen con `console.error`. Para producción: Sentry o Better Stack.
- **A — Sin CI** (no hay `.github/workflows`). Cualquier merge a main puede romper build.
- **A — Almacenamiento documentos:** si faltan vars de Google Drive, `uploadToDrive` lanza. El handler `/api/upload` captura el error genérico y responde 500 sin mensaje útil. Mejorar mensaje y degradar a Neon si Drive falla.
- **M — `.env.local.example` está bastante completo** (Stripe, Google Drive, Resend, Upstash, etc.). Bien. Solo falta documentar: `QUICK_SAVE_TOKEN`, `DRIVE_FOLDER_ID`.
- **M — Migrations**: 3 archivos en `/drizzle`. Hay que verificar que la tabla `__drizzle_migrations` esté sincronizada en producción (Neon). Si está vacía, `drizzle-kit migrate` reintentará todo. Hacer `INSERT` manual de las migraciones ya aplicadas como remediación.
- **M — i18n** ausente; todo en español. OK si el target es Latam.
- **B — Vercel Analytics importado** en layout, sin más config. OK.

---

## 16. Tests

- Vitest configurado (`vitest.config.ts`) pero **cero tests unitarios** en `src/**` (filtros `src/**/*.test.ts` no encuentran nada).
- Playwright e2e: `e2e/{auth, tasks, portal, workspace, ux-v2}.spec.ts` — 5 specs. Cobertura mínima. Hay que añadir e2e críticos: crear cliente → asignar proyecto → crear ciclo → crear tarea con tipo → asignar → arrastrar → completar → ver progreso.

---

# Plan de ejecución detallado

El objetivo es pasar de prototipo a software funcional para uso interno + socios reales. Cuatro sprints de ~1 semana cada uno (~4 semanas con un agente productivo a tiempo completo). Cada item incluye archivos específicos. El orden importa: arrancar por lo que bloquea el uso diario.

## Sprint 1 — Que las tareas y el portal sirvan de verdad (5–7 días)

Objetivo: que crear/editar tareas, mover en tablero, aprobar en portal y marcar notificaciones leídas funcione end-to-end con datos persistidos.

1. **Tareas — crear con todo lo que escribes**
   - `QuickTaskModal.tsx`: incluir `description` en el payload de `createTaskAction` (mapear a `descriptionJson` plano, por ahora `{ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: description }] }] }`).
   - `createTaskAction` (`tasks.ts:13-68`): aceptar `descriptionJson` y `state` (validar contra enum `["backlog","todo","in_progress","in_review","done","cancelled"]`). Reemplazar el hardcode `state: "todo"`.
   - Pasar `cycles` y `milestones` desde `tasks/page.tsx` y `board/page.tsx` a `TaskCreateButton`.
   - Reemplazar empty states en `TasksView`, `BoardView`, `InboxView`, `MineView` por un botón visible `<TaskCreateButton/>`.

2. **Tareas — edición completa**
   - Reemplazar el panel read-only de `tasks/[taskId]/page.tsx:119-141` por controles vivos:
     - Estado: `TaskStatePill` clickable que dispare `changeTaskStateAction`.
     - Prioridad: `PriorityDot` clickable.
     - Asignado: `TaskAssigneeSelect`.
     - Tipo: select con `TASK_TYPES`.
     - Fecha: `<input type="date">` que llame a `updateTaskAction({ dueDate })`.
     - Estimate, ciclo, hito: idem.
   - Sustituir `BlockEditor editable={false}` por wrapper cliente que persista con debounce a `updateTaskAction({ descriptionJson })`.
   - En `TaskDetailSheet.tsx:106-108`: reemplazar placeholder por el `BlockEditor` real.
   - Permitir editar título inline en ambas vistas.

3. **Tableros — drag estable**
   - En `BoardView.tsx:65-87`, añadir un "drag handle" (`<GripVertical />` en la card) y conectarle el `attributes/listeners` del `useSortable` solo a él. Quitar `onClick` del contenedor envolvente del DragOverlay.
   - O alternativamente: subir `distance` del `PointerSensor` en `KanbanBoard.tsx:50` a 8–10px.
   - Actualizar `orderIndex` al soltar dentro de la misma columna (no solo `state`).

4. **Progreso del proyecto: manual vs auto**
   - Migración Drizzle: añadir `progressMode: text not null default 'auto'` a `projects`.
   - `updateProjectAction`: aceptar `progressMode` y, si es `manual`, no recalcular.
   - `recalculateProjectProgress` (`tasks.ts:93`): leer `progressMode`; salir temprano si es `manual`.
   - `EditProjectForm.tsx`: añadir switch "Calcular progreso automáticamente".

5. **Portal — aprobaciones reales**
   - Crear `respondApprovalAction(approvalId: string, status: 'approved'|'rejected'|'changes_requested', note?: string)` en `src/lib/db/actions/approvals.ts` (valida que la sesión es del portal y que el approval pertenece a su cliente).
   - Reemplazar el handler mock en `ApprovalsView.tsx:18-30`.
   - Disparar `pushNotification` al equipo (`requestedBy`).
   - Log de actividad con `actorType: "client"`.

6. **Notificaciones — persistir lecturas**
   - En `NotificationsView.tsx`: invocar `markNotificationReadAction(id)` al hacer click en una notificación; invocar `markAllNotificationsReadAction()` en el botón "Marcar todas".
   - Mostrar contador correcto en el `AppChrome` después de marcar.

7. **Settings — desfalsificar la cuenta y notificaciones**
   - Tab "Cuenta": ya funciona ✓.
   - Tab "Notificaciones": persistir checkboxes en `users.preferences` (`{ notifTaskAssigned: boolean, notifMentions: boolean, notifDigestWeekly: boolean }`) vía nueva acción `updateNotificationPreferencesAction`. Que `pushNotification` consulte y respete.
   - Tab "Apariencia": persistir densidad en `users.preferences.density` y leerla en `DataTable`/`TaskRow`.
   - Tab "Sistema": leer versión de `package.json` en build-time.

8. **Login — rate limit per-IP de verdad**
   - `login/actions.ts:11`: reemplazar `ip = "server-action"` por `(await headers()).get("x-forwarded-for") ?? "unknown"`.
   - O migrar a `@upstash/ratelimit` (consistente con MCP).

## Sprint 2 — Filtros, edición transversal, ciclos vivos, finanzas usables (5–7 días)

1. **Integrar `TaskFilters`** en `TasksView`, `BoardView`, `MineView`, `InboxView`, y conectarlo al backend (filtrar server-side ideal, client-side aceptable como primer paso). Vincular `groupBy` para agrupar por asignado/ciclo/hito/tipo.

2. **Saved Views reales**
   - Reemplazar `mockViews` en `CrmList.tsx:95-98` por `listSavedViewsAction("/os/crm")`.
   - Replicar en proyectos, finanzas, marketing.
   - Acción `createSavedViewAction(route, queryJson, name, isShared)`.

3. **Ciclos — flujo completo de sprint**
   - UI en `/cycles/[cycleId]/page.tsx`: botones "Activar", "Cerrar (mover no terminadas al backlog)", "Cerrar (mover al siguiente ciclo)".
   - Multiselección en `TasksView` con barra de acciones masivas → `addTasksToCycleAction`.
   - Conectar `BurndownChart` con tareas del ciclo (puntos vs días).
   - Validación en `CreateCycleDialog`: `endsAt > startsAt`.

4. **Hitos — mover tareas y vista timeline**
   - Multiselección en `TasksView` → `assignToMilestone`.
   - `RoadmapTimeline` (componente existente) en `/os/projects/roadmap` y `/projects/[id]/milestones`.

5. **Bloqueos editables**
   - En `tasks/[taskId]/page.tsx`: botones "+ Agregar bloqueo" / "× quitar bloqueo" que invoquen `linkTaskBlocksAction` / `unlinkTaskBlocksAction`.

6. **CRM — bulk actions reales + pipeline mínimo**
   - Implementar `bulkTagClientsAction` y `bulkDeleteClientsAction`; reemplazar `console.log` en `CrmList.tsx:91-92`.
   - Nuevo schema: `opportunities` (id, client_id, name, stage, amount_cop, probability, expected_close, owner_id, status, lost_reason, created_at). Migración Drizzle.
   - Vista Kanban en `/os/crm/opportunities` con `KanbanBoard` (5 columnas: lead, qualified, proposal, won, lost).
   - Tab "Oportunidades" en `crm/[slug]/page.tsx`.

7. **Finanzas — edición completa**
   - Extender form de `/finances/[id]/page.tsx` con IVA, recurrencia, moneda, número de factura, vínculo cliente/proyecto.
   - Formulario de edición (no solo "marcar pagado").
   - Botón eliminar con AlertDialog.
   - Exportar CSV/XLSX (con `papaparse` o `exceljs`).

8. **Notificaciones — emails y digest**
   - Encender `PORTAL_NOTIFICATIONS_ENABLED=true` en `.env.local` de producción.
   - Cron de Vercel `/api/cron/digest` que invoque `src/lib/email/digest.ts` semanalmente.
   - Plantillas HTML para los 5 tipos de notificación (asignación, mención, comentario, aprobación, recordatorio).

## Sprint 3 — Seguridad, integraciones y "modo socios externos" (5–7 días)

1. **Validación Zod en todo lo público**
   - Crear `src/lib/validators/{tasks, finances, clients, projects, agenda, marketing, legal, portal}.ts`.
   - Reemplazar `String(formData.get(...))` por `schema.parse(Object.fromEntries(formData))`.
   - Cubrir `/api/*` routes con `schema.safeParse(await req.json())`.

2. **CSRF + sanitización HTML**
   - Token CSRF en server actions sensibles (puedes usar Next.js `headers()` para validar origin).
   - `isomorphic-dompurify` en `bodyHtml` de legal templates, descripciones de approval, ticket.description, etc.

3. **2FA real**
   - UI en `/os/settings` tab nueva "Seguridad": botón "Activar 2FA" → llama `/api/auth/2fa/setup`, muestra QR (`qrcode` ya en deps), input para token, llama `/verify`.
   - Extender `loginAction`/`loginTeam`: si `user.preferences.twoFactorEnabled`, NO firmar la sesión todavía; redirigir a `/login/2fa` con estado intermedio (token corto firmado solo con userId). Allí pedir TOTP y al validarlo, firmar la sesión OS final.
   - Botón "Cerrar todas las sesiones" (rotar `AUTH_SECRET` o invalidar JWTs vía blacklist de userId con `tokenVersion`).

4. **Reset/forgot password + invitación por email**
   - `/api/auth/forgot-password`: recibe email, genera token JWT 1h, envía email con link `/login/reset/[token]`.
   - `/login/reset/[token]/page.tsx`: form que llama `/api/auth/reset-password`.
   - `createTeamMemberAction`: ya no exigir password; generar token de "set password" (24h), enviar email de bienvenida.

5. **RBAC enforcement real**
   - En cada server action de un módulo, sustituir `requireOsUser()` por `requireOsUser()` + `await requireModuleAccess(userId, "projects", "write")`.
   - Crear UI en `/os/team/[userId]` con matriz de permisos (módulos × {none,read,write,admin}) que invoque `setModulePermissionAction`.

6. **Stripe real (portal)**
   - `npm install stripe`.
   - `/api/payments/create-checkout`: crear sesión real con `stripe.checkout.sessions.create` (line items desde finanzas pendientes del cliente).
   - `/api/payments/webhook`: marcar `finances.status = "paid"` y disparar notificación al equipo.
   - `STRIPE_WEBHOOK_SECRET` en env.

7. **Documentos — link compartir + Drive estable**
   - Conectar `ShareDocumentSheet` al botón en `documents/[id]/page.tsx`.
   - Capturar errores específicos de `uploadToDrive` y degradar a Neon o devolver mensaje claro.
   - Implementar `getLatestVersions` real en `DocsList` (agrupar por `parentId`, mostrar solo versión más alta).

8. **Legal — generación y firma real**
   - Migración: añadir `legalDocuments.bodyHtml` (text). `generateLegalFromTemplateAction` debe guardarlo.
   - `requestSignatureAction`: enviar email al cliente con link al portal (`/portal/[slug]/legal/[id]/sign`) usando token firmado.
   - Al firmar: generar PDF con `pdf-lib`, calcular SHA-256, guardar en `signatures` columnas nuevas `pdfUrl`, `pdfHash`.
   - Sanitizar HTML al renderizar.

## Sprint 4 — Tiempo real, recordatorios, Agenda Google, observabilidad y tests (5–7 días)

1. **Agenda — recurrencia y reminders**
   - `npm install rrule`.
   - Helper `expandRecurrences(events, viewStart, viewEnd)` para `AgendaView`.
   - Cron `/api/cron/reminders` (cada 1 min): buscar eventos cuyo `startsAt - reminderMinutes` esté en la última ventana y mandar email + push.

2. **Google Calendar sync**
   - OAuth2 con `googleapis`, refresh token guardado en `users.preferences.googleCalendar`.
   - Job `/api/cron/calendar-sync` que sincronice eventos pendientes en ambos sentidos. `externalProvider="google"`, `externalId` = id del evento de Google.

3. **Tiempo real correcto**
   - Reemplazar `/api/realtime/[channel]` por SSE real con publisher en memoria (o usar Pusher/Ably si esperas múltiples instancias).
   - Publicar eventos `task.updated`, `notification.created`, `approval.responded` y consumirlos en `AppChrome` para refrescar badges sin recargar.

4. **Marketing — calendar drag, métricas mínimas**
   - Drag de items en `marketing/calendar` para reprogramar (mismo `KanbanBoard` o usar `react-big-calendar` con `onEventDrop`).
   - Integración mínima con Instagram Graph API (followers/reach) detrás de feature flag.

5. **Observabilidad**
   - Sentry o Better Stack: instalar SDK, capturar `console.error` y errores no atrapados.
   - Logger central `src/lib/log.ts`.
   - Reducir payload de `/api/health` a `{ status: "ok", db: "ok" }`.

6. **Migraciones a prueba de balas**
   - Validar `__drizzle_migrations` en Neon producción; si está vacía, popular manualmente con los hashes de los 3 archivos existentes.
   - Pipeline en `package.json`: `npm run db:migrate` antes de cada deploy.

7. **CI básico**
   - `.github/workflows/ci.yml`: `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npx playwright test`.
   - Build preview en Vercel automático en PR.

8. **Tests críticos**
   - Vitest: unit de `createTaskAction`, `recalculateProjectProgress`, `pushNotification`, `respondApprovalAction`, validadores Zod.
   - Playwright e2e: flujo completo "cliente nuevo → proyecto → ciclo → tarea → tablero drag → completar → aprobar en portal → cliente firma legal".

---

## Anexo A — Quick wins de baja fricción (puedes pedirlos en paralelo)

- Quitar `Ctrl+.` del empty state y mostrar botón visible (`TasksView.tsx:48-58`, `InboxView.tsx`, `BoardView.tsx`).
- Eliminar el comentario hardcoded `<p>Descripción de la tarea...</p>` en `TaskDetailSheet.tsx:107`.
- Quitar `mockViews` de `CrmList.tsx:95-98`.
- Quitar versión "3.0.0" hardcodeada en `settings/page.tsx`.
- Eliminar el mensaje "Stub V3.0" del tab MCP cuando ya implementes intent.

## Anexo B — Dependencias a añadir

```
npm install rrule dompurify isomorphic-dompurify stripe
npm install --save-dev @types/dompurify
```

(`zod`, `googleapis`, `qrcode`, `otpauth`, `pdf-lib`, `@upstash/ratelimit`, `@upstash/redis` ya están instaladas y no se usan al máximo.)

## Anexo C — Migraciones Drizzle pendientes

1. `projects.progressMode: text not null default 'auto'`
2. `legalDocuments.bodyHtml: text`
3. `signatures.pdfUrl: text`, `signatures.pdfHash: text`
4. `users.preferences` con shape tipado: `{ twoFactorSecret?: string, twoFactorEnabled?: boolean, density?: 'compact'|'comfortable', notifTaskAssigned?: boolean, notifMentions?: boolean, notifDigestWeekly?: boolean, googleCalendar?: { refreshToken, calendarId } }`
5. Nueva tabla `opportunities` (CRM pipeline) — ver Sprint 2 §6.
6. Nueva tabla `password_reset_tokens` (id, userId, tokenHash, expiresAt, usedAt).
7. Nueva tabla `team_invitations` (id, email, name, role, tokenHash, expiresAt, acceptedAt).
8. (Opcional) tabla `task_attachments` (id, taskId, name, url, sizeBytes, mimeType, uploadedBy, createdAt).

---

## Cómo usar este documento

- Pasa este `.md` completo al agente programador.
- Pídele empezar por el **Sprint 1** ítem por ítem. Cada ítem es self-contained con rutas y nombres exactos.
- Después de cada sprint, validar manualmente con un caso real (crear cliente → proyecto → tareas con cada tipo → arrastrar → comentar → aprobar en portal).
- El Sprint 3 es el que habilita socios externos seguros; no abras el portal a terceros sin completarlo.

Total estimado: **4 semanas de un agente productivo**, con un 70–75% de la base ya construida pero con muchísimos cables sueltos. La mayoría de las funciones grandes ya están escritas a medias; el trabajo principal es **conectar UI con backend** y **completar flujos**.
