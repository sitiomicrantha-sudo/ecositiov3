"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPoultryLocations,
  getPoultryPlacements,
} from "@/actions/poultry";
import { getWithdrawalAlertsForLocation } from "@/actions/poultry-operations";
import { PlacementCard } from "@/components/avicultura/placement-card";
import { MovementForm } from "@/components/avicultura/movement-form";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { ArrowRightLeft, Loader2, Bird } from "lucide-react";
import { toast } from "sonner";
import type { poultryLocations, poultryPlacements, poultryBatches } from "@/db/schema";
import type { WithdrawalAlert } from "@/actions/poultry-operations";

type Location = typeof poultryLocations.$inferSelect;
type Placement = typeof poultryPlacements.$inferSelect & {
  location: Location | null;
  batch: typeof poultryBatches.$inferSelect | null;
};

export default function AlojamentosPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingPlacement, setMovingPlacement] = useState<Placement | null>(null);
  const [movementOpen, setMovementOpen] = useState(false);
  const [withdrawalAlerts, setWithdrawalAlerts] = useState<Record<number, WithdrawalAlert[]>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [locationsResult, placementsResult] = await Promise.all([
        getPoultryLocations(),
        getPoultryPlacements(),
      ]);

      if (locationsResult.success) {
        setLocations(locationsResult.data);
      } else {
        toast.error(locationsResult.error);
      }

      if (placementsResult.success) {
        setPlacements(placementsResult.data);
      } else {
        toast.error(placementsResult.error);
      }
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    async function loadAlerts() {
      const alertsMap: Record<number, WithdrawalAlert[]> = {};
      for (const loc of locations) {
        if (!loc.isActive) continue;
        const result = await getWithdrawalAlertsForLocation(loc.id);
        if (result.success && result.data.length > 0) {
          alertsMap[loc.id] = result.data;
        }
      }
      setWithdrawalAlerts(alertsMap);
    }
    if (locations.length > 0) {
      loadAlerts();
    }
  }, [locations]);

  function handleMove(placement: Placement) {
    setMovingPlacement(placement);
    setMovementOpen(true);
  }

  function handleMovementSuccess() {
    setMovementOpen(false);
    setMovingPlacement(null);
    fetchData();
  }

  const activeLocations = locations.filter((loc) => loc.isActive);

  function getActivePlacementsForLocation(locationId: number): Placement[] {
    return placements.filter(
      (p) => p.locationId === locationId && !p.endedAt
    );
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Avicultura", href: "/avicultura" },
          { label: "Alojamentos" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
            <ArrowRightLeft className="size-6 text-emerald-600" />
            Painel de Alojamentos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Visualize e gerencie a alocação dos sublotes nos galpões, piquetes e pinteiros.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : activeLocations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
          <Bird className="mb-4 size-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">
            Nenhum local ativo cadastrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Cadastre galpões, piquetes ou pinteiros em{" "}
            <a href="/avicultura/locais" className="font-medium text-emerald-600 hover:underline">
              Locais Físicos
            </a>{" "}
            para começar a alojar aves.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeLocations.map((loc) => (
            <PlacementCard
              key={loc.id}
              location={loc}
              activePlacements={getActivePlacementsForLocation(loc.id)}
              withdrawalAlerts={withdrawalAlerts[loc.id] || []}
              onMove={handleMove}
            />
          ))}
        </div>
      )}

      <MovementForm
        placement={movingPlacement}
        open={movementOpen}
        onOpenChange={setMovementOpen}
        onSuccess={handleMovementSuccess}
      />
    </div>
  );
}
