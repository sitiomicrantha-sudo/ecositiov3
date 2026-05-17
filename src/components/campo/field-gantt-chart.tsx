"use client";

import { useState } from "react";
import type { FieldTimelineRow, TimelineEvent } from "@/actions/crop-timeline";
import { MONTHS_2026 } from "@/actions/crop-timeline";
import { Calendar, Sprout, Clock, FileText } from "lucide-react";

interface FieldGanttChartProps {
  rows: FieldTimelineRow[];
}

const statusLabels: Record<string, string> = {
  active: "Em andamento",
  planned: "Planejamento",
  recent: "Colheita recente",
};

const cycleLabels: Record<string, string> = {
  ciclo_curto: "Ciclo Curto",
  anual: "Anual",
  perene: "Perene",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function EventTooltip({ event }: { event: TimelineEvent }) {
  return (
    <div className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-full rounded-lg border bg-white p-3 shadow-lg"
      style={{ left: "50%", top: "-8px" }}
    >
      <div className="space-y-1 text-xs">
        <p className="font-semibold text-gray-900">{event.cropName}</p>
        <div className="flex items-center gap-1 text-gray-500">
          <Sprout className="size-3" />
          <span>{cycleLabels[event.cropCycleType] || event.cropCycleType}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <Calendar className="size-3" />
          <span>{formatDate(event.startDate)} → {formatDate(event.endDate)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="size-3" />
          <span className={
            event.status === "active"
              ? "text-emerald-600 font-medium"
              : event.status === "planned"
                ? "text-blue-600 font-medium"
                : "text-gray-500 font-medium"
          }>
            {statusLabels[event.status]}
          </span>
        </div>
        {event.notes && (
          <div className="flex items-start gap-1 text-gray-400 pt-1 border-t">
            <FileText className="size-3 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{event.notes}</span>
          </div>
        )}
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-px">
        <div className="border-4 border-transparent border-t-white" />
      </div>
    </div>
  );
}

export function FieldGanttChart({ rows }: FieldGanttChartProps) {
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <Calendar className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">Nenhum cultivo no período</h3>
        <p className="mt-1 text-sm text-gray-500">
          Registre plantios ou planejamentos para visualizar o cronograma.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header */}
          <div className="flex border-b bg-gray-50">
            <div className="sticky left-0 z-10 w-48 shrink-0 border-r bg-gray-50 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Talhão
              </span>
            </div>
            <div className="flex flex-1">
              {MONTHS_2026.map((month) => (
                <div
                  key={month.label}
                  className="flex-1 border-r px-2 py-3 text-center last:border-r-0"
                >
                  <span className="text-xs font-semibold text-gray-500">
                    {month.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {rows.map((row) => (
            <div
              key={row.fieldId}
              className="flex border-b last:border-b-0 hover:bg-gray-50/50"
            >
              {/* Field name column */}
              <div className="sticky left-0 z-10 w-48 shrink-0 border-r bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {row.fieldShortCode
                      ? `[${row.fieldShortCode}] ${row.fieldName}`
                      : row.fieldName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {row.events.length} evento{row.events.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Timeline area */}
              <div className="relative flex flex-1 py-3">
                {/* Month grid lines */}
                {MONTHS_2026.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 border-r last:border-r-0"
                    style={{ height: "100%" }}
                  />
                ))}

                {/* Event bars */}
                {row.events.map((event) => (
                  <div
                    key={event.id}
                    className="absolute top-1/2 -translate-y-1/2 cursor-pointer rounded-md px-2 py-1 text-xs font-medium transition-all hover:scale-[1.02] hover:shadow-md"
                    style={{
                      left: `${event.leftPercent}%`,
                      width: `${event.widthPercent}%`,
                      minWidth: "24px",
                    }}
                    onMouseEnter={() => setHoveredEvent(event.id)}
                    onMouseLeave={() => setHoveredEvent(null)}
                  >
                    {event.status === "active" && (
                      <div className="rounded-md bg-emerald-600 px-2 py-1 text-white truncate">
                        {event.cropName}
                      </div>
                    )}
                    {event.status === "planned" && (
                      <div className="rounded-md border-2 border-dashed border-blue-500 bg-blue-500/20 px-2 py-1 text-blue-800 truncate">
                        {event.cropName}
                      </div>
                    )}
                    {event.status === "recent" && (
                      <div className="rounded-md bg-gray-200 px-2 py-1 text-gray-600 truncate">
                        {event.cropName}
                      </div>
                    )}

                    {/* Tooltip */}
                    {hoveredEvent === event.id && <EventTooltip event={event} />}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-4 border-t bg-gray-50 px-4 py-3">
            <span className="text-xs font-medium text-gray-500">Legenda:</span>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-emerald-600" />
              <span className="text-xs text-gray-600">Em andamento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm border-2 border-dashed border-blue-500 bg-blue-500/20" />
              <span className="text-xs text-gray-600">Planejamento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-gray-200" />
              <span className="text-xs text-gray-600">Colheita recente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
