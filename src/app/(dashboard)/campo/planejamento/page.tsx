"use client";

import { useState, useEffect, useCallback } from "react";
import { getFieldsTimelineData } from "@/actions/crop-timeline";
import { FieldGanttChart } from "@/components/campo/field-gantt-chart";
import { UnifiedPlantingForm } from "@/components/campo/unified-planting-form";
import { Calendar, Sprout } from "lucide-react";
import type { FieldTimelineRow } from "@/actions/crop-timeline";

export default function PlanejamentoPage() {
  const [rows, setRows] = useState<FieldTimelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [plantingFormOpen, setPlantingFormOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getFieldsTimelineData();
    if (result.success) {
      setRows(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Cronograma de Safras 2026
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Visualize os cultivos ativos, planejamentos futuros e colheitas recentes por talhão.
          </p>
        </div>
        <button
          onClick={() => setPlantingFormOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <Sprout className="size-4" />
          Planejar Novo Cultivo
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <FieldGanttChart rows={rows} />
      )}

      <UnifiedPlantingForm
        open={plantingFormOpen}
        onOpenChange={setPlantingFormOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}
