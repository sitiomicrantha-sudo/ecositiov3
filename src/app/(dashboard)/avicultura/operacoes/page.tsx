"use client";

import { useState, useEffect, useCallback } from "react";
import { getRecentDailyRecords } from "@/actions/poultry-operations";
import { DailyRecordForm } from "@/components/avicultura/daily-record-form";
import { HealthEventForm } from "@/components/avicultura/health-event-form";
import { DailyRecordsTable } from "@/components/avicultura/daily-records-table";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { poultryDailyRecords, poultryLocations } from "@/db/schema";

type DailyRecord = typeof poultryDailyRecords.$inferSelect & {
  location: typeof poultryLocations.$inferSelect | null;
};

export default function OperacoesPage() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"daily" | "health">("daily");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRecentDailyRecords(30);
      if (result.success) {
        setRecords(result.data);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao carregar registros");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Avicultura", href: "/avicultura" },
          { label: "Manejo Diário" },
        ]}
      />

      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
          <ClipboardList className="size-6 text-emerald-600" />
          Manejo Diário
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Registre a produção diária de ovos, consumo de ração e eventos de saúde do plantel.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        <button
          onClick={() => setActiveTab("daily")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "daily"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🥚 Lançamento Diário
        </button>
        <button
          onClick={() => setActiveTab("health")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "health"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          💊 Registro de Saúde
        </button>
      </div>

      {/* Forms */}
      {activeTab === "daily" ? (
        <DailyRecordForm onSuccess={fetchRecords} />
      ) : (
        <HealthEventForm onSuccess={fetchRecords} />
      )}

      {/* Recent Records Table */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-gray-900">Registros Recentes</h3>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        ) : (
          <DailyRecordsTable records={records} />
        )}
      </div>
    </div>
  );
}
