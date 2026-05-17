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
import { Sprout, Loader2, Calendar, Info } from "lucide-react";
import {
  handleUnifiedPlantingOrPlan,
  getCropsList,
  getPlantableItems,
} from "@/actions/crop-management";
import { getActiveBedsForDossier } from "@/actions/soil-history";

const plantingFormSchema = z.object({
  cropId: z.string().min(1, "Selecione uma cultura"),
  itemId: z.string().min(1, "Selecione uma muda ou semente"),
  bedId: z.string().optional(),
  fieldId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  plannedAreaM2: z.string().regex(/^\d+(\.\d{1,2})?$/, "Área deve ser um número válido").optional(),
  notes: z.string().max(500).optional(),
});

type PlantingFormValues = z.infer<typeof plantingFormSchema>;

interface UnifiedPlantingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type CropOption = {
  id: number;
  name: string;
  cycleType: string;
  averageCycleDays: number;
  seedRequirementPerM2: string | null;
  seedlingRequirementPerM2: string | null;
};

type BedOption = {
  id: number;
  name: string;
  shortCode: string | null;
  fieldName: string | null;
  fieldShortCode: string | null;
};

type ItemOption = {
  id: number;
  name: string;
  unit: string;
  category: string;
};

export function UnifiedPlantingForm({ open, onOpenChange, onSuccess }: UnifiedPlantingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [beds, setBeds] = useState<BedOption[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<CropOption | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<PlantingFormValues>({
    resolver: zodResolver(plantingFormSchema),
    defaultValues: {
      cropId: "",
      itemId: "",
      bedId: "",
      fieldId: "",
      startDate: today,
      plannedAreaM2: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      getCropsList().then((r) => {
        if (r.success) setCrops(r.data);
      });
      getPlantableItems().then((r) => {
        if (r.success) setItems(r.data);
      });
      getActiveBedsForDossier().then((r) => {
        if (r.success) setBeds(r.data);
      });
    }
  }, [open]);

  const watchStartDate = form.watch("startDate");
  const watchCropId = form.watch("cropId");
  const watchArea = form.watch("plannedAreaM2");

  useEffect(() => {
    if (watchCropId) {
      const crop = crops.find((c) => c.id === parseInt(watchCropId, 10));
      setSelectedCrop(crop || null);
    } else {
      setSelectedCrop(null);
    }
  }, [watchCropId, crops]);

  const isFutureDate = watchStartDate && watchStartDate > today;

  let estimatedHarvestDate: string | null = null;
  if (watchStartDate && selectedCrop) {
    const start = new Date(watchStartDate + "T00:00:00");
    start.setDate(start.getDate() + selectedCrop.averageCycleDays);
    estimatedHarvestDate = start.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  let seedEstimate: string | null = null;
  let seedlingEstimate: string | null = null;
  if (watchArea && selectedCrop) {
    const area = parseFloat(watchArea);
    if (selectedCrop.seedRequirementPerM2) {
      const seedQty = area * parseFloat(selectedCrop.seedRequirementPerM2);
      seedEstimate = `${seedQty.toFixed(1)}g de sementes`;
    }
    if (selectedCrop.seedlingRequirementPerM2) {
      const seedlingQty = area * parseFloat(selectedCrop.seedlingRequirementPerM2);
      seedlingEstimate = `${Math.ceil(seedlingQty)} mudas`;
    }
  }

  async function onSubmit(values: PlantingFormValues) {
    setIsSubmitting(true);
    try {
      const result = await handleUnifiedPlantingOrPlan(values);
      if (result.success) {
        if (result.data.type === "plan") {
          toast.success("Planejamento criado! A data de colheita foi estimada automaticamente.");
        } else {
          toast.success("Plantio registrado com sucesso! O espaço foi marcado como ocupado.");
        }
        form.reset({
          cropId: "",
          itemId: "",
          bedId: "",
          fieldId: "",
          startDate: today,
          plannedAreaM2: "",
          notes: "",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao registrar plantio");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-900">
            <Sprout className="size-5 text-emerald-600" />
            Novo Plantio / Planejamento
          </DialogTitle>
          <DialogDescription>
            Registre um plantio imediato ou planeje uma safra futura.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cropId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cultura</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                        value={field.value || ""}
                      >
                        <option value="">Selecione...</option>
                        {crops.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.averageCycleDays} dias)
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
                name="itemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Muda / Semente</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                        value={field.value || ""}
                      >
                        <option value="">Selecione...</option>
                        {items.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name} ({i.category})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bedId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canteiro (opcional)</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                      value={field.value || ""}
                    >
                      <option value="">Apenas Talhão</option>
                      {beds.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.shortCode ? `[${b.shortCode}] ` : ""}{b.name}{b.fieldName ? ` — ${b.fieldName}` : ""}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    Se não selecionar, o planejamento será apenas no nível do Talhão.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plannedAreaM2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área (m²)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 12.5" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isFutureDate && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">Planejamento Futuro</p>
                    <p className="mt-1">
                      Esta data é futura. O sistema reservará este espaço no cronograma de safras.
                    </p>
                    {estimatedHarvestDate && (
                      <p className="mt-1 font-medium">
                        Colheita estimada: {estimatedHarvestDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isFutureDate && watchStartDate === today && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <div className="flex items-start gap-2">
                  <Sprout className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">Plantio Imediato</p>
                    <p className="mt-1">
                      O espaço será marcado como ocupado hoje.
                    </p>
                    {estimatedHarvestDate && (
                      <p className="mt-1 font-medium">
                        Colheita estimada: {estimatedHarvestDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(seedEstimate || seedlingEstimate) && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">Estimativa de Insumos</p>
                    <p className="mt-1">
                      {seedEstimate && <span>{seedEstimate}</span>}
                      {seedEstimate && seedlingEstimate && <span> · </span>}
                      {seedlingEstimate && <span>{seedlingEstimate}</span>}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Ex: Variedade resistente à seca..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                onClick={() => onOpenChange(false)}
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
                ) : isFutureDate ? (
                  "Criar Planejamento"
                ) : (
                  "Registrar Plantio"
                )}
              </button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
