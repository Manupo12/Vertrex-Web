import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1),
  projectId: z.string().uuid().optional(),
  parentTaskId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  priority: z.number().int().min(0).max(4).optional(),
  cycleId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  taskType: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  state: z.string().optional(),
  description: z.string().optional(),
});
export const updateTaskSchema = createTaskSchema.partial();
