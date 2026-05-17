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
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { createField, updateField } from "@/actions/topology";
import type { fields } from "@/db/schema";

type Field = typeof fields.$inferSelect;

const fieldFormSchema = z.object({
  name: z
    .string()
    .min(1, "Nome do talhão é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  shortCode: z.string().max(10, "Código deve ter no máximo 10 caracteres").optional().nullable(),
  area: z
    .string()
    .min(1, "Área é obrigatória")
    .regex(/^\d+(\.\d{1,2})?$/, "Informe um número válido"),
  description: z.string().optional(),
});

type FieldFormValues = z.infer<typeof fieldFormSchema>;

interface FieldFormProps {
  glebeId: number;
  onSuccess: () => void;
  initialData?: Field | null;
}

export function FieldForm({ glebeId, onSuccess, initialData }: FieldFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      shortCode: initialData?.shortCode || "",
      area: initialData?.area ? String(initialData.area) : "",
      description: initialData?.description || "",
    },
  });

  async function onSubmit(values: FieldFormValues) {
    setIsSubmitting(true);

    try {
      const result = isEditing
        ? await updateField(initialData.id, values)
        : await createField({
            ...values,
            glebeId,
          });

      if (result.success) {
        toast.success(isEditing ? "Talhão atualizado com sucesso!" : "Talhão criado com sucesso!");
        form.reset();
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao salvar talhão");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val && initialData) {
        form.reset({
          name: initialData.name,
          shortCode: initialData.shortCode || "",
          area: String(initialData.area),
          description: initialData.description || "",
        });
      }
    }}>
      {!isEditing && (
        <DialogTrigger onClick={() => setOpen(true)}>
          <div className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
            <Plus className="mr-2 size-4" />
            Novo Talhão
          </div>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-900">
            {isEditing ? "Editar Talhão" : "Novo Talhão"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edite os dados do talhão. O código curto e a área podem ser alterados."
              : "Cadastre um novo talhão vinculado a esta gleba."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Talhão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Talhão A" {...field} />
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
                  <FormLabel>Código Curto (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: T2" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área (m²)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 1200" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cultivo de alface" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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
                    Salvando...
                  </>
                ) : (
                  isEditing ? "Atualizar" : "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
