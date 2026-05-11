# Plan de Implementación — Vertrex OS V3

Este plan ejecuta la migración técnica V2 → V3 sobre la implementación existente.

**Fuentes de verdad (orden de prioridad):**
1. `vertrex-os-v3-prd.md` — negocio y datos.
2. `vertrex-os-v3-tasks-linear-spec.md` — sistema de tareas.
3. `vertrex-os-v3-ux-spec.md` — interfaz.
4. `vertrex-os-v3-ux-implementation-plan.md` — pasos visuales atómicos.
5. Documentos V1/V2 — base que NO se debe romper.

**Idioma del sistema:** Español. **Moneda principal:** COP.

---

## Archivos que NO se deben modificar

- `Vertrex-Website/docs/md/vertrex-os-prd(1).md`
- `Vertrex-Website/docs/md/vertrex-os-v3-prd.md`
- `Vertrex-Website/docs/md/vertrex-os-v3-tasks-linear-spec.md`
- `Vertrex-Website/docs/md/vertrex-os-v3-ux-spec.md`
- `Vertrex-Website/.env.local`
- `Vertrex-Website/node_modules/**`
- `Vertrex-Website/.next/**`
- `Vertrex-Website/public/**`
- Rutas públicas de la landing (`src/app/page.tsx`, `src/app/contacto/**`, `src/app/portafolio/**`, `src/app/servicios/**`, `src/app/sobre-nosotros/**`, `src/app/cuestionario/**`, `src/app/demos/**`, `src/app/terminos/**`, `src/app/politica-de-privacidad/**`)
- `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/ContactForm.tsx`, `src/components/ProjectCards.tsx`, `src/components/ProjectDetailClient.tsx`
- `drizzle/meta/**`
- `package-lock.json` (solo cambia vía `npm install`)

---

## Regla base de V3

**V3 es aditiva, no destructiva.** No se elimina ningún módulo, ruta o tabla de V2 salvo que el PRD V3 lo indique explícitamente. Todas las nuevas columnas se añaden como nullable o con default. Las migraciones se generan con Drizzle, no se editan a mano.

Si un módulo V2 ya cumple V3 sin cambios, se respeta. Si V3 añade comportamiento, se extiende.

---

## Fase V3-0 — Preparación

1. `[Vertrex-Website/docs/md/vertrex-os-v3-prd.md]` → Leer completo. Anotar listado de tablas nuevas y columnas a añadir → El ejecutor tiene mapa mental claro del alcance.
2. `[Vertrex-Website/docs/md/vertrex-os-v3-tasks-linear-spec.md]` → Leer completo → El ejecutor entiende contratos de actions y rutas del módulo Proyectos V3.
3. `[Vertrex-Website/docs/md/vertrex-os-v3-gap-matrix.md]` → Leer la matriz de gaps V2 → V3. Priorizar P0 → P1 → P2 → P3 → No se empiezan mejoras "premium" antes de cerrar las funcionales.
4. `[Vertrex-Website/package.json]` → Auditar dependencias actuales (V2). Identificar qué V3 requiere y no existe (PDF render, mail, etc.) → Lista final de `npm install` queda definida antes de tocar código.
5. `[Vertrex-Website/.env.local]` → Verificar variables nuevas V3 listadas en PRD §8. Si faltan, anotar para el dueño del proyecto. No imprimir valores → Entorno preparado o claramente carente.

### Checkpoint V3-0

6. `[Vertrex-Website]` → Confirmar por escrito el alcance V3.0 vs. V3.1 según PRD §10. No iniciar implementación si hay ambigüedad → Sin ambigüedad de scope se evita bloat y desvíos.

---

## Fase V3-1 — Dependencias nuevas

7. `[Vertrex-Website/package.json]` → Instalar `nodemailer` si se usará SMTP propio, o `resend` si se opta por Resend. La decisión la toma el dueño del proyecto. Default sugerido: `resend` por simplicidad → Backend de email queda disponible.
8. `[Vertrex-Website/package.json]` → Instalar `pdf-lib` para generación de PDFs (facturas y firma) → Generación de PDF queda disponible sin depender de Playwright.
9. `[Vertrex-Website/package.json]` → Instalar `date-fns` si no está presente, para formato de fechas en español → Formato consistente de fechas.
10. `[Vertrex-Website/package.json]` → Instalar `@dnd-kit/core` y `@dnd-kit/sortable` solo si se decide implementar drag & drop en kanban en V3.0. Si no, postergar a V3.1 → Decisión tomada antes de escribir UI del tablero.
11. `[Vertrex-Website]` → Ejecutar `npm install` con la lista anterior consolidada → `package.json` y `package-lock.json` quedan actualizados.

### Checkpoint V3-1

12. `[Vertrex-Website]` → `npm ls <todas las nuevas dependencias>` → Lista sin errores. Si falla, no avanzar.

---

## Fase V3-2 — Schema y migraciones

13. `[Vertrex-Website/src/lib/db/schema.ts]` → Extender enum `entity_type` con los valores nuevos del PRD §2.1 → El grafo soporta los nuevos tipos.
14. `[Vertrex-Website/src/lib/db/schema.ts]` → Añadir tabla `tasks` (PRD §3.1 + Tasks spec §2.1) con FKs, índices `(project_id)`, `(assignee_id)`, `(cycle_id)`, `(milestone_id)`, `(parent_task_id)`, `(state)`, `(due_date)`, `(identifier)` UNIQUE → El sistema de tareas tiene almacenamiento.
15. `[Vertrex-Website/src/lib/db/schema.ts]` → Añadir tablas `cycles`, `milestones`, `tags`, `task_labels` → Cycles y milestones quedan disponibles.
16. `[Vertrex-Website/src/lib/db/schema.ts]` → Añadir columnas `project_key text UNIQUE`, `budget_cop integer` a `projects` → Identifiers automáticos y presupuesto disponibles.
17. `[Vertrex-Website/src/lib/db/schema.ts]` → Añadir columnas `currency`, `recurrence`, `next_due_date`, `vat_amount_cop`, `vat_rate`, `invoice_number` a `finances` → Multi-moneda y recurrencia.
18. `[Vertrex-Website/src/lib/db/schema.ts]` → Añadir `client_portal_users` tabla y conservar `clients.pin_hash` → Multi-PIN.
19. `[Vertrex-Website/src/lib/db/schema.ts]` → Añadir `document_folders`, columnas `folder_id`, `version`, `parent_id` en `documents`; `share_tokens` tabla → Folders, versionado y compartir.
20. `[Vertrex-Website/src/lib/db/schema.ts]` → Añadir `legal_templates`, columnas `expires_at`, `template_id`, `requires_signature boolean` en `legal_documents`; tabla `signatures` → Legal V3.
21. `[Vertrex-Website/src/lib/db/schema.ts]` → Añadir columnas `rotation_due_at`, `visibility`, `folder_id`, `owner_id` en `resources`; tablas `resource_folders`, `resource_access_log` → Recursos V3.
22. `[Vertrex-Website/src/lib/db/schema.ts]` → Añadir columnas `recurrence_rule`, `timezone`, `external_provider`, `external_id`, `reminder_minutes` en `agenda_events` → Agenda V3.
23. `[Vertrex-Website/src/lib/db/schema.ts]` → Añadir `link_collections`, columnas `collection_id`, `reading_status` en `links` y `collection_id` en `repositories` → Links V3.
24. `[Vertrex-Website/src/lib/db/schema.ts]` → Añadir `marketing_hashtags`, columnas `asset_document_ids`, `reach`, `likes`, `comments`, `saves` en `content_plan` → Marketing V3.
25. `[Vertrex-Website/src/lib/db/schema.ts]` → Añadir columnas `status` en `users` y `preferences jsonb default '{}'`; tabla `module_permissions` → Team V3.
26. `[Vertrex-Website/src/lib/db/schema.ts]` → Añadir tablas `comments`, `approvals`, `notifications`, `activity`, `saved_views` → Capacidades cross-módulo V3.
27. `[Vertrex-Website/src/lib/db/schema.ts]` → Añadir índices necesarios: `(relation_type)`, `(source_type, relation_type, target_type)` sobre `entity_links` → Queries del grafo no degradan.
28. `[Vertrex-Website]` → Ejecutar `npm run db:generate` → Drizzle emite migración SQL nueva. Inspeccionar archivo para garantizar que no contiene `DROP COLUMN` ni `DROP TABLE` accidentales.
29. `[Vertrex-Website]` → Ejecutar `npm run db:migrate` contra Neon de desarrollo → Migración aplica sin error.

### Checkpoint V3-2

30. `[Vertrex-Website]` → `npm run typecheck` debe pasar. Datos V2 deben seguir consultables → Sin regresiones de schema.

---

## Fase V3-3 — Servicios y helpers compartidos

31. `[Vertrex-Website/src/lib/notifications/service.ts]` → Crear servicio `pushNotification(userId, payload)` que inserta en `notifications` y opcionalmente envía email vía proveedor configurado → Notificaciones internas operativas.
32. `[Vertrex-Website/src/lib/email/provider.ts]` → Crear adapter de email (Resend o nodemailer SMTP según decisión). Exportar `sendEmail({to, subject, html})` → Email queda disponible.
33. `[Vertrex-Website/src/lib/activity/log.ts]` → Crear `logActivity({actor, verb, targetType, targetId, payload})` que inserta en `activity` → Feed de actividad alimentado desde cualquier action.
34. `[Vertrex-Website/src/lib/pdf/render.ts]` → Crear renderer con `pdf-lib` que toma plantilla HTML y datos, retorna `Uint8Array` PDF → Cuentas de cobro y firma generan archivo.
35. `[Vertrex-Website/src/lib/identifiers/project-key.ts]` → Crear helpers `generateProjectKey(name)`, `nextTaskIdentifier(projectKey)` con race safety (transacción + reintento) → Identifiers únicos garantizados.
36. `[Vertrex-Website/src/lib/db/actions/graph.ts]` → Extender helpers para resolver relaciones por `relation_type` y para resolver labels enriquecidos para cualquier `entity_type` nuevo (`task`, `cycle`, `milestone`, etc.) → `EntitySidebar` y `EntityConnectSheet` soportan tipos V3 sin cambios mayores.
37. `[Vertrex-Website/src/lib/db/actions/search.ts]` → Extender `searchEntitiesAction` para incluir `tasks` (por identifier y title), `cycles`, `milestones`, `comments`, `tags`. Soportar operadores `is:task`, `assignee:me`, `priority:high`, `project:KEY`, `due:<7d` → Búsqueda global V3 funcional.
38. `[Vertrex-Website/src/lib/auth/portal.ts]` → Extender `verifyPortalAccess` para aceptar `email + pin` y consultar primero `client_portal_users`; conservar fallback a `clients.pin_hash` → Multi-PIN operativo sin romper V2.
39. `[Vertrex-Website/src/lib/auth/portal.ts]` → Añadir `portal_user_id` en `PortalSession` JWT → El portal sabe qué persona está logueada.

### Checkpoint V3-3

40. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Si falla, no avanzar.

---

## Fase V3-4 — Tareas, ciclos, milestones (módulo Proyectos V3)

41. `[Vertrex-Website/src/lib/db/actions/tasks.ts]` → Implementar todas las server actions listadas en Tasks spec §7: `createTaskAction`, `updateTaskAction`, `moveTaskToProjectAction`, `changeTaskStateAction`, `assignTaskAction`, `setTaskPriorityAction`, `createSubtaskAction`, `linkTaskBlocksAction`, `unlinkTaskBlocksAction`, `listTasksAction`, `getTaskDetailAction`, `bulkUpdateTasksAction` → Backend de tareas operativo.
42. `[Vertrex-Website/src/lib/db/actions/tasks.ts]` → Cada mutación debe llamar `logActivity` y, donde aplique, `pushNotification` (asignación, in_review, vencimiento, comentario) → Side effects observables.
43. `[Vertrex-Website/src/lib/db/actions/tasks.ts]` → `changeTaskStateAction('done')` recalcula automáticamente: progreso del proyecto, status de milestone si todos sus tasks están done, notificación a desbloqueadas → Reglas Sección 6 cumplidas.
44. `[Vertrex-Website/src/lib/db/actions/cycles.ts]` → Implementar `createCycleAction`, `activateCycleAction`, `closeCycleAction`, `addTasksToCycleAction`. Activar cycle marca anterior como completed → Cycles operativos.
45. `[Vertrex-Website/src/lib/db/actions/milestones.ts]` → Implementar `createMilestoneAction`, `updateMilestoneAction`, `completeMilestoneAction`, `addTasksToMilestoneAction`. Auto-completar al cerrar todas las tareas → Milestones operativos.
46. `[Vertrex-Website/src/lib/db/actions/tags.ts]` → Implementar tags cross-módulo según Tasks spec §7 → Etiquetas funcionales.
47. `[Vertrex-Website/src/components/os/Tasks/TaskRow.tsx]` → Componente fila con identifier monospace, título, estado pill, priority dot, assignee avatar, ciclo, due_date, points, tags → Reusable en lista, board, mine, inbox.
48. `[Vertrex-Website/src/components/os/Tasks/TaskDetailSheet.tsx]` → Sheet de detalle rápido (row click) con BlockEditor read-mostly y panel propiedades → No saca al usuario de la lista.
49. `[Vertrex-Website/src/components/os/Tasks/TaskDetail.tsx]` → Página completa según UX spec V3 §3.7 → Detalle completo con subtareas, bloqueos, adjuntos, comentarios.
50. `[Vertrex-Website/src/components/os/Tasks/QuickTaskModal.tsx]` → Captura rápida Ctrl+. similar a QuickIdeaModal → Captura sin fricción.
51. `[Vertrex-Website/src/components/os/Tasks/TaskFilters.tsx]` → Componente compartido de filtros de tarea sincronizados con URL → Vistas compartibles.
52. `[Vertrex-Website/src/app/os/projects/inbox/page.tsx]` → Lista inbox según Tasks spec §3.1 → Triage operativo.
53. `[Vertrex-Website/src/app/os/projects/mine/page.tsx]` → Mis tareas según §3.2 → Vista personal lista.
54. `[Vertrex-Website/src/app/os/projects/roadmap/page.tsx]` → Timeline read-only según §3.3 → Roadmap V3.0.
55. `[Vertrex-Website/src/app/os/projects/[id]/tasks/page.tsx]` → DataTable con filtros, agrupación, inline edit, bulk → Lista de tareas operativa.
56. `[Vertrex-Website/src/app/os/projects/[id]/board/page.tsx]` → Kanban con drag & drop (si dnd-kit instalado) o menú de cambio de estado → Tablero operativo.
57. `[Vertrex-Website/src/app/os/projects/[id]/cycles/page.tsx]` y `[cycleId]/page.tsx` → Cycles list y detalle con burndown SVG → Cycles UI.
58. `[Vertrex-Website/src/app/os/projects/[id]/milestones/page.tsx]` → Hitos UI → Milestones UI.
59. `[Vertrex-Website/src/app/os/projects/[id]/tasks/[taskId]/page.tsx]` → Detalle de tarea completo → Detalle funcional.
60. `[Vertrex-Website/src/app/t/[identifier]/route.ts]` → Route handler que resuelve `VTX-142` → redirige a `/os/projects/[id]/tasks/[taskId]` → Shortcut URL operativo.
61. `[Vertrex-Website/src/app/os/projects/[id]/page.tsx]` → Añadir tabs nuevos: Tareas, Tablero, Ciclos, Hitos. Panel "Resumen de ejecución" en Overview → Detalle proyecto V3 completo.
62. `[Vertrex-Website/src/components/os/Editor/MentionPlugin.tsx]` → BlockNote plugin / extension para mention `@` con dropdown buscando entidades; al guardar, server action materializa relaciones en `entity_links` → Mentions inline operativas en descripciones y comentarios.

### Checkpoint V3-4

63. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Probar manualmente: crear proyecto, crear tarea con `Ctrl+.`, crear subtarea, mover a in_progress, asignar, marcar bloqueo, cerrar tarea bloqueante, verificar notification creada, verificar identifier autogenerado correctamente, mover tarea a ciclo. Si falla, no avanzar.

---

## Fase V3-5 — Notificaciones, actividad, comentarios, aprobaciones

64. `[Vertrex-Website/src/components/os/Notifications/NotificationBell.tsx]` → Topbar bell con badge, Sheet con lista → UI de notificaciones.
65. `[Vertrex-Website/src/app/os/notifications/page.tsx]` → Centro completo → Ruta accesible.
66. `[Vertrex-Website/src/components/os/Activity/ActivityFeed.tsx]` → Renderer cronológico de `activity` filtrable por target/actor → Reusable en dashboard, CRM timeline, task detail.
67. `[Vertrex-Website/src/lib/db/actions/comments.ts]` → Implementar `addCommentAction(targetType, targetId, body)`. Solo team puede comentar desde OS; portal usa endpoint separado → Comentarios OS.
68. `[Vertrex-Website/src/app/api/portal/comments/route.ts]` → POST autenticado por `portal_session` que crea comment con `author_type='client'` y conecta vía grafo → Portal comenta.
69. `[Vertrex-Website/src/lib/db/actions/approvals.ts]` → Implementar `requestApprovalAction`, `respondApprovalAction(approvalId, decision, note?)` → Aprobaciones cross-portal/OS.
70. `[Vertrex-Website/src/app/portal/[slug]/approvals/page.tsx]` → Lista aprobaciones pendientes y respondidas → Portal puede responder.
71. `[Vertrex-Website/src/components/os/Approvals/RequestApprovalSheet.tsx]` → Desde detalle de cualquier entidad, abrir Sheet "Pedir aprobación al cliente" → Equipo solicita aprobación.
72. `[Vertrex-Website/src/app/os/admin/page.tsx]` → Añadir feed de actividad reciente + panel "Mi día" → Dashboard V3.
73. `[Vertrex-Website/src/app/os/crm/[slug]/timeline/page.tsx]` → Ruta de timeline del cliente usando `ActivityFeed` → Timeline CRM operativo.

### Checkpoint V3-5

74. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Probar manualmente: asignar tarea y verificar notification, comentar tarea y verificar notification al asignado, pedir aprobación sobre documento, responder desde portal con segundo PIN/usuario y ver respuesta en OS. Si falla, no avanzar.

---

## Fase V3-6 — Documentos, Legal, Recursos extendidos

75. `[Vertrex-Website/src/lib/db/actions/documents.ts]` → Añadir `createFolderAction`, `moveDocumentToFolderAction`, `uploadDocumentVersionAction` (detecta name+folder match y crea v+1 con `parent_id`), `createShareTokenAction`, `revokeShareTokenAction` → Documentos V3.
76. `[Vertrex-Website/src/app/share/[token]/route.ts]` → Route handler que valida token y expiración, sirve archivo si Neon o redirige a URL Drive si aplica, con log → Compartir público operativo.
77. `[Vertrex-Website/src/app/os/documents/folders/page.tsx]` y `[id]/versions/page.tsx` → UI folders y versiones → Funcionalidades expuestas.
78. `[Vertrex-Website/src/lib/db/actions/legal.ts]` → Añadir `createLegalTemplateAction`, `generateLegalFromTemplateAction(templateId, vars, clientId, projectId?)` que produce HTML, lo guarda como `legal_documents`, opcionalmente convierte a PDF vía `renderPdf`, conecta al cliente/proyecto → Plantillas legales operativas.
79. `[Vertrex-Website/src/lib/db/actions/legal.ts]` → Añadir `requestSignatureAction(legalId, clientId, portalUserIds[])` que marca `requires_signature=true` y notifica → Solicitud de firma operativa.
80. `[Vertrex-Website/src/app/api/portal/signature/route.ts]` → POST autenticado por `portal_session` que crea fila `signatures` con IP, UA, timestamp y dispara `logActivity` + `pushNotification` al equipo → Firma electrónica simple operativa.
81. `[Vertrex-Website/src/app/portal/[slug]/legal/page.tsx]` → Lista legales públicos con CTA "Firmar" cuando aplica → Portal firma.
82. `[Vertrex-Website/src/app/os/legal/templates/page.tsx]` → CRUD plantillas → Plantillas administrables.
83. `[Vertrex-Website/src/lib/db/actions/resources.ts]` → Añadir `setRotationAction`, `createResourceFolderAction`, `setResourceVisibilityAction`, `exportVaultAction` (admin only, exporta JSON cifrado) → Recursos V3.
84. `[Vertrex-Website/src/lib/db/actions/resources.ts]` → `revealResourceAction` registra entrada en `resource_access_log` y respeta `visibility` → Audit y permisos.
85. `[Vertrex-Website/src/app/os/resources/folders/page.tsx]` y `audit/page.tsx` → UI folders y auditoría → Funcionalidades expuestas.

### Checkpoint V3-6

86. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Probar: subir documento, re-subir mismo nombre, ver v2; generar token compartir y abrir desde incógnito; generar PDF legal desde plantilla; cliente firma desde portal; equipo ve firma registrada; revelar recurso restringido y verificar log. Si falla, no avanzar.

---

## Fase V3-7 — Finanzas extendidas

87. `[Vertrex-Website/src/lib/db/actions/finances.ts]` → Añadir soporte de `currency`, `recurrence`, `vat`. Al marcar pagado un recurrente, autoinsertar siguiente periodo → Recurrencia automática.
88. `[Vertrex-Website/src/lib/db/actions/finances.ts]` → `generateInvoiceAction(projectId, milestoneId?, items)` produce HTML+PDF con `renderPdf`, lo guarda en `legal_documents` tipo `cuenta_cobro`, conecta al cliente/proyecto/milestone vía grafo → Cuentas de cobro generables.
89. `[Vertrex-Website/src/app/os/finances/projects/page.tsx]` → P&L por proyecto agrupando ingresos/gastos conectados → P&L visible.
90. `[Vertrex-Website/src/app/os/finances/cashflow/page.tsx]` → Proyección 90 días sumando ingresos pendientes + gastos recurrentes proyectados → Cashflow operativo.
91. `[Vertrex-Website/src/app/os/finances/invoices/page.tsx]` → Lista de cuentas de cobro generadas → Inventario claro.
92. `[Vertrex-Website/src/app/os/projects/[id]/page.tsx]` → Si `budget_cop` definido, mostrar barra "Presupuesto consumido" con badges 80%/100% → Alerta de presupuesto.

### Checkpoint V3-7

93. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Probar: registrar gasto recurrente, marcar pagado, verificar próximo periodo; generar cuenta de cobro; ver P&L y cashflow. Si falla, no avanzar.

---

## Fase V3-8 — Hub, Agenda, Links, Marketing extendidos

94. `[Vertrex-Website/src/lib/db/actions/hub.ts]` → Implementar daily notes (upsert por fecha), tags, score idea, templates de idea → Hub V3.
95. `[Vertrex-Website/src/app/os/hub/daily/[date]/page.tsx]` → Daily note → Ruta operativa.
96. `[Vertrex-Website/src/components/os/Editor/MentionPlugin.tsx]` → Extender mentions para `[[Nota X]]` backlinks bidireccionales (el editor procesa al guardar y crea `entity_links` references nota↔nota) → Backlinks operativos.
97. `[Vertrex-Website/src/lib/db/actions/agenda.ts]` → Soporte `recurrence_rule`, `timezone`, `reminder_minutes`. Lectura de ICS externa si `GOOGLE_CALENDAR_PUBLIC_ICS` está set → Agenda V3.
98. `[Vertrex-Website/src/lib/db/actions/links.ts]` → Añadir `reading_status` updates, `createCollectionAction`, `quickSaveAction` (autenticado por token de usuario) → Links V3.
99. `[Vertrex-Website/src/app/api/links/quick-save/route.ts]` → POST con token Bearer (token por usuario en `users.preferences.quick_save_token`) → Bookmarklet funcional.
100. `[Vertrex-Website/src/app/os/links/digest/page.tsx]` → Digest semanal → Operativo.
101. `[Vertrex-Website/src/lib/db/actions/marketing.ts]` → Calendario mensual, hashtag library, engagement manual → Marketing V3.
102. `[Vertrex-Website/src/app/os/marketing/calendar/page.tsx]` y `hashtags/page.tsx` → UI expuesta.

### Checkpoint V3-8

103. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Probar daily note, mention `[[Nota]]`, agenda con recurrencia, link via bookmarklet, calendario marketing. Si falla, no avanzar.

---

## Fase V3-9 — Equipo, Permisos, Portal multi-usuario

104. `[Vertrex-Website/src/lib/db/actions/team.ts]` → Añadir gestión de `status` por usuario, lectura de workload (sum de tasks activos), helper `getModulePermission(userId, module)` → Team V3 backend.
105. `[Vertrex-Website/src/app/os/team/workload/page.tsx]` → Workload view admin → Operativa.
106. `[Vertrex-Website/src/middleware.ts]` o `src/lib/auth/permissions.ts]` → Helper `requireModuleAccess(module, level)` que consulta `module_permissions` + role base → Permisos respetados a nivel server action y route.
107. `[Vertrex-Website/src/lib/db/actions/portal-users.ts]` → Implementar `createPortalUserAction(clientId, name, email, role)` que genera PIN único y devuelve plano una sola vez → Multi-PIN operativo.
108. `[Vertrex-Website/src/app/os/crm/[slug]/portal-users/page.tsx]` → Gestión de usuarios portal del cliente → UI expuesta.
109. `[Vertrex-Website/src/app/portal/login/page.tsx]` → Añadir campo `email` además de `slug + PIN`, manteniendo fallback al PIN maestro si email vacío → Login compatible.
110. `[Vertrex-Website/src/app/portal/[slug]/account/page.tsx]` → Preferencias del portal user: notificaciones email on/off → Operativa.

### Checkpoint V3-9

111. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Probar: crear portal_user con PIN; login con email+PIN; firmar como ese user; verificar audit de quién firmó. Si falla, no avanzar.

---

## Fase V3-10 — Atajos, comandos, saved views, bulk ops, settings

112. `[Vertrex-Website/src/components/os/CommandMenu.tsx]` → Extender command palette con acciones V3: "Capturar tarea", "Ir a inbox", "Ir a mis tareas", "Ir a roadmap"; búsqueda global con operadores → Command palette V3.
113. `[Vertrex-Website/src/components/os/Shortcuts/GlobalHotkeys.tsx]` → Listener global para `Ctrl/Cmd + .`, `g+t`, `g+p`, `g+h`, `g+c`. Coordinarse con `Ctrl+I` (idea) y `Ctrl+K` (palette) preexistentes → Atajos V3.
114. `[Vertrex-Website/src/components/os/SavedViews/SavedViewBar.tsx]` → Barra de vistas guardadas por ruta. Botones "Guardar vista" y "Cargar" → Vistas guardadas operativas en listados.
115. `[Vertrex-Website/src/components/os/data/DataTable.tsx]` → Añadir selección múltiple y slot `bulkActions` → Bulk operations habilitadas globalmente.
116. `[Vertrex-Website/src/app/os/settings/page.tsx]` → Añadir tabs `Notificaciones`, `Integraciones`, `Apariencia`, conservando los V2 → Settings V3.
117. `[Vertrex-Website/src/app/api/mcp/tasks/route.ts]` → GET con Bearer MCP_SECRET. Retorna JSON Tasks spec §8 → MCP extendido.
118. `[Vertrex-Website/src/app/api/mcp/activity/route.ts]` → GET con Bearer + `since=ISO` que retorna `activity` delta → MCP activity.
119. `[Vertrex-Website/src/app/api/mcp/intent/route.ts]` → POST que retorna 501 en V3.0 con docstring del payload esperado → Endpoint reservado.

### Checkpoint V3-10

120. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Probar: command menu nuevo, atajos, saved view crear/cargar/eliminar, bulk update tareas. Si falla, no avanzar.

---

## Fase V3-11 — Realtime SSE (stub) y email digests

121. `[Vertrex-Website/src/app/api/realtime/[channel]/route.ts]` → Crear handler SSE básico que mantiene conexión y envía heartbeats cada 30s. En V3.0 no publica eventos reales; reserva la API → Endpoint preparado.
122. `[Vertrex-Website/src/lib/email/digest.ts]` → Job idempotente "daily digest" que, para usuarios con preferencia activada, suma notifications no leídas y envía email → Digest disponible.
123. `[Vertrex-Website/scripts/run-digest.ts]` → Script invocable por cron externo (Vercel cron o GitHub Actions) → Punto de entrada documentado.

### Checkpoint V3-11

124. `[Vertrex-Website]` → `npm run typecheck && npm run build` → 0 errores. Si falla, no avanzar.

---

## Fase V3-12 — Cleanup, e2e y cierre

125. `[Vertrex-Website/e2e/tasks.spec.ts]` → Pruebas Playwright para flujos clave de tareas: captura rápida, asignación, cambio de estado, bloqueo, identifier visible → Cobertura del módulo nuevo.
126. `[Vertrex-Website/e2e/portal-v3.spec.ts]` → Pruebas para multi-PIN login, comentario, aprobación, firma → Portal V3 cubierto.
127. `[Vertrex-Website/e2e/ux-v3.spec.ts]` → Pruebas visuales mínimas que aseguran PageHeader, EmptyState, ErrorState y bulk bar en rutas nuevas → Quality gate visual continuo.
128. `[Vertrex-Website/docs/md/vertrex-os-v3-quality-gate.md]` → Marcar gates obligatorios aprobados durante la ejecución → Definición de terminado contundente.
129. `[Vertrex-Website/docs/md/vertrex-os-v3-ux-checklist.md]` → Marcar rutas nuevas y rutas extendidas aprobadas → Auditoría visual completa.
130. `[Vertrex-Website/src/app/os/**]` y `src/app/portal/**` → Buscar y eliminar dependencias muertas o referencias V2 a rutas obsoletas → No queda código zombi.

### Checkpoint V3-12 (FINAL)

131. `[Vertrex-Website]` → Ejecutar `npm run typecheck && npm run build` → 0 errores. Ejecutar pruebas e2e. Completar checklists. Si todo pasa, V3.0 está terminada → Listo para deploy.

---

## Resultado esperado V3.0

- Sistema de tareas tipo Linear operativo, conectado al grafo, con cycles y milestones.
- Captura rápida de tareas con `Ctrl+.` desde cualquier parte.
- Inbox, Mis tareas, Roadmap funcionando.
- Notificaciones internas con badge y centro dedicado.
- Feed de actividad alimentado por todas las mutaciones importantes.
- Comentarios + aprobaciones + firmas operativos entre OS y portal.
- Multi-PIN portal por persona del lado cliente.
- Documentos con folders, versiones, share tokens.
- Legal con plantillas, alertas de vencimiento y firma simple.
- Finanzas con multi-moneda, recurrencia, cuentas de cobro y P&L.
- Recursos con folders, rotación y auditoría.
- Saved views y bulk ops globales.
- MCP V3 con tasks y activity disponibles para agentes IA.
- Cero rompimientos con datos V2 existentes.
