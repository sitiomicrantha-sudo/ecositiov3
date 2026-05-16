"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getFinancialOverview,
  getOperationalOverview,
  getPoultryOverview,
  getRecentActivities,
  getLowStockAlerts,
  getPendingSales,
} from "@/actions/dashboard";
import { DbTools } from "@/components/finance/db-tools";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Bird,
  Sprout,
  AlertTriangle,
  Clock,
  Package,
  ShoppingCart,
  Wallet,
} from "lucide-react";

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return new Date(date).toLocaleDateString("pt-BR");
}

function getActivityLabel(a: {
  activityType: string;
  itemName: string | null;
  bedName: string | null;
  batchName: string | null;
  quantity: string | null;
  notes: string | null;
}): string {
  const typeLabels: Record<string, string> = {
    plantio: "Plantio",
    colheita: "Colheita",
    coleta_ovos: "Coleta de ovos",
    limpeza_aviario: "Limpeza de aviário",
    coleta_esterco: "Coleta de esterco",
    aplicacao_insumo: "Aplicação de insumo",
    rocagem: "Roçagem",
  };

  const typeLabel = typeLabels[a.activityType] || a.activityType;
  let label = typeLabel;

  if (a.itemName && (a.activityType === "colheita" || a.activityType === "plantio" || a.activityType === "aplicacao_insumo")) {
    label += ` de ${a.itemName.toLowerCase()}`;
  }

  if (a.bedName && a.activityType !== "coleta_ovos" && a.activityType !== "limpeza_aviario" && a.activityType !== "coleta_esterco") {
    label += ` no ${a.bedName}`;
  }

  if (a.batchName && (a.activityType === "coleta_ovos" || a.activityType === "limpeza_aviario" || a.activityType === "coleta_esterco")) {
    label += ` - ${a.batchName}`;
  }

  if (a.quantity) {
    label += ` (${a.quantity})`;
  }

  return label;
}

interface ActivityItem {
  id: number;
  date: Date;
  category: string;
  activityType: string;
  quantity: string | null;
  notes: string | null;
  bedName: string | null;
  itemName: string | null;
  batchName: string | null;
}

interface StockItem {
  id: number;
  name: string;
  unit: string;
  currentStock: number;
}

interface PendingSale {
  id: number;
  date: Date;
  customerName: string | null;
  totalPrice: string;
  itemName: string | null;
}

export default function DashboardPage() {
  const [balance, setBalance] = useState("0");
  const [monthRevenue, setMonthRevenue] = useState("0");
  const [monthExpense, setMonthExpense] = useState("0");
  const [totalBeds, setTotalBeds] = useState(0);
  const [occupiedBeds, setOccupiedBeds] = useState(0);
  const [totalBirds, setTotalBirds] = useState(0);
  const [activeBatches, setActiveBatches] = useState(0);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([]);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [
      financialResult,
      operationalResult,
      poultryResult,
      activitiesResult,
      stockResult,
      pendingResult,
    ] = await Promise.all([
      getFinancialOverview(),
      getOperationalOverview(),
      getPoultryOverview(),
      getRecentActivities(),
      getLowStockAlerts(),
      getPendingSales(),
    ]);

    if (financialResult.success) {
      setBalance(financialResult.data.balance);
      setMonthRevenue(financialResult.data.monthRevenue);
      setMonthExpense(financialResult.data.monthExpense);
    }

    if (operationalResult.success) {
      setTotalBeds(operationalResult.data.totalBeds);
      setOccupiedBeds(operationalResult.data.occupiedBeds);
    }

    if (poultryResult.success) {
      setTotalBirds(poultryResult.data.totalBirds);
      setActiveBatches(poultryResult.data.activeBatches);
    }

    if (activitiesResult.success) {
      setRecentActivities(activitiesResult.data);
    }

    if (stockResult.success) {
      setLowStockItems(stockResult.data);
    }

    if (pendingResult.success) {
      setPendingSales(pendingResult.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const revenuePercent = Math.min(100, (parseFloat(monthRevenue) / Math.max(parseFloat(monthRevenue), parseFloat(monthExpense))) * 100);
  const expensePercent = Math.min(100, (parseFloat(monthExpense) / Math.max(parseFloat(monthRevenue), parseFloat(monthExpense))) * 100);
  const maxVal = Math.max(parseFloat(monthRevenue), parseFloat(monthExpense), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Torre de Controle
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Visão geral do Sítio Micrantha — leitura rápida em 5 segundos.
        </p>
      </div>

      {/* ROW 1: KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Saldo em Caixa */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50">
              <Wallet className="size-5 text-emerald-600" />
            </div>
            <span className={`text-xs font-medium ${parseFloat(balance) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {parseFloat(balance) >= 0 ? "Positivo" : "Negativo"}
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {formatCurrency(balance)}
          </p>
          <p className="text-sm font-medium text-gray-700">Saldo em Caixa</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <TrendingUp className="size-3 text-emerald-500" />
              {formatCurrency(monthRevenue)}
            </span>
            <span className="flex items-center gap-1">
              <TrendingDown className="size-3 text-red-500" />
              {formatCurrency(monthExpense)}
            </span>
          </div>
        </div>

        {/* Aves Ativas */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50">
              <Bird className="size-5 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-amber-600">
              {activeBatches} lote{activeBatches !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {totalBirds}
          </p>
          <p className="text-sm font-medium text-gray-700">Aves Ativas</p>
          <p className="mt-2 text-xs text-gray-500">
            Plantel comercial em produção
          </p>
        </div>

        {/* Canteiros Ocupados */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-50">
              <Sprout className="size-5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600">
              {totalBeds - occupiedBeds} livre{totalBeds - occupiedBeds !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {occupiedBeds}/{totalBeds}
          </p>
          <p className="text-sm font-medium text-gray-700">Canteiros Ocupados</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-green-600 transition-all"
              style={{ width: `${totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* ROW 2: Fluxo do Mês + Alertas */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Fluxo do Mês (2/3 width) */}
        <div className="rounded-xl border bg-white p-5 shadow-sm md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Fluxo do Mês
          </h3>

          <div className="space-y-4">
            {/* Receita Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <TrendingUp className="size-3.5" />
                  Receitas
                </span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(monthRevenue)}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(parseFloat(monthRevenue) / maxVal) * 100}%` }}
                />
              </div>
            </div>

            {/* Despesa Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-red-700 font-medium">
                  <TrendingDown className="size-3.5" />
                  Despesas
                </span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(monthExpense)}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-red-400 transition-all duration-500"
                  style={{ width: `${(parseFloat(monthExpense) / maxVal) * 100}%` }}
                />
              </div>
            </div>

            {/* Saldo visual */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Saldo do mês</span>
                <span className={`text-sm font-bold ${parseFloat(monthRevenue) - parseFloat(monthExpense) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatCurrency((parseFloat(monthRevenue) - parseFloat(monthExpense)).toFixed(2))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas (1/3 width) */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="size-4 text-amber-500" />
            Alertas
          </h3>

          <div className="space-y-3">
            {/* Estoque Baixo */}
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="flex size-2 rounded-full bg-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-red-600">
                      {item.currentStock} {item.unit} restante{item.currentStock !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">Estoque em dia</p>
            )}

            {/* Vendas Pendentes */}
            {pendingSales.length > 0 && (
              <>
                {lowStockItems.length > 0 && <div className="border-t border-gray-100 pt-3" />}
                <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <ShoppingCart className="size-3" />
                  {pendingSales.length} venda{pendingSales.length !== 1 ? "s" : ""} pendente{pendingSales.length !== 1 ? "s" : ""}
                </p>
                {pendingSales.slice(0, 3).map((sale) => (
                  <div key={sale.id} className="flex items-center gap-2">
                    <span className="flex size-2 rounded-full bg-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {sale.customerName || "Sem cliente"}
                      </p>
                      <p className="text-xs text-amber-600">
                        {formatCurrency(sale.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}

            {lowStockItems.length === 0 && pendingSales.length === 0 && (
              <p className="text-xs text-gray-400">Nenhum alerta no momento</p>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: Atividade Recente */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-1.5">
          <Clock className="size-4 text-gray-500" />
          Atividade Recente
        </h3>

        {recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity, i) => (
              <div key={activity.id} className="flex items-start gap-3">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className={`size-2.5 rounded-full mt-1.5 ${
                    activity.category === "aves" ? "bg-amber-400" :
                    activity.category === "horta" ? "bg-green-500" :
                    "bg-gray-400"
                  }`} />
                  {i < recentActivities.length - 1 && (
                    <div className="w-px h-6 bg-gray-200 mt-1" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-gray-900">
                    {getActivityLabel(activity)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {timeAgo(activity.date)}
                    {activity.notes && ` — ${activity.notes}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Nenhuma atividade registrada.</p>
        )}
      </div>

      {/* FOOTER: DbTools */}
      <div className="pt-4 pb-4 flex justify-end border-t border-gray-100">
        <DbTools />
      </div>
    </div>
  );
}
