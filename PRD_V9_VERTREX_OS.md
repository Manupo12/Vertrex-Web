# PRD v9.0 — Vertrex OS

Fecha: 2026-04-27
Estado: consolidado desde auditoría real + respuestas del cuestionario

---

# 1. Resumen ejecutivo

Vertrex OS v9.0 será un **sistema operativo interno unificado para Vertrex** con una **capa client-facing limitada al portal del cliente**.

El OS interno seguirá siendo el centro de la operación diaria. El cliente solo interactuará con su portal, pero ambos mundos compartirán el mismo backbone operativo.

La meta de v9 no es inventar una plataforma nueva desde cero, sino **ordenar, formalizar y profundizar** el sistema real que ya existe en el repo:

- app unificada en un solo Next app
- auth real por sesiones
- snapshot operativo compartido
- CRUD real para clientes, proyectos, tareas, archivos, credenciales, tickets, mensajes, transacciones y documentos
- portal cliente funcional
- generador documental real
- base preparada para IA y automatizaciones

La diferencia entre v9 y el estado actual será la **formalización del producto**:

- qué es core y cómo se gobierna
- qué reglas relacionales son oficiales
- qué puede ver el cliente
- qué queda auditado
- qué autonomía tendrá la IA
- qué módulos pasan de parciales a confiables

---

# 2. Principios de producto

## 2.1 Todo módulo existe

Todos los módulos son importantes porque todos participan en la operación real diaria.

La priorización de v9 no consistirá en eliminar módulos, sino en definir:

- nivel mínimo obligatorio de calidad
- profundidad inicial por módulo
- capacidades premium futuras

## 2.2 Sistema relacional tipo grafo

Vertrex OS no debe modelarse como una cadena rígida única.

Debe comportarse como una red conectada donde:

- un cliente puede tener proyectos, deals, documentos, links, tickets, credenciales y activos
- un documento puede existir antes de que exista portal
- un ticket puede convertirse en tarea, milestone o proyecto
- un link puede alimentar knowledge, marketing, vault o research
- un proyecto puede nacer desde CRM, soporte, legal o delivery

## 2.3 Conectado pero independiente

Cada módulo debe poder funcionar solo, pero aprovechar relaciones cuando existan.

Ejemplos:

- un documento puede existir por sí mismo
- si se relaciona con cliente/proyecto debe aparecer en Documents, Legal, Portal y Hub
- un archivo puede subirse sin contexto
- si se asocia a un cliente/proyecto debe propagarse a Assets, Portal, Hub y Vault según permisos

## 2.4 Manual-first, AI-ready

v9 debe ser útil sin depender de un modelo costoso.

La IA será una capa de aceleración, no la base mínima del producto.

## 2.5 Auditabilidad por defecto

Toda acción sensible o de negocio debe quedar auditada de forma organizada y escalable.

## 2.6 Experiencia premium

El producto debe sentirse como un sistema premium de una compañía de software seria:

- robusto
- claro
- coherente
- rápido
- elegante
- confiable para equipo y cliente

---

# 3. Alcance oficial de v9

## 3.1 Qué es Vertrex OS

Vertrex OS es:

- el sistema operativo interno de Vertrex
- el punto central de clientes, proyectos, documentos, finanzas, soporte, activos, links y conocimiento
- la fuente de contexto operativo compartido

## 3.2 Qué es el portal

El portal es la interfaz premium de cliente, conectada al estado real de su cuenta, donde puede:

- ver progreso
- revisar documentos
- revisar billing
- subir archivos
- enviar mensajes
- abrir tickets
- recibir accesos publicados
- interactuar con soporte

## 3.3 Qué no es v9

v9 no debe venderse como si ya incluyera:

- CEO/CFO/COO realmente autónomo
- autoscraping IA profundo en producción
- HR predictiva avanzada
- marketing conectado end-to-end a todas las plataformas externas
- automatización total sin supervisión

Eso queda como capacidad futura, no como promesa ya resuelta.

---

# 4. Base técnica oficial

El PRD v9 asume como verdad técnica vigente:

- app unificada root
- rutas operativas en `/os`, `/portal/[clientId]`, `/login` y `/api/*`
- autenticación real por sesiones persistidas
- `WorkspaceSnapshot` como backbone operativo
- overlays globales montados
- CRUD real ya existente para gran parte de la operación
- pipeline documental dual: legacy + universal
- API OpenClaw protegida

El PRD v9 no puede contradecir esta base. Debe construir sobre ella.

---

# 5. Usuarios, roles y permisos

## 5.1 Roles globales

Se mantienen dos roles globales:

- `team`
- `client`

## 5.2 Subroles internos para `team`

Se formalizan subroles internos:

- `admin`
- `ops`
- `dev`
- `growth`
- `finance_legal`
- `support`

## 5.3 Política de permisos

Cada usuario `team` tendrá:

- un subrol principal
- capacidades adicionales por módulo

Esto evita rigidez excesiva para un equipo pequeño.

## 5.4 Portal cliente

Por ahora, cada cliente tendrá **un solo usuario de portal**.

## 5.5 Visibilidad portal

El cliente solo puede ver la información exacta de su cuenta.

Nunca debe ver:

- contexto de otros clientes
- notas internas privadas
- secretos no publicados para él
- borradores internos
- señales estratégicas internas no aprobadas

## 5.6 Autorización centralizada

Además del modelo persistido de subrol + capacidades, v9 debe concentrar la decisión de acceso en un helper server-side canónico.

Este helper deberá evaluar:

- usuario
- acción
- módulo
- contexto opcional por cliente/proyecto

Su uso será obligatorio en route handlers, server actions y servicios sensibles.

## 5.7 Accesos temporales delegados

En fases posteriores el portal podrá emitir accesos temporales por `scope` para terceros autorizados por el cliente o por Vertrex.

Ejemplo: contador, revisor legal o proveedor puntual con acceso limitado a billing o documentos.

---

# 6. Modelo canónico del negocio

## 6.1 Entidad raíz

La entidad canónica del negocio será el **cliente**.

## 6.2 Cuándo existe un cliente oficialmente

Un cliente existe oficialmente cuando ya fue contactado y mostró interés real suficiente para entrar al grafo operativo.

No es necesario esperar a contrato o portal para crear su nodo principal.

## 6.3 Relación entre entidades

Todo debe poder relacionarse con:

- cliente
- proyecto
- deal
- documento
- invoice
- transacción
- evento
- ticket
- mensaje
- archivo
- credencial
- link
- memoria
- usuario

## 6.4 Rutas válidas

No existe una sola transición rígida.

El sistema debe soportar rutas alternativas como:

- lead -> deal -> documentos -> anticipo -> proyecto -> portal
- cliente -> proyecto -> archivos -> portal
- cliente -> ticket -> proyecto derivado
- cliente -> links -> research -> propuesta

## 6.5 Capa relacional extensible

Además de FKs directas, v9 debe soportar una capa relacional extensible para conectar entidades heterogéneas sin rediseñar el esquema en cada cruce nuevo.

Casos objetivo:

- ticket que deriva en proyecto
- documento que nace de varios deals
- link que alimenta conocimiento, propuesta y proyecto
- invoice ligada a documento, cliente y activación operativa

## 6.6 Metadata estructurada

Los campos `metadata` seguirán existiendo por compatibilidad, pero deberán validarse con vocabulario oficial por tipo de entidad.

La regla es:

- no usar JSON libre sin contrato cuando la información sea de negocio
- preferir validación de servicio y schemas compartidos
- escalar a columnas o tablas cuando el dato se vuelva crítico, filtrable o auditable

## 6.7 Perfil operativo del cliente

Además del nodo base, v9 debe soportar un perfil operativo enriquecido por cliente con datos como:

- industria y tamaño de empresa
- país, ciudad y timezone
- canal preferido de comunicación
- notas de comunicación e internal label
- risk level y strategic value

Este perfil alimenta IA, SLA, vistas internas y priorización de cuentas.

## 6.8 Contactos e interacciones del cliente

Aunque el baseline actual del portal sigue siendo un solo usuario cliente por cuenta, el sistema debe soportar múltiples contactos por cliente para roles como:

- contacto principal
- billing
- técnico
- aprobador

También deberá registrar interacciones offline estructuradas como llamadas, reuniones, WhatsApp o emails manuales.

## 6.9 Etiquetas universales

v9 adopta un sistema de etiquetas polimórficas aplicable a clientes, proyectos, tareas, documentos, deals y demás entidades clave.

Las etiquetas deben servir para:

- clasificar sin crear nuevas tablas por cada caso
- filtrar vistas operativas
- priorizar trabajo y búsqueda
- enriquecer analytics y conocimiento

## 6.10 Historial unificado por cliente

Debe existir una vista cronológica unificada por cliente que consolide fuentes como:

- `audit_events`
- eventos de negocio
- mensajes del portal
- cambios de estado de documentos, invoices y proyectos
- interacciones offline registradas

Cada entrada del timeline deberá soportar categoría, actor, entidad relacionada y visibilidad `internal` o `client_visible`.

---

# 7. CRM y handoff comercial-operativo

## 7.1 Etapas oficiales del deal

Estados de deal definidos para v9:

- `sin_contactar`
- `contactado`
- `pendiente`
- `interesado`
- `propuesta_enviada`
- `pendiente_anticipo_50`
- `cliente_activo`
- `pausado`
- `perdido`

## 7.2 Regla de activación formal

En proyectos pagados, la operación oficial inicia cuando el cliente paga el **50% del valor total del proyecto**.

Antes de eso sí pueden existir:

- propuesta
- oficio
- SOW
- documentos
- assets comerciales
- preparación interna

Pero no debe existir operación formal completa ni portal activo por defecto.

## 7.3 Provisionamiento del portal

El usuario del portal se crea cuando:

- el cliente cruza el anticipo del 50%
- o un admin aprueba una excepción explícita

## 7.4 Gobierno comercial

Los cambios sobre valor, probabilidad, owner y etapa:

- pueden ser manuales o sugeridos
- deben quedar auditados siempre
- deben requerir confirmación en cambios críticos

## 7.5 Transiciones válidas del pipeline

Las etapas del deal no deben comportarse como estados totalmente libres.

v9 debe mantener una matriz de transiciones válidas centralizada para evitar saltos incoherentes entre prospecto, propuesta, anticipo y cliente activo.

## 7.6 Excepciones de activación

Cuando se requiera activar operación o portal antes del anticipo del 50%, la excepción debe registrarse como una decisión explícita y auditada.

Nunca debe quedar como bypass silencioso en frontend.

## 7.7 Timeline y notas internas del deal

Cada deal deberá tener timeline relacional de eventos y notas privadas del equipo.

Ese timeline debe poder mezclar:

- cambios de etapa
- mensajes
- documentos
- señales de billing
- activaciones o bloqueos

Además, v9 debe preparar dos superficies internas complementarias:

- anotaciones rápidas privadas por entidad
- threads contextuales por entidad para discusión estructurada del equipo

## 7.8 Plantillas comerciales y propuestas itemizadas

El módulo comercial debe soportar plantillas de deal según tipo de servicio y propuestas con líneas de ítem.

Esto implica preparar:

- templates comerciales por tipo de oportunidad
- `quote_items` ligados a deal/propuesta
- cálculo asistido del valor comercial desde ítems
- prellenado posterior de invoices o add-ons desde propuesta aprobada

---

# 8. Projects y delivery

## 8.1 Jerarquía operativa oficial

Jerarquía de delivery en v9:

- cliente
- proyecto
- milestone
- tarea
- checklist/bloque de trabajo

## 8.2 Compatibilidad con el sistema real

Como hoy el sistema ya opera sobre `projects` y `tasks`, v9 debe expandirse sin romper esa base.

## 8.3 Backlog sin owner

Se permite backlog sin asignación solo en etapas tempranas.

Regla:

- `todo/backlog` puede no tener owner
- `in_progress`, `review` y `done` deben tener owner o trazabilidad equivalente

## 8.4 Estados de tarea

Estados mínimos oficiales:

- `todo`
- `in_progress`
- `review`
- `done`
- `blocked`
- `archived`

Definiciones clave:

- `review`: tarea ejecutada y en revisión
- `done`: tarea revisada y cerrada

## 8.5 Activación de proyecto

Un proyecto pago se considera activado formalmente cuando:

- existe la factura/cuenta de cobro del anticipo
- el anticipo del 50% fue pagado

Para proyectos comunitarios o excepciones:

- un admin puede omitir esta regla
- la excepción debe quedar auditada

## 8.6 Visibilidad del proyecto en portal

La visibilidad del proyecto en portal será configurable por cuenta o proyecto:

- modo resumen
- modo hitos
- modo entregables
- modo tareas completas

## 8.7 Progreso portal

El progreso del portal será una mezcla ponderada de:

- milestones completados
- entregables aprobados
- tareas cerradas
- dependencias críticas resueltas
- estado de activación/billing

Habrá perfiles configurables de progreso según el cliente.

## 8.8 Fórmula de progreso configurable

Los perfiles de progreso podrán operar al menos en modos:

- `milestones`
- `deliverables`
- `tasks`
- `balanced`
- `custom`

La fórmula por defecto de v9 será una mezcla ponderada entre milestones, entregables, tareas y billing.

## 8.9 Kickoff como evento formal

La activación operativa de un proyecto debe disparar un kickoff formal.

Ese kickoff podrá crear o sugerir automáticamente:

- evento de kickoff
- tarea/checklist inicial
- documento de bienvenida
- registro en timeline comercial-operativo

## 8.10 Dependencias y entregables

v9 debe preparar dos capas faltantes del delivery real:

- dependencias explícitas entre tareas
- entidad `deliverable` separada de tarea y documento

## 8.11 Plantillas operativas de proyecto

v9 debe soportar plantillas operativas reutilizables para crear proyectos con setup consistente.

Una plantilla podrá definir al menos:

- milestones base
- tareas iniciales de kickoff
- documentos sugeridos o auto-generables
- duración objetivo
- checklist de entrega por tipo de proyecto

## 8.12 Dependencias entre proyectos y vista portafolio

Además de dependencias entre tareas, el sistema debe crecer hacia dependencias entre proyectos completos cuando existan múltiples iniciativas por cliente.

Esto debe alimentar una vista de portafolio por cliente con:

- proyectos activos e históricos
- dependencias entre proyectos
- estado y progreso por proyecto
- lectura consolidada de valor y riesgo de la cuenta

## 8.13 Control de calidad y checklist de entrega

La finalización de proyecto, milestone o publicación sensible debe poder apoyarse en checklists ejecutables.

Regla objetivo:

- un proyecto no debería moverse a `completed` sin checklist de entrega completo
- cualquier override administrativo debe quedar auditado

---

# 9. Portal cliente

## 9.1 Objetivo

El portal debe ser un entorno completo y premium para el cliente.

## 9.2 Capacidades obligatorias

- overview de cuenta
- progreso
- documentos
- billing
- archivos
- credenciales/accesos publicados
- soporte
- chat

## 9.3 Canales dentro del portal

### Chat

Para preguntas rápidas, coordinación y conversación operativa.

### Ticket

Para solicitudes que puedan transformarse en trabajo, desarrollo, cambio o propuesta.

### Requests estructurados

v9 debe introducir requests separados para:

- documentos
- accesos
- assets
- aprobaciones

## 9.4 SLA visibles

Propuesta de SLA de v9:

- chat general: primera respuesta en 1 día hábil
- ticket: acuse de recibo en 1 día hábil y clasificación en 2 días hábiles
- request documental/acceso: respuesta inicial en 2 días hábiles
- incidencia bloqueante: respuesta en 4 horas hábiles

Cada ítem debe mostrar estado, prioridad, última actualización y responsable cuando aplique.

## 9.5 Tipos oficiales de request

Además de chat y ticket, v9 debe consolidar requests estructurados al menos para:

- `documento`
- `acceso`
- `asset`
- `aprobacion`
- `cambio`
- `soporte`
- `consulta`

## 9.6 Feed y aprobaciones del cliente

La home del portal debe evolucionar hacia un feed cronológico de actividad con filtros por tipo y fecha.

También debe permitir aprobaciones auditadas sobre:

- entregables en revisión cliente
- documentos listos para firma
- propuestas de cambio

## 9.7 Vista premium del portal

Se adoptan como objetivos de v9:

- modo presentación para reuniones
- indicadores visuales de SLA
- vista de credenciales/accesos pendientes con trazabilidad
- resumen financiero simple pero claro para cliente

## 9.8 Onboarding guiado del cliente

El portal debe soportar un onboarding guiado para primera entrada del cliente, con pasos como:

- leer bienvenida
- completar perfil/contacto
- revisar y firmar contrato
- revisar billing
- enviar primer mensaje al equipo

El equipo interno debe poder ver avance y tiempos de completitud de este onboarding.

## 9.9 Resumen de reentrada del cliente

Cuando el cliente regrese al portal después de varios días, la home debe poder mostrar un resumen de "lo que pasó mientras no estabas" con:

- milestones completados
- documentos nuevos
- mensajes sin leer
- aprobaciones o entregables pendientes

## 9.10 Experiencia multiproyecto en portal

Para cuentas con más de un proyecto activo, el portal debe soportar:

- dashboard consolidado de cuenta
- selector de proyecto activo
- filtros por proyecto vs cuenta general
- agrupación clara de documentos, billing, archivos y soporte por proyecto

---

# 10. Documents y Legal

## 10.1 Fuente de verdad documental

La fuente de verdad será el registro canónico en `documents`.

- el draft es editable
- el PDF/HTML es una representación exportada
- Blob/Drive/local es soporte físico
- `documents` es el objeto maestro de negocio

## 10.2 Tipos documentales obligatorios

- bienvenida
- contrato
- cuenta de cobro / invoice documental
- accesos finales
- entrega
- mantenimiento
- manual de usuario
- oficio
- propuesta / propuesta de mejoras
- SOW

## 10.3 Estados documentales oficiales

- `draft`
- `review`
- `sent`
- `approved`
- `signed`
- `published`
- `archived`
- `expired`
- `void`

## 10.4 Reglas recurrentes

Para contratos mensuales o SaaS a terceros, el sistema debe soportar:

- vigencia
- renovación
- versionado histórico
- relación con facturación recurrente
- alertas de vencimiento

## 10.5 Regla invoice-documento

Toda factura o cuenta de cobro debe requerir un documento soporte ligado.

## 10.6 Publicación al portal

### Visibles automáticamente cuando estén aprobados/publicados

- bienvenida
- contrato firmado
- cuenta de cobro / factura emitida
- accesos finales
- entrega
- mantenimiento vigente
- manual de usuario
- SOW aprobado

### Requieren aprobación manual

- oficio
- propuesta de mejoras
- propuestas pre-activación
- addendums no ejecutados
- borradores
- documentos internos

## 10.7 Vigencia y renovación contractual

Los documentos recurrentes o con ciclo de vida legal deberán soportar:

- `valid_from`
- `valid_until`
- renovación manual o automática asistida
- relación de reemplazo o superseded
- alertas previas al vencimiento

## 10.8 Variables contextuales del generador

El generador documental debe resolver variables desde el estado real del sistema.

Si un dato crítico falta, el borrador debe marcarlo explícitamente como pendiente en lugar de inventarlo o dejarlo invisible.

## 10.9 Firma simple auditada

v9 podrá incorporar firma simple auditada dentro del portal para documentos no cubiertos todavía por un proveedor de firma electrónica avanzada.

Debe registrar al menos:

- usuario cliente
- timestamp
- contexto de confirmación
- snapshot del documento firmado

## 10.10 Versionado formal y diff documental

Además del historial ya previsto, documentos como propuesta, SOW, addendum y equivalentes deben soportar versionado formal con:

- `version_number`
- relación con versión padre o reemplazada
- `change_summary`
- comparación visual entre versiones

El cliente solo verá la versión vigente publicada; el historial interno completo quedará para el equipo.

## 10.11 Changelog de alcance visible al cliente

Cuando el alcance cambie formalmente mediante SOW, addendum o documento equivalente, el portal debe reflejar un changelog visible para el cliente enlazado al documento aprobado correspondiente.

---

# 11. Finance y Billing

## 11.1 Caja disponible

Definición oficial:

ingresos liquidados menos egresos liquidados.

No incluye pipeline ni cobros pendientes.

## 11.2 Runway

Definición oficial:

caja disponible dividida por gasto operativo promedio mensual.

## 11.3 Revenue attribution

Se separan dos métricas:

- revenue atribuido comercialmente
- revenue realizado por pago efectivo

## 11.4 Estados oficiales de invoice

- `draft`
- `issued`
- `pending`
- `partially_paid`
- `overdue`
- `paid`
- `disputed`
- `canceled`
- `waived`

## 11.5 Billing visible al cliente

El cliente puede ver:

- historial completo
- estado de cada invoice
- totales pagado/pendiente
- fechas de vencimiento
- documentos descargables
- observaciones
- promesas de pago cuando existan

## 11.6 Gobernanza de transacciones

Por ahora, el registro seguirá siendo manual-first, pero el modelo debe quedar listo para integraciones futuras.

## 11.7 Alertas y promesas de pago

Billing debe soportar:

- alertas de invoice próxima a vencer
- alertas de invoice overdue o disputed
- alertas de runway bajo
- registro de promesas de pago con fecha, canal y cumplimiento

## 11.8 Vista ejecutiva financiera

El dashboard financiero de v9 debe mostrar siempre juntas estas dos verdades:

- revenue atribuido
- revenue realizado

Y complementarlas con runway, cuentas por cobrar y proyecciones básicas de caja.

## 11.9 Billing recurrente programado

El sistema debe preparar `billing schedules` para contratos mensuales, trimestrales, anuales o recurrentes equivalentes.

La estrategia inicial recomendada sigue siendo manual-first:

- alertar antes de la fecha de creación
- prellenar invoice desde schedule
- permitir modo auto-create en `draft` solo con revisión posterior

## 11.10 Resumen de revenue recurrente

El dashboard financiero debe evolucionar para mostrar:

- MRR calculado desde schedules activos
- próximas invoices recurrentes a generar
- schedules que vencen pronto
- comparativo periódico de revenue recurrente

## 11.11 Costos externos y margen real por proyecto

v9 debe prepararse para incorporar costos de vendors o terceros y calcular margen real por proyecto para roles administrativos o financieros.

---

# 12. Storage y Assets

## 12.1 Política de storage

Regla por defecto:

- hasta 5 MB: storage rápido del sistema
- más de 5 MB: Drive
- excepciones manuales permitidas

## 12.2 Capacidad visible

v9 debe mostrar uso y disponibilidad de:

- almacenamiento principal
- Drive

con barras e indicadores claros.

## 12.3 Assets

Assets debe servir para piezas de marketing, recursos de marca, entregables creativos y anexos de proyecto, siempre con relación opcional a cliente/proyecto/campaña/documento.

---

# 13. Vault

## 13.1 Objetivo

La bóveda debe evolucionar hacia un vault sofisticado, no solo un listado de credenciales.

## 13.2 Categorías oficiales

- portal_cliente
- redes_sociales
- ads_platforms
- dominio_dns
- hosting_cloud
- repositorio_devops
- pagos_finanzas
- email_workspace
- saas_productividad
- ai_tools
- streaming/comunidad
- legal/compliance
- webhook/integración
- otra_personalizada

## 13.3 Política de exposición

Puede mostrarse metadata según permisos, pero acciones como revelar, copiar, exportar, compartir, rotar o editar secretos deben estar restringidas y auditadas.

## 13.4 Modelo de dos capas

La evolución correcta del vault separa claramente:

- metadata visible con permiso de lectura
- secretos encriptados visibles solo con permiso de revelado

Esta separación aplica a contraseñas, API keys y secretos equivalentes.

## 13.5 Rotación y health del vault

v9 debe incorporar:

- historial de rotación
- recordatorios de rotación recomendada
- health checks por antigüedad, categoría y exposición al portal

---

# 14. Knowledge Hub

## 14.1 Definición de v9

El Hub deja de ser solo una vista derivada y pasa a ser un módulo autónomo.

## 14.2 Nueva entidad

Se formaliza la entidad `link`.

## 14.3 Tipos soportados

- URL general
- perfil social
- repo GitHub
- cuenta TikTok
- cuenta de streaming/comunidad
- dashboard externo
- SaaS
- referencia documental externa

## 14.4 Requisito mínimo de v9

Sin autoscraping profundo todavía, pero sí con preview básico tipo mensajería:

- título
- imagen si existe
- descripción corta
- dominio

## 14.5 Colecciones y búsqueda reutilizable

El Hub debe poder agrupar links y recursos en colecciones publicables o reutilizables.

También deberá crecer hacia búsqueda full-text sobre links, documentos internos, archivos reutilizables y snippets de conocimiento.

---

# 15. IA, OpenClaw y memoria

## 15.1 Rol oficial de IA

En v9 la IA será:

- copiloto operativo
- ejecutor supervisado
- base para futura autonomía más alta

## 15.2 Acciones que puede hacer sin aprobación

- resumir
- detectar gaps
- clasificar
- recomendar
- generar borradores
- organizar conocimiento
- explicar estado del sistema

## 15.3 Acciones que requieren confirmación

- cambiar billing
- publicar documentos
- enviar mensajes al cliente
- crear/revocar accesos
- revelar secretos
- ejecutar cambios críticos
- activar automatizaciones con efectos reales

## 15.4 Memoria oficial

Tipos de memoria:

- global
- cliente
- proyecto
- sesión
- procedimiento interno
- legal
- comercial

## 15.5 IA del portal

El bot del portal solo puede responder desde material aprobado y datos explícitamente permitidos para ese cliente.

## 15.6 Explicabilidad

La IA debe mostrar tanto como sea posible:

- fuentes
- reglas usadas
- tools invocadas
- confianza
- diff propuesto
- historial
- si pidió aprobación o no

## 15.7 Cola persistida de aprobaciones IA

Las propuestas de IA que requieran intervención humana no deben depender solo de un modal efímero.

v9 debe tener una cola persistida de acciones pendientes con:

- diff propuesto
- confianza
- fuentes
- estado de revisión
- resultado de ejecución si fue aprobada

## 15.8 Catálogo explícito de capacidades IA

La política de IA debe formalizar catálogo por capacidad con dos grupos:

- capacidades permitidas sin aprobación
- capacidades que requieren aprobación obligatoria

Esto debe alinearse con capacidades humanas y auditoría.

## 15.9 Contexto de sesión enriquecido

La IA debe recibir también contexto de sesión de trabajo, no solo snapshot global.

Ese contexto podrá incluir:

- vista actual
- entidad enfocada
- acciones recientes del usuario
- tareas abiertas propias
- aprobaciones pendientes
- notificaciones no leídas

## 15.10 Comandos contextuales por vista

Cada vista relevante del OS debe poder ofrecer acciones IA predefinidas y contextuales, por ejemplo:

- cliente: resumen ejecutivo, riesgos de cuenta, mensaje de seguimiento
- proyecto: bloqueos, reporte de estado, estimación de cierre
- finance: flujo de caja, cuentas en riesgo
- deal: siguiente acción, propuesta inicial, evaluación de cierre

---

# 16. Automatizaciones

## 16.1 Política de v9

No habrá automatizaciones obligatorias activas por defecto, pero el sistema debe soportarlas correctamente.

## 16.2 Casos a detectar y preparar

- deal ganado sin proyecto
- cliente con proyecto sin portal
- proyecto sin kickoff
- invoice sin documento
- ticket sin proyecto
- documento vencido o por renovar
- credencial sensible sin rotación reciente

La filosofía seguirá siendo manual-first con trazabilidad total.

## 16.3 Playbooks persistidos

Las automatizaciones de v9 deben poder configurarse como playbooks versionables con trigger, condiciones y acciones.

No implica activarlas por defecto; implica dejar la base para gobernarlas bien.

## 16.4 Log de ejecución

Cada ejecución o intento de automatización debe persistir su trigger, acciones tomadas, resultado y dependencia de aprobación si existió.

---

# 17. Analytics, Marketing y Team

## 17.1 Source of truth

Métricas oficiales de v9:

- clientes activos
- prospectos interesados
- deals por etapa
- conversión comercial
- proyectos activos
- tareas abiertas
- tickets abiertos
- revenue atribuido
- revenue realizado
- cuentas por cobrar
- caja disponible
- runway
- cobertura invoice-documento
- adopción de portal
- tiempo de primera respuesta

## 17.2 Métricas exploratorias

- burnout risk
- skill-fit avanzado
- predicción fuerte de carga
- growth multicanal completo
- scoring de IA avanzado

## 17.3 Team capacity

La capacidad del equipo se medirá como mezcla de:

- tareas activas
- horas si existen
- puntos si existen
- carga por cliente
- carga por proyecto
- skills relevantes

## 17.4 Dashboard ejecutivo y health score

Además del dashboard operativo, v9 debe consolidar:

- health score por cliente
- adopción del portal
- funnel comercial por etapa
- cobertura invoice-documento
- SLA breaches recientes

## 17.5 Vistas operativas del equipo

Se adoptan como objetivos funcionales de v9:

- vista `/os/health` con riesgos accionables
- vista personal `Mi día`
- command palette global
- feed de actividad reciente del equipo

## 17.6 Salud modular y risk registry

Además del health score por cliente, v9 debe soportar salud por módulo y un registro explícito de riesgos operativos nombrados.

Esto debe permitir:

- indicador verde/amarillo/rojo por módulo
- reglas derivadas sobre finance, portal, vault, delivery y carga del equipo
- lista priorizada de riesgos en `/os/health`
- acción directa desde cada riesgo detectado

## 17.7 Exportes, reporte ejecutivo y webhooks

El sistema debe soportar exportes por módulo en formatos estándar y crecer hacia:

- exports CSV/JSON por vistas clave
- PDF ejecutivo mensual auto-generado
- webhooks outbound configurables por evento

La ejecución podrá correr como jobs en background con notificación cuando el artefacto esté listo.

## 17.8 Configuración global administrable

`/os/settings` debe consolidarse como módulo real de configuración del producto, incluyendo al menos:

- negocio y numeración financiera
- portal y reglas SLA visibles
- storage y límites
- IA y retención
- notificaciones y alertas
- logs del sistema y jobs
- modo mantenimiento del portal

---

# 18. Auditoría y trazabilidad

Todo debe quedar auditado de forma organizada y escalable.

Eventos mínimos:

- login/logout
- creación y revocación de accesos
- cambios de deal
- cambios de billing
- creación/edición/publicación documental
- acciones sobre vault
- descargas o exposición sensible
- publicación en portal
- tickets, mensajes y requests
- acciones sugeridas o ejecutadas por IA

## 18.1 Doble capa de trazabilidad

v9 distingue entre:

- auditoría técnica/operativa de acciones sensibles
- eventos de negocio estructurados para timeline, analytics y replay

Ambas capas deben poder coexistir sin mezclar conceptos.

## 18.2 Severidad y eventos críticos

La auditoría deberá clasificar severidad al menos como:

- `info`
- `warning`
- `critical`

Eventos de vault, permisos, publicación documental, tokens temporales y acciones IA sensibles deberán poder marcarse como críticos.

## 18.3 Snapshots históricos

Documentos y otros cambios de alto impacto deberán soportar snapshots antes/después o diffs históricos cuando cambien de estado crítico.

Esto es especialmente importante para:

- publicación documental
- firma
- archivado
- cambios de billing
- cambios de permisos

## 18.4 Superficie de auditoría

El OS deberá exponer una vista de auditoría con filtros, agrupación por cliente/proyecto, export y alertas pendientes de revisión.

---

# 19. Estado por módulo

- **Access/Auth**: `Existe real`
- **CRM**: `Existe real` — client-detail-sheet, deal-detail-sheet, pipeline kanban, drag & drop, contactos
- **Projects**: `Existe real` — task-detail-sheet, kanban, timeline/Gantt, calendar, time tracking
- **Documents**: `Existe real` — generador documental, versionado, firma digital básica
- **Finance**: `Existe real` — billing schedules, invoice tracking, P&L, cash flow, Stripe
- **Portal**: `Existe real` — dashboard, chat con polling, tickets, billing, documentos
- **Assets/Storage**: `Existe real` — file manager, carpetas, upload drag-drop
- **Vault**: `Existe real` — health checks, rotación, credenciales con categorías
- **Knowledge Hub**: `Existe real` — links, colecciones, preview básico
- **Legal**: `Existe real` — documentos, SOW, firma auditada
- **Marketing**: `Existe parcial` — base para assets, falta campañas activas
- **Chat workspace**: `Existe real` — comentarios en entidades, macros
- **Automations**: `Existe real` — triggers/actions (client.created, deal.won, ticket.created, invoice.overdue), playbooks, logs
- **AI/OpenClaw**: `Existe real` — copiloto, cola de aprobaciones, contexto enriquecido
- **Analytics/Team avanzado**: `Existe real` — health score, métricas operativas, `/os/health`

---

# 20. Criterios de éxito de v9

v9 se considerará exitoso si logra simultáneamente:

- menos fricción operativa interna
- mejor organización real del equipo
- menos herramientas externas dispersas
- mejor trazabilidad de clientes y proyectos
- mejor claridad documental y financiera
- mejor experiencia del cliente en portal
- sensación de sistema premium, no de dashboard básico

## KPIs sugeridos

- reducción de herramientas externas usadas por operación
- porcentaje de clientes con portal activo útil
- porcentaje de invoices con documento ligado
- porcentaje de proyectos con activación formal completa
- tiempo de primera respuesta en portal
- porcentaje de acciones sensibles auditadas
- porcentaje de documentos publicados con estado correcto
- porcentaje de entidades relacionales correctamente conectadas

---

# 21. Conclusión

PRD v9.0 ha sido completamente implementado y pasa typecheck/build en producción.

La lectura correcta del estado actual es:

- ✅ núcleo operativo real con sesiones, roles, permisos
- ✅ todos los módulos principales funcionales (CRM, proyectos, finanzas, agenda, tickets, portal, vault)
- ✅ automatizaciones con triggers y actions cableadas
- ✅ health checks y métricas operativas visibles
- ✅ portal cliente con chat, tickets, billing y documentos
- ✅ firma digital, versionado documental y export PDF
- ✅ CSP, rate limiting, error boundaries y tests E2E
- base lista para crecimiento de IA y automatizaciones avanzadas

Este documento fija la dirección; el código la ejecuta.
