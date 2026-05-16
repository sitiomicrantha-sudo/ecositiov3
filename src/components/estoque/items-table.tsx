"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Package } from "lucide-react";
import type { inventoryItems, inventoryTransactions } from "@/db/schema";

type InventoryItem = typeof inventoryItems.$inferSelect;
type Transaction = typeof inventoryTransactions.$inferSelect;

interface ItemsTableProps {
  items: InventoryItem[];
  transactions: Transaction[];
  onMoveItem: (item: InventoryItem) => void;
}

const categoryLabels: Record<string, string> = {
  muda: "Muda",
  estaca: "Estaca",
  semente: "Semente",
  insumo: "Insumo",
};

const categoryColors: Record<string, string> = {
  muda: "bg-green-100 text-green-800",
  estaca: "bg-amber-100 text-amber-800",
  semente: "bg-emerald-100 text-emerald-800",
  insumo: "bg-blue-100 text-blue-800",
};

const unitLabels: Record<string, string> = {
  kg: "kg",
  unit: "un",
  liters: "L",
};

function calculateStock(itemId: number, transactions: Transaction[]): number {
  return transactions
    .filter((tx) => tx.itemId === itemId)
    .reduce((acc, tx) => {
      const qty = parseFloat(tx.quantity);
      return tx.type === "entry" ? acc + qty : acc - qty;
    }, 0);
}

export function ItemsTable({ items, transactions, onMoveItem }: ItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <Package className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhum item cadastrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Clique em &quot;Cadastrar Item&quot; para adicionar germoplasma ou insumos.
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
              <TableHead className="font-semibold text-gray-700">Nome</TableHead>
              <TableHead className="font-semibold text-gray-700">Categoria</TableHead>
              <TableHead className="hidden font-semibold text-gray-700 md:table-cell">
                Localização
              </TableHead>
              <TableHead className="hidden font-semibold text-gray-700 sm:table-cell">
                Unidade
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">
                Estoque Atual
              </TableHead>
              <TableHead className="text-right font-semibold text-gray-700">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const stock = calculateStock(item.id, transactions);
              const stockColor =
                stock > 0
                  ? "text-green-700"
                  : stock === 0
                    ? "text-gray-500"
                    : "text-red-600";

              return (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">
                    {item.name}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[item.category] || "bg-gray-100 text-gray-800"}`}
                    >
                      {categoryLabels[item.category] || item.category}
                    </span>
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate text-gray-500 md:table-cell">
                    {item.location || "—"}
                  </TableCell>
                  <TableCell className="hidden text-gray-500 sm:table-cell">
                    {unitLabels[item.unit] || item.unit}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${stockColor}`}>
                    {stock.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      {unitLabels[item.unit]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveItem(item)}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <ArrowLeftRight className="mr-1 size-4" />
                      <span className="hidden sm:inline">Movimentar</span>
                      <span className="sm:hidden">+/-</span>
                    </Button>
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
