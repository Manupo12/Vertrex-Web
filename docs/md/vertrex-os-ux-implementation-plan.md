# Vertrex OS — Plan de Implementación UX/UI Moderna

Este plan complementa `Vertrex-Website/docs/md/vertrex-os-prd-implementation-plan.md`. El objetivo es que el ejecutor no construya una interfaz básica, sino una experiencia moderna, consistente y usable. Este plan NO ejecuta cambios por sí mismo; solo define pasos para el modelo implementador.

## Archivos que NO se deben modificar

- `Vertrex-Website/docs/md/vertrex-os-prd(1).md` — PRD fuente de verdad.
- `Vertrex-Website/.env.local` — secretos.
- `Vertrex-Website/node_modules/**` — dependencias instaladas.
- `Vertrex-Website/.next/**` — salida generada.
- `Vertrex-Website/public/**` — assets públicos de landing.
- `Vertrex-Website/src/app/page.tsx` — landing pública.
- `Vertrex-Website/src/components/Header.tsx` — header público.
- `Vertrex-Website/src/components/Footer.tsx` — footer público.
- `Vertrex-Website/drizzle/meta/**` — metadatos generados por Drizzle.

## Precondición obligatoria

Antes de aplicar este plan, ejecutar la Fase 0 de `Vertrex-Website/docs/md/vertrex-os-prd-implementation-plan.md`: eliminar todo rastro del OS actual porque quedó demasiado básico. No conservar componentes visuales del OS anterior. Recrear la capa OS desde cero.

---

## Fase UX 1 — Dependencias visuales y utilidades base

1. `[Vertrex-Website/package.json]` → Verificar que `class-variance-authority` NO está en `dependencies` ni `devDependencies`; si no está, ejecutar `npm install class-variance-authority` desde `Vertrex-Website` → La utilidad CVA queda disponible para variants de componentes.
2. `[Vertrex-Website/package.json]` → Verificar que `clsx` NO está en `dependencies` ni `devDependencies`; si no está, ejecutar `npm install clsx` desde `Vertrex-Website` → La composición condicional de clases queda disponible.
3. `[Vertrex-Website/package.json]` → Verificar que `tailwind-merge` NO está en `dependencies` ni `devDependencies`; si no está, ejecutar `npm install tailwind-merge` desde `Vertrex-Website` → La fusión segura de clases Tailwind queda disponible.
4. `[Vertrex-Website/package.json]` → Verificar que `@radix-ui/react-slot` NO está en `dependencies` ni `devDependencies`; si no está, ejecutar `npm install @radix-ui/react-slot` desde `Vertrex-Website` → `Button asChild` queda disponible.
5. `[Vertrex-Website/package.json]` → Verificar que `@radix-ui/react-dialog` NO está en `dependencies` ni `devDependencies`; si no está, ejecutar `npm install @radix-ui/react-dialog` desde `Vertrex-Website` → Dialog y Sheet quedan disponibles.
6. `[Vertrex-Website/package.json]` → Verificar que `@radix-ui/react-alert-dialog` NO está en `dependencies` ni `devDependencies`; si no está, ejecutar `npm install @radix-ui/react-alert-dialog` desde `Vertrex-Website` → Confirmaciones destructivas quedan disponibles.
7. `[Vertrex-Website/package.json]` → Verificar que `@radix-ui/react-dropdown-menu` NO está en `dependencies` ni `devDependencies`; si no está, ejecutar `npm install @radix-ui/react-dropdown-menu` desde `Vertrex-Website` → Menús de acciones por fila/card quedan disponibles.
8. `[Vertrex-Website/package.json]` → Verificar que `@radix-ui/react-select` NO está en `dependencies` ni `devDependencies`; si no está, ejecutar `npm install @radix-ui/react-select` desde `Vertrex-Website` → Filtros y selects consistentes quedan disponibles.
9. `[Vertrex-Website/package.json]` → Verificar que `@radix-ui/react-tabs` NO está en `dependencies` ni `devDependencies`; si no está, ejecutar `npm install @radix-ui/react-tabs` desde `Vertrex-Website` → Tabs de detalles quedan disponibles.
10. `[Vertrex-Website/package.json]` → Verificar que `@radix-ui/react-tooltip` NO está en `dependencies` ni `devDependencies`; si no está, ejecutar `npm install @radix-ui/react-tooltip` desde `Vertrex-Website` → Tooltips para icon buttons y atajos quedan disponibles.
11. `[Vertrex-Website/package.json]` → Verificar que `@tanstack/react-table` NO está en `dependencies` ni `devDependencies`; si no está, ejecutar `npm install @tanstack/react-table` desde `Vertrex-Website` → DataTable moderna queda disponible.
12. `[Vertrex-Website/package.json]` → Verificar que `cmdk` NO está en `dependencies` ni `devDependencies`; si no está, ejecutar `npm install cmdk` desde `Vertrex-Website` → Command palette global queda disponible.
13. `[Vertrex-Website/package.json]` → Verificar que `sonner` NO está en `dependencies` ni `devDependencies`; si no está, ejecutar `npm install sonner` desde `Vertrex-Website` → Toasts modernos quedan disponibles.
14. `[Vertrex-Website/src/lib/utils.ts]` → Reemplazar `cn()` para usar `clsx` y `tailwind-merge`, manteniendo `formatDate()` → Las clases Tailwind no se pisan entre variants.
15. `[Vertrex-Website/src/lib/format.ts]` → Crear helpers `formatCurrencyCop(amount)`, `formatShortDate(date)`, `formatDateTime(date)`, `formatFileSize(bytes)` → Todas las pantallas muestran fechas, COP y tamaños de forma consistente.

### Checkpoint Fase UX 1

16. `[Vertrex-Website]` → Ejecutar `npm ls class-variance-authority clsx tailwind-merge @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-alert-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-tooltip @tanstack/react-table cmdk sonner` desde `Vertrex-Website` → El comando lista todas las dependencias sin errores. Si falla, no avanzar.

---

## Fase UX 2 — Tokens visuales, tema y componentes primitivos

17. `[Vertrex-Website/src/app/os-theme.css]` → Definir tokens CSS para OS: `--os-bg`, `--os-panel`, `--os-panel-2`, `--os-border`, `--os-muted`, `--os-text`, `--os-primary`, `--os-danger`, `--os-warning`, `--os-success`, sombras, radios y animaciones fade/slide → El OS tiene una identidad visual dark premium.
18. `[Vertrex-Website/src/components/ui/button.tsx]` → Crear `Button` con CVA, variants `primary`, `secondary`, `ghost`, `outline`, `danger`, sizes `sm`, `md`, `lg`, `icon`, soporte `asChild`, `disabled` y `aria-busy` → No se usan botones HTML básicos en el OS.
19. `[Vertrex-Website/src/components/ui/input.tsx]` → Crear `Input` con estilos dark, icono opcional vía wrapper externo, focus ring, disabled y error visual → Los formularios tienen inputs consistentes.
20. `[Vertrex-Website/src/components/ui/textarea.tsx]` → Crear `Textarea` con estilos dark, focus ring, disabled y resize controlado → Textareas del Hub/Portal son consistentes.
21. `[Vertrex-Website/src/components/ui/label.tsx]` → Crear `Label` con texto semibold de 13px y estado disabled → Formularios tienen labels uniformes.
22. `[Vertrex-Website/src/components/ui/card.tsx]` → Crear `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` con fondo panel, borde sutil, radio 16px y sombra suave → Todas las superficies del OS se ven modernas.
23. `[Vertrex-Website/src/components/ui/badge.tsx]` → Crear `Badge` con variants `success`, `warning`, `danger`, `neutral`, `info`, `purple` → Los estados tienen lenguaje visual consistente.
24. `[Vertrex-Website/src/components/ui/status-badge.tsx]` → Crear `StatusBadge` que mapea estados: clientes, proyectos, finanzas, tickets, ideas, repositorios y storage provider → Todas las pantallas reutilizan el mismo mapeo de estado-color.
25. `[Vertrex-Website/src/components/ui/skeleton.tsx]` → Crear `Skeleton`, `TableSkeleton`, `CardGridSkeleton`, `StatsSkeleton`, `KanbanSkeleton`, `DetailSkeleton` → Las pantallas tienen loading moderno.
26. `[Vertrex-Website/src/components/ui/empty-state.tsx]` → Crear `EmptyState` con icono lucide, título, descripción, CTA opcional y layout centrado dentro de card → Las listas vacías dejan de verse rotas.
27. `[Vertrex-Website/src/components/ui/error-state.tsx]` → Crear `ErrorState` con icono alert, título, mensaje y botón `Reintentar` → Los errores son recuperables visualmente.
28. `[Vertrex-Website/src/components/ui/tooltip.tsx]` → Crear wrapper de Radix Tooltip con delay 250ms y estilos dark → Icon buttons muestran explicación y atajos.
29. `[Vertrex-Website/src/components/ui/dialog.tsx]` → Crear wrapper de Radix Dialog con overlay, animación, header, title, description y content max-width configurable → Crear/editar entidades usa modal moderno.
30. `[Vertrex-Website/src/components/ui/sheet.tsx]` → Crear Sheet lateral usando Radix Dialog, posición derecha, ancho 480px desktop, full-width móvil, animación slide → Detalles rápidos y conexiones no sacan al usuario de contexto.
31. `[Vertrex-Website/src/components/ui/alert-dialog.tsx]` → Crear wrapper de Radix AlertDialog para confirmaciones destructivas con botones `Cancelar` y `Confirmar` → Acciones irreversibles quedan protegidas.
32. `[Vertrex-Website/src/components/ui/tabs.tsx]` → Crear wrapper de Radix Tabs con lista horizontal, active underline, transición fade y scroll horizontal móvil → Detalles con muchas secciones son navegables.
33. `[Vertrex-Website/src/components/ui/select.tsx]` → Crear wrapper de Radix Select con trigger, content, item, label y separador → Filtros y formularios tienen selects consistentes.
34. `[Vertrex-Website/src/components/ui/dropdown-menu.tsx]` → Crear wrapper de Radix DropdownMenu para menús de acciones por fila/card → Las acciones secundarias no saturan la pantalla.
35. `[Vertrex-Website/src/components/ui/toaster.tsx]` → Crear `Toaster` de `sonner` con posición `top-right`, tema dark para OS y rich colors → El feedback de éxito/error queda disponible globalmente.

### Checkpoint Fase UX 2

36. `[Vertrex-Website]` → Ejecutar `npm run typecheck` desde `Vertrex-Website` → TypeScript termina con 0 errores. Si falla, no avanzar.

---

## Fase UX 3 — Componentes compuestos de producto

37. `[Vertrex-Website/src/components/os/layout/PageHeader.tsx]` → Crear `PageHeader` con props `breadcrumbs`, `title`, `description`, `badge`, `primaryAction`, `secondaryActions` → Todas las pantallas tienen jerarquía consistente.
38. `[Vertrex-Website/src/components/os/layout/Breadcrumbs.tsx]` → Crear breadcrumbs con links, truncado, separador ChevronRight y máximo 4 niveles → El usuario siempre sabe dónde está.
39. `[Vertrex-Website/src/components/os/layout/Toolbar.tsx]` → Crear toolbar con búsqueda debounce 300ms, slots de filtros, view switcher y contador → Listas tienen búsqueda/filtros consistentes.
40. `[Vertrex-Website/src/components/os/layout/KeyboardShortcut.tsx]` → Crear componente visual para atajos `Ctrl+K`, `Ctrl+I`, `Esc` → Atajos son visibles en UI.
41. `[Vertrex-Website/src/components/os/data/DataTable.tsx]` → Crear DataTable con `@tanstack/react-table`, sticky header, filas hover, cell renderers, columnas ocultables en móvil, paginación numérica y row actions slot → Queda prohibido usar tablas HTML crudas en OS.
42. `[Vertrex-Website/src/components/os/data/MobileCardList.tsx]` → Crear lista responsive que renderiza rows como cards bajo 768px → Tablas complejas funcionan en móvil.
43. `[Vertrex-Website/src/components/os/data/KanbanBoard.tsx]` → Crear KanbanBoard genérico con columnas, contador, cards, empty por columna y acción de cambio de status sin drag complejo obligatorio → Proyectos e ideas tienen vista moderna sin inventar lógica compleja.
44. `[Vertrex-Website/src/components/os/data/StatCard.tsx]` → Crear StatCard con icono, label, value, delta opcional y hover sutil → Dashboard/finanzas tienen métricas premium.
45. `[Vertrex-Website/src/components/os/actions/EntityConnectSheet.tsx]` → Crear Sheet con búsqueda de entidades, filtros por tipo y botón conectar; usa `linkEntities()` → Conectar entidades es consistente en todos los detalles.
46. `[Vertrex-Website/src/components/os/actions/ConfirmActionDialog.tsx]` → Crear wrapper para confirmaciones con `AlertDialog`, title, description y action → Desactivar usuarios/eliminar/desconectar comparten patrón.
47. `[Vertrex-Website/src/components/os/actions/AsyncSubmitButton.tsx]` → Crear botón client que usa `useFormStatus()` y muestra spinner + texto pending → Formularios server action muestran estado de envío.
48. `[Vertrex-Website/src/components/os/CommandMenu.tsx]` → Crear command palette con `cmdk`, atajo `Ctrl+K/Cmd+K`, rutas del OS y acciones: Nuevo cliente, Nuevo proyecto, Capturar idea, Subir documento, Guardar link, Nuevo evento → El OS se siente rápido y moderno.
49. `[Vertrex-Website/src/components/os/OSShell.tsx]` → Crear shell visual con sidebar agrupada, topbar, breadcrumbs, command trigger, avatar/rol, DB status y slot children → Layout del OS queda centralizado.
50. `[Vertrex-Website/src/app/os/layout.tsx]` → Usar `OSShell`, `Toaster`, `CommandMenu` y `QuickIdeaModal`; mantener `requireOsUser()` → Todas las rutas OS comparten sistema visual y feedback.

### Checkpoint Fase UX 3

51. `[Vertrex-Website]` → Ejecutar `npm run typecheck` desde `Vertrex-Website` → TypeScript termina con 0 errores. Luego abrir `/os/admin` y verificar que aparece sidebar agrupada, topbar, command trigger `Ctrl+K` y toasts disponibles. Si falla, no avanzar.

---

## Fase UX 4 — Aplicación por pantallas OS internas

52. `[Vertrex-Website/src/app/os/admin/loading.tsx]` → Crear loading con `StatsSkeleton` y panel skeleton → Dashboard carga con forma real.
53. `[Vertrex-Website/src/app/os/admin/error.tsx]` → Crear error boundary client con `ErrorState` y botón `Reintentar` → Dashboard tiene error state.
54. `[Vertrex-Website/src/app/os/admin/page.tsx]` → Implementar layout visual de `Vertrex-Website/docs/md/vertrex-os-ux-spec.md` sección 5.1 con `PageHeader`, 4 `StatCard`, actividad reciente, salud del sistema y accesos rápidos → Dashboard deja de ser básico.
55. `[Vertrex-Website/src/app/os/crm/loading.tsx]` → Crear loading con toolbar skeleton + `TableSkeleton` 5 filas → CRM tiene loading real.
56. `[Vertrex-Website/src/app/os/crm/error.tsx]` → Crear error boundary con `ErrorState` → CRM tiene error recuperable.
57. `[Vertrex-Website/src/app/os/crm/page.tsx]` → Implementar sección 5.2 de UX Spec: PageHeader, Toolbar, DataTable desktop, MobileCardList móvil, Dialog `Nuevo cliente`, EmptyState y toasts → Lista CRM se siente moderna.
58. `[Vertrex-Website/src/app/os/crm/[slug]/loading.tsx]` → Crear `DetailSkeleton` con sidebar → Detalle cliente carga con forma final.
59. `[Vertrex-Website/src/app/os/crm/[slug]/error.tsx]` → Crear error boundary con CTA volver a CRM → Detalle cliente maneja errores.
60. `[Vertrex-Website/src/app/os/crm/[slug]/page.tsx]` → Implementar sección 5.3 de UX Spec: PageHeader, tabs, sidebar, AlertDialog PIN, banner PIN una sola vez, EntityConnectSheet → Detalle cliente es producto real.
61. `[Vertrex-Website/src/app/os/projects/loading.tsx]` → Crear `KanbanSkeleton` → Proyectos tiene loading moderno.
62. `[Vertrex-Website/src/app/os/projects/page.tsx]` → Implementar sección 5.4 de UX Spec: Kanban por defecto, Toolbar, table alternativa, ProjectCard, badge anticipo → Proyectos deja de ser tabla simple.
63. `[Vertrex-Website/src/app/os/projects/[id]/loading.tsx]` → Crear detail skeleton → Detalle proyecto carga bien.
64. `[Vertrex-Website/src/app/os/projects/[id]/page.tsx]` → Implementar sección 5.5 de UX Spec: tabs Overview/Documentos/Finanzas/Agenda/Recursos/Grafo, sidebar, inline version edit, links chips/cards → Detalle proyecto se siente moderno.
65. `[Vertrex-Website/src/app/os/documents/loading.tsx]` → Crear skeleton de toolbar + grid/table → Documentos carga bien.
66. `[Vertrex-Website/src/app/os/documents/page.tsx]` → Implementar sección 5.6 de UX Spec: uploader en Dialog, filtros, DataTable/cards, EmptyState, upload pending y toast destino Neon/Drive → Documentos se siente completo.
67. `[Vertrex-Website/src/app/os/documents/[id]/page.tsx]` → Implementar detalle con preview, metadata card, descargar y EntitySidebar → Detalle documento tiene jerarquía.
68. `[Vertrex-Website/src/app/os/legal/page.tsx]` → Implementar sección 5.7: lista tipo documentos, filtro tipo, toggle Visible portal, cards legales destacadas → Legal se ve premium.
69. `[Vertrex-Website/src/app/os/legal/[id]/page.tsx]` → Implementar tabs Resumen/Conexiones/Portal, signed_at editable y EntitySidebar → Detalle legal queda completo.
70. `[Vertrex-Website/src/app/os/hub/loading.tsx]` → Crear KanbanSkeleton para incubadora → Hub carga moderno.
71. `[Vertrex-Website/src/app/os/hub/page.tsx]` → Implementar sección 5.8: tabs Notas/Incubadora/Todo, kanban ideas con emojis/colores, cards post-it, búsqueda, EmptyState Ctrl+I → Hub se siente como incubadora real.
72. `[Vertrex-Website/src/app/os/hub/[id]/page.tsx]` → Implementar sección 5.9: editor max-width, header sticky, next_step, preguntas fijas, sidebar colapsable, @repo sheet/combobox, toast guardar → Editor profundo se siente tipo Notion.
73. `[Vertrex-Website/src/app/os/resources/page.tsx]` → Implementar sección 5.10: DataTable, Dialog nuevo recurso, Sheet revelar, copiar con toast, nunca mostrar secreto en lista → Recursos cumple seguridad y UX.
74. `[Vertrex-Website/src/app/os/resources/[id]/page.tsx]` → Implementar detalle con metadata, revelar en Sheet, EntitySidebar → Detalle recurso queda completo.
75. `[Vertrex-Website/src/app/os/finances/page.tsx]` → Implementar sección 5.11: stat cards, toolbar, DataTable COP, warnings anticipo, EmptyState → Finanzas se ve profesional.
76. `[Vertrex-Website/src/app/os/finances/[id]/page.tsx]` → Implementar detalle con monto grande, timeline, acciones y EntitySidebar → Detalle financiero queda completo.
77. `[Vertrex-Website/src/app/os/agenda/page.tsx]` → Implementar sección 5.12: toggle mensual/semanal/lista, calendario semanal, próximos eventos, Dialog nuevo evento, Sheet evento → Agenda deja de ser lista plana.
78. `[Vertrex-Website/src/app/os/links/page.tsx]` → Implementar sección 5.13: repositorios GitHub cards premium, links galería, filtros, búsqueda, Dialog guardar link en 2 pasos con saved_reason obligatorio → Links se siente como módulo moderno.
79. `[Vertrex-Website/src/app/os/links/[id]/page.tsx]` → Implementar tabs Resumen/README/Conexiones, README con saved_reason sticky y markdown → Detalle link/repo queda premium.
80. `[Vertrex-Website/src/app/os/marketing/page.tsx]` → Implementar sección 5.14: cards por red social y mini kanban de contenido → Marketing deja de ser CRUD plano.
81. `[Vertrex-Website/src/app/os/marketing/[id]/page.tsx]` → Implementar tabs Cuenta/Contenido/Credenciales con revelar password tipo recurso → Detalle marketing queda consistente.
82. `[Vertrex-Website/src/app/os/team/page.tsx]` → Implementar sección 5.15: DataTable con avatar, rol badge, activo, Dialog nuevo miembro, AlertDialog desactivar → Equipo queda admin-grade.
83. `[Vertrex-Website/src/app/os/team/[userId]/page.tsx]` → Implementar detalle usuario con acciones protegidas y confirmaciones → Detalle equipo queda completo.
84. `[Vertrex-Website/src/app/os/generator/page.tsx]` → Implementar sección 5.16: split view, editor HTML, upload, preview iframe, variables dinámicas y descarga → Generator se siente herramienta real.
85. `[Vertrex-Website/src/app/os/settings/page.tsx]` → Implementar sección 5.17: tabs Cuenta/Variables internas/MCP/Sistema, cards segmentadas, copiar endpoint con toast → Settings queda moderno.

### Checkpoint Fase UX 4

86. `[Vertrex-Website]` → Ejecutar `npm run typecheck` desde `Vertrex-Website` → TypeScript termina con 0 errores. Luego revisar manualmente `/os/admin`, `/os/crm`, `/os/projects`, `/os/hub`, `/os/links`, `/os/settings` y confirmar: PageHeader visible, toolbar en listas, skeleton al cargar, EmptyState si no hay datos, toasts al guardar, responsive funcional a 390px. Si falla, no avanzar.

---

## Fase UX 5 — Portal de cliente moderno y accesible

87. `[Vertrex-Website/src/app/portal/layout.tsx]` → Aplicar layout claro, alto contraste, fuente grande, max-width cómodo y Toaster con tema light → Portal no hereda densidad del OS interno.
88. `[Vertrex-Website/src/app/portal/login/page.tsx]` → Implementar sección 6.2 de UX Spec: card centrada, logo, inputs grandes, PIN monoespaciado, botón full width, loading y error humano → Login portal se siente confiable.
89. `[Vertrex-Website/src/app/portal/[slug]/loading.tsx]` → Crear skeleton de cards grandes → Dashboard portal carga bien.
90. `[Vertrex-Website/src/app/portal/[slug]/page.tsx]` → Implementar sección 6.3: cards grandes para proyectos, próxima reunión, documentos, pagos y soporte; progress bar grande; botones claros → Portal cliente es simple y moderno.
91. `[Vertrex-Website/src/app/portal/[slug]/files/page.tsx]` → Implementar sección 6.4: dropzone grande, lista archivos como cards, botón volver, success state de subida → Subida de archivos es clara.
92. `[Vertrex-Website/src/app/portal/[slug]/tickets/page.tsx]` → Implementar sección 6.5: formulario grande arriba, historial cards, estados humanos Recibido/En proceso/Resuelto → Tickets son usables por clientes no técnicos.

### Checkpoint Fase UX 5

93. `[Vertrex-Website]` → Ejecutar `npm run typecheck` desde `Vertrex-Website` → TypeScript termina con 0 errores. Luego probar en UI: `/portal/login` a 390px, entrar con slug+PIN, ver dashboard, subir archivo y crear ticket; confirmar textos grandes, botones claros y ningún menú complejo. Si falla, corregir antes de avanzar.

---

## Fase UX 6 — Quality gate visual final

94. `[Vertrex-Website/docs/md/vertrex-os-ux-checklist.md]` → Crear checklist por pantalla con columnas: ruta, PageHeader, Toolbar, Loading, Empty, Error, Toast, Responsive 390px, Dialog/Sheet correcto, aprobado → Se puede auditar visualmente el OS.
95. `[Vertrex-Website/e2e/ux.spec.ts]` → Crear pruebas Playwright visuales básicas: `/login`, `/portal/login`, `/os/admin` redirige sin sesión, y con sesión semilla verificar que rutas principales tienen elemento `data-testid="page-header"` y no contienen tablas sin wrapper `data-testid="data-table"` → Se reduce riesgo de volver a UI básica.
96. `[Vertrex-Website/src/components/ui/*]` → Revisar que todos los componentes tengan focus-visible, disabled states, aria labels cuando aplique y no dependan de colores únicamente → Accesibilidad mínima queda cubierta.
97. `[Vertrex-Website/src/app/os/**]` → Buscar `className="border` y `<table` crudos en rutas OS; reemplazar con `Card`/`DataTable` salvo casos justificados → Se elimina UI básica residual.
98. `[Vertrex-Website]` → Ejecutar `npm run typecheck && npm run build` desde `Vertrex-Website` → Build termina con 0 errores.
99. `[Vertrex-Website]` → Ejecutar validación UI manual: viewport 1440px, 1024px y 390px; recorrer `/os/admin`, `/os/crm`, `/os/projects`, `/os/hub`, `/os/links`, `/portal/login`, `/portal/[slug]`; confirmar que cada pantalla se siente moderna, tiene estados y no parece scaffold → UX queda aprobada.

### Checkpoint Fase UX 6

100. `[Vertrex-Website]` → Ejecutar `npm run typecheck && npm run build` y completar `Vertrex-Website/docs/md/vertrex-os-ux-checklist.md` con todas las rutas principales marcadas como aprobadas → No considerar terminado el OS hasta que este checkpoint pase.
