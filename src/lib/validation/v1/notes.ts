import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().min(1),
  type: z.string().optional(),
  contentJson: z.unknown().optional(),
  objective: z.string().optional(),
  nextStep: z.string().optional(),
  relatedProjectId: z.string().uuid().optional(),
});
export const updateNoteSchema = z.object({
  title: z.string().optional(),
  contentJson: z.unknown().optional(),
  objective: z.string().nullable().optional(),
  nextStep: z.string().nullable().optional(),
  relatedProjectId: z.string().uuid().nullable().optional(),
});
