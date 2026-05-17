"use server";

import { db } from "@/db";
import {
  poultryBatches,
  poultryIndividuals,
  poultryLocations,
  poultryPlacements,
  fieldActivities,
} from "@/db/schema";
import { eq, and, isNull, desc, asc, inArray } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult } from "./topology";

// ============================================================
// SCHEMAS DE VALIDAÇÃO (Zod)
// ============================================================

const poultryLocationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  shortCode: z.string().max(10).optional().nullable(),
  locationType: z.enum(["galpao", "piquete_rotativo", "pinteiro"], {
    message: "Selecione o tipo de localização",
  }),
  areaM2: z.string().regex(/^\d+(\.\d{1,2})?$/, "Área deve ser um número válido").optional().nullable(),
  capacity: z.string().regex(/^\d+$/, "Capacidade deve ser um número inteiro").optional().nullable(),
  status: z.enum(["liberado", "vazio_sanitario"]).default("liberado"),
  sanitaryVoidStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional().nullable(),
});

const poultryBatchSchema = z.object({
  batchCode: z.string().min(1, "Código do lote é obrigatório").max(30),
  breed: z.string().min(1, "Raça é obrigatória").max(255),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  initialQuantity: z.string().regex(/^\d+$/, "Quantidade deve ser um número inteiro"),
  purpose: z.enum(["corte", "postura", "misto"], {
    message: "Selecione o propósito",
  }),
});

const poultryPlacementSchema = z.object({
  locationId: z.number().int().positive("Localização é obrigatória"),
  batchId: z.number().int().positive("Lote é obrigatório"),
  startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
});

const poultryIndividualSchema = z.object({
  ringId: z.string().min(1, "Anilha é obrigatória").max(50),
  name: z.string().max(255).optional(),
  gender: z.enum(["macho", "femea"], { message: "Selecione o gênero" }),
  fatherId: z.number().int().positive().optional(),
  motherId: z.number().int().positive().optional(),
  batchId: z.number().int().positive().optional(),
});

const mortalitySchema = z.object({
  batchId: z.number().int().positive("ID do lote é obrigatório"),
  quantity: z.string().regex(/^\d+$/, "Quantidade deve ser um número inteiro"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  notes: z.string().optional(),
});

// ============================================================
// POULTRY LOCATIONS (Localizações Físicas)
// ============================================================

export async function createPoultryLocation(
  formData: z.infer<typeof poultryLocationSchema>
): Promise<ActionResult<typeof poultryLocations.$inferSelect>> {
  try {
    const validated = poultryLocationSchema.parse(formData);

    const [newLocation] = await db
      .insert(poultryLocations)
      .values({
        name: validated.name,
        shortCode: validated.shortCode || null,
        locationType: validated.locationType,
        areaM2: validated.areaM2 || null,
        capacity: validated.capacity ? parseInt(validated.capacity, 10) : null,
        status: validated.status,
        sanitaryVoidStart: validated.sanitaryVoidStart ? new Date(validated.sanitaryVoidStart) : null,
      })
      .returning();

    return { success: true, data: newLocation };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao criar localização" };
  }
}

export async function getPoultryLocations(): Promise<
  ActionResult<typeof poultryLocations.$inferSelect[]>
> {
  try {
    const locations = await db.query.poultryLocations.findMany({
      orderBy: (poultryLocations, { asc }) => [asc(poultryLocations.name)],
    });

    return { success: true, data: locations };
  } catch {
    return { success: false, error: "Erro ao buscar localizações" };
  }
}

export async function getActivePoultryLocations(): Promise<
  ActionResult<typeof poultryLocations.$inferSelect[]>
> {
  try {
    const locations = await db.query.poultryLocations.findMany({
      where: eq(poultryLocations.isActive, true),
      orderBy: (poultryLocations, { asc }) => [asc(poultryLocations.name)],
    });

    return { success: true, data: locations };
  } catch {
    return { success: false, error: "Erro ao buscar localizações ativas" };
  }
}

export async function updatePoultryLocation(
  id: number,
  formData: z.infer<typeof poultryLocationSchema>
): Promise<ActionResult<typeof poultryLocations.$inferSelect>> {
  try {
    const validated = poultryLocationSchema.parse(formData);

    const [updated] = await db
      .update(poultryLocations)
      .set({
        name: validated.name,
        shortCode: validated.shortCode || null,
        locationType: validated.locationType,
        areaM2: validated.areaM2 || null,
        capacity: validated.capacity ? parseInt(validated.capacity, 10) : null,
        status: validated.status,
        sanitaryVoidStart: validated.sanitaryVoidStart ? new Date(validated.sanitaryVoidStart) : null,
        updatedAt: new Date(),
      })
      .where(eq(poultryLocations.id, id))
      .returning();

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao atualizar localização" };
  }
}

export async function softDeletePoultryLocation(
  id: number
): Promise<ActionResult<typeof poultryLocations.$inferSelect>> {
  try {
    const [updated] = await db
      .update(poultryLocations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(poultryLocations.id, id))
      .returning();

    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Erro ao desativar localização" };
  }
}

export async function restorePoultryLocation(
  id: number
): Promise<ActionResult<typeof poultryLocations.$inferSelect>> {
  try {
    const [updated] = await db
      .update(poultryLocations)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(poultryLocations.id, id))
      .returning();

    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Erro ao restaurar localização" };
  }
}

// ============================================================
// POULTRY BATCHES (Lotes de Aves)
// ============================================================

export async function createPoultryBatch(
  formData: z.infer<typeof poultryBatchSchema>
): Promise<ActionResult<typeof poultryBatches.$inferSelect>> {
  try {
    const validated = poultryBatchSchema.parse(formData);
    const quantity = parseInt(validated.initialQuantity, 10);

    const [newBatch] = await db
      .insert(poultryBatches)
      .values({
        batchCode: validated.batchCode,
        breed: validated.breed,
        birthDate: validated.birthDate,
        arrivalDate: validated.arrivalDate,
        initialQuantity: quantity,
        activeQuantity: quantity,
        purpose: validated.purpose,
      })
      .returning();

    return { success: true, data: newBatch };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao criar lote de aves" };
  }
}

export async function getPoultryBatches(): Promise<
  ActionResult<typeof poultryBatches.$inferSelect[]>
> {
  try {
    const batches = await db.query.poultryBatches.findMany({
      orderBy: (poultryBatches, { desc }) => [desc(poultryBatches.createdAt)],
    });

    return { success: true, data: batches };
  } catch {
    return { success: false, error: "Erro ao buscar lotes de aves" };
  }
}

export async function getActivePoultryBatches(): Promise<
  ActionResult<typeof poultryBatches.$inferSelect[]>
> {
  try {
    const batches = await db.query.poultryBatches.findMany({
      where: eq(poultryBatches.isActive, true),
      orderBy: (poultryBatches, { asc }) => [asc(poultryBatches.batchCode)],
    });

    return { success: true, data: batches };
  } catch {
    return { success: false, error: "Erro ao buscar lotes ativos" };
  }
}

export async function updatePoultryBatch(
  id: number,
  formData: Partial<z.infer<typeof poultryBatchSchema>>
): Promise<ActionResult<typeof poultryBatches.$inferSelect>> {
  try {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (formData.batchCode) updateData.batchCode = formData.batchCode;
    if (formData.breed) updateData.breed = formData.breed;
    if (formData.birthDate) updateData.birthDate = formData.birthDate;
    if (formData.arrivalDate) updateData.arrivalDate = formData.arrivalDate;
    if (formData.initialQuantity) {
      const qty = parseInt(formData.initialQuantity, 10);
      updateData.initialQuantity = qty;
    }
    if (formData.purpose) updateData.purpose = formData.purpose;

    const [updated] = await db
      .update(poultryBatches)
      .set(updateData)
      .where(eq(poultryBatches.id, id))
      .returning();

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao atualizar lote" };
  }
}

export async function softDeletePoultryBatch(
  id: number
): Promise<ActionResult<typeof poultryBatches.$inferSelect>> {
  try {
    const [updated] = await db
      .update(poultryBatches)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(poultryBatches.id, id))
      .returning();

    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Erro ao desativar lote" };
  }
}

// ============================================================
// POULTRY PLACEMENTS (Alocações de Lotes em Localizações)
// ============================================================

export async function createPoultryPlacement(
  formData: z.infer<typeof poultryPlacementSchema>
): Promise<ActionResult<typeof poultryPlacements.$inferSelect>> {
  try {
    const validated = poultryPlacementSchema.parse(formData);

    const existingPlacement = await db.query.poultryPlacements.findFirst({
      where: and(
        eq(poultryPlacements.batchId, validated.batchId),
        isNull(poultryPlacements.endedAt)
      ),
    });

    if (existingPlacement) {
      return { success: false, error: "Este lote já está alocado em uma localização" };
    }

    const [newPlacement] = await db
      .insert(poultryPlacements)
      .values({
        locationId: validated.locationId,
        batchId: validated.batchId,
        startedAt: validated.startedAt ? new Date(validated.startedAt) : new Date(),
      })
      .returning();

    return { success: true, data: newPlacement };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao criar alocação" };
  }
}

export async function getPoultryPlacements(): Promise<
  ActionResult<
    (typeof poultryPlacements.$inferSelect & {
      location: typeof poultryLocations.$inferSelect | null;
      batch: typeof poultryBatches.$inferSelect | null;
    })[]
  >
> {
  try {
    const placements = await db.query.poultryPlacements.findMany({
      with: {
        location: true,
        batch: true,
      },
      orderBy: (poultryPlacements, { desc }) => [desc(poultryPlacements.startedAt)],
    });

    return { success: true, data: placements };
  } catch {
    return { success: false, error: "Erro ao buscar alocações" };
  }
}

export async function getActivePoultryPlacements(): Promise<
  ActionResult<
    (typeof poultryPlacements.$inferSelect & {
      location: typeof poultryLocations.$inferSelect | null;
      batch: typeof poultryBatches.$inferSelect | null;
    })[]
  >
> {
  try {
    const placements = await db.query.poultryPlacements.findMany({
      where: isNull(poultryPlacements.endedAt),
      with: {
        location: true,
        batch: true,
      },
      orderBy: (poultryPlacements, { desc }) => [desc(poultryPlacements.startedAt)],
    });

    return { success: true, data: placements };
  } catch {
    return { success: false, error: "Erro ao buscar alocações ativas" };
  }
}

export async function endPoultryPlacement(
  id: number
): Promise<ActionResult<typeof poultryPlacements.$inferSelect>> {
  try {
    const [updated] = await db
      .update(poultryPlacements)
      .set({ endedAt: new Date() })
      .where(eq(poultryPlacements.id, id))
      .returning();

    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Erro ao encerrar alocação" };
  }
}

export async function movePoultryPlacement(
  placementId: number,
  newLocationId: number
): Promise<ActionResult<typeof poultryPlacements.$inferSelect>> {
  try {
    const currentPlacement = await db.query.poultryPlacements.findFirst({
      where: eq(poultryPlacements.id, placementId),
      with: {
        location: true,
        batch: true,
      },
    });

    if (!currentPlacement) {
      return { success: false, error: "Alocação não encontrada" };
    }

    if (currentPlacement.endedAt) {
      return { success: false, error: "Esta alocação já foi encerrada" };
    }

    const newLocation = await db.query.poultryLocations.findFirst({
      where: eq(poultryLocations.id, newLocationId),
    });

    if (!newLocation) {
      return { success: false, error: "Local de destino não encontrado" };
    }

    if (newLocation.status === "vazio_sanitario") {
      return {
        success: false,
        error: "Não é possível mover para um local em vazio sanitário. Aguarde o período de descanso do solo.",
      };
    }

    if (!newLocation.isActive) {
      return { success: false, error: "O local de destino está desativado" };
    }

    await db
      .update(poultryPlacements)
      .set({ endedAt: new Date() })
      .where(eq(poultryPlacements.id, placementId));

    const [newPlacement] = await db
      .insert(poultryPlacements)
      .values({
        locationId: newLocationId,
        batchId: currentPlacement.batchId,
        startedAt: new Date(),
      })
      .returning();

    return { success: true, data: newPlacement };
  } catch {
    return { success: false, error: "Erro ao movimentar aves" };
  }
}

// ============================================================
// POULTRY INDIVIDUALS (Reprodutores/Pedigree)
// ============================================================

export async function createPoultryIndividual(
  formData: z.infer<typeof poultryIndividualSchema>
): Promise<ActionResult<typeof poultryIndividuals.$inferSelect>> {
  try {
    const validated = poultryIndividualSchema.parse(formData);

    const result = await db
      .insert(poultryIndividuals)
      .values({
        ringId: validated.ringId,
        name: validated.name || null,
        gender: validated.gender,
        fatherId: validated.fatherId || null,
        motherId: validated.motherId || null,
        batchId: validated.batchId || null,
      })
      .returning();

    const rows = result as unknown as typeof poultryIndividuals.$inferSelect[];

    return { success: true, data: rows[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao cadastrar indivíduo" };
  }
}

export async function getPoultryIndividuals(): Promise<
  ActionResult<
    (typeof poultryIndividuals.$inferSelect & {
      batch: typeof poultryBatches.$inferSelect | null;
    })[]
  >
> {
  try {
    const individuals = await db.query.poultryIndividuals.findMany({
      with: {
        batch: true,
      },
      orderBy: (poultryIndividuals, { asc }) => [asc(poultryIndividuals.ringId)],
    });

    return { success: true, data: individuals };
  } catch {
    return { success: false, error: "Erro ao buscar indivíduos" };
  }
}

export async function getActiveIndividualsForSelect(): Promise<
  ActionResult<typeof poultryIndividuals.$inferSelect[]>
> {
  try {
    const individuals = await db.query.poultryIndividuals.findMany({
      where: eq(poultryIndividuals.status, "ativo"),
      orderBy: (poultryIndividuals, { asc }) => [asc(poultryIndividuals.ringId)],
    });

    return { success: true, data: individuals };
  } catch {
    return { success: false, error: "Erro ao buscar indivíduos ativos" };
  }
}

export async function getActiveBatchesForSelect(): Promise<
  ActionResult<typeof poultryBatches.$inferSelect[]>
> {
  try {
    const batches = await db.query.poultryBatches.findMany({
      where: eq(poultryBatches.isActive, true),
      orderBy: (poultryBatches, { asc }) => [asc(poultryBatches.batchCode)],
    });

    return { success: true, data: batches };
  } catch {
    return { success: false, error: "Erro ao buscar lotes ativos" };
  }
}

// ============================================================
// PEDIGREE (Árvore Genealógica - 3 níveis em paralelo)
// ============================================================

export async function getPedigree(
  individualId: number
): Promise<
  ActionResult<{
    individual: typeof poultryIndividuals.$inferSelect & { batch: typeof poultryBatches.$inferSelect | null };
    father: typeof poultryIndividuals.$inferSelect | null;
    mother: typeof poultryIndividuals.$inferSelect | null;
    paternalGrandfather: typeof poultryIndividuals.$inferSelect | null;
    paternalGrandmother: typeof poultryIndividuals.$inferSelect | null;
    maternalGrandfather: typeof poultryIndividuals.$inferSelect | null;
    maternalGrandmother: typeof poultryIndividuals.$inferSelect | null;
  }>
> {
  try {
    const individual = await db.query.poultryIndividuals.findFirst({
      where: eq(poultryIndividuals.id, individualId),
      with: {
        batch: true,
      },
    });

    if (!individual) {
      return { success: false, error: "Indivíduo não encontrado" };
    }

    const parentIds = [individual.fatherId, individual.motherId].filter(
      (id): id is number => id !== null
    );

    let parents: typeof poultryIndividuals.$inferSelect[] = [];
    if (parentIds.length > 0) {
      parents = await db.query.poultryIndividuals.findMany({
        where: inArray(poultryIndividuals.id, parentIds),
      });
    }

    const father = parents.find((p) => p.id === individual.fatherId) || null;
    const mother = parents.find((p) => p.id === individual.motherId) || null;

    const grandparentIds = [
      father?.fatherId,
      father?.motherId,
      mother?.fatherId,
      mother?.motherId,
    ].filter((id): id is number => id !== null);

    let grandparents: typeof poultryIndividuals.$inferSelect[] = [];
    if (grandparentIds.length > 0) {
      grandparents = await db.query.poultryIndividuals.findMany({
        where: inArray(poultryIndividuals.id, grandparentIds),
      });
    }

    const paternalGrandfather =
      grandparents.find((g) => g.id === father?.fatherId) || null;
    const paternalGrandmother =
      grandparents.find((g) => g.id === father?.motherId) || null;
    const maternalGrandfather =
      grandparents.find((g) => g.id === mother?.fatherId) || null;
    const maternalGrandmother =
      grandparents.find((g) => g.id === mother?.motherId) || null;

    return {
      success: true,
      data: {
        individual,
        father,
        mother,
        paternalGrandfather,
        paternalGrandmother,
        maternalGrandfather,
        maternalGrandmother,
      },
    };
  } catch {
    return { success: false, error: "Erro ao buscar pedigree" };
  }
}

// ============================================================
// MORTALITY (Baixa por Mortalidade - Transação Atômica)
// ============================================================

export async function registerMortality(
  formData: z.infer<typeof mortalitySchema>
): Promise<ActionResult<typeof poultryBatches.$inferSelect>> {
  try {
    const validated = mortalitySchema.parse(formData);
    const quantity = parseInt(validated.quantity, 10);

    const batch = await db.query.poultryBatches.findFirst({
      where: eq(poultryBatches.id, validated.batchId),
    });

    if (!batch) {
      return { success: false, error: "Lote não encontrado" };
    }

    if (quantity <= 0) {
      return { success: false, error: "Quantidade deve ser maior que zero" };
    }

    if (quantity > batch.activeQuantity) {
      return {
        success: false,
        error: `Quantidade excede o atual do lote (${batch.activeQuantity} aves)`,
      };
    }

    const newQuantity = batch.activeQuantity - quantity;

    const [updatedBatch] = await db
      .update(poultryBatches)
      .set({ activeQuantity: newQuantity })
      .where(eq(poultryBatches.id, validated.batchId))
      .returning();

    await db.insert(fieldActivities).values({
      date: new Date(validated.date),
      category: "aves",
      activityType: "coleta_esterco",
      batchId: validated.batchId,
      quantity: validated.quantity,
      notes: validated.notes
        ? `Mortalidade: ${quantity} ave(s) - ${validated.notes}`
        : `Mortalidade: ${quantity} ave(s)`,
    });

    return { success: true, data: updatedBatch };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao registrar mortalidade" };
  }
}

// ============================================================
// INDIVIDUAL STATUS UPDATE
// ============================================================

export async function updateIndividualStatus(
  individualId: number,
  status: "ativo" | "descartado" | "morto"
): Promise<ActionResult<typeof poultryIndividuals.$inferSelect>> {
  try {
    const [updated] = await db
      .update(poultryIndividuals)
      .set({ status })
      .where(eq(poultryIndividuals.id, individualId))
      .returning();

    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Erro ao atualizar status" };
  }
}
