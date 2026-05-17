"use server";

import { db } from "@/db";
import {
  poultryBatches,
  poultryDailyRecords,
  poultryPlacements,
  poultryLocations,
} from "@/db/schema";
import { eq, and, gte, lte, sql, isNull } from "drizzle-orm";
import type { ActionResult } from "./topology";

export interface DailyEggData {
  date: string;
  good: number;
  broken: number;
}

export interface DailyFeedData {
  date: string;
  locationName: string;
  kg: number;
}

export interface PoultryDashboardStats {
  totalBirds: number;
  birdsByPurpose: {
    postura: number;
    corte: number;
    misto: number;
  };
  totalEggsCollected: number;
  totalEggsBroken: number;
  lossPercentage: number;
  avgLayingRate: number | null;
  totalFeedKg: number;
  avgFeedPerBirdPerDay: number;
  dailyFeedAverage: number;
  mortalityRate: number;
  totalDeaths: number;
  totalInitial: number;
  dailyEggData: DailyEggData[];
  dailyFeedData: DailyFeedData[];
  todayEggs: number;
  yesterdayEggs: number;
  eggVariation: number;
}

export async function getPoultryDashboardStats(
  days: number = 30
): Promise<ActionResult<PoultryDashboardStats>> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // 1. População Atual por Propósito
    const activeBatches = await db.query.poultryBatches.findMany({
      where: eq(poultryBatches.isActive, true),
    });

    let posturaCount = 0;
    let corteCount = 0;
    let mistoCount = 0;

    for (const batch of activeBatches) {
      if (batch.purpose === "postura") posturaCount += batch.activeQuantity;
      else if (batch.purpose === "corte") corteCount += batch.activeQuantity;
      else if (batch.purpose === "misto") mistoCount += batch.activeQuantity;
    }

    const totalBirds = posturaCount + corteCount + mistoCount;

    // 2. Produção de Ovos Acumulada
    const eggRecords = await db.query.poultryDailyRecords.findMany({
      where: and(
        gte(poultryDailyRecords.recordedAt, startDate.toISOString().split("T")[0]),
        lte(poultryDailyRecords.recordedAt, todayStr)
      ),
    });

    let totalEggsCollected = 0;
    let totalEggsBroken = 0;
    let todayEggs = 0;
    let yesterdayEggs = 0;

    for (const record of eggRecords) {
      totalEggsCollected += record.eggsCollected;
      totalEggsBroken += record.eggsBroken;
      if (record.recordedAt === todayStr) todayEggs += record.eggsCollected;
      if (record.recordedAt === yesterdayStr) yesterdayEggs += record.eggsCollected;
    }

    const totalEggs = totalEggsCollected + totalEggsBroken;
    const lossPercentage = totalEggs > 0 ? (totalEggsBroken / totalEggs) * 100 : 0;
    const eggVariation =
      yesterdayEggs > 0
        ? ((todayEggs - yesterdayEggs) / yesterdayEggs) * 100
        : todayEggs > 0
          ? 100
          : 0;

    // 3. Taxa de Postura Média
    const posturaLocations = await db.query.poultryLocations.findMany({
      where: and(
        eq(poultryLocations.isActive, true),
        eq(poultryLocations.status, "liberado")
      ),
    });

    let totalLayingRate = 0;
    let layingRateCount = 0;

    for (const loc of posturaLocations) {
      const areaM2 = loc.areaM2 ? parseFloat(loc.areaM2.toString()) : 0;
      if (areaM2 <= 0) continue;

      const activePlacements = await db.query.poultryPlacements.findMany({
        where: and(
          eq(poultryPlacements.locationId, loc.id),
          isNull(poultryPlacements.endedAt)
        ),
        with: { batch: true },
      });

      const posturaBirdsInLocation = activePlacements.reduce((sum, p) => {
        if (p.batch?.purpose === "postura") {
          return sum + (p.batch.activeQuantity || 0);
        }
        return sum;
      }, 0);

      if (posturaBirdsInLocation <= 0) continue;

      const locRecords = eggRecords.filter((r) => r.locationId === loc.id);
      for (const record of locRecords) {
        const dailyRate = (record.eggsCollected / posturaBirdsInLocation) * 100;
        if (dailyRate <= 100) {
          totalLayingRate += dailyRate;
          layingRateCount++;
        }
      }
    }

    const avgLayingRate =
      posturaCount > 0 && layingRateCount > 0
        ? totalLayingRate / layingRateCount
        : null;

    // 4. Consumo de Ração
    let totalFeedKg = 0;
    const daysWithRecords = new Set<string>();

    for (const record of eggRecords) {
      if (record.feedConsumedKg) {
        totalFeedKg += parseFloat(record.feedConsumedKg.toString());
        daysWithRecords.add(record.recordedAt);
      }
    }

    const daysWithFeed = daysWithRecords.size;
    const avgFeedPerBirdPerDay =
      totalBirds > 0 && daysWithFeed > 0
        ? (totalFeedKg * 1000) / (totalBirds * daysWithFeed)
        : 0;
    const dailyFeedAverage = daysWithFeed > 0 ? totalFeedKg / daysWithFeed : 0;

    // 5. Mortalidade
    let totalInitial = 0;
    let totalActive = 0;

    for (const batch of activeBatches) {
      totalInitial += batch.initialQuantity;
      totalActive += batch.activeQuantity;
    }

    const totalDeaths = totalInitial - totalActive;
    const mortalityRate = totalInitial > 0 ? (totalDeaths / totalInitial) * 100 : 0;

    // 6. Dados para gráficos (15 dias fixos)
    const chartDays = 15;
    const chartEndDate = new Date();
    const chartStartDate = new Date();
    chartStartDate.setDate(chartStartDate.getDate() - chartDays + 1);

    const allDays: string[] = [];
    for (let i = 0; i < chartDays; i++) {
      const d = new Date(chartStartDate);
      d.setDate(d.getDate() + i);
      allDays.push(d.toISOString().split("T")[0]);
    }

    // Egg data: group by date
    const eggByDate = new Map<string, { good: number; broken: number }>();
    for (const record of eggRecords) {
      if (allDays.includes(record.recordedAt)) {
        const existing = eggByDate.get(record.recordedAt) || { good: 0, broken: 0 };
        existing.good += record.eggsCollected;
        existing.broken += record.eggsBroken;
        eggByDate.set(record.recordedAt, existing);
      }
    }

    const dailyEggData: DailyEggData[] = allDays.map((date) => {
      const data = eggByDate.get(date) || { good: 0, broken: 0 };
      return { date, good: data.good, broken: data.broken };
    });

    // Feed data: group by date + location
    const feedRecords = await db.query.poultryDailyRecords.findMany({
      where: and(
        gte(poultryDailyRecords.recordedAt, chartStartDate.toISOString().split("T")[0]),
        lte(poultryDailyRecords.recordedAt, todayStr)
      ),
      with: { location: true },
    });

    const feedByDateLocation = new Map<string, Map<number, number>>();
    for (const record of feedRecords) {
      if (record.feedConsumedKg && allDays.includes(record.recordedAt)) {
        if (!feedByDateLocation.has(record.recordedAt)) {
          feedByDateLocation.set(record.recordedAt, new Map());
        }
        const locMap = feedByDateLocation.get(record.recordedAt)!;
        const current = locMap.get(record.locationId) || 0;
        locMap.set(record.locationId, current + parseFloat(record.feedConsumedKg.toString()));
      }
    }

    // Build feed data with all locations for each day
    const locationNames = new Map<number, string>();
    for (const record of feedRecords) {
      if (record.location) {
        locationNames.set(record.location.id, record.location.name);
      }
    }

    const dailyFeedData: DailyFeedData[] = [];
    for (const date of allDays) {
      const locMap = feedByDateLocation.get(date);
      if (locMap) {
        for (const [locId, kg] of locMap) {
          dailyFeedData.push({
            date,
            locationName: locationNames.get(locId) || `Local ${locId}`,
            kg: parseFloat(kg.toFixed(2)),
          });
        }
      }
    }

    // If no feed data, add placeholder entries for each day
    if (dailyFeedData.length === 0) {
      dailyFeedData.push({ date: allDays[0] || todayStr, locationName: "Sem dados", kg: 0 });
    }

    return {
      success: true,
      data: {
        totalBirds,
        birdsByPurpose: {
          postura: posturaCount,
          corte: corteCount,
          misto: mistoCount,
        },
        totalEggsCollected,
        totalEggsBroken,
        lossPercentage: parseFloat(lossPercentage.toFixed(1)),
        avgLayingRate: avgLayingRate ? parseFloat(avgLayingRate.toFixed(1)) : null,
        totalFeedKg: parseFloat(totalFeedKg.toFixed(2)),
        avgFeedPerBirdPerDay: parseFloat(avgFeedPerBirdPerDay.toFixed(1)),
        dailyFeedAverage: parseFloat(dailyFeedAverage.toFixed(2)),
        mortalityRate: parseFloat(mortalityRate.toFixed(1)),
        totalDeaths,
        totalInitial,
        dailyEggData,
        dailyFeedData,
        todayEggs,
        yesterdayEggs,
        eggVariation: parseFloat(eggVariation.toFixed(1)),
      },
    };
  } catch {
    return { success: false, error: "Erro ao calcular estatísticas" };
  }
}
