# Vertrex OS — Checklist de Aprobación UX/UI V3

Este checklist debe completarse antes de considerar terminado cualquier módulo del OS V3. Extiende `vertrex-os-ux-checklist.md` (V1/V2) con las rutas nuevas y los criterios V3 adicionales (mentions, atajos, bulk, saved views, identifiers).

## Reglas de aprobación

- `Sí` = implementado y verificado manualmente.
- `No` = pendiente; no aprobar el módulo.
- `N/A` solo si la pantalla no lista datos, no tiene acciones async o no aplica el criterio.
- Ninguna ruta V3 puede aprobarse si tiene `No` en: PageHeader, Loading, Empty, Error, Responsive 390px o "Sin UI básica".

---

## 1. Checklist global por ruta V3 — Proyectos + Tareas

| Ruta | PageHeader | Breadcrumbs | Toolbar | Loading | Empty | Error | Toast | Dialog/Sheet | Resp. 390 | Sin UI básica | Atajo visible | Aprobado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/os/projects` (extendida) | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/inbox` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/mine` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/roadmap` | Sí | Sí | Sí | Sí | Sí | Sí | N/A | N/A | Sí | Sí | N/A | Sí |
| `/os/projects/[id]` (Overview V3) | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | N/A | Sí |
| `/os/projects/[id]/tasks` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/[id]/board` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/[id]/cycles` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | N/A | Sí |
| `/os/projects/[id]/cycles/[cycleId]` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | N/A | Sí |
| `/os/projects/[id]/milestones` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | N/A | Sí |
| `/os/projects/[id]/tasks/[taskId]` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |

## 2. Checklist por ruta — Otros módulos extendidos

| Ruta | PageHeader | Breadcrumbs | Toolbar | Loading | Empty | Error | Toast | Dialog/Sheet | Resp. 390 | Sin UI básica | Aprobado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/os/admin` (Mi día + actividad) | Sí | Sí | N/A | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/crm/[slug]/timeline` | Sí | Sí | Sí | Sí | Sí | Sí | N/A | N/A | Sí | Sí | Sí |
| `/os/crm/[slug]/portal-users` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/documents/folders` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/documents/[id]/versions` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/legal/templates` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/legal/[id]/signatures` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/hub/daily/[date]` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/resources/folders` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/resources/audit` | Sí | Sí | Sí | Sí | Sí | Sí | N/A | N/A | Sí | Sí | Sí |
| `/os/finances/projects` | Sí | Sí | Sí | Sí | Sí | Sí | N/A | N/A | Sí | Sí | Sí |
| `/os/finances/cashflow` | Sí | Sí | Sí | Sí | Sí | Sí | N/A | N/A | Sí | Sí | Sí |
| `/os/finances/invoices` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/links/digest` | Sí | Sí | Sí | Sí | Sí | Sí | N/A | N/A | Sí | Sí | Sí |
| `/os/links/collections` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/marketing/calendar` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/marketing/hashtags` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/team/workload` | Sí | Sí | Sí | Sí | Sí | Sí | N/A | N/A | Sí | Sí | Sí |
| `/os/settings` (tabs V3) | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/notifications` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/activity` | Sí | Sí | Sí | Sí | Sí | Sí | N/A | N/A | Sí | Sí | Sí |
| `/portal/[slug]/approvals` | Sí | N/A | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/portal/[slug]/legal` | Sí | N/A | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/portal/[slug]/account` | Sí | N/A | N/A | Sí | N/A | Sí | Sí | N/A | Sí | Sí | Sí |
| `/share/[token]` | N/A | N/A | N/A | Sí | N/A | Sí | N/A | N/A | Sí | Sí | Sí |

## 3. Checklist V3-específico (criterios nuevos)

Cada ruta marcada `Sí` debe cumplir adicionalmente:

| Criterio | Aplicabilidad | Verificación |
|---|---|---|
| `IdentifierChip` monospace + copy | Toda ruta con tareas | Click copia + toast |
| `TaskStatePill` con tokens V3 | Toda ruta con tareas | Color y label correctos |
| `PriorityDot` con tokens V3 | Toda ruta con tareas | Color por prioridad |
| `EntityMentionRenderer` | Toda vista que muestre descripción/comentarios | Sin texto plano `@xxxx` |
| `BulkActionBar` | Listados con DataTable | Aparece al seleccionar |
| `SavedViewBar` | Listados clave (tareas, CRM, docs, finanzas, links) | Persistencia URL |
| `NotificationBell` | Layout OS | Visible siempre, badge actualiza |
| Atajos `Ctrl+.`, `Ctrl+I`, `Ctrl+K` | Layout OS | Documentados en command menu |
| Atajos `g+t/p/h/c` | Layout OS | Funcionales |
| Captura rápida tarea | Layout OS | Modal abre, guarda, redirige opcional |
| Densidad toggle | Topbar | Persistente en `users.preferences.density` |
| Texto humano de estado en portal | Portal | Mapping Tasks spec §9.5 |
| Firma muestra IP/UA/timestamp | Portal legal | Visible antes de firmar |
| Aprobación responde con nota cuando `Pedir cambios` | Portal | Obligatoria |
| Mention `[[Nota]]` crea backlink | Hub | Visible en ambos lados |
| Burndown renderiza con 0 tareas | Ciclo | Estado "Sin tareas" |
| AlertDialog al cerrar tarea con bloqueados | Detalle tarea | Confirmación obligatoria |
| AlertDialog en bulk delete | Listados | Conteo de filas visible |

## 4. Criterios de "Sin UI básica" V3

Marcar `Sí` solo si se cumplen todos:

- No hay tablas HTML crudas sin `DataTable`.
- No hay botones default del navegador.
- No hay formularios sin estado pending.
- No hay listas vacías sin `EmptyState`.
- No hay icon buttons sin tooltip o aria-label.
- No hay acciones destructivas sin AlertDialog.
- No hay pantalla con sólo `h1 + tabla + botón`.
- La ruta se ve bien en desktop y a 390px.
- Los identifiers están en monospace y son clickeables.
- Las menciones nunca aparecen como texto plano.
- Las pills y dots V3 usan los tokens nuevos.

## 5. Pruebas manuales obligatorias V3

1. Abrir viewport 1440px y revisar cada ruta nueva.
2. Abrir viewport 1024px y revisar sidebar V3 con grupo "Ejecución".
3. Abrir viewport 390px y verificar que no haya overflow horizontal roto.
4. Probar `Ctrl+.` desde cualquier ruta OS y crear tarea.
5. Probar `g+t` para navegar a "Mis tareas".
6. Probar `g+p` para navegar a Proyectos.
7. Probar drag & drop en tablero (si dnd-kit instalado).
8. Probar selección múltiple en `/os/projects/[id]/tasks` y bulk update.
9. Probar guardar vista y recargar.
10. Probar `Ctrl+K` con operador `is:task assignee:me priority:high`.
11. Pedir aprobación desde OS, responder desde portal, ver respuesta en OS.
12. Firmar documento desde portal, verificar PDF firmado descargable.
13. Crear gasto recurrente, marcarlo pagado, verificar próximo periodo.
14. Crear share token, abrir desde incógnito, esperar expiración, reintentar.
15. Escribir mention `@cliente:slug` en una tarea y verificar `entity_links` actualizado.
16. Crear daily note del día y mencionar `[[Idea X]]`, verificar backlink en idea.
17. Crear `client_portal_user` en CRM, copiar PIN, login portal con email+slug+PIN.
18. Cerrar tarea con dependientes y verificar notification al dependiente.
19. Cerrar ciclo y verificar que tareas no completadas regresan al backlog.
20. Cerrar todas las tareas de un milestone y verificar que pasa a `completed` automáticamente.

## 6. Aprobación final

V3.0 se considera aprobado visualmente cuando:

- Todas las filas de §1 y §2 están marcadas `Sí` (excepto `N/A` justificados).
- Todos los criterios de §3 se cumplen en su contexto.
- Todas las pruebas manuales §5 se ejecutaron y pasaron.
- `vertrex-os-v3-quality-gate.md` está aprobado en paralelo.

Si alguna ruta marca `No`, se debe corregir antes de aprobar el módulo correspondiente.
