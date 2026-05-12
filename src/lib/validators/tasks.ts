import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Título requerido").max(200),
  projectId: z.string().uuid().optional(),
  parentTaskId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  priority: z.number().int().min(0).max(4).optional(),
  cycleId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  taskType: z.string().optional(),
  dueDate: z.string().optional(),
  estimatePoints: z.number().int().min(0).max(100).optional(),
  descriptionJson: z.any().optional(),
  state: z.enum(["backlog", "todo", "in_progress", "in_review", "done", "cancelled"]).optional(),
});
