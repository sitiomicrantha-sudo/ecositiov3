"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { GlebesTable } from "@/components/areas/glebes-table";
import { GlebeForm } from "@/components/areas/glebe-form";
import { ensureDefaultProperty, getGlebesByProperty } from "@/actions/topology";
import type { properties, glebes } from "@/db/schema";

type Property = typeof properties.$inferSelect;
type Glebe = typeof glebes.$inferSelect;

const DEFAULT_PROPERTY_ID = 1;

export default function AreasPage() {
  const [property, setProperty] = useState<Property | null>(null);
  const [glebesList, setGlebesList] = useState<Glebe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [propertyResult, glebesResult] = await Promise.all([
        ensureDefaultProperty(),
        getGlebesByProperty(DEFAULT_PROPERTY_ID),
      ]);

      if (propertyResult.success) {
        setProperty(propertyResult.data);
      } else {
        toast.error(propertyResult.error);
      }

      if (glebesResult.success) {
        setGlebesList(glebesResult.data);
      } else {
        toast.error(glebesResult.error);
      }
    } catch {
      toast.error("Erro ao carregar áreas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-16 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-16 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Erro ao carregar propriedade
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Não foi possível carregar a propriedade padrão.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Áreas", href: "/areas" },
          { label: property.name },
        ]}
      />

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              {property.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Área total:{" "}
              <span className="font-medium text-gray-700">
                {Number(property.totalArea).toLocaleString("pt-BR")}{" "}
                {property.unit}
              </span>
            </p>
          </div>
          <GlebeForm propertyId={DEFAULT_PROPERTY_ID} onSuccess={loadData} />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Glebas ({glebesList.length})
        </h3>
        <GlebesTable glebesList={glebesList} propertyId={DEFAULT_PROPERTY_ID} onSuccess={loadData} />
      </div>
    </div>
  );
}
