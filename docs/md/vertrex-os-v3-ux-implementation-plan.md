# Vertrex OS V3 — Plan de Implementación UX

Este plan complementa `vertrex-os-v3-implementation-plan.md`. Solo trata la capa visual y de interacción de V3. La capa funcional/datos vive en el plan técnico hermano. Si hay conflicto entre planes, prevalece el funcional para datos y este para presentación.

**Precondición:** la Fase V3-0 del plan funcional debe estar completa (alcance V3.0 vs V3.1 confirmado). Las dependencias visuales nuevas listadas abajo se instalan en esta Fase UX-V3-1.

---

## Archivos que NO se deben modificar

- Mismos que el plan funcional V3.

---

## Fase UX-V3-1 — Dependencias visuales y tokens

1. `[Vertrex-Website/package.json]` → Verificar `@dnd-kit/core` y `@dnd-kit/sortable` (solo si el plan funcional decidió usarlos en V3.0 para kanban). Si no, postergar a V3.1 → Decisión consistente con el plan funcional.
2. `[Vertrex-Website/package.json]` → Verificar `date-fns` y `date-fns/locale/es`. Si falta, `npm install date-fns` → Formato de fechas en español.
3. `[Vertrex-Website/src/app/os-theme.css]` → Añadir tokens V3 listados en `vertrex-os-v3-ux-spec.md §1`: `--os-priority-*` y `--os-state-*` → Pills y dots reutilizan tokens.
4. `[Vertrex-Website/src/lib/utils.ts]` → Añadir helpers `priorityToken(priority)` y `stateToken(state)` para mapear a clases/colores → Sin lógica de color repetida.
5. `[Vertrex-Website/src/lib/format.ts]` → Añadir `formatRelativeTime(date, locale='es')`, `formatBurndownPoints(...)`, `humanState(state)` (mapping V3 spec §3.5) → Formato consistente.

### Checkpoint UX-V3-1

6. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Si falla, no avanzar.

---

## Fase UX-V3-2 — Componentes primitivos del sistema de tareas

7. `[Vertrex-Website/src/components/os/Tasks/TaskStatePill.tsx]` → Variants 6 estados, soporte size sm/md, opcional dot + label → Pill reusable.
8. `[Vertrex-Website/src/components/os/Tasks/PriorityDot.tsx]` → 5 variants (urgent/high/medium/low/none), opcional label → Dot reusable.
9. `[Vertrex-Website/src/components/os/Tasks/IdentifierChip.tsx]` → Monospace, hover muestra "Copiar", click copia + toast → Identificador clickeable.
10. `[Vertrex-Website/src/components/os/Tasks/TaskAssigneeSelect.tsx]` → DropdownMenu con search, opciones "Yo", "Nadie", miembros → Asignación rápida.
11. `[Vertrex-Website/src/components/os/Tasks/TaskQuickEditMenu.tsx]` → DropdownMenu con tres tabs internos: estado, prioridad, asignado → Inline edit consistente.
12. `[Vertrex-Website/src/components/os/Tasks/TaskRow.tsx]` → Fila con columnas configurables; soporta densidad → Reusable en todas las listas de tareas.
13. `[Vertrex-Website/src/components/os/Tasks/TaskDetailSheet.tsx]` → Sheet ancho 720px con descripción read-only y panel propiedades editable → Detalle rápido sin perder lista.
14. `[Vertrex-Website/src/components/os/Tasks/BurndownChart.tsx]` → SVG inline con eje X tiempo, eje Y puntos restantes, línea ideal y real → Burndown sin librería extra.
15. `[Vertrex-Website/src/components/os/Tasks/RoadmapTimeline.tsx]` → SVG/CSS grid con scroll horizontal, ticks por mes/trimestre/año → Roadmap visual.

### Checkpoint UX-V3-2

16. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Render isolated en una sandbox/story (si existe) o en `/os/projects/sandbox` temporal → Componentes confirmados visualmente.

---

## Fase UX-V3-3 — Editor con mentions y backlinks

17. `[Vertrex-Website/src/components/os/Editor/MentionInput.tsx]` → BlockNote schema extension para nodo `mention` (entityType + entityId). Dropdown disparado por `@` consultando `searchEntitiesAction` → Mentions interactivas en escritura.
18. `[Vertrex-Website/src/components/os/Editor/EntityMentionRenderer.tsx]` → Render inline de mention: chip con icono por tipo, color por tipo, hover muestra preview, click navega → Lectura legible.
19. `[Vertrex-Website/src/components/os/Editor/BacklinksPlugin.tsx]` → Procesa `[[Nota X]]` durante guardado y dispara crear `entity_links` references nota→nota; en render muestra link interno → Backlinks Hub V3.
20. `[Vertrex-Website/src/components/os/Editor/BlockEditor.tsx]` → Integrar plugins anteriores. Mantener compatibilidad con notas V2 → Editor V3 sin regresiones.

### Checkpoint UX-V3-3

21. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Probar manualmente: escribir `@VTX` en descripción de tarea y verificar dropdown; guardar y ver `EntityMentionRenderer`; en nota escribir `[[Otra nota]]`, guardar y ver backlink en sidebar de la otra nota.

---

## Fase UX-V3-4 — Rutas tareas

22. `[Vertrex-Website/src/app/os/projects/[id]/tasks/page.tsx]` → Implementar UX `vertrex-os-v3-ux-spec.md §3.1` → Lista premium tipo Linear.
23. `[Vertrex-Website/src/app/os/projects/[id]/tasks/loading.tsx]` → Skeleton toolbar + 8 filas → Loading fiel.
24. `[Vertrex-Website/src/app/os/projects/[id]/tasks/error.tsx]` → ErrorState con Reintentar → Error recuperable.
25. `[Vertrex-Website/src/app/os/projects/[id]/board/page.tsx]` → UX §3.2: 5 columnas, drag (si aplica), toggles → Tablero operativo.
26. `[Vertrex-Website/src/app/os/projects/[id]/board/loading.tsx]` → KanbanSkeleton 5x3 → Loading fiel.
27. `[Vertrex-Website/src/app/os/projects/[id]/tasks/[taskId]/page.tsx]` → UX §3.3 detalle completo con sticky header, atajos `e/a/s/p/c` → Detalle premium.
28. `[Vertrex-Website/src/app/os/projects/[id]/tasks/[taskId]/loading.tsx]` → DetailSkeleton con dos columnas → Loading fiel.
29. `[Vertrex-Website/src/app/os/projects/inbox/page.tsx]` → UX §3.4 inbox con CTA captura → Inbox operativa.
30. `[Vertrex-Website/src/app/os/projects/mine/page.tsx]` → UX §3.5 mis tareas con tabs → Vista personal.
31. `[Vertrex-Website/src/app/os/projects/roadmap/page.tsx]` → UX §3.6 timeline con zoom → Roadmap V3.
32. `[Vertrex-Website/src/app/os/projects/[id]/cycles/page.tsx]` → Lista ciclos cards con burndown mini en card → Cycles UI.
33. `[Vertrex-Website/src/app/os/projects/[id]/cycles/[cycleId]/page.tsx]` → UX §3.7 con StatCards y BurndownChart → Detalle ciclo.
34. `[Vertrex-Website/src/app/os/projects/[id]/milestones/page.tsx]` → UX §3.8 cards horizontales con drag para reordenar (sin DnD se cae a botones up/down) → Hitos UI.

### Checkpoint UX-V3-4

35. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Revisar manualmente cada ruta: PageHeader, Toolbar, Skeleton, EmptyState, ErrorState, responsive a 390px. Si alguna falta, corregir antes de avanzar.

---

## Fase UX-V3-5 — Captura rápida, atajos, command menu

36. `[Vertrex-Website/src/components/os/Tasks/QuickTaskModal.tsx]` → Modal 560px con input grande, footer compacto (proyecto, asignado, prioridad) → Captura sin fricción.
37. `[Vertrex-Website/src/components/os/Shortcuts/GlobalHotkeys.tsx]` → Listener `Ctrl/Cmd+.` abre `QuickTaskModal`. Atajos `g+t`, `g+p`, `g+h`, `g+c` navegan → Atajos globales.
38. `[Vertrex-Website/src/components/os/CommandMenu.tsx]` → Añadir acciones V3: "Capturar tarea", "Ir a Inbox", "Ir a mis tareas", "Ir al roadmap". Implementar búsqueda con operadores `is:task`, `assignee:me`, `priority:high`, `project:KEY`, `due:<7d` mostrando resultados agrupados por tipo → Command menu V3.
39. `[Vertrex-Website/src/components/os/layout/Sidebar.tsx]` → Añadir sección "Ejecución" con enlaces: Inbox, Mis tareas, Roadmap. Sidebar conserva agrupación V2 y suma esta sección → Navegación visible.

### Checkpoint UX-V3-5

40. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Probar `Ctrl+.`, `g+t`, command menu con `assignee:me priority:high`. Si falla, no avanzar.

---

## Fase UX-V3-6 — Notificaciones, actividad, comentarios, aprobaciones

41. `[Vertrex-Website/src/components/os/Notifications/NotificationBell.tsx]` → Topbar bell + badge + Sheet → UX §5.
42. `[Vertrex-Website/src/components/os/Notifications/NotificationSheet.tsx]` → Lista cronológica agrupada por día → Sheet operativo.
43. `[Vertrex-Website/src/app/os/notifications/page.tsx]` → Centro con filtros y bulk → Centro completo.
44. `[Vertrex-Website/src/components/os/Activity/ActivityItem.tsx]` → Item con avatar + verb humanizado + target link + tiempo relativo → Reusable.
45. `[Vertrex-Website/src/components/os/Activity/ActivityFeed.tsx]` → Server Component que recibe filtros y pagina → Feed reusable.
46. `[Vertrex-Website/src/app/os/admin/page.tsx]` → Añadir panel "Mi día" (5 tareas prioritarias, próxima reunión, próximo cobro) + panel "Actividad reciente" → Dashboard V3.
47. `[Vertrex-Website/src/app/os/crm/[slug]/timeline/page.tsx]` → Renderiza ActivityFeed filtrado por cliente → Timeline operativa.
48. `[Vertrex-Website/src/components/os/Comments/CommentThread.tsx]` → Thread con avatares y mention render → Reusable.
49. `[Vertrex-Website/src/components/os/Comments/CommentInput.tsx]` → Input con MentionInput y pending state → Input estándar.
50. `[Vertrex-Website/src/components/os/Approvals/RequestApprovalSheet.tsx]` → Sheet para que el equipo cree aprobación con selección de portal_users → Operativo.
51. `[Vertrex-Website/src/components/os/Approvals/ApprovalCard.tsx]` → Card con CTAs Aprobar / Pedir cambios y estado posterior → Reutilizado en portal.
52. `[Vertrex-Website/src/app/portal/[slug]/approvals/page.tsx]` → Lista pendientes y respondidas con ApprovalCard → Portal aprueba.
53. `[Vertrex-Website/src/app/os/admin/loading.tsx]` y `error.tsx` → Actualizar para incluir nuevos paneles → Loading/error consistente.

### Checkpoint UX-V3-6

54. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Probar bell click, sheet, ruta `/os/notifications`; pedir aprobación desde detalle de doc; responder desde portal con un `portal_user`. Si falla, no avanzar.

---

## Fase UX-V3-7 — Documentos, Legal, Recursos, Finanzas extendidos UI

55. `[Vertrex-Website/src/components/os/Documents/FolderTree.tsx]` → Árbol colapsable en sidebar izquierdo de `/os/documents` → Folders visible.
56. `[Vertrex-Website/src/components/os/Documents/ShareDocumentSheet.tsx]` → Sheet con TTL selector, link + QR, lista tokens activos → Compartir operativo.
57. `[Vertrex-Website/src/app/os/documents/page.tsx]` → Integrar FolderTree y filtro folder + badge versión → Lista V3.
58. `[Vertrex-Website/src/app/os/documents/[id]/versions/page.tsx]` → Lista versiones cronológica con descargas → Operativa.
59. `[Vertrex-Website/src/components/os/Legal/SignaturePad.tsx]` → Componente portal para firmar con checkbox + nombre + email + bloque legal con IP/UA/timestamp visibles → Firma simple.
60. `[Vertrex-Website/src/app/portal/[slug]/legal/page.tsx]` → Lista legales con CTA firmar → Portal firma.
61. `[Vertrex-Website/src/app/os/legal/templates/page.tsx]` → CRUD plantillas con variables → UI plantillas.
62. `[Vertrex-Website/src/app/os/legal/[id]/page.tsx]` → Añadir tabs Plantilla y Firmas → Detalle legal V3.
63. `[Vertrex-Website/src/app/os/resources/page.tsx]` → Sidebar folders + badges visibility + rotation → Lista V3.
64. `[Vertrex-Website/src/app/os/resources/audit/page.tsx]` → Tabla auditoría admin only → Operativa.
65. `[Vertrex-Website/src/app/os/finances/page.tsx]` → Stat cards multi-moneda, badge recurrencia en filas → Lista V3.
66. `[Vertrex-Website/src/app/os/finances/invoices/page.tsx]` → Tabla cuentas de cobro + Sheet generador con line items y vista preview → Invoices UI.
67. `[Vertrex-Website/src/app/os/finances/cashflow/page.tsx]` → Timeline barras semanales 90 días → Cashflow UI.
68. `[Vertrex-Website/src/app/os/finances/projects/page.tsx]` → Tabla P&L con ingresos/gastos por proyecto y margen → Operativa.
69. `[Vertrex-Website/src/app/os/projects/[id]/page.tsx]` → Añadir barra "Presupuesto consumido" si `budget_cop` definido → Alerta visual.

### Checkpoint UX-V3-7

70. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Revisar las rutas manualmente con datos seed. Si falla, no avanzar.

---

## Fase UX-V3-8 — Hub V3, Agenda V3, Links V3, Marketing V3

71. `[Vertrex-Website/src/app/os/hub/page.tsx]` → Añadir sidebar izquierdo con calendario mini "Daily" y filtros tags/idea_status/type → Hub V3.
72. `[Vertrex-Website/src/app/os/hub/daily/[date]/page.tsx]` → Daily note con BlockEditor preconfigurado y plantilla diaria opcional → Daily operativa.
73. `[Vertrex-Website/src/app/os/hub/[id]/page.tsx]` → Añadir card "Notas que enlazan aquí" en sidebar derecho usando relaciones `references` inversas → Backlinks visibles.
74. `[Vertrex-Website/src/app/os/agenda/page.tsx]` → Añadir badges recurrencia y zona horaria, fuente externa marcada con badge "Google" si aplica → Agenda V3.
75. `[Vertrex-Website/src/app/os/links/page.tsx]` → Añadir columna `reading_status` (triage/to_read/reading/done) y filtro de colecciones → Links V3.
76. `[Vertrex-Website/src/app/os/links/digest/page.tsx]` → Lista repos guardados últimos 7 días resaltando saved_reason → Digest semanal.
77. `[Vertrex-Website/src/app/os/links/collections/page.tsx]` → CRUD colecciones → Operativo.
78. `[Vertrex-Website/src/app/os/marketing/calendar/page.tsx]` → Calendario mensual con drag opcional → Marketing V3.
79. `[Vertrex-Website/src/app/os/marketing/hashtags/page.tsx]` → Biblioteca hashtags con copia rápida → Operativa.

### Checkpoint UX-V3-8

80. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Probar daily note, backlinks, agenda con recurrencia, link reading_status, marketing calendar. Si falla, no avanzar.

---

## Fase UX-V3-9 — Equipo workload, multi-PIN portal, settings tabs nuevas

81. `[Vertrex-Website/src/app/os/team/workload/page.tsx]` → Tabla con avatars, tareas activas, vencidas, próxima entrega, último acceso → Workload visible.
82. `[Vertrex-Website/src/app/os/crm/[slug]/portal-users/page.tsx]` → Tabla con usuarios portal, acciones crear, regenerar PIN, desactivar; banner "PIN mostrado una sola vez" → Multi-PIN operativo.
83. `[Vertrex-Website/src/app/portal/login/page.tsx]` → Añadir campo email; layout grande; bloque de ayuda "Si solo tienes PIN maestro, deja email vacío" → Portal login V3.
84. `[Vertrex-Website/src/app/portal/[slug]/account/page.tsx]` → Preferencias notificaciones (toggle email), datos del portal_user → Operativa.
85. `[Vertrex-Website/src/app/os/settings/page.tsx]` → Tabs Notificaciones, Integraciones, Apariencia, Variables internas, MCP, Sistema (orden V3 §14) → Settings V3.

### Checkpoint UX-V3-9

86. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Probar multi-PIN end-to-end (crear, login, ver actividad firmada por portal_user). Si falla, no avanzar.

---

## Fase UX-V3-10 — Saved views, bulk ops globales, refinamiento

87. `[Vertrex-Website/src/components/os/SavedViews/SavedViewBar.tsx]` → Chips de vistas guardadas por ruta + CTA "Guardar vista" → Reutilizable.
88. `[Vertrex-Website/src/components/os/data/BulkActionBar.tsx]` → Barra flotante inferior con conteo, acciones según contexto, "Limpiar selección" → Operativa.
89. `[Vertrex-Website/src/components/os/data/DataTable.tsx]` → Añadir selección múltiple con checkbox column, slot `bulkActions` → Habilitar bulk donde aplique.
90. `[Vertrex-Website/src/app/os/crm/page.tsx]`, `[Vertrex-Website/src/app/os/projects/[id]/tasks/page.tsx]`, `[Vertrex-Website/src/app/os/documents/page.tsx]`, `[Vertrex-Website/src/app/os/finances/page.tsx]`, `[Vertrex-Website/src/app/os/links/page.tsx]` → Integrar `SavedViewBar` y `BulkActionBar` → Productividad consistente.

### Checkpoint UX-V3-10

91. `[Vertrex-Website]` → `npm run typecheck` → 0 errores. Probar guardar vista en /os/projects/[id]/tasks, recargar y ver chip. Bulk update en CRM. Si falla, no avanzar.

---

## Fase UX-V3-11 — Quality gate visual final

92. `[Vertrex-Website/docs/md/vertrex-os-v3-ux-checklist.md]` → Marcar rutas nuevas/extendidas aprobadas → Auditoría visual.
93. `[Vertrex-Website/e2e/ux-v3.spec.ts]` → Pruebas Playwright mínimas: existencia de `data-testid="page-header"` en rutas V3, no tablas crudas, presencia de bell en topbar, modal Ctrl+. abre → Quality gate continuo.
94. `[Vertrex-Website/src/components/ui/*]` → Revisar focus-visible, aria-labels en icon buttons V3 nuevos → Accesibilidad mínima.
95. `[Vertrex-Website/src/app/os/**]` → Buscar `<table` y `className="border` directos en rutas V3; sustituir por `DataTable`/`Card` → Sin UI básica residual V3.
96. `[Vertrex-Website]` → Ejecutar `npm run typecheck && npm run build` → 0 errores.
97. `[Vertrex-Website]` → Validación manual viewports 1440/1024/390 sobre rutas V3 clave: `/os/projects/inbox`, `/os/projects/mine`, `/os/projects/[id]/tasks`, `/os/projects/[id]/board`, `/os/projects/[id]/tasks/[taskId]`, `/os/admin`, `/os/notifications`, `/os/finances/invoices`, `/portal/[slug]/approvals`, `/portal/[slug]/legal` → No quedan pantallas que parezcan scaffold.

### Checkpoint UX-V3-11

98. `[Vertrex-Website]` → `npm run typecheck && npm run build` ambos 0 errores; checklist 100% → UX V3 aprobada.

---

## Resultado esperado UX V3

- Sistema de tareas tipo Linear con UI premium (lista, tablero, detalle, inbox, mis tareas, roadmap, cycles, milestones).
- Captura rápida `Ctrl+.` funcional y descubrible.
- Atajos globales `g+...` y command palette V3.
- Notification bell + centro + activity feed visibles y útiles.
- Comentarios, aprobaciones y firma simple operativos en OS y portal.
- Documentos con folders, versiones, share tokens visibles.
- Legal con plantillas, firmas y badge de vencimiento.
- Recursos con folders, rotation badge, audit.
- Finanzas con multi-moneda, cuentas de cobro, P&L, cashflow.
- Hub con daily notes y backlinks.
- Saved views y bulk operations en listados clave.
- Portal multi-usuario con email + slug + PIN.
- Settings V3 con tabs claras.
- Cero rompimientos visuales con V2.
