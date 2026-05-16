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
import { CheckCircle, Clock, ShoppingBag } from "lucide-react";

interface Order {
  id: number;
  date: Date;
  customerName: string | null;
  type: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: string;
  total: string;
  deliveryFee: string;
  items: { itemName: string; quantity: string; totalPrice: string }[];
}

interface OrdersListProps {
  orders: Order[];
  onConfirmPayment: (orderId: number) => void;
}

const formatBRL = (value: string) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(parseFloat(value));

const typeLabels: Record<string, string> = {
  balcao: "Balcão",
  delivery: "Delivery",
};

const methodLabels: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  pendente: "Pendente",
};

export function OrdersList({ orders, onConfirmPayment }: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <ShoppingBag className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhum pedido registrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Clique em &quot;Registrar Pedido&quot; para começar.
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
              <TableHead className="font-semibold text-gray-700">#</TableHead>
              <TableHead className="font-semibold text-gray-700">Data</TableHead>
              <TableHead className="hidden font-semibold text-gray-700 sm:table-cell">
                Cliente
              </TableHead>
              <TableHead className="hidden font-semibold text-gray-700 lg:table-cell">
                Itens
              </TableHead>
              <TableHead className="hidden font-semibold text-gray-700 md:table-cell">
                Tipo
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">
                Total
              </TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-gray-50">
                <TableCell className="font-mono text-xs text-gray-400">
                  #{order.id}
                </TableCell>
                <TableCell className="text-gray-600">
                  {new Date(order.date).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="hidden text-gray-500 sm:table-cell">
                  {order.customerName || "—"}
                </TableCell>
                <TableCell className="hidden text-sm text-gray-500 lg:table-cell">
                  {order.items.map((i) => i.itemName).join(", ").slice(0, 40)}
                  {order.items.length > 2 && "…"}
                </TableCell>
                <TableCell className="hidden text-gray-500 md:table-cell">
                  <span className="text-xs">
                    {typeLabels[order.type] || order.type}
                  </span>
                </TableCell>
                <TableCell className="text-right font-semibold text-gray-900">
                  {formatBRL(order.total)}
                </TableCell>
                <TableCell>
                  {order.paymentStatus === "pago" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      <CheckCircle className="size-3" />
                      Pago
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      <Clock className="size-3" />
                      Pendente
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {order.paymentStatus === "pendente" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onConfirmPayment(order.id)}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <CheckCircle className="mr-1 size-4" />
                      <span className="hidden sm:inline">Confirmar</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
