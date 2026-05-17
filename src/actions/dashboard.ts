"use server";

import { db } from "@/db";
import {
  financialTransactions,
  beds,
  plantings,
  poultryBatches,
  fieldActivities,
  inventoryItems,
  inventoryTransactions,
  orders,
  costCenters,
} from "@/db/schema";
import { eq, or, desc, sql, and, gte, lte, isNull } from "drizzle-orm";
import type { ActionResult } from "./topology";

export async function getFinancialOverview(): Promise<
  ActionResult<{
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
        balance: (totalRevenue - totalExpense).toFixed(2),
        monthRevenue: monthRevenue.toFixed(2),
        monthExpense: monthExpense.toFixed(2),
      },
    };
  } catch {
    return { success: false, error: "Erro ao buscar resumo financeiro" };
  }
}

export async function getOperationalOverview(): Promise<
  ActionResult<{
    totalBeds: number;
    occupiedBeds: number;
    freeBeds: number;
  }>
> {
  try {
    const allBeds = await db.query.beds.findMany();
    const totalBeds = allBeds.length;

    const bedIdsWithActivePlanting = new Set<number>();
    const activePlantings = await db.query.plantings.findMany({
      where: or(eq(plantings.status, "active"), eq(plantings.status, "permanent")),
    });

    for (const p of activePlantings) {
      bedIdsWithActivePlanting.add(p.bedId);
    }

    const occupiedBeds = bedIdsWithActivePlanting.size;

    return {
      success: true,
      data: {
        totalBeds,
        occupiedBeds,
        freeBeds: totalBeds - occupiedBeds,
      },
    };
  } catch {
    return { success: false, error: "Erro ao buscar resumo operacional" };
  }
}

export async function getPoultryOverview(): Promise<
  ActionResult<{
    totalBirds: number;
    activeBatches: number;
  }>
> {
  try {
    const batches = await db.query.poultryBatches.findMany({
      where: eq(poultryBatches.isActive, true),
    });

    const totalBirds = batches.reduce((sum, b) => sum + b.activeQuantity, 0);

    return {
      success: true,
      data: {
        totalBirds,
        activeBatches: batches.length,
      },
    };
  } catch {
    return { success: false, error: "Erro ao buscar resumo de aves" };
  }
}

export async function getRecentActivities(): Promise<
  ActionResult<
    {
      id: number;
      date: Date;
      category: string;
      activityType: string;
      quantity: string | null;
      notes: string | null;
      bedName: string | null;
      bedShortCode: string | null;
      itemName: string | null;
      batchName: string | null;
    }[]
  >
> {
  try {
    const activities = await db.query.fieldActivities.findMany({
      orderBy: [desc(fieldActivities.date)],
      limit: 5,
      with: {
        bed: true,
        item: true,
        batch: true,
      },
    });

    const enriched = activities.map((a) => ({
      id: a.id,
      date: a.date,
      category: a.category,
      activityType: a.activityType,
      quantity: a.quantity,
      notes: a.notes,
      bedName: (a.bed as { name: string } | null)?.name || null,
      bedShortCode: (a.bed as { shortCode: string | null } | null)?.shortCode || null,
      itemName: (a.item as { name: string } | null)?.name || null,
      batchName: (a.batch as { batchCode: string } | null)?.batchCode || null,
    }));

    return { success: true, data: enriched };
  } catch {
    return { success: false, error: "Erro ao buscar atividades recentes" };
  }
}

const LOW_STOCK_THRESHOLD = 5;

export async function getLowStockAlerts(): Promise<
  ActionResult<
    {
      id: number;
      name: string;
      unit: string;
      currentStock: number;
    }[]
  >
> {
  try {
    const items = await db.query.inventoryItems.findMany();
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

    const lowStockItems = items
      .map((item) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        currentStock: stockByItem.get(item.id) || 0,
      }))
      .filter((item) => item.currentStock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.currentStock - b.currentStock);

    return { success: true, data: lowStockItems };
  } catch {
    return { success: false, error: "Erro ao buscar alertas de estoque" };
  }
}

export async function getPendingOrders(): Promise<
  ActionResult<
    {
      id: number;
      date: Date;
      customerName: string | null;
      total: string;
      itemCount: number;
    }[]
  >
> {
  try {
    const pendingOrders = await db.query.orders.findMany({
      where: eq(orders.paymentStatus, "pendente"),
      orderBy: [desc(orders.date)],
      with: {
        items: true,
      },
    });

    const enriched = pendingOrders.map((o) => ({
      id: o.id,
      date: o.date,
      customerName: o.customerName || null,
      total: o.total,
      itemCount: (o.items as any[]).length,
    }));

    return { success: true, data: enriched };
  } catch {
    return { success: false, error: "Erro ao buscar pedidos pendentes" };
  }
}

export async function getCostCenterPerformance(): Promise<
  ActionResult<
    {
      id: number;
      name: string;
      description: string | null;
      revenue: number;
      expense: number;
      balance: number;
    }[]
  >
> {
  try {
    const centers = await db.query.costCenters.findMany({
      where: eq(costCenters.isActive, true),
      orderBy: (costCenters, { asc }) => [asc(costCenters.name)],
    });

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthTransactions = await db.query.financialTransactions.findMany({
      where: and(
        gte(financialTransactions.date, firstDayOfMonth),
        lte(financialTransactions.date, lastDayOfMonth)
      ),
    });

    const result = centers.map((center) => {
      let revenue = 0;
      let expense = 0;

      for (const tx of monthTransactions) {
        const txCostCenterId = (tx as any).costCenterId;
        if (txCostCenterId !== center.id) continue;

        const amount = parseFloat(tx.amount);
        if (tx.type === "revenue") {
          revenue += amount;
        } else {
          expense += amount;
        }
      }

      return {
        id: center.id,
        name: center.name,
        description: center.description,
        revenue,
        expense,
        balance: revenue - expense,
      };
    });

    return { success: true, data: result };
  } catch {
    return { success: false, error: "Erro ao buscar desempenho por setor" };
  }
}
