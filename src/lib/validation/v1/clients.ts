import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
});
export const updateClientSchema = createClientSchema.partial();
