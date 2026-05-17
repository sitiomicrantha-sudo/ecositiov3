"use client";

import { useState, useEffect, useCallback } from "react";
import { CropForm } from "@/components/campo/crop-form";
import { CropsTable } from "@/components/campo/crops-table";
import { getCropsList } from "@/actions/crop-management";
import { Sprout } from "lucide-react";
import type { crops } from "@/db/schema";

export default function CulturasPage() {
  const [cropsList, setCropsList] = useState<typeof crops.$inferSelect[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getCropsList();
    if (result.success) {
      setCropsList(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeCount = cropsList.filter((c) => c.isActive).length;
  const inactiveCount = cropsList.filter((c) => !c.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Catálogo Botânico
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Cadastre as culturas, seus ciclos e demandas de plantio para alimentar o motor de planejamento do Sítio.
          </p>
        </div>
        <CropForm onSuccess={fetchData} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Culturas Ativas</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Culturas Arquivadas</p>
          <p className="mt-1 text-2xl font-bold text-gray-400">{inactiveCount}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <CropsTable crops={cropsList} onRefresh={fetchData} />
      )}
    </div>
  );
}
