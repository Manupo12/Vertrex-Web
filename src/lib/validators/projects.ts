import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  budgetCop: z.number().int().positive().optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  currentVersion: z.string().max(20).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  currentVersion: z.string().max(20).optional(),
});
