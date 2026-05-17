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
import { receivePayment } from "@/actions/finance-receivables";
import type { ReceivableWithDetails } from "@/actions/finance-receivables";

interface ReceivablesTableProps {
  receivables: ReceivableWithDetails[];
  onReceived: () => void;
}

const formatBRL = (value: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(value));

export function ReceivablesTable({ receivables, onReceived }: ReceivablesTableProps) {
  const [receiving, setReceiving] = useState<ReceivableWithDetails | null>(null);
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [isReceiving, setIsReceiving] = useState(false);

  async function handleReceive() {
    if (!receiving) return;
    setIsReceiving(true);
    try {
      const result = await receivePayment(receiving.id, receiveDate);
      if (result.success) {
        toast.success("Recebimento confirmado! Caixa atualizado.");
        onReceived();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao confirmar recebimento");
    } finally {
      setIsReceiving(false);
      setReceiving(null);
    }
  }

  if (receivables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <Receipt className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">Nenhuma conta a receber</h3>
        <p className="mt-1 text-sm text-gray-500">
          Registre recebíveis para acompanhar entradas de caixa programadas.
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
                <TableHead className="font-semibold text-gray-700">Cliente / Pedido</TableHead>
                <TableHead className="hidden font-semibold text-gray-700 xl:table-cell">Descrição</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Valor</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receivables.map((r) => (
                <TableRow key={r.id} className="hover:bg-gray-50">
                  <TableCell>
                    <DueDateBadge dueDate={r.dueDate} status={r.status} paidDate={r.receivedDate} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {r.customerName || r.orderCustomerName || "—"}
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate text-sm text-gray-500 xl:table-cell">
                    {r.description}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    {formatBRL(r.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status !== "received" && (
                      <button
                        onClick={() => {
                          setReceiving(r);
                          setReceiveDate(new Date().toISOString().split("T")[0]);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                      >
                        <CheckCircle className="size-3" />
                        Receber
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!receiving} onOpenChange={() => setReceiving(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-900">Confirmar Recebimento</DialogTitle>
            <DialogDescription>
              {receiving && (
                <>
                  Recebendo <strong>{formatBRL(receiving.amount)}</strong> — {receiving.description}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Data do Recebimento</label>
            <input
              type="date"
              value={receiveDate}
              onChange={(e) => setReceiveDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
              onClick={() => setReceiving(null)}
              disabled={isReceiving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              onClick={handleReceive}
              disabled={isReceiving}
            >
              {isReceiving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                "Confirmar Recebimento"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
