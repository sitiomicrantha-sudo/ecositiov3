"use client";

import { useState } from "react";
import { Plus, Minus, Trash2, User, Truck, Store } from "lucide-react";

interface CartItem {
  itemId: number;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface CartProps {
  items: CartItem[];
  customers: { id: number; name: string }[];
  orderType: "balcao" | "delivery";
  paymentMethod: "pix" | "dinheiro" | "cartao" | "pendente";
  selectedCustomerId: number | null;
  deliveryFee: string;
  onQuantityChange: (itemId: number, delta: number) => void;
  onRemoveItem: (itemId: number) => void;
  onOrderTypeChange: (type: "balcao" | "delivery") => void;
  onPaymentMethodChange: (method: "pix" | "dinheiro" | "cartao" | "pendente") => void;
  onCustomerChange: (customerId: number | null) => void;
  onDeliveryFeeChange: (fee: string) => void;
  onCheckout: () => void;
}

export function Cart({
  items,
  customers,
  orderType,
  paymentMethod,
  selectedCustomerId,
  deliveryFee,
  onQuantityChange,
  onRemoveItem,
  onOrderTypeChange,
  onPaymentMethodChange,
  onCustomerChange,
  onDeliveryFeeChange,
  onCheckout,
}: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const fee = parseFloat(deliveryFee) || 0;
  const total = subtotal + fee;

  const paymentMethods: { value: "pix" | "dinheiro" | "cartao" | "pendente"; label: string; icon: string }[] = [
    { value: "pix", label: "PIX", icon: "⚡" },
    { value: "cartao", label: "Cartão", icon: "💳" },
    { value: "dinheiro", label: "Dinheiro", icon: "💵" },
    { value: "pendente", label: "Pendente", icon: "⏳" },
  ];

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header: Cliente + Tipo */}
      <div className="space-y-3 border-b border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <User className="size-4 text-gray-400" />
          <select
            value={selectedCustomerId || ""}
            onChange={(e) => onCustomerChange(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Cliente (opcional)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onOrderTypeChange("balcao")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              orderType === "balcao"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <Store className="size-3.5" />
            Balcão
          </button>
          <button
            type="button"
            onClick={() => onOrderTypeChange("delivery")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              orderType === "delivery"
                ? "border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <Truck className="size-3.5" />
            Delivery
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-gray-400">Carrinho vazio</p>
            <p className="mt-1 text-xs text-gray-300">Clique nos produtos para adicionar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.itemId} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      R$ {item.unitPrice.toFixed(2).replace(".", ",")} / {item.unit === "unit" ? "un" : item.unit}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    R$ {(item.quantity * item.unitPrice).toFixed(2).replace(".", ",")}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onQuantityChange(item.itemId, -1)}
                      className="flex size-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onQuantityChange(item.itemId, 1)}
                      className="flex size-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.itemId)}
                    className="flex size-7 items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Totals + Payment + Checkout */}
      <div className="border-t border-gray-200 bg-white p-4 space-y-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
          </div>
          {orderType === "delivery" && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600">Taxa de Entrega</span>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) => onDeliveryFeeChange(e.target.value)}
                  className="w-24 rounded-md border border-gray-200 py-1.5 pl-7 pr-2 text-right text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
            <span>Total</span>
            <span className="text-emerald-700">R$ {total.toFixed(2).replace(".", ",")}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-4 gap-2">
          {paymentMethods.map((pm) => (
            <button
              key={pm.value}
              type="button"
              onClick={() => onPaymentMethodChange(pm.value)}
              className={`flex flex-col items-center justify-center rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                paymentMethod === pm.value
                  ? pm.value === "pendente"
                    ? "border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500"
                    : "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <span className="text-base">{pm.icon}</span>
              <span className="mt-0.5">{pm.label}</span>
            </button>
          ))}
        </div>

        {/* Checkout Button */}
        <button
          type="button"
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
        >
          {items.length === 0
            ? "Adicione itens ao carrinho"
            : `Finalizar Venda — R$ ${total.toFixed(2).replace(".", ",")}`}
        </button>
      </div>
    </div>
  );
}
