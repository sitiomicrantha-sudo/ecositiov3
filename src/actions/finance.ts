"use server";

import { db } from "@/db";
import {
  orders,
  orderItems,
  financialTransactions,
  inventoryTransactions,
  inventoryItems,
  costCenters,
} from "@/db/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult } from "./topology";
import { calculateOrderCostCenterSplit } from "@/lib/cost-center";
import { ensureDefaultCostCenters } from "./cost-centers";

async function getFallbackCostCenterId(): Promise<number> {
  const [fallback] = await db
    .select({ id: costCenters.id })
    .from(costCenters)
    .where(eq(costCenters.name, "Infraestrutura Geral"))
    .limit(1);
  return fallback?.id ?? 1;
}

const orderFormSchema = z.object({
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
  costCenterId: z.number().int().positive("Selecione um centro de custo"),
});

export async function registerManualOrder(
  formData: z.infer<typeof orderFormSchema>
): Promise<ActionResult<typeof orders.$inferSelect>> {
  try {
    await ensureDefaultCostCenters();

    const validated = orderFormSchema.parse(formData);
    const quantity = parseFloat(validated.quantity);
    const unitPrice = parseFloat(validated.unitPrice);
    const totalPrice = quantity * unitPrice;

    const orderDate = new Date(validated.date);

    const [newOrder] = await db
      .insert(orders)
      .values({
        date: orderDate,
        customerId: validated.customerId || null,
        customerName: validated.customerName || null,
        type: "balcao",
        paymentMethod: validated.paymentStatus === "pago" ? "pix" : "pendente",
        paymentStatus: validated.paymentStatus,
        deliveryFee: "0.00",
        subtotal: totalPrice.toFixed(2),
        total: totalPrice.toFixed(2),
      })
      .returning();

    await db.insert(orderItems).values({
      orderId: newOrder.id,
      itemId: validated.itemId,
      quantity: validated.quantity,
      unitPrice: validated.unitPrice,
      totalPrice: totalPrice.toFixed(2),
    });

    if (validated.paymentStatus === "pago") {
      const item = await db.query.inventoryItems.findFirst({
        where: eq(inventoryItems.id, validated.itemId),
      });

      const fallbackId = await getFallbackCostCenterId();
      const splits = calculateOrderCostCenterSplit(
        [{ itemId: validated.itemId, totalPrice, costCenterId: item?.costCenterId ?? null }],
        0,
        fallbackId
      );

      for (const split of splits) {
        const center = await db.query.costCenters.findFirst({
          where: eq(costCenters.id, split.costCenterId),
        });
        const centerName = center?.name || "Geral";

        await db.insert(financialTransactions).values({
          date: orderDate,
          type: "revenue",
          category: "venda_producao",
          amount: split.total.toFixed(2),
          description: `Pedido #${newOrder.id}: ${item?.name || "Item"}${validated.customerName ? ` para ${validated.customerName}` : ""} [${centerName}]`,
          orderId: newOrder.id,
          costCenterId: split.costCenterId,
        });
      }

      await db.insert(inventoryTransactions).values({
        itemId: validated.itemId,
        type: "exit",
        quantity: validated.quantity,
        date: validated.date,
        notes: `Pedido #${newOrder.id}${validated.customerName ? ` - ${validated.customerName}` : ""}`,
      });
    }

    return { success: true, data: newOrder };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao registrar pedido" };
  }
}

export async function confirmOrderPayment(
  orderId: number
): Promise<ActionResult<typeof orders.$inferSelect>> {
  try {
    await ensureDefaultCostCenters();

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: {
          with: {
            item: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Pedido não encontrado" };
    }

    if (order.paymentStatus === "pago") {
      return { success: false, error: "Este pedido já está com pagamento confirmado" };
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({ paymentStatus: "pago" })
      .where(eq(orders.id, orderId))
      .returning();

    const fallbackId = await getFallbackCostCenterId();
    const itemsWithCostCenter = (order.items as any[]).map((oi: any) => ({
      itemId: oi.itemId,
      totalPrice: parseFloat(oi.totalPrice),
      costCenterId: oi.item?.costCenterId ?? null,
    }));

    const splits = calculateOrderCostCenterSplit(itemsWithCostCenter, parseFloat(order.deliveryFee), fallbackId);

    for (const split of splits) {
      const center = await db.query.costCenters.findFirst({
        where: eq(costCenters.id, split.costCenterId),
      });
      const centerName = center?.name || "Geral";

      await db.insert(financialTransactions).values({
        date: order.date,
        type: "revenue",
        category: "venda_producao",
        amount: split.total.toFixed(2),
        description: `Pedido #${orderId}${order.customerName ? ` - ${order.customerName}` : ""} [${centerName}] (pagamento confirmado)`,
        orderId,
        costCenterId: split.costCenterId,
      });
    }

    for (const oi of order.items as any[]) {
      await db.insert(inventoryTransactions).values({
        itemId: oi.itemId,
        type: "exit",
        quantity: oi.quantity,
        date: order.date.toISOString().split("T")[0],
        notes: `Pedido #${orderId}${order.customerName ? ` - ${order.customerName}` : ""} (pagamento confirmado)`,
      });
    }

    return { success: true, data: updatedOrder };
  } catch {
    return { success: false, error: "Erro ao confirmar pagamento" };
  }
}

export async function getOrdersList(): Promise<
  ActionResult<
    {
      id: number;
      date: Date;
      customerName: string | null;
      type: string;
      paymentMethod: string;
      paymentStatus: string;
      subtotal: string;
      total: string;
      deliveryFee: string;
      items: { itemName: string; quantity: string; totalPrice: string }[];
    }[]
  >
> {
  try {
    const orderList = await db.query.orders.findMany({
      with: {
        items: {
          with: {
            item: true,
          },
        },
      },
      orderBy: [desc(orders.date)],
    });

    const enriched = orderList.map((o) => ({
      id: o.id,
      date: o.date,
      customerName: o.customerName || null,
      type: o.type,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      subtotal: o.subtotal,
      total: o.total,
      deliveryFee: o.deliveryFee,
      items: (o.items as any[]).map((oi: any) => ({
        itemName: oi.item?.name || "—",
        quantity: oi.quantity,
        totalPrice: oi.totalPrice,
      })),
    }));

    return { success: true, data: enriched };
  } catch {
    return { success: false, error: "Erro ao buscar pedidos" };
  }
}

export async function registerExpense(
  formData: z.infer<typeof expenseSchema>
): Promise<ActionResult<typeof financialTransactions.$inferSelect>> {
  try {
    await ensureDefaultCostCenters();

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
        costCenterId: validated.costCenterId,
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
      orderCustomerName: string | null;
      costCenterName: string | null;
    })[]
  >
> {
  try {
    const transactions = await db.query.financialTransactions.findMany({
      with: {
        order: true,
        costCenter: true,
      },
      orderBy: [desc(financialTransactions.date)],
    });

    const enriched = transactions.map((tx) => ({
      ...tx,
      orderCustomerName: tx.order
        ? (tx.order as { customerName: string | null }).customerName
        : null,
      costCenterName: tx.costCenter
        ? (tx.costCenter as { name: string }).name
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
