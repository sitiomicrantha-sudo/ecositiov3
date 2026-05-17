"use client";

const formatBRL = (value: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(value));

interface DRETableProps {
  dre: {
    totalRevenue: string;
    totalExpense: string;
    netProfit: string;
    profitMargin: number;
  };
  coeByCostCenter: {
    costCenterName: string;
    totalExpense: string;
    percentage: number;
  }[];
}

export function DRETable({ dre, coeByCostCenter }: DRETableProps) {
  const isProfit = parseFloat(dre.netProfit) >= 0;

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="border-b bg-gray-50 px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-900">Demonstrativo de Resultado (DRE) — Simplificado</h3>
      </div>

      <div className="p-6">
        <div className="space-y-1">
          {/* Receita */}
          <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
            <span className="text-sm font-semibold text-green-800">(+) RECEITAS DO PERÍODO</span>
            <span className="text-lg font-bold text-green-700">{formatBRL(dre.totalRevenue)}</span>
          </div>

          {/* Custos Operacionais Header */}
          <div className="flex items-center justify-between px-4 py-2 pt-4">
            <span className="text-sm font-semibold text-gray-700">(-) CUSTOS OPERACIONAIS</span>
            <span className="text-sm font-medium text-gray-500">{formatBRL(dre.totalExpense)}</span>
          </div>

          {/* COE por Centro de Custo */}
          <div className="ml-6 space-y-1">
            {coeByCostCenter.map((cc) => (
              <div key={cc.costCenterName} className="flex items-center justify-between rounded-md px-4 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600">{cc.costCenterName}</span>
                  <span className="text-xs text-gray-400">({cc.percentage.toFixed(1)}%)</span>
                </div>
                <span className="font-medium text-gray-700">{formatBRL(cc.totalExpense)}</span>
              </div>
            ))}
            {coeByCostCenter.length === 0 && (
              <div className="px-4 py-2 text-sm text-gray-400">Nenhum custo operacional no período</div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-gray-200" />

          {/* Resultado Líquido */}
          <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${
            isProfit ? "bg-emerald-50" : "bg-red-50"
          }`}>
            <span className={`text-sm font-bold ${isProfit ? "text-emerald-800" : "text-red-800"}`}>
              (=) RESULTADO LÍQUIDO
            </span>
            <div className="text-right">
              <span className={`text-lg font-bold ${isProfit ? "text-emerald-700" : "text-red-700"}`}>
                {formatBRL(dre.netProfit)}
              </span>
              <p className={`text-xs font-medium ${isProfit ? "text-emerald-600" : "text-red-600"}`}>
                Margem: {dre.profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
