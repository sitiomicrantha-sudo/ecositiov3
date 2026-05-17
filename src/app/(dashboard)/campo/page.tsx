"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BedsOverview } from "@/components/campo/beds-overview";
import { VegetalActivityButtons } from "@/components/campo/activity-buttons";
import { ActivityForm } from "@/components/campo/activity-form";
import { ActivityTimeline } from "@/components/campo/activity-timeline";
import {
  getBedsWithPlantingStatus,
  getVegetalActivities,
} from "@/actions/field-activities";
import { UnifiedPlantingForm } from "@/components/campo/unified-planting-form";

interface BedStatus {
  id: number;
  name: string;
  hasActivePlanting: boolean;
  plantingStatus: string | null;
  plantingItemName: string | null;
}

interface Activity {
  id: number;
  date: Date;
  category: "horta" | "aves" | "bioinsumos" | "geral";
  activityType:
    | "plantio"
    | "colheita"
    | "coleta_ovos"
    | "limpeza_aviario"
    | "coleta_esterco"
    | "aplicacao_insumo"
    | "rocagem"
    | "alimentacao_racao"
    | "manejo_ambiencia"
    | "movimentacao_piquete";
  bedId: number | null;
  itemId: number | null;
  batchId: number | null;
  quantity: string | null;
  notes: string | null;
  bedName: string | null;
  bedShortCode: string | null;
  itemName: string | null;
  batchName: string | null;
}

export default function CampoPage() {
  const [beds, setBeds] = useState<BedStatus[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [plantingFormOpen, setPlantingFormOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [bedsResult, activitiesResult] = await Promise.all([
      getBedsWithPlantingStatus(),
      getVegetalActivities(),
    ]);

    if (bedsResult.success) {
      setBeds(bedsResult.data);
    }

    if (activitiesResult.success) {
      setActivities(activitiesResult.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSelectActivity(activityType: string) {
    setSelectedActivity(activityType);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Caderno de Campo
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Registre plantios, colheitas e manejo vegetal do sítio.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <BedsOverview beds={beds} />

          <Tabs defaultValue="register" className="w-full">
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="register" className="flex-1 sm:flex-none">
                Registrar Atividade
              </TabsTrigger>
              <TabsTrigger value="diary" className="flex-1 sm:flex-none">
                Diário de Bordo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="register" className="mt-6">
              <div className="space-y-4">
                <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Plantio / Planejamento</h3>
                      <p className="text-sm text-gray-500">
                        Registre um plantio imediato ou planeje uma safra futura.
                      </p>
                    </div>
                    <button
                      onClick={() => setPlantingFormOpen(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
                    >
                      Novo Plantio
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
                  <VegetalActivityButtons onSelectActivity={handleSelectActivity} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="diary" className="mt-6">
              <ActivityTimeline activities={activities} />
            </TabsContent>
          </Tabs>
        </>
      )}

      <ActivityForm
        activityType={selectedActivity}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchData}
      />

      <UnifiedPlantingForm
        open={plantingFormOpen}
        onOpenChange={setPlantingFormOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}
