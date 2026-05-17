"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

interface CashFlowChartProps {
  data: { date: string; projectedIn: string; projectedOut: string }[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const hasData = data.some((d) => parseFloat(d.projectedIn) > 0 || parseFloat(d.projectedOut) > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">Projeção de Fluxo de Caixa</h3>
        <div className="mt-8 flex flex-col items-center text-center">
          <p className="text-sm text-gray-500">Nenhuma conta pendente para os próximos 30 dias.</p>
        </div>
      </div>
    );
  }

  const chartData = data
    .filter((d) => parseFloat(d.projectedIn) > 0 || parseFloat(d.projectedOut) > 0)
    .map((d) => ({
      date: formatDate(d.date),
      fullDate: d.date,
      entradas: parseFloat(d.projectedIn),
      saidas: parseFloat(d.projectedOut),
      saldo: parseFloat(d.projectedIn) - parseFloat(d.projectedOut),
    }));

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Projeção de Fluxo de Caixa (30 dias)</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(v) => `R$ ${v}`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
              formatter={(value: unknown, name: unknown) => {
                const v = typeof value === "number" ? value : 0;
                const n = typeof name === "string" ? name : "";
                if (n === "entradas") return [formatBRL(v), "Entradas"];
                if (n === "saidas") return [formatBRL(v), "Saídas"];
                return [formatBRL(v), n];
              }}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend
              formatter={(value: string) => (
                <span className="text-xs text-gray-600">{value === "entradas" ? "Entradas" : "Saídas"}</span>
              )}
            />
            <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} name="entradas" />
            <Bar dataKey="saidas" fill="#ef4444" radius={[4, 4, 0, 0]} name="saidas" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
