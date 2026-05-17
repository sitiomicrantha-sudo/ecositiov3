"use client";

import { useState, useEffect, useCallback } from "react";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { HarvestLabel } from "@/components/campo/harvest-label";
import { getHarvestBatches } from "@/actions/field-activities";
import { Package, Tag, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface HarvestBatch {
  id: number;
  loteCode: string;
  publicToken: string;
  bedId: number;
  plantingId: number | null;
  quantity: string | null;
  harvestedAt: Date;
  notes: string | null;
  bedName: string | null;
  bedShortCode: string | null;
  fieldName: string | null;
  glebeName: string | null;
  itemName: string | null;
}

export default function HarvestBatchesPage() {
  const [batches, setBatches] = useState<HarvestBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<HarvestBatch | null>(null);
  const [labelOpen, setLabelOpen] = useState(false);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    const result = await getHarvestBatches();
    if (result.success) {
      setBatches(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  function handleOpenLabel(batch: HarvestBatch) {
    setSelectedBatch(batch);
    setLabelOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Caderno de Campo", href: "/campo" },
          { label: "Lotes de Colheita" },
        ]}
      />

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Lotes de Colheita
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Rastreabilidade automática gerada a cada registro de colheita.
        </p>
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
          <Package className="mb-4 size-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">
            Nenhum lote gerado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Os lotes são criados automaticamente ao registrar uma colheita no Caderno de Campo.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Código do Lote</TableHead>
                <TableHead className="font-semibold text-gray-700">Produto</TableHead>
                <TableHead className="font-semibold text-gray-700">Qtd</TableHead>
                <TableHead className="font-semibold text-gray-700">Canteiro</TableHead>
                <TableHead className="font-semibold text-gray-700">Data</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id} className="hover:bg-gray-50">
                  <TableCell>
                    <span className="font-mono text-sm font-semibold text-emerald-700">
                      {batch.loteCode}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {batch.itemName || "—"}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {batch.quantity || "—"}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {batch.bedShortCode ? `[${batch.bedShortCode}] ` : ""}
                    {batch.bedName || "—"}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(batch.harvestedAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenLabel(batch)}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <Tag className="mr-1 size-4" />
                      Gerar Etiqueta
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <HarvestLabel
        open={labelOpen}
        onOpenChange={setLabelOpen}
        batch={selectedBatch ? {
          loteCode: selectedBatch.loteCode,
          publicToken: selectedBatch.publicToken,
          bedName: selectedBatch.bedName,
          bedShortCode: selectedBatch.bedShortCode,
          itemName: selectedBatch.itemName,
          harvestedAt: selectedBatch.harvestedAt,
          quantity: selectedBatch.quantity,
        } : null}
      />
    </div>
  );
}
