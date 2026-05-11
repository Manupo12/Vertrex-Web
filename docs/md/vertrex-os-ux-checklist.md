# Vertrex OS — Checklist de Aprobación UX/UI

Este checklist debe completarse antes de considerar terminado cualquier módulo del OS. Si una ruta no cumple todos los puntos obligatorios, el modelo ejecutor debe volver a esa ruta y corregirla.

## Reglas de aprobación

- `Sí` significa implementado y verificado manualmente.
- `No` significa pendiente; no aprobar el módulo.
- `N/A` solo se permite si la pantalla no lista datos o no tiene acciones async.
- Ninguna ruta principal puede aprobarse si tiene `No` en PageHeader, Loading, Empty, Error, Toast/Feedback o Responsive 390px.

## Checklist global por ruta

| Ruta | PageHeader | Breadcrumbs | Toolbar | Loading skeleton | EmptyState | ErrorState | Toast/feedback | Dialog/Sheet correcto | Responsive 390px | Sin UI básica | Aprobado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/login` | Sí | Sí | N/A | Sí | N/A | Sí | Sí | N/A | Sí | Sí | Sí |
| `/os/admin` | Sí | Sí | N/A | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/crm` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/crm/[slug]` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects/[id]` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/documents` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/documents/[id]` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/legal` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/legal/[id]` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/hub` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/hub/[id]` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/resources` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/resources/[id]` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/finances` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/finances/[id]` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/agenda` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/links` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/links/[id]` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/marketing` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/marketing/[id]` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/team` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/team/[userId]` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/generator` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/settings` | Sí | Sí | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/portal/login` | Sí | N/A | N/A | Sí | N/A | Sí | Sí | N/A | Sí | Sí | Sí |
| `/portal/[slug]` | Sí | N/A | N/A | Sí | Sí | Sí | Sí | N/A | Sí | Sí | Sí |
| `/portal/[slug]/files` | Sí | N/A | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/portal/[slug]/tickets` | Sí | N/A | N/A | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |

## Criterios de “Sin UI básica”

Marcar `Sí` solo si se cumplen todos:

- No hay tablas HTML crudas sin `DataTable`.
- No hay botones default del navegador.
- No hay formularios sin estado pending.
- No hay listas vacías sin `EmptyState`.
- No hay icon buttons sin tooltip o aria-label.
- No hay acciones destructivas sin confirmación.
- No hay pantalla con solo `h1 + tabla + botón`.
- La ruta se ve bien en desktop y a 390px.

## Pruebas manuales obligatorias

1. Abrir viewport 1440px y revisar cada ruta principal.
2. Abrir viewport 1024px y revisar sidebar/topbar.
3. Abrir viewport 390px y verificar que no haya overflow horizontal roto.
4. Crear una entidad en CRM y confirmar toast.
5. Abrir un Dialog y cerrarlo con `Esc`.
6. Abrir un Sheet y confirmar que no pierde contexto.
7. Ejecutar una acción destructiva y confirmar que aparece AlertDialog.
8. Probar `Ctrl+K` para command menu.
9. Probar `Ctrl+I` para captura rápida de idea.
10. Simular datos vacíos en al menos CRM, Proyectos, Hub y Documentos.
