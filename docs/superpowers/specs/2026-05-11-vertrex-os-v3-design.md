# Vertrex OS V3 Design (V3.0 + V3.1)

## Contexto y alcance

Este diseno ejecuta la migracion V2 -> V3 siguiendo estrictamente:
- `docs/md/vertrex-os-v3-prd.md`
- `docs/md/vertrex-os-v3-implementation-plan.md`
- `docs/md/vertrex-os-v3-tasks-linear-spec.md`
- `docs/md/vertrex-os-v3-ux-spec.md`
- `docs/md/vertrex-os-v3-ux-implementation-plan.md`
- `docs/md/vertrex-os-v3-gap-matrix.md`
- `docs/md/vertrex-os-v3-quality-gate.md`
- `docs/md/vertrex-os-v3-ux-checklist.md`
- Documentos V1/V2 para compatibilidad

Idioma del sistema: Espanol. Moneda principal: COP (USD soporte secundario).

### Alcance confirmado
- Implementar V3 completo (V3.0 + V3.1), manteniendo V3 aditivo y sin romper V2.
- Email provider: Resend.
- Kanban: sin drag & drop (cambio de estado por menu).
- PDF: Playwright HTML -> PDF.
- OpenClaw: fuera por ahora (endpoint stub documentado).
- Calendar sync V3.1: Service Account + calendario compartido.
- Realtime V3.1: SSE in-memory por instancia.
- PWA V3.1: basica (manifest + icons + SW shell cache).
- Time tracking V3.1: manual por tarea.

## Principios y restricciones

- V3 es aditivo. No eliminar rutas, tablas ni columnas V2 salvo indicacion explicita.
- Nuevas columnas deben ser nullable o con default.
- Migraciones con Drizzle (sin editar SQL manualmente).
- Respetar listas de archivos prohibidos en los MDs.
- UX del OS: dark premium. Portal: claro, alto contraste, letra grande.

## Arquitectura de datos

### Enums y relaciones
- Extender `entity_type` con: task, cycle, milestone, comment, approval, signature, notification, activity, saved_view, tag.
- Vocabulario `relation_type` canonico (PRD V3 2.2).
- Indices `entity_links`: `(relation_type)` y `(source_type, relation_type, target_type)`.

### Tablas nuevas (alto nivel)
- Tareas: `tasks`, `cycles`, `milestones`, `tags`, `task_labels`.
- Sistema: `notifications`, `activity`, `comments`, `approvals`, `saved_views`, `module_permissions`.
- Portal: `client_portal_users`.
- Documentos: `document_folders`, `share_tokens`.
- Legal: `legal_templates`, `signatures`.
- Recursos: `resource_folders`, `resource_access_log`.
- Links/Marketing: `link_collections`, `marketing_hashtags`.

### Columnas extendidas
- `projects`: `project_key` (unique), `budget_cop`.
- `finances`: `currency`, `recurrence`, `next_due_date`, `vat_amount_cop`, `vat_rate`, `invoice_number`.
- `documents`: `folder_id`, `version`, `parent_id`.
- `legal_documents`: `expires_at`, `template_id`, `requires_signature`.
- `resources`: `rotation_due_at`, `visibility`, `folder_id`, `owner_id`.
- `agenda_events`: `recurrence_rule`, `timezone`, `external_provider`, `external_id`, `reminder_minutes`.
- `links`: `collection_id`, `reading_status`.
- `repositories`: `collection_id`.
- `content_plan`: `asset_document_ids`, `reach`, `likes`, `comments`, `saves`.
- `users`: `status`, `preferences`.

### Migraciones y backfill
- Generar y aplicar migraciones via `npm run db:generate` + `npm run db:migrate`.
- Backfill: `projects.project_key`, `documents.version=1`.

## Servicios compartidos

- Notificaciones: `pushNotification` inserta en `notifications` y envia email via Resend si corresponde.
- Email: `sendEmail` adapter Resend con fallback no-op si falta API key.
- Activity: `logActivity` para toda mutacion relevante.
- PDF: `renderPdf` Playwright (HTML -> PDF) para legal e invoices.
- Identificadores: `generateProjectKey`, `nextTaskIdentifier` con transaccion y reintento.
- Grafo: `getResolvedEntityConnections` y `searchEntitiesAction` con entidades V3.
- Menciones: BlockNote plugin `@` y `[[Nota]]`, materializa `entity_links`.
- Portal: `PortalSession` incluye `portal_user_id`.

## Modulo Proyectos V3 (tareas)

- Acciones: `tasks.ts`, `cycles.ts`, `milestones.ts`, `tags.ts`.
- Reglas: progreso automatico, milestones completan al cerrar tareas, bloqueos notificados.
- Identifiers `{PROJECT_KEY}-{N}` y subtareas `{KEY}-{N}.{n}`.
- Vistas: inbox, mine, roadmap, lista, kanban, ciclos, hitos, detalle tarea, shortcut `/t/[identifier]`.
- UI: TaskRow, TaskDetailSheet, TaskDetail, QuickTaskModal (Ctrl+.), filtros URL sync.
- Kanban sin DnD: menu de cambio de estado.

## Sistema cross-modulo

- Notificaciones: bell + centro, reglas de disparo (tareas, comentarios, aprobaciones, vencimientos, etc.).
- ActivityFeed: timeline reutilizable (dashboard, CRM, task detail, audit).
- Comentarios: OS y portal (endpoint portal separado).
- Aprobaciones: request/respond desde OS y portal.
- Firma simple: portal crea `signatures` con IP/UA/timestamp.

## Documentos, Legal, Recursos

- Documentos: folders, versiones, share tokens con expiracion y route `/share/[token]`.
- Legal: templates, expiraciones con badges, firma simple, generar PDF via Playwright.
- Recursos: folders, rotacion, visibility, audit log, export cifrado (admin).

## Finanzas

- Multi-moneda (COP/USD), recurrencia, IVA, invoice number.
- Generar cuenta de cobro PDF y guardar en `legal_documents`.
- Vistas: P&L por proyecto, cashflow 90 dias, inventory de invoices.
- Budget alerts en proyectos.

## Hub, Agenda, Links, Marketing

- Hub: daily notes, backlinks, tags, score ideas, templates, sugerencias stub.
- Agenda: recurrence rule, timezone, reminders, lectura ICS publica.
- Links: reading_status, collections, bookmarklet quick-save, digest semanal.
- Marketing: calendario mensual, hashtag library, engagement manual.

## Equipo, Permisos, Portal multiusuario

- Team: status por usuario, workload view, module permissions backend.
- Portal: login email + PIN, multi-usuario, preferencias de notificaciones.

## Command, Saved Views, Bulk Ops, Settings

- CommandMenu con operadores V3 y atajos globales.
- Saved views por ruta con query/columnas/orden.
- DataTable con seleccion multiple + bulk actions slot.
- Settings con tabs Notificaciones/Integraciones/Apariencia.

## Realtime y digests (V3.1)

- SSE stub para `/api/realtime/[channel]` con heartbeats.
- Email digest diario via Resend + script cron.

## UX y calidad

- Respetar UX Spec V3 y checklist por ruta.
- OS dark premium; portal claro, alto contraste, tipografia grande.
- Estados obligatorios: loading, empty, error, success + feedback.

## Seguridad

- Upload y documentos validan auth OS/portal.
- Share tokens con expiracion.
- Export vault cifrado admin-only.

## Testing y verificacion

- Typecheck en cada fase.
- Build al final (V3-11 y V3-12).
- E2E Playwright para tareas, portal V3, UX minima.
- Completar `vertrex-os-v3-quality-gate.md` y `vertrex-os-v3-ux-checklist.md`.

## Orden de ejecucion

Seguir fases del plan V3 (V3-0 -> V3-12) y prioridades P0->P1->P2->P3 por modulo.

## Inputs pendientes

- CalendarId(s) para sync Google Calendar (Service Account).
- Credenciales Resend y email from (ya definidas en .env local, sin valores reales).
