"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Receipt } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface WhatsAppReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: number;
    date: Date;
    customerName: string | null;
    type: "balcao" | "delivery";
    paymentMethod: string;
    deliveryFee: string;
    subtotal: string;
    total: string;
    items: OrderItem[];
  } | null;
}

const paymentLabels: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  pendente: "Pendente",
};

export function WhatsAppReceipt({ open, onOpenChange, order }: WhatsAppReceiptProps) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const dateStr = new Date(order.date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const paymentLabel = paymentLabels[order.paymentMethod] || order.paymentMethod;
  const paymentStatusIcon = order.paymentMethod === "pendente" ? "⏳" : "✅";

  const receiptText = `🌿 *Sítio Micrantha - Pedido #${order.id}*
📅 ${dateStr}
${order.customerName ? `👤 ${order.customerName}` : "👤 Cliente não identificado"}
${order.type === "delivery" ? "🚚 Delivery" : "🏪 Balcão"}

🛒 *Itens:*
${order.items.map((item) => `${item.quantity}x ${item.name} ........... R$ ${item.totalPrice.toFixed(2).replace(".", ",")}`).join("\n")}

📦 Subtotal: R$ ${parseFloat(order.subtotal).toFixed(2).replace(".", ",")}
${order.type === "delivery" && parseFloat(order.deliveryFee) > 0 ? `🛵 Taxa de Entrega: R$ ${parseFloat(order.deliveryFee).toFixed(2).replace(".", ",")}` : ""}
━━━━━━━━━━━━━━━━━━━━━
💰 *Total: R$ ${parseFloat(order.total).toFixed(2).replace(".", ",")}*

💳 Pagamento: ${paymentLabel} ${paymentStatusIcon}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopied(true);
      toast.success("Cupom copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar. Tente selecionar o texto manualmente.");
    }
  }

  const linePad = 28;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-900">
            <Receipt className="size-5" />
            Cupom do Pedido #{order.id}
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Preview */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-800">
          <p className="text-center text-sm font-bold">🌿 Sítio Micrantha</p>
          <p className="text-center text-xs text-gray-500">Pedido #{order.id}</p>
          <div className="my-2 border-t border-gray-300" />

          <p>📅 {dateStr}</p>
          <p>👤 {order.customerName || "Cliente não identificado"}</p>
          <p>{order.type === "delivery" ? "🚚 Delivery" : "🏪 Balcão"}</p>

          <div className="my-2 border-t border-gray-300" />
          <p className="font-bold">🛒 Itens:</p>
          {order.items.map((item, i) => (
            <p key={i} className="flex justify-between">
              <span>{item.quantity}x {item.name}</span>
              <span className="ml-2">R$ {item.totalPrice.toFixed(2).replace(".", ",")}</span>
            </p>
          ))}

          <div className="my-2 border-t border-gray-300" />
          <p className="flex justify-between">
            <span>📦 Subtotal:</span>
            <span>R$ {parseFloat(order.subtotal).toFixed(2).replace(".", ",")}</span>
          </p>
          {order.type === "delivery" && parseFloat(order.deliveryFee) > 0 && (
            <p className="flex justify-between">
              <span>🛵 Taxa Entrega:</span>
              <span>R$ {parseFloat(order.deliveryFee).toFixed(2).replace(".", ",")}</span>
            </p>
          )}
          <div className="my-2 border-t border-gray-300" />
          <p className="flex justify-between font-bold text-emerald-700">
            <span>💰 Total:</span>
            <span>R$ {parseFloat(order.total).toFixed(2).replace(".", ",")}</span>
          </p>

          <div className="my-2 border-t border-gray-300" />
          <p>
            💳 Pagamento: {paymentLabel} {paymentStatusIcon}
          </p>
        </div>

        {/* Copy Button */}
        <Button
          onClick={handleCopy}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {copied ? (
            <>
              <Check className="mr-2 size-4" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="mr-2 size-4" />
              Copiar para WhatsApp
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
