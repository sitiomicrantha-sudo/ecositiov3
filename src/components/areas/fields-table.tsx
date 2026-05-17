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
import { MapPin, ArrowRight, Pencil, Archive } from "lucide-react";
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
import { FieldForm } from "./field-form";
import { archiveField } from "@/actions/topology";
import type { fields } from "@/db/schema";
import { toast } from "sonner";

type Field = typeof fields.$inferSelect;

interface FieldsTableProps {
  fieldsList: Field[];
  glebeId: number;
  onSuccess: () => void;
}

export function FieldsTable({ fieldsList, glebeId, onSuccess }: FieldsTableProps) {
  const [archiveId, setArchiveId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<Field | null>(null);

  async function handleArchive(id: number) {
    const result = await archiveField(id);
    if (result.success) {
      toast.success("Talhão arquivado com sucesso");
      onSuccess();
    } else {
      toast.error(result.error);
    }
    setArchiveId(null);
  }

  if (fieldsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <MapPin className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhum talhão cadastrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Clique em &quot;Novo Talhão&quot; para dividir esta gleba em talhões.
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
            {fieldsList.map((field) => (
              <TableRow key={field.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-gray-900">
                  {field.name}
                </TableCell>
                <TableCell className="text-gray-600">
                  {field.shortCode || "—"}
                </TableCell>
                <TableCell className="text-gray-600">
                  {Number(field.area).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="max-w-xs truncate text-gray-500">
                  {field.description || "—"}
                </TableCell>
                <TableCell className="text-gray-500">
                  {new Date(field.createdAt).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingField(field)}
                      className="size-8 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setArchiveId(field.id)}
                      className="size-8 text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                    >
                      <Archive className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `/areas/glebes/${glebeId}/fields/${field.id}`)
                      }
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      Ver Canteiros
                      <ArrowRight className="ml-1 size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <FieldForm
        glebeId={glebeId}
        onSuccess={onSuccess}
        initialData={editingField}
      />

      <AlertDialog open={!!archiveId} onOpenChange={(open) => !open && setArchiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Talhão</AlertDialogTitle>
            <AlertDialogDescription>
              Ao arquivar este talhão, todos os canteiros vinculados também serão arquivados.
              O histórico de plantios e atividades será preservado. Esta ação pode ser desfeita.
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
