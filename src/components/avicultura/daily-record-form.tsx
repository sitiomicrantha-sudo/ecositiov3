"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Egg, Wheat } from "lucide-react";
import { createPoultryDailyRecord } from "@/actions/poultry-operations";
import { getActivePoultryLocations } from "@/actions/poultry";
import type { poultryLocations } from "@/db/schema";
import { locationTypeLabels } from "@/lib/poultry-utils";

const dailyRecordFormSchema = z.object({
  locationId: z.number().int().positive("Local é obrigatório"),
  recordedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  eggsCollected: z.string().regex(/^\d+$/, "Número inteiro"),
  eggsBroken: z.string().regex(/^\d+$/, "Número inteiro"),
  feedConsumedKg: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valor numérico").optional().nullable(),
  notes: z.string().optional(),
});

type DailyRecordFormValues = z.infer<typeof dailyRecordFormSchema>;

interface DailyRecordFormProps {
  onSuccess: () => void;
}

export function DailyRecordForm({ onSuccess }: DailyRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<typeof poultryLocations.$inferSelect[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<DailyRecordFormValues>({
    resolver: zodResolver(dailyRecordFormSchema),
    defaultValues: {
      locationId: 0,
      recordedAt: today,
      eggsCollected: "0",
      eggsBroken: "0",
      feedConsumedKg: null,
      notes: "",
    },
  });

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    setLoadingLocations(true);
    try {
      const result = await getActivePoultryLocations();
      if (result.success) {
        setLocations(result.data);
        if (result.data.length > 0) {
          form.setValue("locationId", result.data[0].id);
        }
      }
    } catch {
      toast.error("Erro ao carregar locais");
    } finally {
      setLoadingLocations(false);
    }
  }

  async function onSubmit(values: DailyRecordFormValues) {
    setIsSubmitting(true);
    try {
      const result = await createPoultryDailyRecord(values);
      if (result.success) {
        toast.success("Registro diário salvo com sucesso!");
        form.reset({
          locationId: values.locationId,
          recordedAt: today,
          eggsCollected: "0",
          eggsBroken: "0",
          feedConsumedKg: null,
          notes: "",
        });
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao salvar registro");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Egg className="size-5 text-amber-600" />
        <h3 className="text-lg font-semibold text-gray-900">Lançamento Diário</h3>
      </div>

      {loadingLocations ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local Físico</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                      >
                        <option value={0}>Selecione o local...</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} ({locationTypeLabels[loc.locationType]})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recordedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Egg className="size-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">Coleta de Ovos</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="eggsCollected"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ovos Bons</FormLabel>
                      <FormControl>
                        <Input placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eggsBroken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trincados/Sujos</FormLabel>
                      <FormControl>
                        <Input placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Wheat className="size-4 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-800">Ração Consumida</p>
              </div>
              <FormField
                control={form.control}
                name="feedConsumedKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quilos gastos (kg)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 12.5" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Clima quente, aves agitadas..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white ring-offset-background transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar Lançamento Diário"
              )}
            </button>
          </form>
        </Form>
      )}
    </div>
  );
}
