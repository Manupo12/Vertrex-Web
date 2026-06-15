import { z } from "zod";

export const createAgendaEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  recurrenceRule: z.string().optional(),
  timezone: z.string().optional(),
  reminderMinutes: z.number().int().nonnegative().optional(),
  meetLink: z.string().url().optional(),
});
export const updateAgendaEventSchema = createAgendaEventSchema.partial();
