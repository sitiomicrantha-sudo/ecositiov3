"use server";

import { db } from "@/db";
import { receivables, orders, customers, financialTransactions } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult } from "./topology";

const receivableSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valor deve ser um número válido"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  orderId: z.string().regex(/^\d+$/, "Selecione um pedido").optional().nullable(),
  customerId: z.string().regex(/^\d+$/, "Selecione um cliente").optional().nullable(),
});

export type ReceivableWithDetails = {
  id: number;
  dueDate: string;
  receivedDate: string | null;
  amount: string;
  description: string;
  status: "pending" | "received" | "overdue";
  orderId: number | null;
  orderCustomerName: string | null;
  customerId: number | null;
  customerName: string | null;
  createdAt: Date;
};

export async function createReceivable(
  formData: z.infer<typeof receivableSchema>
): Promise<ActionResult<typeof receivables.$inferSelect>> {
  try {
    const validated = receivableSchema.parse(formData);

    const [newReceivable] = await db
      .insert(receivables)
      .values({
        description: validated.description,
        amount: validated.amount,
        dueDate: validated.dueDate,
        orderId: validated.orderId ? parseInt(validated.orderId, 10) : null,
        customerId: validated.customerId ? parseInt(validated.customerId, 10) : null,
      })
      .returning();

    return { success: true, data: newReceivable };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao criar conta a receber" };
  }
}

export async function receivePayment(
  receivableId: number,
  receivedDate?: string
): Promise<ActionResult<typeof receivables.$inferSelect>> {
  try {
    const receivable = await db.query.receivables.findFirst({
      where: eq(receivables.id, receivableId),
    });

    if (!receivable) {
      return { success: false, error: "Conta a receber não encontrada" };
    }

    if (receivable.status === "received") {
      return { success: false, error: "Este recebimento já foi confirmado" };
    }

    const paymentDate = receivedDate || new Date().toISOString().split("T")[0];

    const [updatedReceivable] = await db
      .update(receivables)
      .set({
        status: "received",
        receivedDate: paymentDate,
        updatedAt: new Date(),
      })
      .where(eq(receivables.id, receivableId))
      .returning();

    await db.insert(financialTransactions).values({
      date: new Date(paymentDate),
      type: "revenue",
      category: "venda_producao",
      amount: receivable.amount,
      description: `Recebimento: ${receivable.description}`,
      orderId: receivable.orderId,
    });

    return { success: true, data: updatedReceivable };
  } catch {
    return { success: false, error: "Erro ao confirmar recebimento" };
  }
}

export async function getReceivablesList(filters?: {
  status?: string;
  customerId?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ActionResult<ReceivableWithDetails[]>> {
  try {
    const conditions = [];

    if (filters?.customerId) {
      conditions.push(eq(receivables.customerId, filters.customerId));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(receivables.dueDate, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(receivables.dueDate, filters.dateTo));
    }

    const allReceivables = await db.query.receivables.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(receivables.dueDate)],
    });

    const customerMap = new Map<number, string>();
    const orderMap = new Map<number, string>();

    const customerIds = [...new Set(allReceivables.map((r) => r.customerId).filter(Boolean))];
    if (customerIds.length > 0) {
      const customerList = await db.query.customers.findMany({
        where: (customers, { inArray }) => inArray(customers.id, customerIds as number[]),
      });
      customerList.forEach((c) => customerMap.set(c.id, c.name));
    }

    const orderIds = [...new Set(allReceivables.map((r) => r.orderId).filter(Boolean))];
    if (orderIds.length > 0) {
      const orderList = await db.query.orders.findMany({
        where: (orders, { inArray }) => inArray(orders.id, orderIds as number[]),
      });
      orderList.forEach((o) => orderMap.set(o.id, o.customerName || `Pedido #${o.id}`));
    }

    const today = new Date().toISOString().split("T")[0];

    let result: ReceivableWithDetails[] = allReceivables.map((r) => {
      let computedStatus = r.status as "pending" | "received" | "overdue";
      const dueDateStr = String(r.dueDate).split("T")[0];
      if (r.status === "pending" && dueDateStr < today) {
        computedStatus = "overdue";
      }

      if (filters?.status) {
        if (filters.status === "overdue" && computedStatus !== "overdue") return null;
        if (filters.status !== "overdue" && r.status !== filters.status) return null;
      }

      return {
        id: r.id,
        dueDate: r.dueDate,
        receivedDate: r.receivedDate,
        amount: r.amount,
        description: r.description,
        status: computedStatus,
        orderId: r.orderId,
        orderCustomerName: r.orderId ? orderMap.get(r.orderId) || null : null,
        customerId: r.customerId,
        customerName: r.customerId ? customerMap.get(r.customerId) || null : null,
        createdAt: r.createdAt,
      };
    }).filter(Boolean) as ReceivableWithDetails[];

    return { success: true, data: result };
  } catch {
    return { success: false, error: "Erro ao buscar contas a receber" };
  }
}
