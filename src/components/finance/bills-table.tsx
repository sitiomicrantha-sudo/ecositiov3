"use client";

import { useState } from "react";
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
} from "@/components/ui/dialog";
import { Receipt, Loader2, CheckCircle } from "lucide-react";
import { DueDateBadge } from "./due-date-badge";
import { payBill } from "@/actions/finance-bills";
import type { BillWithDetails } from "@/actions/finance-bills";

interface BillsTableProps {
  bills: BillWithDetails[];
  onPaid: () => void;
}

const formatBRL = (value: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(value));

const categoryLabels: Record<string, string> = {
  "Ração": "Ração",
  "Mudas": "Mudas",
  "Sementes": "Sementes",
  "MEI": "MEI",
  "Combustível": "Combustível",
  "Ferramentas": "Ferramentas",
  "Energia": "Energia",
  "Manutenção": "Manutenção",
  "Outros": "Outros",
};

export function BillsTable({ bills, onPaid }: BillsTableProps) {
  const [payingBill, setPayingBill] = useState<BillWithDetails | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [isPaying, setIsPaying] = useState(false);

  async function handlePay() {
    if (!payingBill) return;
    setIsPaying(true);
    try {
      const result = await payBill(payingBill.id, payDate);
      if (result.success) {
        toast.success("Conta marcada como paga! Caixa atualizado.");
        onPaid();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao pagar conta");
    } finally {
      setIsPaying(false);
      setPayingBill(null);
    }
  }

  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <Receipt className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">Nenhuma conta a pagar</h3>
        <p className="mt-1 text-sm text-gray-500">
          Registre contas a pagar para acompanhar suas obrigações financeiras.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Vencimento</TableHead>
                <TableHead className="font-semibold text-gray-700">Fornecedor</TableHead>
                <TableHead className="hidden font-semibold text-gray-700 md:table-cell">Centro</TableHead>
                <TableHead className="hidden font-semibold text-gray-700 lg:table-cell">Categoria</TableHead>
                <TableHead className="hidden font-semibold text-gray-700 xl:table-cell">Descrição</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Valor</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id} className="hover:bg-gray-50">
                  <TableCell>
                    <DueDateBadge dueDate={bill.dueDate} status={bill.status} paidDate={bill.paidDate} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {bill.supplierName || "—"}
                  </TableCell>
                  <TableCell className="hidden text-gray-600 md:table-cell">
                    <span className="text-xs font-medium rounded-full bg-gray-100 px-2 py-0.5">
                      {bill.costCenterName || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-sm text-gray-600 lg:table-cell">
                    {categoryLabels[bill.category] || bill.category}
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate text-sm text-gray-500 xl:table-cell">
                    {bill.description}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    {formatBRL(bill.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {bill.status !== "paid" && (
                      <button
                        onClick={() => {
                          setPayingBill(bill);
                          setPayDate(new Date().toISOString().split("T")[0]);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-green-700"
                      >
                        <CheckCircle className="size-3" />
                        Pagar
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!payingBill} onOpenChange={() => setPayingBill(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-900">Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              {payingBill && (
                <>
                  Pagando <strong>{formatBRL(payingBill.amount)}</strong> — {payingBill.description}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Data do Pagamento</label>
            <input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
              onClick={() => setPayingBill(null)}
              disabled={isPaying}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              onClick={handlePay}
              disabled={isPaying}
            >
              {isPaying ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                "Confirmar Pagamento"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
