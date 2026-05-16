"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/finance/summary-cards";
import { TransactionsTable } from "@/components/finance/transactions-table";
import { ExpenseForm } from "@/components/finance/expense-form";
import { SaleForm } from "@/components/finance/sale-form";
import { OrdersList } from "@/components/finance/sales-list";
import {
  getFinancialSummary,
  getTransactionsList,
  getOrdersList,
  confirmOrderPayment,
} from "@/actions/finance";
import { toast } from "sonner";

interface Transaction {
  id: number;
  date: Date;
  type: "revenue" | "expense";
  category: string;
  amount: string;
  description: string;
  orderId: number | null;
  orderCustomerName: string | null;
  costCenterName: string | null;
}

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

export default function FinanceiroPage() {
  const [balance, setBalance] = useState("0");
  const [monthRevenue, setMonthRevenue] = useState("0");
  const [monthExpense, setMonthExpense] = useState("0");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [summaryResult, transactionsResult, ordersResult] = await Promise.all([
      getFinancialSummary(),
      getTransactionsList(),
      getOrdersList(),
    ]);

    if (summaryResult.success) {
      setBalance(summaryResult.data.balance);
      setMonthRevenue(summaryResult.data.monthRevenue);
      setMonthExpense(summaryResult.data.monthExpense);
    }

    if (transactionsResult.success) {
      setTransactions(transactionsResult.data);
    }

    if (ordersResult.success) {
      setOrders(ordersResult.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleConfirmPayment(orderId: number) {
    const result = await confirmOrderPayment(orderId);

    if (result.success) {
      toast.success("Pagamento confirmado! Estoque e caixa atualizados.");
      fetchData();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Financeiro & Pedidos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Controle de fluxo de caixa, pedidos e faturamento do sítio.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <SummaryCards
            balance={balance}
            monthRevenue={monthRevenue}
            monthExpense={monthExpense}
          />

          <Tabs defaultValue="cashflow" className="w-full">
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="cashflow" className="flex-1 sm:flex-none">
                Fluxo de Caixa
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex-1 sm:flex-none">
                Pedidos / Vendas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cashflow" className="mt-6">
              <div className="mb-4">
                <ExpenseForm onSuccess={fetchData} />
              </div>
              <TransactionsTable transactions={transactions} />
            </TabsContent>

            <TabsContent value="sales" className="mt-6">
              <div className="mb-4">
                <SaleForm onSuccess={fetchData} />
              </div>
              <OrdersList
                orders={orders}
                onConfirmPayment={handleConfirmPayment}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
