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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Sprout } from "lucide-react";
import { createCrop, updateCrop } from "@/actions/crop-management";
import type { crops } from "@/db/schema";

const cropFormSchema = z.object({
  name: z.string().min(1, "Nome da cultura é obrigatório").max(255),
  cycleType: z.enum(["ciclo_curto", "anual", "perene"], { message: "Selecione o tipo de ciclo" }),
  averageCycleDays: z.string().regex(/^\d+$/, "Dias deve ser um número inteiro"),
  seedRequirementPerM2: z.string().regex(/^\d+(\.\d{1,4})?$/, "Valor inválido").optional().nullable(),
  seedlingRequirementPerM2: z.string().regex(/^\d+(\.\d{1,4})?$/, "Valor inválido").optional().nullable(),
});

type CropFormValues = z.infer<typeof cropFormSchema>;

interface CropFormProps {
  onSuccess: () => void;
  crop?: typeof crops.$inferSelect | null;
  triggerLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const cycleOptions = [
  { value: "ciclo_curto", label: "Ciclo Curto" },
  { value: "anual", label: "Anual" },
  { value: "perene", label: "Perene" },
];

export function CropForm({ onSuccess, crop, triggerLabel, open: controlledOpen, onOpenChange }: CropFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (v: boolean) => onOpenChange?.(v) : setInternalOpen;

  const isEdit = !!crop;

  const form = useForm<CropFormValues>({
    resolver: zodResolver(cropFormSchema),
    defaultValues: {
      name: crop?.name || "",
      cycleType: crop?.cycleType || "ciclo_curto",
      averageCycleDays: crop?.averageCycleDays?.toString() || "",
      seedRequirementPerM2: crop?.seedRequirementPerM2 || null,
      seedlingRequirementPerM2: crop?.seedlingRequirementPerM2 || null,
    },
  });

  useEffect(() => {
    if (crop && open) {
      form.reset({
        name: crop.name,
        cycleType: crop.cycleType,
        averageCycleDays: crop.averageCycleDays.toString(),
        seedRequirementPerM2: crop.seedRequirementPerM2 || null,
        seedlingRequirementPerM2: crop.seedlingRequirementPerM2 || null,
      });
    }
  }, [crop, open, form]);

  async function onSubmit(values: CropFormValues) {
    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updateCrop(crop!.id, values)
        : await createCrop(values);

      if (result.success) {
        toast.success(isEdit ? "Cultura atualizada com sucesso!" : "Cultura criada com sucesso!");
        form.reset({
          name: "",
          cycleType: "ciclo_curto",
          averageCycleDays: "",
          seedRequirementPerM2: null,
          seedlingRequirementPerM2: null,
        });
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao salvar cultura");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger onClick={() => setOpen(true)}>
        <button className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
          <Plus className="mr-2 size-4" />
          {triggerLabel || "Nova Cultura"}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-900">
            <Sprout className="size-5 text-emerald-600" />
            {isEdit ? "Editar Cultura" : "Nova Cultura"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados da cultura no catálogo botânico."
              : "Cadastre uma nova cultura com seus ciclos e demandas de plantio."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Cultura</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Milho Safrinha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cycleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Ciclo</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    >
                      <option value="">Selecione...</option>
                      {cycleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
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
              name="averageCycleDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dias Médios de Ciclo</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 90" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="seedRequirementPerM2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sementes/m² (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 5.5"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seedlingRequirementPerM2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mudas/m² (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 4"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                ) : isEdit ? (
                  "Atualizar Cultura"
                ) : (
                  "Criar Cultura"
                )}
              </button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
