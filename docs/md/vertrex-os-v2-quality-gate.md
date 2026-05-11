# Vertrex OS — Quality Gate V2

Este documento define cuándo una corrección V2 puede considerarse terminada. Si un módulo falla cualquier check obligatorio, no se da por aprobado aunque compile.

## Regla principal

**Compilar no equivale a estar terminado.**  
Un módulo V2 solo se aprueba si pasa simultáneamente:

1. validación funcional,
2. validación visual,
3. validación de rutas,
4. validación de seguridad si aplica,
5. y validación e2e/manual del flujo principal.

---

## 1. Gate global por categoría

| Categoría | Check obligatorio | Estado |
|---|---|---|
| Build | `npm run typecheck` pasa con 0 errores | Sí |
| Build | `npm run build` pasa con 0 errores | Sí |
| Routing | Ninguna ruta principal del PRD navega a 404 | Sí |
| Seguridad | `/api/upload` exige auth válida | Sí |
| Seguridad | `/api/documents/[id]` valida acceso | Sí |
| Portal | `/api/tickets` existe y funciona | Sí |
| Grafo | `EntitySidebar` muestra labels reales | Sí |
| Grafo | `EntityConnectSheet` permite conectar entidades reales | Sí |
| Hub | El editor ya no es un `textarea` JSON | Sí |
| Links | `/os/links/[id]` existe y muestra detalle | Sí |
| Marketing | `/os/marketing/[id]` existe y muestra detalle | Sí |
| Settings | Cambio de contraseña es real, no simulado | Sí |
| UX | Botones visibles de comandos/búsqueda funcionan por clic | Sí |
| UX | Login y portal login muestran errores reales | Sí |

---

## 2. Checklist por ruta corregida

| Ruta | Funciona sin 404 | PageHeader | EmptyState | ErrorState | Acción primaria real | Seguridad/ownership correcto | Responsive 390px | Aprobado |
|---|---|---|---|---|---|---|---|---|
| `/login` | Sí | Sí | N/A | Sí | Sí | N/A | Sí | Sí |
| `/os/admin` | Sí | Sí | N/A | Sí | Sí | N/A | Sí | Sí |
| `/os/crm` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/crm/[slug]` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/projects` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/projects/[id]` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/documents` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/documents/[id]` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/legal` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/legal/[id]` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/hub` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/hub/[id]` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/resources` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/resources/[id]` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/finances` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/finances/[id]` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/agenda` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/links` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/links/[id]` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/marketing` | Sí | Sí | Sí | Sí | Sí | N/A | Sí | Sí |
| `/os/marketing/[id]` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/team` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/team/[userId]` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/os/settings` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/portal/login` | Sí | Sí | N/A | Sí | Sí | N/A | Sí | Sí |
| `/portal/[slug]` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/portal/[slug]/files` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `/portal/[slug]/tickets` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |

---

## 3. Comandos obligatorios por checkpoint

### Build

Ejecutar desde `Vertrex-Website`:

- `npm run typecheck`
- `npm run build`

Ambos deben terminar con código 0.

### Pruebas mínimas de rutas

Verificar manualmente o por e2e:

- `/os/links/[id]` ya no da 404.
- `/os/marketing/[id]` ya no da 404.
- `/portal/[slug]/tickets` puede crear tickets reales.
- `/portal/[slug]` puede cerrar sesión realmente.

### Pruebas mínimas de seguridad

- Intentar `POST /api/upload` sin sesión → debe fallar.
- Intentar `GET /api/documents/[id]` sin contexto válido → debe fallar.
- Intentar descargar documento como cliente no relacionado → debe fallar.

---

## 4. Pruebas funcionales obligatorias

### Grafo

1. Entrar a `/os/crm/[slug]`.
2. Abrir `Conectar`.
3. Buscar un proyecto por nombre, no por UUID.
4. Conectar.
5. Ver el proyecto reflejado en `EntitySidebar` con label real.

### Hub

1. Entrar a `/os/hub/new`.
2. Crear idea.
3. Abrir detalle.
4. Editar contenido en editor rico real, no en textarea JSON.
5. Guardar.
6. Conectar repo o proyecto desde la UI.
7. Convertir en proyecto.

### Links

1. Guardar un repo GitHub con `saved_reason` obligatorio.
2. Abrir `/os/links/[id]`.
3. Cargar README.
4. Confirmar que se renderiza y no hay 404.

### Portal

1. Entrar a `/portal/login` con credenciales válidas.
2. Fallar una vez con PIN inválido y confirmar mensaje visible.
3. Entrar correctamente.
4. Crear ticket desde `/portal/[slug]/tickets`.
5. Subir archivo desde `/portal/[slug]/files`.
6. Cerrar sesión y confirmar que no se puede volver al dashboard sin relogin.

---

## 5. Criterios de rechazo inmediato

Marcar el módulo como **rechazado** si pasa cualquiera de estos:

- Existe un botón visible que no hace nada.
- Existe una ruta enlazada desde UI que termina en 404.
- Existe una action o vista que se declara “simulada”.
- Existe una API sensible accesible sin auth correcta.
- El editor del Hub sigue siendo un textarea JSON.
- `EntitySidebar` sigue mostrando solo UUIDs truncados.
- Login o portal login redirigen con error pero no muestran mensaje visible.
- El portal sigue cerrando sesión solo por navegación y no por invalidación real.

---

## 6. Definición de terminado para V2.0

La V2.0 solo se considera terminada cuando:

- todos los `P0` están cerrados,
- todos los `P1` funcionales críticos están cerrados,
- `npm run typecheck && npm run build` pasa,
- las rutas principales del PRD dejan de romper,
- el portal puede crear tickets y cerrar sesión realmente,
- y las pantallas corregidas ya no se sienten como scaffolds parciales.
