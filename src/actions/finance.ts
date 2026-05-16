"use server";

import { db } from "@/db";
import {
  sales,
  financialTransactions,
  inventoryTransactions,
  inventoryItems,
} from "@/db/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult } from "./topology";

// ============================================================
// SCHEMAS DE VALIDAÇÃO (Zod)
// ============================================================

const saleSchema = z.object({
  customerName: z.string().max(255).optional(),
  customerId: z.number().int().positive().optional(),
  itemId: z.number().int().positive("Selecione um item"),
  quantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Quantidade deve ser um número válido"),
  unitPrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Preço deve ser um número válido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  paymentStatus: z.enum(["pago", "pendente"]),
});

const expenseSchema = z.object({
  category: z.enum([
    "venda_producao",
    "insumos_aves",
    "insumos_jadm",
    "infraestrutura",
    "logistica",
    "outros",
  ], { message: "Selecione uma categoria" }),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Valor deve ser um número válido"),
  description: z.string().min(1, "Descrição é obrigatória").max(255),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
});

// ============================================================
// VENDAS (Sales)
// ============================================================

export async function registerSale(
  formData: z.infer<typeof saleSchema>
): Promise<ActionResult<typeof sales.$inferSelect>> {
  try {
    const validated = saleSchema.parse(formData);
    const quantity = parseFloat(validated.quantity);
    const unitPrice = parseFloat(validated.unitPrice);
    const totalPrice = quantity * unitPrice;

    const saleDate = new Date(validated.date);

    const [newSale] = await db
      .insert(sales)
      .values({
        date: saleDate,
        customerId: validated.customerId || null,
        customerName: validated.customerName || null,
        itemId: validated.itemId,
        quantity: validated.quantity,
        unitPrice: validated.unitPrice,
        totalPrice: totalPrice.toFixed(2),
        paymentStatus: validated.paymentStatus,
      })
      .returning() as unknown as typeof sales.$inferSelect[];

    // Se pago, cria transação financeira (receita) + baixa no estoque
    if (validated.paymentStatus === "pago") {
      const item = await db.query.inventoryItems.findFirst({
        where: eq(inventoryItems.id, validated.itemId),
      });

      await db.insert(financialTransactions).values({
        date: saleDate,
        type: "revenue",
        category: "venda_producao",
        amount: totalPrice.toFixed(2),
        description: `Venda: ${item?.name || "Item"}${validated.customerName ? ` para ${validated.customerName}` : ""}`,
        saleId: newSale.id,
      });

      await db.insert(inventoryTransactions).values({
        itemId: validated.itemId,
        type: "exit",
        quantity: validated.quantity,
        date: validated.date,
        notes: `Venda #${newSale.id}${validated.customerName ? ` - ${validated.customerName}` : ""}`,
      });
    }

    return { success: true, data: newSale };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao registrar venda" };
  }
}

export async function confirmPayment(
  saleId: number
): Promise<ActionResult<typeof sales.$inferSelect>> {
  try {
    const sale = await db.query.sales.findFirst({
      where: eq(sales.id, saleId),
      with: {
        item: true,
      },
    });

    if (!sale) {
      return { success: false, error: "Venda não encontrada" };
    }

    if (sale.paymentStatus === "pago") {
      return { success: false, error: "Esta venda já está com pagamento confirmado" };
    }

    const totalPrice = parseFloat(sale.totalPrice);

    // Atualiza status para pago
    const [updatedSale] = await db
      .update(sales)
      .set({ paymentStatus: "pago" })
      .where(eq(sales.id, saleId))
      .returning() as unknown as typeof sales.$inferSelect[];

    // Cria transação financeira (receita)
    await db.insert(financialTransactions).values({
      date: sale.date,
      type: "revenue",
      category: "venda_producao",
      amount: sale.totalPrice,
      description: `Venda: ${sale.item?.name || "Item"}${sale.customerName ? ` para ${sale.customerName}` : ""} (pagamento confirmado)`,
      saleId,
    });

    // Cria baixa no estoque
    await db.insert(inventoryTransactions).values({
      itemId: sale.itemId,
      type: "exit",
      quantity: sale.quantity,
      date: sale.date.toISOString().split("T")[0],
      notes: `Venda #${saleId}${sale.customerName ? ` - ${sale.customerName}` : ""} (pagamento confirmado)`,
    });

    return { success: true, data: updatedSale };
  } catch {
    return { success: false, error: "Erro ao confirmar pagamento" };
  }
}

export async function getSalesList(): Promise<
  ActionResult<
    (typeof sales.$inferSelect & {
      itemName: string | null;
    })[]
  >
> {
  try {
    const salesList = await db.query.sales.findMany({
      with: {
        item: true,
      },
      orderBy: (sales, { desc }) => [desc(sales.date)],
    });

    const enriched = salesList.map((s) => ({
      ...s,
      itemName: (s.item as { name: string } | null)?.name || null,
    }));

    return { success: true, data: enriched };
  } catch {
    return { success: false, error: "Erro ao buscar vendas" };
  }
}

// ============================================================
// DESPESAS (Expenses)
// ============================================================

export async function registerExpense(
  formData: z.infer<typeof expenseSchema>
): Promise<ActionResult<typeof financialTransactions.$inferSelect>> {
  try {
    const validated = expenseSchema.parse(formData);
    const expenseDate = new Date(validated.date);

    const [newExpense] = await db
      .insert(financialTransactions)
      .values({
        date: expenseDate,
        type: "expense",
        category: validated.category,
        amount: validated.amount,
        description: validated.description,
      })
      .returning() as unknown as typeof financialTransactions.$inferSelect[];

    return { success: true, data: newExpense };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao registrar despesa" };
  }
}

// ============================================================
// RESUMO FINANCEIRO
// ============================================================

export async function getFinancialSummary(): Promise<
  ActionResult<{
    totalRevenue: string;
    totalExpense: string;
    balance: string;
    monthRevenue: string;
    monthExpense: string;
  }>
> {
  try {
    const allTransactions = await db.query.financialTransactions.findMany();

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    let totalRevenue = 0;
    let totalExpense = 0;
    let monthRevenue = 0;
    let monthExpense = 0;

    for (const tx of allTransactions) {
      const amount = parseFloat(tx.amount);
      const txDate = new Date(tx.date);

      if (tx.type === "revenue") {
        totalRevenue += amount;
        if (txDate >= firstDayOfMonth && txDate <= lastDayOfMonth) {
          monthRevenue += amount;
        }
      } else {
        totalExpense += amount;
        if (txDate >= firstDayOfMonth && txDate <= lastDayOfMonth) {
          monthExpense += amount;
        }
      }
    }

    return {
      success: true,
      data: {
        totalRevenue: totalRevenue.toFixed(2),
        totalExpense: totalExpense.toFixed(2),
        balance: (totalRevenue - totalExpense).toFixed(2),
        monthRevenue: monthRevenue.toFixed(2),
        monthExpense: monthExpense.toFixed(2),
      },
    };
  } catch {
    return { success: false, error: "Erro ao buscar resumo financeiro" };
  }
}

export async function getTransactionsList(): Promise<
  ActionResult<
    (typeof financialTransactions.$inferSelect & {
      saleCustomerName: string | null;
      saleItemName: string | null;
    })[]
  >
> {
  try {
    const transactions = await db.query.financialTransactions.findMany({
      with: {
        sale: {
          with: {
            item: true,
          },
        },
      },
      orderBy: (financialTransactions, { desc }) => [desc(financialTransactions.date)],
    });

    const enriched = transactions.map((tx) => ({
      ...tx,
      saleCustomerName: tx.sale
        ? (tx.sale as { customerName: string | null }).customerName
        : null,
      saleItemName: tx.sale
        ? ((tx.sale as { item: { name: string } }).item?.name || null)
        : null,
    }));

    return { success: true, data: enriched };
  } catch {
    return { success: false, error: "Erro ao buscar transações" };
  }
}

export async function getItemsForSale(): Promise<
  ActionResult<typeof inventoryItems.$inferSelect[]>
> {
  try {
    const items = await db.query.inventoryItems.findMany({
      where: eq(inventoryItems.type, "final_product"),
      orderBy: (inventoryItems, { asc }) => [asc(inventoryItems.name)],
    });

    return { success: true, data: items };
  } catch {
    return { success: false, error: "Erro ao buscar itens para venda" };
  }
}
