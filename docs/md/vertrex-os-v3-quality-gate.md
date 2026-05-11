# Vertrex OS — Quality Gate V3

Este documento define cuándo una entrega V3 puede considerarse terminada. Si un módulo falla cualquier check obligatorio, no se da por aprobado aunque compile.

## Regla principal

**Compilar no equivale a estar terminado.**
Una entrega V3 solo se aprueba si pasa simultáneamente:

1. validación funcional (server actions + datos),
2. validación visual (UX spec V3),
3. validación de rutas (no 404, breadcrumbs correctos),
4. validación de seguridad (auth, ownership, audit),
5. validación de grafo (entity_links materializados con relaciones canónicas),
6. validación e2e/manual del flujo principal.

---

## 1. Gate global por categoría

| Categoría | Check obligatorio | Estado esperado |
|---|---|---|
| Build | `npm run typecheck` pasa con 0 errores | Sí |
| Build | `npm run build` pasa con 0 errores | Sí |
| Routing | Ninguna ruta nueva V3 navega a 404 | Sí |
| Seguridad | `/api/upload` exige auth válida (OS o portal) | Sí |
| Seguridad | `/api/documents/[id]` valida ownership | Sí |
| Seguridad | `/api/portal/signature` exige `portal_session` válida | Sí |
| Seguridad | `/api/portal/comments` exige `portal_session` válida | Sí |
| Seguridad | `/api/mcp/*` exige Bearer `MCP_SECRET` | Sí |
| Seguridad | `/share/[token]` revoca acceso al expirar | Sí |
| Tareas | Identifiers únicos `{KEY}-{N}` autogenerados | Sí |
| Tareas | `parent_task_id` cascade y mismo `project_id` que padre | Sí |
| Tareas | `blocks/blocked_by` reflejados en `entity_links` con relación canónica | Sí |
| Tareas | Cerrar tarea con bloqueados pide AlertDialog | Sí |
| Tareas | `Ctrl+.` abre modal captura desde cualquier ruta OS | Sí |
| Grafo | Nuevos `entity_type` (task, cycle, milestone, comment, approval, signature, notification, activity, saved_view, tag) en enum y resolvibles en `EntitySidebar` | Sí |
| Notificaciones | Bell topbar con badge, Sheet operativo, ruta `/os/notifications` | Sí |
| Activity | `logActivity` invocado en mutaciones críticas (tareas, comentarios, aprobaciones, firmas) | Sí |
| Portal | Multi-PIN funcional con `client_portal_users` | Sí |
| Portal | Aprobaciones responde end-to-end | Sí |
| Portal | Firma simple registra IP, UA, timestamp | Sí |
| Documentos | Re-upload mismo folder+name crea versión incremental | Sí |
| Documentos | Share token con expiración funciona y revoca | Sí |
| Legal | Plantillas con `{{VAR}}` generan documento + PDF | Sí |
| Legal | Badge vencimiento según `expires_at` se renderiza correctamente | Sí |
| Recursos | `revealResourceAction` registra fila en `resource_access_log` | Sí |
| Recursos | `visibility='admin'` bloquea a no admins | Sí |
| Finanzas | Marcar pagado un gasto recurrente autoinserta próximo periodo | Sí |
| Finanzas | Generar cuenta de cobro produce PDF guardado en `legal_documents` | Sí |
| Hub | Daily note upsert por fecha | Sí |
| Hub | `[[Nota X]]` crea backlink visible en ambas notas | Sí |
| MCP | `/api/mcp/tasks` retorna contrato Tasks spec §8 | Sí |
| UX | `PageHeader` presente en todas las rutas V3 | Sí |
| UX | `EmptyState` específico en cada listado V3 | Sí |
| UX | `BulkActionBar` aparece al seleccionar múltiple en listados clave | Sí |
| UX | Atajos `Ctrl+.`, `g+t`, `g+p` visibles al menos una vez | Sí |
| UX | Pills de estado y dots de prioridad usan tokens V3 | Sí |

---

## 2. Checklist por ruta nueva o extendida V3

| Ruta | 404-safe | Auth correcta | PageHeader | EmptyState | ErrorState | Acción primaria | Responsive 390 | Aprobado |
|---|---|---|---|---|---|---|---|---|
| `/os/projects/inbox` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/mine` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/roadmap` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/[id]/tasks` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/[id]/board` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/[id]/cycles` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/[id]/cycles/[cycleId]` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/[id]/milestones` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/[id]/tasks/[taskId]` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/[id]` (Overview V3) | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/admin` (Mi día + actividad) | Sí | Sí | Sí | N/A | Sí | Sí | Sí | Sí |
| `/os/crm/[slug]/timeline` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/crm/[slug]/portal-users` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/documents/folders` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/documents/[id]/versions` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/legal/templates` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/legal/[id]/signatures` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/hub/daily/[date]` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/resources/folders` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/resources/audit` | Sí | Sí (admin) | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/finances/projects` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/finances/cashflow` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/finances/invoices` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/links/digest` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/links/collections` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/marketing/calendar` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/marketing/hashtags` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/team/workload` | Sí | Sí (admin) | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/settings` (tabs V3) | Sí | Sí | Sí | N/A | Sí | Sí | Sí | Sí |
| `/os/notifications` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/activity` | Sí | Sí (admin) | Sí | Sí | Sí | N/A | Sí | Sí |
| `/portal/[slug]/approvals` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/portal/[slug]/legal` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/portal/[slug]/account` | Sí | Sí | Sí | N/A | Sí | Sí | Sí | Sí |
| `/share/[token]` | Sí | Token | N/A | N/A | Sí | N/A | Sí | Sí |
| `/t/[identifier]` | Sí (redirect) | Sí | N/A | N/A | Sí | N/A | Sí | Sí |

---

## 3. Comandos obligatorios

### Build

Desde `Vertrex-Website`:
- `npm run typecheck` → 0 errores.
- `npm run build` → 0 errores.

### Migraciones

- `npm run db:generate` no produce diffs adicionales tras aplicar las migraciones V3.
- `npm run db:migrate` aplica sin errores contra base de datos con datos V2 cargados.

### Pruebas e2e

- `npx playwright test e2e/tasks.spec.ts` pasa.
- `npx playwright test e2e/portal-v3.spec.ts` pasa.
- `npx playwright test e2e/ux-v3.spec.ts` pasa.

---

## 4. Pruebas funcionales obligatorias

### 4.1 Tareas

1. Crear proyecto nuevo → verificar `project_key` autogenerado.
2. `Ctrl+.` → capturar tarea sin proyecto → aparece en Inbox.
3. Mover tarea de Inbox a proyecto X → identifier `X-1` asignado.
4. Crear subtarea → identifier `X-1.1`.
5. Crear segunda tarea `X-2`, marcar `X-1 blocks X-2`.
6. Cerrar `X-1` → AlertDialog confirma, al aceptar, asignado de `X-2` recibe notification.
7. Crear ciclo, agregar tareas, activar, cerrar → burndown actualiza, no completadas vuelven al backlog.
8. Crear milestone, agregar 3 tareas, cerrar todas → milestone auto-completed.
9. Verificar `EntitySidebar` en detalle de tarea muestra cliente conectado por mención `@`.
10. Bulk update: seleccionar 5 tareas, cambiar estado a `in_review`.

### 4.2 Notificaciones / Actividad

1. Asignar tarea a otro usuario → bell con badge para él.
2. Comentar tarea → notification al asignado.
3. Aprobación pedida → notification al equipo cuando portal responde.
4. Activity feed dashboard refleja últimos 5 eventos en orden.

### 4.3 Portal V3

1. Crear `client_portal_user` en CRM → PIN visible una sola vez.
2. Login portal con email + slug + PIN → entra con identidad `portal_user`.
3. Pedir aprobación desde OS sobre documento → cliente la ve en `/portal/[slug]/approvals`.
4. Cliente comenta sobre documento → OS muestra el comentario en detalle.
5. Cliente firma documento legal → registra IP/UA/timestamp, PDF firmado descargable.
6. Logout → cookie eliminada, intento de acceso redirige a login.

### 4.4 Documentos / Legal

1. Subir documento `Brief.pdf` en folder X → guarda v1.
2. Re-subir mismo nombre en folder X → guarda v2 con `parent_id` apuntando a v1.
3. Crear share token con TTL 1h → abrir en incógnito antes de expirar (funciona), después (rechaza).
4. Crear plantilla legal con `{{NOMBRE}}`, `{{MONTO:currency}}`, `{{FECHA:date}}` → generar legal con datos.
5. Marcar `expires_at` en 25 días → badge amarillo. En 5 días → badge rojo.

### 4.5 Finanzas

1. Crear gasto recurrente mensual.
2. Marcar pagado → próximo periodo aparece como `pending` con `due_date` +1 mes.
3. Generar cuenta de cobro con line items → produce PDF, queda en `legal_documents`.
4. P&L del proyecto refleja ingresos y gastos conectados.

### 4.6 Hub

1. Abrir `/os/hub/daily/2026-05-11` → upsert nota daily.
2. Escribir `[[Idea X]]` → al guardar, idea X muestra "Notas que enlazan aquí" con backlink.

### 4.7 Seguridad

1. `GET /api/mcp/tasks` sin Bearer → 401.
2. `GET /api/mcp/tasks` con Bearer válido → JSON spec §8.
3. `POST /api/portal/comments` sin `portal_session` → 401.
4. `POST /api/upload` sin sesión → 401.
5. `revealResourceAction` con `visibility='admin'` siendo `team` → bloqueado.

---

## 5. Criterios de rechazo inmediato V3

El módulo se rechaza si pasa cualquiera de estos:

- Una tarea queda con `project_id IS NULL` fuera de la Inbox.
- Un identifier se duplica.
- Cerrar tarea con bloqueados no muestra AlertDialog.
- Bell de notificaciones no se renderiza o no actualiza el badge.
- Una mutación crítica no aparece en `activity`.
- Multi-PIN no permite que dos usuarios distintos del mismo cliente firmen con identidades separadas.
- Firma electrónica simple no registra IP, UA o timestamp.
- Share token sigue funcionando después de expirar.
- Generador de cuenta de cobro no produce PDF.
- `entity_links` no se materializan al guardar una descripción con menciones `@`.
- `BulkActionBar` no aparece al seleccionar múltiples filas en listados clave.
- Cualquier ruta V3 listada en §2 está marcada `No` o devuelve 404.

---

## 6. Definición de terminado V3.0

V3.0 se considera entregada cuando:

1. Todos los gaps `P0` y `P1` de `vertrex-os-v3-gap-matrix.md` están en estado `done`.
2. Esta tabla §1 está completa con todos los gates `Sí`.
3. La tabla §2 tiene todas las rutas marcadas `Sí`.
4. `vertrex-os-v3-ux-checklist.md` está al 100%.
5. `npm run typecheck && npm run build` pasan con 0 errores.
6. Las pruebas e2e listadas en §3 pasan.
7. Las pruebas funcionales §4 fueron ejecutadas manualmente en al menos un entorno representativo.
8. Los datos de V2 cargados antes de la migración siguen consultables y operativos tras V3.

V3.0 NO requiere los ítems "Pospuesto a V3.1" del PRD §10.
