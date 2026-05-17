"use client";

import { useState, useEffect, useCallback } from "react";
import { getFinancialDashboardData } from "@/actions/finance-reports";
import type { FinancialDashboard } from "@/actions/finance-reports";
import { ExpensePieChart } from "@/components/finance/expense-pie-chart";
import { CashFlowChart } from "@/components/finance/cash-flow-chart";
import { DRETable } from "@/components/finance/dre-table";

const formatBRL = (value: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(value));

type DatePreset = "30days" | "month" | "quarter" | "custom";

export default function RelatoriosPage() {
  const [dashboard, setDashboard] = useState<FinancialDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activePreset, setActivePreset] = useState<DatePreset>("30days");

  function applyPreset(preset: DatePreset) {
    setActivePreset(preset);
    const today = new Date();
    let from: Date;
    let to = today;

    switch (preset) {
      case "30days":
        from = new Date(today);
        from.setDate(from.getDate() - 30);
        break;
      case "month":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "quarter":
        from = new Date(today);
        from.setDate(from.getDate() - 90);
        break;
      default:
        return;
    }

    setDateFrom(from.toISOString().split("T")[0]);
    setDateTo(to.toISOString().split("T")[0]);
  }

  const fetchData = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    const result = await getFinancialDashboardData(dateFrom, dateTo);
    if (result.success) {
      setDashboard(result.data);
    }
    setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    applyPreset("30days");
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchData();
    }
  }, [dateFrom, dateTo, fetchData]);

  const presets: { key: DatePreset; label: string }[] = [
    { key: "30days", label: "Últimos 30 dias" },
    { key: "month", label: "Mês Atual" },
    { key: "quarter", label: "Trimestre" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Relatórios & DRE</h2>
        <p className="mt-1 text-sm text-gray-500">
          Análise financeira, demonstrativo de resultado e projeção de fluxo de caixa.
        </p>
      </div>

      {/* Date Range Controls */}
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activePreset === p.key
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">De:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setActivePreset("custom");
            }}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
          <label className="text-xs font-medium text-gray-500">Até:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setActivePreset("custom");
            }}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
        </div>
      </div>

      {loading || !dashboard ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Receitas do Período</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{formatBRL(dashboard.dre.totalRevenue)}</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Despesas do Período</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{formatBRL(dashboard.dre.totalExpense)}</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Margem de Lucro</p>
              <p className={`mt-1 text-2xl font-bold ${parseFloat(dashboard.dre.netProfit) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {dashboard.dre.profitMargin.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                Lucro: {formatBRL(dashboard.dre.netProfit)}
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ExpensePieChart data={dashboard.expensesByCategory} />
            <CashFlowChart data={dashboard.cashFlowProjection} />
          </div>

          {/* DRE Table */}
          <DRETable dre={dashboard.dre} coeByCostCenter={dashboard.coeByCostCenter} />
        </>
      )}
    </div>
  );
}
