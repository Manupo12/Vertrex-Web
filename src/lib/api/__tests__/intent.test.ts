import { describe, it, expect } from "vitest";
import { parseIntent, isAllowedAction } from "../intent";

describe("parseIntent", () => {
  it("creates a task from natural language (es)", () => {
    const r = parseIntent("crea una tarea Preparar propuesta para Budaphone");
    expect(r.action?.name).toBe("create_task");
    expect((r.action as any)?.args?.title).toContain("Preparar propuesta");
  });
  it("changes state (en)", () => {
    const r = parseIntent("move task ACME-42 to done");
    expect(r.action?.name).toBe("change_state");
    expect((r.action as any)?.args).toEqual({ id: "ACME-42", state: "done" });
  });
  it("creates a note", () => {
    const r = parseIntent("apunta una nota Reunión con cliente");
    expect(r.action?.name).toBe("create_note");
  });
  it("lists tasks", () => {
    expect(parseIntent("lista tareas").action?.name).toBe("list_tasks");
  });
  it("lists clients", () => {
    expect(parseIntent("listar clientes").action?.name).toBe("list_clients");
  });
  it("search", () => {
    const r = parseIntent('busca "facturas vencidas"');
    expect(r.action?.name).toBe("search");
    expect((r.action as any)?.args?.q).toBe("facturas vencidas");
  });
  it("rejects invalid state", () => {
    const r = parseIntent("marca tarea X como pirulí");
    expect(r.action).toBeNull();
    expect(r.reason).toMatch(/Estado inválido/);
  });
  it("returns null for unknown", () => {
    expect(parseIntent("hola qué tal").action).toBeNull();
  });
  it("allowlist contains expected actions", () => {
    for (const n of ["create_task", "change_state", "assign_task", "create_note", "search", "list_tasks", "list_clients"]) {
      expect(isAllowedAction(n)).toBe(true);
    }
    expect(isAllowedAction("delete_db")).toBe(false);
  });
});
