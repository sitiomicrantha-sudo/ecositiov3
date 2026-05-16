"use client";

import {
  Sprout,
  Wheat,
  Egg,
  Brush,
  Truck,
  Droplets,
  Shovel,
  Calendar,
  MapPin,
  Package,
  ThermometerSun,
} from "lucide-react";

interface Activity {
  id: number;
  date: Date;
  category: "horta" | "aves" | "bioinsumos" | "geral";
  activityType:
    | "plantio"
    | "colheita"
    | "coleta_ovos"
    | "limpeza_aviario"
    | "coleta_esterco"
    | "aplicacao_insumo"
    | "rocagem"
    | "alimentacao_racao"
    | "manejo_ambiencia"
    | "movimentacao_piquete";
  bedId: number | null;
  itemId: number | null;
  batchId: number | null;
  quantity: string | null;
  notes: string | null;
  bedName: string | null;
  itemName: string | null;
  batchName: string | null;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const activityConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
  plantio: {
    label: "Plantio",
    icon: Sprout,
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  colheita: {
    label: "Colheita",
    icon: Wheat,
    color: "text-amber-700",
    bgColor: "bg-amber-100",
  },
  coleta_ovos: {
    label: "Coleta de Ovos",
    icon: Egg,
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
  limpeza_aviario: {
    label: "Limpeza Aviário",
    icon: Brush,
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  coleta_esterco: {
    label: "Coleta de Esterco",
    icon: Truck,
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  aplicacao_insumo: {
    label: "Aplicação de Insumo",
    icon: Droplets,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  rocagem: {
    label: "Roçagem",
    icon: Shovel,
    color: "text-stone-700",
    bgColor: "bg-stone-100",
  },
  alimentacao_racao: {
    label: "Fornecimento de Ração",
    icon: Wheat,
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
  manejo_ambiencia: {
    label: "Manejo de Ambiência",
    icon: ThermometerSun,
    color: "text-sky-700",
    bgColor: "bg-sky-100",
  },
  movimentacao_piquete: {
    label: "Movimentação de Piquete",
    icon: MapPin,
    color: "text-lime-700",
    bgColor: "bg-lime-100",
  },
};

const categoryLabels: Record<string, string> = {
  horta: "Horta/SAF",
  aves: "Aves",
  bioinsumos: "Bioinsumos",
  geral: "Geral",
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <Calendar className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhuma atividade registrada
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Use a aba &quot;Registrar Atividade&quot; para começar o diário de bordo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const config = activityConfig[activity.activityType] || {
          label: activity.activityType,
          icon: Calendar,
          color: "text-gray-700",
          bgColor: "bg-gray-100",
        };
        const Icon = config.icon;

        return (
          <div
            key={activity.id}
            className="flex gap-3 rounded-xl border bg-white p-4 shadow-sm"
          >
            <div
              className={`flex shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}
            >
              <Icon className={`size-5 ${config.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900">
                  {config.label}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {categoryLabels[activity.category]}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(activity.date).toLocaleDateString("pt-BR")}
                </span>
                {activity.bedName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {activity.bedName}
                  </span>
                )}
                {activity.itemName && (
                  <span className="flex items-center gap-1">
                    <Package className="size-3" />
                    {activity.itemName}
                  </span>
                )}
                {activity.batchName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {activity.batchName}
                  </span>
                )}
                {activity.quantity && (
                  <span className="font-medium text-gray-700">
                    Qtd: {parseFloat(activity.quantity).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>

              {activity.notes && (
                <p className="mt-2 text-sm text-gray-600">{activity.notes}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
