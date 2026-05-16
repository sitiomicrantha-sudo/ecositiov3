"use client";

import { useState, useEffect, useCallback } from "react";
import { CustomersTable } from "@/components/crm/customers-table";
import { CustomerForm } from "@/components/crm/customer-form";
import { getCustomers, updateCustomerStatus } from "@/actions/crm";
import { Users } from "lucide-react";
import { toast } from "sonner";
import type { customers } from "@/db/schema";

type Customer = typeof customers.$inferSelect;

export default function ClientesPage() {
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getCustomers();
    if (result.success) {
      setCustomersList(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleToggleStatus(customer: Customer) {
    const newStatus = customer.status === "active" ? "inactive" : "active";
    const result = await updateCustomerStatus(customer.id, newStatus);

    if (result.success) {
      const actionLabel = newStatus === "active" ? "ativado" : "desativado";
      toast.success(`Cliente ${actionLabel} com sucesso!`);
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
            Clientes
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie seu cadastro de clientes B2C e B2B.
          </p>
        </div>
      </div>

      {/* Card Resumo */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50">
              <Users className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "..." : customersList.length}
              </p>
              <p className="text-sm font-medium text-gray-700">
                Total de Clientes Cadastrados
              </p>
            </div>
          </div>
          <CustomerForm onSuccess={fetchData} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <CustomersTable
          customers={customersList}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
}
