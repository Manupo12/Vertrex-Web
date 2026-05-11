import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Título requerido").max(200),
  projectId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  priority: z.number().int().min(0).max(4).optional(),
  cycleId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  estimatePoints: z.number().int().min(0).max(100).optional(),
  description: z.string().max(10000).optional(),
  taskType: z.string().optional(),
});

export const createClientSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  slug: z.string().max(50).optional(),
});

export const createFinanceSchema = z.object({
  type: z.enum(["ingreso", "gasto"]),
  amountCop: z.number().int().positive("Monto debe ser positivo"),
  concept: z.string().min(1, "Concepto requerido").max(200),
  status: z.enum(["pending", "paid"]).optional(),
  dueDate: z.string().optional(),
  currency: z.enum(["COP", "USD"]).optional(),
  recurrence: z.enum(["none", "monthly", "yearly"]).optional(),
  vatAmountCop: z.number().int().optional(),
  vatRate: z.number().int().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export const createTicketSchema = z.object({
  title: z.string().min(1, "Título requerido").max(200),
  description: z.string().min(1, "Descripción requerida").max(5000),
});
