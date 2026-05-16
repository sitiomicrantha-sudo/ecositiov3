"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";

interface Transaction {
  id: number;
  date: Date;
  type: "revenue" | "expense";
  category: string;
  amount: string;
  description: string;
  saleId: number | null;
  saleCustomerName: string | null;
  saleItemName: string | null;
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

const formatBRL = (value: string) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(parseFloat(value));

const categoryLabels: Record<string, string> = {
  venda_producao: "Venda Produção",
  insumos_aves: "Insumos Aves",
  insumos_jadm: "Insumos JADAM",
  infraestrutura: "Infraestrutura",
  logistica: "Logística",
  outros: "Outros",
};

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <Receipt className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhuma transação registrada
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Registre vendas e despesas para acompanhar o fluxo de caixa.
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
              <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
              <TableHead className="hidden font-semibold text-gray-700 md:table-cell">
                Categoria
              </TableHead>
              <TableHead className="hidden font-semibold text-gray-700 lg:table-cell">
                Descrição
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">
                Valor
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
              const isRevenue = tx.type === "revenue";

              return (
                <TableRow key={tx.id} className="hover:bg-gray-50">
                  <TableCell className="text-gray-600">
                    {new Date(tx.date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        isRevenue
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {isRevenue ? (
                        <ArrowDownLeft className="size-3" />
                      ) : (
                        <ArrowUpRight className="size-3" />
                      )}
                      {isRevenue ? "Receita" : "Despesa"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-gray-600 md:table-cell">
                    <span className="text-sm">
                      {categoryLabels[tx.category] || tx.category}
                    </span>
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate text-gray-500 lg:table-cell">
                    {tx.description}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      isRevenue ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {isRevenue ? "+" : "-"} {formatBRL(tx.amount)}
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
