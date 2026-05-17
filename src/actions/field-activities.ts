"use server";

import { db } from "@/db";
import {
  fieldActivities,
  plantings,
  inventoryTransactions,
  inventoryItems,
  beds,
  poultryBatches,
  harvestBatches,
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

    // Se for colheita vegetal com canteiro, gera lote de rastreabilidade
    if (validated.activityType === "colheita" && validated.bedId) {
      const bed = await db.query.beds.findFirst({
        where: eq(beds.id, validated.bedId),
      });

      if (bed) {
        const item = validated.itemId
          ? await db.query.inventoryItems.findFirst({ where: eq(inventoryItems.id, validated.itemId) })
          : null;

        const year = activityDate.getFullYear() % 100;
        const month = String(activityDate.getMonth() + 1).padStart(2, "0");
        const day = String(activityDate.getDate()).padStart(2, "0");
        const dateStr = `${year}${month}${day}`;
        const shortCode = bed.shortCode || `C${bed.id}`;
        const baseCode = `SM-${dateStr}-${shortCode}`;

        let loteCode = baseCode;
        let suffix = 2;
        let exists = true;
        while (exists) {
          const existing = await db.query.harvestBatches.findFirst({
            where: eq(harvestBatches.loteCode, loteCode),
          });
          if (!existing) {
            exists = false;
          } else {
            loteCode = `${baseCode}-${suffix}`;
            suffix++;
          }
        }

        const quantityStr = validated.quantity
          ? `${validated.quantity} ${item?.unit || ""}`.trim()
          : null;

        await db.insert(harvestBatches).values({
          loteCode,
          bedId: validated.bedId,
          plantingId: null,
          quantity: quantityStr,
          harvestedAt: activityDate,
          notes: validated.notes || null,
        });
      }
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
      bedShortCode: string | null;
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
      bedShortCode: (a.bed as { shortCode: string | null } | null)?.shortCode || null,
      itemName: (a.item as { name: string } | null)?.name || null,
      batchName: (a.batch as { name: string } | null)?.name || null,
    }));

    return { success: true, data: enriched };
  } catch {
    return { success: false, error: "Erro ao buscar atividades" };
  }
}

export async function getVegetalActivities(): Promise<
  ActionResult<
    (typeof fieldActivities.$inferSelect & {
      bedName: string | null;
      bedShortCode: string | null;
      itemName: string | null;
      batchName: string | null;
    })[]
  >
> {
  try {
    const activities = await db.query.fieldActivities.findMany({
      where: or(
        eq(fieldActivities.category, "horta"),
        eq(fieldActivities.category, "bioinsumos"),
        eq(fieldActivities.category, "geral")
      ),
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
      bedShortCode: (a.bed as { shortCode: string | null } | null)?.shortCode || null,
      itemName: (a.item as { name: string } | null)?.name || null,
      batchName: (a.batch as { name: string } | null)?.name || null,
    }));

    return { success: true, data: enriched };
  } catch {
    return { success: false, error: "Erro ao buscar atividades vegetais" };
  }
}

export async function getAvesActivities(): Promise<
  ActionResult<
    (typeof fieldActivities.$inferSelect & {
      bedName: string | null;
      bedShortCode: string | null;
      itemName: string | null;
      batchName: string | null;
    })[]
  >
> {
  try {
    const activities = await db.query.fieldActivities.findMany({
      where: eq(fieldActivities.category, "aves"),
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
      bedShortCode: (a.bed as { shortCode: string | null } | null)?.shortCode || null,
      itemName: (a.item as { name: string } | null)?.name || null,
      batchName: (a.batch as { name: string } | null)?.name || null,
    }));

    return { success: true, data: enriched };
  } catch {
    return { success: false, error: "Erro ao buscar atividades de aves" };
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
      where: eq(beds.isActive, true),
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

export async function getHarvestBatches(): Promise<
  ActionResult<
    (typeof harvestBatches.$inferSelect & {
      bedName: string | null;
      bedShortCode: string | null;
      fieldName: string | null;
      glebeName: string | null;
      itemName: string | null;
    })[]
  >
> {
  try {
    const batches = await db.query.harvestBatches.findMany({
      with: {
        bed: {
          with: {
            field: {
              with: {
                glebe: true,
              },
            },
          },
        },
      },
      orderBy: [desc(harvestBatches.harvestedAt)],
    });

    const enriched = batches.map((b) => {
      const planting = (b as any).planting;
      return {
        ...b,
        bedName: b.bed?.name || null,
        bedShortCode: b.bed?.shortCode || null,
        fieldName: b.bed?.field?.name || null,
        glebeName: b.bed?.field?.glebe?.name || null,
        itemName: planting?.item?.name || null,
      };
    });

    return { success: true, data: enriched };
  } catch {
    return { success: false, error: "Erro ao buscar lotes de colheita" };
  }
}

export async function getHarvestBatchByToken(
  token: string
): Promise<
  ActionResult<
    typeof harvestBatches.$inferSelect & {
      bedName: string | null;
      bedShortCode: string | null;
      fieldName: string | null;
      glebeName: string | null;
      itemName: string | null;
    }
  >
> {
  try {
    const batch = await db.query.harvestBatches.findFirst({
      where: eq(harvestBatches.publicToken, token),
      with: {
        bed: {
          with: {
            field: {
              with: {
                glebe: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      return { success: false, error: "Lote não encontrado" };
    }

    const enriched = {
      ...batch,
      bedName: batch.bed?.name || null,
      bedShortCode: batch.bed?.shortCode || null,
      fieldName: batch.bed?.field?.name || null,
      glebeName: batch.bed?.field?.glebe?.name || null,
      itemName: null,
    };

    return { success: true, data: enriched };
  } catch {
    return { success: false, error: "Erro ao buscar lote" };
  }
}
