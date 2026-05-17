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
import { Wheat } from "lucide-react";

interface FeedConsumptionChartProps {
  data: { date: string; locationName: string; kg: number }[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const locationColors = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

export function FeedConsumptionChart({ data }: FeedConsumptionChartProps) {
  const hasData = data.some((d) => d.kg > 0);

  if (!hasData) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          Consumo de Ração por Galpão (15 dias)
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Wheat className="mb-3 size-12 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">
            Nenhum dado registrado para este período
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Comece a registrar o consumo de ração em Manejo Diário.
          </p>
        </div>
      </div>
    );
  }

  // Group data by date, with nested location values
  const dates = [...new Set(data.map((d) => d.date))];
  const locations = [...new Set(data.map((d) => d.locationName))];

  const colorMap = new Map<string, string>();
  locations.forEach((loc, i) => {
    colorMap.set(loc, locationColors[i % locationColors.length]);
  });

  const chartData = dates.map((date) => {
    const entry: Record<string, string | number> = { date };
    for (const loc of locations) {
      const record = data.find((d) => d.date === date && d.locationName === loc);
      entry[loc] = record?.kg || 0;
    }
    return entry;
  });

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        Consumo de Ração por Galpão (15 dias)
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
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
              label={{
                value: "kg",
                angle: -90,
                position: "insideLeft",
                fontSize: 11,
                fill: "#6b7280",
              }}
            />
            <Tooltip
              formatter={(value: unknown, name: unknown) => {
                const num = typeof value === 'number' ? value : 0;
                const n = typeof name === 'string' ? name : '';
                return [`${num.toFixed(1)} kg`, n];
              }}
              labelFormatter={(label) => formatDate(label)}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {locations.map((loc) => (
              <Bar
                key={loc}
                dataKey={loc}
                fill={colorMap.get(loc) || "#10b981"}
                radius={[4, 4, 0, 0]}
                name={loc}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
