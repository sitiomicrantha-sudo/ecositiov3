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
import { Bird, ArrowLeftRight } from "lucide-react";
import type { poultryBatches } from "@/db/schema";

type Batch = typeof poultryBatches.$inferSelect;

interface BatchesTableProps {
  batches: Batch[];
  onMortality: (batch: Batch) => void;
}

const purposeLabels: Record<string, string> = {
  postura: "Postura",
  corte: "Corte",
  misto: "Misto",
};

const purposeColors: Record<string, string> = {
  postura: "bg-green-100 text-green-800",
  corte: "bg-amber-100 text-amber-800",
  misto: "bg-blue-100 text-blue-800",
};

function calculateAgeWeeks(birthDate: string): number {
  const now = new Date();
  const diff = now.getTime() - new Date(birthDate).getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

export function BatchesTable({ batches, onMortality }: BatchesTableProps) {
  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <Bird className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhum lote cadastrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Clique em &quot;Novo Lote&quot; para adicionar um lote ao plantel.
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
              <TableHead className="font-semibold text-gray-700">Nome</TableHead>
              <TableHead className="hidden font-semibold text-gray-700 sm:table-cell">
                Raça
              </TableHead>
              <TableHead className="font-semibold text-gray-700">Propósito</TableHead>
              <TableHead className="hidden font-semibold text-gray-700 md:table-cell">
                Idade
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">
                Qtd Atual
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
            {batches.map((batch) => {
              const ageWeeks = calculateAgeWeeks(batch.birthDate);
              const isLow = batch.activeQuantity < batch.initialQuantity;

              return (
                <TableRow key={batch.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">
                    {batch.batchCode}
                  </TableCell>
                  <TableCell className="hidden text-gray-600 sm:table-cell">
                    {batch.breed}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${purposeColors[batch.purpose] || "bg-gray-100 text-gray-800"}`}
                    >
                      {purposeLabels[batch.purpose] || batch.purpose}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-gray-500 md:table-cell">
                    {ageWeeks} sem
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${isLow ? "text-red-600" : "text-green-700"}`}
                  >
                    {batch.activeQuantity}
                    <span className="text-xs font-normal text-gray-400">
                      /{batch.initialQuantity}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-gray-500 lg:table-cell">
                    <span className="text-sm">
                      {batch.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMortality(batch)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <ArrowLeftRight className="mr-1 size-4" />
                      <span className="hidden lg:inline">Mortalidade</span>
                      <span className="lg:hidden">+/-</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
