# Vertrex OS — Plan de Remediación V2 para Modelo Barato

Este plan corrige la implementación real actual comparándola contra:

- `Vertrex-Website/docs/md/vertrex-os-prd(1).md`
- `Vertrex-Website/docs/md/vertrex-os-prd-implementation-plan.md`
- `Vertrex-Website/docs/md/vertrex-os-ux-spec.md`
- `Vertrex-Website/docs/md/vertrex-os-ux-implementation-plan.md`
- `Vertrex-Website/AUDITORIA_Y_MEJORAS_OS_PORTAL_V2_DEEP.md`
- `Vertrex-Website/docs/md/vertrex-os-v2-gap-matrix.md`

## Archivos que NO se deben modificar

- `Vertrex-Website/docs/md/vertrex-os-prd(1).md`
- `Vertrex-Website/.env.local`
- `Vertrex-Website/node_modules/**`
- `Vertrex-Website/.next/**`
- `Vertrex-Website/public/**`
- `Vertrex-Website/src/app/page.tsx`
- `Vertrex-Website/src/app/contacto/page.tsx`
- `Vertrex-Website/src/app/cuestionario/page.tsx`
- `Vertrex-Website/src/app/demos/page.tsx`
- `Vertrex-Website/src/app/portafolio/page.tsx`
- `Vertrex-Website/src/app/portafolio/[slug]/page.tsx`
- `Vertrex-Website/src/app/servicios/page.tsx`
- `Vertrex-Website/src/app/sobre-nosotros/page.tsx`
- `Vertrex-Website/src/app/terminos/page.tsx`
- `Vertrex-Website/src/app/politica-de-privacidad/page.tsx`
- `Vertrex-Website/src/components/Header.tsx`
- `Vertrex-Website/src/components/Footer.tsx`
- `Vertrex-Website/drizzle/meta/**`

## Regla base de esta V2

No conservar implementaciones básicas o simuladas solo porque “ya existen”. Si un archivo actual resuelve el problema de forma incompleta, reemplazarlo sin intentar parches cosméticos. El objetivo de V2 es **sustituir** piezas débiles por implementaciones cerradas y reales.

---

## Fase V2-0 — Preparación y bloqueo de alcance

1. `[Vertrex-Website/docs/md/vertrex-os-v2-gap-matrix.md]` → Leer y marcar como alcance obligatorio los gaps `GAP-001` a `GAP-029` → El ejecutor no salta directo a IA, realtime ni workers.
2. `[Vertrex-Website/src/app/os/**/*]` → Auditar qué pantallas siguen usando formularios raw, listas `div`-based, rutas faltantes o placeholders → Queda identificada la lista exacta de reemplazos, no solo “mejoras”.
3. `[Vertrex-Website/src/app/portal/**/*]` → Auditar qué pantallas del portal siguen con logout falso, tickets rotos o legales invisibles → Queda identificado el alcance exacto de corrección del portal.
4. `[Vertrex-Website/package.json]` → Verificar que NO hace falta instalar nuevas dependencias para cerrar los gaps `P0` y `P1` principales; usar primero lo ya instalado → La V2.0 se resuelve con el stack actual salvo hallazgo justificado.

### Checkpoint Fase V2-0

5. `[Vertrex-Website]` → Ejecutar revisión manual de alcance y confirmar por escrito que la prioridad es `P0 -> P1 -> P2`, usando `Vertrex-Website/AUDITORIA_Y_MEJORAS_OS_PORTAL_V2_DEEP.md` y `Vertrex-Website/docs/md/vertrex-os-v2-gap-matrix.md` → No avanzar si el ejecutor pretende empezar por IA, realtime o workers.

---

## Fase V2-1 — Seguridad, rutas rotas y flujos bloqueados

6. `[Vertrex-Website/src/app/api/tickets/route.ts]` → Crear route handler `POST` que valide sesión portal activa, reciba `title` y `description`, cree ticket en BD y devuelva JSON correcto → El formulario de tickets del portal deja de estar roto. Requiere Step 1 claro.
7. `[Vertrex-Website/src/app/portal/[slug]/tickets/TicketForm.tsx]` → Actualizar submit para depender del contrato real de `/api/tickets`, manejar errores del backend y mostrar toast correcto → El cliente puede enviar tickets de extremo a extremo.
8. `[Vertrex-Website/src/app/api/upload/route.ts]` → Reemplazar la lógica de autenticación para exigir sesión válida: `portal_session` si `source=portal`, `os_session` si `source=os` → No se aceptan uploads anónimos.
9. `[Vertrex-Website/src/middleware.ts]` → Añadir protección explícita para `/api/upload` y cualquier otra API sensible del OS/portal que hoy no quede cubierta por el matcher actual → Las APIs sensibles no quedan expuestas por omisión.
10. `[Vertrex-Website/src/app/api/documents/[id]/route.ts]` → Reescribir el acceso a documentos para validar contexto: usuario OS autenticado o cliente portal con ownership/conexión del documento → Los documentos dejan de ser públicos por ID.
11. `[Vertrex-Website/src/lib/auth/portal.ts]` → Añadir helper reusable para logout portal server-side y mantenerlo como única fuente de verdad → El portal tiene cierre de sesión real.
12. `[Vertrex-Website/src/app/portal/logout/route.ts]` → Crear route handler o server action endpoint para ejecutar logout real del portal → El botón “Salir” deja de ser solo un link decorativo.
13. `[Vertrex-Website/src/app/portal/[slug]/page.tsx]` → Reemplazar `Link` de logout por acción real que borre cookie y redirija → La sesión del cliente se cierra de verdad.
14. `[Vertrex-Website/src/app/os/links/[id]/page.tsx]` → Crear ruta de detalle para links/repositorios usando `getRepositoryById()`, `getLinkById()` y `loadRepositoryReadmeAction()` → Clic en cards de Links deja de romper.
15. `[Vertrex-Website/src/app/os/marketing/[id]/page.tsx]` → Crear ruta de detalle de cuenta social y su `content_plan` → Clic en Marketing deja de romper.
16. `[Vertrex-Website/src/app/os/links/error.tsx]` → Ajustar el error state para cubrir también el nuevo detalle `/os/links/[id]` cuando falle carga de datos → El módulo Links tiene fallback consistente.
17. `[Vertrex-Website/src/app/os/marketing/error.tsx]` → Crear error boundary si no existe para cubrir lista y detalle de Marketing → Marketing tiene recuperación visual básica.

### Checkpoint Fase V2-1

18. `[Vertrex-Website]` → Ejecutar `npm run typecheck` → Debe terminar con 0 errores. Luego probar manualmente: crear ticket desde `/portal/[slug]/tickets`, subir archivo desde portal y OS, descargar documento desde `/api/documents/[id]`, abrir `/os/links/[id]` y `/os/marketing/[id]` sin 404. Si falla, no avanzar.

---

## Fase V2-2 — Grafo útil de verdad

19. `[Vertrex-Website/src/lib/db/actions/search.ts]` → Crear `searchEntitiesAction(query)` que busque en `clients`, `projects`, `documents`, `legal_documents`, `knowledge_notes`, `resources`, `finances`, `agenda_events`, `repositories`, `links`, `social_accounts`, `users` → Ya existe búsqueda global de entidades.
20. `[Vertrex-Website/src/lib/db/actions/search.ts]` → Normalizar cada resultado a `{ id, label, subtitle, type, href }` → El frontend puede renderizar resultados humanos, no UUIDs.
21. `[Vertrex-Website/src/components/os/actions/EntityConnectSheet.tsx]` → Reemplazar la dependencia de `searchAction` inyectada por una integración directa o wrapper común con `searchEntitiesAction()` → El componente deja de ser inerte.
22. `[Vertrex-Website/src/components/os/actions/EntityConnectSheet.tsx]` → Añadir render de `label`, `subtitle`, `type`, loading, empty, error y feedback de éxito con refresh de ruta actual → Conectar entidades deja de ser una UX ciega.
23. `[Vertrex-Website/src/components/os/Graph/EntitySidebar.tsx]` → Reescribir para resolver entidades relacionadas y mostrar nombre/título real, tipo, enlace navegable y relación → `EntitySidebar` se vuelve útil.
24. `[Vertrex-Website/src/lib/db/actions/graph.ts]` → Añadir helper que resuelva relaciones enriquecidas para sidebar y grafo (`getResolvedEntityConnections`) → El frontend no hace joins manuales dispersos.
25. `[Vertrex-Website/src/components/os/Graph/EntityGraph.tsx]` → Crear componente ReactFlow funcional usando relaciones resueltas → El grafo visual deja de ser una promesa vacía.
26. `[Vertrex-Website/src/app/os/projects/[id]/page.tsx]` → Integrar `EntityConnectSheet` y `EntityGraph` en la vista de proyecto → Proyectos empieza a cumplir el rol de centro operativo.
27. `[Vertrex-Website/src/app/os/crm/[slug]/page.tsx]` → Integrar `EntityConnectSheet` en el detalle de cliente → CRM puede conectar clientes con otras entidades.
28. `[Vertrex-Website/src/app/os/documents/[id]/page.tsx]` → Integrar `EntityConnectSheet` en detalle de documento → Documentos pueden conectarse desde UI.
29. `[Vertrex-Website/src/app/os/legal/[id]/page.tsx]` → Integrar `EntityConnectSheet` en detalle legal → Legal deja de ser aislado.
30. `[Vertrex-Website/src/app/os/resources/[id]/page.tsx]` → Integrar `EntityConnectSheet` en detalle recurso → Recursos pueden asociarse correctamente.
31. `[Vertrex-Website/src/app/os/finances/[id]/page.tsx]` → Integrar `EntityConnectSheet` en detalle financiero → Finanzas puede conectarse con clientes/proyectos.
32. `[Vertrex-Website/src/app/os/hub/[id]/page.tsx]` → Integrar `EntityConnectSheet` y usar conexiones enriquecidas en sidebar → Hub conecta ideas/notas con el resto del sistema.
33. `[Vertrex-Website/src/components/os/CommandMenu.tsx]` → Enriquecer el command palette para que además de rutas fijas pueda buscar entidades usando `searchEntitiesAction()` → `Ctrl+K` deja de ser solo un launcher estático.
34. `[Vertrex-Website/src/components/os/layout/Sidebar.tsx]` → Hacer clickable el botón `Comandos` para abrir el `CommandMenu` real → La UI visible coincide con el comportamiento prometido.
35. `[Vertrex-Website/src/components/os/layout/Topbar.tsx]` → Hacer clickable el botón `Buscar` para abrir el `CommandMenu` real → La topbar deja de tener affordances falsas.

### Checkpoint Fase V2-2

36. `[Vertrex-Website]` → Ejecutar `npm run typecheck` → Debe terminar con 0 errores. Luego abrir `/os/crm/[slug]`, `/os/projects/[id]` y `/os/hub/[id]`, usar `Conectar`, buscar entidades por nombre real y confirmar que `EntitySidebar` muestra labels navegables en vez de UUID truncados. Si falla, no avanzar.

---

## Fase V2-3 — Cerrar módulos OS que están “a medias”

37. `[Vertrex-Website/src/components/os/data/DataTable.tsx]` → Crear el `DataTable` prometido con `@tanstack/react-table`, columnas configurables, sticky header, row actions y soporte responsive → Deja de dependerse de listas `div`-based para todo.
38. `[Vertrex-Website/src/components/os/data/MobileCardList.tsx]` → Crear fallback móvil para tablas largas → Las listas no se rompen a 390px.
39. `[Vertrex-Website/src/app/os/crm/CrmList.tsx]` → Reemplazar la lista actual por `DataTable` desktop + `MobileCardList` móvil → CRM deja de verse como lista básica de cards.
40. `[Vertrex-Website/src/app/os/team/TeamList.tsx]` → Reemplazar la lista actual por `DataTable` → Equipo gana estructura más profesional.
41. `[Vertrex-Website/src/app/os/finances/FinancesList.tsx]` → Reemplazar lista actual por `DataTable` → Finanzas soporta mejor filtros/estado/acciones.
42. `[Vertrex-Website/src/app/os/documents/DocsList.tsx]` → Migrar el listado a `DataTable` o híbrido tabla/cards real → Documentos deja de ser lista plana.
43. `[Vertrex-Website/src/app/os/legal/LegalList.tsx]` → Migrar el listado a `DataTable` o híbrido consistente → Legal sigue el mismo sistema visual.
44. `[Vertrex-Website/src/app/os/resources/ResourcesList.tsx]` → Reemplazar el overlay manual por `Sheet` o `Dialog` reusable para revelar secretos → Recursos usa el sistema de interacción prometido.
45. `[Vertrex-Website/src/app/os/resources/[id]/RevealButton.tsx]` → Reescribir el reveal para usar `Sheet`/`Dialog`, copiado con toast y cierre consistente → La UX de secretos deja de ser modal artesanal.
46. `[Vertrex-Website/src/app/os/settings/SettingsAccount.tsx]` → Reemplazar la acción simulada por cambio de contraseña real con validación de contraseña actual y update de `users.passwordHash` → Settings deja de mentir.
47. `[Vertrex-Website/src/lib/db/actions/settings.ts]` → Crear action real `changePasswordAction()` y acciones para variables internas cifradas → Configuración gana backend real.
48. `[Vertrex-Website/src/app/os/settings/page.tsx]` → Añadir tab `Variables internas` y UI para guardar/listar recursos cifrados de configuración → Settings empieza a cumplir PRD.
49. `[Vertrex-Website/src/app/os/team/[userId]/page.tsx]` → Reescribir el flujo de creación de miembros para mostrar credenciales una sola vez al crear → Equipo cumple el requerimiento operativo.
50. `[Vertrex-Website/src/app/os/team/[userId]/ManageMember.tsx]` → Sustituir el toggle de rol por un `Select` explícito y confirmación adecuada → Gestión de roles deja de ser demasiado básica.
51. `[Vertrex-Website/src/lib/db/actions/finances.ts]` → Implementar helper `projectHasPaidAdvance()` o equivalente real con regla de anticipo 50% → La lógica crítica de negocio existe.
52. `[Vertrex-Website/src/app/os/projects/page.tsx]` → Añadir badge rojo de anticipo pendiente en la vista lista/kanban → El warning aparece donde debe.
53. `[Vertrex-Website/src/app/os/projects/[id]/page.tsx]` → Añadir alerta visible de anticipo pendiente y tabs faltantes: `Documentos`, `Finanzas`, `Agenda`, `Recursos`, `Grafo` → El detalle de proyecto se acerca al PRD real.
54. `[Vertrex-Website/src/app/os/documents/[id]/page.tsx]` → Añadir preview de imagen/PDF usando `img`, `iframe` o visor simple según MIME → Documentos gana preview real sin instalar dependencias innecesarias.
55. `[Vertrex-Website/src/app/os/legal/[id]/page.tsx]` → Añadir controles para editar `signedAt` y `isPublic` desde UI → Legal deja de ser solo lectura.
56. `[Vertrex-Website/src/app/os/marketing/page.tsx]` → Añadir acción primaria `Nueva cuenta` y conectar con el nuevo detalle de marketing → La lista marketing deja de ser una tarjeta sin salida útil.
57. `[Vertrex-Website/src/app/os/marketing/[id]/page.tsx]` → Implementar tabs `Cuenta`, `Contenido`, `Credenciales` y acciones por cuenta → Marketing cumple el flujo prometido por PRD/UX.
58. `[Vertrex-Website/src/app/os/links/[id]/page.tsx]` → Implementar tabs `Resumen`, `README`, `Conexiones` y controles de status/priority → Links deja de ser solo galería.
59. `[Vertrex-Website/src/app/os/links/LinksView.tsx]` → Añadir filtros reales por language, implementation_status, topics y priority, no solo búsqueda global → Links se acerca al PRD.

### Checkpoint Fase V2-3

60. `[Vertrex-Website]` → Ejecutar `npm run typecheck` → Debe terminar con 0 errores. Luego revisar manualmente `/os/projects/[id]`, `/os/documents/[id]`, `/os/legal/[id]`, `/os/resources/[id]`, `/os/team/[userId]`, `/os/settings`, `/os/links/[id]` y `/os/marketing/[id]`; todas deben dejar de parecer pantallas a medio terminar. Si falla, no avanzar.

---

## Fase V2-4 — Recuperar el Knowledge Hub prometido

61. `[Vertrex-Website/src/components/os/Editor/BlockEditor.tsx]` → Crear o reactivar un editor BlockNote real usando dependencias ya instaladas → El editor rico vuelve a existir de verdad.
62. `[Vertrex-Website/src/app/os/hub/[id]/NoteEditor.tsx]` → Reemplazar el `textarea` JSON por `BlockEditor` con guardado manual y estado pending → Hub deja de ser un editor de JSON.
63. `[Vertrex-Website/src/lib/db/actions/hub.ts]` → Ajustar serialización/deserialización para contenido BlockNote real, sin romper quick capture → Los datos del Hub siguen guardándose en formato útil.
64. `[Vertrex-Website/src/app/os/hub/[id]/page.tsx]` → Añadir la tercera pregunta fija faltante: `¿A qué proyecto actual pertenece?` y UI para `relatedProjectId` → El detalle de idea cumple lo definido en PRD.
65. `[Vertrex-Website/src/components/os/Hub/RepoMentionPicker.tsx]` → Crear picker simple para insertar repos guardados desde Hub → Se prepara la mención `@repo`.
66. `[Vertrex-Website/src/lib/db/actions/hub.ts]` → Añadir action para conectar nota/idea con repositorio seleccionado desde el editor → La selección de repo crea `entity_links` reales.
67. `[Vertrex-Website/src/app/os/hub/[id]/NoteEditor.tsx]` → Integrar el picker de repos como solución concreta para `@repo`, aunque inicialmente sea botón/comando auxiliar si el inline trigger completo es demasiado costoso → El requerimiento deja de estar ausente.
68. `[Vertrex-Website/src/app/os/hub/HubView.tsx]` → Mejorar incubadora para permitir cambio de estado más rico que un `select` crudo; usar cards más estructuradas y acciones explícitas → Ideas deja de sentirse improvisado.
69. `[Vertrex-Website/src/app/os/hub/[id]/page.tsx]` → Mantener botón `Convertir en proyecto`, pero añadir feedback contextual y relación visible con proyecto creado → La conversión se entiende mejor.

### Checkpoint Fase V2-4

70. `[Vertrex-Website]` → Ejecutar `npm run typecheck` → Debe terminar con 0 errores. Luego probar `/os/hub`, crear una idea, editarla con BlockNote real, asignar `next_step`, asociarla a un proyecto, conectar un repo y convertirla en proyecto. Si falla, no avanzar.

---

## Fase V2-5 — Cerrar Portal Cliente de acuerdo al PRD

71. `[Vertrex-Website/src/app/portal/login/page.tsx]` → Mostrar feedback real si llega `?error=1` desde la action de login → El cliente entiende por qué falló el acceso.
72. `[Vertrex-Website/src/app/portal/[slug]/page.tsx]` → Renderizar sección de `legal_documents` públicos conectados al cliente/proyecto → El portal cumple lo prometido en legales.
73. `[Vertrex-Website/src/app/portal/[slug]/page.tsx]` → Reemplazar lógica con `.catch(() => [])` silenciosa por consultas controladas y tratamiento explícito de errores/datos vacíos → El dashboard portal deja de ocultar fallos reales.
74. `[Vertrex-Website/src/app/portal/[slug]/files/page.tsx]` → Añadir estado vacío mejorado, feedback de subida y separación clara entre documentos generales y legales si aplica → Archivos portal se siente más completo.
75. `[Vertrex-Website/src/app/portal/[slug]/files/FileUploader.tsx]` → Añadir pending state más claro, bloqueo correcto y reinicio del input tras subir → La subida de archivos es más robusta.
76. `[Vertrex-Website/src/app/portal/[slug]/tickets/page.tsx]` → Mantener historial, pero añadir empty state, feedback correcto y textos humanos consistentes → Tickets portal cumple UX spec.
77. `[Vertrex-Website/src/app/portal/logout/route.ts]` → Integrar el cierre de sesión real también desde las páginas secundarias del portal si aparece botón salir → Todo el portal comparte logout consistente.
78. `[Vertrex-Website/src/app/portal/layout.tsx]` → Añadir `Toaster` light y asegurar consistencia de spacing/legibilidad → Portal completa la capa de feedback.

### Checkpoint Fase V2-5

79. `[Vertrex-Website]` → Ejecutar `npm run typecheck` → Debe terminar con 0 errores. Luego probar `/portal/login`, `/portal/[slug]`, `/portal/[slug]/files`, `/portal/[slug]/tickets`; confirmar login con error visible, logout real, tickets funcionales, legales visibles y subida de archivos con feedback. Si falla, no avanzar.

---

## Fase V2-6 — Quality gate, pruebas y cierre

80. `[Vertrex-Website/src/app/login/page.tsx]` → Mostrar error real por `?error=1` y mantener diseño consistente → El login interno deja de estar mudo cuando falla.
81. `[Vertrex-Website/e2e/auth.spec.ts]` → Ampliar pruebas para validar error login, redirecciones, logout portal y ausencia de 404 en rutas principales → Los flujos críticos quedan cubiertos.
82. `[Vertrex-Website/e2e/workspace.spec.ts]` → Añadir pruebas para `/os/links/[id]`, `/os/marketing/[id]`, `/os/projects/[id]`, `/os/hub/[id]` y otras rutas que estaban rotas o parciales → Se evita reintroducir rutas incompletas.
83. `[Vertrex-Website/e2e/ux-v2.spec.ts]` → Crear pruebas básicas para asegurar que existen `PageHeader`, `Toolbar` en listados, `EmptyState` cuando no hay datos y `Dialog/Sheet` en flujos principales → El quality gate deja de ser solo manual.
84. `[Vertrex-Website/docs/md/vertrex-os-v2-quality-gate.md]` → Completar el checklist de aprobación módulo por módulo durante la ejecución → El modelo barato tiene una definición de terminado concreta.
85. `[Vertrex-Website/docs/md/vertrex-os-ux-checklist.md]` → Actualizar el checklist global marcando el estado real después de cada módulo corregido → La auditoría y la corrección quedan sincronizadas.
86. `[Vertrex-Website/src/components/**/*]` → Buscar y eliminar affordances falsas: botones visibles que no hacen nada, CTA sin endpoint, navegación a rutas inexistentes → El producto deja de engañar visualmente al usuario.
87. `[Vertrex-Website/src/app/os/**/*` + `Vertrex-Website/src/app/portal/**/*]` → Buscar y reemplazar cualquier resto de “simulado”, “placeholder”, “JSON manual”, “vacío” o comportamiento meramente decorativo donde ya exista un requerimiento real → No quedan soluciones de maquillaje.

### Checkpoint Fase V2-6

88. `[Vertrex-Website]` → Ejecutar `npm run typecheck && npm run build` → Ambos deben terminar con 0 errores. Luego ejecutar pruebas e2e relevantes y completar `Vertrex-Website/docs/md/vertrex-os-v2-quality-gate.md` con aprobación de todas las rutas corregidas. Si falla, la V2 no se considera terminada.

---

## Resultado esperado final de esta V2

- No quedan rutas principales del PRD navegando a 404.
- No quedan APIs críticas expuestas sin auth real.
- Tickets portal funciona end-to-end.
- Logout portal elimina la sesión realmente.
- `EntitySidebar` y `EntityConnectSheet` dejan de ser decorativos.
- El Hub usa un editor rico real, no un `textarea` de JSON.
- Links tiene detalle con README viewer real.
- Marketing tiene detalle real.
- Settings deja de simular acciones críticas.
- Los módulos más importantes dejan de sentirse como scaffolds parciales y pasan a ser herramientas operativas reales.
