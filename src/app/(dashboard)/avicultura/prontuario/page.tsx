"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllHealthEvents, getActiveWithdrawalAlerts } from "@/actions/poultry-operations";
import { HealthEventsTable } from "@/components/avicultura/health-events-table";
import { WithdrawalAlertBanner } from "@/components/avicultura/withdrawal-alert";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { Pill, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { poultryHealthEvents, poultryBatches, poultryLocations } from "@/db/schema";

type HealthEvent = typeof poultryHealthEvents.$inferSelect & {
  batch: typeof poultryBatches.$inferSelect | null;
  location: typeof poultryLocations.$inferSelect | null;
};

export default function ProntuarioPage() {
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsResult] = await Promise.all([
        getAllHealthEvents(),
      ]);

      if (eventsResult.success) {
        setEvents(eventsResult.data);
      } else {
        toast.error(eventsResult.error);
      }
    } catch {
      toast.error("Erro ao carregar prontuário");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Avicultura", href: "/avicultura" },
          { label: "Prontuário Sanitário" },
        ]}
      />

      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
          <Pill className="size-6 text-red-600" />
          Prontuário Sanitário
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Histórico completo de tratamentos, vacinas e aplicações de medicamentos do plantel.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
        </div>
      ) : (
        <HealthEventsTable events={events} />
      )}
    </div>
  );
}
