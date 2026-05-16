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
import { createCustomer } from "@/actions/crm";

const customerFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  type: z.enum(["b2c", "b2b"], { message: "Selecione o tipo de cliente" }),
  email: z.string().email("E-mail inválido").max(255).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  document: z.string().max(50).optional().or(z.literal("")),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  onSuccess: () => void;
}

export function CustomerForm({ onSuccess }: CustomerFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      type: "b2c",
      email: "",
      phone: "",
      document: "",
    },
  });

  const customerType = form.watch("type");

  async function onSubmit(values: CustomerFormValues) {
    setIsSubmitting(true);

    try {
      const result = await createCustomer({
        ...values,
        email: values.email || undefined,
        phone: values.phone || undefined,
        document: values.document || undefined,
      });

      if (result.success) {
        toast.success("Cliente cadastrado com sucesso!");
        form.reset();
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao cadastrar cliente");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger onClick={() => setOpen(true)}>
        <div className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
          <Plus className="mr-2 size-4" />
          Novo Cliente
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-900">Novo Cliente</DialogTitle>
          <DialogDescription>
            Cadastre um novo cliente (B2C ou B2B) no sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome {customerType === "b2b" ? "da Empresa" : "do Cliente"}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        customerType === "b2b"
                          ? "Ex: Restaurante Sabor Verde"
                          : "Ex: João da Silva"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cliente</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => form.setValue("type", "b2c")}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        field.value === "b2c"
                          ? "border-gray-400 bg-gray-50 text-gray-700 ring-1 ring-gray-400"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      B2C (Varejo)
                    </button>
                    <button
                      type="button"
                      onClick={() => form.setValue("type", "b2b")}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        field.value === "b2b"
                          ? "border-blue-400 bg-blue-50 text-blue-700 ring-1 ring-blue-400"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      B2B (Atacado)
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: joao@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: (11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{customerType === "b2b" ? "CNPJ" : "CPF"} (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={customerType === "b2b" ? "Ex: 00.000.000/0001-00" : "Ex: 000.000.000-00"}
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
