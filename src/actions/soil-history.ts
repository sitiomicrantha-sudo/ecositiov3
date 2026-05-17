"use server";

import { db } from "@/db";
import { beds, plantings, fieldActivities, inventoryItems, fields, glebes } from "@/db/schema";
import { eq, or, desc, and } from "drizzle-orm";
import type { ActionResult } from "./topology";

export type DossierTimelineEntry = {
  id: number;
  date: Date;
  type: "PLANTING" | "ACTIVITY" | "HARVEST";
  itemName: string | null;
  activityType: string | null;
  category: string | null;
  quantity: string | null;
  notes: string | null;
  plantingStatus: string | null;
  harvestedAt: Date | null;
};

export type BedDossier = {
  bed: {
    id: number;
    name: string;
    shortCode: string | null;
    area: string;
    description: string | null;
    fieldName: string | null;
    fieldShortCode: string | null;
    glebeName: string | null;
    glebeShortCode: string | null;
  };
  vitalSigns: {
    activePlantings: {
      itemName: string | null;
      status: string;
      plantedAt: Date;
    }[];
    lastFertilityDate: Date | null;
    daysSinceFertility: number | null;
  };
  timeline: DossierTimelineEntry[];
};

export async function getBedOpacDossier(bedId: number): Promise<ActionResult<BedDossier>> {
  try {
    const bed = await db.query.beds.findFirst({
      where: eq(beds.id, bedId),
      with: {
        field: {
          with: {
            glebe: true,
          },
        },
      },
    });

    if (!bed) {
      return { success: false, error: "Canteiro não encontrado" };
    }

    const allPlantings = await db.query.plantings.findMany({
      where: eq(plantings.bedId, bedId),
      with: {
        item: true,
      },
      orderBy: [desc(plantings.plantedAt)],
    });

    const allActivities = await db.query.fieldActivities.findMany({
      where: and(
        eq(fieldActivities.bedId, bedId),
        or(
          eq(fieldActivities.category, "horta"),
          eq(fieldActivities.category, "bioinsumos"),
          eq(fieldActivities.category, "geral"),
        ),
      ),
      with: {
        item: true,
      },
      orderBy: [desc(fieldActivities.date)],
    });

    const timeline: DossierTimelineEntry[] = [];

    for (const p of allPlantings) {
      timeline.push({
        id: p.id,
        date: p.plantedAt,
        type: "PLANTING",
        itemName: (p.item as { name: string } | null)?.name || null,
        activityType: null,
        category: null,
        quantity: null,
        notes: null,
        plantingStatus: p.status,
        harvestedAt: p.harvestedAt,
      });

      if (p.harvestedAt) {
        timeline.push({
          id: p.id + 100000,
          date: p.harvestedAt,
          type: "HARVEST",
          itemName: (p.item as { name: string } | null)?.name || null,
          activityType: null,
          category: null,
          quantity: null,
          notes: null,
          plantingStatus: p.status,
          harvestedAt: null,
        });
      }
    }

    for (const a of allActivities) {
      timeline.push({
        id: a.id + 200000,
        date: a.date,
        type: "ACTIVITY",
        itemName: null,
        activityType: a.activityType,
        category: a.category,
        quantity: a.quantity,
        notes: a.notes,
        plantingStatus: null,
        harvestedAt: null,
      });
    }

    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

    const activePlantings = allPlantings
      .filter((p) => p.status === "active" || p.status === "permanent")
      .map((p) => ({
        itemName: (p.item as { name: string } | null)?.name || null,
        status: p.status,
        plantedAt: p.plantedAt,
      }));

    const fertilityActivities = allActivities.filter(
      (a) =>
        a.category === "bioinsumos" ||
        a.activityType === "aplicacao_insumo" ||
        a.activityType === "rocagem",
    );

    let lastFertilityDate: Date | null = null;
    let daysSinceFertility: number | null = null;

    if (fertilityActivities.length > 0) {
      const sorted = fertilityActivities.sort(
        (a, b) => b.date.getTime() - a.date.getTime(),
      );
      lastFertilityDate = sorted[0].date;
      const now = new Date();
      const diffMs = now.getTime() - lastFertilityDate.getTime();
      daysSinceFertility = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    return {
      success: true,
      data: {
        bed: {
          id: bed.id,
          name: bed.name,
          shortCode: bed.shortCode,
          area: bed.area,
          description: bed.description,
          fieldName: bed.field?.name || null,
          fieldShortCode: bed.field?.shortCode || null,
          glebeName: bed.field?.glebe?.name || null,
          glebeShortCode: bed.field?.glebe?.shortCode || null,
        },
        vitalSigns: {
          activePlantings,
          lastFertilityDate,
          daysSinceFertility,
        },
        timeline,
      },
    };
  } catch {
    return { success: false, error: "Erro ao buscar dossiê do canteiro" };
  }
}

export async function getActiveBedsForDossier(): Promise<
  ActionResult<
    {
      id: number;
      name: string;
      shortCode: string | null;
      fieldName: string | null;
      fieldShortCode: string | null;
      glebeName: string | null;
      glebeShortCode: string | null;
    }[]
  >
> {
  try {
    const bedsList = await db.query.beds.findMany({
      where: eq(beds.isActive, true),
      with: {
        field: {
          with: {
            glebe: true,
          },
        },
      },
      orderBy: (beds, { asc }) => [asc(beds.name)],
    });

    const result = bedsList.map((b) => ({
      id: b.id,
      name: b.name,
      shortCode: b.shortCode,
      fieldName: b.field?.name || null,
      fieldShortCode: b.field?.shortCode || null,
      glebeName: b.field?.glebe?.name || null,
      glebeShortCode: b.field?.glebe?.shortCode || null,
    }));

    return { success: true, data: result };
  } catch {
    return { success: false, error: "Erro ao buscar canteiros" };
  }
}
