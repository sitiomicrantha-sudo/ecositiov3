"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useMemo } from "react";
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
import { Loader2, Pill, Leaf, Shield, AlertTriangle } from "lucide-react";
import { createPoultryHealthEvent } from "@/actions/poultry-operations";
import { getActivePoultryLocations, getActivePoultryBatches } from "@/actions/poultry";
import type { poultryLocations, poultryBatches } from "@/db/schema";
import { locationTypeLabels } from "@/lib/poultry-utils";

const healthEventFormSchema = z.object({
  batchId: z.number().int().positive().optional().nullable(),
  locationId: z.number().int().positive().optional().nullable(),
  treatmentType: z.enum(["fitoterapico_floral", "vacina_profilatica", "alopatico_comercial"], {
    message: "Selecione o tipo de tratamento",
  }),
  productName: z.string().min(1, "Nome do produto é obrigatório").max(255),
  appliedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  withdrawalDays: z.number().int().min(0),
  notes: z.string().optional(),
}).refine((data) => {
  if (!data.batchId && !data.locationId) {
    return {
      message: "Selecione um lote ou um local",
      path: ["batchId"],
    };
  }
  if (data.treatmentType === "alopatico_comercial" && (!data.withdrawalDays || data.withdrawalDays <= 0)) {
    return {
      message: "Produtos comerciais exigem dias de carência",
      path: ["withdrawalDays"],
    };
  }
  return true;
});

type HealthEventFormValues = z.infer<typeof healthEventFormSchema>;

interface HealthEventFormProps {
  onSuccess: () => void;
}

const treatmentLabels: Record<string, string> = {
  fitoterapico_floral: "Fitoterápico / Floral",
  vacina_profilatica: "Vacina Profilática",
  alopatico_comercial: "Alopático Comercial",
};

const treatmentIcons: Record<string, React.ReactNode> = {
  fitoterapico_floral: <Leaf className="size-4 text-green-600" />,
  vacina_profilatica: <Shield className="size-4 text-blue-600" />,
  alopatico_comercial: <Pill className="size-4 text-red-600" />,
};

const treatmentDescriptions: Record<string, string> = {
  fitoterapico_floral: "Produtos naturais, florais de Bach, homeopatia (sem carência)",
  vacina_profilatica: "Vacinas preventivas (geralmente sem carência)",
  alopatico_comercial: "Medicamentos químicos convencionais (exige carência)",
};

export function HealthEventForm({ onSuccess }: HealthEventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<typeof poultryLocations.$inferSelect[]>([]);
  const [batches, setBatches] = useState<typeof poultryBatches.$inferSelect[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [scopeType, setScopeType] = useState<"batch" | "location">("batch");

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<HealthEventFormValues>({
    resolver: zodResolver(healthEventFormSchema),
    defaultValues: {
      batchId: null,
      locationId: null,
      treatmentType: "fitoterapico_floral",
      productName: "",
      appliedAt: today,
      withdrawalDays: 0,
      notes: "",
    },
  });

  const watchTreatmentType = form.watch("treatmentType");
  const isAlopatico = watchTreatmentType === "alopatico_comercial";

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (isAlopatico) {
      form.setValue("withdrawalDays", 0);
    }
  }, [isAlopatico, form]);

  async function loadOptions() {
    setLoadingOptions(true);
    try {
      const [locResult, batchResult] = await Promise.all([
        getActivePoultryLocations(),
        getActivePoultryBatches(),
      ]);
      if (locResult.success) setLocations(locResult.data);
      if (batchResult.success) setBatches(batchResult.data);
      if (batchResult.success && batchResult.data.length > 0) {
        form.setValue("batchId", batchResult.data[0].id);
      }
    } catch {
      toast.error("Erro ao carregar opções");
    } finally {
      setLoadingOptions(false);
    }
  }

  async function onSubmit(values: HealthEventFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        batchId: scopeType === "batch" ? values.batchId : null,
        locationId: scopeType === "location" ? values.locationId : null,
      };

      const result = await createPoultryHealthEvent(payload);
      if (result.success) {
        toast.success("Evento de saúde registrado com sucesso!");
        form.reset({
          batchId: scopeType === "batch" ? values.batchId : null,
          locationId: scopeType === "location" ? values.locationId : null,
          treatmentType: "fitoterapico_floral",
          productName: "",
          appliedAt: today,
          withdrawalDays: 0,
          notes: "",
        });
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao registrar evento");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Pill className="size-5 text-red-600" />
        <h3 className="text-lg font-semibold text-gray-900">Registro de Saúde</h3>
      </div>

      {loadingOptions ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Scope Selection */}
            <div className="space-y-2">
              <FormLabel>Escopo do Tratamento</FormLabel>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                  <input
                    type="radio"
                    name="scopeType"
                    value="batch"
                    checked={scopeType === "batch"}
                    onChange={() => setScopeType("batch")}
                    className="accent-emerald-600"
                  />
                  Por Lote
                </label>
                <label className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                  <input
                    type="radio"
                    name="scopeType"
                    value="location"
                    checked={scopeType === "location"}
                    onChange={() => setScopeType("location")}
                    className="accent-emerald-600"
                  />
                  Por Local
                </label>
              </div>
            </div>

            {scopeType === "batch" ? (
              <FormField
                control={form.control}
                name="batchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lote</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">Selecione o lote...</option>
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.batchCode} — {b.breed}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">Selecione o local...</option>
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
            )}

            {/* Treatment Type */}
            <FormField
              control={form.control}
              name="treatmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Tratamento</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    >
                      <option value="fitoterapico_floral">🌿 Fitoterápico / Floral</option>
                      <option value="vacina_profilatica">💉 Vacina Profilática</option>
                      <option value="alopatico_comercial">💊 Alopático Comercial</option>
                    </select>
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    {treatmentDescriptions[field.value]}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Name */}
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Vermífugo Dopagran, Floral Terramicina..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Applied Date */}
            <FormField
              control={form.control}
              name="appliedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Aplicação</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Withdrawal Days - Only for Alopatico Comercial */}
            {isAlopatico && (
              <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-red-600" />
                  <p className="text-sm font-semibold text-red-800">
                    Produto Químico — Carência Obrigatória
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="withdrawalDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-800">
                        Dias de Carência (Vazio de Comercialização)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Ex: 14"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                          className="border-red-300 focus-visible:ring-red-500"
                        />
                      </FormControl>
                      <p className="text-xs text-red-600">
                        Durante este período, ovos e carne são impróprios para venda.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {!isAlopatico && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <div className="flex items-center gap-2">
                  <Leaf className="size-4 shrink-0" />
                  <p>
                    Produto natural — sem período de carência exigido.
                    Ovos e carne podem ser comercializados normalmente.
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico / Observações (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Vermifugação preventiva, diarréia..." {...field} />
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
                "Registrar Evento de Saúde"
              )}
            </button>
          </form>
        </Form>
      )}
    </div>
  );
}
