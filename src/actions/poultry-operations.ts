"use server";

import { db } from "@/db";
import {
  poultryDailyRecords,
  poultryHealthEvents,
  poultryBatches,
  poultryPlacements,
  poultryLocations,
  fieldActivities,
} from "@/db/schema";
import { eq, and, isNull, desc, gte, lte } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult } from "./topology";

// ============================================================
// SCHEMAS DE VALIDAÇÃO (Zod)
// ============================================================

const dailyRecordSchema = z.object({
  locationId: z.number().int().positive("Local é obrigatório"),
  recordedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  eggsCollected: z.string().regex(/^\d+$/, "Quantidade deve ser um número inteiro").optional().default("0"),
  eggsBroken: z.string().regex(/^\d+$/, "Quantidade deve ser um número inteiro").optional().default("0"),
  feedConsumedKg: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valor deve ser numérico").optional().nullable(),
  notes: z.string().optional(),
});

const healthEventSchema = z.object({
  batchId: z.number().int().positive().optional().nullable(),
  locationId: z.number().int().positive().optional().nullable(),
  treatmentType: z.enum(["fitoterapico_floral", "vacina_profilatica", "alopatico_comercial"], {
    message: "Selecione o tipo de tratamento",
  }),
  productName: z.string().min(1, "Nome do produto é obrigatório").max(255),
  appliedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  withdrawalDays: z.number().int().min(0).optional().default(0),
  notes: z.string().optional(),
});

const mortalitySchema = z.object({
  batchId: z.number().int().positive().optional().nullable(),
  locationId: z.number().int().positive().optional().nullable(),
  quantity: z.string().regex(/^\d+$/, "Quantidade deve ser um número inteiro"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  notes: z.string().optional(),
});

// ============================================================
// REGISTROS DIÁRIOS (Ovos + Ração)
// ============================================================

export async function createPoultryDailyRecord(
  formData: z.infer<typeof dailyRecordSchema>
): Promise<ActionResult<typeof poultryDailyRecords.$inferSelect>> {
  try {
    const validated = dailyRecordSchema.parse(formData);

    const [newRecord] = await db
      .insert(poultryDailyRecords)
      .values({
        locationId: validated.locationId,
        recordedAt: validated.recordedAt,
        eggsCollected: parseInt(validated.eggsCollected, 10),
        eggsBroken: parseInt(validated.eggsBroken, 10),
        feedConsumedKg: validated.feedConsumedKg || null,
        notes: validated.notes || null,
      })
      .returning();

    return { success: true, data: newRecord };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao registrar lançamento diário" };
  }
}

export async function getDailyRecordsByLocation(
  locationId: number,
  days: number = 30
): Promise<ActionResult<typeof poultryDailyRecords.$inferSelect[]>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await db.query.poultryDailyRecords.findMany({
      where: and(
        eq(poultryDailyRecords.locationId, locationId),
        gte(poultryDailyRecords.recordedAt, startDate.toISOString().split("T")[0])
      ),
      orderBy: (poultryDailyRecords, { desc }) => [desc(poultryDailyRecords.recordedAt)],
    });

    return { success: true, data: records };
  } catch {
    return { success: false, error: "Erro ao buscar registros diários" };
  }
}

export async function getRecentDailyRecords(
  limit: number = 20
): Promise<
  ActionResult<
    (typeof poultryDailyRecords.$inferSelect & {
      location: typeof poultryLocations.$inferSelect | null;
    })[]
  >
> {
  try {
    const records = await db.query.poultryDailyRecords.findMany({
      with: {
        location: true,
      },
      orderBy: (poultryDailyRecords, { desc }) => [desc(poultryDailyRecords.recordedAt)],
      limit,
    });

    return { success: true, data: records };
  } catch {
    return { success: false, error: "Erro ao buscar registros recentes" };
  }
}

// ============================================================
// EVENTOS DE SAÚDE (Prontuário Sanitário)
// ============================================================

export async function createPoultryHealthEvent(
  formData: z.infer<typeof healthEventSchema>
): Promise<ActionResult<typeof poultryHealthEvents.$inferSelect>> {
  try {
    const validated = healthEventSchema.parse(formData);

    if (!validated.batchId && !validated.locationId) {
      return { success: false, error: "Selecione um lote ou um local" };
    }

    const [newEvent] = await db
      .insert(poultryHealthEvents)
      .values({
        batchId: validated.batchId || null,
        locationId: validated.locationId || null,
        treatmentType: validated.treatmentType,
        productName: validated.productName,
        appliedAt: new Date(validated.appliedAt),
        withdrawalDays: validated.withdrawalDays,
        notes: validated.notes || null,
      })
      .returning();

    return { success: true, data: newEvent };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao registrar evento de saúde" };
  }
}

export async function getHealthEventsByBatch(
  batchId: number
): Promise<ActionResult<typeof poultryHealthEvents.$inferSelect[]>> {
  try {
    const events = await db.query.poultryHealthEvents.findMany({
      where: eq(poultryHealthEvents.batchId, batchId),
      orderBy: (poultryHealthEvents, { desc }) => [desc(poultryHealthEvents.appliedAt)],
    });

    return { success: true, data: events };
  } catch {
    return { success: false, error: "Erro ao buscar eventos de saúde" };
  }
}

export async function getHealthEventsByLocation(
  locationId: number
): Promise<ActionResult<typeof poultryHealthEvents.$inferSelect[]>> {
  try {
    const events = await db.query.poultryHealthEvents.findMany({
      where: eq(poultryHealthEvents.locationId, locationId),
      orderBy: (poultryHealthEvents, { desc }) => [desc(poultryHealthEvents.appliedAt)],
    });

    return { success: true, data: events };
  } catch {
    return { success: false, error: "Erro ao buscar eventos de saúde" };
  }
}

export async function getAllHealthEvents(): Promise<
  ActionResult<
    (typeof poultryHealthEvents.$inferSelect & {
      batch: typeof poultryBatches.$inferSelect | null;
      location: typeof poultryLocations.$inferSelect | null;
    })[]
  >
> {
  try {
    const events = await db.query.poultryHealthEvents.findMany({
      with: {
        batch: true,
        location: true,
      },
      orderBy: (poultryHealthEvents, { desc }) => [desc(poultryHealthEvents.appliedAt)],
    });

    return { success: true, data: events };
  } catch {
    return { success: false, error: "Erro ao buscar eventos de saúde" };
  }
}

export interface WithdrawalAlert {
  eventId: number;
  productName: string;
  treatmentType: string;
  appliedAt: Date;
  withdrawalDays: number;
  withdrawalEndsAt: Date;
  daysRemaining: number;
  batchCode: string | null;
  batchId: number | null;
  locationName: string | null;
  locationId: number | null;
}

export async function getActiveWithdrawalAlerts(): Promise<
  ActionResult<WithdrawalAlert[]>
> {
  try {
    const events = await db.query.poultryHealthEvents.findMany({
      where: and(
        eq(poultryHealthEvents.treatmentType, "alopatico_comercial"),
        gte(poultryHealthEvents.withdrawalDays, 1)
      ),
      with: {
        batch: true,
        location: true,
      },
      orderBy: (poultryHealthEvents, { desc }) => [desc(poultryHealthEvents.appliedAt)],
    });

    const now = new Date();
    const alerts: WithdrawalAlert[] = [];

    for (const event of events) {
      const appliedAt = new Date(event.appliedAt);
      const withdrawalEndsAt = new Date(appliedAt);
      withdrawalEndsAt.setDate(withdrawalEndsAt.getDate() + event.withdrawalDays);

      if (now < withdrawalEndsAt) {
        const diffMs = withdrawalEndsAt.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        alerts.push({
          eventId: event.id,
          productName: event.productName,
          treatmentType: event.treatmentType,
          appliedAt,
          withdrawalDays: event.withdrawalDays,
          withdrawalEndsAt,
          daysRemaining,
          batchCode: event.batch?.batchCode || null,
          batchId: event.batchId,
          locationName: event.location?.name || null,
          locationId: event.locationId,
        });
      }
    }

    return { success: true, data: alerts };
  } catch {
    return { success: false, error: "Erro ao buscar alertas de carência" };
  }
}

export async function getWithdrawalAlertsForLocation(
  locationId: number
): Promise<ActionResult<WithdrawalAlert[]>> {
  try {
    const events = await db.query.poultryHealthEvents.findMany({
      where: and(
        eq(poultryHealthEvents.locationId, locationId),
        eq(poultryHealthEvents.treatmentType, "alopatico_comercial"),
        gte(poultryHealthEvents.withdrawalDays, 1)
      ),
      with: {
        batch: true,
        location: true,
      },
      orderBy: (poultryHealthEvents, { desc }) => [desc(poultryHealthEvents.appliedAt)],
    });

    const now = new Date();
    const alerts: WithdrawalAlert[] = [];

    for (const event of events) {
      const appliedAt = new Date(event.appliedAt);
      const withdrawalEndsAt = new Date(appliedAt);
      withdrawalEndsAt.setDate(withdrawalEndsAt.getDate() + event.withdrawalDays);

      if (now < withdrawalEndsAt) {
        const diffMs = withdrawalEndsAt.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        alerts.push({
          eventId: event.id,
          productName: event.productName,
          treatmentType: event.treatmentType,
          appliedAt,
          withdrawalDays: event.withdrawalDays,
          withdrawalEndsAt,
          daysRemaining,
          batchCode: event.batch?.batchCode || null,
          batchId: event.batchId,
          locationName: event.location?.name || null,
          locationId: event.locationId,
        });
      }
    }

    return { success: true, data: alerts };
  } catch {
    return { success: false, error: "Erro ao buscar alertas de carência" };
  }
}

export async function getWithdrawalAlertsForBatch(
  batchId: number
): Promise<ActionResult<WithdrawalAlert[]>> {
  try {
    const events = await db.query.poultryHealthEvents.findMany({
      where: and(
        eq(poultryHealthEvents.batchId, batchId),
        eq(poultryHealthEvents.treatmentType, "alopatico_comercial"),
        gte(poultryHealthEvents.withdrawalDays, 1)
      ),
      with: {
        batch: true,
        location: true,
      },
      orderBy: (poultryHealthEvents, { desc }) => [desc(poultryHealthEvents.appliedAt)],
    });

    const now = new Date();
    const alerts: WithdrawalAlert[] = [];

    for (const event of events) {
      const appliedAt = new Date(event.appliedAt);
      const withdrawalEndsAt = new Date(appliedAt);
      withdrawalEndsAt.setDate(withdrawalEndsAt.getDate() + event.withdrawalDays);

      if (now < withdrawalEndsAt) {
        const diffMs = withdrawalEndsAt.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        alerts.push({
          eventId: event.id,
          productName: event.productName,
          treatmentType: event.treatmentType,
          appliedAt,
          withdrawalDays: event.withdrawalDays,
          withdrawalEndsAt,
          daysRemaining,
          batchCode: event.batch?.batchCode || null,
          batchId: event.batchId,
          locationName: event.location?.name || null,
          locationId: event.locationId,
        });
      }
    }

    return { success: true, data: alerts };
  } catch {
    return { success: false, error: "Erro ao buscar alertas de carência" };
  }
}

// ============================================================
// MORTALIDADE PROPORCIONAL
// ============================================================

export async function registerMortalityProportional(
  formData: z.infer<typeof mortalitySchema>
): Promise<ActionResult<{ updatedBatches: typeof poultryBatches.$inferSelect[] }>> {
  try {
    const validated = mortalitySchema.parse(formData);
    const quantity = parseInt(validated.quantity, 10);

    if (quantity <= 0) {
      return { success: false, error: "Quantidade deve ser maior que zero" };
    }

    const updatedBatches: typeof poultryBatches.$inferSelect[] = [];

    if (validated.batchId) {
      const batch = await db.query.poultryBatches.findFirst({
        where: eq(poultryBatches.id, validated.batchId),
      });

      if (!batch) {
        return { success: false, error: "Lote não encontrado" };
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

      updatedBatches.push(updatedBatch);
    } else if (validated.locationId) {
      const activePlacements = await db.query.poultryPlacements.findMany({
        where: and(
          eq(poultryPlacements.locationId, validated.locationId),
          isNull(poultryPlacements.endedAt)
        ),
        with: {
          batch: true,
        },
      });

      if (activePlacements.length === 0) {
        return { success: false, error: "Nenhum sublote ativo neste local" };
      }

      const totalBirdsInLocation = activePlacements.reduce(
        (sum, p) => sum + (p.batch?.activeQuantity || 0),
        0
      );

      if (quantity > totalBirdsInLocation) {
        return {
          success: false,
          error: `Quantidade excede o total de aves no local (${totalBirdsInLocation} aves)`,
        };
      }

      let totalDistributed = 0;
      let maxBatchId = 0;
      let maxQuantity = 0;

      const batchLosses: { batchId: number; loss: number }[] = [];

      for (const placement of activePlacements) {
        if (!placement.batch) continue;

        const batchBirds = placement.batch.activeQuantity;
        const proportion = batchBirds / totalBirdsInLocation;
        const loss = Math.floor(quantity * proportion);

        batchLosses.push({ batchId: placement.batchId, loss });
        totalDistributed += loss;

        if (loss > maxQuantity) {
          maxQuantity = loss;
          maxBatchId = placement.batchId;
        }
      }

      const remainder = quantity - totalDistributed;
      if (remainder > 0 && maxBatchId > 0) {
        const maxEntry = batchLosses.find((b) => b.batchId === maxBatchId);
        if (maxEntry) {
          maxEntry.loss += remainder;
        }
      }

      for (const { batchId, loss } of batchLosses) {
        if (loss <= 0) continue;

        const batch = await db.query.poultryBatches.findFirst({
          where: eq(poultryBatches.id, batchId),
        });

        if (!batch) continue;

        const newQuantity = batch.activeQuantity - loss;
        const [updatedBatch] = await db
          .update(poultryBatches)
          .set({ activeQuantity: Math.max(0, newQuantity) })
          .where(eq(poultryBatches.id, batchId))
          .returning();

        updatedBatches.push(updatedBatch);
      }
    } else {
      return { success: false, error: "Especifique um lote ou um local para registrar a mortalidade" };
    }

    await db.insert(fieldActivities).values({
      date: new Date(validated.date),
      category: "aves",
      activityType: "coleta_esterco",
      batchId: validated.batchId || null,
      quantity: validated.quantity,
      notes: validated.notes
        ? `Mortalidade: ${quantity} ave(s) - ${validated.notes}`
        : `Mortalidade: ${quantity} ave(s)`,
    });

    return { success: true, data: { updatedBatches } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao registrar mortalidade" };
  }
}
