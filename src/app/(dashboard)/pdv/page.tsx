"use client";

import { useState, useEffect, useCallback } from "react";
import { ProductGrid } from "@/components/pos/product-grid";
import { Cart } from "@/components/pos/cart";
import { WhatsAppReceipt } from "@/components/pos/whatsapp-receipt";
import { getPOSProducts, getPOSCustomers, createPOSOrder, getRecentOrders } from "@/actions/pos";
import { toast } from "sonner";
import { ShoppingCart, Clock } from "lucide-react";

interface Product {
  id: number;
  name: string;
  unit: string;
  basePrice: string | null;
  currentStock: number;
}

interface CartItem {
  itemId: number;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface OrderForReceipt {
  id: number;
  date: Date;
  customerName: string | null;
  type: "balcao" | "delivery";
  paymentMethod: string;
  deliveryFee: string;
  subtotal: string;
  total: string;
  items: { name: string; quantity: number; unitPrice: number; totalPrice: number }[];
}

export default function PDVPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderType, setOrderType] = useState<"balcao" | "delivery">("balcao");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "dinheiro" | "cartao" | "pendente">("pix");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState("0.00");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<OrderForReceipt | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [productsResult, customersResult] = await Promise.all([
      getPOSProducts(),
      getPOSCustomers(),
    ]);

    if (productsResult.success) {
      setProducts(productsResult.data);
    }

    if (customersResult.success) {
      setCustomers(customersResult.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleAddToCart(product: Product) {
    const price = product.basePrice ? parseFloat(product.basePrice) : 0;
    if (price <= 0) {
      toast.warning(`${product.name} não tem preço definido.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.itemId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.itemId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { itemId: product.id, name: product.name, unit: product.unit, quantity: 1, unitPrice: price }];
    });
  }

  function handleQuantityChange(itemId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.itemId === itemId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function handleRemoveItem(itemId: number) {
    setCart((prev) => prev.filter((item) => item.itemId !== itemId));
  }

  async function handleCheckout() {
    if (cart.length === 0) return;

    setSubmitting(true);

    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

    const result = await createPOSOrder({
      customerId: selectedCustomerId,
      customerName: selectedCustomer?.name || null,
      type: orderType,
      paymentMethod,
      items: cart.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toFixed(2),
      })),
      deliveryFee: orderType === "delivery" ? deliveryFee : "0.00",
    });

    setSubmitting(false);

    if (result.success) {
      const orderData = result.data;
      setReceiptOrder({
        id: orderData.id,
        date: orderData.date,
        customerName: orderData.customerName,
        type: orderData.type as "balcao" | "delivery",
        paymentMethod: orderData.paymentMethod,
        deliveryFee: orderData.deliveryFee,
        subtotal: orderData.subtotal,
        total: orderData.total,
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      });
      setReceiptOpen(true);
      setCart([]);
      fetchData();
      toast.success("Pedido criado com sucesso!");
    } else {
      toast.error(result.error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <ShoppingCart className="size-6 text-emerald-600" />
            PDV - Ponto de Venda
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Frente de caixa para vendas no balcão e delivery.
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-12rem)] gap-4">
        {/* Left: Product Catalog */}
        <div className="flex-1 rounded-xl border bg-white p-4 shadow-sm overflow-hidden">
          <ProductGrid
            products={products}
            onAddToCart={handleAddToCart}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Right: Cart */}
        <div className="w-[420px] rounded-xl border bg-white shadow-sm overflow-hidden">
          <Cart
            items={cart}
            customers={customers}
            orderType={orderType}
            paymentMethod={paymentMethod}
            selectedCustomerId={selectedCustomerId}
            deliveryFee={deliveryFee}
            onQuantityChange={handleQuantityChange}
            onRemoveItem={handleRemoveItem}
            onOrderTypeChange={setOrderType}
            onPaymentMethodChange={setPaymentMethod}
            onCustomerChange={setSelectedCustomerId}
            onDeliveryFeeChange={setDeliveryFee}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* WhatsApp Receipt Modal */}
      <WhatsAppReceipt
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        order={receiptOrder}
      />
    </div>
  );
}
