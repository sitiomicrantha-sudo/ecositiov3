"use client";

import { Sprout, CheckCircle, AlertCircle } from "lucide-react";

interface BedStatus {
  id: number;
  name: string;
  hasActivePlanting: boolean;
  plantingStatus: string | null;
  plantingItemName: string | null;
}

interface BedsOverviewProps {
  beds: BedStatus[];
}

export function BedsOverview({ beds }: BedsOverviewProps) {
  const total = beds.length;
  const occupied = beds.filter((b) => b.hasActivePlanting).length;
  const available = total - occupied;

  const cards = [
    {
      title: "Total de Canteiros",
      value: total.toString(),
      description: "Cadastrados no sistema",
      icon: Sprout,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Disponíveis",
      value: available.toString(),
      description: "Sem plantio ativo",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Ocupados",
      value: occupied.toString(),
      description: "Com cultivo ativo ou perene",
      icon: AlertCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div
              className={`flex size-10 items-center justify-center rounded-lg ${card.bgColor}`}
            >
              <card.icon className={`size-5 ${card.color}`} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm font-medium text-gray-700">{card.title}</p>
            <p className="text-xs text-gray-500">{card.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
