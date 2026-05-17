"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Printer, X } from "lucide-react";

interface HarvestLabelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: {
    loteCode: string;
    publicToken: string;
    bedName: string | null;
    bedShortCode: string | null;
    itemName: string | null;
    harvestedAt: Date;
    quantity: string | null;
  } | null;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function HarvestLabel({ open, onOpenChange, batch }: HarvestLabelProps) {
  if (!batch) return null;

  const publicUrl = `${APP_URL}/p/lote/${batch.publicToken}`;

  function handlePrint() {
    window.print();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm print:max-w-none print:border-0 print:shadow-none print:p-0">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-green-900 flex items-center justify-between">
            Etiqueta de Rastreabilidade
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 print:hidden"
            >
              <X className="size-4" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="print:p-4">
          {/* Print-only header */}
          <div className="hidden print:block mb-3 text-center">
            <h1 className="text-base font-bold text-black">Sítio Micrantha</h1>
            <p className="text-xs text-gray-600">Rastreabilidade Orgânica</p>
          </div>

          <div className="space-y-4">
            {/* Product Info */}
            <div className="space-y-2">
              {batch.itemName && (
                <div>
                  <p className="text-xs text-gray-500 print:text-gray-600">Produto</p>
                  <p className="text-lg font-semibold text-gray-900 print:text-black">
                    {batch.itemName}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 print:text-gray-600">Código do Lote</p>
                <p className="text-sm font-mono font-bold text-emerald-700 print:text-black">
                  {batch.loteCode}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 print:text-gray-600">Colheita</p>
                  <p className="text-sm font-medium text-gray-900 print:text-black">
                    {new Date(batch.harvestedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {batch.quantity && (
                  <div>
                    <p className="text-xs text-gray-500 print:text-gray-600">Quantidade</p>
                    <p className="text-sm font-medium text-gray-900 print:text-black">
                      {batch.quantity}
                    </p>
                  </div>
                )}
              </div>

              {batch.bedName && (
                <div>
                  <p className="text-xs text-gray-500 print:text-gray-600">Canteiro</p>
                  <p className="text-sm font-medium text-gray-900 print:text-black">
                    {batch.bedShortCode ? `[${batch.bedShortCode}] ` : ""}{batch.bedName}
                  </p>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-2 border-t pt-4 print:border-gray-300">
              <div className="rounded-lg bg-white p-2 print:p-0">
                <QRCodeSVG
                  value={publicUrl}
                  size={160}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-gray-400 break-all text-center print:text-gray-600 print:hidden">
                {publicUrl}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-2 print:hidden">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            <Button
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handlePrint}
            >
              <Printer className="mr-2 size-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
