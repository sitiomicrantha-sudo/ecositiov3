"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ArrowRightLeft, Info, AlertTriangle } from "lucide-react";
import { movePoultryPlacement, getActivePoultryLocations } from "@/actions/poultry";
import type { poultryPlacements, poultryBatches, poultryLocations } from "@/db/schema";
import {
  getDensityStatus,
  calculateDensity,
  locationTypeLabels,
  locationStatusLabels,
} from "@/lib/poultry-utils";

type Placement = typeof poultryPlacements.$inferSelect & {
  location: typeof poultryLocations.$inferSelect | null;
  batch: typeof poultryBatches.$inferSelect | null;
};

type Location = typeof poultryLocations.$inferSelect;

interface MovementFormProps {
  placement: Placement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MovementForm({ placement, open, onOpenChange, onSuccess }: MovementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedDestination(null);
      loadLocations();
    }
  }, [open]);

  async function loadLocations() {
    setLoadingLocations(true);
    try {
      const result = await getActivePoultryLocations();
      if (result.success) {
        setLocations(result.data);
      }
    } catch {
      toast.error("Erro ao carregar locais");
    } finally {
      setLoadingLocations(false);
    }
  }

  const availableDestinations = useMemo(() => {
    if (!placement) return [];
    return locations.filter(
      (loc) =>
        loc.id !== placement.locationId &&
        loc.isActive &&
        loc.status !== "vazio_sanitario"
    );
  }, [locations, placement]);

  const sanitaryVoidLocations = useMemo(() => {
    return locations.filter((loc) => loc.status === "vazio_sanitario");
  }, [locations]);

  const destinationLocation = locations.find((loc) => loc.id === selectedDestination);

  const projectedDensity = useMemo(() => {
    if (!destinationLocation || !placement?.batch) return null;

    const areaM2 = destinationLocation.areaM2
      ? parseFloat(destinationLocation.areaM2.toString())
      : 0;
    if (areaM2 <= 0) return null;

    const currentBirdsInDest = 0;
    const batchBirds = placement.batch.activeQuantity;
    const totalBirds = currentBirdsInDest + batchBirds;

    const purposes = placement.batch.purpose ? [placement.batch.purpose] : ["postura"];
    return getDensityStatus(
      destinationLocation.locationType,
      purposes,
      totalBirds,
      areaM2
    );
  }, [destinationLocation, placement]);

  async function handleMove() {
    if (!placement || !selectedDestination) return;

    setIsSubmitting(true);
    try {
      const result = await movePoultryPlacement(placement.id, selectedDestination);

      if (result.success) {
        toast.success("Aves movimentadas com sucesso!");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao movimentar aves");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!placement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-900">
            <ArrowRightLeft className="size-5" />
            Movimentar Aves
          </DialogTitle>
          <DialogDescription>
            Transfira o sublote para outro local. O alojamento atual será encerrado
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Current Location Info */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Origem</p>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {placement.location?.name || "Local não identificado"}
              </p>
              <p className="text-sm text-gray-500">
                {placement.batch?.batchCode} • {placement.batch?.activeQuantity} aves
              </p>
            </div>
            <span className="text-xs text-gray-400">
              {placement.location?.locationType
                ? locationTypeLabels[placement.location.locationType]
                : ""}
            </span>
          </div>
        </div>

        {/* Destination Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Destino</label>

          {loadingLocations ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
          ) : availableDestinations.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mb-1 size-4" />
              <p className="font-medium">Nenhum local disponível para destino</p>
              <p className="text-xs">
                Todos os locais estão ocupados, desativados ou em vazio sanitário.
              </p>
            </div>
          ) : (
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedDestination || ""}
              onChange={(e) => setSelectedDestination(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Selecione o local de destino...</option>
              {availableDestinations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({locationTypeLabels[loc.locationType]}) -{" "}
                  {loc.areaM2 ? `${loc.areaM2} m²` : "sem área"}
                </option>
              ))}
            </select>
          )}

          {/* Sanitary Void Locations - Disabled */}
          {sanitaryVoidLocations.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Locais indisponíveis (Vazio Sanitário):</p>
              {sanitaryVoidLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm text-amber-700"
                >
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span className="font-medium">{loc.name}</span>
                  <span className="text-xs text-amber-600">
                    — em descanso do solo ({locationStatusLabels[loc.status]})
                  </span>
                </div>
              ))}
              <div className="flex items-start gap-1.5 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <p>
                  Locais em vazio sanitário precisam de no mínimo 15 dias de descanso para
                  eliminação de patógenos do solo (Embrapa).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Projected Density */}
        {projectedDensity && destinationLocation && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              projectedDensity.level === "critical"
                ? "border-red-200 bg-red-50 text-red-800"
                : projectedDensity.level === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <div className="flex items-start gap-2">
              {projectedDensity.level === "ok" ? (
                <Info className="mt-0.5 size-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              )}
              <div>
                <p className="font-medium">Densidade projetada no destino</p>
                <p className="mt-1">{projectedDensity.message}</p>
                {projectedDensity.guideline && (
                  <p className="mt-1 text-xs opacity-80">
                    Referência: {projectedDensity.guideline.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="pt-4">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selectedDestination || isSubmitting}
            onClick={handleMove}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white ring-offset-background transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Movimentando...
              </>
            ) : (
              <>
                <ArrowRightLeft className="mr-2 size-4" />
                Confirmar Movimentação
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
