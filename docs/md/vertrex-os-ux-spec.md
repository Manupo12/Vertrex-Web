# Vertrex OS — Especificación UI/UX Moderna por Pantalla

Este documento complementa el PRD y el plan de implementación. Su objetivo es evitar que el modelo ejecutor construya una interfaz básica. La implementación final debe sentirse como una herramienta moderna tipo Linear, Notion, Vercel, Raycast y GitHub Projects: densa pero limpia, rápida, con buen feedback, estados completos y navegación contextual.

## Regla principal de calidad

No se acepta una pantalla que solo sea un `h1`, una tabla HTML básica y botones sin feedback. Cada pantalla del OS debe incluir, como mínimo:

- Header de página consistente.
- Breadcrumbs o contexto de ubicación.
- Acción primaria visible.
- Toolbar de búsqueda/filtros cuando la pantalla liste datos.
- Estado de carga con skeleton que imita el contenido real.
- Estado vacío con mensaje útil y CTA.
- Estado de error con mensaje claro y botón de reintento.
- Feedback de éxito mediante toast o banner.
- Estados pending/disabled en acciones async.
- Diseño responsive definido.
- Microinteracciones visibles: hover, focus ring, transiciones y tooltips.

## Fuentes de verdad

1. `Vertrex-Website/docs/md/vertrex-os-prd(1).md` define qué debe hacer el producto.
2. `Vertrex-Website/docs/md/vertrex-os-prd-implementation-plan.md` define cómo construirlo técnicamente.
3. `Vertrex-Website/docs/md/vertrex-os-ux-spec.md` define cómo debe verse y sentirse.
4. `Vertrex-Website/docs/md/vertrex-os-ux-implementation-plan.md` define los pasos atómicos para implementar esta capa visual.

Si hay conflicto entre documentos, usar esta prioridad: PRD para negocio/datos, UX Spec para interfaz, Implementation Plan para orden técnico.

---

## 1. Principios visuales globales

### 1.1 Personalidad del producto

- El OS debe sentirse premium, interno, rápido y profesional.
- Base visual: dark mode elegante para el OS interno.
- Portal de cliente: claro, alto contraste, letras grandes, sin densidad excesiva.
- Evitar aspecto de demo escolar: nada de tablas HTML crudas, bordes grises simples sin jerarquía, botones default del navegador o layouts centrados sin intención.

### 1.2 Layout global del OS

- Sidebar fijo izquierdo de 280px en desktop.
- Topbar fija superior dentro del área principal, altura 64px.
- Área de contenido con ancho fluido y padding de 24px desktop, 16px tablet, 12px móvil.
- Fondo general: negro/charcoal con gradientes sutiles y ruido mínimo opcional mediante CSS.
- Cards y paneles: fondo ligeramente más claro que el fondo, borde sutil, sombra suave, radio 16px.
- El contenido principal nunca debe tocar los bordes de la pantalla.

### 1.3 Jerarquía tipográfica

- Page title: 28-32px, peso 700, tracking ajustado.
- Section title: 18-20px, peso 650.
- Card title: 15-16px, peso 600.
- Body: 14px desktop, 15-16px en portal cliente.
- Labels: 12px uppercase o 13px semibold según contexto.
- Metadata secundaria: 12-13px, color muted.

### 1.4 Espaciado

- Separación entre header de página y contenido: 24px.
- Separación entre secciones: 24px o 32px.
- Padding de card: 20px desktop, 16px móvil.
- Gap de grids: 16px desktop, 12px móvil.
- Toolbar: 12px entre controles.

### 1.5 Responsive

- Desktop: sidebar visible, tablas completas, paneles 2-3 columnas.
- Tablet: sidebar colapsable, tablas con columnas secundarias ocultas, cards en 2 columnas.
- Móvil: navegación por drawer, tablas se transforman en cards o tienen scroll horizontal con sombra lateral, botones primarios full-width cuando estén dentro de formularios.

---

## 2. Componentes base obligatorios

Crear componentes reutilizables en `Vertrex-Website/src/components/ui/**`. Todas las pantallas del OS deben usarlos; no construir UI ad hoc salvo necesidad real.

### 2.1 Componentes primitivos

- `Button`: variants `primary`, `secondary`, `ghost`, `danger`, `outline`; sizes `sm`, `md`, `lg`, `icon`.
- `Input`: icono opcional a la izquierda, error debajo, focus ring verde Vertrex.
- `Textarea`: misma semántica que Input.
- `Label`: consistente para formularios.
- `Card`: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- `Badge`: variants `success`, `warning`, `danger`, `neutral`, `info`, `purple`.
- `StatusBadge`: mapea estados de negocio a colores.
- `Skeleton`: shapes `line`, `card`, `table-row`, `avatar`, `stat`.
- `EmptyState`: icono/ilustración, título, descripción y CTA.
- `ErrorState`: mensaje claro y botón `Reintentar`.

### 2.2 Componentes compuestos

- `PageHeader`: breadcrumbs, título, descripción, acción primaria y acciones secundarias.
- `Toolbar`: búsqueda con debounce 300ms, filtros, view switcher y contador de resultados.
- `DataTable`: basado en `@tanstack/react-table`; sticky header, filas hover, selección opcional, paginación numérica, columnas responsive, menú de acciones por fila.
- `KanbanBoard`: columnas con header, contador, cards y estados vacíos por columna.
- `StatCard`: métrica, label, delta opcional, icono y mini descripción.
- `CommandMenu`: paleta global con `Cmd/Ctrl+K` para buscar rutas y acciones.
- `QuickActionButton`: botón flotante opcional solo cuando mejore la experiencia, no como sustituto del header.
- `Breadcrumbs`: máximo 4 niveles, colapsar intermedios si hay muchos.
- `Tabs`: para detalles con subsecciones.
- `Dialog`: creación/edición de entidades simples.
- `Sheet`: detalle rápido o panel complementario sin perder contexto.
- `AlertDialog`: confirmación destructiva.
- `Toast`: éxito, error, loading y undo cuando aplique.
- `Tooltip`: para icon buttons y atajos.
- `KeyboardShortcut`: estilo visual para `⌘K`, `Ctrl+I`, etc.

### 2.3 Reglas de interacción

- Crear entidad simple: usar `Dialog`.
- Editar campos complejos o ver preview contextual: usar `Sheet` lateral derecho.
- Confirmar acciones destructivas: usar `AlertDialog`.
- Cambios instantáneos: mostrar toast de éxito o error.
- Acciones largas: botón con spinner y texto pending, ej. `Guardando...`.
- Filas de tabla: hover visible; click abre detalle; menú de tres puntos para acciones secundarias.
- Cards: hover con elevación sutil y borde primario al focus.
- Tabs: transición fade/slide de 150-200ms.
- Modales/sheets: overlay oscuro, animación de entrada/salida, cierre con Esc.

---

## 3. Estados obligatorios por pantalla

### 3.1 Loading

- Listas: skeleton de toolbar + 5 filas o 6 cards según la vista.
- Detalles: skeleton de header + tabs + panel principal + sidebar.
- Dashboard: skeleton de 4 stat cards + 2 paneles grandes.
- Kanban: skeleton de 4 columnas con 3 cards por columna.

### 3.2 Empty

Cada pantalla vacía debe tener:

- Icono grande de `lucide-react` dentro de círculo o ilustración simple SVG/CSS.
- Título útil, no genérico.
- Descripción con siguiente paso.
- CTA primario.

Ejemplos:

- CRM: `Aún no tienes clientes` + `Crea el primer cliente para activar su portal.` + `Nuevo cliente`.
- Proyectos: `No hay proyectos activos` + `Convierte una idea o crea un proyecto manual.` + `Crear proyecto`.
- Hub: `Tu incubadora está vacía` + `Presiona Ctrl+I para capturar tu primera idea.` + `Capturar idea`.

### 3.3 Error

- Mostrar `ErrorState` con mensaje de negocio, no stack trace.
- Botón `Reintentar` debe recargar la ruta o repetir la acción.
- Si es error de permisos, mostrar CTA `Volver al dashboard`.

### 3.4 Success

- Crear/guardar/conectar: toast `Guardado correctamente` o específico.
- Subida de archivo: toast con nombre del archivo y destino `Neon` o `Drive`.
- Copiar PIN: toast `PIN copiado`.
- Convertir idea: toast o banner `Idea convertida en proyecto` antes de redirección si es posible.

---

## 4. Navegación global del OS

### 4.1 Sidebar

- Logo/wordmark `Vertrex OS` arriba.
- Agrupar rutas:
  - Operación: Admin, CRM, Proyectos, Documentos, Legal.
  - Inteligencia: Hub, Links, Recursos.
  - Gestión: Finanzas, Agenda, Marketing.
  - Sistema: Equipo, Generator, Settings.
- Cada item con icono `lucide-react`, label, estado activo y tooltip cuando sidebar esté colapsada.
- Botón inferior para `Command Menu` con atajo `Ctrl+K` y botón `Salir`.

### 4.2 Topbar

- Breadcrumbs a la izquierda.
- Global search/command trigger al centro o derecha.
- Avatar iniciales del usuario y rol.
- Indicador pequeño de estado DB/API.

### 4.3 Command Menu

- Atajo `Ctrl+K` / `Cmd+K`.
- Acciones mínimas:
  - Ir a Dashboard.
  - Nuevo cliente.
  - Nuevo proyecto.
  - Capturar idea.
  - Subir documento.
  - Guardar link.
  - Crear evento.
- Buscar rutas por texto.
- Mostrar atajos secundarios, como `Ctrl+I` para idea rápida.

---

## 5. Especificación por pantalla OS

### 5.1 `/os/admin` — Dashboard

Layout:
- `PageHeader` con título `Dashboard`, descripción `Estado general de Vertrex OS`, acciones secundarias `Vercel Analytics` y `Neon Studio`.
- Grid superior de 4 `StatCard`: clientes activos, proyectos activos, tickets abiertos, estado DB.
- Segunda fila: panel ancho `Actividad reciente` y panel `Salud del sistema`.
- Tercera fila: `Accesos rápidos` como cards pequeñas.

Estados:
- Loading: 4 stat skeletons + 2 paneles skeleton.
- Error: `ErrorState` con botón `Reintentar`.
- Empty no aplica al dashboard; mostrar ceros y CTA de crear cliente/proyecto.

Interacciones:
- Click en stat de clientes navega a `/os/crm`.
- Click en stat de proyectos navega a `/os/projects`.
- Accesos rápidos abren dialogs o rutas.

Responsive:
- Desktop: 4 columnas stats.
- Tablet: 2 columnas.
- Móvil: 1 columna.

### 5.2 `/os/crm` — Lista de clientes

Layout:
- `PageHeader`: título `Clientes`, descripción `Gestiona clientes y accesos al portal`, acción primaria `Nuevo cliente` con icono Plus.
- Toolbar debajo: búsqueda con icono Search y debounce 300ms, filtro status, view switcher `Tabla/Tarjetas`, contador de resultados.
- Desktop default: `DataTable`.
- Móvil: cards de cliente.

DataTable columnas:
- Nombre con avatar de iniciales y link.
- Slug monoespaciado muted.
- Email.
- Teléfono.
- Estado con `StatusBadge`: activo verde, inactivo gris, pausado amarillo.
- Creado.
- Acciones: Ver, Generar PIN, Copiar portal.

Interacciones:
- Click fila navega a `/os/crm/[slug]`.
- `Nuevo cliente` abre `Dialog` con campos Nombre, Email, Teléfono, Slug autogenerado editable.
- Guardar muestra toast y redirige al detalle con PIN visible una sola vez.
- Filtro status actualiza `?status=`.
- Búsqueda actualiza `?q=`.

Estados:
- Loading: toolbar skeleton + 5 filas skeleton.
- Empty: `Aún no tienes clientes` + CTA `Crear primer cliente`.
- Error: alerta roja con `Reintentar`.

### 5.3 `/os/crm/[slug]` — Detalle cliente

Layout:
- `PageHeader` con breadcrumbs `CRM > Cliente`, título cliente, badge status, acciones `Generar PIN`, `Editar`, `Abrir portal`.
- Layout 2 columnas: contenido principal 70%, sidebar 30%.
- Tabs principales: `Resumen`, `Proyectos`, `Documentos`, `Finanzas`, `Tickets`, `Conexiones`.
- Sidebar: `EntitySidebar` + card `Acceso portal`.

Interacciones:
- `Generar PIN` abre `AlertDialog` explicando que el PIN se verá una sola vez.
- Al confirmar, mostrar PIN en banner destacado con botón copiar y texto de WhatsApp.
- Editar abre `Dialog`.
- Conectar entidad abre `Sheet` con buscador de entidades.

Estados:
- Loading: header skeleton + tabs skeleton + sidebar skeleton.
- Error: cliente no encontrado con CTA volver a CRM.

### 5.4 `/os/projects` — Lista/kanban proyectos

Layout:
- `PageHeader`: `Proyectos`, acción `Nuevo proyecto`.
- Toolbar: búsqueda, filtro status, switch `Tabla/Kanban`.
- Vista por defecto: Kanban con columnas Activo, Pausado, Completado, Cancelado.
- Tabla alternativa con DataTable.

Project card:
- Nombre, status badge, progress bar, versión, cliente conectado si existe, badge rojo si falta anticipo 50%.
- Footer con documentos/conexiones contadores.

Interacciones:
- Drag & drop entre columnas si se implementa de forma simple; si no, menú de status en card.
- Click card navega al detalle.
- Nuevo proyecto abre Dialog.

Estados:
- Loading: kanban skeleton.
- Empty: `No hay proyectos` + CTA `Crear proyecto`.

### 5.5 `/os/projects/[id]` — Detalle proyecto

Layout:
- `PageHeader` con breadcrumbs, título, badge status, progress inline, acciones `Editar`, `Conectar`, `Añadir link`.
- Tabs: `Overview`, `Documentos`, `Finanzas`, `Agenda`, `Recursos`, `Grafo`.
- Overview: card de progreso, versión editable inline, reference links como chips/cards.
- Sidebar derecho: EntitySidebar y alerta de anticipo si aplica.

Interacciones:
- Editar versión inline con botón guardar pequeño.
- Añadir link abre Dialog.
- Conectar abre Sheet buscador.
- Tab Grafo muestra ReactFlow en panel grande.

### 5.6 `/os/documents` y `/os/documents/[id]`

Lista:
- Header con acción `Subir documento`.
- Toolbar: búsqueda, filtro storage provider, filtro mime type.
- Grid/table híbrido: icono por tipo, nombre, tamaño, destino Neon/Drive, fecha, acciones.
- Upload abre Dialog con SmartUploader y explica regla 1.5 MB.

Detalle:
- Header con botón descargar.
- Preview principal: PDF/image si aplica; si no, card con icono grande y metadata.
- Sidebar: EntitySidebar.

Estados:
- Empty: `Aún no has subido documentos` + CTA.
- Upload pending: barra de progreso visual aunque sea indeterminada.

### 5.7 `/os/legal` y `/os/legal/[id]`

Lista:
- Similar a documentos, pero con filtro por tipo legal y toggle visual `Visible portal`.
- Cards destacando contratos/cuentas de cobro.

Detalle:
- Tabs: `Resumen`, `Conexiones`, `Portal`.
- Toggle `Exponer en portal` con confirmación suave.
- `signed_at` editable con Date input.

### 5.8 `/os/hub` — Knowledge Hub

Layout:
- Header con título `Knowledge Hub`, acciones `Nueva nota`, `Capturar idea`.
- Subnav/tabs: `Notas`, `Incubadora`, `Todo`.
- Incubadora por defecto si no hay query.

Notas:
- Lista de cards compactas con título, preview y fecha.
- Búsqueda arriba.

Incubadora:
- Kanban visual de 4 columnas con emojis y colores:
  - Semillas verde.
  - Laboratorio violeta.
  - Para ejecutar naranja.
  - Congelador azul hielo.
- Cards tipo post-it moderno, con preview de 2 líneas, next_step y chips de conexiones.

Interacciones:
- `Ctrl+I` abre QuickIdeaModal desde cualquier ruta OS.
- Drag/drop o menú de status cambia idea_status.
- Click card abre detalle.
- Captura rápida tiene solo textarea y botón guardar.

Estados:
- Empty incubadora: CTA grande `Presiona Ctrl+I para capturar una idea`.
- Loading: 4 columnas skeleton.

### 5.9 `/os/hub/[id]` — Editor profundo

Layout:
- Editor distraction-free, max-width 920px.
- Header sticky con título editable, status badge, botón Guardar.
- Si es idea: panel superior fijo con preguntas no editables y campo `next_step`.
- Sidebar derecho colapsable con EntitySidebar y repos relacionados.

Interacciones:
- Guardar manual con toast.
- `@repo` abre combobox inline o Sheet de búsqueda si inline es complejo.
- Convertir en Proyecto aparece solo en status `ejecutar`.

### 5.10 `/os/resources` y `/os/resources/[id]`

Lista:
- Header `Recursos`, acción `Nuevo recurso`.
- Toolbar: búsqueda y filtro tipo.
- DataTable con título, tipo, fecha, acciones; nunca mostrar valor.

Interacciones:
- Nuevo recurso abre Dialog con tipo y valor secreto.
- Revelar valor abre Sheet con confirmación y botón copiar; auto-ocultar al cerrar.
- Copiar muestra toast.

### 5.11 `/os/finances` y `/os/finances/[id]`

Lista:
- Header `Finanzas`, acción `Nuevo movimiento`.
- Stat cards: ingresos mes, gastos mes, neto, pendientes.
- Toolbar: tipo, status, rango fecha.
- DataTable con formato COP, badges y warnings de anticipo.

Detalle:
- Card principal de monto grande.
- Timeline de estados simple.
- EntitySidebar.

### 5.12 `/os/agenda`

Layout:
- Header `Agenda`, acción `Nuevo evento`.
- Toggle mensual/semanal/lista.
- Default simple: calendario semanal + columna de próximos eventos.
- Cards con fecha, hora, título, meet link.

Interacciones:
- Click evento abre Sheet.
- Nuevo evento abre Dialog.
- Link Meet abre nueva pestaña.

### 5.13 `/os/links` y `/os/links/[id]`

Lista:
- Header `Links & Repositorios`, acción `Guardar link`.
- Toolbar: búsqueda full-text, filtros language/status/topics/priority.
- Dos secciones claramente separadas:
  - Repositorios GitHub con cards premium.
  - Links generales como galería.

GithubCard:
- Repo name grande, owner pequeño, descripción, badge language con dot color, stars/forks, pushed_at, saved_reason destacado en bloque con pin, status semáforo, prioridad 1-5 estrellas.

Interacciones:
- Guardar link abre Dialog. Si detecta GitHub, mostrar segundo paso obligatorio `¿Qué problema específico te resuelve este repo?`.
- Click card abre detalle.

Detalle:
- Header repo/link.
- Tabs: `Resumen`, `README`, `Conexiones`.
- README con `react-markdown`, saved_reason sticky arriba.

### 5.14 `/os/marketing` y `/os/marketing/[id]`

Lista:
- Header `Marketing`, acción `Nueva cuenta`.
- Cards por red social con icono, handle, notas, próximos contenidos.
- Mini kanban de contenido por status si hay datos.

Detalle:
- Header con plataforma/handle.
- Tabs: `Cuenta`, `Contenido`, `Credenciales`.
- Revelar password igual que recursos.

### 5.15 `/os/team` y `/os/team/[userId]`

Lista:
- Solo admin.
- Header `Equipo`, acción `Nuevo miembro`.
- DataTable con avatar, nombre, email, rol badge, activo, creado, acciones.

Interacciones:
- Cambiar rol con Select inline y confirmación.
- Desactivar con AlertDialog.
- Nuevo miembro abre Dialog y muestra credenciales una sola vez.

### 5.16 `/os/generator`

Layout:
- Split view 50/50 desktop.
- Izquierda: textarea/editor de HTML y upload `.html`.
- Derecha: preview iframe en card con toolbar.
- Debajo/aside: variables detectadas como form dinámico.

Interacciones:
- Preview se actualiza en tiempo real.
- Descargar botón primary.
- Empty variables: mensaje `No se detectaron variables {{VARIABLE}}`.

### 5.17 `/os/settings`

Layout:
- Header `Configuración`.
- Tabs: `Cuenta`, `Variables internas`, `MCP`, `Sistema`.
- Cards con formularios segmentados.

Interacciones:
- Cambiar contraseña con Dialog/section form.
- Guardar variable encriptada con toast.
- Copiar endpoint MCP con tooltip/toast.

---

## 6. Portal de clientes UX

### 6.1 Principio portal

El portal no debe parecer el OS interno. Debe ser claro, grande y de baja fricción.

- Fondo claro.
- Texto 16-18px.
- Botones grandes.
- Máximo 2 niveles de navegación.
- Cards con alto contraste.
- Estados humanos, sin jerga técnica.

### 6.2 `/portal/login`

Layout:
- Card centrada max-width 440px.
- Logo Vertrex, título `Portal de Cliente`.
- Inputs grandes para slug y PIN.
- PIN con 6 casillas o input grande monoespaciado.
- Botón full width `Entrar a mi portal`.

Estados:
- Error: mensaje claro `El PIN no coincide. Revisa el código enviado por WhatsApp.`.
- Loading: botón `Entrando...` disabled.

### 6.3 `/portal/[slug]`

Layout:
- Header simple con nombre cliente y botón salir.
- Cards grandes:
  - Mis proyectos.
  - Próxima reunión.
  - Documentos disponibles.
  - Pagos.
  - Soporte.
- Progress bar muy visible en proyectos.

Interacciones:
- Botones claros: `Ver archivos`, `Enviar ticket`, `Subir archivo`.
- No usar menús escondidos para acciones importantes.

### 6.4 `/portal/[slug]/files`

Layout:
- Header `Archivos` con botón volver.
- Dropzone grande para subir archivo.
- Lista de archivos como cards, no tabla.
- Mostrar destino `Subido correctamente` pero no decir detalles técnicos de Drive si no es necesario.

### 6.5 `/portal/[slug]/tickets`

Layout:
- Formulario grande arriba.
- Historial abajo como cards.
- Badges de estado con textos humanos: `Recibido`, `En proceso`, `Resuelto`.

---

## 7. Reglas para evitar resultado básico

- Prohibido usar `table` HTML cruda en rutas OS; usar `DataTable` o cards responsive.
- Prohibido crear pantallas sin `PageHeader`.
- Prohibido crear formularios sin loading/pending state.
- Prohibido acciones destructivas sin `AlertDialog`.
- Prohibido guardar sin toast o feedback visible.
- Prohibido listas vacías sin `EmptyState`.
- Prohibido navegación interna de detalle sin tabs cuando haya más de 2 secciones.
- Prohibido icon buttons sin tooltip.
- Prohibido romper móvil: toda pantalla debe funcionar a 390px de ancho.

## 8. Quality gate visual obligatorio

Antes de cerrar cualquier módulo, verificar:

1. ¿Tiene header, breadcrumbs y acción primaria?
2. ¿Tiene loading, empty, error y success states?
3. ¿Tiene toolbar si lista datos?
4. ¿Las acciones async muestran pending y toast?
5. ¿La vista móvil no se rompe a 390px?
6. ¿Hay microinteracciones hover/focus/transición?
7. ¿Los colores y badges comunican estado?
8. ¿Hay no más de una acción primaria por pantalla?
9. ¿El detalle usa tabs o layout con sidebar cuando hay mucha información?
10. ¿Se siente como producto real y no como scaffold?
