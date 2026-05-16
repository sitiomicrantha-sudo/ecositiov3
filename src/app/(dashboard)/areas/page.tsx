"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { PropertiesTable } from "@/components/areas/properties-table";
import { PropertyForm } from "@/components/areas/property-form";
import { getProperties } from "@/actions/topology";
import type { properties } from "@/db/schema";

type Property = typeof properties.$inferSelect;

export default function AreasPage() {
  const [propertiesList, setPropertiesList] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getProperties();
      if (result.success) {
        setPropertiesList(result.data);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao carregar propriedades");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  function handleViewGlebes(propertyId: number, propertyName: string) {
    toast.info(`Glebas de "${propertyName}" - Em breve!`, {
      description: "Módulo de glebas será implementado na próxima etapa.",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Topologia / Áreas
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie a hierarquia de áreas: Propriedade → Gleba → Talhão →
            Canteiro
          </p>
        </div>
        <PropertyForm onSuccess={loadProperties} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-16 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-16 animate-pulse rounded-xl bg-gray-200" />
        </div>
      ) : (
        <PropertiesTable
          properties={propertiesList}
          onViewGlebes={handleViewGlebes}
        />
      )}
    </div>
  );
}
