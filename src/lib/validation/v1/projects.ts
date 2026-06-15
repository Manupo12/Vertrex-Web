import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1),
  projectKey: z.string().min(1).max(12).optional(),
  budgetCop: z.number().int().nonnegative().optional(),
  status: z.string().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  currentVersion: z.string().optional(),
  referenceLinks: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
});
export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.string().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  currentVersion: z.string().optional(),
});
