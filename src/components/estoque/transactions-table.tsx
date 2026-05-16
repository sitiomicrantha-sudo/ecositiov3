"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownLeft, ArrowUpRight, History } from "lucide-react";

interface Transaction {
  id: number;
  itemId: number;
  type: "entry" | "exit";
  quantity: string;
  date: string;
  notes: string | null;
  createdAt: Date;
  itemName: string;
  itemUnit: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

const unitLabels: Record<string, string> = {
  kg: "kg",
  unit: "un",
  liters: "L",
};

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <History className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhuma movimentação registrada
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          As entradas e saídas de estoque aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Data</TableHead>
              <TableHead className="font-semibold text-gray-700">Item</TableHead>
              <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">
                Quantidade
              </TableHead>
              <TableHead className="hidden font-semibold text-gray-700 md:table-cell">
                Motivo / Notas
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
              const isEntry = tx.type === "entry";

              return (
                <TableRow key={tx.id} className="hover:bg-gray-50">
                  <TableCell className="text-gray-600">
                    {new Date(tx.date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {tx.itemName}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        isEntry
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {isEntry ? (
                        <ArrowDownLeft className="size-3" />
                      ) : (
                        <ArrowUpRight className="size-3" />
                      )}
                      {isEntry ? "Entrada" : "Saída"}
                    </span>
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      isEntry ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {isEntry ? "+" : "-"}
                    {parseFloat(tx.quantity).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      {unitLabels[tx.itemUnit] || tx.itemUnit}
                    </span>
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate text-gray-500 md:table-cell">
                    {tx.notes || "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
