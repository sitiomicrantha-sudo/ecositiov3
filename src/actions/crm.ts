"use server";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult } from "./topology";

// ============================================================
// SCHEMAS DE VALIDAÇÃO (Zod)
// ============================================================

const customerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  type: z.enum(["b2c", "b2b"], { message: "Selecione o tipo de cliente" }),
  email: z.string().email("E-mail inválido").max(255).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  document: z.string().max(50).optional().or(z.literal("")),
});

// ============================================================
// CRM ACTIONS
// ============================================================

export async function createCustomer(
  formData: z.infer<typeof customerSchema>
): Promise<ActionResult<typeof customers.$inferSelect>> {
  try {
    const validated = customerSchema.parse(formData);

    const [newCustomer] = await db
      .insert(customers)
      .values({
        name: validated.name,
        type: validated.type,
        email: validated.email || null,
        phone: validated.phone || null,
        document: validated.document || null,
      })
      .returning() as unknown as typeof customers.$inferSelect[];

    return { success: true, data: newCustomer };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao criar cliente" };
  }
}

export async function getCustomers(): Promise<
  ActionResult<typeof customers.$inferSelect[]>
> {
  try {
    const allCustomers = await db.query.customers.findMany({
      orderBy: (customers, { asc }) => [asc(customers.name)],
    });

    return { success: true, data: allCustomers };
  } catch {
    return { success: false, error: "Erro ao buscar clientes" };
  }
}

export async function getActiveCustomersForSelect(): Promise<
  ActionResult<typeof customers.$inferSelect[]>
> {
  try {
    const activeCustomers = await db.query.customers.findMany({
      where: eq(customers.status, "active"),
      orderBy: (customers, { asc }) => [asc(customers.name)],
    });

    return { success: true, data: activeCustomers };
  } catch {
    return { success: false, error: "Erro ao buscar clientes ativos" };
  }
}

export async function updateCustomerStatus(
  customerId: number,
  status: "active" | "inactive"
): Promise<ActionResult<typeof customers.$inferSelect>> {
  try {
    const [updated] = await db
      .update(customers)
      .set({ status })
      .where(eq(customers.id, customerId))
      .returning() as unknown as typeof customers.$inferSelect[];

    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Erro ao atualizar status do cliente" };
  }
}
