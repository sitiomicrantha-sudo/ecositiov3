"use server";

import { db } from "@/db";
import {
  poultryBatches,
  poultryIndividuals,
  fieldActivities,
} from "@/db/schema";
import { eq, and, inArray, desc, asc } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult } from "./topology";

// ============================================================
// SCHEMAS DE VALIDAÇÃO (Zod)
// ============================================================

const poultryBatchSchema = z.object({
  name: z.string().min(1, "Nome do lote é obrigatório").max(255),
  breed: z.string().min(1, "Raça é obrigatória").max(255),
  purpose: z.enum(["postura", "corte", "dupla_aptidao", "matriz_genetica"], {
    message: "Selecione o propósito",
  }),
  initialQuantity: z
    .string()
    .regex(/^\d+$/, "Quantidade deve ser um número inteiro"),
  hatchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
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
  quantity: z
    .string()
    .regex(/^\d+$/, "Quantidade deve ser um número inteiro"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  notes: z.string().optional(),
});

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
        name: validated.name,
        breed: validated.breed,
        purpose: validated.purpose,
        initialQuantity: quantity,
        currentQuantity: quantity,
        hatchDate: new Date(validated.hatchDate),
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
      orderBy: (poultryBatches, { desc }) => [desc(poultryBatches.hatchDate)],
    });

    return { success: true, data: batches };
  } catch {
    return { success: false, error: "Erro ao buscar lotes de aves" };
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
      batchName: string | null;
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

    const enriched = individuals.map((ind) => ({
      ...ind,
      batchName: (ind.batch as { name: string } | null)?.name || null,
    }));

    return { success: true, data: enriched };
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
      where: eq(poultryBatches.status, "active"),
      orderBy: (poultryBatches, { asc }) => [asc(poultryBatches.name)],
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

    if (quantity > batch.currentQuantity) {
      return {
        success: false,
        error: `Quantidade excede o atual do lote (${batch.currentQuantity} aves)`,
      };
    }

    const newQuantity = batch.currentQuantity - quantity;

    const [updatedBatch] = await db
      .update(poultryBatches)
      .set({ currentQuantity: newQuantity })
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
