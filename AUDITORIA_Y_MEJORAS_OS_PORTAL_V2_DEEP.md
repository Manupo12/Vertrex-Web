Auditoría Profunda — Vertrex OS

  Estado general: prototipo robusto (~60–70% UI, ~50% backend funcional). Listo
  para uso interno limitado; no listo para socios/clientes externos. Lo organizo
   por módulo con severidad y referencia a archivos para que tu agente lo pueda
  ejecutar punto por punto.

  Leyenda: C = Crítico (bloquea uso real) · A = Alto · M = Medio · B = Bajo.

  ---
  1. Tareas (Tu hallazgo principal)

  Problema confirmado: No existe ningún botón visible para crear una tarea en la
   UI. La única vía es el atajo Ctrl+. que abre QuickTaskModal. Tampoco hay
  botón "Nueva tarea" en la lista de tareas, el tablero, los ciclos, ni la
  página del proyecto.

  Archivos relevantes:
  - src/app/os/projects/[id]/tasks/TasksView.tsx — no tiene botón "Nueva tarea"
  - src/app/os/projects/[id]/board/BoardView.tsx — empty state te redirige a la
  lista de tareas, que tampoco tiene botón
  - src/app/os/projects/[id]/page.tsx — la página principal del proyecto no
  tiene CTA para crear tarea
  - src/components/os/Tasks/QuickTaskModal.tsx — modal existe pero solo se abre
  por hotkey
  
  Falta agregar (C):

  1. Botón "Nueva tarea" visible en:
    - Lista de tareas del proyecto (TasksView.tsx)
    - Tablero Kanban (BoardView.tsx), uno por columna idealmente
    - Detalle del proyecto (projects/[id]/page.tsx)
    - Sección de ciclos y milestones (para crear tarea ya asignada al
  ciclo/milestone)
    - "Mis tareas" (/os/projects/mine)
    - Inbox (/os/projects/inbox)
  2. Tipo de tarea — el schema (schema.ts:121) no tiene campo taskType/category.
   Hay que:
    - Agregar enum en schema: taskTypeEnum con valores como code, design,
  marketing, content, document, meeting, research, ops, support, bug, feature,
  other.
    - Migración Drizzle correspondiente.
    - Selector en QuickTaskModal y formulario completo.
    - Filtro por tipo en lista y tablero.
    - Color/icon por tipo en TaskRow e IdentifierChip.
  3. Formulario completo de creación (modal rápido + página/sheet completo). El
  modal actual solo permite: título, proyecto, asignado, prioridad. Falta:
    - Descripción rica (BlockNote o textarea con markdown)
    - Tipo de tarea (ver punto 2)
    - Fecha de vencimiento (dueDate existe en schema pero no en UI)
    - Estimate points (estimatePoints existe, no en UI)
    - Ciclo y milestone (existen en schema, no en UI del create)
    - Etiquetas/labels (la tabla task_labels existe, no hay UI)
    - Adjuntos (no existe tabla task_attachments)
    - Tarea padre (subtarea) — parentTaskId existe en schema, sin UI
  4. Edición y borrado (C):
    - No hay deleteTaskAction en src/lib/db/actions/tasks.ts
    - No hay botón de eliminar/archivar en TaskRow ni en TaskDetailSheet
    - updateTaskAction existe pero la UI completa de edición está incompleta
  5. Drag & drop en tablero (A): BoardView.tsx solo usa <select> para cambiar de
   columna. @dnd-kit está en deps pero no se usa. Falta DnD entre columnas y
  reordenamiento por orderIndex.
  6. Comentarios en tareas (C): la tabla comments existe (schema.ts:420) y el
  TaskDetailSheet no muestra ni permite comentar. Imposible colaborar.
  7. Subtareas desde UI (A): createSubtaskAction existe (tasks.ts:195) pero no
  se llama desde ningún componente.
  8. Vista "Mis tareas" completa (A): /os/projects/mine existe pero
  probablemente sin filtros (vencidas, esta semana, por prioridad, por
  proyecto).
  9. Asignación múltiple (M): hoy es 1-a-1 (assigneeId). Para tareas tipo
  "documento" o "marketing" suele requerirse co-asignados.
  10. Watchers/observadores (M): no existe.
  11. Validación de transición de estado ya existe (tasks.ts:114) pero el flujo
  done → todo está permitido sin reabrir contadores; revisar.

  ---
  2. Ciclos y Milestones

  Archivos: src/app/os/projects/[id]/cycles/*,
  src/app/os/projects/[id]/milestones/*

  - CreateCycleDialog.tsx existe → crear sí funciona (M: falta validar endsAt > 
  startsAt).
  - Falta (A): mover tareas existentes a un ciclo desde la UI (drag & drop o
  multiselección).
  - Falta (A): vista de burndown / progreso del ciclo (gráfica simple).
  - Falta (A): cerrar ciclo y trasladar tareas no terminadas al backlog o ciclo
  siguiente.
  - Falta (M): notificación cuando un ciclo está por terminar.
  - Milestones: el chequeo de "todas las tareas done → completado" ya funciona
  (tasks.ts:101). Falta vista visual tipo timeline.

  ---
  3. CRM / Clientes

  Archivos: src/app/os/crm/*, src/lib/db/actions/crm.ts

  - CRUD básico de clientes: OK.
  - Sin pipeline de oportunidades (C): no hay tabla opportunities/deals en
  schema. Es uno de los core CRM.
  - Sin notas por cliente (C): tabla knowledge_notes no se conecta a clientes en
   la UI.
  - Sin timeline de interacciones (A): la tabla activity se popula pero la
  página del cliente no lo muestra.
  - Sin campos custom (B).
  - Mocks pendientes en CrmList.tsx (vistas guardadas).

  ---
  4. Finanzas

  Archivos: src/app/os/finances/*, src/lib/db/actions/finances.ts

  - CRUD de movimientos: OK.
  - Sin exportación CSV/Excel (A).
  - Sin reporte por proyecto / cliente / categoría (A).
  - Sin generación de facturas reales en PDF (A): pdf-lib está en deps;
  invoiceNumber existe pero no hay generador.
  - Sin proyección de cashflow (M): la ruta existe vacía.
  - Sin reconciliación bancaria (M).
  - Sin alerta de vencimientos (A): existe dueDate pero no notificación
  automática.
  - Sin múltiples monedas reales (B): hardcoded COP.

  ---
  5. Documentos

  Archivos: src/app/os/documents/*, src/lib/db/actions/documents.ts

  - Upload base64 a Neon: funciona pero inviable para archivos grandes (C).
  - Google Drive integración (C): el código (src/lib/drive/service.ts) requiere
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN. Falla silencioso
   si no están. No documentadas en .env.local.example.
  - Editor BlockNote (A): solo está en el hub, no en /documents. La idea de
  "crear un documento" en la UI no existe — solo subir.
  - Versionado (M): el campo version se guarda pero no hay UI para ver/restaurar
   versiones.
  - Búsqueda full-text (M): solo por nombre.
  - Permisos por documento (M): solo isPublic boolean. No hay ACL por
  usuario/cliente.

  ---
  6. Marketing

  Archivos: src/app/os/marketing/*

  - Content plan y cuentas: CRUD básico OK.
  - Sin calendario visual (A): react-big-calendar está en deps, sin usar en
  /marketing/calendar.
  - Sin publicación automática (C si lo quieres): no hay integración con APIs de
   redes sociales.
  - Sin asset manager (A): assetDocumentIds (jsonb) existe pero sin UI para
  adjuntar.
  - Métricas manuales (A): no hay polling de APIs.

  ---
  7. Agenda

  Archivos: src/app/os/agenda/*, src/lib/db/actions/agenda.ts

  - CRUD eventos: OK.
  - Recurrencia (A): el campo recurrenceRule se guarda pero no se expande en la
  vista (un evento weekly aparece una sola vez).
  - Google Calendar sync (C): hay campos externalProvider/externalId pero sin 
  integración. googleapis está en deps.
  - Sin detección de conflictos (M).
  - Sin recordatorios push/email (A): reminderMinutes se guarda, nada lo lee.

  ---
  8. Recursos / Credenciales

  Archivos: src/app/os/resources/*, src/lib/db/actions/resources.ts

  - Módulo mejor implementado. CRUD + cifrado + logs OK.
  - Falta (A): notificación cuando rotationDueAt vence.
  - Falta (M): permitir compartir credencial con link temporal seguro.

  ---
  9. Legal

  Archivos: src/app/os/legal/*, src/lib/db/actions/legal.ts

  - Plantillas y generación con {{VAR}}: OK.
  - Firma digital real (C): hoy es solo timestamp en BD. Falta integración tipo
  DocuSign, o al menos firma con dibujo + validación criptográfica.
  - Envío por email para firmar (C): no implementado.
  - Sanitización HTML del template (C): bodyHtml se guarda y se renderiza sin
  sanitizar → riesgo XSS.
  - Renovación automática (M): expiresAt existe sin lógica.

  ---
  10. Portal de Clientes

  Archivos: src/app/portal/*

  - Login por PIN: OK.
  - Aprobaciones (ver/responder): OK.
  - Comentarios en aprobaciones (A): tabla comments existe, sin UI en portal.
  - Tickets: TicketForm.tsx hace fetch("/api/tickets") pero el endpoint POST no 
  existe (C). Ver src/app/api/tickets/.
  - Notificaciones al cliente (A): cuando se sube un doc o se solicita firma, no
   se le avisa.
  - Stripe (C si cobras por aquí): hay enlace hardcoded
  https://buy.stripe.com/test_sample en el portal. Sin checkout real, sin
  webhooks.
  - Múltiples contactos por cliente (M): tabla client_portal_users existe pero
  sin gestión desde el portal.

  ---
  11. Notificaciones

  Archivos: src/app/os/notifications/*, src/lib/notifications/service.ts

  - DB + lectura: OK.
  - Push real (Web Push API o WebSocket) (C): hoy es polling DB.
  - Email real (A): el parámetro sendEmail: true se pasa en tasks.ts:54 pero el
  servicio probablemente no envía Resend (verificar pushNotification).
  - Preferencias por usuario (A): el campo preferences (jsonb) en users está
  vacío y sin UI.
  - Digest diario (M): src/lib/email/digest.ts existe pero no se sabe si está
  programado.

  ---
  12. Equipo / Admin / Settings

  Archivos: src/app/os/team/*, src/app/os/admin/*, src/app/os/settings/*

  - Invitación de usuarios (C): el formulario crea sin enviar email de
  invitación / set-password. No funciona como flujo real.
  - 2FA (C): la UI en SecuritySettings.tsx muestra toggles pero el backend no 
  está implementado, aunque otpauth y qrcode están en deps.
  - Cambio de contraseña (C): solo UI, sin endpoint.
  - Permisos por módulo en UI (A): la tabla modulePermissions existe pero no hay
   pantalla admin para asignarlos por usuario y módulo.
  - Roles y workspaces (M): solo team y admin. Sin niveles por proyecto.
  - Auditoría de accesos (A): no expuesta.
  - Reset password / "olvidé mi contraseña" (C): no existe.
  - Registro público (B): solo admin crea; correcto si quieres invite-only.

  ---
  13. IA / MCP

  Archivos: src/app/api/ai, src/app/api/mcp

  - MCP: rutas activity, tasks, graph, intent implementadas con rate limit.
  Funcional para integraciones externas.
  - AI (M): /api/ai aparentemente vacío. Si quieres asistente para
  tareas/búsqueda/redacción, hay que conectar openai (ya en deps).

  ---
  14. Activity feed

  - Tabla activity se popula bien en casi todas las acciones.
  - Falta (A): vista visual con filtros (por usuario, por entidad, por verbo,
  rango de fechas).

  ---
  15. Generator

  - Funcional al 100% (rellenar plantillas HTML y descargar). No requiere
  cambios.

  ---
  16. Seguridad y plataforma (transversal)

  Crítico

  - Sin validación con Zod en server actions y API routes. zod está en deps pero
   grep no encuentra uso. Confiar en TypeScript en runtime es inseguro.
  - Sin tabla de control de migraciones: __drizzle_migrations vacía → reejecutar
   migraciones fallará. Riesgo de drift.
  - Sin CSRF tokens en formularios server-actions sensibles.
  - Sin sanitización HTML donde se renderiza contenido del usuario (legal
  templates, descripciones, etc.). Riesgo XSS.
  - Health endpoint /api/health devuelve más info de la debida (cuenta de
  usuarios, posibles emails). Reducir payload.

  Alto

  - Rate limiting incompleto: existe en /api/mcp/* pero falta en /api/upload,
  /api/tickets, /api/portal/*, login.
  - RBAC subutilizado: requireModuleAccess() solo se usa en team.ts. La mayoría
  de server actions solo validan sesión. Cualquier usuario autenticado puede
  modificar cualquier proyecto.
  - Storage frágil: si faltan GOOGLE_* o BLOB_READ_WRITE_TOKEN, los uploads
  fallan silenciosamente.
  - Sin logger (Sentry, Pino, etc.). Errores en producción no quedarán
  traceables.
  - Sin CI (no hay .github/workflows). Cualquier push a main puede romper build.

  Medio

  - Documentación de env vars incompleta: .env.local.example no incluye
  variables de Google Drive, Stripe ni Upstash que el código sí lee.
  - Sin observabilidad más allá de @vercel/analytics importado.
  - Sin focus management/a11y verificada.

  ---
  17. Tests

  - 0 tests unitarios.
  - 3 specs Playwright muy básicos en /e2e (login, ux, workspace).
  - Falta (A): tests E2E de los flujos críticos: crear proyecto → crear ciclo →
  crear tarea → asignar → mover en tablero → completar; portal cliente login →
  aprobar; subir documento; crear evento agenda.
