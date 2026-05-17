"use server";

import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult } from "./topology";

const supplierSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  document: z.string().max(20).optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
});

export async function createSupplier(
  formData: z.infer<typeof supplierSchema>
): Promise<ActionResult<typeof suppliers.$inferSelect>> {
  try {
    const validated = supplierSchema.parse(formData);

    const [newSupplier] = await db
      .insert(suppliers)
      .values({
        name: validated.name,
        document: validated.document || null,
        email: validated.email || null,
        phone: validated.phone || null,
      })
      .returning();

    return { success: true, data: newSupplier };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao criar fornecedor" };
  }
}

export async function getSuppliers(): Promise<
  ActionResult<typeof suppliers.$inferSelect[]>
> {
  try {
    const list = await db.query.suppliers.findMany({
      orderBy: [asc(suppliers.name)],
    });

    return { success: true, data: list };
  } catch {
    return { success: false, error: "Erro ao buscar fornecedores" };
  }
}

export async function getActiveSuppliersForSelect(): Promise<
  ActionResult<typeof suppliers.$inferSelect[]>
> {
  try {
    const list = await db.query.suppliers.findMany({
      where: eq(suppliers.status, "ativo"),
      orderBy: [asc(suppliers.name)],
    });

    return { success: true, data: list };
  } catch {
    return { success: false, error: "Erro ao buscar fornecedores ativos" };
  }
}

export async function updateSupplierStatus(
  id: number,
  status: "ativo" | "inativo"
): Promise<ActionResult<typeof suppliers.$inferSelect>> {
  try {
    const [updated] = await db
      .update(suppliers)
      .set({ status })
      .where(eq(suppliers.id, id))
      .returning();

    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Erro ao atualizar status do fornecedor" };
  }
}
