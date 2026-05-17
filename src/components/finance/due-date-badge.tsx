"use client";

import { CheckCircle, AlertCircle, Clock, Calendar } from "lucide-react";

interface DueDateBadgeProps {
  dueDate: string;
  status: "pending" | "paid" | "received" | "overdue";
  paidDate?: string | null;
}

export function DueDateBadge({ dueDate, status, paidDate }: DueDateBadgeProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (status === "paid" || status === "received") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        <CheckCircle className="size-3" />
        {paidDate ? `Pago em ${new Date(paidDate).toLocaleDateString("pt-BR")}` : "Pago"}
      </span>
    );
  }

  if (status === "overdue" || diffDays < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 animate-pulse">
        <AlertCircle className="size-3" />
        Vencido ({Math.abs(diffDays)} {diffDays === -1 ? "dia" : "dias"})
      </span>
    );
  }

  if (diffDays === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        <Clock className="size-3" />
        Vence Hoje
      </span>
    );
  }

  if (diffDays <= 7) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
        <Calendar className="size-3" />
        {diffDays} {diffDays === 1 ? "dia" : "dias"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      <Calendar className="size-3" />
      {due.toLocaleDateString("pt-BR")}
    </span>
  );
}
