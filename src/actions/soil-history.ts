"use server";

import { db } from "@/db";
import { beds, plantings, fieldActivities, inventoryItems, fields, glebes, poultryLocations, poultryPlacements, poultryHealthEvents, poultryBatches } from "@/db/schema";
import { eq, or, desc, and, isNull } from "drizzle-orm";
import type { ActionResult } from "./topology";

export type DossierTimelineEntry = {
  id: number;
  date: Date;
  type: "PLANTING" | "ACTIVITY" | "HARVEST" | "POULTRY_PLACEMENT" | "POULTRY_HEALTH";
  itemName: string | null;
  activityType: string | null;
  category: string | null;
  quantity: string | null;
  notes: string | null;
  plantingStatus: string | null;
  harvestedAt: Date | null;
  withdrawalActive: boolean | null;
  treatmentType: string | null;
  batchCode: string | null;
  locationName: string | null;
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
        harvestedAt: null,
        withdrawalActive: null,
        treatmentType: null,
        batchCode: null,
        locationName: null,
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
          withdrawalActive: null,
          treatmentType: null,
          batchCode: null,
          locationName: null,
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
        withdrawalActive: null,
        treatmentType: null,
        batchCode: null,
        locationName: null,
      });
    }

    const fieldId = bed.fieldId;
    if (fieldId) {
      const poultryLocation = await db.query.poultryLocations.findFirst({
        where: eq(poultryLocations.associatedFieldId, fieldId),
      });

      if (poultryLocation) {
        const placements = await db.query.poultryPlacements.findMany({
          where: eq(poultryPlacements.locationId, poultryLocation.id),
          with: {
            batch: true,
          },
          orderBy: [desc(poultryPlacements.startedAt)],
        });

        for (const placement of placements) {
          timeline.push({
            id: placement.id + 300000,
            date: placement.startedAt,
            type: "POULTRY_PLACEMENT",
            itemName: null,
            activityType: null,
            category: null,
            quantity: null,
            notes: placement.endedAt ? "Alojamento encerrado" : null,
            plantingStatus: null,
            harvestedAt: null,
            withdrawalActive: null,
            treatmentType: null,
            batchCode: (placement.batch as { batchCode: string } | null)?.batchCode || null,
            locationName: poultryLocation.name,
          });

          if (placement.endedAt) {
            timeline.push({
              id: placement.id + 400000,
              date: placement.endedAt,
              type: "POULTRY_PLACEMENT",
              itemName: null,
              activityType: null,
              category: null,
              quantity: null,
              notes: "Lote removido do local",
              plantingStatus: null,
              harvestedAt: null,
              withdrawalActive: null,
              treatmentType: null,
              batchCode: (placement.batch as { batchCode: string } | null)?.batchCode || null,
              locationName: poultryLocation.name,
            });
          }
        }

        const healthEvents = await db.query.poultryHealthEvents.findMany({
          where: eq(poultryHealthEvents.locationId, poultryLocation.id),
          with: {
            batch: true,
          },
          orderBy: [desc(poultryHealthEvents.appliedAt)],
        });

        const now = new Date();
        for (const event of healthEvents) {
          const withdrawalEnd = new Date(event.appliedAt);
          withdrawalEnd.setDate(withdrawalEnd.getDate() + (event.withdrawalDays || 0));
          const isActiveWithdrawal = event.withdrawalDays > 0 && withdrawalEnd > now;

          timeline.push({
            id: event.id + 500000,
            date: event.appliedAt,
            type: "POULTRY_HEALTH",
            itemName: event.productName,
            activityType: null,
            category: null,
            quantity: null,
            notes: event.notes,
            plantingStatus: null,
            harvestedAt: null,
            withdrawalActive: isActiveWithdrawal,
            treatmentType: event.treatmentType,
            batchCode: (event.batch as { batchCode: string } | null)?.batchCode || null,
            locationName: poultryLocation.name,
          });
        }
      }
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

export type PoultryFieldHistory = {
  poultryLocation: {
    id: number;
    name: string;
    shortCode: string | null;
    locationType: string;
  };
  recentPlantings: {
    id: number;
    itemName: string | null;
    plantedAt: Date;
    harvestedAt: Date | null;
    status: string;
    bedName: string | null;
    bedShortCode: string | null;
  }[];
  recentActivities: {
    id: number;
    activityType: string | null;
    category: string | null;
    date: Date;
    quantity: string | null;
    notes: string | null;
    bedName: string | null;
  }[];
};

export async function getPoultryFieldHistory(
  poultryLocationId: number
): Promise<ActionResult<PoultryFieldHistory>> {
  try {
    const poultryLocation = await db.query.poultryLocations.findFirst({
      where: eq(poultryLocations.id, poultryLocationId),
    });

    if (!poultryLocation) {
      return { success: false, error: "Local de avicultura não encontrado" };
    }

    if (!poultryLocation.associatedFieldId) {
      return {
        success: true,
        data: {
          poultryLocation: {
            id: poultryLocation.id,
            name: poultryLocation.name,
            shortCode: poultryLocation.shortCode,
            locationType: poultryLocation.locationType,
          },
          recentPlantings: [],
          recentActivities: [],
        },
      };
    }

    const fieldId = poultryLocation.associatedFieldId;

    const bedsInField = await db.query.beds.findMany({
      where: eq(beds.fieldId, fieldId),
    });

    const bedIds = bedsInField.map((b) => b.id);

    let recentPlantings: {
      id: number;
      itemName: string | null;
      plantedAt: Date;
      harvestedAt: Date | null;
      status: string;
      bedName: string | null;
      bedShortCode: string | null;
    }[] = [];

    let recentActivities: {
      id: number;
      activityType: string | null;
      category: string | null;
      date: Date;
      quantity: string | null;
      notes: string | null;
      bedName: string | null;
    }[] = [];

    if (bedIds.length > 0) {
      const plantingsInField = await db.query.plantings.findMany({
        where: (plantings, { inArray }) => inArray(plantings.bedId, bedIds),
        with: {
          item: true,
          bed: true,
        },
        orderBy: [desc(plantings.plantedAt)],
        limit: 10,
      });

      recentPlantings = plantingsInField.map((p) => ({
        id: p.id,
        itemName: (p.item as { name: string } | null)?.name || null,
        plantedAt: p.plantedAt,
        harvestedAt: p.harvestedAt,
        status: p.status,
        bedName: (p.bed as { name: string } | null)?.name || null,
        bedShortCode: (p.bed as { shortCode: string } | null)?.shortCode || null,
      }));

      const activitiesInField = await db.query.fieldActivities.findMany({
        where: (fieldActivities, { inArray }) => inArray(fieldActivities.bedId, bedIds),
        orderBy: [desc(fieldActivities.date)],
        limit: 10,
      });

      recentActivities = activitiesInField.map((a) => ({
        id: a.id,
        activityType: a.activityType,
        category: a.category,
        date: a.date,
        quantity: a.quantity,
        notes: a.notes,
        bedName: bedsInField.find((b) => b.id === a.bedId)?.name || null,
      }));
    }

    return {
      success: true,
      data: {
        poultryLocation: {
          id: poultryLocation.id,
          name: poultryLocation.name,
          shortCode: poultryLocation.shortCode,
          locationType: poultryLocation.locationType,
        },
        recentPlantings,
        recentActivities,
      },
    };
  } catch {
    return { success: false, error: "Erro ao buscar histórico do talhão" };
  }
}
