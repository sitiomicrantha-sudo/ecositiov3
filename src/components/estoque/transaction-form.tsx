"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
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
import { Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { createInventoryTransaction } from "@/actions/inventory";
import type { inventoryItems } from "@/db/schema";

type InventoryItem = typeof inventoryItems.$inferSelect;

const transactionFormSchema = z.object({
  type: z.enum(["entry", "exit"], {
    message: "Selecione o tipo de movimentação",
  }),
  quantity: z
    .string()
    .min(1, "Quantidade é obrigatória")
    .regex(/^\d+(\.\d{1,2})?$/, "Quantidade deve ser um número válido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TransactionForm({ item, open, onOpenChange, onSuccess }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "entry",
      quantity: "",
      date: today,
      notes: "",
    },
  });

  async function onSubmit(values: TransactionFormValues) {
    if (!item) return;

    setIsSubmitting(true);

    try {
      const result = await createInventoryTransaction({
        itemId: item.id,
        type: values.type,
        quantity: values.quantity,
        date: values.date,
        notes: values.notes,
      });

      if (result.success) {
        const typeLabel = values.type === "entry" ? "Entrada" : "Saída";
        toast.success(`${typeLabel} de ${values.quantity} registrado com sucesso!`);
        form.reset({
          type: "entry",
          quantity: "",
          date: today,
          notes: "",
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao registrar movimentação");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-900">
            Movimentar: {item.name}
          </DialogTitle>
          <DialogDescription>
            Registre uma entrada ou saída de estoque.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Movimentação</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => form.setValue("type", "entry")}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                        field.value === "entry"
                          ? "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <ArrowDownLeft className="size-4" />
                      Entrada
                    </button>
                    <button
                      type="button"
                      onClick={() => form.setValue("type", "exit")}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                        field.value === "exit"
                          ? "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <ArrowUpRight className="size-4" />
                      Saída
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 50" {...field} />
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
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo / Notas (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Coleta em campo, Perda por geada..."
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
      </DialogContent>
    </Dialog>
  );
}
