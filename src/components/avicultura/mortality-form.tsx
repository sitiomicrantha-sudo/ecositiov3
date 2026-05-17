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
import { Loader2, AlertTriangle } from "lucide-react";
import { registerMortality } from "@/actions/poultry";
import type { poultryBatches } from "@/db/schema";

type Batch = typeof poultryBatches.$inferSelect;

const mortalityFormSchema = z.object({
  quantity: z
    .string()
    .min(1, "Quantidade é obrigatória")
    .regex(/^\d+$/, "Quantidade deve ser um número inteiro"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  notes: z.string().optional(),
});

type MortalityFormValues = z.infer<typeof mortalityFormSchema>;

interface MortalityFormProps {
  batch: Batch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MortalityForm({ batch, open, onOpenChange, onSuccess }: MortalityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<MortalityFormValues>({
    resolver: zodResolver(mortalityFormSchema),
    defaultValues: {
      quantity: "",
      date: today,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        quantity: "",
        date: today,
        notes: "",
      });
    }
  }, [open]);

  async function onSubmit(values: MortalityFormValues) {
    if (!batch) return;

    setIsSubmitting(true);

    try {
      const result = await registerMortality({
        batchId: batch.id,
        ...values,
      });

      if (result.success) {
        toast.success(
          `Baixa de ${values.quantity} ave(s) registrada. Lote atualizado.`
        );
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao registrar mortalidade");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!batch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-900">
            <AlertTriangle className="size-5 text-red-600" />
            Registrar Mortalidade
          </DialogTitle>
          <DialogDescription>
            Baixa de aves do lote &quot;{batch.batchCode}&quot;. A quantidade será
            deduzida do estoque atual e registrada no diário.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p>
            <strong>Quantidade atual:</strong> {batch.activeQuantity} ave(s)
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade de Aves</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo / Observações (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Predação, Doença, Causas naturais..."
                      {...field}
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
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white ring-offset-background transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Baixa"
                )}
              </button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
