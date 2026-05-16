"use server";

import { db } from "@/db";
import { costCenters } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getActiveCostCenters() {
  try {
    const list = await db.query.costCenters.findMany({
      where: eq(costCenters.isActive, true),
      orderBy: (costCenters, { asc }) => [asc(costCenters.name)],
    });
    return { success: true, data: list };
  } catch {
    return { success: false, error: "Erro ao buscar centros de custo" };
  }
}

export async function ensureDefaultCostCenters() {
  const defaults = [
    { name: "Vegetal", description: "Horta, SAF, Viveiro e Cultivos" },
    { name: "Avicultura", description: "Aviário, Lotes e Reprodução" },
    { name: "Infraestrutura Geral", description: "Despesas compartilhadas e administrativas" },
  ];

  const inserted: typeof costCenters.$inferSelect[] = [];

  for (const d of defaults) {
    const existing = await db.query.costCenters.findFirst({
      where: eq(costCenters.name, d.name),
    });

    if (!existing) {
      const [row] = await db.insert(costCenters).values(d).returning();
      inserted.push(row);
    } else {
      inserted.push(existing);
    }
  }

  return inserted;
}
