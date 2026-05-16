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
import { MapPin, ArrowRight } from "lucide-react";
import type { glebes } from "@/db/schema";

type Glebe = typeof glebes.$inferSelect;

interface GlebesTableProps {
  glebesList: Glebe[];
}

export function GlebesTable({ glebesList }: GlebesTableProps) {
  if (glebesList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <MapPin className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhuma gleba cadastrada
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Clique em &quot;Nova Gleba&quot; para dividir esta propriedade em
          glebas.
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
            <TableHead className="text-right font-semibold text-gray-700">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {glebesList.map((glebe) => (
            <TableRow key={glebe.id} className="hover:bg-gray-50">
              <TableCell className="font-medium text-gray-900">
                {glebe.name}
              </TableCell>
              <TableCell className="text-gray-600">
                {Number(glebe.area).toLocaleString("pt-BR")}
              </TableCell>
              <TableCell className="max-w-xs truncate text-gray-500">
                {glebe.description || "—"}
              </TableCell>
              <TableCell className="text-gray-500">
                {new Date(glebe.createdAt).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    (window.location.href = `/areas/glebes/${glebe.id}`)
                  }
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  Ver Talhões
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
