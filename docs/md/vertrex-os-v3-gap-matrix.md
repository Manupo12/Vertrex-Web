# Vertrex OS — Matriz de Gaps V2 → V3

Esta matriz lista todo lo que falta para pasar de V2 (estado actual) a V3.0 (objetivo). Sigue las mismas convenciones que `vertrex-os-v2-gap-matrix.md`.

## Escala de severidad

- `P0` = bloqueante para entregar V3.0. Sin esto, no hay V3.
- `P1` = feature central V3 prometida en el PRD. Su ausencia degrada el valor.
- `P2` = mejora UX/operativa importante.
- `P3` = pulido o capacidad opcional para V3.1.

## Reglas de uso

- No empezar `P2` o `P3` si quedan `P0` o `P1` pendientes en el módulo correspondiente.
- Un gap solo se cierra cuando pasa su validación funcional + UI + checklist V3.
- Esta matriz debe leerse junto con:
  - `vertrex-os-v3-prd.md`
  - `vertrex-os-v3-tasks-linear-spec.md`
  - `vertrex-os-v3-implementation-plan.md`
  - `vertrex-os-v3-ux-spec.md`
  - `vertrex-os-v3-ux-implementation-plan.md`
  - `vertrex-os-v3-quality-gate.md`
  - `vertrex-os-v3-ux-checklist.md`

## Matriz

| ID | Severidad | Área | Requisito fuente | Estado V2 | Qué corregir | Resultado esperado |
|---|---|---|---|---|---|---|
| V3-001 | P0 | Schema tareas | PRD V3 §3, Tasks spec §2 | Ausente | Añadir tablas `tasks`, `cycles`, `milestones`, `tags`, `task_labels` y enum `entity_type` extendido | El sistema de tareas tiene base de datos |
| V3-002 | P0 | Identifiers | Tasks spec §2.5 | Ausente | Implementar `generateProjectKey` y `nextTaskIdentifier` con race safety | Tareas tienen ID humano `VTX-N` único |
| V3-003 | P0 | Server actions tareas | Tasks spec §7 | Ausente | Implementar `tasks.ts` completo con activity + notifications | Backend de tareas operativo |
| V3-004 | P0 | Lista tareas | UX V3 §3.1 | Ausente | Crear `/os/projects/[id]/tasks` con DataTable, filtros, inline edit, bulk | Linear-like list operativa |
| V3-005 | P0 | Tablero kanban | UX V3 §3.2 | Ausente | Crear `/os/projects/[id]/board` con 5 columnas y DnD si aplica | Tablero operativo |
| V3-006 | P0 | Detalle tarea | UX V3 §3.3 | Ausente | Crear `/os/projects/[id]/tasks/[taskId]` con subtareas, bloqueos, comentarios | Detalle premium |
| V3-007 | P0 | Inbox triage | Tasks spec §3.1 | Ausente | Crear `/os/projects/inbox` con captura sin proyecto | Triage operativo |
| V3-008 | P0 | Mis tareas | Tasks spec §3.2 | Ausente | Crear `/os/projects/mine` agrupada por proyecto | Vista personal |
| V3-009 | P0 | Cycles + milestones | Tasks spec §3.7-3.8 | Ausente | Crear UI y backend de ciclos e hitos con auto-completion | Ciclos/hitos operativos |
| V3-010 | P0 | Captura rápida tarea | UX V3 §4 | Ausente | Modal `QuickTaskModal` con `Ctrl+.` | Captura sin fricción |
| V3-011 | P0 | Notifications | PRD V3 §5.1 | Ausente | Tabla `notifications`, bell, sheet, centro | Notificaciones internas |
| V3-012 | P0 | Activity feed | PRD V3 §5.2 | Ausente | Tabla `activity`, helper `logActivity`, `ActivityFeed` | Audit + timeline |
| V3-013 | P0 | Multi-PIN portal | PRD V3 §4.2 | Ausente | Tabla `client_portal_users` + auth extendido + UI CRM | Multi-usuario portal |
| V3-014 | P0 | Comentarios | PRD V3 §4.13, §5 | Ausente | Tabla `comments`, server actions OS y portal, `CommentThread` | Conversación cross-portal/OS |
| V3-015 | P0 | Aprobaciones | PRD V3 §4.13 | Ausente | Tabla `approvals`, sheet pedir, card responder, ruta portal | Aprobaciones operativas |
| V3-016 | P0 | Firma electrónica simple | PRD V3 §4.5 | Ausente | Tabla `signatures`, SignaturePad, endpoint POST portal, PDF firmado | Firma legal mínima viable |
| V3-017 | P1 | Mentions `@entity` | Tasks spec §5 / Hub V3 | Ausente | MentionInput BlockNote + materialización `entity_links` al guardar | Menciones interactivas |
| V3-018 | P1 | Tags cross-módulo | PRD V3 §4.6, Tasks §2.4 | Ausente | Tabla `tags` + tagging cross via `entity_links` | Etiquetado coherente |
| V3-019 | P1 | Subtareas anidadas | Tasks spec §2.1, §4.3 | Ausente | `parent_task_id` + UI subtareas en detalle | Jerarquía operativa |
| V3-020 | P1 | Bloqueos | Tasks spec §4.4 | Ausente | Relación `blocks`/`blocked_by` con UI y notificación al cerrar | Dependencias visibles |
| V3-021 | P1 | Progreso auto | PRD V3 §3.2 | Manual V2 | Recalcular `projects.progress` desde tareas done | Progreso real |
| V3-022 | P1 | Roadmap | UX V3 §3.6 | Ausente | `/os/projects/roadmap` con timeline 12 meses | Visión macro |
| V3-023 | P1 | Documentos folders/versiones | PRD V3 §4.4 | Ausente | Tablas + UI + auto-versionado por mismo nombre+folder | Documentos operativos V3 |
| V3-024 | P1 | Share tokens | PRD V3 §4.4 | Ausente | Tabla, endpoint público `/share/[token]`, Sheet en UI | Compartir documento |
| V3-025 | P1 | Legal plantillas | PRD V3 §4.5 | Ausente | Tabla, generador PDF, integración con generator | Plantillas legales |
| V3-026 | P1 | Legal vencimientos | PRD V3 §4.5 | Ausente | Badges por proximidad, `expires_at` | Renovaciones gestionables |
| V3-027 | P1 | Recursos folders/rotación/audit | PRD V3 §4.7 | Ausente | Columnas, tablas, UI audit admin | Vault V3 |
| V3-028 | P1 | Finanzas multi-moneda+recurrencia | PRD V3 §4.8 | Ausente | Columnas + lógica autoinsertar siguiente periodo | Finanzas V3 |
| V3-029 | P1 | Cuentas de cobro generadas | PRD V3 §4.8 | Ausente | Sheet generator + PDF + guardar en legal | Invoices operativas |
| V3-030 | P1 | P&L y cashflow | PRD V3 §4.8 | Ausente | Rutas + agregaciones server actions | Visibilidad financiera |
| V3-031 | P1 | Agenda recurrencia + ICS | PRD V3 §4.9 | Ausente | Columnas + lectura ICS opcional | Agenda V3 |
| V3-032 | P1 | Hub daily + backlinks | PRD V3 §4.6 | Ausente | Ruta daily + BacklinksPlugin | Hub V3 |
| V3-033 | P1 | Links reading_status + collections + digest | PRD V3 §4.10 | Ausente | Columnas + UI | Links V3 |
| V3-034 | P1 | Marketing calendar + hashtags + assets | PRD V3 §4.11 | Ausente | Rutas + tablas | Marketing V3 |
| V3-035 | P1 | Team workload + permisos | PRD V3 §4.12 | Ausente | Ruta workload + tabla `module_permissions` + helper | Equipo V3 |
| V3-036 | P1 | Saved views | PRD V3 §5.4 | Ausente | Tabla + barra UI + sync URL | Vistas reutilizables |
| V3-037 | P1 | Bulk operations | PRD V3 §5.5 | Ausente | DataTable con selección + BulkActionBar | Productividad |
| V3-038 | P1 | Command menu V3 | PRD V3 §5.6 | Parcial V2 | Añadir operadores, acciones V3, agrupación | Búsqueda potente |
| V3-039 | P1 | Atajos globales | PRD V3 §5.6 | Parcial V2 | `Ctrl+.`, `g+t`, etc. | Navegación rápida |
| V3-040 | P1 | MCP V3 | PRD V3 §7, Tasks §8 | Parcial V2 | `/api/mcp/tasks`, `/api/mcp/activity`, `/api/mcp/intent` stub | Agentes externos cubiertos |
| V3-041 | P2 | Burndown ciclo | Tasks spec §3.7 | Ausente | SVG inline simple | Visualización ciclo |
| V3-042 | P2 | Roadmap zoom | UX V3 §3.6 | Ausente | Controles mes/trim/año | UX roadmap |
| V3-043 | P2 | Densidad toggle | UX V3 §1 | Ausente | Toggle topbar, `users.preferences.density` | Personalización |
| V3-044 | P2 | Onboarding portal | PRD V3 §4.13 | Ausente | Tour 4 pasos primer login portal_user | UX cliente |
| V3-045 | P2 | Hashtag library | PRD V3 §4.11 | Ausente | Tabla + UI marketing/hashtags | Reutilización |
| V3-046 | P2 | Bookmarklet links quick-save | PRD V3 §4.10 | Ausente | Endpoint `/api/links/quick-save` + doc + token user | Captura externa |
| V3-047 | P2 | Email digest | PRD V3 §5.1 / V3.1 | Ausente | Adapter email + script run-digest | Notificaciones fuera del OS |
| V3-048 | P2 | Logs auditoría centralizada | PRD V3 §5.2 | Parcial | Ruta admin `/os/activity` con filtros | Cumplimiento básico |
| V3-049 | P2 | Sidebar tree (docs/resources) | UX V3 §8, §10 | Ausente | Componentes FolderTree | Navegación operativa |
| V3-050 | P3 | SSE realtime | PRD V3 §5.7 | Stub | Endpoint reservado, no eventos en V3.0 | Listo para V3.1 |
| V3-051 | P3 | Integración OpenClaw | PRD V3 §4.15 | Stub | `/api/mcp/intent` 501 documentado | Listo para V3.1 |
| V3-052 | P3 | Google Calendar sync bi | PRD V3 §4.9 | Stub | Solo lectura ICS V3.0 | Avanzado en V3.1 |
| V3-053 | P3 | Permisos UI granular | PRD V3 §4.12 | Backend | UI admin para editarlos en V3.1 | Configurabilidad |
| V3-054 | P3 | Time tracking manual | PRD V3 §10 | Fuera V3.0 | Postergado | — |
| V3-055 | P3 | PWA optimizada | PRD V3 §10 | Fuera V3.0 | Postergado | — |

---

## Resumen por módulo

| Módulo | Estado V2 | Cambios V3 críticos |
|---|---|---|
| Admin | OK | Añadir Mi día + Actividad reciente + nuevos stats |
| CRM | OK | Health score, tags, multi-PIN, timeline, recordatorios |
| Proyectos | Plano | Tareas, cycles, milestones, roadmap, identifiers, bloqueos, subtareas, presupuesto |
| Documentos | OK | Folders, versiones, share tokens, búsqueda contenido |
| Legal | Básico | Plantillas, expira, firma electrónica, renovación |
| Hub | OK | Daily notes, backlinks, tags, score, evolución, templates |
| Recursos | OK | Folders, rotación, audit, visibility, export |
| Finanzas | OK | Multi-moneda, recurrencia, cuentas de cobro, P&L, cashflow, IVA, budget |
| Agenda | OK | Recurrencia, timezone, ICS, notas auto, recordatorios |
| Links | OK | Reading status, collections, digest, bookmarklet |
| Marketing | OK | Calendar, hashtag library, asset library cruzada, engagement manual |
| Equipo | OK | Permisos granulares, workload, status, 1:1 templates |
| Portal | OK | Multi-PIN, comentarios, aprobaciones, firma, notificaciones |
| Generator | OK | Persistencia opcional + variables tipadas |
| Settings | OK | Tabs Notificaciones, Integraciones, Apariencia |
| Sistema | OK | Notifications, activity, saved views, bulk, MCP V3 |

---

## Bloqueadores explícitos

- `V3-001` y `V3-002` bloquean toda la familia `V3-003..V3-022`.
- `V3-013` bloquea `V3-014..V3-016` para el lado portal.
- `V3-011` y `V3-012` son prerequisitos de varios flujos (tareas, comentarios, aprobaciones).
- `V3-040` puede empezar tarde pero su contrato debe cumplir Tasks spec §8.

## Definición de hecho para esta matriz

La matriz se cierra cuando todos los gaps `P0` y `P1` están en estado `done`, validados manualmente y con su ruta marcada `Sí` en `vertrex-os-v3-ux-checklist.md` y `vertrex-os-v3-quality-gate.md`.
