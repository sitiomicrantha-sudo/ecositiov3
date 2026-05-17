"use client";

import { AlertTriangle, Clock, MapPin } from "lucide-react";
import type { WithdrawalAlert } from "@/actions/poultry-operations";
import { getSanitaryVoidStatus, SANITARY_VOID_MIN_DAYS } from "@/lib/poultry-utils";

interface ActiveAlertsPanelProps {
  withdrawalAlerts: WithdrawalAlert[];
  sanitaryVoidLocations: { name: string; shortCode: string | null; sanitaryVoidStart: Date | string | null }[];
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR");
}

export function ActiveAlertsPanel({ withdrawalAlerts, sanitaryVoidLocations }: ActiveAlertsPanelProps) {
  const hasAlerts = withdrawalAlerts.length > 0 || sanitaryVoidLocations.length > 0;

  if (!hasAlerts) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Alertas Ativos</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="mb-2 size-8 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">Nenhum alerta ativo</p>
          <p className="mt-1 text-xs text-gray-400">
            Todos os locais estão operando normalmente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">Alertas Ativos</h3>
      <div className="space-y-3">
        {/* Withdrawal Alerts */}
        {withdrawalAlerts.map((alert) => (
          <div
            key={alert.eventId}
            className="flex items-start gap-3 rounded-lg border-2 border-red-300 bg-red-50 p-4 animate-pulse"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-200 animate-pulse">
              <AlertTriangle className="size-4 text-red-700" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-bold text-red-900">
                ⚠️ PRODUTO EM CARÊNCIA
              </p>
              <p className="text-sm font-medium text-red-800">{alert.productName}</p>
              <p className="text-xs text-red-700">
                Ovos/Carne impróprios para venda até{" "}
                <strong>{formatDate(alert.withdrawalEndsAt)}</strong>
              </p>
              <p className="text-xs text-red-600">
                Faltam {alert.daysRemaining} dias para liberação
              </p>
              {alert.batchCode && (
                <p className="text-xs text-red-600">
                  Lote: <span className="font-mono">{alert.batchCode}</span>
                </p>
              )}
              {alert.locationName && (
                <p className="text-xs text-red-600">
                  Local: {alert.locationName}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Sanitary Void Locations */}
        {sanitaryVoidLocations.map((loc, i) => {
          const status = loc.sanitaryVoidStart
            ? getSanitaryVoidStatus(loc.sanitaryVoidStart)
            : null;

          return (
            <div
              key={`sv-${i}`}
              className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-200">
                <MapPin className="size-4 text-amber-700" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-amber-900">
                  Vazio Sanitário — {loc.name}
                  {loc.shortCode && (
                    <span className="ml-1 font-mono text-xs text-amber-600">
                      ({loc.shortCode})
                    </span>
                  )}
                </p>
                {status ? (
                  <>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-amber-700">
                        {status.daysElapsed} de {SANITARY_VOID_MIN_DAYS} dias
                      </span>
                      <span className="font-medium text-amber-800">
                        {status.isComplete
                          ? "✓ Completo"
                          : `Faltam ${status.daysRemaining} dias`}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-amber-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          status.isComplete ? "bg-green-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${status.progressPercent}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-amber-600">
                    Data de início não definida
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
