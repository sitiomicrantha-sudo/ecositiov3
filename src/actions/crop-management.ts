"use server";

import { db } from "@/db";
import { crops, plantings, fields, beds, inventoryItems, fieldActivities } from "@/db/schema";
import { eq, and, desc, isNull, or } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult } from "./topology";

// ============================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================

const cropSchema = z.object({
  name: z.string().min(1, "Nome da cultura é obrigatório").max(255),
  cycleType: z.enum(["ciclo_curto", "anual", "perene"], { message: "Selecione o tipo de ciclo" }),
  averageCycleDays: z.string().regex(/^\d+$/, "Dias deve ser um número inteiro"),
  seedRequirementPerM2: z.string().regex(/^\d+(\.\d{1,4})?$/, "Valor inválido").optional().nullable(),
  seedlingRequirementPerM2: z.string().regex(/^\d+(\.\d{1,4})?$/, "Valor inválido").optional().nullable(),
});

const unifiedPlantingSchema = z.object({
  cropId: z.string().regex(/^\d+$/, "Selecione uma cultura"),
  itemId: z.string().regex(/^\d+$/, "Selecione uma muda/semente"),
  bedId: z.string().regex(/^\d+$/, "Selecione um canteiro").optional().nullable(),
  fieldId: z.string().regex(/^\d+$/, "Selecione um talhão").optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  plannedAreaM2: z.string().regex(/^\d+(\.\d{1,2})?$/, "Área deve ser um número válido").optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// ============================================================
// CATÁLOGO DE CULTURAS
// ============================================================

export async function createCrop(
  formData: z.infer<typeof cropSchema>
): Promise<ActionResult<typeof crops.$inferSelect>> {
  try {
    const validated = cropSchema.parse(formData);

    const [newCrop] = await db
      .insert(crops)
      .values({
        name: validated.name,
        cycleType: validated.cycleType,
        averageCycleDays: parseInt(validated.averageCycleDays, 10),
        seedRequirementPerM2: validated.seedRequirementPerM2 || null,
        seedlingRequirementPerM2: validated.seedlingRequirementPerM2 || null,
      })
      .returning();

    return { success: true, data: newCrop };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao criar cultura" };
  }
}

export async function getCropsList(): Promise<ActionResult<typeof crops.$inferSelect[]>> {
  try {
    const list = await db.query.crops.findMany({
      orderBy: [desc(crops.name)],
    });

    return { success: true, data: list };
  } catch {
    return { success: false, error: "Erro ao buscar culturas" };
  }
}

export async function getCropById(id: number): Promise<ActionResult<typeof crops.$inferSelect>> {
  try {
    const crop = await db.query.crops.findFirst({
      where: eq(crops.id, id),
    });

    if (!crop) {
      return { success: false, error: "Cultura não encontrada" };
    }

    return { success: true, data: crop };
  } catch {
    return { success: false, error: "Erro ao buscar cultura" };
  }
}

export async function updateCrop(
  id: number,
  formData: z.infer<typeof cropSchema>
): Promise<ActionResult<typeof crops.$inferSelect>> {
  try {
    const validated = cropSchema.parse(formData);

    const existing = await db.query.crops.findFirst({
      where: eq(crops.id, id),
    });

    if (!existing) {
      return { success: false, error: "Cultura não encontrada" };
    }

    const [updated] = await db
      .update(crops)
      .set({
        name: validated.name,
        cycleType: validated.cycleType,
        averageCycleDays: parseInt(validated.averageCycleDays, 10),
        seedRequirementPerM2: validated.seedRequirementPerM2 || null,
        seedlingRequirementPerM2: validated.seedlingRequirementPerM2 || null,
      })
      .where(eq(crops.id, id))
      .returning();

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao atualizar cultura" };
  }
}

export async function archiveCrop(
  id: number
): Promise<ActionResult<typeof crops.$inferSelect>> {
  try {
    const existing = await db.query.crops.findFirst({
      where: eq(crops.id, id),
    });

    if (!existing) {
      return { success: false, error: "Cultura não encontrada" };
    }

    if (!existing.isActive) {
      return { success: false, error: "Cultura já está arquivada" };
    }

    const [archived] = await db
      .update(crops)
      .set({ isActive: false })
      .where(eq(crops.id, id))
      .returning();

    return { success: true, data: archived };
  } catch {
    return { success: false, error: "Erro ao arquivar cultura" };
  }
}

export async function restoreCrop(
  id: number
): Promise<ActionResult<typeof crops.$inferSelect>> {
  try {
    const existing = await db.query.crops.findFirst({
      where: eq(crops.id, id),
    });

    if (!existing) {
      return { success: false, error: "Cultura não encontrada" };
    }

    if (existing.isActive) {
      return { success: false, error: "Cultura já está ativa" };
    }

    const [restored] = await db
      .update(crops)
      .set({ isActive: true })
      .where(eq(crops.id, id))
      .returning();

    return { success: true, data: restored };
  } catch {
    return { success: false, error: "Erro ao restaurar cultura" };
  }
}

export async function getActiveCropsForSelect(): Promise<ActionResult<{ id: number; name: string }[]>> {
  try {
    const list = await db.query.crops.findMany({
      where: eq(crops.isActive, true),
      orderBy: [desc(crops.name)],
      columns: {
        id: true,
        name: true,
      },
    });

    return { success: true, data: list };
  } catch {
    return { success: false, error: "Erro ao buscar culturas ativas" };
  }
}

// ============================================================
// FUNÇÃO MESTRE: PLANTIO IMEDIATO OU PLANEJAMENTO
// ============================================================

export async function handleUnifiedPlantingOrPlan(
  formData: z.infer<typeof unifiedPlantingSchema>
): Promise<ActionResult<{ type: "planting" | "plan"; id: number }>> {
  try {
    const validated = unifiedPlantingSchema.parse(formData);

    const crop = await db.query.crops.findFirst({
      where: eq(crops.id, parseInt(validated.cropId, 10)),
    });

    if (!crop) {
      return { success: false, error: "Cultura não encontrada" };
    }

    const startDate = new Date(validated.startDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isFuture = startDate > today;

    const expectedHarvestAt = new Date(startDate);
    expectedHarvestAt.setDate(expectedHarvestAt.getDate() + crop.averageCycleDays);

    if (isFuture) {
      const [newPlanting] = await db
        .insert(plantings)
        .values({
          bedId: validated.bedId ? parseInt(validated.bedId, 10) : null,
          fieldId: validated.fieldId ? parseInt(validated.fieldId, 10) : null,
          itemId: parseInt(validated.itemId, 10),
          cropId: parseInt(validated.cropId, 10),
          status: "planned",
          plantedAt: null,
          expectedHarvestAt,
          plannedAreaM2: validated.plannedAreaM2 || null,
          notes: validated.notes || null,
        })
        .returning();

      return { success: true, data: { type: "plan", id: newPlanting.id } };
    } else {
      const [newPlanting] = await db
        .insert(plantings)
        .values({
          bedId: validated.bedId ? parseInt(validated.bedId, 10) : null,
          fieldId: validated.fieldId ? parseInt(validated.fieldId, 10) : null,
          itemId: parseInt(validated.itemId, 10),
          cropId: parseInt(validated.cropId, 10),
          status: "active",
          plantedAt: startDate,
          expectedHarvestAt,
          plannedAreaM2: validated.plannedAreaM2 || null,
          notes: validated.notes || null,
        })
        .returning();

      const cropItem = await db.query.inventoryItems.findFirst({
        where: eq(inventoryItems.id, parseInt(validated.itemId, 10)),
      });

      await db.insert(fieldActivities).values({
        date: startDate,
        category: "horta",
        activityType: "plantio",
        bedId: validated.bedId ? parseInt(validated.bedId, 10) : null,
        itemId: parseInt(validated.itemId, 10),
        quantity: validated.plannedAreaM2 || null,
        notes: validated.notes
          ? `Plantio de ${crop?.name}${cropItem ? ` (${cropItem.name})` : ""}. Área: ${validated.plannedAreaM2 || "N/A"}m². ${validated.notes}`
          : `Plantio de ${crop?.name}${cropItem ? ` (${cropItem.name})` : ""}. Área: ${validated.plannedAreaM2 || "N/A"}m².`,
      });

      return { success: true, data: { type: "planting", id: newPlanting.id } };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao registrar plantio/planejamento" };
  }
}

// ============================================================
// LISTAGEM DE PLANTIOS E PLANEJAMENTOS
// ============================================================

export type PlantingWithDetails = {
  id: number;
  bedId: number | null;
  fieldId: number | null;
  itemId: number;
  cropId: number | null;
  status: string;
  plantedAt: Date | null;
  harvestedAt: Date | null;
  expectedHarvestAt: Date | null;
  plannedAreaM2: string | null;
  notes: string | null;
  bedName: string | null;
  bedShortCode: string | null;
  fieldName: string | null;
  fieldShortCode: string | null;
  itemName: string | null;
  cropName: string | null;
  cropCycleType: string | null;
};

export async function getPlantingsList(filters?: {
  status?: string;
  bedId?: number;
  fieldId?: number;
}): Promise<ActionResult<PlantingWithDetails[]>> {
  try {
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(plantings.status, filters.status as any));
    }

    if (filters?.bedId) {
      conditions.push(eq(plantings.bedId, filters.bedId));
    }

    if (filters?.fieldId) {
      conditions.push(eq(plantings.fieldId, filters.fieldId));
    }

    const allPlantings = await db.query.plantings.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        bed: {
          with: {
            field: true,
          },
        },
        field: true,
        item: true,
        crop: true,
      },
      orderBy: [desc(plantings.plantedAt), desc(plantings.createdAt)],
    });

    const result: PlantingWithDetails[] = allPlantings.map((p) => ({
      id: p.id,
      bedId: p.bedId,
      fieldId: p.fieldId,
      itemId: p.itemId,
      cropId: p.cropId,
      status: p.status,
      plantedAt: p.plantedAt,
      harvestedAt: p.harvestedAt,
      expectedHarvestAt: p.expectedHarvestAt,
      plannedAreaM2: p.plannedAreaM2,
      notes: p.notes,
      bedName: (p.bed as { name: string } | null)?.name || null,
      bedShortCode: (p.bed as { shortCode: string } | null)?.shortCode || null,
      fieldName: (p.field as { name: string } | null)?.name || (p.bed as any)?.field?.name || null,
      fieldShortCode: (p.field as { shortCode: string } | null)?.shortCode || (p.bed as any)?.field?.shortCode || null,
      itemName: (p.item as { name: string } | null)?.name || null,
      cropName: (p.crop as { name: string } | null)?.name || null,
      cropCycleType: (p.crop as { cycleType: string } | null)?.cycleType || null,
    }));

    return { success: true, data: result };
  } catch {
    return { success: false, error: "Erro ao buscar plantios" };
  }
}

export async function getPlannedPlantings(): Promise<ActionResult<PlantingWithDetails[]>> {
  return getPlantingsList({ status: "planned" });
}

export async function getActivePlantings(): Promise<ActionResult<PlantingWithDetails[]>> {
  return getPlantingsList({ status: "active" });
}

// ============================================================
// EXECUTAR PLANEJAMENTO (converter planned → active)
// ============================================================

export async function executeCropPlan(
  plantingId: number
): Promise<ActionResult<typeof plantings.$inferSelect>> {
  try {
    const planting = await db.query.plantings.findFirst({
      where: eq(plantings.id, plantingId),
      with: {
        crop: true,
        item: true,
      },
    });

    if (!planting) {
      return { success: false, error: "Planejamento não encontrado" };
    }

    if (planting.status !== "planned") {
      return { success: false, error: "Este plantio não está mais planejado" };
    }

    const now = new Date();

    const [updated] = await db
      .update(plantings)
      .set({
        status: "active",
        plantedAt: now,
        updatedAt: now,
      })
      .where(eq(plantings.id, plantingId))
      .returning();

    const cropName = (planting.crop as { name: string } | null)?.name || "Cultura";
    const itemName = (planting.item as { name: string } | null)?.name || "Item";

    await db.insert(fieldActivities).values({
      date: now,
      category: "horta",
      activityType: "plantio",
      bedId: planting.bedId,
      itemId: planting.itemId,
      quantity: planting.plannedAreaM2,
      notes: `Execução do planejamento: plantio de ${cropName} (${itemName}). Área: ${planting.plannedAreaM2 || "N/A"}m².`,
    });

    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Erro ao executar planejamento" };
  }
}

// ============================================================
// CANCELAR PLANEJAMENTO
// ============================================================

export async function cancelCropPlan(
  plantingId: number
): Promise<ActionResult<typeof plantings.$inferSelect>> {
  try {
    const planting = await db.query.plantings.findFirst({
      where: eq(plantings.id, plantingId),
    });

    if (!planting) {
      return { success: false, error: "Planejamento não encontrado" };
    }

    if (planting.status !== "planned") {
      return { success: false, error: "Apenas planejamentos podem ser cancelados" };
    }

    const [updated] = await db
      .update(plantings)
      .set({
        status: "planned",
        notes: planting.notes
          ? `${planting.notes}\n[CANCELADO em ${new Date().toLocaleDateString("pt-BR")}]`
          : `[CANCELADO em ${new Date().toLocaleDateString("pt-BR")}]`,
        updatedAt: new Date(),
      })
      .where(eq(plantings.id, plantingId))
      .returning();

    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Erro ao cancelar planejamento" };
  }
}

// ============================================================
// HELPER: Itens plantáveis (mudas/sementes do estoque)
// ============================================================

export async function getPlantableItems(): Promise<ActionResult<typeof inventoryItems.$inferSelect[]>> {
  try {
    const items = await db.query.inventoryItems.findMany({
      where: or(
        eq(inventoryItems.category, "muda"),
        eq(inventoryItems.category, "semente"),
      ),
      orderBy: (inventoryItems, { asc }) => [asc(inventoryItems.name)],
    });

    return { success: true, data: items };
  } catch {
    return { success: false, error: "Erro ao buscar itens plantáveis" };
  }
}
