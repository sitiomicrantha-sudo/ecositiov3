"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil, Archive } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BedForm } from "./bed-form";
import { archiveBed } from "@/actions/topology";
import type { beds } from "@/db/schema";
import { toast } from "sonner";

type Bed = typeof beds.$inferSelect;

interface BedsTableProps {
  bedsList: Bed[];
  fieldId: number;
  onSuccess: () => void;
}

export function BedsTable({ bedsList, fieldId, onSuccess }: BedsTableProps) {
  const [archiveId, setArchiveId] = useState<number | null>(null);
  const [editingBed, setEditingBed] = useState<Bed | null>(null);

  async function handleArchive(id: number) {
    const result = await archiveBed(id);
    if (result.success) {
      toast.success("Canteiro arquivado com sucesso");
      onSuccess();
    } else {
      toast.error(result.error);
    }
    setArchiveId(null);
  }

  if (bedsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <MapPin className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhum canteiro cadastrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Clique em &quot;Novo Canteiro&quot; para criar a unidade mínima de
          controle.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Nome</TableHead>
              <TableHead className="font-semibold text-gray-700">
                Código
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Área (m²)
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Descrição
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Criado em
              </TableHead>
              <TableHead className="text-right font-semibold text-gray-700">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bedsList.map((bed) => (
              <TableRow key={bed.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-gray-900">
                  {bed.name}
                </TableCell>
                <TableCell className="text-gray-600">
                  {bed.shortCode || "—"}
                </TableCell>
                <TableCell className="text-gray-600">
                  {Number(bed.area).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="max-w-xs truncate text-gray-500">
                  {bed.description || "—"}
                </TableCell>
                <TableCell className="text-gray-500">
                  {new Date(bed.createdAt).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingBed(bed)}
                      className="size-8 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setArchiveId(bed.id)}
                      className="size-8 text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                    >
                      <Archive className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BedForm
        fieldId={fieldId}
        onSuccess={onSuccess}
        initialData={editingBed}
      />

      <AlertDialog open={!!archiveId} onOpenChange={(open) => !open && setArchiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Canteiro</AlertDialogTitle>
            <AlertDialogDescription>
              Ao arquivar este canteiro, o histórico de plantios e atividades será preservado.
              Esta ação pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveId && handleArchive(archiveId)}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
