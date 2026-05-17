"use client";

import { useState, useEffect, useCallback } from "react";
import { BillForm } from "@/components/finance/bill-form";
import { BillsTable } from "@/components/finance/bills-table";
import { getBillsList } from "@/actions/finance-bills";
import type { BillWithDetails } from "@/actions/finance-bills";

const formatBRL = (value: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(value));

export default function ContasPagarPage() {
  const [bills, setBills] = useState<BillWithDetails[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getBillsList(filterStatus === "all" ? undefined : { status: filterStatus });
    if (result.success) {
      setBills(result.data);
    }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPending = bills.filter((b) => b.status === "pending").reduce((sum, b) => sum + parseFloat(b.amount), 0);
  const totalOverdue = bills.filter((b) => b.status === "overdue").reduce((sum, b) => sum + parseFloat(b.amount), 0);
  const totalPaid = bills.filter((b) => b.status === "paid").reduce((sum, b) => sum + parseFloat(b.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Contas a Pagar</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie suas obrigações financeiras com vencimento programado.
          </p>
        </div>
        <BillForm onSuccess={fetchData} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Pendente</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{formatBRL(totalPending.toFixed(2))}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Vencido</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{formatBRL(totalOverdue.toFixed(2))}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pago no Período</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{formatBRL(totalPaid.toFixed(2))}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "pending", "overdue", "paid"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filterStatus === status
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {status === "all" ? "Todas" : status === "pending" ? "Pendentes" : status === "overdue" ? "Vencidas" : "Pagas"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <BillsTable bills={bills} onPaid={fetchData} />
      )}
    </div>
  );
}
