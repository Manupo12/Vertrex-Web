# Vertrex OS — Matriz de Gaps V2

Esta matriz traduce la auditoría profunda en un backlog ejecutable y priorizado. El modelo barato no debe improvisar prioridades: debe seguir esta matriz y resolver primero P0, luego P1, luego P2, luego P3.

## Escala de severidad

- `P0` = roto, inseguro o bloquea un flujo crítico.
- `P1` = feature prometida e importante, pero incompleta.
- `P2` = deuda UX relevante que degrada la calidad percibida.
- `P3` = mejora de profundidad futura, no bloqueante para cerrar V1 bien.

## Matriz

| ID | Severidad | Área | Requisito fuente | Estado actual | Evidencia | Qué corregir | Resultado esperado |
|---|---|---|---|---|---|---|---|
| GAP-001 | P0 | Portal Tickets | PRD 5.13 | Roto | `src/app/portal/[slug]/tickets/TicketForm.tsx` | Crear `src/app/api/tickets/route.ts` y cerrar flujo end-to-end | El cliente puede enviar tickets desde portal y verlos persistidos |
| GAP-002 | P0 | Seguridad Upload | PRD 3 / 5.13 | Riesgoso | `src/app/api/upload/route.ts`, `src/middleware.ts` | Proteger `/api/upload` con sesión OS o portal válida | No se pueden subir archivos sin auth |
| GAP-003 | P0 | Seguridad Documentos | PRD 5.4 / 5.13 | Riesgoso | `src/app/api/documents/[id]/route.ts` | Validar acceso por rol o ownership antes de servir archivo | Documentos internos no son públicos por ID |
| GAP-004 | P0 | Links detalle | PRD 5.10 / rutas | Ausente | Falta `src/app/os/links/[id]/page.tsx` | Crear detalle link/repo con README viewer | Clic en cards de links/repos funciona |
| GAP-005 | P0 | Marketing detalle | PRD 5.11 / rutas | Ausente | Falta `src/app/os/marketing/[id]/page.tsx` | Crear detalle de cuenta social y contenido | Clic en cuenta marketing funciona |
| GAP-006 | P0 | Logout portal | PRD 5.13 | Parcial | `src/app/portal/[slug]/page.tsx`, `src/lib/auth/portal.ts` | Implementar logout real que borre `portal_session` | El cliente realmente sale del portal |
| GAP-007 | P1 | DataTable | UX Spec 2.2 | Ausente | Falta `src/components/os/data/DataTable.tsx` | Implementar DataTable y usarla en CRM, Team, Finanzas, Documentos | Las listas dejan de ser cards/divs básicas |
| GAP-008 | P1 | Graph Search | PRD 2 / plan UX | Ausente | Falta `searchEntitiesAction` | Crear búsqueda global de entidades para conectar y command menu | `EntityConnectSheet` funciona |
| GAP-009 | P1 | Entity Connect UX | PRD 2 / 5.x | Parcial | `src/components/os/actions/EntityConnectSheet.tsx` sin integración real | Montar `EntityConnectSheet` en CRM, Proyectos, Documentos, Legal, Recursos, Hub, Finanzas | Se pueden crear conexiones desde UI |
| GAP-010 | P1 | EntitySidebar útil | PRD 2.4 | Parcial | `src/components/os/Graph/EntitySidebar.tsx` | Resolver nombres reales, rutas y metadatos por entidad | Sidebar muestra entidades legibles, no UUIDs |
| GAP-011 | P1 | ReactFlow | PRD 2.4 / 5.3 | Ausente práctico | No hay uso real de ReactFlow | Crear `EntityGraph` y usarlo al menos en proyectos y hub | Existe grafo visual funcional |
| GAP-012 | P1 | Hub editor real | PRD 5.6 | Parcial débil | `src/app/os/hub/[id]/NoteEditor.tsx` | Reemplazar textarea JSON por BlockNote real | El Hub se siente como editor rico, no JSON manual |
| GAP-013 | P1 | `@repo` en Hub | PRD 5.6.2 / 5.10.6 | Ausente | Sin lógica `@repo` en `src/app/os/hub/**` | Implementar búsqueda repo desde editor y conexión automática | Las notas/ideas pueden citar repos guardados |
| GAP-014 | P1 | Hub related project | PRD 5.6.2 | Parcial | `src/app/os/hub/[id]/page.tsx` | Añadir UI para `relatedProjectId` y pregunta fija faltante | La idea puede asociarse al proyecto actual |
| GAP-015 | P1 | Project detail depth | PRD 5.3 / UX 5.5 | Parcial | `src/app/os/projects/[id]/page.tsx` | Añadir tabs Documentos, Finanzas, Agenda, Recursos, Grafo y conexiones | El detalle de proyecto cumple PRD |
| GAP-016 | P1 | Project advance rule | PRD 5.8 | Ausente | `src/lib/db/actions/finances.ts`, `src/app/os/projects/[id]/page.tsx` | Implementar chequeo anticipo 50% y badge de warning | Proyectos sin anticipo muestran alerta roja |
| GAP-017 | P1 | Documents preview | PRD 5.4 | Ausente | `src/app/os/documents/[id]/page.tsx` | Añadir preview imagen/PDF | El detalle de documento permite vista previa |
| GAP-018 | P1 | Legal operativa | PRD 5.5 | Parcial | `src/app/os/legal/[id]/page.tsx` | Permitir editar `signedAt` y `isPublic` desde UI | Legal deja de ser solo lectura |
| GAP-019 | P1 | Portal legales | PRD 5.13 | Ausente en UI | `src/app/portal/[slug]/page.tsx` | Renderizar legales públicos conectados | El cliente ve documentos legales expuestos |
| GAP-020 | P1 | Settings real | PRD 5.15 | Parcial débil | `src/app/os/settings/SettingsAccount.tsx` | Implementar cambio de contraseña real y tab de variables internas | Settings deja de ser simulado |
| GAP-021 | P1 | Team credentials reveal | PRD 5.12 | Parcial | `src/lib/db/actions/team.ts`, `src/app/os/team/[userId]/page.tsx` | Mostrar credenciales una sola vez tras crear miembro | La creación de usuarios cumple PRD |
| GAP-022 | P1 | Links README | PRD 5.10.5 | Ausente por ruta faltante | `src/lib/db/actions/links.ts` | Implementar detalle con README on-demand y `react-markdown` | Los repos tienen modo lectura real |
| GAP-023 | P1 | Marketing CRUD completo | PRD 5.11 | Parcial | `src/app/os/marketing/page.tsx` | Añadir acción primaria y detalle por cuenta | Marketing deja de ser solo lista |
| GAP-024 | P2 | Command trigger visible | UX Spec 4.3 | Parcial | `src/components/os/layout/Sidebar.tsx`, `Topbar.tsx` | Hacer clickable el botón visible de command menu | `Ctrl+K` y el trigger visual abren lo mismo |
| GAP-025 | P2 | Login error feedback | UX Spec 3.3 | Ausente | `src/app/login/page.tsx`, `src/app/portal/login/page.tsx` | Renderizar mensajes por `?error=1` | El usuario entiende por qué falló el login |
| GAP-026 | P2 | Form consistency | UX Spec 2.1 / 2.2 | Parcial | Muchos `input/select/textarea/button` raw | Migrar formularios principales a wrappers UI | Consistencia visual y de estados |
| GAP-027 | P2 | Toolbar/filter URL sync | UX Spec 5.x | Parcial | CRM/Projects/Resources usan estado local | Sincronizar búsqueda/filtros con URL donde aplique | Las vistas son compartibles y persistentes |
| GAP-028 | P2 | Portal accessibility polish | UX Spec 6 | Parcial | `src/app/portal/**` | Añadir feedback errors, logout real, estados vacíos mejores, CTA claros | Portal más confiable para cliente no técnico |
| GAP-029 | P2 | E2E depth | UX Checklist | Débil | `e2e/auth.spec.ts`, `e2e/workspace.spec.ts` | Añadir tests para rutas reales, page headers, detail pages y no-404 | Menos riesgo de regresión |
| GAP-030 | P3 | Optimistic UI | Auditoría V2 original | Ausente | Varias mutaciones server action sin UI optimista | Añadir optimistic updates donde sí aporte valor | El OS se siente más rápido |
| GAP-031 | P3 | Virtualization | Auditoría V2 original | Ausente | No hay `react-virtual` | Añadir solo cuando listas superen volumen real | Rendimiento estable en listas grandes |
| GAP-032 | P3 | SSE/WebSockets portal | Auditoría V2 original | Ausente | No hay EventSource/WebSocket | Planificar realtime tras cerrar V1 | Portal vivo en V2.1+ |
| GAP-033 | P3 | Workers scraping links | Auditoría V2 original | Ausente | Scraping inline únicamente | Mover scraping pesado a background jobs | Links enriquecidos sin bloquear UI |
| GAP-034 | P3 | IA contextual | Auditoría V2 original | Ausente | No hay chat contextual | Posponer hasta cerrar V1/V2.0 | Base lista para OpenClaw |

---

## Reglas de uso de esta matriz

- No empezar ningún gap `P2` o `P3` si queda al menos un `P0` pendiente.
- No empezar mejoras “premium” en Hub, portal o IA si `GAP-001`, `GAP-002`, `GAP-003`, `GAP-004` o `GAP-005` siguen abiertos.
- Un gap no se considera cerrado solo porque la pantalla compile; debe pasar su validación funcional y visual.
- Esta matriz debe usarse junto con:
  - `Vertrex-Website/AUDITORIA_Y_MEJORAS_OS_PORTAL_V2_DEEP.md`
  - `Vertrex-Website/docs/md/vertrex-os-v2-remediation-plan.md`
  - `Vertrex-Website/docs/md/vertrex-os-v2-quality-gate.md`
