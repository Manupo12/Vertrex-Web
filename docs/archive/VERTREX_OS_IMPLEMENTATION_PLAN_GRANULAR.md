# Plan Maestro de Implementación Vertrex OS (Arquitectura de Grafo - Ejecución Estricta)

**ADVERTENCIA PARA EL EJECUTOR:** Este es un plan determinista. No inventes código, constraints, dependencias, ni improvises lógica de base de datos. Sigue el formato `[ARCHIVO] → [ACCIÓN]`. La falta de validación o el saltar pasos resultará en un sistema inoperable. El proyecto ya cuenta con librerías como `jose` y `bcryptjs` en su `package.json`, utilízalas en lugar de improvisar frameworks completos.

---

## Fase 1: Limpieza Profunda y Cimientos del Grafo Universal (Base de Datos Estricta)

*Objetivo: Purgar el código viejo y establecer el esquema de base de datos sin ambigüedades.*

1. `[Terminal]` → Ejecutar `rm -rf src/app/os` → Elimina el directorio OS antiguo.
2. `[Terminal]` → Ejecutar `rm -rf src/components/os` → Elimina los componentes OS antiguos.
3. `[src/lib/db/schema.ts]` → Borrar todo el contenido actual del archivo. Insertar las siguientes importaciones:
   ```typescript
   import { pgTable, uuid, text, timestamp, jsonb, integer, boolean, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";
   ```
4. `[src/lib/db/schema.ts]` → Definir Enums principales obligatorios:
   ```typescript
   export const userRoleEnum = pgEnum("user_role", ["team", "client"]);
   export const entityTypeEnum = pgEnum("entity_type", ["client", "project", "document", "resource", "finance", "agenda", "link", "ticket", "note", "idea"]);
   export const storageProviderEnum = pgEnum("storage_provider", ["neon", "drive"]);
   ```
5. `[src/lib/db/schema.ts]` → Crear tabla `users` (Equipo interno):
   ```typescript
   export const users = pgTable("users", {
     id: uuid("id").primaryKey().defaultRandom(),
     email: text("email").notNull().unique(),
     name: text("name").notNull(),
     passwordHash: text("password_hash").notNull(),
     role: userRoleEnum("role").notNull().default("team"),
     createdAt: timestamp("created_at").notNull().defaultNow()
   });
   ```
6. `[src/lib/db/schema.ts]` → Crear tabla `clients` (Clientes):
   ```typescript
   export const clients = pgTable("clients", {
     id: uuid("id").primaryKey().defaultRandom(),
     slug: text("slug").notNull().unique(),
     name: text("name").notNull(),
     pinHash: text("pin_hash").notNull(),
     email: text("email"),
     phone: text("phone"),
     status: text("status").notNull().default("active"),
     createdAt: timestamp("created_at").notNull().defaultNow()
   });
   ```
7. `[src/lib/db/schema.ts]` → Crear tabla core `entity_links` (El Grafo):
   ```typescript
   export const entityLinks = pgTable("entity_links", {
     id: uuid("id").primaryKey().defaultRandom(),
     sourceId: uuid("source_id").notNull(),
     sourceType: entityTypeEnum("source_type").notNull(),
     targetId: uuid("target_id").notNull(),
     targetType: entityTypeEnum("target_type").notNull(),
     relationType: text("relation_type").notNull().default("relates_to"),
     createdAt: timestamp("created_at").notNull().defaultNow()
   }, (table) => ({
     sourceIdx: index("entity_links_source_idx").on(table.sourceId, table.sourceType),
     targetIdx: index("entity_links_target_idx").on(table.targetId, table.targetType)
   }));
   ```
8. `[src/lib/db/schema.ts]` → Crear tabla `projects`:
   ```typescript
   export const projects = pgTable("projects", {
     id: uuid("id").primaryKey().defaultRandom(),
     name: text("name").notNull(),
     status: text("status").notNull().default("active"),
     progress: integer("progress").notNull().default(0),
     currentVersion: text("current_version").default("v1.0"),
     referenceLinks: jsonb("reference_links").notNull().default([]),
     createdAt: timestamp("created_at").notNull().defaultNow()
   });
   ```
9. `[src/lib/db/schema.ts]` → Crear tabla `knowledge_notes`:
   ```typescript
   export const knowledgeNotes = pgTable("knowledge_notes", {
     id: uuid("id").primaryKey().defaultRandom(),
     title: text("title").notNull(),
     contentJson: jsonb("content_json").notNull().default({}),
     type: text("type").notNull(), // 'note' o 'software_idea'
     createdAt: timestamp("created_at").notNull().defaultNow()
   });
   ```
10. `[src/lib/db/schema.ts]` → Crear tabla `documents`:
    ```typescript
    export const documents = pgTable("documents", {
      id: uuid("id").primaryKey().defaultRandom(),
      name: text("name").notNull(),
      sizeBytes: integer("size_bytes").notNull().default(0),
      storageProvider: storageProviderEnum("storage_provider").notNull().default("neon"),
      driveFileId: text("drive_file_id"),
      url: text("url"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    ```
11. `[src/lib/db/schema.ts]` → Crear tablas faltantes obligatorias CON CONSTRAINTS ESTRICTOS:
    ```typescript
    export const finances = pgTable("finances", {
      id: uuid("id").primaryKey().defaultRandom(),
      type: text("type").notNull(), // 'ingreso' | 'gasto'
      amountCop: integer("amount_cop").notNull().default(0),
      status: text("status").notNull().default("pending"),
      concept: text("concept").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
    });

    export const resources = pgTable("resources", {
      id: uuid("id").primaryKey().defaultRandom(),
      title: text("title").notNull(),
      type: text("type").notNull(),
      encryptedValue: text("encrypted_value").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
    });

    export const agendaEvents = pgTable("agenda_events", {
      id: uuid("id").primaryKey().defaultRandom(),
      title: text("title").notNull(),
      startsAt: timestamp("starts_at").notNull(),
      endsAt: timestamp("ends_at").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
    });

    export const tickets = pgTable("tickets", {
      id: uuid("id").primaryKey().defaultRandom(),
      clientId: uuid("client_id").notNull(),
      title: text("title").notNull(),
      status: text("status").notNull().default("open"),
      description: text("description").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
    });
    ```
12. `[Terminal]` → Ejecutar `npx drizzle-kit generate` y luego `npx drizzle-kit push`.

**✅ CHECKPOINT FASE 1:** Ejecuta `npx drizzle-kit studio` y verifica manualmente que TODAS las tablas descritas arriba existan con sus PK, enums y campos `notNull()` correspondientes. Las tablas `entity_links` DEBE tener índices.

---

## Fase 2: Motor Lógico del Grafo y Seguridad (Base API)

*Objetivo: Lógica estricta para criptografía y relaciones. Respetando el stack.*

13. `[src/lib/security/encryption.ts]` → Exportar `encrypt(text)` y `decrypt(hash)` usando `crypto.createCipheriv('aes-256-gcm', key, iv)`. Lanzar error si `process.env.ENCRYPTION_KEY` no existe.
14. `[src/lib/security/password.ts]` → Crear funciones `hashPin(pin: string)` y `verifyPin(pin, hash)`. Usa la librería YA INSTALADA `bcryptjs` (import bcrypt from 'bcryptjs').
15. `[src/lib/db/actions/graph.ts]` → Server Action `linkEntities`. Insertar conexión de dos entidades en la base de datos:
    ```typescript
    'use server'
    import { db } from '@/lib/db';
    import { entityLinks, entityTypeEnum } from '@/lib/db/schema';

    export async function linkEntities(sourceId: string, sourceType: any, targetId: string, targetType: any, relationType = 'relates_to') {
      await db.insert(entityLinks).values({
        sourceId, sourceType, targetId, targetType, relationType
      });
    }
    ```
16. `[src/lib/db/actions/graph.ts]` → Server Action `getEntityConnections`. Buscar TODAS las conexiones de una entidad **sin ambigüedad**:
    ```typescript
    'use server'
    import { db } from '@/lib/db';
    import { entityLinks } from '@/lib/db/schema';
    import { eq, or } from 'drizzle-orm';

    export async function getEntityConnections(entityId: string) {
      return await db.query.entityLinks.findMany({
        where: or(
          eq(entityLinks.sourceId, entityId),
          eq(entityLinks.targetId, entityId)
        )
      });
    }
    ```
17. `[Terminal]` → Instalar / verificar dependencia de Grafo: `npm install @xyflow/react`.
18. `[src/components/os/Graph/EntityGraph.tsx]` → Componente `use client`. Invoca `getEntityConnections`, mapea a `{ nodes, edges }` y usa el componente importado de `@xyflow/react` (`import { ReactFlow } from '@xyflow/react';`).
19. `[src/components/os/Graph/EntitySidebar.tsx]` → Componente `use client` para enlistar en texto plano los targets recibidos del backend.

**✅ CHECKPOINT FASE 2:** Usa la función `linkEntities` en cualquier página de prueba para enlazar dos UUIDs falsos, luego invoca `getEntityConnections` y comprueba que se devuelve un arreglo no vacío.

---

## Fase 3: Knowledge Hub (Notion-like) y Proyectos Core

20. `[Terminal]` → Instalar editor rico: `npm install @blocknote/core @blocknote/react @blocknote/mantine`
21. `[src/components/os/Editor/BlockEditor.tsx]` → Componente `use client` usando `useCreateBlockNote()`. El callback `onChange` debe propagar un JSON stringificado hacia arriba.
22. `[src/app/os/hub/layout.tsx]` → Crear Layout simple de dos columnas (Sidebar y contenido).
23. `[src/app/os/hub/page.tsx]` → Query a `knowledgeNotes`. Lista dividida entre 'note' y 'idea'.
24. `[src/app/os/hub/[id]/page.tsx]` → Detalle de la nota. Integrar `BlockEditor` con el initial content desde la base de datos.
25. `[src/app/os/projects/page.tsx]` → Tabla de lectura de la tabla `projects`.
26. `[src/app/os/projects/[id]/page.tsx]` → Detalle del proyecto. Muestra versión, links (jsonb) e incluye el `<EntitySidebar>` pasando `projectId`.

**✅ CHECKPOINT FASE 3:** Crea una Idea de Software con BlockEditor (listas, bold), guarda el JSON en BD, recarga la página y asegúrate de que el formato se mantenga intacto.

---

## Fase 4: Almacenamiento Inteligente y CRM

27. `[Terminal]` → Instalar dependencias de Google: `npm install googleapis`
28. `[src/lib/drive/service.ts]` → Auth usando `google.drive('v3')`. Leer credenciales del JSON definido en el `.env.local` (EJ: `GOOGLE_SERVICE_ACCOUNT_JSON`). Implementar `uploadToDrive`.
29. `[src/components/os/Uploader/SmartUploader.tsx]` → Componente React. Lógica:
    ```javascript
    if (file.size < 1.5 * 1024 * 1024) {
      // Guardar buffer en Neon o sistema local. Insertar en tabla documents (storageProvider: 'neon')
    } else {
      // Llamar uploadToDrive. Insertar en tabla documents (storageProvider: 'drive', driveFileId: res.id)
    }
    ```
30. `[src/app/os/crm/page.tsx]` → Mostrar clientes desde la tabla `clients`.
31. `[src/app/os/crm/[slug]/page.tsx]` → Action: Generar PIN. Generar Random (ej: 4819). Llamar a `bcryptjs` `hashPin`. Guardar. Renderizar PIN sin hashear en la UI 1 sola vez.

**✅ CHECKPOINT FASE 4:** Sube un archivo superior a 1.5MB mediante SmartUploader y corrobora en `documents` que el `storageProvider` marca 'drive'.

---

## Fase 5: Portal de Clientes (Auth Fuerte y Query Estricto)

*Objetivo: Autenticación nativa sin frameworks externos conflictivos y queries SQL puros para el Grafo.*

32. `[src/app/portal/login/page.tsx]` → UI: Dos inputs (Slug de cliente y PIN numérico). Form Action hacia `loginClient`.
33. `[src/app/portal/login/actions.ts]` → **Código Estricto para Cookie JWT** usando librerías nativas del repo:
    ```typescript
    'use server'
    import { cookies } from 'next/headers';
    import * as jose from 'jose';
    import bcrypt from 'bcryptjs';
    import { db } from '@/lib/db';
    import { clients } from '@/lib/db/schema';
    import { eq } from 'drizzle-orm';

    export async function loginClient(slug: string, pin: string) {
      const client = await db.query.clients.findFirst({ where: eq(clients.slug, slug) });
      if (!client) throw new Error("Not found");
      
      const isValid = await bcrypt.compare(pin, client.pinHash);
      if (!isValid) throw new Error("Invalid PIN");

      const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "default_super_secret_for_dev_only");
      const jwt = await new jose.SignJWT({ clientId: client.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secret);
      
      (await cookies()).set('portal_session', jwt, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/' 
      });
      // redirect...
    }
    ```
34. `[src/lib/auth/portal.ts]` → Helper `getPortalSession()` que lea la cookie `portal_session`, invoque `jose.jwtVerify`, y devuelva el `clientId`.
35. `[src/app/portal/[slug]/page.tsx]` → **Query Estricta del Grafo**: Obtener proyectos del cliente. NO ADIVINAR:
    ```typescript
    import { db } from '@/lib/db';
    import { entityLinks, projects } from '@/lib/db/schema';
    import { eq, and } from 'drizzle-orm';

    const connectedProjects = await db
      .select({ project: projects })
      .from(entityLinks)
      .innerJoin(projects, eq(entityLinks.targetId, projects.id))
      .where(
        and(
          eq(entityLinks.sourceId, clientId),
          eq(entityLinks.sourceType, 'client'),
          eq(entityLinks.targetType, 'project')
        )
      );
    ```
36. `[src/app/portal/[slug]/files.tsx]` → Renderizar archivos conectados. Subida mediante `<SmartUploader>`.
37. `[src/app/portal/[slug]/tickets.tsx]` → Crear ticket. Action inserta en tabla `tickets` con `clientId`.

**✅ CHECKPOINT FASE 5:** Usar el PIN de la Fase 4 para acceder al Portal, verificar la creación de la cookie HttpOnly en el navegador y validar que la query estricta del Grafo devuelva los proyectos del cliente correctamente.

---

## Fase 6: Operaciones, Settings y Generador de Plantillas

38. `[src/app/os/finances/page.tsx]` → Query tabla `finances`. Mostrar Badge rojo si faltan pagos tipo "Anticipo 50%".
39. `[src/app/os/agenda/page.tsx]` → Vista calendario simple sobre la tabla `agenda_events`.
40. `[src/app/os/settings/page.tsx]` → UI para guardar secretos. Se invoca `encrypt()` antes de insertar en tabla `resources`.
41. `[src/app/os/generator/page.tsx]` → Cargar `<textarea>` con HTML base. Un helper busca todas las apariciones de `{{VARIABLE}}` y renderiza un input text para cada una. Al presionar generar: `html.replace(new RegExp('{{VARIABLE}}', 'g'), valor)`. Renderiza el blob.

---

## Fase 7: Analíticas y Capa de IA (MCP)

42. `[src/app/layout.tsx]` → Importar e inyectar el tag de `@vercel/analytics/react` dentro del Body (protege métricas de landing pública).
43. `[src/app/os/admin/page.tsx]` → Agrega iframe, links o dashboard custom del tráfico y estado de la base de datos local.
44. `[src/app/api/mcp/route.ts]` → Server endpoint GET. Estricto:
    ```typescript
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.MCP_SECRET}`) return new Response("Unauthorized", { status: 401 });
    // Retornar JSON puro del Grafo para consumo de LLMs.
    ```

**✅ CHECKPOINT FINAL FASE 7:** 
- `npm run build` pasa exitosamente.
- Postman: `GET /api/mcp/route` devuelve 401 si no lleva el Bearer token correcto.