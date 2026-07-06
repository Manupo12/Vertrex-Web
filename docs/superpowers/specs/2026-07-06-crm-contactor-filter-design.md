# CRM — Filtro "Asignado a" (multi-select de miembros del equipo)

**Fecha:** 2026-07-06
**Estado:** Aprobado por el usuario
**Scope:** Filtro de lista en `/os/crm` para mostrar qué clientes están siendo tratados por cada miembro del equipo (y cuáles no tienen ninguno).

## Contexto

El CRM (`/os/crm`) lista clientes con varios filtros (status, priority, sector, city, country, rating, webPresence, q) guardados en URL searchParams y aplicados server-side en `src/app/os/crm/page.tsx`. La columna **"Contactado por"** ya muestra los miembros del equipo asignados a cada cliente, pero no hay forma de **filtrar la lista** por quién está tratando con qué cliente.

La relación "cliente ↔ miembro del equipo" vive en la tabla M2M `clientContactors` (cliente puede tener varios, o ninguno). No hay un campo de "owner" en `clients`.

## Diseño

### Comportamiento

- **Filtro multi-select** dentro del `FiltersPanel` existente (desktop) y del panel de filtros móvil, con label **"Asignado a"**.
- **Semántica OR**: un cliente aparece si tiene CUALQUIERA de los usuarios seleccionados. Coincide con la columna "Contactado por" que ya muestra varios.
- **Opción especial "Sin asignar"**: clientes sin ninguna fila en `clientContactors`. Es una opción más del multi-select, separada visualmente con un divisor.
- **Combinable** con el resto de filtros (AND). Ej: `?contactor=<manuelId>,none&status=no_contactado` → Manuel O sin asignar, que estén no contactados.
- **URL-shareable**: al cambiar el filtro se actualiza la URL; al refrescar se mantiene.

### URL

- Key: `contactor`
- Valor: lista separada por comas. Sintaxis: `<userId1>,<userId2>,...,<none>`
- Vacío o ausente = sin filtro (comportamiento "Todos").

Ejemplos:
- `?contactor=abc-123` → solo clientes donde el usuario `abc-123` es contactor
- `?contactor=abc-123,def-456` → clientes donde `abc-123` O `def-456` es contactor
- `?contactor=none` → solo clientes sin ningún contactor
- `?contactor=abc-123,none` → clientes de `abc-123` O sin asignar
- (ausente) → todos

### Componente nuevo: `MultiSelect`

- Path: `src/components/ui/multi-select.tsx`
- Construido sobre Radix `Popover` + `Checkbox` (primitivas ya en el proyecto, sin meter librería nueva).
- Trigger: button con `SelectTrigger` look (consistente con el `Select` actual del CRM), que muestra:
  - "Asignado a" si no hay selección
  - Hasta 2 nombres de miembros seleccionados
  - `+N más` si hay más de 2
  - Si está "Sin asignar" seleccionado y nadie más, muestra "Sin asignar"
  - Si están ambos, muestra `Manuel, Juan, +Sin asignar`
- Dropdown: lista scrolleable con `Checkbox` + nombre + email truncado; avatar con iniciales a la izquierda. Al final, divisor + opción "Sin asignar" con icono distinto (p.ej. `UserMinus`).
- Footer del dropdown: botón "Limpiar".
- Mismas clases Tailwind que el `Select` actual del CRM.

### Cambios en `src/app/os/crm/page.tsx`

1. Añadir `contactor` al destructuring de `searchParams` (línea 11-22).
2. Parser `parseContactorParam(raw: string | undefined): { userIds: string[]; includeUnassigned: boolean }`:
   - split por `,`, trim cada token
   - si token === `"none"`, marcar `includeUnassigned = true`
   - resto, filtrar vacíos, son `userIds`
3. **Cambiar el join de contactors a `leftJoin`** (línea 155-159): actualmente es `innerJoin`, lo que excluye clientes sin contactores. Con `leftJoin` los mantenemos visibles y la columna "Contactado por" muestra `[]` para ellos.
4. Construir la condición WHERE de filtro:
   - Si `userIds.length > 0` y/o `includeUnassigned`:
     - Llamamos a `listTeamMembersAction()` para resolver nombres → ids válidos.
     - Si `userIds.length > 0`: `exists(select 1 from clientContactors where clientId = clients.id and userId in (...))`
     - Si `includeUnassigned`: `notExists(select 1 from clientContactors where clientId = clients.id)`
     - Combinar con `or(...)`.
5. Pasar a `CrmList` la prop `contactorOptions: { id, name, email }[]` (los miembros activos con al menos un cliente asignado + "Sin asignar" como entry virtual `{ id: "none", name: "Sin asignar", email: "" }` si hay al menos un cliente huérfano en la BD, de lo contrario se omite).
6. Aplicar el filtro tanto al `select()` paginado (línea 115) como al `count()` total (línea 138).

### Cambios en `src/app/os/crm/CrmList.tsx`

1. Nueva prop `contactorOptions: Array<{ id: string; name: string; email: string }>`.
2. Nueva lectura de `searchParams.get("contactor")` (línea 104-110).
3. `setFilter("contactor", newValue)` que llama a `buildUrl` con `contactor: serialized` (string con comas + `,none` si aplica).
4. Insertar `<MultiSelect>` en el `FiltersPanel` desktop (línea 345-419) y en el panel móvil (línea 561-658), label "Asignado a", entre los filtros existentes.
5. Reset: cuando el usuario hace clear en el `MultiSelect` o navega sin `contactor` en URL, se quita de la URL (igual que el resto).

## Archivos a tocar

| Archivo | Tipo de cambio |
|---|---|
| `src/components/ui/multi-select.tsx` | **Crear** (~120 líneas) |
| `src/app/os/crm/page.tsx` | Modificar: parser, join, where, props |
| `src/app/os/crm/CrmList.tsx` | Modificar: prop, lectura URL, integración UI desktop y móvil |

## Edge cases

- **`?contactor=` (vacío)**: tratado como ausente, sin filtro.
- **Usuario en URL que ya no está activo**: el `IN (...)` lo ignora silenciosamente; el dropdown tampoco lo lista porque `listTeamMembersAction` filtra `isActive = true`.
- **0 clientes con "Sin asignar"**: la opción "Sin asignar" se omite del dropdown (no aparece si `unassignedAvailable = false`).
- **Combinado con `?page=2`**: al cambiar el filtro siempre se hace strip de `page` (igual que el resto, `CrmList.tsx:122`).
- **Paginación**: el `count()` total se recalcula con el WHERE nuevo, así que `totalPages` refleja el filtro.

## Testing

1. **Unit / script de verificación**: insertar 3 clientes de prueba (1 con Manuel, 1 con Juan, 1 sin nadie) y ejecutar el query del page con cada combinación de filtro, asserting el `count()` esperado. Borrar al terminar.
2. **Manual en navegador**:
   - Sin filtro: 3 clientes visibles.
   - Solo Manuel: 1 cliente.
   - Manuel + Juan: 2 clientes.
   - Solo "Sin asignar": 1 cliente.
   - Combinado con `?status=no_contactado`: coherente.

## No-objetivos (YAGNI)

- No se agrega UI de "ver cuántos clientes tiene cada miembro" (stat) — se puede agregar después si hace falta.
- No se cambia la columna "Contactado por" — sigue mostrando los chips actuales, no se vuelve clickeable.
- No se agrega permiso / RBAC al filtro — la lectura de contactors ya está abierta para cualquier usuario logueado con acceso al CRM.
- No se modifica el modelo de datos (no se agrega `ownerId` a `clients`).
