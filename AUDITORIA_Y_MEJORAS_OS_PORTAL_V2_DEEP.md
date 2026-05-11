# Vertrex OS & Portal V2 — Auditoría Profunda, Comparativa Real y Ruta Correctiva

**Fecha:** Mayo 2026  
**Estado auditado:** Implementación real existente en `Vertrex-Website/src/**`  
**Fuentes comparadas:**
- `Vertrex-Website/docs/md/vertrex-os-prd(1).md`
- `Vertrex-Website/docs/md/vertrex-os-prd-implementation-plan.md`
- `Vertrex-Website/docs/md/vertrex-os-ux-spec.md`
- `Vertrex-Website/docs/md/vertrex-os-ux-implementation-plan.md`
- `Vertrex-Website/docs/md/vertrex-os-ux-checklist.md`
- `Vertrex-Website/AUDITORIA_Y_MEJORAS_OS_PORTAL.md`

Este documento **mejora y reemplaza conceptualmente** la auditoría anterior. La diferencia principal es que esta versión no parte de aspiraciones V2 primero, sino de una comparación directa entre lo prometido por los MD y lo que realmente existe en el código.

---

## 1. Veredicto ejecutivo

La implementación actual **compila** y tiene una base funcional real: autenticación, rutas OS, portal cliente, schema ampliado, varias server actions, subida de archivos, MCP y varios módulos ya visibles.

Pero la implementación también presenta un patrón claro:

- muchas funcionalidades están **a medio cerrar**,
- varias rutas del PRD existen solo parcialmente,
- algunas interacciones críticas están **rotas o inconclusas**,
- y parte de la UX moderna prometida fue reemplazada por soluciones mucho más básicas.

### Conclusión principal

**Antes de construir una “V2 inteligente, tiempo real y con IA”, hay que cerrar primero una “V1 prometida pero incompleta”.**

La prioridad correcta no es saltar directo a RAG, SSE, workers y automatizaciones. La prioridad correcta es:

1. cerrar rutas faltantes,
2. arreglar APIs rotas o inseguras,
3. completar los detalles de módulos ya iniciados,
4. reemplazar componentes placeholders o demasiado básicos,
5. y hacer que lo ya prometido por PRD/plan/UX spec funcione de verdad.

---

## 2. Metodología de auditoría

La auditoría se hizo comparando cuatro capas:

1. **PRD:** qué debe hacer el producto.
2. **Plan funcional:** qué archivos, acciones, rutas y entidades debían existir.
3. **UX spec + checklist:** cómo debía verse y sentirse.
4. **Código real:** `src/app/**`, `src/components/**`, `src/lib/**`, `src/app/api/**`, `e2e/**`.

Criterio usado:

- **Implementado:** existe y funciona de extremo a extremo.
- **Parcial:** existe, pero incompleto, superficial o no cumple el flujo prometido.
- **Ausente:** el PRD/plan lo exige, pero no existe.
- **Roto:** existe una UI que apunta a una ruta o API inexistente, o el flujo falla al usarse.
- **Riesgoso:** funciona técnicamente, pero con huecos serios de seguridad o integridad.

---

## 3. Lo que sí está bien construido hoy

Estas bases sí existen y son valiosas:

- `Vertrex-Website/src/lib/db/schema.ts` ya contiene la mayoría de entidades v1 prometidas.
- `Vertrex-Website/src/lib/auth/session.ts` y `Vertrex-Website/src/lib/auth/portal.ts` ya resuelven autenticación interna y portal con JWT cookie HTTP-only.
- `Vertrex-Website/src/app/os/layout.tsx` + `Vertrex-Website/src/components/os/Shell.tsx` ya dan una estructura base OS unificada.
- `Vertrex-Website/src/app/api/mcp/graph/route.ts` sí existe y devuelve `clients`, `projects` y `entity_links`.
- La subida inteligente existe en `Vertrex-Website/src/app/api/upload/route.ts` con routing Neon/Drive.
- `Vertrex-Website/src/lib/db/actions/graph.ts` sí modela relaciones bidireccionales básicas.
- Varias pantallas ya tienen `loading.tsx`, `error.tsx`, `EmptyState` y `toast`.
- El portal ya tiene login, dashboard, archivos y tickets a nivel de UI.

Esto importa porque **no estamos ante un proyecto vacío**. Estamos ante una base prometedora con muchas piezas incompletas o mal cerradas.

---

## 4. Hallazgos críticos por severidad

## P0 — Gaps críticos que bloquean o comprometen el producto

### P0.1 — El portal de tickets está roto por falta de API

**Promesa:** el cliente puede enviar tickets desde el portal.  
**Implementado hoy:** la UI existe, pero el backend no.

**Evidencia:**
- `Vertrex-Website/src/app/portal/[slug]/tickets/TicketForm.tsx` hace `fetch("/api/tickets")`.
- No existe `Vertrex-Website/src/app/api/tickets/**`.

**Resultado real:** el formulario parece funcional, pero al usarlo falla.

---

### P0.2 — `POST /api/upload` está expuesto sin auth fuerte

**Promesa:** el OS y el portal pueden subir archivos, con reglas claras de acceso.  
**Implementado hoy:** cualquier request puede intentar subir un archivo.

**Evidencia:**
- `Vertrex-Website/src/app/api/upload/route.ts` no exige `requireOsUser()` ni una sesión obligatoria.
- `Vertrex-Website/src/middleware.ts` no protege `/api/upload`.

**Riesgo:** creación no autorizada de registros en `documents` y subida de archivos por terceros.

---

### P0.3 — `GET /api/documents/[id]` no controla acceso

**Promesa:** documentos internos y del portal deben respetar contexto y permisos.  
**Implementado hoy:** la API descarga o redirige sin validar ownership ni rol.

**Evidencia:**
- `Vertrex-Website/src/app/api/documents/[id]/route.ts`
- `Vertrex-Website/src/middleware.ts`

**Riesgo:** exfiltración de documentos internos o legales si alguien conoce un `id`.

---

### P0.4 — Rutas de navegación principales faltantes

**Promesa:** existen detalles de Links y Marketing.  
**Implementado hoy:** la UI navega a rutas inexistentes.

**Evidencia:**
- Existe navegación hacia `/os/links/${id}` en `Vertrex-Website/src/app/os/links/LinksView.tsx`, pero no existe `Vertrex-Website/src/app/os/links/[id]/page.tsx`.
- Existe navegación hacia `/os/marketing/${id}` en `Vertrex-Website/src/app/os/marketing/MarketingView.tsx`, pero no existe `Vertrex-Website/src/app/os/marketing/[id]/page.tsx`.

**Resultado real:** clics importantes terminan en 404.

---

### P0.5 — El logout del portal no cierra sesión realmente

**Promesa:** el cliente puede salir de su portal.  
**Implementado hoy:** el botón solo navega a `/portal/login`.

**Evidencia:**
- `Vertrex-Website/src/app/portal/[slug]/page.tsx` usa `Link href="/portal/login"`.
- Existe `logoutPortalClient()` en `Vertrex-Website/src/lib/auth/portal.ts`, pero no se usa.

**Resultado real:** la cookie sigue viva; si el cliente vuelve a una ruta protegida, la sesión sigue activa.

---

## P1 — Funcionalidades del PRD/plan que existen solo parcialmente

### P1.1 — No existe DataTable real

**Promesa UX:** `DataTable` moderno basado en `@tanstack/react-table`.  
**Implementado hoy:** no existe `Vertrex-Website/src/components/os/data/DataTable.tsx`.

**Patrón actual:** listas hechas con `div` + `map`, útiles pero más básicas de lo prometido.

**Impacto:**
- sin columnas configurables,
- sin row actions consistentes,
- sin sticky header,
- sin adaptación sistemática móvil/desktop,
- sin estándar único para CRM, Team, Finanzas, Documentos.

---

### P1.2 — `EntitySidebar` no resuelve entidades reales

**Promesa:** panel lateral útil con conexiones agrupadas por tipo.  
**Implementado hoy:** muestra IDs truncados.

**Evidencia:**
- `Vertrex-Website/src/components/os/Graph/EntitySidebar.tsx`

**Impacto:** el grafo existe a nivel BD, pero la experiencia de usuario no permite comprender relaciones reales.

---

### P1.3 — `EntityConnectSheet` existe, pero el flujo de conectar entidades no

**Promesa:** cualquier entidad puede conectarse con cualquier otra desde UI.  
**Implementado hoy:** el componente existe, pero depende de una búsqueda externa que no existe globalmente.

**Evidencia:**
- `Vertrex-Website/src/components/os/actions/EntityConnectSheet.tsx`
- No existe `searchEntitiesAction`.
- No se detectó integración real y repetida del componente en las vistas principales.

---

### P1.4 — El editor del Hub no es BlockNote real

**Promesa PRD y plan:** editor rico tipo BlockNote.  
**Implementado hoy:** un `textarea` que edita JSON/manual.

**Evidencia:**
- `Vertrex-Website/src/app/os/hub/[id]/NoteEditor.tsx`

**Impacto:** el módulo más importante para notas/ideas no entrega la experiencia central prometida.

---

### P1.5 — El Hub no implementa `@repo`

**Promesa:** mencionar `@repo` dentro del editor, buscar repos guardados y conectarlos al grafo.  
**Implementado hoy:** no hay ninguna lógica visible de `@repo`, combobox inline ni conexión automática.

**Impacto:** se cae una de las features más distintivas del PRD.

---

### P1.6 — El detalle de proyectos está subdesarrollado

**Promesa:** tabs para overview, documentos, finanzas, agenda, recursos, grafo; conexiones y contexto.  
**Implementado hoy:** solo `Overview` y `Links`.

**Evidencia:**
- `Vertrex-Website/src/app/os/projects/[id]/page.tsx`

**Impacto:** el módulo de proyectos existe, pero su vista de detalle todavía no es una consola de operación real.

---

### P1.7 — Documentos no tienen preview real

**Promesa:** preview si es imagen o PDF.  
**Implementado hoy:** solo metadata + descargar.

**Evidencia:**
- `Vertrex-Website/src/app/os/documents/[id]/page.tsx`

---

### P1.8 — Legal está en modo lectura, no operativo

**Promesa:** gestionar `signed_at` y visibilidad portal.  
**Implementado hoy:** solo muestra datos; no hay acciones de cambio reales.

**Evidencia:**
- `Vertrex-Website/src/app/os/legal/[id]/page.tsx`

---

### P1.9 — El portal no muestra legales conectados

**Promesa:** el cliente puede ver legales expuestos.  
**Implementado hoy:** el dashboard calcula `clientLegal`, pero nunca lo renderiza.

**Evidencia:**
- `Vertrex-Website/src/app/portal/[slug]/page.tsx`

---

### P1.10 — La regla de anticipo 50% no existe

**Promesa:** alertas de anticipo pendiente en proyectos/finanzas.  
**Implementado hoy:** no hay chequeo de negocio para anticipo 50%.

**Evidencia:**
- `Vertrex-Website/src/lib/db/actions/finances.ts`
- `Vertrex-Website/src/app/os/finances/page.tsx`
- `Vertrex-Website/src/app/os/projects/[id]/page.tsx`

---

### P1.11 — Settings tiene una acción simulada

**Promesa:** cambio de contraseña real y gestión de variables internas cifradas.  
**Implementado hoy:** el cambio de contraseña es un toast “simulado”.

**Evidencia:**
- `Vertrex-Website/src/app/os/settings/SettingsAccount.tsx`

**Impacto:** el módulo de configuración aparenta estar listo, pero una acción principal no está implementada.

---

### P1.12 — Crear miembros del equipo no revela credenciales una sola vez

**Promesa:** crear miembro y mostrar credenciales una sola vez.  
**Implementado hoy:** la server action devuelve datos, pero la UI no los muestra después del submit.

**Evidencia:**
- `Vertrex-Website/src/lib/db/actions/team.ts`
- `Vertrex-Website/src/app/os/team/[userId]/page.tsx`

---

### P1.13 — Links carece de vista de detalle y README viewer

**Promesa:** `/os/links/[id]`, README on-demand y contexto arriba.  
**Implementado hoy:** acciones `loadRepositoryReadmeAction`, `getRepositoryById` y `getLinkById` existen, pero la ruta de detalle no.

**Evidencia:**
- `Vertrex-Website/src/lib/db/actions/links.ts`
- falta `Vertrex-Website/src/app/os/links/[id]/page.tsx`

---

### P1.14 — Marketing no tiene detalle ni acción primaria real

**Promesa:** gestionar cuentas y contenido por cuenta.  
**Implementado hoy:** solo lista parcial.

**Evidencia:**
- `Vertrex-Website/src/app/os/marketing/page.tsx`
- `Vertrex-Website/src/app/os/marketing/MarketingView.tsx`
- falta `Vertrex-Website/src/app/os/marketing/[id]/page.tsx`

---

## P2 — UX debt importante

### P2.1 — El shell existe, pero todavía se siente más “app interna simple” que “OS moderno”

**Hallazgos:**
- `Sidebar` y `Topbar` sí existen.
- El botón visible de “Comandos” no abre nada por clic.
- El botón `Buscar` de topbar tampoco abre nada por clic.
- `Ctrl+K` sí abre el `CommandMenu`, pero el trigger visible no está cableado.

**Evidencia:**
- `Vertrex-Website/src/components/os/layout/Sidebar.tsx`
- `Vertrex-Website/src/components/os/layout/Topbar.tsx`
- `Vertrex-Website/src/components/os/CommandMenu.tsx`

---

### P2.2 — Las pantallas mezclan componentes UI modernos con HTML raw

Hay un patrón repetido:

- `PageHeader` sí se usa.
- `Card`, `Badge`, `Button`, `Tabs` sí se usan.
- Pero muchos formularios siguen usando `input`, `select`, `textarea` y `button` raw en vez de wrappers UI consistentes.

Esto rompe la uniformidad prometida por la UX spec.

---

### P2.3 — El checklist UX no está aterrizado en pruebas reales

**Evidencia:**
- `Vertrex-Website/e2e/auth.spec.ts`
- `Vertrex-Website/e2e/workspace.spec.ts`

**Problema:**
- Son pruebas muy superficiales.
- No validan `PageHeader`, `Toolbar`, `EmptyState`, `ErrorState`, `toast`, `Dialog`, `Sheet` ni responsive real.

---

### P2.4 — Login y portal login no renderizan feedback de error real

**Promesa UX:** error claro al fallar credenciales.  
**Implementado hoy:** los actions redirigen con `?error=1`, pero las pantallas no muestran ese estado.

**Evidencia:**
- `Vertrex-Website/src/app/login/actions.ts`
- `Vertrex-Website/src/app/login/page.tsx`
- `Vertrex-Website/src/app/portal/login/actions.ts`
- `Vertrex-Website/src/app/portal/login/page.tsx`

---

### P2.5 — Portal visualmente es aceptable, pero todavía no es “espacio colaborativo”

Hoy el portal es:

- un dashboard limpio,
- una subida de archivos simple,
- un historial de tickets básico,
- y una vista de pagos/proyectos.

Todavía no es:

- un workspace vivo,
- un timeline compartido,
- un visor documental integrado,
- ni una experiencia con feedback rico y continuidad contextual.

---

## P3 — Deuda arquitectónica o de profundidad futura

Estas no son las primeras cosas a arreglar, pero sí importan después:

- sin optimistic UI real de producto,
- sin virtualización en listas largas,
- sin lazy loading agresivo en piezas pesadas,
- sin SSE/WebSockets,
- sin workers de scraping,
- sin automatizaciones por eventos,
- sin IA contextual real.

La auditoría anterior tenía razón al señalar estas direcciones, pero las colocó demasiado pronto en la prioridad.

---

## 5. Comparación con la auditoría anterior

## Lo que la auditoría anterior acertó

La auditoría anterior acertó al señalar:

1. falta de búsqueda global de entidades,
2. falta de semántica rica en relaciones,
3. inexistencia práctica del grafo interactivo,
4. portal sin tiempo real,
5. Hub lejos de ser “segundo cerebro”,
6. necesidad de arquitectura más reactiva y menos pesada.

---

## Lo que la auditoría anterior subestimó

### Subestimación 1 — El problema no es solo “premium superficial”; también hay roturas básicas

Ejemplos:
- falta `/api/tickets`,
- faltan rutas de detalle críticas,
- hay APIs sensibles expuestas,
- logout del portal no limpia sesión.

La V2 no puede construirse encima de eso sin antes reparar V1.

### Subestimación 2 — El Hub está más atrás de lo descrito

No es solo que falte “autoguardado robusto”.  
El editor real actual ni siquiera corresponde a la experiencia BlockNote prometida.

### Subestimación 3 — El portal no está solo “estático”; tiene gaps funcionales

No es solo que requiera realtime.  
También faltan features ya prometidas como tickets end-to-end y visualización de legales.

### Subestimación 4 — La desconexión del grafo no es solo semántica; es también de identidad visual y utilidad real

`EntitySidebar` no traduce conexiones en entidades legibles.  
Eso vuelve el grafo poco útil incluso antes de pensar en ReactFlow activo.

### Subestimación 5 — El principal problema de UX no es solo “hacerlo premium”, sino eliminar soluciones demasiado básicas donde ya había una promesa concreta mejor

Ejemplos:
- `textarea` JSON en vez de BlockNote,
- listas div-based en vez de DataTable donde se prometió DataTable,
- settings simulados,
- botones visibles que no abren los sistemas que anuncian.

---

## 6. Comparativa resumida por módulo

| Módulo | Estado real | Veredicto |
|---|---|---|
| Auth interna | Bien base | Implementado con huecos menores UX |
| Auth portal | Bien base | Implementado con huecos UX/logout |
| Dashboard | Parcial | Correcto visualmente, aún superficial |
| CRM | Parcial sólido | Lista y detalle funcionales, pero sin connect UX real |
| Proyectos | Parcial | Lista buena, detalle incompleto frente al PRD |
| Documentos | Parcial | Repositorio ok, detalle sin preview |
| Legal | Parcial débil | Lista ok, detalle poco operativo |
| Hub | Parcial débil | Idea board útil, editor central insuficiente |
| Recursos | Parcial | Lista/detalle existen, reveal funciona, creación y UX aún toscas |
| Finanzas | Parcial | Lista y detalle existen, falta lógica de negocio clave |
| Agenda | Parcial | Vista de agenda simple, no calendario real completo |
| Links | Parcial roto | Lista existe, detalle no existe |
| Marketing | Parcial roto | Lista existe, detalle no existe |
| Equipo | Parcial | Lista/detalle existen, creación incompleta en UX |
| Settings | Parcial débil | Cuenta simulada, faltan variables internas reales |
| Portal dashboard | Parcial | Útil, pero incompleto y con logout incorrecto |
| Portal files | Parcial | Subida/lista ok, sin visor ni capa colaborativa |
| Portal tickets | Roto | Historial sí, creación no |
| Grafo | Parcial débil | Backend existe, UX real insuficiente |
| Seguridad API | Riesgosa | Upload y documentos requieren cierre inmediato |

---

## 7. Prioridad correcta para una V2 ejecutable con modelo barato

## Orden correcto

### Primero: cerrar V1 prometida

Esto incluye:

- `/api/tickets`
- protección de `/api/upload`
- protección de `/api/documents/[id]`
- `/os/links/[id]`
- `/os/marketing/[id]`
- logout portal real
- search entities + `EntityConnectSheet`
- `EntitySidebar` con labels reales
- settings sin simulaciones
- portal legales visibles
- rule 50% anticipo

### Después: completar profundidad UX prometida

- DataTable real
- formularios y dialogs consistentes
- error states reales en login/portal login
- detail tabs más completos
- preview documental
- Team/Resources/Legal con UX operativa real

### Después: activar componentes “instalados pero dormidos”

- BlockNote real
- ReactFlow real
- README viewer real
- Command trigger clickable

### Solo después: entrar en V2 avanzada

- realtime portal
- workers
- scraping automático
- IA contextual
- event-driven playbooks
- RAG

---

## 8. Recomendación final

La V2 no debe plantearse como “agregar más cosas”.  
Debe plantearse como:

**“reemplazar las piezas básicas o incompletas del OS actual por implementaciones cerradas, seguras y coherentes con el PRD y la UX spec”**.

Eso implica que el modelo barato no debe recibir una orden vaga tipo “mejora el OS”.  
Debe recibir:

1. una matriz de gaps priorizados,
2. un plan V2 atómico por archivos,
3. y un quality gate que impida cerrar un módulo si todavía parece scaffold o si una promesa del PRD sigue rota.

---

## 9. Documentos recomendados para ejecutar la corrección

Esta auditoría debe usarse junto con:

- `Vertrex-Website/docs/md/vertrex-os-v2-gap-matrix.md`
- `Vertrex-Website/docs/md/vertrex-os-v2-remediation-plan.md`
- `Vertrex-Website/docs/md/vertrex-os-v2-quality-gate.md`

Esos documentos son el paquete correcto para pasarle la corrección V2 a un modelo barato sin capacidad de criterio arquitectónico o visual.
