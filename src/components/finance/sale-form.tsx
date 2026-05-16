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
import { Plus, Loader2, DollarSign } from "lucide-react";
import { registerSale, getItemsForSale } from "@/actions/finance";
import { getActiveCustomersForSelect } from "@/actions/crm";
import type { inventoryItems, customers } from "@/db/schema";

type InventoryItem = typeof inventoryItems.$inferSelect;
type Customer = typeof customers.$inferSelect;

const saleFormSchema = z.object({
  customerName: z.string().max(255).optional(),
  customerId: z.number().int().positive().optional(),
  itemId: z.number().int().positive("Selecione um item"),
  quantity: z
    .string()
    .min(1, "Quantidade é obrigatória")
    .regex(/^\d+(\.\d{1,2})?$/, "Quantidade deve ser um número válido"),
  unitPrice: z
    .string()
    .min(1, "Preço é obrigatório")
    .regex(/^\d+(\.\d{1,2})?$/, "Preço deve ser um número válido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  paymentStatus: z.enum(["pago", "pendente"]),
});

type SaleFormValues = z.infer<typeof saleFormSchema>;

interface SaleFormProps {
  onSuccess: () => void;
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  return (cents / 100).toFixed(2);
}

function displayCurrency(value: string): string {
  if (!value) return "";
  const num = parseFloat(value);
  if (isNaN(num)) return "";
  return formatBRL(num);
}

const ANONYMOUS_VALUE = 0;

export function SaleForm({ onSuccess }: SaleFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      customerName: "",
      customerId: undefined,
      itemId: undefined,
      quantity: "",
      unitPrice: "",
      date: today,
      paymentStatus: "pago",
    },
  });

  const quantity = form.watch("quantity");
  const unitPrice = form.watch("unitPrice");

  useEffect(() => {
    const qty = parseFloat(quantity || "0");
    const price = parseFloat(unitPrice || "0");
    if (!isNaN(qty) && !isNaN(price) && qty > 0 && price > 0) {
      setTotal(qty * price);
    } else {
      setTotal(0);
    }
  }, [quantity, unitPrice]);

  useEffect(() => {
    if (open) {
      loadOptions();
    }
  }, [open]);

  async function loadOptions() {
    setLoadingOptions(true);
    const [itemsResult, customersResult] = await Promise.all([
      getItemsForSale(),
      getActiveCustomersForSelect(),
    ]);
    if (itemsResult.success) {
      setItems(itemsResult.data);
    }
    if (customersResult.success) {
      setCustomersList(customersResult.data);
    }
    setLoadingOptions(false);
  }

  function handleCustomerSelect(value: string) {
    const numValue = Number(value);
    if (numValue === ANONYMOUS_VALUE) {
      setSelectedCustomerId(undefined);
      form.setValue("customerId", undefined);
    } else {
      setSelectedCustomerId(numValue);
      form.setValue("customerId", numValue);
      const customer = customersList.find((c) => c.id === numValue);
      if (customer) {
        form.setValue("customerName", customer.name);
      }
    }
  }

  async function onSubmit(values: SaleFormValues) {
    setIsSubmitting(true);

    try {
      const submitData = {
        ...values,
        customerId: selectedCustomerId,
      };

      const result = await registerSale(submitData);

      if (result.success) {
        const statusLabel = values.paymentStatus === "pago" ? "Venda registrada com baixa no estoque!" : "Venda registrada como pendente!";
        toast.success(statusLabel);
        form.reset();
        setSelectedCustomerId(undefined);
        setTotal(0);
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao registrar venda");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isAnonymous = selectedCustomerId === undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger onClick={() => setOpen(true)}>
        <div className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
          <Plus className="mr-2 size-4" />
          Registrar Venda
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-900">Registrar Venda</DialogTitle>
          <DialogDescription>
            Registre uma venda de produção. Se paga, baixa automática no estoque.
          </DialogDescription>
        </DialogHeader>

        {loadingOptions ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="itemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item do Estoque</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                      >
                        <option value="">Selecione o item vendido</option>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Unitário</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          value={displayCurrency(field.value || "")}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^\d]/g, "");
                            const formatted = formatCurrencyInput(raw);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {total > 0 && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">
                  <DollarSign className="size-5" />
                  <span className="text-lg font-bold">
                    Total: {formatBRL(total)}
                  </span>
                </div>
              )}

              <FormField
                control={form.control}
                name="customerId"
                render={() => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={selectedCustomerId ?? ANONYMOUS_VALUE}
                        onChange={(e) => handleCustomerSelect(e.target.value)}
                      >
                        <option value={ANONYMOUS_VALUE}>
                          Cliente não cadastrado / Anônimo
                        </option>
                        {customersList.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} ({customer.type === "b2b" ? "B2B" : "B2C"})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAnonymous && (
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cliente (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João da Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status de Pagamento</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => form.setValue("paymentStatus", "pago")}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                          field.value === "pago"
                            ? "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        Pago
                      </button>
                      <button
                        type="button"
                        onClick={() => form.setValue("paymentStatus", "pendente")}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                          field.value === "pendente"
                            ? "border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        Pendente
                      </button>
                    </div>
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
                      Registrando...
                    </>
                  ) : (
                    "Registrar Venda"
                  )}
                </button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
