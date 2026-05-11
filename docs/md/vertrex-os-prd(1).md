# PRD — Vertrex OS
**Versión:** 1.1  
**Fecha:** Mayo 2026  
**Autor:** Vertrex  
**Idioma del sistema:** Español  
**Moneda:** Peso colombiano (COP)  
**Estado:** Listo para implementación

---

## 1. Visión General

Vertrex OS es un sistema operativo empresarial interno para el equipo de Vertrex, construido sobre la misma base de código que la landing page pública de la empresa. Su propósito es centralizar la gestión de clientes, proyectos, documentos, finanzas, agenda y recursos en una sola plataforma cohesionada, con un modelo de datos en **grafo** que permite conectar cualquier entidad con cualquier otra.

El sistema también expone un **Portal de Clientes** — una interfaz simplificada, accesible y sin fricción — donde los clientes pueden ver el estado de sus proyectos, documentos, finanzas y agenda, y subir archivos o enviar tickets de soporte.

### Principios de diseño
- **Todo se conecta con todo:** El grafo es la columna vertebral del sistema.
- **Sin fricción para el cliente:** El portal está diseñado para personas mayores con baja adopción tecnológica (letras grandes, alto contraste, flujos simples).
- **Almacenamiento inteligente:** Archivos < 1.5 MB se guardan en Neon DB. Archivos ≥ 1.5 MB se suben a Google Drive del equipo.
- **Un solo repositorio:** El OS vive en el mismo repo que la landing pública de Vertrex.

---

## 2. Arquitectura de Datos — El Grafo Universal

### 2.1 Concepto
Cada entidad del sistema (cliente, proyecto, documento, recurso, finanza, evento, link, ticket, nota) tiene un `id` único y un `type`. La tabla `entity_links` registra relaciones bidireccionales entre cualquier par de entidades.

### 2.2 Tabla central: `entity_links`
```
id          uuid PK
source_id   uuid NOT NULL
source_type entity_type NOT NULL
target_id   uuid NOT NULL
target_type entity_type NOT NULL
relation_type text NOT NULL default('relates_to')
created_at  timestamp NOT NULL
```

**Índices:** `(source_id, source_type)` y `(target_id, target_type)`

### 2.3 Tipos de entidad (`entity_type` enum)
`client | project | document | resource | finance | agenda | link | repository | ticket | note | idea | legal | social_account | team_member`

### 2.4 Reglas del grafo
- Cualquier entidad puede conectarse con cualquier otra.
- Las conexiones son bidireccionales (al consultar conexiones de X, se buscan registros donde `source_id = X` OR `target_id = X`).
- Toda vista de detalle de cualquier entidad debe mostrar sus conexiones activas.
- La interfaz de grafo visual (usando ReactFlow) es opcional por entidad — la vista obligatoria es el **EntitySidebar** (panel lateral con lista de conexiones agrupadas por tipo).

---

## 3. Almacenamiento

### 3.1 Regla de routing
| Condición | Destino | Campo en `documents` |
|---|---|---|
| `file.size < 1.5 MB` | Neon DB (buffer/base64) | `storage_provider = 'neon'` |
| `file.size >= 1.5 MB` | Google Drive empresa | `storage_provider = 'drive'`, `drive_file_id` |

### 3.2 Implementación
- Componente `SmartUploader` maneja el routing automáticamente.
- En ambos casos se inserta un registro en la tabla `documents`.
- Google Drive usa autenticación por Service Account (`GOOGLE_SERVICE_ACCOUNT_JSON` en `.env`).
- Los archivos subidos desde el Portal de Cliente también van a Drive.

---

## 4. Autenticación y Roles

### 4.1 Usuarios internos (equipo Vertrex)
- Tabla `users` con `email`, `password_hash`, `role`.
- Rol `team`: acceso completo al OS.
- Rol `admin`: acceso completo + módulo de equipo y configuración.
- Autenticación: sesión estándar (Auth.js o JWT con `jose`).

### 4.2 Portal de clientes
- Acceso por `slug` del cliente + PIN de 6 dígitos.
- El PIN se genera desde el OS (módulo CRM), se hashea con `bcryptjs` (10 rounds), y se muestra en texto plano **una sola vez** para que el equipo lo envíe por WhatsApp.
- Sesión: cookie HTTP-only con JWT firmado (`jose`, expiración 7 días).
- Un cliente puede tener múltiples proyectos activos.

---

## 5. Módulos del Sistema

---

### 5.1 Módulo: Dashboard / Landing Analytics

**Acceso:** Solo equipo interno  
**Ruta:** `/os/admin`

**Descripción:** Panel de métricas básicas de la landing pública de Vertrex.

**Funcionalidades:**
- Integración con `@vercel/analytics` en el layout público.
- Vista del Admin OS con métricas embebidas (pageviews, visitantes únicos, páginas más visitadas).
- Links directos al dashboard de Vercel Analytics y Neon DB Studio.
- Indicadores del estado del sistema: % de almacenamiento Neon usado, proyectos activos, clientes activos.

---

### 5.2 Módulo: CRM (Gestión de Clientes)

**Acceso:** Solo equipo interno  
**Rutas:** `/os/crm`, `/os/crm/[slug]`

**Descripción:** Registro y control completo de los clientes de Vertrex.

**Entidad `clients`:**
```
id         uuid PK
slug       text NOT NULL UNIQUE
name       text NOT NULL
pin_hash   text NOT NULL
email      text
phone      text
status     text NOT NULL default('active')  -- 'active' | 'inactive' | 'paused'
created_at timestamp NOT NULL
```

**Funcionalidades:**
- Lista paginada de clientes con filtro por status.
- Vista de detalle con: información del cliente, proyectos conectados, documentos conectados, finanzas conectadas, tickets abiertos.
- **Generar PIN de acceso al portal:** Genera número aleatorio de 6 dígitos, lo hashea con `bcryptjs`, actualiza `pin_hash`. Muestra el PIN en texto plano una sola vez con botón "Copiar para WhatsApp".
- **EntitySidebar** mostrando todas las conexiones del cliente en el grafo.
- Botón para conectar el cliente con proyectos, documentos o cualquier otra entidad.
- Historial de tickets enviados por el cliente.

---

### 5.3 Módulo: Proyectos

**Acceso:** Solo equipo interno  
**Rutas:** `/os/projects`, `/os/projects/[id]`

**Descripción:** Control de todos los proyectos de Vertrex, inspirado en Linear (simple, no Jira).

**Entidad `projects`:**
```
id              uuid PK
name            text NOT NULL
status          text NOT NULL default('active')  -- 'active' | 'paused' | 'completed' | 'cancelled'
progress        integer NOT NULL default(0)  -- 0-100
current_version text default('v1.0')
reference_links jsonb NOT NULL default([])  -- array de {label, url}
created_at      timestamp NOT NULL
```

**Funcionalidades:**
- Vista tipo kanban o tabla de proyectos filtrable por status.
- Vista de detalle con: nombre, status, barra de progreso, versión actual, links de referencia.
- Sección para agregar/editar links de referencia (repositorio GitHub, Figma, staging URL, etc.).
- **EntitySidebar** con: cliente conectado, documentos, legales, finanzas, recursos conectados.
- Control de versión manual (input text para actualizar `current_version`).
- Conexión con cualquier entidad del grafo.

---

### 5.4 Módulo: Documentos

**Acceso:** Solo equipo interno  
**Rutas:** `/os/documents`, `/os/documents/[id]`

**Descripción:** Repositorio de documentos de trabajo (presentaciones, requerimientos, propuestas, etc.).

**Entidad `documents`:**
```
id               uuid PK
name             text NOT NULL
size_bytes       integer NOT NULL default(0)
storage_provider storage_provider_enum NOT NULL default('neon')
drive_file_id    text
url              text
mime_type        text
created_at       timestamp NOT NULL
```

**Funcionalidades:**
- Lista de documentos con filtro por tipo y conexiones.
- Subida mediante `SmartUploader` (routing automático Neon/Drive).
- Vista de detalle con preview si es imagen o PDF.
- **EntitySidebar** con entidades conectadas.
- Descarga directa del archivo.

---

### 5.5 Módulo: Legal

**Acceso:** Solo equipo interno  
**Rutas:** `/os/legal`, `/os/legal/[id]`

**Descripción:** Repositorio de documentos legales (contratos de prestación de servicios, cuentas de cobro, acuerdos, etc.).

**Entidad `legal_documents`:**
```
id               uuid PK
name             text NOT NULL
type             text NOT NULL  -- 'contrato' | 'cuenta_cobro' | 'acuerdo' | 'otro'
size_bytes       integer NOT NULL default(0)
storage_provider storage_provider_enum NOT NULL default('neon')
drive_file_id    text
url              text
signed_at        timestamp
created_at       timestamp NOT NULL
```

**Funcionalidades:**
- Lista de documentos legales filtrables por tipo.
- Subida con `SmartUploader`.
- Campo `signed_at` para marcar cuándo fue firmado.
- **EntitySidebar** con proyecto y cliente conectados.
- Visible en el Portal del Cliente (solo los documentos legales que el equipo decida exponer).

---

### 5.6 Módulo: Knowledge Hub (Notas + Incubadora de Ideas)

**Acceso:** Solo equipo interno  
**Rutas:** `/os/hub`, `/os/hub/[id]`

**Descripción:** Módulo dual. Por un lado es un editor tipo Notion para apuntes generales del equipo. Por otro lado es una **Incubadora de Ideas** con ciclo de vida propio, captura rápida y visualización espacial — diseñada para que las ideas no mueran en una lista de texto.

---

#### 5.6.1 Sub-módulo: Apuntes Generales (`type = 'note'`)

Notas de trabajo del equipo: decisiones técnicas, meeting notes, documentación interna.

**Funcionalidades:**
- Lista de notas en vista simple.
- Editor BlockNote con: headings, listas, bold, italic, código, links.
- Guardado manual (botón Guardar).
- **EntitySidebar** con conexiones del grafo.

---

#### 5.6.2 Sub-módulo: Incubadora de Ideas (`type = 'software_idea'`)

Sistema de gestión de ideas de productos de software con ciclo de vida visual.

**Entidad `knowledge_notes`:**
```
id              uuid PK
title           text NOT NULL
content_json    jsonb NOT NULL default({})   -- formato BlockNote JSON (para el editor profundo)
type            text NOT NULL               -- 'note' | 'software_idea'
idea_status     text default('semilla')     -- solo para software_idea: ver ciclo de vida
next_step       text                        -- acción concreta siguiente (solo ideas)
related_project_id uuid                     -- si ya se convirtió en proyecto real
created_at      timestamp NOT NULL
```

**Ciclo de vida de ideas (`idea_status`):**

| Estado | Emoji | Significado |
|---|---|---|
| `semilla` | 🌱 | Captura rápida, idea cruda. Sin procesar. |
| `laboratorio` | 🧪 | Le dedicaste tiempo. Ya evaluaste si es viable. |
| `ejecutar` | 🏗️ | Decidiste que se convierte en proyecto o tarea real. |
| `congelador` | 🧊 | Idea buena pero te desenfoca ahora. Para después. |

**Captura rápida (Fricción Cero):**
- Atajo global `Ctrl+I` (o `Cmd+I` en Mac) abre un modal de captura desde cualquier parte del OS.
- El modal tiene un solo campo: área de texto grande.
- Al presionar Enter o "Guardar idea": se crea la nota con `type = 'software_idea'`, `idea_status = 'semilla'` y el modal se cierra. El cerebro se descarga y se puede seguir trabajando.
- No hay campos adicionales en la captura rápida — la estructuración viene después.

**Vista de la Incubadora:**
- Vista tipo tablero de tarjetas (estilo Trello / muro de Post-its), agrupadas por `idea_status`.
- Cuatro columnas: 🌱 Semillas | 🧪 Laboratorio | 🏗️ Para Ejecutar | 🧊 Congelador.
- Las tarjetas muestran: título, primeras 2 líneas de contenido, `next_step` si existe, y conexiones activas del grafo.
- Drag & drop entre columnas para cambiar `idea_status`.

**Editor profundo de idea (vista de detalle `/os/hub/[id]`):**
- Editor BlockNote limpio y sin distracciones.
- Preguntas fijas en la parte superior (no editables, siempre visibles):
  - `"¿Cuál es el objetivo de esto?"`
  - `"¿A qué proyecto actual pertenece?"`
  - `"¿Cuál es el siguiente paso lógico?"`
- Campo `next_step` (texto plano, editable) siempre visible debajo de las preguntas.
- Mención `@repo` inline: al escribir `@repo` dentro del editor, se despliega un buscador de repositorios guardados en el módulo Links. Al seleccionar uno, se inserta un link interno y se crea automáticamente una conexión en `entity_links`.
- **EntitySidebar** con todas las conexiones del grafo.
- Guardado manual (botón Guardar).

**Funcionalidades adicionales:**
- Conexión con proyectos: si la idea llega a `idea_status = 'ejecutar'`, aparece un botón "Convertir en Proyecto" que crea un registro en `projects` y conecta ambas entidades via grafo.
- Una idea puede conectarse con repositorios GitHub, recursos, notas y proyectos.

---

### 5.7 Módulo: Recursos

**Acceso:** Solo equipo interno  
**Rutas:** `/os/resources`, `/os/resources/[id]`

**Descripción:** Bóveda de información confidencial e importante: API keys, `.env` files, credenciales, contraseñas de servicios.

**Entidad `resources`:**
```
id              uuid PK
title           text NOT NULL
type            text NOT NULL  -- 'api_key' | 'env' | 'password' | 'credential' | 'otro'
encrypted_value text NOT NULL  -- cifrado con AES-256-GCM
created_at      timestamp NOT NULL
```

**Funcionalidades:**
- Lista de recursos con título y tipo (valor nunca visible en lista).
- Para ver el valor: confirmación adicional (botón "Revelar") que llama al backend para descifrar.
- Cifrado/descifrado con `crypto` nativo de Node.js (AES-256-GCM, IV dinámico de 16 bytes). Clave desde `process.env.ENCRYPTION_KEY`.
- **EntitySidebar** con conexiones (ej: este API key pertenece a este proyecto).
- Se puede conectar con proyectos, clientes o cualquier entidad.

---

### 5.8 Módulo: Finanzas

**Acceso:** Solo equipo interno  
**Rutas:** `/os/finances`, `/os/finances/[id]`

**Descripción:** Control del flujo de dinero: ingresos de clientes, gastos fijos (suscripciones de IA, herramientas), y seguimiento de pagos pendientes.

**Entidad `finances`:**
```
id          uuid PK
type        text NOT NULL  -- 'ingreso' | 'gasto'
amount_cop  integer NOT NULL default(0)
status      text NOT NULL default('pending')  -- 'pending' | 'paid' | 'overdue'
concept     text NOT NULL
due_date    timestamp
paid_at     timestamp
created_at  timestamp NOT NULL
```

**Reglas de negocio:**
- Vertrex cobra siempre **50% de anticipo** al inicio del proyecto y **50% al finalizar**.
- Si un proyecto activo no tiene una entrada en `finances` con `concept LIKE '%Anticipo 50%%'` y `status = 'paid'`, mostrar **Badge rojo de advertencia** en la vista del proyecto y en la lista de finanzas.
- Los gastos fijos (suscripciones mensuales de herramientas IA, hosting, etc.) se registran con `type = 'gasto'`.

**Funcionalidades:**
- Vista de tabla con filtros por tipo y status.
- Resumen de: total ingresos, total gastos, flujo neto del mes.
- Badge rojo en proyectos sin anticipo pagado.
- Conexión con proyectos y clientes via grafo.
- Visible en Portal del Cliente: muestra monto pagado y monto pendiente del proyecto.

---

### 5.9 Módulo: Agenda

**Acceso:** Equipo interno + clientes (portal)  
**Rutas:** `/os/agenda`

**Descripción:** Calendario de reuniones, entregas y eventos importantes.

**Entidad `agenda_events`:**
```
id          uuid PK
title       text NOT NULL
description text
starts_at   timestamp NOT NULL
ends_at     timestamp NOT NULL
meet_link   text
created_at  timestamp NOT NULL
```

**Funcionalidades:**
- Vista de calendario mensual/semanal.
- Creación de eventos con: título, descripción, fecha/hora inicio y fin, link de Google Meet.
- Conexión con clientes y proyectos via grafo.
- **Portal del cliente:** Los eventos conectados al cliente o su proyecto son visibles para el cliente (ej: "Reunión de avance — Martes 10am — [Link Meet]").

---

### 5.10 Módulo: Links + Repositorios GitHub

**Acceso:** Solo equipo interno  
**Rutas:** `/os/links`, `/os/links/[id]`

**Descripción:** Repositorio de links útiles e interesantes (TikToks, Reddit, artículos, herramientas) con tratamiento especializado y enriquecido para URLs de GitHub. Los repositorios GitHub son ciudadanos de primera clase con su propia tarjeta visual, metadatos técnicos y modo lectura del README.

---

#### 5.10.1 Detección automática de tipo

Al pegar cualquier URL, el sistema detecta el patrón antes de guardar:

- Si la URL coincide con `https://github.com/{owner}/{repo}` → flujo GitHub (ver 5.10.2).
- Cualquier otra URL → flujo link general (ver 5.10.3).

---

#### 5.10.2 Flujo GitHub — Registro enriquecido

**Paso 1 — Extracción de metadatos (server-side):**
Al detectar una URL de GitHub, el backend extrae `owner` y `repo` de la URL y hace fetch a `https://api.github.com/repos/{owner}/{repo}`. Se obtiene automáticamente:
- Nombre del repositorio y descripción oficial.
- Lenguaje principal y su color hex (desde la API).
- Número de estrellas y forks.
- Fecha de última actualización (`pushed_at`).
- Topics/etiquetas del repositorio (array de strings).

**Paso 2 — Fricción intencional (campo `saved_reason`):**
Antes de guardar, el sistema muestra obligatoriamente:
- Campo de texto: `"¿Qué problema específico te resuelve este repo?"` — **campo obligatorio**, no se puede guardar sin completarlo.
- Botones de etiquetas rápidas opcionales: `"Estudiar código"`, `"Implementar en proyecto actual"`, `"Inspiración"`, `"Referencia de arquitectura"` — al seleccionar uno, pre-llena el campo pero sigue siendo editable.

**Regla:** Si no sabes por qué lo guardas, no vale la pena guardarlo.

**Entidad `repositories`:**
```
id              uuid PK
url             text NOT NULL UNIQUE
owner           text NOT NULL
repo_name       text NOT NULL
description     text
language        text
language_color  text   -- hex color del lenguaje (ej: '#3178c6' para TypeScript)
stars           integer NOT NULL default(0)
forks           integer NOT NULL default(0)
topics          jsonb NOT NULL default([])  -- array de strings
pushed_at       timestamp
readme_content  text   -- contenido markdown del README (se carga on-demand, no al guardar)
saved_reason    text NOT NULL  -- campo obligatorio: por qué lo guardas
implementation_status text NOT NULL default('pendiente')  -- 'pendiente' | 'probando' | 'en_uso' | 'descartado'
priority        integer NOT NULL default(3)  -- 1-5 estrellas
created_at      timestamp NOT NULL
```

---

#### 5.10.3 Flujo link general

Al ingresar una URL no-GitHub, el sistema hace fetch de los meta tags (`og:title`, `og:description`, `og:image`) para auto-completar título, descripción e imagen de preview.

**Entidad `links`:**
```
id          uuid PK
url         text NOT NULL UNIQUE
title       text
description text
image_url   text
type        text NOT NULL default('otro')  -- 'tiktok' | 'reddit' | 'tool' | 'article' | 'otro'
created_at  timestamp NOT NULL
```

---

#### 5.10.4 Vistas

**Vista principal `/os/links`:**
- Dos secciones separadas: **Repositorios GitHub** y **Links Generales**.
- Repositorios: vista de tarjetas tipo dashboard (`GithubCard`) con:
  - Nombre del repo en grande, descripción oficial.
  - Badge de lenguaje con su color (dot de color + nombre).
  - Estrellas y forks.
  - `saved_reason` resaltado visualmente (fondo sutil, ícono de pin) — es la información de mayor jerarquía visual en la tarjeta.
  - Indicador de `implementation_status` con colores semáforo.
  - Indicador de prioridad (1-5 estrellas).
  - Fecha de última actualización del repo.
- Links generales: galería de tarjetas con imagen og, título y descripción.

**Filtros disponibles (repositorios):**
- Por `language` (ej: "Ver solo TypeScript").
- Por `implementation_status`.
- Por `topics` (etiquetas automáticas de GitHub).
- Por `priority` (≥ N estrellas).

**Buscador full-text:**
Busca simultáneamente en: `repo_name`, `description`, `saved_reason`, `topics`. El campo `saved_reason` tiene peso de búsqueda prioritario — si buscas "pasarela de pago" y tienes un repo con esa nota, aparece primero.

---

#### 5.10.5 Modo Lectura — README Viewer

Disponible en la vista de detalle `/os/links/[id]` para repositorios GitHub.

- Botón "Ver README" en la tarjeta del repo.
- Al hacer clic: fetch on-demand a `https://api.github.com/repos/{owner}/{repo}/readme` (base64 → decode → markdown).
- El contenido se cachea en el campo `readme_content` de la tabla `repositories` para no repetir el fetch.
- Renderizado con `react-markdown` en un panel lateral expandible o modal.
- La nota `saved_reason` aparece **fijada en la parte superior** del panel antes del README — contexto propio siempre visible.

---

#### 5.10.6 Conexión con el grafo

- Un repositorio puede conectarse con proyectos, notas de ideas y recursos.
- Desde el editor de notas del Knowledge Hub (ver 5.6), se puede usar `@repo` para buscar y citar repositorios guardados inline en el texto de una nota.

**Variable de entorno requerida (opcional para repos privados):**
```env
GITHUB_TOKEN=   # Personal Access Token para aumentar rate limit (5000 req/h vs 60 sin token)
```

---

### 5.11 Módulo: Marketing

**Acceso:** Solo equipo interno  
**Rutas:** `/os/marketing`, `/os/marketing/[accountId]`

**Descripción:** Gestión de cuentas de redes sociales y planificación de contenido.

**Entidad `social_accounts`:**
```
id          uuid PK
platform    text NOT NULL  -- 'instagram' | 'tiktok' | 'facebook' | 'linkedin' | 'twitter' | 'youtube'
handle      text NOT NULL
email       text
password_encrypted text  -- cifrado con AES-256-GCM
notes       text
created_at  timestamp NOT NULL
```

**Entidad `content_plan`:**
```
id              uuid PK
social_account_id uuid NOT NULL references social_accounts(id)
title           text NOT NULL
content_type    text NOT NULL  -- 'post' | 'reel' | 'story' | 'video'
status          text NOT NULL default('idea')  -- 'idea' | 'en_produccion' | 'listo' | 'publicado'
scheduled_at    timestamp
notes           text
created_at      timestamp NOT NULL
```

**Funcionalidades:**
- Lista de cuentas de redes sociales con plataforma y handle.
- Ver credenciales (con botón "Revelar" igual que recursos).
- Mini agenda de contenido por cuenta: qué publicar, cuándo, en qué estado está.
- Estadísticas básicas manuales (seguidores, alcance — input manual, no API de terceros en v1).

---

### 5.12 Módulo: Equipo

**Acceso:** Solo admin  
**Rutas:** `/os/team`, `/os/team/[userId]`

**Descripción:** Gestión de miembros del equipo Vertrex, permisos y accesos.

**Entidad `users`:**
```
id            uuid PK
email         text NOT NULL UNIQUE
name          text NOT NULL
password_hash text NOT NULL
role          user_role_enum NOT NULL default('team')  -- 'team' | 'admin'
is_active     boolean NOT NULL default(true)
created_at    timestamp NOT NULL
```

**Funcionalidades:**
- Lista de miembros del equipo.
- Crear nuevo miembro (genera credenciales de acceso al OS).
- Cambiar rol (team ↔ admin).
- Desactivar acceso sin borrar el usuario.
- En v1 no hay permisos granulares por módulo — solo `team` (acceso a todo excepto equipo/config) y `admin` (acceso total).

---

### 5.13 Módulo: Portales de Cliente

**Acceso:** Clientes (autenticación PIN)  
**Rutas:** `/portal/login`, `/portal/[slug]`

**Descripción:** Interfaz pública simplificada para que los clientes vean el estado de su(s) proyecto(s) con Vertrex.

**Principios de diseño:**
- Letras grandes, alto contraste, flujos de máximo 2 pasos.
- Sin menús complejos ni navegación anidada.
- Toda información presentada en tarjetas claras.

**Lo que el cliente puede ver:**
- **Proyectos:** Nombre, status, barra de progreso grande, versión actual.
- **Documentos conectados:** Lista de archivos disponibles para descarga.
- **Legales conectados:** Contratos y cuentas de cobro que el equipo haya expuesto.
- **Finanzas:** Monto total del proyecto, monto pagado, monto pendiente.
- **Agenda:** Próximas reuniones con link de Google Meet.
- **Tickets:** Historial de tickets enviados y su estado.

**Lo que el cliente puede hacer:**
- Subir archivos (van directo a Google Drive). Se registran en `documents` y se conectan automáticamente al cliente via grafo.
- Enviar tickets de soporte (se crean en tabla `tickets` y se conectan al cliente).

**Lo que el equipo controla:**
- Qué documentos legales son visibles para el cliente (campo `is_public` en `legal_documents`).
- El PIN de acceso (generado desde el módulo CRM).

**Entidad `tickets`:**
```
id          uuid PK
client_id   uuid NOT NULL
title       text NOT NULL
description text NOT NULL
status      text NOT NULL default('open')  -- 'open' | 'in_progress' | 'resolved'
created_at  timestamp NOT NULL
```

---

### 5.14 Módulo: Generador de Plantillas

**Acceso:** Solo equipo interno  
**Rutas:** `/os/generator`

**Descripción:** Sistema para llenar plantillas HTML prefabricadas con contenido variable. El equipo ya tiene las plantillas en HTML.

**Funcionalidades:**
- Cargar una plantilla HTML (subida de archivo `.html` o pegado directo en textarea).
- El sistema detecta automáticamente todas las variables con formato `{{NOMBRE_VARIABLE}}` usando regex `/\{\{([^}]+)\}\}/g`.
- Por cada variable detectada, renderiza un input text con la etiqueta de la variable.
- Al presionar "Generar": reemplaza todas las ocurrencias de `{{VARIABLE}}` con el valor ingresado.
- Previsualización en iframe en tiempo real.
- Botón "Descargar" que exporta el HTML resultante como archivo `.html`.
- Las plantillas no se guardan en BD en v1 — son de uso por sesión.

---

### 5.15 Módulo: Configuración

**Acceso:** Solo admin  
**Rutas:** `/os/settings`

**Descripción:** Configuración del sistema y exposición para agentes IA externos.

**Funcionalidades:**
- Cambio de contraseña del usuario autenticado.
- Gestión de variables de entorno internas visibles al equipo (se guardan encriptadas en `resources`).
- **Endpoint MCP:** `GET /api/mcp/graph` — endpoint autenticado por Bearer token (`process.env.MCP_SECRET`) que retorna el estado completo del grafo (proyectos, clientes, conexiones) en JSON puro para consumo de agentes IA externos (Sofía, OpenClaw).
  - Sin token válido: HTTP 401.
  - Con token: JSON con proyectos activos, clientes, y sus `entity_links`.

---

## 6. Rutas Completas del Sistema

```
# Landing pública
/                          → Landing page Vertrex
/api/mcp/graph             → Endpoint MCP para agentes IA

# OS interno
/os                        → Redirect a /os/admin
/os/admin                  → Dashboard y métricas
/os/crm                    → Lista de clientes
/os/crm/[slug]             → Detalle de cliente
/os/projects               → Lista de proyectos
/os/projects/[id]          → Detalle de proyecto
/os/documents              → Lista de documentos
/os/documents/[id]         → Detalle de documento
/os/legal                  → Lista de documentos legales
/os/legal/[id]             → Detalle de documento legal
/os/hub                    → Knowledge Hub (notas e ideas)
/os/hub/[id]               → Detalle de nota/idea
/os/resources              → Lista de recursos
/os/resources/[id]         → Detalle de recurso
/os/finances               → Vista de finanzas
/os/agenda                 → Calendario
/os/links                  → Galería de links y repositorios GitHub
/os/marketing              → Lista de cuentas sociales
/os/marketing/[id]         → Detalle de cuenta social
/os/team                   → Gestión de equipo
/os/generator              → Generador de plantillas
/os/settings               → Configuración

# Portal de clientes
/portal/login              → Login con slug + PIN
/portal/[slug]             → Dashboard del cliente
```

---

## 7. Stack Técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Base de datos | Neon PostgreSQL |
| ORM | Drizzle ORM |
| Auth interna | `jose` (JWT) + `bcryptjs` |
| Auth portal | JWT cookie HTTP-only con `jose` |
| Editor rico | BlockNote (`@blocknote/react`) |
| Grafo visual | ReactFlow (`@xyflow/react`) |
| Almacenamiento externo | Google Drive API v3 (Service Account) |
| Analytics | `@vercel/analytics` |
| Cifrado | Node.js `crypto` (AES-256-GCM) |
| README renderer | `react-markdown` |
| GitHub data | GitHub REST API v3 (con `GITHUB_TOKEN` opcional) |
| Deploy | Vercel |
| Estilos | Tailwind CSS + shadcn/ui |

---

## 8. Variables de Entorno Requeridas

```env
DATABASE_URL=                    # Neon connection string
ENCRYPTION_KEY=                  # 32 bytes hex para AES-256-GCM
AUTH_SECRET=                     # Secret para JWT del OS interno
GOOGLE_SERVICE_ACCOUNT_JSON=     # JSON completo de la Service Account de Google
MCP_SECRET=                      # Bearer token para el endpoint MCP
GITHUB_TOKEN=                    # Personal Access Token GitHub (opcional, aumenta rate limit a 5000 req/h)
NODE_ENV=                        # 'development' | 'production'
```

---

## 9. Entidades del Grafo — Resumen

| Entidad | Tabla | Puede conectarse con |
|---|---|---|
| Cliente | `clients` | proyectos, documentos, legales, finanzas, agenda, tickets |
| Proyecto | `projects` | clientes, documentos, legales, finanzas, agenda, recursos, notas |
| Documento | `documents` | clientes, proyectos, legales |
| Legal | `legal_documents` | clientes, proyectos |
| Nota | `knowledge_notes` (type=note) | proyectos, recursos, links, repositorios |
| Idea | `knowledge_notes` (type=idea) | proyectos, recursos, repositorios, notas |
| Recurso | `resources` | proyectos, clientes, notas |
| Finanza | `finances` | proyectos, clientes |
| Evento agenda | `agenda_events` | clientes, proyectos |
| Link general | `links` | proyectos, notas, recursos |
| Repositorio GitHub | `repositories` | proyectos, notas, ideas, recursos |
| Ticket | `tickets` | clientes, proyectos |
| Cuenta social | `social_accounts` | — (standalone en v1) |

---

## 10. Alcance v1 — Qué NO está incluido

- Notificaciones push o email automáticas.
- Permisos granulares por módulo (solo team/admin en v1).
- Integración con APIs de redes sociales (estadísticas de marketing son manuales en v1).
- Autoguardado en el editor BlockNote.
- Modo offline.
- App móvil nativa.
- Multi-empresa (Vertrex OS es single-tenant para uso exclusivo de Vertrex).
