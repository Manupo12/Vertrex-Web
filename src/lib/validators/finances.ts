import { z } from "zod";

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
  invoiceNumber: z.string().max(50).optional(),
  nextDueDate: z.string().optional(),
});

export const updateFinanceSchema = z.object({
  type: z.enum(["ingreso", "gasto"]).optional(),
  amountCop: z.number().int().positive().optional(),
  concept: z.string().min(1).max(200).optional(),
  status: z.enum(["pending", "paid"]).optional(),
  dueDate: z.string().optional().nullable(),
});
