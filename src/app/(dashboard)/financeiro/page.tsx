"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/finance/summary-cards";
import { TransactionsTable } from "@/components/finance/transactions-table";
import { ExpenseForm } from "@/components/finance/expense-form";
import { SaleForm } from "@/components/finance/sale-form";
import { SalesList } from "@/components/finance/sales-list";
import {
  getFinancialSummary,
  getTransactionsList,
  getSalesList,
  confirmPayment,
} from "@/actions/finance";
import { toast } from "sonner";

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

interface Sale {
  id: number;
  date: Date;
  customerName: string | null;
  itemId: number;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  paymentStatus: "pago" | "pendente";
  itemName: string | null;
}

export default function FinanceiroPage() {
  const [balance, setBalance] = useState("0");
  const [monthRevenue, setMonthRevenue] = useState("0");
  const [monthExpense, setMonthExpense] = useState("0");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [summaryResult, transactionsResult, salesResult] = await Promise.all([
      getFinancialSummary(),
      getTransactionsList(),
      getSalesList(),
    ]);

    if (summaryResult.success) {
      setBalance(summaryResult.data.balance);
      setMonthRevenue(summaryResult.data.monthRevenue);
      setMonthExpense(summaryResult.data.monthExpense);
    }

    if (transactionsResult.success) {
      setTransactions(transactionsResult.data);
    }

    if (salesResult.success) {
      setSales(salesResult.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleConfirmPayment(saleId: number) {
    const result = await confirmPayment(saleId);

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
            Financeiro & Vendas
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Controle de fluxo de caixa, vendas e faturamento do sítio.
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
                Vendas / Pedidos
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
              <SalesList
                sales={sales}
                onConfirmPayment={handleConfirmPayment}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
