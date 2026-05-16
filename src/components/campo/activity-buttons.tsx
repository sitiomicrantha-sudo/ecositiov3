"use client";

import { Sprout, Wheat, Droplets, Shovel, Egg, Brush, Truck } from "lucide-react";

interface ActivityType {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  hoverBg: string;
}

const hortaSafActivities: ActivityType[] = [
  {
    id: "plantio",
    label: "Plantio",
    icon: Sprout,
    color: "text-green-700",
    bgColor: "bg-green-50",
    hoverBg: "hover:bg-green-100",
  },
  {
    id: "colheita",
    label: "Colheita",
    icon: Wheat,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    hoverBg: "hover:bg-amber-100",
  },
  {
    id: "aplicacao_insumo",
    label: "Aplicar Insumo",
    icon: Droplets,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    hoverBg: "hover:bg-blue-100",
  },
  {
    id: "rocagem",
    label: "Roçagem",
    icon: Shovel,
    color: "text-stone-700",
    bgColor: "bg-stone-50",
    hoverBg: "hover:bg-stone-100",
  },
];

const avesActivities: ActivityType[] = [
  {
    id: "coleta_ovos",
    label: "Coleta de Ovos",
    icon: Egg,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    hoverBg: "hover:bg-orange-100",
  },
  {
    id: "limpeza_aviario",
    label: "Limpeza Aviário",
    icon: Brush,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    hoverBg: "hover:bg-purple-100",
  },
  {
    id: "coleta_esterco",
    label: "Coleta de Esterco",
    icon: Truck,
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    hoverBg: "hover:bg-yellow-100",
  },
];

interface ActivityButtonsProps {
  onSelectActivity: (activityType: string) => void;
}

export function ActivityButtons({ onSelectActivity }: ActivityButtonsProps) {
  return (
    <div className="space-y-6">
      {/* Manejo da Horta/SAF */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-800">
          Manejo da Horta / SAF
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {hortaSafActivities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => onSelectActivity(activity.id)}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all ${activity.bgColor} ${activity.hoverBg} border-transparent`}
            >
              <activity.icon className={`size-6 ${activity.color}`} />
              <span className={`text-center text-xs font-medium ${activity.color}`}>
                {activity.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Manejo das Aves */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-800">
          Manejo das Aves
        </h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
          {avesActivities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => onSelectActivity(activity.id)}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all ${activity.bgColor} ${activity.hoverBg} border-transparent`}
            >
              <activity.icon className={`size-6 ${activity.color}`} />
              <span className={`text-center text-xs font-medium ${activity.color}`}>
                {activity.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
