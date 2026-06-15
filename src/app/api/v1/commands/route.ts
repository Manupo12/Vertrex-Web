import { authed } from "@/lib/api/handler";

export const runtime = "nodejs";

/**
 * Catálogo de endpoints v1 (estático, MVP).
 * En Fase 2/3 se generará desde zod→OpenAPI con @asteasolutions/zod-to-openapi.
 */
const ENDPOINTS = [
  { method: "POST", path: "/api/v1/auth/login", auth: false, summary: "Login (email+password, optional 2FA) → PAT" },
  { method: "GET", path: "/api/v1/auth/whoami", auth: true, summary: "Usuario y permisos del token actual" },
  { method: "GET", path: "/api/v1/auth/tokens", auth: true, summary: "Listar tokens personales" },
  { method: "POST", path: "/api/v1/auth/tokens", auth: true, summary: "Crear un PAT" },
  { method: "DELETE", path: "/api/v1/auth/tokens/{id}", auth: true, summary: "Revocar un PAT" },
  { method: "GET", path: "/api/v1/tasks", auth: true, summary: "Listar tareas" },
  { method: "POST", path: "/api/v1/tasks", auth: true, summary: "Crear tarea" },
  { method: "GET", path: "/api/v1/tasks/{id}", auth: true, summary: "Detalle de tarea" },
  { method: "PATCH", path: "/api/v1/tasks/{id}", auth: true, summary: "Actualizar tarea" },
  { method: "DELETE", path: "/api/v1/tasks/{id}", auth: true, summary: "Borrar tarea" },
  { method: "POST", path: "/api/v1/tasks/{id}/state", auth: true, summary: "Cambiar estado" },
  { method: "POST", path: "/api/v1/tasks/{id}/assign", auth: true, summary: "Asignar" },
  { method: "POST", path: "/api/v1/tasks/{id}/move", auth: true, summary: "Mover de proyecto" },
  { method: "POST", path: "/api/v1/tasks/{id}/subtasks", auth: true, summary: "Crear subtarea" },
  { method: "POST", path: "/api/v1/tasks/{id}/block", auth: true, summary: "Marcar como bloqueada por otra" },
  { method: "DELETE", path: "/api/v1/tasks/{id}/block", auth: true, summary: "Quitar bloqueo" },
  { method: "GET", path: "/api/v1/projects", auth: true, summary: "Listar proyectos" },
  { method: "POST", path: "/api/v1/projects", auth: true, summary: "Crear proyecto" },
  { method: "GET", path: "/api/v1/projects/{id}", auth: true, summary: "Detalle de proyecto" },
  { method: "PATCH", path: "/api/v1/projects/{id}", auth: true, summary: "Actualizar proyecto" },
  { method: "DELETE", path: "/api/v1/projects/{id}", auth: true, summary: "Borrar proyecto" },
  { method: "GET", path: "/api/v1/clients", auth: true, summary: "Listar clientes" },
  { method: "POST", path: "/api/v1/clients", auth: true, summary: "Crear cliente" },
  { method: "GET", path: "/api/v1/clients/{id}", auth: true, summary: "Detalle (id o slug)" },
  { method: "PATCH", path: "/api/v1/clients/{id}", auth: true, summary: "Actualizar" },
  { method: "DELETE", path: "/api/v1/clients/{id}", auth: true, summary: "Borrar" },
  { method: "GET", path: "/api/v1/agenda", auth: true, summary: "Listar eventos" },
  { method: "POST", path: "/api/v1/agenda", auth: true, summary: "Crear evento" },
  { method: "GET", path: "/api/v1/agenda/{id}", auth: true, summary: "Detalle" },
  { method: "PATCH", path: "/api/v1/agenda/{id}", auth: true, summary: "Actualizar" },
  { method: "DELETE", path: "/api/v1/agenda/{id}", auth: true, summary: "Borrar" },
  { method: "GET", path: "/api/v1/notes", auth: true, summary: "Listar notas" },
  { method: "POST", path: "/api/v1/notes", auth: true, summary: "Crear nota" },
  { method: "GET", path: "/api/v1/notes/{id}", auth: true, summary: "Detalle" },
  { method: "PATCH", path: "/api/v1/notes/{id}", auth: true, summary: "Actualizar" },
  { method: "DELETE", path: "/api/v1/notes/{id}", auth: true, summary: "Borrar" },
  { method: "GET", path: "/api/v1/activity", auth: true, summary: "Auditoría reciente" },
  { method: "GET", path: "/api/v1/search", auth: true, summary: "Búsqueda global" },
  { method: "POST", path: "/api/v1/intent", auth: true, summary: "Intención NL → plan/ejecutar" },
] as const;

export const GET = authed(async () => ({
  name: "vertrex-os-api",
  version: "v1",
  endpoints: ENDPOINTS,
  conventions: {
    envelope: { success: "{data: ...}", error: "{error: {code, message, details?}}" },
    pagination: "use ?limit=&offset= (defaults: 100 list, 200 activity, 25 search)",
    idempotency: "use ?idempotencyKey= on POST in Phase 2",
  },
}));
