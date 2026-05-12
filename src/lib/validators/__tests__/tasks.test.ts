import { describe, it, expect } from "vitest";
import { createTaskSchema } from "../tasks";

describe("createTaskSchema", () => {
  it("accepts valid task data", () => {
    const result = createTaskSchema.safeParse({ title: "Test task" });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createTaskSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 chars", () => {
    const result = createTaskSchema.safeParse({ title: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("accepts valid priority values", () => {
    for (const p of [0, 1, 2, 3, 4]) {
      const result = createTaskSchema.safeParse({ title: "test", priority: p });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid priority", () => {
    const result = createTaskSchema.safeParse({ title: "test", priority: 99 });
    expect(result.success).toBe(false);
  });

  it("accepts valid state values", () => {
    for (const s of ["backlog", "todo", "in_progress", "in_review", "done", "cancelled"]) {
      const result = createTaskSchema.safeParse({ title: "test", state: s });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid state", () => {
    const result = createTaskSchema.safeParse({ title: "test", state: "invalid_state" });
    expect(result.success).toBe(false);
  });
});
