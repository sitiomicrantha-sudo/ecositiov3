"use client";

import { Button } from "@/components/ui/button";
import { ArrowRightLeft, AlertTriangle, CheckCircle2, Clock, ThermometerSun } from "lucide-react";
import type { poultryLocations, poultryPlacements, poultryBatches } from "@/db/schema";
import type { WithdrawalAlert } from "@/actions/poultry-operations";
import {
  getDensityStatus,
  getSanitaryVoidStatus,
  calculateDensity,
  locationTypeLabels,
  locationStatusLabels,
  locationStatusColors,
  locationTypeColors,
  SANITARY_VOID_MIN_DAYS,
} from "@/lib/poultry-utils";

type Location = typeof poultryLocations.$inferSelect;
type Placement = typeof poultryPlacements.$inferSelect & {
  location: Location | null;
  batch: typeof poultryBatches.$inferSelect | null;
};

interface PlacementCardProps {
  location: Location;
  activePlacements: Placement[];
  withdrawalAlerts: WithdrawalAlert[];
  onMove: (placement: Placement) => void;
}

const purposeLabels: Record<string, string> = {
  postura: "Postura",
  corte: "Corte",
  misto: "Misto",
};

function calculateDaysSince(date: Date | string): number {
  const d = new Date(date);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

export function PlacementCard({ location, activePlacements, withdrawalAlerts, onMove }: PlacementCardProps) {
  const totalBirds = activePlacements.reduce(
    (sum, p) => sum + (p.batch?.activeQuantity || 0),
    0
  );

  const areaM2 = location.areaM2 ? parseFloat(location.areaM2.toString()) : 0;

  const purposes = [
    ...new Set(
      activePlacements.map((p) => p.batch?.purpose).filter(Boolean)
    ),
  ] as string[];

  const densityStatus = getDensityStatus(
    location.locationType,
    purposes.length > 0 ? purposes : ["postura"],
    totalBirds,
    areaM2
  );

  const density = calculateDensity(totalBirds, areaM2);
  const capacityPercent =
    location.capacity && location.capacity > 0
      ? Math.min(100, (totalBirds / location.capacity) * 100)
      : 0;

  const sanitaryStatus =
    location.status === "vazio_sanitario" && location.sanitaryVoidStart
      ? getSanitaryVoidStatus(location.sanitaryVoidStart)
      : null;

  const densityBarColor =
    densityStatus.level === "critical"
      ? "bg-red-500"
      : densityStatus.level === "warning"
        ? "bg-amber-500"
        : "bg-emerald-500";

  const isPinteiro = location.locationType === "pinteiro";

  return (
    <div
      className={`overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md ${
        location.status === "vazio_sanitario"
          ? "border-amber-300 bg-amber-50/30"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* Header */}
      <div className="border-b bg-gray-50/50 px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">{location.name}</h3>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${locationTypeColors[location.locationType] || "bg-gray-100 text-gray-800"}`}
              >
                {locationTypeLabels[location.locationType]}
              </span>
            </div>
            {location.shortCode && (
              <p className="mt-0.5 font-mono text-xs text-gray-500">{location.shortCode}</p>
            )}
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${locationStatusColors[location.status] || "bg-gray-100 text-gray-800"}`}
          >
            {locationStatusLabels[location.status]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {/* Withdrawal Alerts */}
        {withdrawalAlerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {withdrawalAlerts.map((alert) => (
              <div
                key={alert.eventId}
                className="flex items-center gap-2 rounded-md border-2 border-red-300 bg-red-50 px-3 py-2 animate-pulse"
              >
                <AlertTriangle className="size-4 shrink-0 text-red-600 animate-pulse" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-red-800">
                    ⚠️ EM CARÊNCIA — {alert.productName}
                  </p>
                  <p className="text-xs text-red-600">
                    Ovos/Carne impróprios até {new Date(alert.withdrawalEndsAt).toLocaleDateString("pt-BR")} ({alert.daysRemaining}d)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {location.status === "vazio_sanitario" ? (
          /* Vazio Sanitário View */
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-700">
              <Clock className="size-5" />
              <span className="font-medium">Período de descanso do solo</span>
            </div>

            {sanitaryStatus ? (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-gray-600">
                    {sanitaryStatus.daysElapsed} de {SANITARY_VOID_MIN_DAYS} dias
                  </span>
                  <span className="font-medium text-amber-700">
                    {sanitaryStatus.isComplete
                      ? "✓ Completo"
                      : `Faltam ${sanitaryStatus.daysRemaining} dias`}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-amber-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      sanitaryStatus.isComplete ? "bg-green-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${sanitaryStatus.progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {sanitaryStatus.message}
                  {!sanitaryStatus.isComplete && (
                    <span>
                      {" "}
                      (mínimo {SANITARY_VOID_MIN_DAYS} dias, recomendado até{" "}
                      {SANITARY_VOID_MIN_DAYS + 6} dias)
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="mb-1 size-4" />
                <p className="font-medium">Data de início não definida</p>
                <p className="text-xs">
                  Defina a data de início do vazio sanitário para acompanhar o progresso.
                </p>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-white px-3 py-2">
                <p className="text-xs text-gray-500">Área</p>
                <p className="font-medium text-gray-900">
                  {location.areaM2 ? `${location.areaM2} m²` : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2">
                <p className="text-xs text-gray-500">Capacidade</p>
                <p className="font-medium text-gray-900">
                  {location.capacity ? `${location.capacity} aves` : "—"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Normal View */
          <div className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Área</p>
                <p className="font-medium text-gray-900">
                  {location.areaM2 ? `${location.areaM2} m²` : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Capacidade</p>
                <p className="font-medium text-gray-900">
                  {location.capacity ? `${location.capacity} aves` : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Sublotes</p>
                <p className="font-medium text-gray-900">{activePlacements.length}</p>
              </div>
            </div>

            {/* Batch List */}
            {activePlacements.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Sublotes alojados
                </p>
                {activePlacements.map((p) => {
                  const batch = p.batch;
                  if (!batch) return null;
                  const daysInLocation = calculateDaysSince(p.startedAt);

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {batch.batchCode}
                          </span>
                          <span className="text-xs text-gray-500">({batch.breed})</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                          <span>{purposeLabels[batch.purpose]}</span>
                          <span>•</span>
                          <span>{batch.activeQuantity} aves</span>
                          {isPinteiro && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-orange-600">
                                <ThermometerSun className="size-3" />
                                {daysInLocation} dias no pinteiro
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMove(p)}
                        className="h-7 px-2 text-xs text-gray-500 hover:text-emerald-700"
                      >
                        <ArrowRightLeft className="mr-1 size-3" />
                        Mover
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm italic text-gray-400">Nenhum sublote alojado</p>
            )}

            {/* Density Indicator */}
            {totalBirds > 0 && areaM2 > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Total: <strong>{totalBirds} aves</strong> | Densidade:{" "}
                    <strong>{density.birdsPerM2.toFixed(1)} aves/m²</strong>
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all ${densityBarColor}`}
                    style={{ width: `${Math.min(100, capacityPercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{capacityPercent.toFixed(0)}% da capacidade</span>
                  {densityStatus.level === "ok" && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="size-3" />
                      {densityStatus.message}
                    </span>
                  )}
                  {densityStatus.level === "warning" && (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-700">
                      <AlertTriangle className="size-3" />
                      {densityStatus.message}
                    </span>
                  )}
                  {densityStatus.level === "critical" && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-700">
                      <AlertTriangle className="size-3" />
                      {densityStatus.message}
                    </span>
                  )}
                </div>

                {densityStatus.guideline && (
                  <p className="text-xs text-gray-400">
                    Referência: {densityStatus.guideline.description}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
