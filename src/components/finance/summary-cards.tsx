"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface SummaryCardsProps {
  balance: string;
  monthRevenue: string;
  monthExpense: string;
}

const formatBRL = (value: string) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(parseFloat(value));

export function SummaryCards({ balance, monthRevenue, monthExpense }: SummaryCardsProps) {
  const balanceNum = parseFloat(balance);
  const isPositive = balanceNum >= 0;

  const cards = [
    {
      title: "Saldo em Caixa",
      value: formatBRL(balance),
      description: isPositive ? "Positivo" : "Negativo",
      icon: Wallet,
      color: isPositive ? "text-green-600" : "text-red-600",
      bgColor: isPositive ? "bg-green-50" : "bg-red-50",
    },
    {
      title: "Receitas (Mês)",
      value: formatBRL(monthRevenue),
      description: "Faturamento do mês",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Despesas (Mês)",
      value: formatBRL(monthExpense),
      description: "Gastos do mês",
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
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
            <p className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </p>
            <p className="text-sm font-medium text-gray-700">{card.title}</p>
            <p className="text-xs text-gray-500">{card.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
