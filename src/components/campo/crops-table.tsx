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
import { Sprout, Pencil, Archive, RefreshCw, Loader2 } from "lucide-react";
import { archiveCrop, restoreCrop } from "@/actions/crop-management";
import { CropForm } from "./crop-form";
import type { crops } from "@/db/schema";

interface CropsTableProps {
  crops: typeof crops.$inferSelect[];
  onRefresh: () => void;
}

const cycleLabels: Record<string, string> = {
  ciclo_curto: "Ciclo Curto",
  anual: "Anual",
  perene: "Perene",
};

export function CropsTable({ crops: cropsList, onRefresh }: CropsTableProps) {
  const [editingCrop, setEditingCrop] = useState<typeof crops.$inferSelect | null>(null);
  const [archivingCrop, setArchivingCrop] = useState<typeof crops.$inferSelect | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  async function handleArchive() {
    if (!archivingCrop) return;
    setIsActionLoading(true);
    try {
      const result = await archiveCrop(archivingCrop.id);
      if (result.success) {
        toast.success("Cultura arquivada com sucesso!");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao arquivar cultura");
    } finally {
      setIsActionLoading(false);
      setArchivingCrop(null);
    }
  }

  async function handleRestore(id: number) {
    setIsActionLoading(true);
    try {
      const result = await restoreCrop(id);
      if (result.success) {
        toast.success("Cultura restaurada com sucesso!");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao restaurar cultura");
    } finally {
      setIsActionLoading(false);
    }
  }

  if (cropsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <Sprout className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">Nenhuma cultura cadastrada</h3>
        <p className="mt-1 text-sm text-gray-500">
          Cadastre culturas para alimentar o motor de planejamento do Sítio.
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
                <TableHead className="font-semibold text-gray-700">Cultura</TableHead>
                <TableHead className="font-semibold text-gray-700">Ciclo</TableHead>
                <TableHead className="hidden font-semibold text-gray-700 sm:table-cell">Dias</TableHead>
                <TableHead className="hidden font-semibold text-gray-700 md:table-cell">Sementes/m²</TableHead>
                <TableHead className="hidden font-semibold text-gray-700 md:table-cell">Mudas/m²</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cropsList.map((crop) => (
                <TableRow
                  key={crop.id}
                  className={`hover:bg-gray-50 ${!crop.isActive ? "opacity-60" : ""}`}
                >
                  <TableCell className="font-medium text-gray-900">
                    {crop.name}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      {cycleLabels[crop.cycleType] || crop.cycleType}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-gray-600 sm:table-cell">
                    {crop.averageCycleDays} dias
                  </TableCell>
                  <TableCell className="hidden text-sm text-gray-600 md:table-cell">
                    {crop.seedRequirementPerM2 ? `${crop.seedRequirementPerM2}g` : "—"}
                  </TableCell>
                  <TableCell className="hidden text-sm text-gray-600 md:table-cell">
                    {crop.seedlingRequirementPerM2 ? `${crop.seedlingRequirementPerM2}` : "—"}
                  </TableCell>
                  <TableCell>
                    {crop.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        <span className="size-1.5 rounded-full bg-green-500" />
                        Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        <span className="size-1.5 rounded-full bg-gray-400" />
                        Inativa
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {crop.isActive ? (
                        <>
                          <button
                            onClick={() => setEditingCrop(crop)}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                          >
                            <Pencil className="size-3" />
                            Editar
                          </button>
                          <button
                            onClick={() => setArchivingCrop(crop)}
                            className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
                          >
                            <Archive className="size-3" />
                            Arquivar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestore(crop.id)}
                          disabled={isActionLoading}
                          className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                        >
                          <RefreshCw className="size-3" />
                          Restaurar
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CropForm
        open={!!editingCrop}
        onOpenChange={(open) => {
          if (!open) setEditingCrop(null);
        }}
        crop={editingCrop}
        onSuccess={() => {
          setEditingCrop(null);
          onRefresh();
        }}
      />

      <Dialog open={!!archivingCrop} onOpenChange={() => setArchivingCrop(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-900">Arquivar Cultura</DialogTitle>
            <DialogDescription>
              {archivingCrop && (
                <>
                  Deseja arquivar <strong>{archivingCrop.name}</strong>? A cultura não aparecerá mais nas opções de plantio, mas o histórico será preservado.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
              onClick={() => setArchivingCrop(null)}
              disabled={isActionLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              onClick={handleArchive}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Arquivando...
                </>
              ) : (
                "Confirmar Arquivamento"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
