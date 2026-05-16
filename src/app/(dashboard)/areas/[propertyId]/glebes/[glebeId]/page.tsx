"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { FieldsTable } from "@/components/areas/fields-table";
import { FieldForm } from "@/components/areas/field-form";
import {
  getPropertyById,
  getGlebeById,
  getFieldsByGlebe,
} from "@/actions/topology";
import type { glebes, fields } from "@/db/schema";

type Glebe = typeof glebes.$inferSelect;
type Field = typeof fields.$inferSelect;

export default function GlebeDetailPage() {
  const params = useParams();
  const propertyId = Number(params.propertyId);
  const glebeId = Number(params.glebeId);

  const [glebe, setGlebe] = useState<Glebe | null>(null);
  const [propertyName, setPropertyName] = useState<string>("");
  const [fieldsList, setFieldsList] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [propertyResult, glebeResult, fieldsResult] = await Promise.all([
        getPropertyById(propertyId),
        getGlebeById(glebeId),
        getFieldsByGlebe(glebeId),
      ]);

      if (propertyResult.success) {
        setPropertyName(propertyResult.data.name);
      }

      if (glebeResult.success) {
        setGlebe(glebeResult.data);
      } else {
        toast.error(glebeResult.error);
      }

      if (fieldsResult.success) {
        setFieldsList(fieldsResult.data);
      } else {
        toast.error(fieldsResult.error);
      }
    } catch {
      toast.error("Erro ao carregar dados da gleba");
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, glebeId]);

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

  if (!glebe) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Gleba não encontrada
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          A gleba solicitada não existe ou foi removida.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Áreas", href: "/areas" },
          { label: propertyName, href: `/areas/${propertyId}` },
          { label: glebe.name },
        ]}
      />

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              {glebe.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Área:{" "}
              <span className="font-medium text-gray-700">
                {Number(glebe.area).toLocaleString("pt-BR")} m²
              </span>
              {glebe.description && (
                <span className="ml-2 text-gray-400">
                  • {glebe.description}
                </span>
              )}
            </p>
          </div>
          <FieldForm glebeId={glebeId} onSuccess={loadData} />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Talhões ({fieldsList.length})
        </h3>
        <FieldsTable
          fieldsList={fieldsList}
          glebeId={glebeId}
          propertyId={propertyId}
        />
      </div>
    </div>
  );
}
