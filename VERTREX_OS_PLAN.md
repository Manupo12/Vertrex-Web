# Plan de Ejecución Detallado: Vertrex OS (Sistema Empresarial Universal)

## Visión General
El objetivo de este proyecto es reconstruir desde cero el sistema interno "Vertrex OS", eliminando la implementación anterior ("Frankenstein") y creando un ecosistema empresarial altamente modular, seguro y conectado. La característica principal del sistema es su **Arquitectura de Grafo Universal**, donde cualquier entidad (Cliente, Proyecto, Documento, etc.) puede conectarse con cualquier otra.

**Moneda:** Peso Colombiano (COP)
**Idioma Principal:** Español

---

## Arquitectura y Tecnologías
- **Frontend / Backend:** Next.js (App Router), React, Tailwind CSS, TypeScript.
- **Base de Datos:** PostgreSQL (Neon).
- **ORM:** Drizzle ORM.
- **Almacenamiento Mixto:** 
  - Neon: Datos estructurados, metadatos y archivos pequeños (< 1.5MB).
  - Google Drive: Archivos pesados (Imágenes, PDFs de clientes, etc.).
- **Visualización del Grafo:** `React Flow` (o librería similar) para mostrar conexiones, acompañado de paneles laterales de detalle.
- **Seguridad:** Encriptación fuerte a nivel de base de datos para credenciales, contraseñas de marketing y variables de entorno (`.env`).
- **Autenticación de Clientes:** Sistema de baja fricción usando "Usuario + PIN Corto" (4 a 6 dígitos).

---

## Fase 1: Limpieza Profunda y Cimientos (¡CRÍTICO!)
*Esta fase asegura que el modelo no herede errores del sistema anterior.*

1. **Limpieza de Código:**
   - Eliminar por completo el directorio `src/app/os` y todos sus subdirectorios.
   - Limpiar el archivo `src/lib/db/schema.ts` eliminando las tablas y enums de la versión anterior que estén corruptos o desorganizados.
   - Eliminar componentes y librerías antiguas que pertenezcan en exclusiva al OS anterior.

2. **Nuevo Esquema Base (Drizzle ORM):**
   - Crear tabla `users` (equipo interno).
   - Crear tabla `clients` (información del cliente, PIN encriptado para acceso).
   - **LA TABLA UNIVERSAL (`entity_links`):**
     - Esta tabla es el corazón del sistema. Debe tener: `id`, `source_entity_id` (UUID), `source_entity_type` (Enum: client, project, document, resource, etc.), `target_entity_id` (UUID), `target_entity_type` (Enum), `relation_type` (String, ej. "belongs_to", "requires", "references"), `created_at`.
   - Generar y aplicar las migraciones correspondientes.

3. **Utilidades Base:**
   - **Encriptación:** Crear un servicio en `src/lib/security/encryption.ts` con funciones `encrypt(text)` y `decrypt(hash)` usando Node.js `crypto` (AES-256-GCM) para asegurar contraseñas, API keys y `.env`.
   - **Google Drive API:** Crear `src/lib/drive/service.ts`. (El usuario deberá proveer el JSON de la Service Account). Implementar funciones: `uploadFile`, `downloadFile`, `deleteFile`, `getFileUrl`.

---

## Fase 2: Construcción de Módulos Core (El Grafo)
*Cada módulo debe tener su tabla principal y conectarse SIEMPRE usando la tabla `entity_links`.*

### 1. Módulo CRM (Clientes)
- **Tabla `crm_records`** (o extender `clients`).
- **Funcionalidad:** Gestión completa de clientes, estados, información de contacto.
- **Interfaz:** Lista de clientes, vista de detalle con un panel lateral ("Ver conexiones") que consulte `entity_links` para mostrar sus proyectos, documentos y reuniones vinculadas.

### 2. Módulo de Proyectos (Estilo Linear)
- **Tabla `projects`**: `id`, `name`, `description`, `status`, `progress`, `client_id` (opcional, aunque se conecte por el grafo).
- **Funcionalidad:** Administrador de proyectos simple pero potente. Flujo de trabajo kanban o lista.
- **Conexiones:** En la vista del proyecto, se debe poder enlazar un contrato legal, un requerimiento o un cliente con un solo botón ("Vincular Entidad").

### 3. Módulo de Documentos y Archivos
- **Tabla `documents`**: `id`, `name`, `type`, `size`, `storage_provider` ('neon' | 'drive'), `drive_file_id`, `url`.
- **Lógica:** Si el archivo pesa < 1.5MB, se puede guardar codificado en DB (opcional) o en almacenamiento base. Si es mayor o es multimedia, se sube usando `src/lib/drive/service.ts`.
- **Visualización:** Vista previa en la plataforma. Conexión directa a Proyectos o Clientes.

### 4. Módulo Legal
- **Tabla `legal_documents`**: Contratos, Cuentas de Cobro, Acuerdos de Confidencialidad.
- **Conexiones:** Relacionar un contrato con un Proyecto y con un Cliente simultáneamente usando el Grafo.

---

## Fase 3: Motor del Grafo (Visual y Funcional)
1. **API de Relaciones:** Crear endpoints/server actions que reciban una entidad y devuelvan todas sus conexiones formateadas.
2. **Visualizador de Grafo:** 
   - Crear una página `/os/grafo` o integrarlo en la vista de detalle.
   - Usar `React Flow` para renderizar un nodo central (ej. Proyecto X) y nodos satélite (Cliente Y, Contrato Z, Documento W).
   - Permitir hacer clic en un nodo satélite para navegar a él.
3. **Panel Lateral Global:** En cualquier vista de detalle, un panel lateral debe resumir las conexiones (Ej: "Este proyecto tiene 1 documento enlazado y 1 contrato").

---

## Fase 4: Módulos Operativos y Seguros

### 1. Módulo de Recursos (Confidencial)
- **Tabla `resources`**: `id`, `title`, `type` (api_key, env, server_login), `encrypted_value`.
- **Funcionalidad:** Al guardar, usar la utilidad de encriptación. Al mostrar, requerir confirmación del usuario para desencriptar y ver.
- **Conexiones:** Conectar, por ejemplo, las API Keys de Neon al "Proyecto Interno Vertrex".

### 2. Módulo de Finanzas
- **Tabla `finances`**: `id`, `type` (ingreso, gasto), `amount_cop`, `status`, `concept`.
- **Funcionalidad:** Control de dinero, gastos, mensualidades (IA, hosting).
- **Lógica de Proyectos:** Registro de pagos del cliente. Sistema de control de "Pago del 50% inicial" obligatorio para empezar un proyecto. (Se refleja en el Portal del Cliente).

### 3. Módulo de Agenda
- **Tabla `agenda_events`**: Fechas de reuniones, links de Meet.
- **Conexiones:** Conectable a Clientes y Proyectos.

### 4. Módulo de Links
- **Tabla `links`**: URLs de Tiktok, Reddit, Github, SaaS.
- **Visual:** Al guardar un link, hacer un fetch a la URL para extraer OpenGraph tags (imagen, título, descripción) y mostrarlo como tarjetas enriquecidas (estilo chat de WhatsApp).

### 5. Módulo de Marketing
- **Funcionalidad:** Mini-agenda de contenidos, gestión de redes sociales.
- **Seguridad:** Las contraseñas de las cuentas de redes sociales deben guardarse encriptadas de la misma forma que el Módulo de Recursos.

---

## Fase 5: Portal de Clientes (0 Fricción)
*El diseño debe ser minimalista, botones grandes, alto contraste.*

1. **Autenticación (Login):**
   - Página dedicada `/portal/login`.
   - Solicita: Identificador (Correo o Usuario) + PIN numérico (4-6 dígitos).
   - Validar contra la tabla de clientes.

2. **Dashboard del Cliente (`/portal/[slug]`):**
   - **Resumen:** Estado actual del proyecto (barra de progreso).
   - **Finanzas:** Cuánto ha pagado y cuánto falta por pagar (El 50% restante).
   - **Archivos:** Botón gigante para "Subir Archivo" (Va directo a Google Drive). Lista de documentos para descargar.
   - **Agenda:** Próximas reuniones de Meet programadas.
   - **Sistema de Tickets:** Formulario simple para enviar requerimientos o reportar problemas. Caen directo al OS central (Módulo de Portales/Tickets).

---

## Fase 6: Módulo de Equipo y Configuración
1. **Roles:** Administrador, Miembro, Vista.
2. **Configuración Global:** Cambio de contraseñas de equipo, configuración de temas.
3. **Preparación MCP (Model Context Protocol):**
   - Dejar una estructura de API (`/api/mcp/...`) lista para que futuros agentes de IA puedan consultar el grafo de la base de datos (con sus respectivos tokens de acceso) y ejecutar acciones como si fueran un usuario.

---

## Fase 7: Generador de Documentos HTML (Complejo - Final)
- **Funcionalidad:** Integrar las plantillas HTML prefabricadas del usuario.
- **Lógica:** Crear una interfaz donde el usuario seleccione una plantilla, llene un formulario con las variables (Nombre, Precio, Fecha), y el sistema reemplace las variables en el HTML original sin alterar la estructura y lo guarde/exporte.

---

## Instrucciones para el Modelo Ejecutor
1. **NO intentes arreglar el código viejo.** Bórralo y empieza de cero siguiendo esta estructura.
2. **Implementación Gradual:** No intentes hacer todo en un solo prompt. Construye módulo por módulo, asegurando siempre que la Tabla de Relaciones (`entity_links`) esté funcionando.
3. **Validación:** Después de implementar Google Drive o Encriptación, escribe un test o un script rápido para verificar que funciona antes de conectarlo a la UI.
4. **UX/UI:** Mantén un diseño limpio usando Tailwind CSS. Para el Portal del Cliente, asume que el usuario nunca ha usado un software en su vida (Máxima simplicidad).
