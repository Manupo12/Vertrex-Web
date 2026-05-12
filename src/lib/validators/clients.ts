import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  slug: z.string().max(50).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
