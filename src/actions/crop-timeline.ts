"use server";

import { db } from "@/db";
import { fields, plantings, crops } from "@/db/schema";
import { eq, and, or, gte, lte } from "drizzle-orm";
import type { ActionResult } from "./topology";

const TIMELINE_START = new Date("2026-05-01T00:00:00");
const TIMELINE_END = new Date("2026-12-31T23:59:59");
const TIMELINE_DAYS =
  (TIMELINE_END.getTime() - TIMELINE_START.getTime()) / (1000 * 60 * 60 * 24);

const MONTHS_2026 = [
  { label: "Mai", start: new Date("2026-05-01"), end: new Date("2026-05-31T23:59:59") },
  { label: "Jun", start: new Date("2026-06-01"), end: new Date("2026-06-30T23:59:59") },
  { label: "Jul", start: new Date("2026-07-01"), end: new Date("2026-07-31T23:59:59") },
  { label: "Ago", start: new Date("2026-08-01"), end: new Date("2026-08-31T23:59:59") },
  { label: "Set", start: new Date("2026-09-01"), end: new Date("2026-09-30T23:59:59") },
  { label: "Out", start: new Date("2026-10-01"), end: new Date("2026-10-31T23:59:59") },
  { label: "Nov", start: new Date("2026-11-01"), end: new Date("2026-11-30T23:59:59") },
  { label: "Dez", start: new Date("2026-12-01"), end: new Date("2026-12-31T23:59:59") },
];

export type TimelineEvent = {
  id: number;
  cropName: string;
  cropCycleType: string;
  startDate: Date;
  endDate: Date;
  status: "active" | "planned" | "recent";
  notes: string | null;
  leftPercent: number;
  widthPercent: number;
};

export type FieldTimelineRow = {
  fieldId: number;
  fieldName: string;
  fieldShortCode: string | null;
  events: TimelineEvent[];
};

function clampDate(date: Date, min: Date, max: Date): Date {
  if (date < min) return new Date(min);
  if (date > max) return new Date(max);
  return new Date(date);
}

function calculateEventPosition(
  startDate: Date,
  endDate: Date,
  timelineStart: Date,
  timelineEnd: Date
): { leftPercent: number; widthPercent: number } {
  const clampedStart = clampDate(startDate, timelineStart, timelineEnd);
  const clampedEnd = clampDate(endDate, timelineStart, timelineEnd);

  const startOffset =
    (clampedStart.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
  const duration =
    (clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60 * 60 * 24);

  const leftPercent = (startOffset / TIMELINE_DAYS) * 100;
  const widthPercent = Math.max((duration / TIMELINE_DAYS) * 100, 0.5);

  return { leftPercent, widthPercent };
}

export async function getFieldsTimelineData(): Promise<ActionResult<FieldTimelineRow[]>> {
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const activeFields = await db.query.fields.findMany({
      where: eq(fields.isActive, true),
      orderBy: (fields, { asc }) => [asc(fields.name)],
    });

    const allPlantings = await db.query.plantings.findMany({
      where: or(
        eq(plantings.status, "active"),
        eq(plantings.status, "planned"),
        and(
          eq(plantings.status, "harvested"),
          gte(plantings.harvestedAt, sixtyDaysAgo)
        )
      ),
      with: {
        crop: true,
        field: true,
      },
    });

    const fieldMap = new Map<number, FieldTimelineRow>();

    for (const field of activeFields) {
      fieldMap.set(field.id, {
        fieldId: field.id,
        fieldName: field.name,
        fieldShortCode: field.shortCode,
        events: [],
      });
    }

    for (const planting of allPlantings) {
      const fieldId = planting.fieldId;
      if (!fieldId) continue;

      const fieldRow = fieldMap.get(fieldId);
      if (!fieldRow) continue;

      const cropData = planting.crop as {
        name: string;
        cycleType: string;
        averageCycleDays: number;
      } | null;

      if (!cropData) continue;

      const startDate = planting.plantedAt || planting.createdAt;
      let endDate: Date;

      let status: "active" | "planned" | "recent";

      if (planting.status === "harvested" && planting.harvestedAt) {
        endDate = planting.harvestedAt;
        status = "recent";
      } else if (planting.status === "planned") {
        const cycleDays = cropData.averageCycleDays;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + cycleDays);
        status = "planned";
      } else {
        const cycleDays = cropData.averageCycleDays;
        endDate = planting.expectedHarvestAt || new Date(startDate);
        if (!planting.expectedHarvestAt) {
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + cycleDays);
        }
        status = "active";
      }

      const eventEndClamped = clampDate(endDate, TIMELINE_START, TIMELINE_END);
      const eventStartClamped = clampDate(startDate, TIMELINE_START, TIMELINE_END);

      if (eventStartClamped > TIMELINE_END || eventEndClamped < TIMELINE_START) {
        continue;
      }

      const { leftPercent, widthPercent } = calculateEventPosition(
        startDate,
        endDate,
        TIMELINE_START,
        TIMELINE_END
      );

      fieldRow.events.push({
        id: planting.id,
        cropName: cropData.name,
        cropCycleType: cropData.cycleType,
        startDate,
        endDate,
        status,
        notes: planting.notes,
        leftPercent,
        widthPercent,
      });
    }

    const result = Array.from(fieldMap.values()).filter(
      (row) => row.events.length > 0
    );

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching timeline data:", error);
    return { success: false, error: "Erro ao buscar dados do cronograma" };
  }
}

export { MONTHS_2026, TIMELINE_START, TIMELINE_END, TIMELINE_DAYS };
