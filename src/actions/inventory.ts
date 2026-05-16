"use server";

import { db } from "@/db";
import { inventoryItems, inventoryTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult } from "./topology";

// ============================================================
// SCHEMAS DE VALIDAÇÃO (Zod)
// ============================================================

const inventoryItemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  unit: z.enum(["kg", "unit", "liters"], {
    message: "Unidade deve ser kg, unit ou liters",
  }),
  type: z.enum(["input", "final_product"], {
    message: "Tipo deve ser input (insumo) ou final_product (produto final)",
  }),
});

const inventoryTransactionSchema = z.object({
  itemId: z.number().int().positive("ID do item deve ser positivo"),
  type: z.enum(["entry", "exit"], {
    message: "Tipo deve ser entry (entrada) ou exit (saída)",
  }),
  quantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Quantidade deve ser um número válido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  notes: z.string().optional(),
});

// ============================================================
// INVENTORY ITEMS (Itens de Estoque)
// ============================================================

export async function createInventoryItem(
  formData: z.infer<typeof inventoryItemSchema>
): Promise<ActionResult<typeof inventoryItems.$inferSelect>> {
  try {
    const validated = inventoryItemSchema.parse(formData);

    const [newItem] = await db
      .insert(inventoryItems)
      .values({
        name: validated.name,
        unit: validated.unit,
        type: validated.type,
      })
      .returning();

    return { success: true, data: newItem };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao criar item de estoque" };
  }
}

export async function getInventoryItems(): Promise<
  ActionResult<typeof inventoryItems.$inferSelect[]>
> {
  try {
    const items = await db.query.inventoryItems.findMany({
      orderBy: (inventoryItems, { desc }) => [desc(inventoryItems.createdAt)],
    });

    return { success: true, data: items };
  } catch {
    return { success: false, error: "Erro ao buscar itens de estoque" };
  }
}

// ============================================================
// INVENTORY TRANSACTIONS (Transações de Estoque)
// ============================================================

export async function createInventoryTransaction(
  formData: z.infer<typeof inventoryTransactionSchema>
): Promise<ActionResult<typeof inventoryTransactions.$inferSelect>> {
  try {
    const validated = inventoryTransactionSchema.parse(formData);

    const [newTransaction] = await db
      .insert(inventoryTransactions)
      .values({
        itemId: validated.itemId,
        type: validated.type,
        quantity: validated.quantity,
        date: validated.date,
        notes: validated.notes || null,
      })
      .returning();

    return { success: true, data: newTransaction };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao criar transação de estoque" };
  }
}

export async function getTransactionsByItem(
  itemId: number
): Promise<ActionResult<typeof inventoryTransactions.$inferSelect[]>> {
  try {
    const transactions = await db.query.inventoryTransactions.findMany({
      where: eq(inventoryTransactions.itemId, itemId),
      orderBy: (inventoryTransactions, { desc }) => [
        desc(inventoryTransactions.date),
      ],
    });

    return { success: true, data: transactions };
  } catch {
    return { success: false, error: "Erro ao buscar transações" };
  }
}
