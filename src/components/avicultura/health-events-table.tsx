"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pill, Leaf, Shield, AlertTriangle } from "lucide-react";
import type { poultryHealthEvents, poultryBatches, poultryLocations } from "@/db/schema";

type HealthEvent = typeof poultryHealthEvents.$inferSelect & {
  batch: typeof poultryBatches.$inferSelect | null;
  location: typeof poultryLocations.$inferSelect | null;
};

interface HealthEventsTableProps {
  events: HealthEvent[];
}

const treatmentLabels: Record<string, string> = {
  fitoterapico_floral: "Fitoterápico/Floral",
  vacina_profilatica: "Vacina Profilática",
  alopatico_comercial: "Alopático Comercial",
};

const treatmentColors: Record<string, string> = {
  fitoterapico_floral: "bg-green-100 text-green-800",
  vacina_profilatica: "bg-blue-100 text-blue-800",
  alopatico_comercial: "bg-red-100 text-red-800",
};

const treatmentIcons: Record<string, React.ReactNode> = {
  fitoterapico_floral: <Leaf className="size-3.5" />,
  vacina_profilatica: <Shield className="size-3.5" />,
  alopatico_comercial: <Pill className="size-3.5" />,
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR");
}

function getWithdrawalStatus(event: HealthEvent): {
  isInWithdrawal: boolean;
  daysRemaining: number;
  withdrawalEndsAt: Date;
} {
  if (event.treatmentType !== "alopatico_comercial" || event.withdrawalDays <= 0) {
    return { isInWithdrawal: false, daysRemaining: 0, withdrawalEndsAt: new Date() };
  }

  const appliedAt = new Date(event.appliedAt);
  const withdrawalEndsAt = new Date(appliedAt);
  withdrawalEndsAt.setDate(withdrawalEndsAt.getDate() + event.withdrawalDays);

  const now = new Date();
  const isInWithdrawal = now < withdrawalEndsAt;
  const diffMs = withdrawalEndsAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return { isInWithdrawal, daysRemaining, withdrawalEndsAt };
}

export function HealthEventsTable({ events }: HealthEventsTableProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <Pill className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">Nenhum evento de saúde</h3>
        <p className="mt-1 text-sm text-gray-500">
          Registre tratamentos, vacinas e aplicações no prontuário sanitário.
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
              <TableHead className="font-semibold text-gray-700">Data</TableHead>
              <TableHead className="font-semibold text-gray-700">Escopo</TableHead>
              <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
              <TableHead className="font-semibold text-gray-700">Produto</TableHead>
              <TableHead className="hidden font-semibold text-gray-700 lg:table-cell">
                Carência
              </TableHead>
              <TableHead className="hidden font-semibold text-gray-700 xl:table-cell">
                Observações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const withdrawal = getWithdrawalStatus(event);

              return (
                <TableRow
                  key={event.id}
                  className={`hover:bg-gray-50 ${
                    withdrawal.isInWithdrawal ? "bg-red-50/30" : ""
                  }`}
                >
                  <TableCell className="font-medium text-gray-900">
                    {formatDate(event.appliedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {event.batch ? (
                      <span className="font-mono text-xs">{event.batch.batchCode}</span>
                    ) : event.location ? (
                      <span>{event.location.name}</span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${treatmentColors[event.treatmentType] || "bg-gray-100 text-gray-800"}`}
                    >
                      {treatmentIcons[event.treatmentType]}
                      {treatmentLabels[event.treatmentType]}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {event.productName}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {event.treatmentType === "alopatico_comercial" && event.withdrawalDays > 0 ? (
                      withdrawal.isInWithdrawal ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-700 animate-pulse">
                          <AlertTriangle className="size-3 animate-pulse" />
                          {withdrawal.daysRemaining} dias restantes
                        </span>
                      ) : (
                        <span className="text-xs text-green-700">
                          ✓ Liberado ({event.withdrawalDays}d)
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-green-600">Sem carência</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden max-w-48 truncate text-sm text-gray-500 xl:table-cell">
                    {event.notes || "—"}
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
