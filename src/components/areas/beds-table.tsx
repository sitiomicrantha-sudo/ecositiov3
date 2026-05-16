"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin } from "lucide-react";
import type { beds } from "@/db/schema";

type Bed = typeof beds.$inferSelect;

interface BedsTableProps {
  bedsList: Bed[];
}

export function BedsTable({ bedsList }: BedsTableProps) {
  if (bedsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <MapPin className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhum canteiro cadastrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Clique em &quot;Novo Canteiro&quot; para criar a unidade mínima de
          controle.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold text-gray-700">Nome</TableHead>
            <TableHead className="font-semibold text-gray-700">
              Área (m²)
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              Descrição
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              Criado em
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bedsList.map((bed) => (
            <TableRow key={bed.id} className="hover:bg-gray-50">
              <TableCell className="font-medium text-gray-900">
                {bed.name}
              </TableCell>
              <TableCell className="text-gray-600">
                {Number(bed.area).toLocaleString("pt-BR")}
              </TableCell>
              <TableCell className="max-w-xs truncate text-gray-500">
                {bed.description || "—"}
              </TableCell>
              <TableCell className="text-gray-500">
                {new Date(bed.createdAt).toLocaleDateString("pt-BR")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
