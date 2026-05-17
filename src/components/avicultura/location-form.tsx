"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Info, AlertTriangle } from "lucide-react";
import { createPoultryLocation, updatePoultryLocation, getActiveFieldsForSelect } from "@/actions/poultry";
import { calculateSuggestedCapacity, locationTypeLabels } from "@/lib/poultry-utils";
import type { poultryLocations } from "@/db/schema";

type FieldOption = {
  id: number;
  name: string;
  shortCode: string | null;
  glebeName: string | null;
  glebeShortCode: string | null;
};

const locationFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  shortCode: z.string().max(10).optional().nullable(),
  locationType: z.enum(["galpao", "piquete_rotativo", "pinteiro"], {
    message: "Selecione o tipo",
  }),
  areaM2: z.string().regex(/^\d+(\.\d{1,2})?$/, "Área deve ser um número válido").optional().nullable(),
  capacity: z.string().regex(/^\d+$/, "Capacidade deve ser um número inteiro").optional().nullable(),
  status: z.enum(["liberado", "vazio_sanitario"]),
  sanitaryVoidStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida").optional().nullable(),
  associatedFieldId: z.string().regex(/^\d+$/, "Selecione um talhão").optional().nullable(),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

interface LocationFormProps {
  location?: typeof poultryLocations.$inferSelect | null;
  onSuccess: () => void;
  triggerLabel?: string;
}

export function LocationForm({ location, onSuccess, triggerLabel }: LocationFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedCapacity, setSuggestedCapacity] = useState<number | null>(null);
  const [fields, setFields] = useState<FieldOption[]>([]);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      shortCode: null,
      locationType: "galpao",
      areaM2: null,
      capacity: null,
      status: "liberado",
      sanitaryVoidStart: null,
      associatedFieldId: null,
    },
  });

  useEffect(() => {
    if (open) {
      getActiveFieldsForSelect().then((res) => {
        if (res.success) setFields(res.data);
      });
    }
  }, [open]);

  useEffect(() => {
    if (location && open) {
      form.reset({
        name: location.name,
        shortCode: location.shortCode,
        locationType: location.locationType as "galpao" | "piquete_rotativo" | "pinteiro",
        areaM2: location.areaM2?.toString() || null,
        capacity: location.capacity?.toString() || null,
        status: location.status as "liberado" | "vazio_sanitario",
        sanitaryVoidStart: location.sanitaryVoidStart
          ? new Date(location.sanitaryVoidStart).toISOString().split("T")[0]
          : null,
        associatedFieldId: location.associatedFieldId?.toString() || null,
      });
    }
  }, [location, open, form]);

  const watchAreaM2 = form.watch("areaM2");
  const watchLocationType = form.watch("locationType");
  const watchStatus = form.watch("status");

  useEffect(() => {
    const area = watchAreaM2 ? parseFloat(watchAreaM2) : 0;
    if (area > 0 && watchLocationType) {
      const cap = calculateSuggestedCapacity(watchLocationType, area, "postura");
      setSuggestedCapacity(cap);
    } else {
      setSuggestedCapacity(null);
    }
  }, [watchAreaM2, watchLocationType]);

  async function onSubmit(values: LocationFormValues) {
    setIsSubmitting(true);

    try {
      const payload = {
        ...values,
        sanitaryVoidStart: values.status === "vazio_sanitario" ? values.sanitaryVoidStart : null,
      };

      let result;
      if (location) {
        result = await updatePoultryLocation(location.id, payload);
      } else {
        result = await createPoultryLocation(payload);
      }

      if (result.success) {
        toast.success(location ? "Local atualizado com sucesso!" : "Local criado com sucesso!");
        form.reset();
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao salvar local");
    } finally {
      setIsSubmitting(false);
    }
  }

  const capacityValue = form.watch("capacity") ? parseInt(form.watch("capacity")!, 10) : null;
  const showsCapacityWarning =
    suggestedCapacity !== null &&
    capacityValue !== null &&
    capacityValue > suggestedCapacity * 1.2;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger onClick={() => setOpen(true)}>
        <div className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
          <Plus className="mr-2 size-4" />
          {triggerLabel || "Novo Local"}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-emerald-900">
            {location ? "Editar Local" : "Novo Local Físico"}
          </DialogTitle>
          <DialogDescription>
            {location
              ? "Edite as informações do local físico."
              : "Cadastre um galpão, piquete ou pinteiro para o manejo das aves."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nome do Local</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Galpão Principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shortCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Curto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: GAL-01" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Local</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                      >
                        <option value="galpao">Galpão</option>
                        <option value="piquete_rotativo">Piquete Rotativo</option>
                        <option value="pinteiro">Pinteiro</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="associatedFieldId"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Área Vegetal Correspondente (Talhão)</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                        value={field.value || ""}
                      >
                        <option value="">Nenhum — Área independente</option>
                        {fields.map((f) => (
                          <option key={f.id} value={f.id.toString()}>
                            {f.shortCode ? `[${f.shortCode}] ` : ""}{f.name}{f.glebeName ? ` — ${f.glebeName}` : ""}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>
                      Vincule este local a um talhão para integrar o histórico de solo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="areaM2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área Útil (m²)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 50" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade Máxima (aves)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 250" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {suggestedCapacity !== null && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">
                      Sugestão Embrapa para {locationTypeLabels[watchLocationType]}
                    </p>
                    <p className="mt-1">
                      Capacidade sugerida: <strong>{suggestedCapacity} aves</strong>
                      {watchLocationType === "galpao" && (
                        <span> (base: 5 aves/m² para postura colonial)</span>
                      )}
                      {watchLocationType === "piquete_rotativo" && (
                        <span> (base: 3 m²/ave para postura em piquete)</span>
                      )}
                      {watchLocationType === "pinteiro" && (
                        <span> (base: 20 aves/m² para fase de cria)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {showsCapacityWarning && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">Atenção: Capacidade acima do recomendado</p>
                    <p className="mt-1">
                      O valor informado ({capacityValue}) excede em mais de 20% a sugestão da
                      Embrapa ({suggestedCapacity} aves). Isso pode causar estresse nas aves e
                      problemas sanitários.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                      >
                        <option value="liberado">Liberado</option>
                        <option value="vazio_sanitario">Vazio Sanitário</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchStatus === "vazio_sanitario" && (
                <FormField
                  control={form.control}
                  name="sanitaryVoidStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início do Vazio Sanitário</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter className="pt-4">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white ring-offset-background transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
