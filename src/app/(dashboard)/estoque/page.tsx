"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ItemsTable } from "@/components/estoque/items-table";
import { ItemForm } from "@/components/estoque/item-form";
import { TransactionsTable } from "@/components/estoque/transactions-table";
import { TransactionForm } from "@/components/estoque/transaction-form";
import { getInventoryItems, getInventoryTransactions } from "@/actions/inventory";
import type { inventoryItems, inventoryTransactions } from "@/db/schema";

type InventoryItem = typeof inventoryItems.$inferSelect;
type Transaction = typeof inventoryTransactions.$inferSelect & {
  itemName: string;
  itemUnit: string;
};

export default function EstoquePage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [itemsResult, transactionsResult] = await Promise.all([
      getInventoryItems(),
      getInventoryTransactions(),
    ]);

    if (itemsResult.success) {
      setItems(itemsResult.data);
    }

    if (transactionsResult.success) {
      setTransactions(transactionsResult.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleMoveItem(item: InventoryItem) {
    setSelectedItem(item);
    setTransactionModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Estoque / Germoplasma
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie seu banco de germoplasma e controle de estoque com rastreabilidade total.
          </p>
        </div>
        <ItemForm onSuccess={fetchData} />
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="items" className="flex-1 sm:flex-none">
            Itens em Estoque
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1 sm:flex-none">
            Histórico de Transações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            </div>
          ) : (
            <ItemsTable
              items={items}
              transactions={transactions}
              onMoveItem={handleMoveItem}
            />
          )}
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            </div>
          ) : (
            <TransactionsTable transactions={transactions} />
          )}
        </TabsContent>
      </Tabs>

      <TransactionForm
        item={selectedItem}
        open={transactionModalOpen}
        onOpenChange={setTransactionModalOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}
