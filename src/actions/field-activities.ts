"use server";

import { db } from "@/db";
import {
  fieldActivities,
  plantings,
  inventoryTransactions,
  inventoryItems,
  beds,
  poultryBatches,
} from "@/db/schema";
import { eq, desc, isNull, or, and } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult } from "./topology";

const fieldActivitySchema = z.object({
  category: z.enum(["horta", "aves", "bioinsumos", "geral"], {
    message: "Selecione uma categoria",
  }).optional(),
  activityType: z.enum(
    [
      "plantio",
      "colheita",
      "coleta_ovos",
      "limpeza_aviario",
      "coleta_esterco",
      "aplicacao_insumo",
      "rocagem",
      "alimentacao_racao",
      "manejo_ambiencia",
      "movimentacao_piquete",
    ],
    { message: "Selecione um tipo de atividade" }
  ),
  bedId: z.number().int().positive().optional(),
  itemId: z.number().int().positive().optional(),
  batchId: z.number().int().positive().optional(),
  quantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Quantidade deve ser um número válido")
    .optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  notes: z.string().optional(),
  plantingStatus: z.enum(["active", "permanent"]).optional(),
});

const activityTypeToCategory: Record<string, "horta" | "aves" | "bioinsumos" | "geral"> = {
  plantio: "horta",
  colheita: "horta",
  aplicacao_insumo: "horta",
  rocagem: "horta",
  coleta_ovos: "aves",
  limpeza_aviario: "aves",
  coleta_esterco: "aves",
  alimentacao_racao: "aves",
  manejo_ambiencia: "aves",
  movimentacao_piquete: "aves",
};

// ============================================================
// ACTIONS
// ============================================================

export async function registerFieldActivity(
  formData: z.infer<typeof fieldActivitySchema>
): Promise<ActionResult<typeof fieldActivities.$inferSelect>> {
  try {
    const validated = fieldActivitySchema.parse(formData);

    const category = validated.category || activityTypeToCategory[validated.activityType] || "geral";
    const activityDate = new Date(validated.date);

    const [newActivity] = await db
      .insert(fieldActivities)
      .values({
        date: activityDate,
        category,
        activityType: validated.activityType,
        bedId: validated.bedId || null,
        itemId: validated.itemId || null,
        quantity: validated.quantity || null,
        notes: validated.notes || null,
      })
      .returning();

    // Se for plantio, cria registro em plantings
    if (validated.activityType === "plantio" && validated.bedId && validated.itemId) {
      await db.insert(plantings).values({
        bedId: validated.bedId,
        itemId: validated.itemId,
        status: validated.plantingStatus || "active",
        plantedAt: activityDate,
      });
    }

    // Se for colheita ou coleta_ovos, cria transação de entrada no estoque
    if (
      (validated.activityType === "colheita" || validated.activityType === "coleta_ovos") &&
      validated.itemId &&
      validated.quantity
    ) {
      await db.insert(inventoryTransactions).values({
        itemId: validated.itemId,
        type: "entry",
        quantity: validated.quantity,
        date: validated.date,
        notes: validated.notes
          ? `Registro automático via Caderno de Campo: ${validated.notes}`
          : "Registro automático via Caderno de Campo",
      });
    }

    // Se for alimentacao_racao, cria transação de saída (baixa de estoque real)
    if (
      validated.activityType === "alimentacao_racao" &&
      validated.itemId &&
      validated.quantity
    ) {
      const item = await db.query.inventoryItems.findFirst({
        where: eq(inventoryItems.id, validated.itemId),
      });

      await db.insert(inventoryTransactions).values({
        itemId: validated.itemId,
        type: "exit",
        quantity: validated.quantity,
        date: validated.date,
        notes: validated.notes
          ? `Ração fornecida${validated.batchId ? ` - Lote` : ""}${validated.notes ? `: ${validated.notes}` : ""}`
          : `Ração fornecida${validated.batchId ? ` - Lote` : ""}`,
      });
    }

    return { success: true, data: newActivity };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao registrar atividade" };
  }
}

export async function getFieldActivities(): Promise<
  ActionResult<
    (typeof fieldActivities.$inferSelect & {
      bedName: string | null;
      itemName: string | null;
      batchName: string | null;
    })[]
  >
> {
  try {
    const activities = await db.query.fieldActivities.findMany({
      with: {
        bed: true,
        item: true,
        batch: true,
      },
      orderBy: (fieldActivities, { desc }) => [desc(fieldActivities.date)],
    });

    const enriched = activities.map((a) => ({
      ...a,
      bedName: (a.bed as { name: string } | null)?.name || null,
      itemName: (a.item as { name: string } | null)?.name || null,
      batchName: (a.batch as { name: string } | null)?.name || null,
    }));

    return { success: true, data: enriched };
  } catch {
    return { success: false, error: "Erro ao buscar atividades" };
  }
}

export async function getBedsWithPlantingStatus(): Promise<
  ActionResult<
    (typeof beds.$inferSelect & {
      hasActivePlanting: boolean;
      plantingStatus: string | null;
      plantingItemName: string | null;
    })[]
  >
> {
  try {
    const allBeds = await db.query.beds.findMany({
      orderBy: (beds, { asc }) => [asc(beds.name)],
    });

    const activePlantings = await db.query.plantings.findMany({
      where: or(
        eq(plantings.status, "active"),
        eq(plantings.status, "permanent")
      ),
      with: {
        item: true,
      },
    });

    const plantingByBed = new Map<number, typeof activePlantings[number]>();
    for (const p of activePlantings) {
      if (!plantingByBed.has(p.bedId)) {
        plantingByBed.set(p.bedId, p);
      }
    }

    const enriched = allBeds.map((bed) => {
      const planting = plantingByBed.get(bed.id);
      return {
        ...bed,
        hasActivePlanting: !!planting,
        plantingStatus: planting?.status || null,
        plantingItemName: (planting?.item as { name: string } | null)?.name || null,
      };
    });

    return { success: true, data: enriched };
  } catch {
    return { success: false, error: "Erro ao buscar canteiros" };
  }
}

export async function getPlantableItems(): Promise<
  ActionResult<typeof inventoryItems.$inferSelect[]>
> {
  try {
    const items = await db.query.inventoryItems.findMany({
      where: or(
        eq(inventoryItems.category, "muda"),
        eq(inventoryItems.category, "semente")
      ),
      orderBy: (inventoryItems, { asc }) => [asc(inventoryItems.name)],
    });

    return { success: true, data: items };
  } catch {
    return { success: false, error: "Erro ao buscar itens plantáveis" };
  }
}

export async function getAllInventoryItems(): Promise<
  ActionResult<typeof inventoryItems.$inferSelect[]>
> {
  try {
    const items = await db.query.inventoryItems.findMany({
      orderBy: (inventoryItems, { asc }) => [asc(inventoryItems.name)],
    });

    return { success: true, data: items };
  } catch {
    return { success: false, error: "Erro ao buscar itens" };
  }
}

export async function findOrCreateEggsItem(): Promise<
  ActionResult<typeof inventoryItems.$inferSelect>
> {
  try {
    const existing = await db.query.inventoryItems.findFirst({
      where: eq(inventoryItems.name, "Ovos"),
    });

    if (existing) {
      return { success: true, data: existing };
    }

    const [created] = await db
      .insert(inventoryItems)
      .values({
        name: "Ovos",
        unit: "unit",
        type: "final_product",
        category: "insumo",
        location: "Aviário",
      })
      .returning();

    return { success: true, data: created };
  } catch {
    return { success: false, error: "Erro ao buscar/criar item Ovos" };
  }
}

export async function getInputItems(): Promise<
  ActionResult<typeof inventoryItems.$inferSelect[]>
> {
  try {
    const items = await db.query.inventoryItems.findMany({
      where: eq(inventoryItems.type, "input"),
      orderBy: (inventoryItems, { asc }) => [asc(inventoryItems.name)],
    });

    return { success: true, data: items };
  } catch {
    return { success: false, error: "Erro ao buscar insumos" };
  }
}

export async function getActiveBatchesForField(): Promise<
  ActionResult<typeof poultryBatches.$inferSelect[]>
> {
  try {
    const batches = await db.query.poultryBatches.findMany({
      where: eq(poultryBatches.status, "active"),
      orderBy: (poultryBatches, { asc }) => [asc(poultryBatches.name)],
    });

    return { success: true, data: batches };
  } catch {
    return { success: false, error: "Erro ao buscar lotes ativos" };
  }
}

export async function getItemStock(itemId: number): Promise<
  ActionResult<{ currentStock: number; itemName: string; unit: string }>
> {
  try {
    const item = await db.query.inventoryItems.findFirst({
      where: eq(inventoryItems.id, itemId),
    });

    if (!item) {
      return { success: false, error: "Item não encontrado" };
    }

    const transactions = await db.query.inventoryTransactions.findMany({
      where: eq(inventoryTransactions.itemId, itemId),
    });

    let currentStock = 0;
    for (const tx of transactions) {
      const qty = parseFloat(tx.quantity);
      if (tx.type === "entry") {
        currentStock += qty;
      } else {
        currentStock -= qty;
      }
    }

    return {
      success: true,
      data: {
        currentStock,
        itemName: item.name,
        unit: item.unit,
      },
    };
  } catch {
    return { success: false, error: "Erro ao calcular estoque" };
  }
}
