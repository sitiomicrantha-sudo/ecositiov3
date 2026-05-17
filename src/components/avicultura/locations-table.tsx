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
import { MapPin, Edit, Trash2, RotateCcw } from "lucide-react";
import type { poultryLocations } from "@/db/schema";
import {
  locationTypeLabels,
  locationStatusLabels,
  locationStatusColors,
  locationTypeColors,
  getSanitaryVoidStatus,
  SANITARY_VOID_MIN_DAYS,
} from "@/lib/poultry-utils";

type Location = typeof poultryLocations.$inferSelect;

interface LocationsTableProps {
  locations: Location[];
  onEdit: (location: Location) => void;
  onToggleActive: (location: Location) => void;
}

export function LocationsTable({ locations, onEdit, onToggleActive }: LocationsTableProps) {
  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <MapPin className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">Nenhum local cadastrado</h3>
        <p className="mt-1 text-sm text-gray-500">
          Clique em &quot;Novo Local&quot; para adicionar um galpão, piquete ou pinteiro.
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
                Código
              </TableHead>
              <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
              <TableHead className="hidden font-semibold text-gray-700 md:table-cell">
                Área (m²)
              </TableHead>
              <TableHead className="hidden font-semibold text-gray-700 lg:table-cell">
                Capacidade
              </TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="hidden font-semibold text-gray-700 lg:table-cell">
                Vazio Sanitário
              </TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((loc) => {
              const sanitaryStatus =
                loc.status === "vazio_sanitario" && loc.sanitaryVoidStart
                  ? getSanitaryVoidStatus(loc.sanitaryVoidStart)
                  : null;

              return (
                <TableRow
                  key={loc.id}
                  className={`hover:bg-gray-50 ${!loc.isActive ? "opacity-60" : ""}`}
                >
                  <TableCell className="font-medium text-gray-900">{loc.name}</TableCell>
                  <TableCell className="hidden font-mono text-sm text-gray-500 sm:table-cell">
                    {loc.shortCode || "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${locationTypeColors[loc.locationType] || "bg-gray-100 text-gray-800"}`}
                    >
                      {locationTypeLabels[loc.locationType] || loc.locationType}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-gray-600 md:table-cell">
                    {loc.areaM2 ? `${loc.areaM2}` : "—"}
                  </TableCell>
                  <TableCell className="hidden text-gray-600 lg:table-cell">
                    {loc.capacity ? `${loc.capacity} aves` : "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${locationStatusColors[loc.status] || "bg-gray-100 text-gray-800"}`}
                    >
                      {locationStatusLabels[loc.status] || loc.status}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-sm lg:table-cell">
                    {sanitaryStatus ? (
                      <div className="space-y-1">
                        <span
                          className={`text-xs font-medium ${sanitaryStatus.isComplete ? "text-green-700" : "text-amber-700"}`}
                        >
                          {sanitaryStatus.daysElapsed}/{SANITARY_VOID_MIN_DAYS} dias
                        </span>
                        {!sanitaryStatus.isComplete && (
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-amber-200">
                            <div
                              className="h-full rounded-full bg-amber-500 transition-all"
                              style={{ width: `${sanitaryStatus.progressPercent}%` }}
                            />
                          </div>
                        )}
                        {sanitaryStatus.isComplete && (
                          <span className="text-xs text-green-600">✓ Completo</span>
                        )}
                      </div>
                    ) : loc.status === "vazio_sanitario" ? (
                      <span className="text-xs text-gray-400">Sem data</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(loc)}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-emerald-700"
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleActive(loc)}
                        className={`h-8 w-8 p-0 ${loc.isActive ? "text-gray-500 hover:text-red-700" : "text-gray-500 hover:text-green-700"}`}
                      >
                        {loc.isActive ? (
                          <Trash2 className="size-4" />
                        ) : (
                          <RotateCcw className="size-4" />
                        )}
                      </Button>
                    </div>
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
