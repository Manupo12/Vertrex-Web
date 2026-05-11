# Vertrex OS & Portal V2: Auditoría Arquitectónica y Plan Maestro

**Fecha:** Mayo 2026
**Visión:** Evolucionar Vertrex OS de un "MVP funcional centralizado" a una "Plataforma Operativa en Tiempo Real e Inteligente" (V2).

Tras una inmersión a nivel de código (`actions`, `schema`, `UI components`), se ha detectado que el sistema actual posee una base sólida (autenticación, ruteo, unificación de repo), pero muchas de sus características "premium" operan de manera superficial (lecturas de snapshots en lugar de motores independientes).

Este documento expone la **auditoría profunda** y la ruta directa hacia **Vertrex OS V2**.

---

## 1. El Grafo Universal: De Enlaces Simples a Red Neuronal (Core)

El corazón de Vertrex OS es su grafo. Hoy en día, es funcional en base de datos (`entity_links`), pero aislado en la experiencia de usuario.

### 🔴 Estado Actual (Auditoría):
- **Desconexión UI/Backend:** La base de datos soporta enlaces bidireccionales, pero no existe una herramienta global de búsqueda de entidades (`searchEntitiesAction`), dejando a componentes como `EntityConnectSheet` inoperativos.
- **Relaciones Planas:** Todas las conexiones se asumen como `relates_to`. No hay semántica fuerte que dicte comportamiento (ej. "bloquea a", "depende de").
- **Visualización Pasiva:** `EntitySidebar` lista entidades, pero la prometida exploración gráfica en 2D (`ReactFlow`) es inexistente o inerte.

### 🚀 Visión V2:
1. **Buscador Neuronal Omnipresente:** Implementar un motor de búsqueda unificado y cacheado (con soporte de fuzzy search y tolerante a typos) que sirva tanto para conectar entidades como para el `Command Menu` (`Ctrl+K`).
2. **Semántica de Relaciones (N:M):** Expandir el tipo de relación en `entity_links`:
   - `depends_on` / `blocks` (Ideal para tareas y proyectos).
   - `duplicate_of` (Para tickets).
   - `parent_of` / `child_of` (Sub-tareas o sub-proyectos).
3. **Grafo Interactivo (ReactFlow Activo):** La vista de grafo no debe ser solo de lectura. El usuario debe poder arrastrar nodos (ej. arrastrar un Documento hacia un Cliente) para crear conexiones directamente en el lienzo visual.
4. **Sugerencias de IA:** El sistema debe sugerir conexiones automáticamente. *(Ej: "Notamos que este documento menciona a 'Cliente X', ¿deseas conectarlos?")*

---

## 2. El Portal de Clientes: De Visor a Espacio de Trabajo Colaborativo

El portal cumple su función básica de mostrar información, pero es unidireccional y reactivo.

### 🔴 Estado Actual (Auditoría):
- **Sincronización Manual:** Requiere recargar la página para ver nuevos mensajes, estados o archivos. (Usa fetching estándar sin Sockets/SSE).
- **Interacción Limitada:** Los clientes ven documentos, pero deben descargarlos. Los tickets son formularios planos.
- **Onboarding Friccionado:** Aunque el sistema usa un PIN limpio, la experiencia se siente estática y no guía al cliente no tecnológico.

### 🚀 Visión V2:
1. **Real-Time Sync (SSE / WebSockets):** El portal debe sentirse vivo. Los mensajes del chat, los cambios de estado en proyectos y los nuevos archivos deben aparecer instantáneamente usando Server-Sent Events o Pusher/Supabase.
2. **Visor de Documentos Integrado y E-Signature:** Implementar un visor nativo (PDF.js / iframe) para que los clientes lean facturas y contratos sin salir del portal. Integrar flujos de aprobación y firma electrónica simple.
3. **Pagos Embebidos:** Conectar directamente pasarelas de pago (Stripe/MercadoPago) a los *invoices* en el portal.
4. **Notificaciones Push y PWA:** Soporte para notificaciones push web y Progressive Web App, permitiendo al cliente instalar el portal en su celular como una app nativa.

---

## 3. Módulos Operativos: Madurez y Profundidad

### Knowledge Hub (Notas e Ideas)
- **Actual:** Es un editor rico (BlockNote), pero no es un "segundo cerebro". Falta autoguardado robusto y las menciones a repositorios (`@repo`) no están instrumentadas para buscar e instanciar en el grafo real.
- **V2:** Autoguardado silencioso (debounce), modo offline-first, y vectorización de notas (RAG) para que un LLM pueda responder preguntas basándose en la base de conocimiento interna.

### Gestión de Proyectos y CRM
- **Actual:** Kanban y listas funcionales. Pero faltan mecánicas de gestión real: sin tracking de tiempo, sin diagramas de Gantt, sin dependencias.
- **V2:** Diagramas de Gantt interactivos, Time-tracking embebido por tarea, y SLA (Service Level Agreements) visuales (temporizadores) para tickets de soporte.

### Hub de Enlaces y GitHub
- **Actual:** Indexación manual. Funciona, pero exige mucho trabajo manual.
- **V2:** Background Workers. Al pegar una URL, un worker en segundo plano visita la web, hace scraping seguro, la resume con IA, extrae los `meta tags` y sugiere etiquetas automáticamente.

---

## 4. Arquitectura y Rendimiento (Tech Stack V2)

Para soportar la V2 sin degradar la experiencia, la arquitectura debe evolucionar.

### 🔴 Estado Actual (Auditoría):
- **Sobrecarga de Renderizado:** Módulos pesados re-renderizan vistas enteras.
- **Mutaciones Lentas:** Esperar a que el servidor responda para actualizar la UI hace que el sistema se sienta pesado.
- **Bundling Monolítico:** Todos los componentes se envían al cliente.

### 🚀 Visión V2:
1. **Optimistic UI:** Todas las mutaciones (crear tarea, mover tarjeta kanban, enviar mensaje) deben actualizar el estado del cliente inmediatamente y resolverse en *background*, haciendo que el OS se sienta a 0ms de latencia.
2. **Virtualización (Windowing):** Listas como CRM, Tickets y Finanzas crecerán. Implementar virtualización (`@tanstack/react-virtual`) para listas de >50 elementos.
3. **Event-Driven Architecture:** Para automatizaciones, movernos de funciones lineales a colas de eventos (Redis / Vercel Inngest) para que acciones pesadas (generar PDFs, scraping, llamadas IA) no bloqueen el hilo principal.
4. **Lazy Loading Agresivo:** Modales, gráficas de ReactFlow y editores pesados como BlockNote deben cargarse bajo demanda (Dynamic Imports).

---

## 5. Inteligencia Artificial (OpenClaw) y Automatizaciones

El PRD habla de un CEO/COO virtual. Actualmente, es más un dashboard descriptivo que un agente prescriptivo.

### 🚀 Visión V2:
1. **Cola de Aprobaciones IA (Human-in-the-loop):** La IA propone cambios masivos (ej. "Mover estos 5 leads inactivos a archivo y enviarles un correo de reactivación"). El humano revisa y presiona "Aprobar".
2. **Agente Contextual Global:** Un chat asistente (OpenClaw) que siempre sabe en qué pantalla estás. Si estás viendo el Proyecto X, y escribes *"Resume los problemas"*, lee automáticamente los tickets y documentos de ESE proyecto sin tener que especificarlo.
3. **Playbooks de Automatización:** Constructor visual (If This Then That) para el equipo. *(Ej: "Si un Ticket lleva 48h en 'Open', enviar WhatsApp al equipo y marcar prioridad crítica".)*

---

## 6. Roadmap de Ejecución Maestro

Para transicionar de la V1 a la V2 de manera controlada y sin romper operaciones:

**Fase 1: Conectividad y Velocidad (Quick Wins - Sprints 1-2)**
- Implementar `searchEntitiesAction` y reparar el grafo (`EntityConnectSheet`).
- Añadir el `Command Palette (Ctrl+K)` global.
- Implementar Skeletons y UI Optimista en operaciones de Kanban y CRM.

**Fase 2: El Portal Vivo (Sprints 3-4)**
- Reestructuración del portal con WebSockets/SSE para chat y notificaciones.
- Integrar visor de PDFs embebido.
- Activity log/Timeline visible para el cliente (transparencia total).

**Fase 3: Profundidad Operacional (Sprints 5-6)**
- Refactor del Knowledge Hub: Autoguardado, Worker de Scraping para Links.
- Finanzas Avanzadas: Pasarelas de pago y soporte Multi-moneda.
- Proyectos V2: Gestión de dependencias en tareas y diagramas temporales.

**Fase 4: Vertrex OS Intelligence (Sprints 7+)**
- Despliegue de OpenClaw como Agente RAG.
- Implementación de la cola de aprobaciones de IA.
- Automatizaciones por eventos (Event-Driven Playbooks).