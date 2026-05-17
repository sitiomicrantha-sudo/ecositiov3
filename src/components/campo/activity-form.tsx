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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  registerFieldActivity,
  findOrCreateEggsItem,
  getBedsWithPlantingStatus,
  getPlantableItems,
  getAllInventoryItems,
  getInputItems,
  getActiveBatchesForField,
  getItemStock,
} from "@/actions/field-activities";
import type { inventoryItems, poultryBatches } from "@/db/schema";

type InventoryItem = typeof inventoryItems.$inferSelect;
type BatchItem = typeof poultryBatches.$inferSelect;

const activityFormSchema = z.object({
  activityType: z.enum([
    "plantio",
    "colheita",
    "coleta_ovos",
    "limpeza_aviario",
    "coleta_esterco",
    "aplicacao_insumo",
    "rocagem",
    "alimentacao_racao",
    "manejo_ambiencia",
    "movimentacao_piquete",
  ]),
  bedId: z.number().int().positive().optional(),
  itemId: z.number().int().positive().optional(),
  batchId: z.number().int().positive().optional(),
  quantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Quantidade deve ser um número válido")
    .optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  notes: z.string().optional(),
  plantingStatus: z.enum(["active", "permanent"]).optional(),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

interface ActivityFormProps {
  activityType: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const activityLabels: Record<string, string> = {
  plantio: "Registrar Plantio",
  colheita: "Registrar Colheita",
  coleta_ovos: "Coleta de Ovos",
  limpeza_aviario: "Limpeza do Aviário",
  coleta_esterco: "Coleta de Esterco",
  aplicacao_insumo: "Aplicação de Insumo",
  rocagem: "Registrar Roçagem",
  alimentacao_racao: "Fornecer Ração",
  manejo_ambiencia: "Manejo de Ambiência",
  movimentacao_piquete: "Soltar no Piquete",
};

const activityDescriptions: Record<string, string> = {
  plantio: "Inicie um novo cultivo no canteiro. Isso registrará o plantio no diário e no ciclo de cultivo.",
  colheita: "Registre a colheita de um canteiro. A quantidade será adicionada automaticamente ao estoque.",
  coleta_ovos: "Registre a coleta de ovos do aviário. A quantidade será adicionada automaticamente ao estoque.",
  limpeza_aviario: "Registre a limpeza realizada no aviário.",
  coleta_esterco: "Registre a coleta de esterco para compostagem ou bioinsumos.",
  aplicacao_insumo: "Registre a aplicação de insumo em um canteiro.",
  rocagem: "Registre a roçagem realizada em um canteiro ou área.",
  alimentacao_racao: "Registre a quantidade de ração fornecida. O estoque será deduzido automaticamente.",
  manejo_ambiencia: "Registre condições de ambiência: cama do aviário, temperatura, sanidade.",
  movimentacao_piquete: "Registre qual lote foi solto em qual piquete/canteiro.",
};

const needsBed = ["plantio", "colheita", "aplicacao_insumo", "rocagem"];
const needsItem = ["plantio", "colheita", "aplicacao_insumo"];
const needsQuantity = ["colheita", "coleta_ovos", "coleta_esterco"];
const needsPlantingStatus = ["plantio"];

const needsBatch = ["alimentacao_racao", "manejo_ambiencia", "movimentacao_piquete"];
const needsItemForFeed = ["alimentacao_racao"];
const needsQuantityForFeed = ["alimentacao_racao"];
const needsBedForPiquete = ["movimentacao_piquete"];

export function ActivityForm({ activityType, open, onOpenChange, onSuccess }: ActivityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [beds, setBeds] = useState<{ id: number; name: string; shortCode: string | null }[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [stockUnit, setStockUnit] = useState<string>("");

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      activityType: "plantio",
      bedId: undefined,
      itemId: undefined,
      batchId: undefined,
      quantity: "",
      date: today,
      notes: "",
      plantingStatus: "active",
    },
  });

  useEffect(() => {
    if (open && activityType) {
      form.reset({
        activityType: activityType as ActivityFormValues["activityType"],
        bedId: undefined,
        itemId: undefined,
        batchId: undefined,
        quantity: "",
        date: today,
        notes: "",
        plantingStatus: "active",
      });
      setCurrentStock(null);
      loadOptions();
    }
  }, [open, activityType]);

  async function loadOptions() {
    setLoadingOptions(true);

    if (needsBed.includes(activityType || "")) {
      const bedsResult = await getBedsWithPlantingStatus();
      if (bedsResult.success) {
        setBeds(
          bedsResult.data.map((b) => ({ id: b.id, name: b.name, shortCode: b.shortCode }))
        );
      }
    }

    if (needsBedForPiquete.includes(activityType || "")) {
      const bedsResult = await getBedsWithPlantingStatus();
      if (bedsResult.success) {
        setBeds(
          bedsResult.data.map((b) => ({ id: b.id, name: b.name, shortCode: b.shortCode }))
        );
      }
    }

    if (activityType === "plantio") {
      const itemsResult = await getPlantableItems();
      if (itemsResult.success) {
        setItems(itemsResult.data);
      }
    } else if (activityType === "colheita" || activityType === "aplicacao_insumo") {
      const itemsResult = await getAllInventoryItems();
      if (itemsResult.success) {
        setItems(itemsResult.data);
      }
    } else if (activityType === "alimentacao_racao") {
      const itemsResult = await getInputItems();
      if (itemsResult.success) {
        setItems(itemsResult.data);
      }
    }

    if (needsBatch.includes(activityType || "")) {
      const batchesResult = await getActiveBatchesForField();
      if (batchesResult.success) {
        setBatches(batchesResult.data);
      }
    }

    setLoadingOptions(false);
  }

  async function handleItemChange(itemId: number | undefined) {
    form.setValue("itemId", itemId);
    if (itemId && activityType === "alimentacao_racao") {
      const stockResult = await getItemStock(itemId);
      if (stockResult.success) {
        setCurrentStock(stockResult.data.currentStock);
        setStockUnit(stockResult.data.unit);
      }
    } else {
      setCurrentStock(null);
    }
  }

  async function onSubmit(values: ActivityFormValues) {
    setIsSubmitting(true);

    try {
      let finalValues = { ...values };

      if (values.activityType === "coleta_ovos") {
        const eggsResult = await findOrCreateEggsItem();
        if (eggsResult.success) {
          finalValues.itemId = eggsResult.data.id;
        }
      }

      const result = await registerFieldActivity(finalValues);

      if (result.success) {
        toast.success("Atividade registrada com sucesso!");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao registrar atividade");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!activityType) return null;

  const showBed = needsBed.includes(activityType);
  const showItem = needsItem.includes(activityType);
  const showQuantity = needsQuantity.includes(activityType);
  const showPlantingStatus = needsPlantingStatus.includes(activityType);
  const showBatch = needsBatch.includes(activityType);
  const showItemForFeed = needsItemForFeed.includes(activityType);
  const showQuantityForFeed = needsQuantityForFeed.includes(activityType);
  const showBedForPiquete = needsBedForPiquete.includes(activityType);

  const isStockNegative = currentStock !== null && currentStock < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-900">
            {activityLabels[activityType] || "Registrar Atividade"}
          </DialogTitle>
          <DialogDescription>
            {activityDescriptions[activityType] || "Preencha os dados da atividade."}
          </DialogDescription>
        </DialogHeader>

        {loadingOptions ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Canteiro (Horta/SAF) */}
              {showBed && beds.length > 0 && (
                <FormField
                  control={form.control}
                  name="bedId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canteiro</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                        >
                          <option value="">Selecione o canteiro</option>
                          {beds.map((bed) => (
                            <option key={bed.id} value={bed.id}>
                              {bed.shortCode ? `[${bed.shortCode}] ${bed.name}` : bed.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {showBed && beds.length === 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Nenhum canteiro cadastrado. Crie canteiros em Topologia / Áreas primeiro.
                </div>
              )}

              {/* Item (Plantio/Colheita/Insumo) */}
              {showItem && (
                <FormField
                  control={form.control}
                  name="itemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {activityType === "plantio" ? "Muda / Semente" : "Item"}
                      </FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                        >
                          <option value="">
                            {activityType === "plantio"
                              ? "Selecione a muda ou semente"
                              : "Selecione o item"}
                          </option>
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Item de Ração (alimentacao_racao) */}
              {showItemForFeed && (
                <FormField
                  control={form.control}
                  name="itemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item de Ração</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={field.value || ""}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            handleItemChange(val);
                          }}
                        >
                          <option value="">Selecione a ração</option>
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Stock indicator for feed */}
              {showItemForFeed && currentStock !== null && (
                <div className={`rounded-lg border p-3 text-sm flex items-center gap-2 ${
                  isStockNegative
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-green-200 bg-green-50 text-green-800"
                }`}>
                  <AlertTriangle className={`size-4 shrink-0 ${isStockNegative ? "text-red-500" : "text-green-500"}`} />
                  <span>
                    Estoque atual: <strong>{currentStock} {stockUnit}</strong>
                    {isStockNegative && " (estoque negativo — registre a entrada depois)"}
                  </span>
                </div>
              )}

              {/* Quantity (Colheita/Coleta) */}
              {showQuantity && (
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {activityType === "coleta_ovos"
                          ? "Quantidade (unidades)"
                          : "Quantidade"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            activityType === "coleta_ovos" ? "Ex: 30" : "Ex: 5.5"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Quantity for Feed */}
              {showQuantityForFeed && (
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade (kg)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: 2.5"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Planting Status */}
              {showPlantingStatus && (
                <FormField
                  control={form.control}
                  name="plantingStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cultivo</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => form.setValue("plantingStatus", "active")}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                            field.value === "active"
                              ? "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          Ciclo Rápido (Horta)
                        </button>
                        <button
                          type="button"
                          onClick={() => form.setValue("plantingStatus", "permanent")}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                            field.value === "permanent"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          Perene (SAF / Árvores)
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Batch select */}
              {showBatch && batches.length > 0 && (
                <FormField
                  control={form.control}
                  name="batchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {activityType === "movimentacao_piquete" ? "Lote" : "Lote (opcional)"}
                      </FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                        >
                          <option value="">Selecione o lote</option>
                          {batches.map((batch) => (
                            <option key={batch.id} value={batch.id}>
                              {batch.batchCode} ({batch.breed})
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Bed/Piquete select for movimentacao_piquete */}
              {showBedForPiquete && beds.length > 0 && (
                <FormField
                  control={form.control}
                  name="bedId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Piquete / Canteiro</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                        >
                          <option value="">Selecione o piquete</option>
                          {beds.map((bed) => (
                            <option key={bed.id} value={bed.id}>
                              {bed.shortCode ? `[${bed.shortCode}] ${bed.name}` : bed.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
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

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {activityType === "manejo_ambiencia" ? "Observações (temperatura, cama, sanidade)" : "Observações (opcional)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          activityType === "manejo_ambiencia"
                            ? "Ex: Cama úmida, temperatura 32°C..."
                            : "Ex: Coleta em campo, Perda por geada..."
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Registrar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
