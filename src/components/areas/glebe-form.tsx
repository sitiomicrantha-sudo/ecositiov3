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
import { createGlebe, updateGlebe } from "@/actions/topology";
import type { glebes } from "@/db/schema";

type Glebe = typeof glebes.$inferSelect;

const glebeFormSchema = z.object({
  name: z
    .string()
    .min(1, "Nome da gleba é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  shortCode: z.string().max(10, "Código deve ter no máximo 10 caracteres").optional().nullable(),
  area: z
    .string()
    .min(1, "Área é obrigatória")
    .regex(/^\d+(\.\d{1,2})?$/, "Informe um número válido"),
  description: z.string().optional(),
});

type GlebeFormValues = z.infer<typeof glebeFormSchema>;

interface GlebeFormProps {
  propertyId: number;
  onSuccess: () => void;
  initialData?: Glebe | null;
}

export function GlebeForm({ propertyId, onSuccess, initialData }: GlebeFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<GlebeFormValues>({
    resolver: zodResolver(glebeFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      shortCode: initialData?.shortCode || "",
      area: initialData?.area ? String(initialData.area) : "",
      description: initialData?.description || "",
    },
  });

  async function onSubmit(values: GlebeFormValues) {
    setIsSubmitting(true);

    try {
      const result = isEditing
        ? await updateGlebe(initialData.id, values)
        : await createGlebe({
            ...values,
            propertyId,
          });

      if (result.success) {
        toast.success(isEditing ? "Gleba atualizada com sucesso!" : "Gleba criada com sucesso!");
        form.reset();
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao salvar gleba");
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
            Nova Gleba
          </div>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-900">
            {isEditing ? "Editar Gleba" : "Nova Gleba"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edite os dados da gleba. O código curto e a área podem ser alterados."
              : "Cadastre uma nova gleba vinculada a esta propriedade."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Gleba</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Gleba Norte" {...field} />
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
                    <Input placeholder="Ex: G1" {...field} value={field.value || ""} />
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
                    <Input placeholder="Ex: 5000" {...field} />
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
                    <Input placeholder="Ex: Área de cultivo principal" {...field} />
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
