"use server";

import { db } from "@/db";
import { financialTransactions, bills, receivables, costCenters } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import type { ActionResult } from "./topology";

export type FinancialDashboard = {
  dre: {
    totalRevenue: string;
    totalExpense: string;
    netProfit: string;
    profitMargin: number;
  };
  coeByCostCenter: {
    costCenterName: string;
    totalExpense: string;
    percentage: number;
  }[];
  expensesByCategory: {
    category: string;
    total: string;
    percentage: number;
  }[];
  cashFlowProjection: {
    date: string;
    projectedIn: string;
    projectedOut: string;
  }[];
};

export async function getFinancialDashboardData(
  dateFrom: string,
  dateTo: string
): Promise<ActionResult<FinancialDashboard>> {
  try {
    const allTransactions = await db.query.financialTransactions.findMany({
      with: {
        costCenter: true,
      },
    });

    const filteredTx = allTransactions.filter((tx) => {
      const txDate = tx.date.toISOString().split("T")[0];
      return txDate >= dateFrom && txDate <= dateTo;
    });

    let totalRevenue = 0;
    let totalExpense = 0;
    const expenseByCostCenter = new Map<string, { name: string; total: number }>();

    for (const tx of filteredTx) {
      const amount = parseFloat(tx.amount);
      if (tx.type === "revenue") {
        totalRevenue += amount;
      } else {
        totalExpense += amount;
        const ccName = (tx.costCenter as { name: string } | null)?.name || "Não alocado";
        const existing = expenseByCostCenter.get(ccName);
        if (existing) {
          existing.total += amount;
        } else {
          expenseByCostCenter.set(ccName, { name: ccName, total: amount });
        }
      }
    }

    const netProfit = totalRevenue - totalExpense;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const coeByCostCenter = Array.from(expenseByCostCenter.entries())
      .map(([name, data]) => ({
        costCenterName: data.name,
        totalExpense: data.total.toFixed(2),
        percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => parseFloat(b.totalExpense) - parseFloat(a.totalExpense));

    const paidBills = await db.query.bills.findMany({
      where: and(
        eq(bills.status, "paid"),
        gte(bills.paidDate, dateFrom),
        lte(bills.paidDate, dateTo),
      ),
    });

    const expenseByCategory = new Map<string, number>();
    for (const bill of paidBills) {
      const amount = parseFloat(bill.amount);
      const existing = expenseByCategory.get(bill.category);
      if (existing !== undefined) {
        expenseByCategory.set(bill.category, existing + amount);
      } else {
        expenseByCategory.set(bill.category, amount);
      }
    }

    const totalCategoryExpense = Array.from(expenseByCategory.values()).reduce((s, v) => s + v, 0);
    const expensesByCategory = Array.from(expenseByCategory.entries())
      .map(([category, total]) => ({
        category,
        total: total.toFixed(2),
        percentage: totalCategoryExpense > 0 ? (total / totalCategoryExpense) * 100 : 0,
      }))
      .sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const endDate = thirtyDaysFromNow.toISOString().split("T")[0];

    const pendingBills = await db.query.bills.findMany({
      where: and(
        eq(bills.status, "pending"),
        gte(bills.dueDate, today),
        lte(bills.dueDate, endDate),
      ),
    });

    const pendingReceivables = await db.query.receivables.findMany({
      where: and(
        eq(receivables.status, "pending"),
        gte(receivables.dueDate, today),
        lte(receivables.dueDate, endDate),
      ),
    });

    const projectionMap = new Map<string, { in: number; out: number }>();
    const startDate = new Date(today);
    for (let i = 0; i <= 30; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      projectionMap.set(dateStr, { in: 0, out: 0 });
    }

    for (const bill of pendingBills) {
      const dateStr = bill.dueDate;
      const existing = projectionMap.get(dateStr);
      if (existing) {
        existing.out += parseFloat(bill.amount);
      }
    }

    for (const receivable of pendingReceivables) {
      const dateStr = receivable.dueDate;
      const existing = projectionMap.get(dateStr);
      if (existing) {
        existing.in += parseFloat(receivable.amount);
      }
    }

    const cashFlowProjection = Array.from(projectionMap.entries())
      .map(([date, data]) => ({
        date,
        projectedIn: data.in.toFixed(2),
        projectedOut: data.out.toFixed(2),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: true,
      data: {
        dre: {
          totalRevenue: totalRevenue.toFixed(2),
          totalExpense: totalExpense.toFixed(2),
          netProfit: netProfit.toFixed(2),
          profitMargin: Math.round(profitMargin * 100) / 100,
        },
        coeByCostCenter,
        expensesByCategory,
        cashFlowProjection,
      },
    };
  } catch {
    return { success: false, error: "Erro ao buscar dados do dashboard financeiro" };
  }
}
