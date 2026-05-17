"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dna, ChevronRight } from "lucide-react";
import type { poultryIndividuals, poultryBatches } from "@/db/schema";

type Individual = typeof poultryIndividuals.$inferSelect;
type Batch = typeof poultryBatches.$inferSelect;

interface PedigreeData {
  individual: Individual & { batch: Batch | null };
  father: Individual | null;
  mother: Individual | null;
  paternalGrandfather: Individual | null;
  paternalGrandmother: Individual | null;
  maternalGrandfather: Individual | null;
  maternalGrandmother: Individual | null;
}

interface PedigreeCardProps {
  pedigree: PedigreeData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const genderIcons: Record<string, string> = {
  macho: "♂",
  femea: "♀",
};

const genderColors: Record<string, string> = {
  macho: "text-blue-600",
  femea: "text-rose-600",
};

function IndividualBadge({ ind }: { ind: Individual | null }) {
  if (!ind) {
    return (
      <span className="text-sm italic text-gray-400">Não registrado</span>
    );
  }

  return (
    <span className="text-sm">
      <span className="font-mono font-medium text-amber-700">{ind.ringId}</span>
      {ind.name && (
        <span className="ml-1 text-gray-600">&quot;{ind.name}&quot;</span>
      )}
      <span className={`ml-1 font-bold ${genderColors[ind.gender]}`}>
        {genderIcons[ind.gender]}
      </span>
    </span>
  );
}

function ParentRow({
  label,
  ind,
  grandparent1,
  grandparent2,
  grandparent1Label,
  grandparent2Label,
}: {
  label: string;
  ind: Individual | null;
  grandparent1: Individual | null;
  grandparent2: Individual | null;
  grandparent1Label: string;
  grandparent2Label: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ChevronRight className="size-4 text-amber-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </span>
      </div>
      <div className="ml-6 space-y-1">
        <div className="rounded-lg bg-amber-50/50 px-3 py-2">
          <IndividualBadge ind={ind} />
        </div>
        {ind && (
          <div className="ml-4 flex flex-col gap-1 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">├─</span>
              <span className="text-gray-500">{grandparent1Label}:</span>
              <IndividualBadge ind={grandparent1} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">└─</span>
              <span className="text-gray-500">{grandparent2Label}:</span>
              <IndividualBadge ind={grandparent2} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PedigreeCard({ pedigree, open, onOpenChange }: PedigreeCardProps) {
  if (!pedigree) return null;

  const { individual } = pedigree;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <Dna className="size-5 text-amber-600" />
            Linhagem Genética
          </DialogTitle>
          <DialogDescription>
            Árvore genealógica do reprodutor selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Indivíduo Principal */}
          <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Reprodutor
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-amber-900">
                  {individual.ringId}
                </p>
                {individual.name && (
                  <p className="text-sm text-amber-700">
                    &quot;{individual.name}&quot;
                  </p>
                )}
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${
                    individual.gender === "macho"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {genderIcons[individual.gender]}{" "}
                  {individual.gender === "macho" ? "Macho" : "Fêmea"}
                </span>
                {individual.batch && (
                  <p className="mt-1 text-xs text-amber-600">
                    Lote: {individual.batch.batchCode}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pai e Avós Paternos */}
          <ParentRow
            label="Lado Paterno"
            ind={pedigree.father}
            grandparent1={pedigree.paternalGrandfather}
            grandparent2={pedigree.paternalGrandmother}
            grandparent1Label="Avô"
            grandparent2Label="Avó"
          />

          {/* Mãe e Avós Maternos */}
          <ParentRow
            label="Lado Materno"
            ind={pedigree.mother}
            grandparent1={pedigree.maternalGrandfather}
            grandparent2={pedigree.maternalGrandmother}
            grandparent1Label="Avô"
            grandparent2Label="Avó"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
