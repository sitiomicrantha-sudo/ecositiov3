"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Egg, Wheat } from "lucide-react";
import type { poultryDailyRecords, poultryLocations } from "@/db/schema";

type DailyRecord = typeof poultryDailyRecords.$inferSelect & {
  location: typeof poultryLocations.$inferSelect | null;
};

interface DailyRecordsTableProps {
  records: DailyRecord[];
}

export function DailyRecordsTable({ records }: DailyRecordsTableProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <ClipboardList className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">Nenhum registro diário</h3>
        <p className="mt-1 text-sm text-gray-500">
          Comece a registrar a produção diária de ovos e consumo de ração.
        </p>
      </div>
    );
  }

  const totalEggs = records.reduce((sum, r) => sum + r.eggsCollected, 0);
  const totalBroken = records.reduce((sum, r) => sum + r.eggsBroken, 0);
  const totalFeed = records.reduce(
    (sum, r) => sum + (r.feedConsumedKg ? parseFloat(r.feedConsumedKg.toString()) : 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3">
          <Egg className="size-5 text-amber-600" />
          <div>
            <p className="text-xs text-amber-600">Total de Ovos</p>
            <p className="text-lg font-bold text-amber-800">{totalEggs}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3">
          <Egg className="size-5 text-red-500" />
          <div>
            <p className="text-xs text-red-600">Trincados/Sujos</p>
            <p className="text-lg font-bold text-red-700">{totalBroken}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3">
          <Wheat className="size-5 text-emerald-600" />
          <div>
            <p className="text-xs text-emerald-600">Ração Total (kg)</p>
            <p className="text-lg font-bold text-emerald-800">{totalFeed.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Data</TableHead>
                <TableHead className="font-semibold text-gray-700">Local</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">
                  Ovos Bons
                </TableHead>
                <TableHead className="hidden text-right font-semibold text-gray-700 sm:table-cell">
                  Trincados
                </TableHead>
                <TableHead className="hidden text-right font-semibold text-gray-700 md:table-cell">
                  Ração (kg)
                </TableHead>
                <TableHead className="hidden font-semibold text-gray-700 lg:table-cell">
                  Observações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">
                    {new Date(record.recordedAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {record.location?.name || "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-amber-700">
                    {record.eggsCollected}
                  </TableCell>
                  <TableCell className="hidden text-right text-red-600 sm:table-cell">
                    {record.eggsBroken}
                  </TableCell>
                  <TableCell className="hidden text-right text-gray-600 md:table-cell">
                    {record.feedConsumedKg ? parseFloat(record.feedConsumedKg.toString()).toFixed(1) : "—"}
                  </TableCell>
                  <TableCell className="hidden max-w-48 truncate text-sm text-gray-500 lg:table-cell">
                    {record.notes || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
