"use server";

import { db } from "@/db";
import {
  orders,
  orderItems,
  financialTransactions,
  inventoryTransactions,
  inventoryItems,
  customers,
  costCenters,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { ActionResult } from "./topology";
import { calculateOrderCostCenterSplit } from "@/lib/cost-center";
import { ensureDefaultCostCenters } from "./cost-centers";
import { getFallbackCostCenterId } from "./finance";

export async function createPOSOrder(data: {
  customerId?: number | null;
  customerName?: string | null;
  type: "balcao" | "delivery";
  paymentMethod: "pix" | "dinheiro" | "cartao" | "pendente";
  items: { itemId: number; quantity: string; unitPrice: string }[];
  deliveryFee?: string;
}): Promise<ActionResult<typeof orders.$inferSelect>> {
  try {
    await ensureDefaultCostCenters();

    const deliveryFee = data.deliveryFee || "0.00";

    let subtotal = 0;
    const itemTotals = data.items.map((item) => {
      const qty = parseFloat(item.quantity);
      const price = parseFloat(item.unitPrice);
      const total = qty * price;
      subtotal += total;
      return { ...item, totalPrice: total.toFixed(2) };
    });

    const total = (subtotal + parseFloat(deliveryFee)).toFixed(2);
    const paymentStatus = data.paymentMethod === "pendente" ? "pendente" : "pago";

    const [newOrder] = await db
      .insert(orders)
      .values({
        customerId: data.customerId || null,
        customerName: data.customerName || null,
        type: data.type,
        paymentMethod: data.paymentMethod,
        paymentStatus,
        deliveryFee,
        subtotal: subtotal.toFixed(2),
        total,
      })
      .returning();

    for (const item of itemTotals) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      });
    }

    if (paymentStatus === "pago") {
      const customerLabel = data.customerId
        ? (await db.query.customers.findFirst({ where: eq(customers.id, data.customerId!) }))?.name
        : data.customerName || "Cliente";

      const itemsWithCostCenter = await Promise.all(
        itemTotals.map(async (item) => {
          const invItem = await db.query.inventoryItems.findFirst({
            where: eq(inventoryItems.id, item.itemId),
          });
          return {
            itemId: item.itemId,
            totalPrice: parseFloat(item.totalPrice),
            costCenterId: invItem?.costCenterId ?? null,
          };
        })
      );

      const fallbackId = await getFallbackCostCenterId();
      const splits = calculateOrderCostCenterSplit(itemsWithCostCenter, parseFloat(deliveryFee), fallbackId);

      for (const split of splits) {
        const center = await db.query.costCenters.findFirst({
          where: eq(costCenters.id, split.costCenterId),
        });
        const centerName = center?.name || "Geral";

        await db.insert(financialTransactions).values({
          date: new Date(),
          type: "revenue",
          category: "venda_producao",
          amount: split.total.toFixed(2),
          description: `Pedido #${newOrder.id} - Receita ${centerName} - ${customerLabel}`,
          orderId: newOrder.id,
          costCenterId: split.costCenterId,
        });
      }

      for (const item of itemTotals) {
        const invItem = await db.query.inventoryItems.findFirst({
          where: eq(inventoryItems.id, item.itemId),
        });

        await db.insert(inventoryTransactions).values({
          itemId: item.itemId,
          type: "exit",
          quantity: item.quantity,
          date: new Date().toISOString().split("T")[0],
          notes: `Pedido #${newOrder.id} - ${invItem?.name || "Item"}`,
        });
      }
    }

    return { success: true, data: newOrder };
  } catch (error) {
    return { success: false, error: `Erro ao criar pedido: ${error instanceof Error ? error.message : "Erro desconhecido"}` };
  }
}

export async function getPOSProducts(): Promise<
  ActionResult<
    {
      id: number;
      name: string;
      unit: string;
      type: string;
      category: string;
      location: string | null;
      basePrice: string | null;
      currentStock: number;
    }[]
  >
> {
  try {
    const items = await db.query.inventoryItems.findMany({
      where: eq(inventoryItems.type, "final_product"),
      orderBy: (inventoryItems, { asc }) => [asc(inventoryItems.name)],
    });

    const allTransactions = await db.query.inventoryTransactions.findMany();
    const stockByItem = new Map<number, number>();
    for (const tx of allTransactions) {
      const current = stockByItem.get(tx.itemId) || 0;
      const qty = parseFloat(tx.quantity);
      if (tx.type === "entry") {
        stockByItem.set(tx.itemId, current + qty);
      } else {
        stockByItem.set(tx.itemId, current - qty);
      }
    }

    const enriched = items.map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      type: item.type,
      category: item.category,
      location: item.location,
      basePrice: item.basePrice,
      currentStock: stockByItem.get(item.id) || 0,
    }));

    return { success: true, data: enriched };
  } catch {
    return { success: false, error: "Erro ao buscar produtos" };
  }
}

export async function getPOSCustomers(): Promise<
  ActionResult<typeof customers.$inferSelect[]>
> {
  try {
    const list = await db.query.customers.findMany({
      where: eq(customers.status, "active"),
      orderBy: (customers, { asc }) => [asc(customers.name)],
    });

    return { success: true, data: list };
  } catch {
    return { success: false, error: "Erro ao buscar clientes" };
  }
}

export async function getRecentOrders(): Promise<
  ActionResult<
    {
      id: number;
      date: Date;
      customerName: string | null;
      type: string;
      paymentMethod: string;
      paymentStatus: string;
      deliveryFee: string;
      subtotal: string;
      total: string;
      itemCount: number;
    }[]
  >
> {
  try {
    const orderList = await db.query.orders.findMany({
      orderBy: [desc(orders.date)],
      limit: 20,
      with: {
        items: true,
      },
    });

    const enriched = orderList.map((o) => ({
      id: o.id,
      date: o.date,
      customerName: o.customerName || null,
      type: o.type,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      deliveryFee: o.deliveryFee,
      subtotal: o.subtotal,
      total: o.total,
      itemCount: (o.items as any[]).length,
    }));

    return { success: true, data: enriched };
  } catch {
    return { success: false, error: "Erro ao buscar pedidos recentes" };
  }
}


