"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Egg } from "lucide-react";

interface EggProductionChartProps {
  data: { date: string; good: number; broken: number }[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function EggProductionChart({ data }: EggProductionChartProps) {
  const hasData = data.some((d) => d.good > 0 || d.broken > 0);

  if (!hasData) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          Produção Diária de Ovos (15 dias)
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Egg className="mb-3 size-12 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">
            Nenhum dado registrado para este período
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Comece a registrar a coleta diária de ovos em Manejo Diário.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        Produção Diária de Ovos (15 dias)
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorGood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBroken" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip
              formatter={(value: unknown, name: unknown) => {
                const num = typeof value === 'number' ? value : 0;
                const n = typeof name === 'string' ? name : '';
                if (n === "good") return [num, "Ovos Bons"];
                if (n === "broken") return [num, "Trincados/Sujos"];
                return [num, n];
              }}
              labelFormatter={(label) => formatDate(label)}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "12px",
              }}
            />
            <Legend
              formatter={(value: string) => {
                if (value === "good") return "Ovos Bons";
                if (value === "broken") return "Trincados/Sujos";
                return value;
              }}
              wrapperStyle={{ fontSize: "12px" }}
            />
            <Area
              type="monotone"
              dataKey="good"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorGood)"
              name="good"
            />
            <Area
              type="monotone"
              dataKey="broken"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBroken)"
              name="broken"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
