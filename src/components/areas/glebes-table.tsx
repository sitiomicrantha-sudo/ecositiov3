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
import { GlebeForm } from "./glebe-form";
import { archiveGlebe } from "@/actions/topology";
import type { glebes } from "@/db/schema";
import { toast } from "sonner";

type Glebe = typeof glebes.$inferSelect;

interface GlebesTableProps {
  glebesList: Glebe[];
  propertyId: number;
  onSuccess: () => void;
}

export function GlebesTable({ glebesList, propertyId, onSuccess }: GlebesTableProps) {
  const [archiveId, setArchiveId] = useState<number | null>(null);
  const [editingGlebe, setEditingGlebe] = useState<Glebe | null>(null);

  async function handleArchive(id: number) {
    const result = await archiveGlebe(id);
    if (result.success) {
      toast.success("Gleba arquivada com sucesso");
      onSuccess();
    } else {
      toast.error(result.error);
    }
    setArchiveId(null);
  }

  if (glebesList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <MapPin className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhuma gleba cadastrada
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Clique em &quot;Nova Gleba&quot; para dividir esta propriedade em
          glebas.
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
            {glebesList.map((glebe) => (
              <TableRow key={glebe.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-gray-900">
                  {glebe.name}
                </TableCell>
                <TableCell className="text-gray-600">
                  {glebe.shortCode || "—"}
                </TableCell>
                <TableCell className="text-gray-600">
                  {Number(glebe.area).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="max-w-xs truncate text-gray-500">
                  {glebe.description || "—"}
                </TableCell>
                <TableCell className="text-gray-500">
                  {new Date(glebe.createdAt).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingGlebe(glebe)}
                      className="size-8 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setArchiveId(glebe.id)}
                      className="size-8 text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                    >
                      <Archive className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `/areas/glebes/${glebe.id}`)
                      }
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      Ver Talhões
                      <ArrowRight className="ml-1 size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <GlebeForm
        propertyId={propertyId}
        onSuccess={onSuccess}
        initialData={editingGlebe}
      />

      <AlertDialog open={!!archiveId} onOpenChange={(open) => !open && setArchiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Gleba</AlertDialogTitle>
            <AlertDialogDescription>
              Ao arquivar esta gleba, todos os talhões e canteiros vinculados também serão arquivados.
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
