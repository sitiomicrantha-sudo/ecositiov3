"use client";

import { useState, useEffect, useCallback } from "react";
import { Bird, Egg, TrendingUp, Wheat, AlertTriangle } from "lucide-react";
import { getPoultryDashboardStats, type PoultryDashboardStats } from "@/actions/poultry-analytics";
import { getActiveWithdrawalAlerts } from "@/actions/poultry-operations";
import { getActivePoultryLocations } from "@/actions/poultry";
import { KpiCard } from "@/components/avicultura/kpi-card";
import { EggProductionChart } from "@/components/avicultura/egg-production-chart";
import { FeedConsumptionChart } from "@/components/avicultura/feed-consumption-chart";
import { ActiveAlertsPanel } from "@/components/avicultura/active-alerts-panel";
import type { WithdrawalAlert } from "@/actions/poultry-operations";
import type { poultryLocations } from "@/db/schema";
import { toast } from "sonner";

export default function AviculturaDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PoultryDashboardStats | null>(null);
  const [withdrawalAlerts, setWithdrawalAlerts] = useState<WithdrawalAlert[]>([]);
  const [sanitaryVoidLocations, setSanitaryVoidLocations] = useState<
    { name: string; shortCode: string | null; sanitaryVoidStart: Date | string | null }[]
  >([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsResult, alertsResult, locationsResult] = await Promise.all([
        getPoultryDashboardStats(30),
        getActiveWithdrawalAlerts(),
        getActivePoultryLocations(),
      ]);

      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        toast.error(statsResult.error);
      }

      if (alertsResult.success) {
        setWithdrawalAlerts(alertsResult.data);
      }

      if (locationsResult.success) {
        const voidLocs = locationsResult.data
          .filter((loc: typeof poultryLocations.$inferSelect) => loc.status === "vazio_sanitario")
          .map((loc: typeof poultryLocations.$inferSelect) => ({
            name: loc.name,
            shortCode: loc.shortCode,
            sanitaryVoidStart: loc.sanitaryVoidStart,
          }));
        setSanitaryVoidLocations(voidLocs);
      }
    } catch {
      toast.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  const layingRateBadge =
    stats.avgLayingRate !== null
      ? stats.avgLayingRate >= 80
        ? { text: "Excelente", color: "green" as const }
        : stats.avgLayingRate >= 65
          ? { text: "Bom", color: "amber" as const }
          : { text: "Alerta Sanidade", color: "red" as const }
      : undefined;

  const eggVariationText =
    stats.eggVariation > 0
      ? `+${stats.eggVariation}% vs ontem`
      : stats.eggVariation < 0
        ? `${stats.eggVariation}% vs ontem`
        : "Sem variação";

  const eggVariationColor =
    stats.eggVariation > 0 ? "green" : stats.eggVariation < 0 ? "red" : "gray";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
          <Bird className="size-7 text-amber-600" />
          Visão Geral — Avicultura
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Painel de inteligência zootécnica e controle analítico do plantel.
        </p>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Plantel Ativo */}
        <KpiCard
          icon={Bird}
          iconColor="amber"
          title="Plantel Ativo"
          value={stats.totalBirds.toString()}
          subtitle={
            [
              stats.birdsByPurpose.postura > 0 && `${stats.birdsByPurpose.postura} poedeiras`,
              stats.birdsByPurpose.corte > 0 && `${stats.birdsByPurpose.corte} cortes`,
              stats.birdsByPurpose.misto > 0 && `${stats.birdsByPurpose.misto} misto`,
            ]
              .filter(Boolean)
              .join(" · ") || "Sem aves ativas"
          }
          badge={{ text: `${stats.totalBirds} aves`, color: "amber" }}
        />

        {/* Card 2: Produção de Hoje */}
        <KpiCard
          icon={Egg}
          iconColor="emerald"
          title="Produção de Hoje"
          value={stats.todayEggs.toString()}
          subtitle={`${stats.totalEggsCollected} ovos no período`}
          badge={{ text: eggVariationText, color: eggVariationColor }}
        />

        {/* Card 3: Eficiência de Postura */}
        <KpiCard
          icon={TrendingUp}
          iconColor={stats.avgLayingRate !== null ? (stats.avgLayingRate >= 80 ? "green" : stats.avgLayingRate >= 65 ? "amber" : "red") : "gray"}
          title="Eficiência de Postura"
          value={stats.avgLayingRate !== null ? `${stats.avgLayingRate}%` : "N/A"}
          subtitle={
            stats.avgLayingRate !== null
              ? `Taxa média: ${stats.avgLayingRate}% ovos/ave/dia`
              : "Sem poedeiras no plantel"
          }
          badge={layingRateBadge}
        />

        {/* Card 4: Consumo de Cocho */}
        <KpiCard
          icon={Wheat}
          iconColor="blue"
          title="Consumo de Cocho"
          value={stats.avgFeedPerBirdPerDay > 0 ? `${stats.avgFeedPerBirdPerDay}g` : "—"}
          subtitle={
            stats.dailyFeedAverage > 0
              ? `${stats.dailyFeedAverage.toFixed(1)} kg/dia no total`
              : "Sem registros de ração"
          }
          infoText={
            stats.totalFeedKg > 0
              ? `${stats.totalFeedKg.toFixed(1)} kg consumidos no período`
              : undefined
          }
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EggProductionChart data={stats.dailyEggData} />
        <FeedConsumptionChart data={stats.dailyFeedData} />
      </div>

      {/* Row 3: Alerts */}
      <ActiveAlertsPanel
        withdrawalAlerts={withdrawalAlerts}
        sanitaryVoidLocations={sanitaryVoidLocations}
      />

      {/* Mortality Info */}
      {stats.totalInitial > 0 && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600" />
            <h3 className="text-base font-semibold text-gray-900">Mortalidade Acumulada</h3>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Plantel Inicial</p>
              <p className="text-lg font-bold text-gray-900">{stats.totalInitial}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Perdas Totais</p>
              <p className="text-lg font-bold text-red-600">{stats.totalDeaths}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Taxa de Mortalidade</p>
              <p className={`text-lg font-bold ${stats.mortalityRate > 10 ? "text-red-600" : "text-green-700"}`}>
                {stats.mortalityRate}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
