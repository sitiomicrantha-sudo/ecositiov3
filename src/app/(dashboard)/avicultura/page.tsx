"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { BatchesTable } from "@/components/avicultura/batches-table";
import { BatchForm } from "@/components/avicultura/batch-form";
import { IndividualsTable } from "@/components/avicultura/individuals-table";
import { IndividualForm } from "@/components/avicultura/individual-form";
import { PedigreeCard } from "@/components/avicultura/pedigree-card";
import { MortalityForm } from "@/components/avicultura/mortality-form";
import { AvesActivityButtons } from "@/components/campo/activity-buttons";
import { ActivityTimeline } from "@/components/campo/activity-timeline";
import { ActivityForm } from "@/components/campo/activity-form";
import { getPoultryBatches, getPoultryIndividuals, getPedigree } from "@/actions/poultry";
import { getAvesActivities } from "@/actions/field-activities";
import type { poultryBatches, poultryIndividuals } from "@/db/schema";

type Batch = typeof poultryBatches.$inferSelect;
type Individual = {
  id: number;
  ringId: string;
  name: string | null;
  gender: "macho" | "femea";
  fatherId: number | null;
  motherId: number | null;
  batchId: number | null;
  status: "ativo" | "descartado" | "morto";
  createdAt: Date;
  batchName: string | null;
};

interface PedigreeData {
  individual: {
    id: number;
    ringId: string;
    name: string | null;
    gender: "macho" | "femea";
    fatherId: number | null;
    motherId: number | null;
    batchId: number | null;
    status: "ativo" | "descartado" | "morto";
    createdAt: Date;
    batch: {
      id: number;
      name: string;
      breed: string;
      purpose: "postura" | "corte" | "dupla_aptidao" | "matriz_genetica";
      initialQuantity: number;
      currentQuantity: number;
      hatchDate: Date;
      status: "active" | "retired" | "sold";
      createdAt: Date;
    } | null;
  };
  father: { id: number; ringId: string; name: string | null; gender: "macho" | "femea"; status: "ativo" | "descartado" | "morto"; fatherId: number | null; motherId: number | null; batchId: number | null; createdAt: Date } | null;
  mother: { id: number; ringId: string; name: string | null; gender: "macho" | "femea"; status: "ativo" | "descartado" | "morto"; fatherId: number | null; motherId: number | null; batchId: number | null; createdAt: Date } | null;
  paternalGrandfather: { id: number; ringId: string; name: string | null; gender: "macho" | "femea"; status: "ativo" | "descartado" | "morto"; fatherId: number | null; motherId: number | null; batchId: number | null; createdAt: Date } | null;
  paternalGrandmother: { id: number; ringId: string; name: string | null; gender: "macho" | "femea"; status: "ativo" | "descartado" | "morto"; fatherId: number | null; motherId: number | null; batchId: number | null; createdAt: Date } | null;
  maternalGrandfather: { id: number; ringId: string; name: string | null; gender: "macho" | "femea"; status: "ativo" | "descartado" | "morto"; fatherId: number | null; motherId: number | null; batchId: number | null; createdAt: Date } | null;
  maternalGrandmother: { id: number; ringId: string; name: string | null; gender: "macho" | "femea"; status: "ativo" | "descartado" | "morto"; fatherId: number | null; motherId: number | null; batchId: number | null; createdAt: Date } | null;
}

interface AvesActivity {
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

export default function AviculturaPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [avesActivities, setAvesActivities] = useState<AvesActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [mortalityOpen, setMortalityOpen] = useState(false);
  const [selectedIndividual, setSelectedIndividual] = useState<Individual | null>(null);
  const [pedigreeData, setPedigreeData] = useState<PedigreeData | null>(null);
  const [pedigreeOpen, setPedigreeOpen] = useState(false);
  const [pedigreeLoading, setPedigreeLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [activityFormOpen, setActivityFormOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [batchesResult, individualsResult, activitiesResult] = await Promise.all([
      getPoultryBatches(),
      getPoultryIndividuals(),
      getAvesActivities(),
    ]);

    if (batchesResult.success) {
      setBatches(batchesResult.data);
    }

    if (individualsResult.success) {
      setIndividuals(individualsResult.data);
    }

    if (activitiesResult.success) {
      setAvesActivities(activitiesResult.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleMortality(batch: Batch) {
    setSelectedBatch(batch);
    setMortalityOpen(true);
  }

  async function handleViewPedigree(individual: Individual) {
    setSelectedIndividual(individual);
    setPedigreeOpen(true);
    setPedigreeLoading(true);

    const result = await getPedigree(individual.id as number);

    if (result.success) {
      setPedigreeData(result.data);
    } else {
      setPedigreeData(null);
    }

    setPedigreeLoading(false);
  }

  function handleSelectActivity(activityType: string) {
    setSelectedActivity(activityType);
    setActivityFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Avicultura & Genética
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie lotes do plantel comercial e o registro genealógico de reprodutores.
          </p>
        </div>
      </div>

      {/* Botões de Manejo das Aves — fixos no topo */}
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
        <AvesActivityButtons onSelectActivity={handleSelectActivity} />
      </div>

      <Tabs defaultValue="batches" className="w-full">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="batches" className="flex-1 sm:flex-none">
            Lotes do Plantel
          </TabsTrigger>
          <TabsTrigger value="individuals" className="flex-1 sm:flex-none">
            Reprodutores (Pedigree)
          </TabsTrigger>
          <TabsTrigger value="diary" className="flex-1 sm:flex-none">
            Diário de Manejo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="mt-6">
          <div className="mb-4">
            <BatchForm onSuccess={fetchData} />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            </div>
          ) : (
            <BatchesTable batches={batches} onMortality={handleMortality} />
          )}
        </TabsContent>

        <TabsContent value="individuals" className="mt-6">
          <div className="mb-4">
            <IndividualForm onSuccess={fetchData} />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
            </div>
          ) : (
            <IndividualsTable
              individuals={individuals}
              onViewPedigree={handleViewPedigree}
            />
          )}
        </TabsContent>

        <TabsContent value="diary" className="mt-6">
          <ActivityTimeline activities={avesActivities} />
        </TabsContent>
      </Tabs>

      <MortalityForm
        batch={selectedBatch}
        open={mortalityOpen}
        onOpenChange={setMortalityOpen}
        onSuccess={fetchData}
      />

      <Dialog open={pedigreeOpen} onOpenChange={setPedigreeOpen}>
        {pedigreeLoading ? (
          <DialogContent>
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
            </div>
          </DialogContent>
        ) : (
          <PedigreeCard
            pedigree={pedigreeData}
            open={pedigreeOpen}
            onOpenChange={setPedigreeOpen}
          />
        )}
      </Dialog>

      <ActivityForm
        activityType={selectedActivity}
        open={activityFormOpen}
        onOpenChange={setActivityFormOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}
