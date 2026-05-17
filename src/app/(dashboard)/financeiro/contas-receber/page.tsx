"use client";

import { useState, useEffect, useCallback } from "react";
import { ReceivableForm } from "@/components/finance/receivable-form";
import { ReceivablesTable } from "@/components/finance/receivables-table";
import { getReceivablesList } from "@/actions/finance-receivables";
import type { ReceivableWithDetails } from "@/actions/finance-receivables";

const formatBRL = (value: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(value));

export default function ContasReceberPage() {
  const [receivables, setReceivables] = useState<ReceivableWithDetails[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getReceivablesList(filterStatus === "all" ? undefined : { status: filterStatus });
    if (result.success) {
      setReceivables(result.data);
    }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPending = receivables.filter((r) => r.status === "pending").reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const totalOverdue = receivables.filter((r) => r.status === "overdue").reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const totalReceived = receivables.filter((r) => r.status === "received").reduce((sum, r) => sum + parseFloat(r.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Contas a Receber</h2>
          <p className="mt-1 text-sm text-gray-500">
            Acompanhe as entradas de caixa programadas de clientes e pedidos.
          </p>
        </div>
        <ReceivableForm onSuccess={fetchData} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total a Receber</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{formatBRL(totalPending.toFixed(2))}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Vencido</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{formatBRL(totalOverdue.toFixed(2))}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Recebido no Período</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{formatBRL(totalReceived.toFixed(2))}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "pending", "overdue", "received"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filterStatus === status
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {status === "all" ? "Todas" : status === "pending" ? "Pendentes" : status === "overdue" ? "Vencidas" : "Recebidas"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <ReceivablesTable receivables={receivables} onReceived={fetchData} />
      )}
    </div>
  );
}
