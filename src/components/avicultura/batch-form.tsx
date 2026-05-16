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
import { Plus, Loader2 } from "lucide-react";
import { createPoultryBatch } from "@/actions/poultry";

const batchFormSchema = z.object({
  name: z
    .string()
    .min(1, "Nome do lote é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  breed: z.string().min(1, "Raça é obrigatória").max(255),
  purpose: z.enum(["postura", "corte", "dupla_aptidao", "matriz_genetica"], {
    message: "Selecione o propósito",
  }),
  initialQuantity: z
    .string()
    .min(1, "Quantidade é obrigatória")
    .regex(/^\d+$/, "Quantidade deve ser um número inteiro"),
  hatchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
});

type BatchFormValues = z.infer<typeof batchFormSchema>;

interface BatchFormProps {
  onSuccess: () => void;
}

export function BatchForm({ onSuccess }: BatchFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      name: "",
      breed: "",
      purpose: "postura",
      initialQuantity: "",
      hatchDate: today,
    },
  });

  async function onSubmit(values: BatchFormValues) {
    setIsSubmitting(true);

    try {
      const result = await createPoultryBatch(values);

      if (result.success) {
        toast.success("Lote criado com sucesso!");
        form.reset();
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao criar lote");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger onClick={() => setOpen(true)}>
        <div className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
          <Plus className="mr-2 size-4" />
          Novo Lote
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-900">Novo Lote</DialogTitle>
          <DialogDescription>
            Cadastre um novo lote de aves ao plantel comercial.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Lote</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Lote Poedeiras A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="breed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raça / Genética</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rhode Island Red" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Propósito</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                      >
                        <option value="postura">Postura</option>
                        <option value="corte">Corte</option>
                        <option value="dupla_aptidao">Dupla Aptidão</option>
                        <option value="matriz_genetica">Matriz Genética</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Inicial</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="hatchDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Eclosão/Nascimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
