/**
 * Intent parser: mapea intención en lenguaje natural → acción MVP.
 *
 * Acciones soportadas (allowlist):
 *   - create_task       { title, projectId?, priority?, dueDate? }
 *   - change_state      { id, state }
 *   - assign_task       { id, assigneeId }
 *   - create_note       { title, type? }
 *   - search            { q }
 *   - list_tasks        { projectId? }
 *   - list_clients      {}
 *
 * Diseño conservador: siempre devuelve un PLAN; ejecutar es decisión del caller
 * (handler revalida contra allowlist y respeta RBAC server-side).
 */

export type IntentAction =
  | { name: "create_task"; args: Record<string, unknown> }
  | { name: "change_state"; args: Record<string, unknown> }
  | { name: "assign_task"; args: Record<string, unknown> }
  | { name: "create_note"; args: Record<string, unknown> }
  | { name: "search"; args: Record<string, unknown> }
  | { name: "list_tasks"; args: Record<string, unknown> }
  | { name: "list_clients"; args: Record<string, unknown> };

const VALID_STATES = ["backlog", "todo", "in_progress", "in_review", "done", "cancelled"];

export function parseIntent(text: string): { action: IntentAction | null; reason?: string } {
  const orig = text.trim();
  const t = orig.toLowerCase();

  // CREATE TASK: "crea una tarea ...", "nueva tarea ...", "create task ..."
  let m = t.match(/(?:crea|crear|nueva|añade|agregar|create|new|add)\s+(?:una\s+)?tarea\s+(?:llamada\s+|titulo\s+|titled\s+)?["']?(.+?)["']?\s*$/i);
  if (!m) m = t.match(/(?:crea|crear|new|create)\s+task\s+["']?(.+?)["']?\s*$/i);
  if (m) {
    // take title from the ORIGINAL text (preserves casing)
    const origMatch = orig.match(/(?:crea|crear|nueva|añade|agregar|create|new|add)\s+(?:una\s+)?tarea\s+(?:llamada\s+|titulo\s+|titled\s+)?["']?(.+?)["']?\s*$/i)
      ?? orig.match(/(?:crea|crear|new|create)\s+task\s+["']?(.+?)["']?\s*$/i);
    const title = (origMatch?.[1] ?? m[1]).trim().replace(/^["']|["']$/g, "");
    if (title.length === 0) return { action: null, reason: "No se detectó título de la tarea" };
    return { action: { name: "create_task", args: { title } } };
  }

  // CHANGE STATE: "marca la tarea <id> como <state>", "cambia estado de <id> a <state>", "move task <id> to <state>", "set task <id> to <state>"
  // (operamos sobre el texto ORIGINAL para preservar el case del id)
  m = orig.match(/(?:marca|cambia|set|move)\s+(?:la\s+|el\s+)?(?:estado\s+(?:de\s+)?(?:la\s+)?tarea\s+|tarea\s+|task\s+)([\w-]+)\s+(?:a|como|to|as)\s+(\w+)/i);
  if (m) {
    const state = m[2].toLowerCase();
    if (!VALID_STATES.includes(state)) {
      return { action: null, reason: `Estado inválido: "${state}". Válidos: ${VALID_STATES.join(", ")}` };
    }
    return { action: { name: "change_state", args: { id: m[1], state } } };
  }

  // ASSIGN TASK: "asigna la tarea <id> a <user|me>" (también inglés: "assign task <id> to <user>")
  m = orig.match(/(?:asigna|assign)\s+(?:la\s+|el\s+)?(?:tarea\s+|task\s+)([\w-]+)\s+(?:a|to)\s+(\w+)/i);
  if (m) {
    return { action: { name: "assign_task", args: { id: m[1], assigneeId: m[2] } } };
  }

  // CREATE NOTE: "crea una nota ...", "apunta que ..."
  m = t.match(/(?:crea|crear|apunta|anota)\s+(?:una\s+)?nota\s+(?:llamada\s+|titulo\s+|titled\s+)?["']?(.+?)["']?\s*$/i);
  if (m) {
    const origMatch = orig.match(/(?:crea|crear|apunta|anota)\s+(?:una\s+)?nota\s+(?:llamada\s+|titulo\s+|titled\s+)?["']?(.+?)["']?\s*$/i);
    const title = (origMatch?.[1] ?? m[1]).trim().replace(/^["']|["']$/g, "");
    if (title.length === 0) return { action: null, reason: "No se detectó título de la nota" };
    return { action: { name: "create_note", args: { title } } };
  }

  // LIST TASKS
  if (/^(lista|listar|mostrar|list|show)\s+(las\s+)?tareas?$/i.test(t) || /^(lista|listar)\s+tareas\s+del?\s+proyecto\s+(\w+)$/i.test(t)) {
    const m2 = t.match(/proyecto\s+(\w+)/i);
    return { action: { name: "list_tasks", args: m2 ? { projectId: m2[1] } : {} } };
  }

  // LIST CLIENTS
  if (/^(lista|listar|mostrar|list|show)\s+(los\s+)?clientes?$/i.test(t)) {
    return { action: { name: "list_clients", args: {} } };
  }

  // SEARCH
  m = t.match(/^(?:busca|search|buscar)\s+["']?(.+?)["']?\s*$/i);
  if (m) return { action: { name: "search", args: { q: m[1].trim() } } };
  return {
    action: null,
    reason: `No entendí la intención. Pruebe: "crea una tarea X", "marca tarea ID como done", "lista clientes", "busca X"`,
  };
}

const ALLOWED: ReadonlyArray<IntentAction["name"]> = [
  "create_task",
  "change_state",
  "assign_task",
  "create_note",
  "search",
  "list_tasks",
  "list_clients",
];

export function isAllowedAction(name: string): name is IntentAction["name"] {
  return (ALLOWED as ReadonlyArray<string>).includes(name);
}
