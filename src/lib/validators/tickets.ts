import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().min(1, "Título requerido").max(200),
  description: z.string().min(1, "Descripción requerida").max(5000),
});
