"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, ToggleLeft, ToggleRight } from "lucide-react";
import type { customers } from "@/db/schema";

type Customer = typeof customers.$inferSelect;

interface CustomersTableProps {
  customers: Customer[];
  onToggleStatus: (customer: Customer) => void;
}

const typeLabels: Record<string, string> = {
  b2c: "B2C (Varejo)",
  b2b: "B2B (Atacado)",
};

const typeColors: Record<string, string> = {
  b2c: "bg-gray-100 text-gray-800",
  b2b: "bg-blue-100 text-blue-800",
};

const statusLabels: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

export function CustomersTable({ customers: customersList, onToggleStatus }: CustomersTableProps) {
  if (customersList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
        <Users className="mb-4 size-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhum cliente cadastrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Clique em &quot;Novo Cliente&quot; para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Nome</TableHead>
              <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
              <TableHead className="hidden font-semibold text-gray-700 sm:table-cell">
                Telefone
              </TableHead>
              <TableHead className="hidden font-semibold text-gray-700 md:table-cell">
                Documento
              </TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customersList.map((customer) => (
              <TableRow key={customer.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-gray-900">
                  {customer.name}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[customer.type]}`}
                  >
                    {typeLabels[customer.type]}
                  </span>
                </TableCell>
                <TableCell className="hidden text-gray-500 sm:table-cell">
                  {customer.phone || "—"}
                </TableCell>
                <TableCell className="hidden text-gray-500 md:table-cell">
                  {customer.document || "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      customer.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {statusLabels[customer.status]}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleStatus(customer)}
                    className={
                      customer.status === "active"
                        ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                        : "text-green-600 hover:text-green-700 hover:bg-green-50"
                    }
                  >
                    {customer.status === "active" ? (
                      <>
                        <ToggleRight className="mr-1 size-4" />
                        <span className="hidden sm:inline">Desativar</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="mr-1 size-4" />
                        <span className="hidden sm:inline">Ativar</span>
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
