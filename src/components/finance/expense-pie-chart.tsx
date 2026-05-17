"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

const categoryLabels: Record<string, string> = {
  "Ração": "Ração",
  "Mudas": "Mudas",
  "Sementes": "Sementes",
  "MEI": "MEI",
  "Combustível": "Combustível",
  "Ferramentas": "Ferramentas",
  "Energia": "Energia",
  "Manutenção": "Manutenção",
  "Outros": "Outros",
};

const formatBRL = (value: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(value));

interface ExpensePieChartProps {
  data: { category: string; total: string; percentage: number }[];
}

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">Despesas por Categoria</h3>
        <div className="mt-8 flex flex-col items-center text-center">
          <p className="text-sm text-gray-500">Nenhuma despesa paga no período selecionado.</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: categoryLabels[item.category] || item.category,
    value: parseFloat(item.total),
    percentage: item.percentage,
    label: `${categoryLabels[item.category] || item.category} (${item.percentage.toFixed(1)}%)`,
  }));

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Despesas por Categoria</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown) => {
                const v = typeof value === "number" ? value : 0;
                return formatBRL(v.toFixed(2));
              }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            />
            <Legend
              formatter={(value: string) => (
                <span className="text-xs text-gray-600">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
