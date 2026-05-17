"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Users, ToggleLeft, ToggleRight } from "lucide-react";
import { createSupplier, getSuppliers, updateSupplierStatus } from "@/actions/suppliers";
import type { suppliers as suppliersTable } from "@/db/schema";

const supplierFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  document: z.string().max(20).optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export default function FornecedoresPage() {
  const [supplierList, setSupplierList] = useState<typeof suppliersTable.$inferSelect[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: { name: "", document: null, email: null, phone: null },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getSuppliers();
    if (result.success) {
      setSupplierList(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function onSubmit(values: SupplierFormValues) {
    setIsSubmitting(true);
    try {
      const result = await createSupplier(values);
      if (result.success) {
        toast.success("Fornecedor criado com sucesso!");
        form.reset();
        setOpen(false);
        fetchData();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao criar fornecedor");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(id: number, currentStatus: string) {
    const newStatus = currentStatus === "ativo" ? "inativo" : "ativo";
    const result = await updateSupplierStatus(id, newStatus as "ativo" | "inativo");
    if (result.success) {
      toast.success(`Fornecedor ${newStatus === "ativo" ? "ativado" : "desativado"}`);
      fetchData();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Fornecedores</h2>
          <p className="mt-1 text-sm text-gray-500">
            Cadastro de fornecedores de insumos, rações e materiais.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger onClick={() => setOpen(true)}>
            <div className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
              <Plus className="mr-2 size-4" />
              Novo Fornecedor
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">Novo Fornecedor</DialogTitle>
              <DialogDescription>
                Cadastre um fornecedor de insumos ou materiais.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Agropecuária Central" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 12.345.678/0001-90" {...field} value={field.value || ""} />
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
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: (11) 99999-9999" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Ex: contato@fornecedor.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : supplierList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
          <Users className="mb-4 size-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum fornecedor cadastrado</h3>
          <p className="mt-1 text-sm text-gray-500">Cadastre fornecedores de insumos e materiais.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Nome</TableHead>
                  <TableHead className="hidden font-semibold text-gray-700 md:table-cell">CPF/CNPJ</TableHead>
                  <TableHead className="hidden font-semibold text-gray-700 lg:table-cell">Telefone</TableHead>
                  <TableHead className="hidden font-semibold text-gray-700 xl:table-cell">Email</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierList.map((s) => (
                  <TableRow key={s.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{s.name}</TableCell>
                    <TableCell className="hidden text-sm text-gray-600 md:table-cell">{s.document || "—"}</TableCell>
                    <TableCell className="hidden text-sm text-gray-600 lg:table-cell">{s.phone || "—"}</TableCell>
                    <TableCell className="hidden text-sm text-gray-500 xl:table-cell">{s.email || "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.status === "ativo"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleToggleStatus(s.id, s.status)}
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                      >
                        {s.status === "ativo" ? (
                          <ToggleRight className="size-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="size-5 text-gray-400" />
                        )}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
