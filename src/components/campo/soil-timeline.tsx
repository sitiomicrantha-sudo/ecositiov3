"use client";

import {
  Sprout,
  Wheat,
  Droplets,
  Shovel,
  Leaf,
  Calendar,
  Package,
  Clock,
} from "lucide-react";
import type { DossierTimelineEntry } from "@/actions/soil-history";

interface SoilTimelineProps {
  entries: DossierTimelineEntry[];
}

const activityConfig: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string;
    badgeText: string;
  }
> = {
  plantio: {
    label: "Plantio",
    icon: Sprout,
    badge: "bg-green-100 text-green-800",
    badgeText: "text-green-800",
  },
  colheita: {
    label: "Colheita",
    icon: Wheat,
    badge: "bg-amber-100 text-amber-800",
    badgeText: "text-amber-800",
  },
  aplicacao_insumo: {
    label: "Aplicação de Insumo",
    icon: Droplets,
    badge: "bg-blue-100 text-blue-800",
    badgeText: "text-blue-800",
  },
  rocagem: {
    label: "Roçagem",
    icon: Shovel,
    badge: "bg-green-900 text-green-100",
    badgeText: "text-green-900",
  },
};

const categoryConfig: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string;
    badgeText: string;
  }
> = {
  bioinsumos: {
    label: "Bioinsumos",
    icon: Leaf,
    badge: "bg-amber-900 text-amber-100",
    badgeText: "text-amber-900",
  },
  horta: {
    label: "Horta/SAF",
    icon: Sprout,
    badge: "bg-emerald-100 text-emerald-800",
    badgeText: "text-emerald-800",
  },
  geral: {
    label: "Geral",
    icon: Package,
    badge: "bg-gray-100 text-gray-700",
    badgeText: "text-gray-700",
  },
};

function getEntryConfig(entry: DossierTimelineEntry) {
  if (entry.type === "PLANTING") {
    return {
      label: "Plantio",
      icon: Sprout,
      badge: "bg-green-100 text-green-800",
      badgeText: "text-green-800",
      categoryLabel: entry.plantingStatus === "permanent" ? "Perene" : "Ciclo Rápido",
      categoryBadge:
        entry.plantingStatus === "permanent"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-green-100 text-green-800",
    };
  }

  if (entry.type === "HARVEST") {
    return {
      label: "Colheita",
      icon: Wheat,
      badge: "bg-amber-100 text-amber-800",
      badgeText: "text-amber-800",
      categoryLabel: "Colheita",
      categoryBadge: "bg-amber-100 text-amber-800",
    };
  }

  const actConfig = entry.activityType
    ? activityConfig[entry.activityType]
    : null;
  const catConfig = entry.category ? categoryConfig[entry.category] : null;

  return {
    label: actConfig?.label || entry.activityType || "Atividade",
    icon: actConfig?.icon || catConfig?.icon || Calendar,
    badge: actConfig?.badge || catConfig?.badge || "bg-gray-100 text-gray-700",
    badgeText: actConfig?.badgeText || catConfig?.badgeText || "text-gray-700",
    categoryLabel: catConfig?.label || entry.category || "",
    categoryBadge: catConfig?.badge || "bg-gray-100 text-gray-700",
  };
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "1 dia atrás";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
  return `${Math.floor(diffDays / 365)} anos atrás`;
}

export function SoilTimeline({ entries }: SoilTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center print:border-gray-300">
        <Calendar className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhum registro encontrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Este canteiro ainda não possui plantios ou atividades registradas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, index) => {
        const config = getEntryConfig(entry);
        const Icon = config.icon;
        const isLast = index === entries.length - 1;

        return (
          <div key={`${entry.type}-${entry.id}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex shrink-0 items-center justify-center rounded-lg p-2 ${config.badge} print:bg-transparent print:border print:border-gray-300`}
              >
                <Icon className={`size-4 ${config.badgeText} print:text-black`} />
              </div>
              {!isLast && (
                <div className="h-full w-px bg-gray-200 print:bg-gray-300" style={{ minHeight: "2rem" }} />
              )}
            </div>

            <div className="min-w-0 flex-1 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900 print:text-black">
                  {config.label}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.badge} print:border print:border-gray-300 print:bg-transparent print:text-black`}
                >
                  {config.categoryLabel}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 print:text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {formatDate(entry.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {daysAgo(entry.date)}
                </span>
                {entry.itemName && (
                  <span className="flex items-center gap-1">
                    <Package className="size-3" />
                    {entry.itemName}
                  </span>
                )}
                {entry.quantity && (
                  <span className="font-medium text-gray-700 print:text-black">
                    Qtd: {parseFloat(entry.quantity).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>

              {entry.notes && (
                <p className="mt-2 text-sm text-gray-600 print:text-black">
                  {entry.notes}
                </p>
              )}

              {entry.type === "PLANTING" && entry.harvestedAt && (
                <p className="mt-1 text-xs text-gray-500 print:text-gray-600">
                  Colhido em {formatDate(entry.harvestedAt)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
