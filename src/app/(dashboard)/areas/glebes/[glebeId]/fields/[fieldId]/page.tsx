"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { BedsTable } from "@/components/areas/beds-table";
import { BedForm } from "@/components/areas/bed-form";
import {
  ensureDefaultProperty,
  getGlebeById,
  getFieldById,
  getBedsByField,
} from "@/actions/topology";
import type { fields, beds } from "@/db/schema";

type Field = typeof fields.$inferSelect;
type Bed = typeof beds.$inferSelect;

export default function FieldDetailPage() {
  const params = useParams();
  const glebeId = Number(params.glebeId);
  const fieldId = Number(params.fieldId);

  const [field, setField] = useState<Field | null>(null);
  const [propertyName, setPropertyName] = useState<string>("");
  const [glebeName, setGlebeName] = useState<string>("");
  const [bedsList, setBedsList] = useState<Bed[]>([]);
  const [archivedBeds, setArchivedBeds] = useState<Bed[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [propertyResult, glebeResult, fieldResult, bedsResult, archivedResult] =
        await Promise.all([
          ensureDefaultProperty(),
          getGlebeById(glebeId),
          getFieldById(fieldId),
          getBedsByField(fieldId, "active"),
          getBedsByField(fieldId, "archived"),
        ]);

      if (propertyResult.success) {
        setPropertyName(propertyResult.data.name);
      }

      if (glebeResult.success) {
        setGlebeName(glebeResult.data.name);
      }

      if (fieldResult.success) {
        setField(fieldResult.data);
      } else {
        toast.error(fieldResult.error);
      }

      if (bedsResult.success) {
        setBedsList(bedsResult.data);
      } else {
        toast.error(bedsResult.error);
      }

      if (archivedResult.success) {
        setArchivedBeds(archivedResult.data);
      }
    } catch {
      toast.error("Erro ao carregar dados do talhão");
    } finally {
      setIsLoading(false);
    }
  }, [glebeId, fieldId]);

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

  if (!field) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Talhão não encontrado
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          O talhão solicitado não existe ou foi removido.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Áreas", href: "/areas" },
          { label: propertyName, href: "/areas" },
          { label: "Glebas", href: "/areas" },
          { label: glebeName, href: `/areas/glebes/${glebeId}` },
          { label: "Talhões", href: `/areas/glebes/${glebeId}` },
          { label: field.name },
        ]}
      />

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              {field.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Área:{" "}
              <span className="font-medium text-gray-700">
                {Number(field.area).toLocaleString("pt-BR")} m²
              </span>
              {field.description && (
                <span className="ml-2 text-gray-400">
                  • {field.description}
                </span>
              )}
            </p>
          </div>
          <BedForm fieldId={fieldId} onSuccess={loadData} />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Canteiros ({bedsList.length})
        </h3>
        <BedsTable bedsList={bedsList} archivedList={archivedBeds} fieldId={fieldId} onSuccess={loadData} />
      </div>
    </div>
  );
}
