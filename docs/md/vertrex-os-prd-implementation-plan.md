# Plan de Implementación — Vertrex OS PRD v1.1

Este documento es el plan ejecutable para reemplazar por completo el OS actual y construir Vertrex OS según `Vertrex-Website/docs/md/vertrex-os-prd(1).md`.

**Actualización UX obligatoria:** además de este plan funcional, el ejecutor debe leer y aplicar `Vertrex-Website/docs/md/vertrex-os-ux-spec.md` y `Vertrex-Website/docs/md/vertrex-os-ux-implementation-plan.md`. El PRD define negocio/datos, este plan define backend/arquitectura, y los documentos UX definen cómo debe verse y sentirse el producto. No se acepta una implementación visual básica tipo scaffold.

## Archivos que NO se deben modificar

- `Vertrex-Website/docs/md/vertrex-os-prd(1).md` — PRD fuente de verdad.
- `Vertrex-Website/.env.local` — contiene secretos; solo el dueño del proyecto debe editarlo manualmente.
- `Vertrex-Website/node_modules/**` — dependencias instaladas.
- `Vertrex-Website/.next/**` — salida generada por Next.
- `Vertrex-Website/public/**` — assets públicos de la landing.
- `Vertrex-Website/src/app/page.tsx` — landing pública.
- `Vertrex-Website/src/app/contacto/page.tsx` — página pública.
- `Vertrex-Website/src/app/cuestionario/page.tsx` — página pública.
- `Vertrex-Website/src/app/demos/page.tsx` — página pública.
- `Vertrex-Website/src/app/portafolio/page.tsx` — página pública.
- `Vertrex-Website/src/app/portafolio/[slug]/page.tsx` — página pública.
- `Vertrex-Website/src/app/servicios/page.tsx` — página pública.
- `Vertrex-Website/src/app/sobre-nosotros/page.tsx` — página pública.
- `Vertrex-Website/src/app/terminos/page.tsx` — legal público.
- `Vertrex-Website/src/app/politica-de-privacidad/page.tsx` — legal público.
- `Vertrex-Website/src/components/Header.tsx` — navegación pública.
- `Vertrex-Website/src/components/Footer.tsx` — footer público.
- `Vertrex-Website/src/components/ContactForm.tsx` — formulario público.
- `Vertrex-Website/src/components/ProjectCards.tsx` — componente público.
- `Vertrex-Website/src/components/ProjectDetailClient.tsx` — componente público.
- `Vertrex-Website/drizzle/meta/**` — metadatos generados por Drizzle; no editarlos manualmente.
- `Vertrex-Website/package-lock.json` — solo debe cambiar mediante `npm install`.

## Exploración realizada y convenciones detectadas

- Proyecto Next.js 15 con App Router en `Vertrex-Website/src/app`.
- Alias TypeScript `@/*` apunta a `Vertrex-Website/src/*`.
- ORM: Drizzle ORM con schema central en `Vertrex-Website/src/lib/db/schema.ts` y configuración en `Vertrex-Website/drizzle.config.ts`.
- Base de datos: PostgreSQL/Neon usando `postgres` en `Vertrex-Website/src/lib/db/index.ts`.
- Estilos: Tailwind CSS v4 con variables globales en `Vertrex-Website/src/app/globals.css` y tema OS en `Vertrex-Website/src/app/os-theme.css`.
- Server Components por defecto; Client Components usan `"use client"`.
- Rutas OS existentes en `Vertrex-Website/src/app/os/**` son implementación anterior y deben eliminarse/recrearse.
- Portal existente en `Vertrex-Website/src/app/portal/**` es implementación anterior y debe eliminarse/recrearse.
- Dependencias instaladas actualmente: `bcryptjs`, `cheerio`, `drizzle-orm`, `handlebars`, `jose`, `lucide-react`, `next`, `postgres`, `react`, `react-dom`, `zod`, entre otras. No reinstalar estas.
- Dependencias requeridas por el PRD y NO presentes actualmente en `package.json`: `@vercel/analytics`, `googleapis`, `@blocknote/core`, `@blocknote/react`, `@blocknote/mantine`, `@xyflow/react`, `react-markdown`.
- Dependencias visuales modernas requeridas por `Vertrex-Website/docs/md/vertrex-os-ux-implementation-plan.md` y NO presentes actualmente en `package.json`: `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`, `@radix-ui/react-dialog`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, `@tanstack/react-table`, `cmdk`, `sonner`.
- La implementación anterior del OS quedó demasiado básica; debe eliminarse en Fase 0 y recrearse desde cero con los componentes y reglas visuales de `Vertrex-Website/docs/md/vertrex-os-ux-spec.md`.

---

## Fase 0 — Eliminar todo rastro del OS anterior

1. `[Vertrex-Website/src/app/os]` → Eliminar el directorio completo `Vertrex-Website/src/app/os` y todo su contenido actual → No queda ninguna página, layout ni subruta del OS anterior.
2. `[Vertrex-Website/src/app/portal]` → Eliminar el directorio completo `Vertrex-Website/src/app/portal` y todo su contenido actual → No queda ninguna página ni acción del portal anterior.
3. `[Vertrex-Website/src/components/os]` → Eliminar el directorio completo `Vertrex-Website/src/components/os` y todo su contenido actual → No queda ningún editor, uploader, sidebar ni grafo anterior.
4. `[Vertrex-Website/src/lib/db/actions/graph.ts]` → Eliminar el archivo actual → No queda la implementación vieja de acciones del grafo.
5. `[Vertrex-Website/src/lib/auth/portal.ts]` → Eliminar el archivo actual → No queda la implementación vieja de sesión del portal.
6. `[Vertrex-Website/src/app/api/upload/route.ts]` → Eliminar el archivo actual → No queda el endpoint viejo de subida.
7. `[Vertrex-Website/src/app/api/mcp/route.ts]` → Eliminar el archivo actual porque el PRD exige `GET /api/mcp/graph` → No queda el endpoint MCP anterior en ruta incorrecta.
8. `[Vertrex-Website/src/app/globals.css]` → Eliminar exactamente la línea `@source "../../vertrex-os/src";` → No queda referencia al antiguo proyecto/directorio `vertrex-os`.
9. `[Vertrex-Website/e2e/workspace.spec.ts]` → Eliminar referencias a rutas inexistentes del OS anterior: `/os/health`, `/os/projects/timeline`, y expectativa pública de `/portal/demo-client` sin login → El spec deja de validar pantallas del OS viejo.

### Checkpoint Fase 0

10. `[Vertrex-Website]` → Ejecutar `test ! -d src/app/os && test ! -d src/app/portal && test ! -d src/components/os && test ! -f src/app/api/mcp/route.ts && ! grep -R "../../vertrex-os/src" src/app/globals.css` desde `Vertrex-Website` → El comando termina con código 0. Si falla, no avanzar a la Fase 1.

---

## Fase 1 — Dependencias requeridas por el PRD

11. `[Vertrex-Website/package.json]` → Verificar que `@vercel/analytics` NO está en `dependencies` ni `devDependencies`; está ausente actualmente. Ejecutar `npm install @vercel/analytics` desde `Vertrex-Website` → `package.json` y `package-lock.json` contienen `@vercel/analytics`.
12. `[Vertrex-Website/package.json]` → Verificar que `googleapis` NO está en `dependencies` ni `devDependencies`; está ausente actualmente. Ejecutar `npm install googleapis` desde `Vertrex-Website` → `package.json` y `package-lock.json` contienen `googleapis`.
13. `[Vertrex-Website/package.json]` → Verificar que `@blocknote/core` NO está en `dependencies` ni `devDependencies`; está ausente actualmente. Ejecutar `npm install @blocknote/core` desde `Vertrex-Website` → `package.json` y `package-lock.json` contienen `@blocknote/core`.
14. `[Vertrex-Website/package.json]` → Verificar que `@blocknote/react` NO está en `dependencies` ni `devDependencies`; está ausente actualmente. Ejecutar `npm install @blocknote/react` desde `Vertrex-Website` → `package.json` y `package-lock.json` contienen `@blocknote/react`.
15. `[Vertrex-Website/package.json]` → Verificar que `@blocknote/mantine` NO está en `dependencies` ni `devDependencies`; está ausente actualmente. Ejecutar `npm install @blocknote/mantine` desde `Vertrex-Website` → `package.json` y `package-lock.json` contienen `@blocknote/mantine`.
16. `[Vertrex-Website/package.json]` → Verificar que `@xyflow/react` NO está en `dependencies` ni `devDependencies`; está ausente actualmente. Ejecutar `npm install @xyflow/react` desde `Vertrex-Website` → `package.json` y `package-lock.json` contienen `@xyflow/react`.
17. `[Vertrex-Website/package.json]` → Verificar que `react-markdown` NO está en `dependencies` ni `devDependencies`; está ausente actualmente. Ejecutar `npm install react-markdown` desde `Vertrex-Website` → `package.json` y `package-lock.json` contienen `react-markdown`.

### Checkpoint Fase 1

18. `[Vertrex-Website]` → Ejecutar `npm ls @vercel/analytics googleapis @blocknote/core @blocknote/react @blocknote/mantine @xyflow/react react-markdown` desde `Vertrex-Website` → El comando lista las 7 dependencias sin errores. Si falla, no avanzar a la Fase 2.

---

## Fase 2 — Schema completo, migración y autenticación base

19. `[Vertrex-Website/src/lib/db/schema.ts]` → Reemplazar el archivo completo por el siguiente schema Drizzle. Requiere que la Fase 0 esté completa → El schema contiene todas las entidades del PRD, enums completos, `notNull()`, `primaryKey()`, `unique()`, `default()` y `references()` donde corresponde.

```Vertrex-Website/src/lib/db/schema.ts#L1-234
import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["team", "admin"]);
export const entityTypeEnum = pgEnum("entity_type", [
  "client",
  "project",
  "document",
  "resource",
  "finance",
  "agenda",
  "link",
  "repository",
  "ticket",
  "note",
  "idea",
  "legal",
  "social_account",
  "team_member",
]);
export const storageProviderEnum = pgEnum("storage_provider", ["neon", "drive"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("team"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  pinHash: text("pin_hash").notNull(),
  email: text("email"),
  phone: text("phone"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  progress: integer("progress").notNull().default(0),
  currentVersion: text("current_version").default("v1.0"),
  referenceLinks: jsonb("reference_links").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  storageProvider: storageProviderEnum("storage_provider").notNull().default("neon"),
  driveFileId: text("drive_file_id"),
  url: text("url"),
  mimeType: text("mime_type"),
  contentBase64: text("content_base64"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const legalDocuments = pgTable("legal_documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default("otro"),
  sizeBytes: integer("size_bytes").notNull().default(0),
  storageProvider: storageProviderEnum("storage_provider").notNull().default("neon"),
  driveFileId: text("drive_file_id"),
  url: text("url"),
  isPublic: boolean("is_public").notNull().default(false),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const knowledgeNotes = pgTable("knowledge_notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  contentJson: jsonb("content_json").notNull().default(sql`'{}'::jsonb`),
  type: text("type").notNull().default("note"),
  ideaStatus: text("idea_status").default("semilla"),
  nextStep: text("next_step"),
  relatedProjectId: uuid("related_project_id").references(() => projects.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  type: text("type").notNull().default("otro"),
  encryptedValue: text("encrypted_value").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const finances = pgTable("finances", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  amountCop: integer("amount_cop").notNull().default(0),
  status: text("status").notNull().default("pending"),
  concept: text("concept").notNull(),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const agendaEvents = pgTable("agenda_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  meetLink: text("meet_link"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const repositories = pgTable("repositories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull().unique(),
  owner: text("owner").notNull(),
  repoName: text("repo_name").notNull(),
  description: text("description"),
  language: text("language"),
  languageColor: text("language_color"),
  stars: integer("stars").notNull().default(0),
  forks: integer("forks").notNull().default(0),
  topics: jsonb("topics").notNull().default(sql`'[]'::jsonb`),
  pushedAt: timestamp("pushed_at"),
  readmeContent: text("readme_content"),
  savedReason: text("saved_reason").notNull(),
  implementationStatus: text("implementation_status").notNull().default("pendiente"),
  priority: integer("priority").notNull().default(3),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const links = pgTable("links", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull().unique(),
  title: text("title"),
  description: text("description"),
  imageUrl: text("image_url"),
  type: text("type").notNull().default("otro"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const socialAccounts = pgTable("social_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(),
  handle: text("handle").notNull(),
  email: text("email"),
  passwordEncrypted: text("password_encrypted"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const contentPlan = pgTable("content_plan", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  socialAccountId: uuid("social_account_id").notNull().references(() => socialAccounts.id),
  title: text("title").notNull(),
  contentType: text("content_type").notNull(),
  status: text("status").notNull().default("idea"),
  scheduledAt: timestamp("scheduled_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const entityLinks = pgTable("entity_links", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: uuid("source_id").notNull(),
  sourceType: entityTypeEnum("source_type").notNull(),
  targetId: uuid("target_id").notNull(),
  targetType: entityTypeEnum("target_type").notNull(),
  relationType: text("relation_type").notNull().default("relates_to"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  sourceIdx: index("entity_links_source_idx").on(table.sourceId, table.sourceType),
  targetIdx: index("entity_links_target_idx").on(table.targetId, table.targetType),
}));
```

20. `[Vertrex-Website/drizzle]` → Ejecutar `npm run db:generate` desde `Vertrex-Website` → Se genera una migración SQL nueva en `Vertrex-Website/drizzle` sin editar manualmente `Vertrex-Website/drizzle/meta/**`.
21. `[Vertrex-Website/.env.local]` → Verificar manualmente que existen `DATABASE_URL`, `ENCRYPTION_KEY`, `AUTH_SECRET`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `MCP_SECRET`, `GITHUB_TOKEN` opcional y `NODE_ENV`; no imprimir valores → El entorno tiene las variables requeridas por el PRD.
22. `[Vertrex-Website/src/lib/auth/session.ts]` → Crear el archivo con el siguiente código de autenticación interna con `jose` y `bcryptjs`. Requiere Step 19 completo → El OS interno puede crear, leer y exigir sesión `os_session`.

```Vertrex-Website/src/lib/auth/session.ts#L1-93
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const OS_COOKIE = "os_session";
const FALLBACK_SECRET = "default_super_secret_for_dev_only";

export type OsRole = "team" | "admin";
export type OsSession = { userId: string; email: string; name: string; role: OsRole };

function getAuthSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || FALLBACK_SECRET);
}

export async function createPasswordHash(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function signOsSession(session: OsSession) {
  const token = await new jose.SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());

  (await cookies()).set(OS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getOsSession(): Promise<OsSession | null> {
  try {
    const token = (await cookies()).get(OS_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jose.jwtVerify(token, getAuthSecret());
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role === "admin" ? "admin" : "team",
    };
  } catch {
    return null;
  }
}

export async function requireOsUser() {
  const session = await getOsSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdminUser() {
  const session = await requireOsUser();
  if (session.role !== "admin") redirect("/os/admin");
  return session;
}

export async function loginTeam(email: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.isActive, true)))
    .limit(1);

  if (!user) throw new Error("Credenciales inválidas");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error("Credenciales inválidas");

  await signOsSession({ userId: user.id, email: user.email, name: user.name, role: user.role });
  return { userId: user.id, role: user.role };
}

export async function logoutTeam() {
  (await cookies()).delete(OS_COOKIE);
}
```

23. `[Vertrex-Website/src/lib/auth/portal.ts]` → Crear el archivo con el siguiente código de autenticación de portal por `slug + PIN`. Requiere Step 19 completo → El portal usa cookie HTTP-only `portal_session` con expiración de 7 días.

```Vertrex-Website/src/lib/auth/portal.ts#L1-77
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";

const PORTAL_COOKIE = "portal_session";
const FALLBACK_SECRET = "default_super_secret_for_dev_only";

export type PortalSession = { clientId: string; slug: string };

function getAuthSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || FALLBACK_SECRET);
}

export async function signPortalSession(session: PortalSession) {
  const token = await new jose.SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());

  (await cookies()).set(PORTAL_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getPortalSession(): Promise<PortalSession | null> {
  try {
    const token = (await cookies()).get(PORTAL_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jose.jwtVerify(token, getAuthSecret());
    return { clientId: String(payload.clientId), slug: String(payload.slug) };
  } catch {
    return null;
  }
}

export async function requirePortalClient(expectedSlug?: string) {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");
  if (expectedSlug && session.slug !== expectedSlug) redirect(`/portal/${session.slug}`);
  return session;
}

export async function verifyPortalAccess(slug: string, pin: string) {
  const [client] = await db.select().from(clients).where(eq(clients.slug, slug)).limit(1);
  if (!client) throw new Error("Cliente no encontrado");
  const valid = await bcrypt.compare(pin, client.pinHash);
  if (!valid) throw new Error("PIN inválido");
  await signPortalSession({ clientId: client.id, slug: client.slug });
  return client;
}

export async function logoutPortalClient() {
  (await cookies()).delete(PORTAL_COOKIE);
}
```

24. `[Vertrex-Website/src/lib/db/actions/graph.ts]` → Crear el archivo con el siguiente código del grafo universal. Requiere Step 19 completo → Las conexiones se crean y consultan bidireccionalmente.

```Vertrex-Website/src/lib/db/actions/graph.ts#L1-92
"use server";

import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { entityLinks } from "@/lib/db/schema";

export const ENTITY_TYPES = [
  "client",
  "project",
  "document",
  "resource",
  "finance",
  "agenda",
  "link",
  "repository",
  "ticket",
  "note",
  "idea",
  "legal",
  "social_account",
  "team_member",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export async function linkEntities(
  sourceId: string,
  sourceType: EntityType,
  targetId: string,
  targetType: EntityType,
  relationType = "relates_to"
) {
  if (sourceId === targetId && sourceType === targetType) throw new Error("No se puede conectar una entidad consigo misma");

  const [existing] = await db
    .select()
    .from(entityLinks)
    .where(
      or(
        and(
          eq(entityLinks.sourceId, sourceId),
          eq(entityLinks.sourceType, sourceType),
          eq(entityLinks.targetId, targetId),
          eq(entityLinks.targetType, targetType)
        ),
        and(
          eq(entityLinks.sourceId, targetId),
          eq(entityLinks.sourceType, targetType),
          eq(entityLinks.targetId, sourceId),
          eq(entityLinks.targetType, sourceType)
        )
      )
    )
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(entityLinks)
    .values({ sourceId, sourceType, targetId, targetType, relationType })
    .returning();

  return created;
}

export async function unlinkEntity(linkId: string) {
  await db.delete(entityLinks).where(eq(entityLinks.id, linkId));
}

export async function getEntityConnections(entityId: string) {
  return db
    .select()
    .from(entityLinks)
    .where(or(eq(entityLinks.sourceId, entityId), eq(entityLinks.targetId, entityId)));
}

export async function getGraphSnapshot() {
  return db.select().from(entityLinks);
}
```

25. `[Vertrex-Website/src/app/login/actions.ts]` → Crear server actions `loginAction` y `logoutAction` usando `loginTeam()` y `logoutTeam()` de `Vertrex-Website/src/lib/auth/session.ts` → El formulario de login interno puede iniciar y cerrar sesión.
26. `[Vertrex-Website/src/app/login/page.tsx]` → Reemplazar el placeholder actual por formulario server-action con campos `email` y `password`, título `Acceso Vertrex OS`, botón `Entrar al OS`, y mensaje de error por querystring `?error=1` → `/login` deja de ser placeholder.
27. `[Vertrex-Website/src/middleware.ts]` → Reemplazar el middleware para proteger `/os/**` con cookie `os_session`, proteger `/portal/**` excepto `/portal/login` con cookie `portal_session`, permitir landing pública y permitir `/api/mcp/graph` solo con Bearer en route handler → Las rutas internas redirigen a `/login` y portal redirige a `/portal/login` cuando no hay sesión.
28. `[Vertrex-Website/src/app/os/page.tsx]` → Crear página que ejecuta `redirect("/os/admin")` → `/os` abre el dashboard del PRD.

### Checkpoint Fase 2

29. `[Vertrex-Website]` → Ejecutar `npm run typecheck` desde `Vertrex-Website` → TypeScript completa con 0 errores. Si falla, no avanzar a la Fase 3.

---

## Fase 3 — Servicios compartidos, layout OS, componentes base y tema

30. `[Vertrex-Website/src/app/layout.tsx]` → Importar `Analytics` desde `@vercel/analytics/next` y renderizar `<Analytics />` dentro de `<body>` después de `<AppChrome>{children}</AppChrome>` → La landing pública y el OS quedan instrumentados con Vercel Analytics.
31. `[Vertrex-Website/src/app/os-theme.css]` → Reemplazar el archivo por tema oscuro `.vertrex-os-theme` sin referencias externas al OS anterior → El OS usa variables visuales propias sin herencia del proyecto anterior.
32. `[Vertrex-Website/src/app/os/layout.tsx]` → Crear layout nuevo que llama `requireOsUser()`, aplica clase `vertrex-os-theme`, renderiza sidebar con rutas exactas del PRD: `/os/admin`, `/os/crm`, `/os/projects`, `/os/documents`, `/os/legal`, `/os/hub`, `/os/resources`, `/os/finances`, `/os/agenda`, `/os/links`, `/os/marketing`, `/os/team`, `/os/generator`, `/os/settings` → Todas las rutas internas comparten shell nuevo y no queda sidebar anterior.
33. `[Vertrex-Website/src/components/os/Graph/EntitySidebar.tsx]` → Crear componente Server Component async que recibe `entityId`, llama `getEntityConnections(entityId)`, agrupa por `targetType/sourceType`, y muestra lista de conexiones activas → Toda vista de detalle puede mostrar el panel obligatorio del grafo.
34. `[Vertrex-Website/src/components/os/Graph/EntityGraph.tsx]` → Crear componente Client Component con `@xyflow/react` que recibe `entityId` y `connections` por props, construye nodos/edges y muestra `ReactFlow`, `Background`, `Controls`, `MiniMap` → El grafo visual opcional existe sin llamar server actions desde cliente.
35. `[Vertrex-Website/src/components/os/Editor/BlockEditor.tsx]` → Crear componente Client Component con `@blocknote/react` y `@blocknote/mantine` que acepta `initialContent`, `onChange`, `editable` y devuelve JSON BlockNote serializado → El editor rico soporta headings, listas, bold, italic, código y links.
36. `[Vertrex-Website/src/components/os/Hub/QuickIdeaModal.tsx]` → Crear Client Component que escucha `Ctrl+I` y `Cmd+I`, abre modal con un textarea grande, llama server action `quickCaptureIdea`, y cierra modal al guardar → Captura rápida de ideas desde cualquier parte del OS.
37. `[Vertrex-Website/src/components/os/Uploader/SmartUploader.tsx]` → Crear Client Component con input file oculto, botón visible, POST a `/api/upload`, prop opcional `source="portal" | "os"`, y callback `onUploaded` → Subidas usan endpoint nuevo y portal puede forzar Drive.
38. `[Vertrex-Website/src/lib/drive/service.ts]` → Reemplazar por servicio que usa `googleapis`, `GOOGLE_SERVICE_ACCOUNT_JSON`, scope `https://www.googleapis.com/auth/drive.file`, y función `uploadToDrive(fileBuffer, fileName, mimeType)` → Google Drive funciona con Service Account.
39. `[Vertrex-Website/src/lib/security/encryption.ts]` → Mantener AES-256-GCM con IV dinámico de 16 bytes y validar que `ENCRYPTION_KEY` tenga 64 caracteres hex → Recursos y credenciales se cifran según PRD.
40. `[Vertrex-Website/src/lib/security/password.ts]` → Reemplazar para exportar `hashPin(pin)`, `verifyPin(pin, hash)`, `generateSixDigitPin()` y `hashPassword(password)` usando `bcryptjs` 10 rounds → CRM y Equipo comparten helpers de PIN/password.

### Checkpoint Fase 3

41. `[Vertrex-Website]` → Ejecutar `npm run typecheck` desde `Vertrex-Website` → TypeScript completa con 0 errores. Si falla, no avanzar a la Fase 4.

---

## Fase 4 — Server actions y APIs críticas

42. `[Vertrex-Website/src/lib/db/actions/crm.ts]` → Crear server actions `createClientAction`, `generateClientPinAction`, `updateClientAction` y `getClientGraphSummary`; `generateClientPinAction` debe generar PIN de 6 dígitos, hashearlo con `bcryptjs` 10 rounds, guardar `pin_hash`, y devolver el PIN plano una sola vez → CRM cumple generación de acceso portal.
43. `[Vertrex-Website/src/lib/db/actions/projects.ts]` → Crear server actions `createProjectAction`, `updateProjectAction`, `addProjectReferenceLinkAction`, `connectProjectEntityAction` y `projectHasPaidAdvance` → Proyectos soporta progreso, versión, links y badge de anticipo.
44. `[Vertrex-Website/src/lib/db/actions/hub.ts]` → Crear el archivo con el siguiente código crítico de Knowledge Hub. Requiere Steps 19 y 24 completos → Notas, ideas, captura rápida, estados y conversión a proyecto quedan implementados.

```Vertrex-Website/src/lib/db/actions/hub.ts#L1-145
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { knowledgeNotes, projects } from "@/lib/db/schema";
import { linkEntities } from "@/lib/db/actions/graph";

const EMPTY_DOC = { type: "doc", content: [] };

function titleFromText(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 60 ? `${clean.slice(0, 60)}…` : clean || "Idea sin título";
}

function blockNoteFromPlainText(text: string) {
  return [
    {
      id: crypto.randomUUID(),
      type: "paragraph",
      props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
      content: [{ type: "text", text, styles: {} }],
      children: [],
    },
  ];
}

export async function quickCaptureIdea(rawContent: string) {
  const content = rawContent.trim();
  if (!content) throw new Error("La idea no puede estar vacía");

  const [note] = await db
    .insert(knowledgeNotes)
    .values({
      title: titleFromText(content),
      contentJson: blockNoteFromPlainText(content),
      type: "software_idea",
      ideaStatus: "semilla",
    })
    .returning();

  revalidatePath("/os/hub");
  return note;
}

export async function createKnowledgeNote(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "note");
  if (!title) throw new Error("El título es obligatorio");

  const [note] = await db
    .insert(knowledgeNotes)
    .values({
      title,
      contentJson: EMPTY_DOC,
      type: type === "software_idea" ? "software_idea" : "note",
      ideaStatus: type === "software_idea" ? "semilla" : null,
    })
    .returning();

  revalidatePath("/os/hub");
  redirect(`/os/hub/${note.id}`);
}

export async function saveKnowledgeNote(id: string, input: { title: string; contentJson: unknown; nextStep?: string | null }) {
  const title = input.title.trim();
  if (!title) throw new Error("El título es obligatorio");

  await db
    .update(knowledgeNotes)
    .set({ title, contentJson: input.contentJson, nextStep: input.nextStep || null })
    .where(eq(knowledgeNotes.id, id));

  revalidatePath("/os/hub");
  revalidatePath(`/os/hub/${id}`);
}

export async function updateIdeaStatus(id: string, status: "semilla" | "laboratorio" | "ejecutar" | "congelador") {
  await db.update(knowledgeNotes).set({ ideaStatus: status }).where(eq(knowledgeNotes.id, id));
  revalidatePath("/os/hub");
  revalidatePath(`/os/hub/${id}`);
}

export async function convertIdeaToProject(id: string) {
  const [idea] = await db.select().from(knowledgeNotes).where(eq(knowledgeNotes.id, id)).limit(1);
  if (!idea) throw new Error("Idea no encontrada");
  if (idea.type !== "software_idea") throw new Error("Solo las ideas se pueden convertir en proyecto");

  const [project] = await db
    .insert(projects)
    .values({
      name: idea.title,
      status: "active",
      progress: 0,
      currentVersion: "v1.0",
      referenceLinks: [],
    })
    .returning();

  await db
    .update(knowledgeNotes)
    .set({ ideaStatus: "ejecutar", relatedProjectId: project.id })
    .where(eq(knowledgeNotes.id, id));

  await linkEntities(id, "idea", project.id, "project", "became_project");

  revalidatePath("/os/hub");
  revalidatePath("/os/projects");
  redirect(`/os/projects/${project.id}`);
}
```

45. `[Vertrex-Website/src/lib/db/actions/resources.ts]` → Crear server actions `createResourceAction`, `revealResourceAction`, `connectResourceEntityAction`; usar `encrypt()` al guardar y `decrypt()` solo al revelar → Recursos confidenciales nunca muestran valor en listas.
46. `[Vertrex-Website/src/lib/db/actions/finances.ts]` → Crear server actions `createFinanceAction`, `markFinancePaidAction`, `getMonthlyFinanceSummary`, `getProjectFinanceForPortal` → Finanzas calcula ingresos, gastos, flujo neto y datos del portal.
47. `[Vertrex-Website/src/lib/db/actions/agenda.ts]` → Crear server actions `createAgendaEventAction`, `connectAgendaEntityAction`, `getPortalAgendaEvents` → Agenda conecta eventos con clientes/proyectos.
48. `[Vertrex-Website/src/lib/db/actions/team.ts]` → Crear server actions protegidas por `requireAdminUser()`: `createTeamMemberAction`, `updateTeamMemberRoleAction`, `deactivateTeamMemberAction` → Solo admin gestiona equipo.
49. `[Vertrex-Website/src/lib/db/actions/marketing.ts]` → Crear server actions `createSocialAccountAction`, `revealSocialPasswordAction`, `createContentPlanAction`, `updateContentPlanStatusAction` → Marketing soporta cuentas y mini agenda manual.
50. `[Vertrex-Website/src/lib/links/service.ts]` → Crear servicio con el siguiente código para GitHub REST API v3 y meta tags generales. Requiere Steps 12 y dependencia `cheerio` ya instalada → Links detecta GitHub y obtiene OG tags.

```Vertrex-Website/src/lib/links/service.ts#L1-124
import * as cheerio from "cheerio";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  Ruby: "#701516",
  CSS: "#563d7c",
  HTML: "#e34c26",
};

export function parseGitHubUrl(url: string) {
  const parsed = new URL(url);
  if (parsed.hostname !== "github.com") return null;
  const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
  if (!owner || !repo) return null;
  return { owner, repo: repo.replace(/\.git$/, ""), normalizedUrl: `https://github.com/${owner}/${repo.replace(/\.git$/, "")}` };
}

function githubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

export async function fetchGitHubRepo(url: string) {
  const parsed = parseGitHubUrl(url);
  if (!parsed) throw new Error("URL de GitHub inválida");

  const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
    headers: githubHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudieron obtener metadatos del repositorio");
  const data = await res.json();

  return {
    url: parsed.normalizedUrl,
    owner: parsed.owner,
    repoName: parsed.repo,
    description: data.description as string | null,
    language: data.language as string | null,
    languageColor: data.language ? LANGUAGE_COLORS[data.language] || "#64748b" : null,
    stars: Number(data.stargazers_count || 0),
    forks: Number(data.forks_count || 0),
    topics: Array.isArray(data.topics) ? data.topics : [],
    pushedAt: data.pushed_at ? new Date(data.pushed_at) : null,
  };
}

export async function fetchGitHubReadme(owner: string, repo: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: githubHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("README no disponible");
  const data = await res.json();
  return Buffer.from(String(data.content || ""), "base64").toString("utf8");
}

export async function fetchOpenGraph(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo leer la URL");
  const html = await res.text();
  const $ = cheerio.load(html);
  const title = $('meta[property="og:title"]').attr("content") || $("title").text() || url;
  const description = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || null;
  const imageUrl = $('meta[property="og:image"]').attr("content") || null;
  let type = "otro";
  const host = new URL(url).hostname;
  if (host.includes("tiktok")) type = "tiktok";
  else if (host.includes("reddit")) type = "reddit";
  else if (host.includes("medium") || host.includes("dev.to")) type = "article";

  return { url, title, description, imageUrl, type };
}
```

51. `[Vertrex-Website/src/lib/db/actions/links.ts]` → Crear server actions `saveExternalReferenceAction`, `updateRepositoryStatusAction`, `updateRepositoryPriorityAction`, `loadRepositoryReadmeAction`; usar `fetchGitHubRepo`, `fetchOpenGraph`, `fetchGitHubReadme`, guardar `saved_reason` obligatorio en repositorios, y cachear README en `repositories.readme_content` → Módulo Links cumple flujo GitHub y flujo link general.
52. `[Vertrex-Website/src/app/api/upload/route.ts]` → Crear route handler con el siguiente código. Requiere Steps 19, 23, 24 y 38 completos → Archivos `< 1.5 MB` van a Neon como base64, archivos `>= 1.5 MB` van a Drive, y portal siempre fuerza Drive.

```Vertrex-Website/src/app/api/upload/route.ts#L1-73
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { uploadToDrive } from "@/lib/drive/service";
import { getPortalSession } from "@/lib/auth/portal";
import { linkEntities } from "@/lib/db/actions/graph";

const NEON_LIMIT_BYTES = 1.5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const source = String(formData.get("source") || "os");
    if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const portalSession = source === "portal" ? await getPortalSession() : null;
    const forceDrive = Boolean(portalSession);
    const shouldUseDrive = forceDrive || file.size >= NEON_LIMIT_BYTES;

    let storageProvider: "neon" | "drive" = "neon";
    let driveFileId: string | null = null;
    let url: string | null = null;
    let contentBase64: string | null = null;

    if (shouldUseDrive) {
      const uploaded = await uploadToDrive(buffer, file.name, file.type || "application/octet-stream");
      storageProvider = "drive";
      driveFileId = uploaded.id;
      url = uploaded.webViewLink || null;
    } else {
      contentBase64 = Buffer.from(buffer).toString("base64");
    }

    const [doc] = await db
      .insert(documents)
      .values({
        name: file.name,
        sizeBytes: file.size,
        storageProvider,
        driveFileId,
        url,
        mimeType: file.type || "application/octet-stream",
        contentBase64,
      })
      .returning();

    if (portalSession) {
      await linkEntities(portalSession.clientId, "client", doc.id, "document", "uploaded_by_client");
    }

    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error al subir archivo" }, { status: 500 });
  }
}
```

53. `[Vertrex-Website/src/app/api/mcp/graph/route.ts]` → Crear route handler `GET` que valida `Authorization: Bearer ${process.env.MCP_SECRET}` y retorna JSON con `clients`, `projects`, `entity_links`; si el token falla retorna HTTP 401 → Endpoint MCP exacto del PRD queda disponible.
54. `[Vertrex-Website/src/app/api/documents/[id]/route.ts]` → Crear route handler `GET` que entrega `content_base64` como archivo descargable si `storage_provider='neon'`, o redirige a `documents.url` si `storage_provider='drive'` → Documentos tienen descarga directa.

### Checkpoint Fase 4

55. `[Vertrex-Website]` → Ejecutar `npm run typecheck` desde `Vertrex-Website` → TypeScript completa con 0 errores. Si falla, no avanzar a la Fase 5.

---

## Fase 5 — Módulos OS internos

56. `[Vertrex-Website/src/app/os/admin/page.tsx]` → Crear dashboard con métricas: clientes activos, proyectos activos, estado DB, links externos a Vercel Analytics y Neon DB Studio, y placeholder explícito de almacenamiento Neon usado si no hay API disponible → `/os/admin` cumple Dashboard / Landing Analytics v1 simple.
57. `[Vertrex-Website/src/app/os/crm/page.tsx]` → Crear lista paginada simple de clientes con filtro por `status`, botón `+ Cliente`, tabla con `name`, `slug`, `email`, `phone`, `status` → `/os/crm` cumple lista CRM.
58. `[Vertrex-Website/src/app/os/crm/[slug]/page.tsx]` → Crear detalle de cliente; si `slug === "new"` renderiza formulario de creación; si existe cliente muestra datos, botón `Generar PIN`, caja que muestra PIN plano solo cuando llega por querystring `?pin=XXXXXX`, tickets, proyectos/documentos/finanzas conectados, y `EntitySidebar` → `/os/crm/[slug]` cumple detalle y PIN.
59. `[Vertrex-Website/src/app/os/projects/page.tsx]` → Crear tabla/kanban simple filtrable por `status`, botón `+ Proyecto`, tarjeta por proyecto con progreso, versión y badge rojo si `projectHasPaidAdvance()` retorna false → `/os/projects` cumple v1.
60. `[Vertrex-Website/src/app/os/projects/[id]/page.tsx]` → Crear detalle de proyecto con nombre, status, barra de progreso, input de versión, editor de reference_links, secciones de conexiones, `EntitySidebar`, `EntityGraph` opcional y badge de anticipo 50% → `/os/projects/[id]` cumple detalle.
61. `[Vertrex-Website/src/app/os/documents/page.tsx]` → Crear lista de documentos con filtros por `mimeType` y `storageProvider`, incluir `SmartUploader source="os"`, y links de descarga `/api/documents/[id]` → `/os/documents` cumple repositorio.
62. `[Vertrex-Website/src/app/os/documents/[id]/page.tsx]` → Crear detalle de documento con metadata, preview si imagen o PDF, botón descargar, y `EntitySidebar` → `/os/documents/[id]` cumple detalle.
63. `[Vertrex-Website/src/app/os/legal/page.tsx]` → Crear lista de `legal_documents` filtrable por `type`, formulario de alta simple, toggle `is_public`, y subida con `SmartUploader` o campos manuales → `/os/legal` cumple repositorio legal.
64. `[Vertrex-Website/src/app/os/legal/[id]/page.tsx]` → Crear detalle legal con nombre, tipo, signed_at, is_public, descarga si existe URL, y `EntitySidebar` → `/os/legal/[id]` cumple detalle.
65. `[Vertrex-Website/src/app/os/hub/layout.tsx]` → Crear layout interno del Hub con navegación `Notas`, `Incubadora de Ideas`, y montar `QuickIdeaModal` para atajo global → Knowledge Hub tiene navegación propia.
66. `[Vertrex-Website/src/app/os/hub/page.tsx]` → Crear vista dual: si `?view=notes`, lista notas; si `?view=ideas` o sin query, tablero de cuatro columnas `semilla`, `laboratorio`, `ejecutar`, `congelador`; cada tarjeta muestra título, primeras 2 líneas, next_step y conteo de conexiones → `/os/hub` cumple notas e incubadora.
67. `[Vertrex-Website/src/app/os/hub/[id]/page.tsx]` → Crear detalle de nota/idea con `BlockEditor`, preguntas fijas no editables para ideas, campo `next_step`, botón Guardar, botón Convertir en Proyecto solo si `idea_status='ejecutar'`, y `EntitySidebar` → `/os/hub/[id]` cumple editor profundo.
68. `[Vertrex-Website/src/app/os/resources/page.tsx]` → Crear lista de recursos mostrando solo `title` y `type`, formulario de creación cifrada, botón `Revelar` que llama `revealResourceAction` → `/os/resources` cumple bóveda v1.
69. `[Vertrex-Website/src/app/os/resources/[id]/page.tsx]` → Crear detalle de recurso con metadata, botón revelar, y `EntitySidebar` → `/os/resources/[id]` cumple detalle.
70. `[Vertrex-Website/src/app/os/finances/page.tsx]` → Crear tabla con filtros `type` y `status`, resumen de total ingresos, total gastos y flujo neto del mes en COP, y badges rojos para anticipos pendientes → `/os/finances` cumple finanzas.
71. `[Vertrex-Website/src/app/os/finances/[id]/page.tsx]` → Crear detalle de registro financiero con monto COP, estado, fechas, botón marcar pagado, y `EntitySidebar` → `/os/finances/[id]` cumple detalle.
72. `[Vertrex-Website/src/app/os/agenda/page.tsx]` → Crear calendario simple semanal/mensual con lista de eventos próximos, formulario con título, descripción, starts_at, ends_at, meet_link, y conexión a cliente/proyecto → `/os/agenda` cumple agenda simple.
73. `[Vertrex-Website/src/app/os/links/page.tsx]` → Crear vista principal con dos secciones: Repositorios GitHub y Links Generales; formulario de URL con campo obligatorio `saved_reason` cuando sea GitHub; filtros por language, implementation_status, topics y priority; buscador que prioriza `saved_reason` → `/os/links` cumple módulo Links.
74. `[Vertrex-Website/src/app/os/links/[id]/page.tsx]` → Crear detalle de repositorio/link; para repositorio mostrar botón `Ver README`, panel `react-markdown`, `saved_reason` fijado arriba, status y priority editables → `/os/links/[id]` cumple modo lectura.
75. `[Vertrex-Website/src/app/os/marketing/page.tsx]` → Crear lista de cuentas sociales, formulario de alta, mini agenda de contenido por cuenta y campos manuales de notas/estadísticas → `/os/marketing` cumple v1 sin APIs externas.
76. `[Vertrex-Website/src/app/os/marketing/[id]/page.tsx]` → Crear detalle de cuenta social con revelar password, content_plan filtrado por cuenta, formulario de contenido y cambio de status → `/os/marketing/[id]` cumple detalle.
77. `[Vertrex-Website/src/app/os/team/page.tsx]` → Crear página protegida por `requireAdminUser()` con lista de usuarios, crear miembro, cambiar rol team/admin y desactivar usuario → `/os/team` cumple módulo Equipo.
78. `[Vertrex-Website/src/app/os/team/[userId]/page.tsx]` → Crear detalle admin de usuario con email, name, role, is_active, acciones cambiar rol/desactivar → `/os/team/[userId]` cumple detalle.
79. `[Vertrex-Website/src/app/os/generator/page.tsx]` → Reescribir generador para subir `.html` o pegar textarea, detectar variables con regex `/\{\{([^}]+)\}\}/g`, renderizar inputs, preview iframe en tiempo real, y descargar `.html`; no guardar en BD → `/os/generator` cumple PRD.
80. `[Vertrex-Website/src/app/os/settings/page.tsx]` → Crear configuración protegida por `requireAdminUser()` con cambio de contraseña, gestión de variables internas guardadas como `resources` cifrados, y documentación visible de `GET /api/mcp/graph` → `/os/settings` cumple configuración.

### Checkpoint Fase 5

81. `[Vertrex-Website]` → Ejecutar `npm run typecheck` desde `Vertrex-Website` → TypeScript completa con 0 errores. Luego navegar manualmente a `/login`, iniciar sesión con un usuario `admin`, abrir `/os/admin`, `/os/crm`, `/os/projects`, `/os/hub`, `/os/links`, `/os/settings` y confirmar que todas renderizan sin error 500. Además, validar contra `Vertrex-Website/docs/md/vertrex-os-ux-spec.md`: cada ruta debe tener `PageHeader`, toolbar cuando liste datos, skeleton/loading, empty state, error state, toast/feedback, tabs o sidebar en detalles, y responsive correcto a 390px. Si alguna pantalla parece scaffold básico, no avanzar a la Fase 6.

---

## Fase 6 — Portal de clientes

82. `[Vertrex-Website/src/app/portal/layout.tsx]` → Crear layout público simplificado con alto contraste, tipografía grande, `lang="es"` heredado, sin navegación anidada → Portal cumple principio de baja fricción.
83. `[Vertrex-Website/src/app/portal/login/actions.ts]` → Crear server action `loginClientAction` que llama `verifyPortalAccess(slug, pin)` y redirige a `/portal/[slug]` → Login del portal usa `slug + PIN`.
84. `[Vertrex-Website/src/app/portal/login/page.tsx]` → Crear formulario con campos grandes `Slug del cliente` y `PIN de 6 dígitos`, botón `Entrar a mi portal`, errores legibles → `/portal/login` cumple acceso cliente.
85. `[Vertrex-Website/src/app/portal/[slug]/page.tsx]` → Crear dashboard cliente que llama `requirePortalClient(slug)`, muestra proyectos conectados, barra de progreso grande, versión actual, documentos conectados, legales públicos, finanzas pagado/pendiente, agenda próxima y link a tickets/archivos → `/portal/[slug]` cumple dashboard.
86. `[Vertrex-Website/src/app/portal/[slug]/files/page.tsx]` → Crear página con `SmartUploader source="portal"`, instrucciones simples, lista de documentos conectados y descarga → Los archivos del portal siempre van a Drive y se conectan al cliente.
87. `[Vertrex-Website/src/app/portal/[slug]/tickets/page.tsx]` → Crear página con formulario de ticket `title + description`, historial del cliente, estados `open | in_progress | resolved`, y conexión automática al cliente vía graph → Portal puede enviar tickets.

### Checkpoint Fase 6

88. `[Vertrex-Website]` → Ejecutar `npm run typecheck` desde `Vertrex-Website` → TypeScript completa con 0 errores. Luego en UI crear un cliente desde `/os/crm/new`, copiar el PIN de 6 dígitos mostrado una sola vez, cerrar sesión, navegar a `/portal/login`, entrar con `slug + PIN`, crear un ticket, subir un archivo pequeño y confirmar que aparece conectado al cliente. Si falla, no avanzar a la Fase 7.

---

## Fase 7 — Datos iniciales, pruebas y validación final

89. `[Vertrex-Website/src/lib/db/seed.ts]` → Crear script idempotente que crea usuario admin inicial solo si no existe; email por `process.env.SEED_ADMIN_EMAIL`, password por `process.env.SEED_ADMIN_PASSWORD`, hash con `hashPassword`, role `admin`, `isActive=true` → Existe forma segura de crear primer admin sin hardcodear credenciales.
90. `[Vertrex-Website/package.json]` → Verificar que `tsx` ya está en `devDependencies`; está instalado actualmente. No instalar. Confirmar script `db:seed` apunta a `tsx src/lib/db/seed.ts` → Seed puede ejecutarse sin agregar dependencia.
91. `[Vertrex-Website/e2e/auth.spec.ts]` → Reescribir pruebas Playwright para validar que `/login` carga, `/os/admin` redirige a `/login` sin sesión, `/portal/login` carga, y `/portal/demo` redirige a `/portal/login` sin sesión → Pruebas reflejan autenticación real del PRD.
92. `[Vertrex-Website/e2e/workspace.spec.ts]` → Reescribir pruebas Playwright para validar landing pública `/`, existencia de `/login`, existencia de `/portal/login`, y no probar rutas eliminadas del OS anterior → No quedan tests del OS antiguo.
93. `[Vertrex-Website/README.md]` → Añadir sección breve `Vertrex OS` con comandos `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`, variables de entorno requeridas sin valores, y rutas principales → Documentación mínima de operación queda disponible.
94. `[Vertrex-Website]` → Ejecutar `npm run db:generate` nuevamente → Drizzle confirma que no hay cambios pendientes no reflejados en migración.
95. `[Vertrex-Website]` → Ejecutar `npm run typecheck` → TypeScript completa con 0 errores.
96. `[Vertrex-Website]` → Ejecutar `npm run build` → Next build completa con 0 errores.
97. `[Vertrex-Website]` → Ejecutar `npm run db:migrate` con `DATABASE_URL` apuntando a Neon de desarrollo → Migración aplica correctamente en base de datos.
98. `[Vertrex-Website]` → Ejecutar `npm run db:seed` con `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` configurados por el dueño del proyecto → Usuario admin inicial existe.
99. `[Vertrex-Website]` → Ejecutar validación UI manual completa: entrar a `/login`, acceder al OS, crear cliente, generar PIN de 6 dígitos, crear proyecto, conectar cliente-proyecto, crear nota, usar `Ctrl+I` para idea rápida, mover idea a `ejecutar`, convertirla en proyecto, subir documento `<1.5 MB`, subir documento `>=1.5 MB`, guardar repo GitHub con `saved_reason`, abrir README, crear ticket desde portal, recargar portal y confirmar persistencia → Flujos principales v1 cumplen PRD.

### Checkpoint Fase 7

100. `[Vertrex-Website]` → Ejecutar `npm run typecheck && npm run build` desde `Vertrex-Website`; después repetir validación UI de Step 99 y completar `Vertrex-Website/docs/md/vertrex-os-ux-checklist.md` con todas las rutas principales aprobadas → Ambos comandos terminan con 0 errores, los datos persisten tras recargar y ninguna pantalla conserva UI básica. Si falla, corregir antes de considerar la implementación terminada.

---

## Resultado esperado final

- No queda rastro funcional ni visual del OS anterior básico.
- Las rutas del PRD existen y renderizan.
- El grafo universal usa `entity_links` y `EntitySidebar` en detalles de entidades.
- Archivos pequeños se guardan en Neon como base64; archivos grandes y portal se suben a Drive.
- OS interno usa JWT cookie HTTP-only con roles `team` y `admin`.
- Portal cliente usa `slug + PIN` con JWT cookie HTTP-only por 7 días.
- Knowledge Hub soporta notas, ideas, captura rápida, ciclo de vida y conversión a proyecto.
- Links detecta GitHub, guarda `saved_reason`, metadatos y README cacheado.
- MCP expone `GET /api/mcp/graph` con Bearer `MCP_SECRET`.
- Todas las pantallas cumplen `Vertrex-Website/docs/md/vertrex-os-ux-spec.md` y el checklist `Vertrex-Website/docs/md/vertrex-os-ux-checklist.md` queda aprobado.
