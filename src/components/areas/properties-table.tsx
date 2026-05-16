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
import { MapPin, ExternalLink } from "lucide-react";
import type { properties } from "@/db/schema";

type Property = typeof properties.$inferSelect;

interface PropertiesTableProps {
  properties: Property[];
  onViewGlebes: (propertyId: number, propertyName: string) => void;
}

export function PropertiesTable({
  properties: propertiesList,
  onViewGlebes,
}: PropertiesTableProps) {
  if (propertiesList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <MapPin className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhuma propriedade cadastrada
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Clique em &quot;Nova Propriedade&quot; para começar a mapear suas
          áreas.
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
              Área Total
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              Unidade
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
          {propertiesList.map((property) => (
            <TableRow key={property.id} className="hover:bg-gray-50">
              <TableCell className="font-medium text-gray-900">
                {property.name}
              </TableCell>
              <TableCell className="text-gray-600">
                {Number(property.totalArea).toLocaleString("pt-BR")}
              </TableCell>
              <TableCell className="text-gray-600">{property.unit}</TableCell>
              <TableCell className="text-gray-500">
                {new Date(property.createdAt).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewGlebes(property.id, property.name)}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  <ExternalLink className="mr-1 size-4" />
                  Ver Glebas
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
