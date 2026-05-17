"use client";

import { AlertTriangle, Clock } from "lucide-react";
import type { WithdrawalAlert } from "@/actions/poultry-operations";

interface WithdrawalAlertProps {
  alert: WithdrawalAlert;
  compact?: boolean;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR");
}

export function WithdrawalAlertCard({ alert, compact }: WithdrawalAlertProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-md border-2 border-red-300 bg-red-50 px-3 py-2 animate-pulse">
        <AlertTriangle className="size-4 shrink-0 text-red-600 animate-pulse" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-red-800 truncate">
            EM CARÊNCIA — {alert.productName}
          </p>
          <p className="text-xs text-red-600">
            Liberação: {formatDate(alert.withdrawalEndsAt)} ({alert.daysRemaining} dias)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-200 animate-pulse">
          <AlertTriangle className="size-5 text-red-700" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-red-900">
              ⚠️ PRODUTO EM CARÊNCIA
            </p>
          </div>
          <p className="text-sm font-medium text-red-800">
            {alert.productName}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-red-700">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              Aplicado em: {formatDate(alert.appliedAt)}
            </span>
            <span>Carência: {alert.withdrawalDays} dias</span>
            <span className="font-bold">
              Liberação: {formatDate(alert.withdrawalEndsAt)}
            </span>
          </div>
          <p className="text-sm font-semibold text-red-800">
            🚫 Ovos/Carne impróprios para venda até {formatDate(alert.withdrawalEndsAt)}
          </p>
          <p className="text-xs text-red-600">
            Faltam <strong>{alert.daysRemaining} dias</strong> para liberação
          </p>
          {alert.batchCode && (
            <p className="text-xs text-red-600">
              Lote: <span className="font-mono font-medium">{alert.batchCode}</span>
            </p>
          )}
          {alert.locationName && (
            <p className="text-xs text-red-600">
              Local: {alert.locationName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function WithdrawalAlertBanner({ alerts }: { alerts: WithdrawalAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <WithdrawalAlertCard key={alert.eventId} alert={alert} />
      ))}
    </div>
  );
}
