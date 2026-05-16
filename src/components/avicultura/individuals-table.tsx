"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Bird, Dna } from "lucide-react";
import type { poultryIndividuals } from "@/db/schema";

type Individual = typeof poultryIndividuals.$inferSelect & {
  batchName: string | null;
};

interface IndividualsTableProps {
  individuals: Individual[];
  onViewPedigree: (individual: Individual) => void;
}

const genderLabels: Record<string, string> = {
  macho: "Macho",
  femea: "Fêmea",
};

const genderColors: Record<string, string> = {
  macho: "bg-blue-100 text-blue-800",
  femea: "bg-rose-100 text-rose-800",
};

const genderIcons: Record<string, string> = {
  macho: "♂",
  femea: "♀",
};

const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  descartado: "Descartado",
  morto: "Morto",
};

const statusColors: Record<string, string> = {
  ativo: "bg-green-100 text-green-800",
  descartado: "bg-gray-100 text-gray-600",
  morto: "bg-red-100 text-red-800",
};

export function IndividualsTable({ individuals, onViewPedigree }: IndividualsTableProps) {
  if (individuals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <Dna className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhum reprodutor cadastrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Clique em &quot;Cadastrar Matriz/Galo&quot; para adicionar aves de elite.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Anilha</TableHead>
              <TableHead className="hidden font-semibold text-gray-700 sm:table-cell">
                Nome
              </TableHead>
              <TableHead className="font-semibold text-gray-700">Gênero</TableHead>
              <TableHead className="hidden font-semibold text-gray-700 md:table-cell">
                Lote
              </TableHead>
              <TableHead className="hidden font-semibold text-gray-700 lg:table-cell">
                Status
              </TableHead>
              <TableHead className="text-right font-semibold text-gray-700">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {individuals.map((ind) => (
              <TableRow key={ind.id} className="hover:bg-gray-50">
                <TableCell className="font-mono font-medium text-amber-700">
                  {ind.ringId}
                </TableCell>
                <TableCell className="hidden text-gray-600 sm:table-cell">
                  {ind.name || "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${genderColors[ind.gender]}`}
                  >
                    <span>{genderIcons[ind.gender]}</span>
                    {genderLabels[ind.gender]}
                  </span>
                </TableCell>
                <TableCell className="hidden text-gray-500 md:table-cell">
                  {ind.batchName || "—"}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[ind.status]}`}
                  >
                    {statusLabels[ind.status]}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewPedigree(ind)}
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  >
                    <Dna className="mr-1 size-4" />
                    <span className="hidden sm:inline">Pedigree</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
