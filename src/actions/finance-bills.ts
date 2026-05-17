"use server";

import { db } from "@/db";
import { bills, suppliers, costCenters, financialTransactions } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult } from "./topology";

const billSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valor deve ser um número válido"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  category: z.string().min(1, "Categoria é obrigatória"),
  supplierId: z.string().regex(/^\d+$/, "Selecione um fornecedor").optional().nullable(),
  costCenterId: z.string().regex(/^\d+$/, "Selecione um centro de custo").optional().nullable(),
});

export type BillWithDetails = {
  id: number;
  dueDate: string;
  paidDate: string | null;
  amount: string;
  description: string;
  status: "pending" | "paid" | "overdue";
  category: string;
  supplierId: number | null;
  supplierName: string | null;
  costCenterId: number | null;
  costCenterName: string | null;
  createdAt: Date;
};

export async function createBill(
  formData: z.infer<typeof billSchema>
): Promise<ActionResult<typeof bills.$inferSelect>> {
  try {
    const validated = billSchema.parse(formData);

    const [newBill] = await db
      .insert(bills)
      .values({
        description: validated.description,
        amount: validated.amount,
        dueDate: validated.dueDate,
        category: validated.category,
        supplierId: validated.supplierId ? parseInt(validated.supplierId, 10) : null,
        costCenterId: validated.costCenterId ? parseInt(validated.costCenterId, 10) : null,
      })
      .returning();

    return { success: true, data: newBill };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao criar conta a pagar" };
  }
}

export async function payBill(
  billId: number,
  paidDate?: string
): Promise<ActionResult<typeof bills.$inferSelect>> {
  try {
    const bill = await db.query.bills.findFirst({
      where: eq(bills.id, billId),
    });

    if (!bill) {
      return { success: false, error: "Conta não encontrada" };
    }

    if (bill.status === "paid") {
      return { success: false, error: "Esta conta já está paga" };
    }

    const paymentDate = paidDate || new Date().toISOString().split("T")[0];

    const [updatedBill] = await db
      .update(bills)
      .set({
        status: "paid",
        paidDate: paymentDate,
        updatedAt: new Date(),
      })
      .where(eq(bills.id, billId))
      .returning();

    await db.insert(financialTransactions).values({
      date: new Date(paymentDate),
      type: "expense",
      category: mapBillCategoryToFinancialCategory(bill.category),
      amount: bill.amount,
      description: `Pagamento: ${bill.description}`,
      costCenterId: bill.costCenterId,
    });

    return { success: true, data: updatedBill };
  } catch {
    return { success: false, error: "Erro ao pagar conta" };
  }
}

export async function getBillsList(filters?: {
  status?: string;
  category?: string;
  costCenterId?: number;
  supplierId?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ActionResult<BillWithDetails[]>> {
  try {
    const conditions = [];

    if (filters?.costCenterId) {
      conditions.push(eq(bills.costCenterId, filters.costCenterId));
    }

    if (filters?.supplierId) {
      conditions.push(eq(bills.supplierId, filters.supplierId));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(bills.dueDate, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(bills.dueDate, filters.dateTo));
    }

    const allBills = await db.query.bills.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(bills.dueDate)],
    });

    const supplierMap = new Map<number, string>();
    const costCenterMap = new Map<number, string>();

    const supplierIds = [...new Set(allBills.map((b) => b.supplierId).filter(Boolean))];
    if (supplierIds.length > 0) {
      const supplierList = await db.query.suppliers.findMany({
        where: (suppliers, { inArray }) => inArray(suppliers.id, supplierIds as number[]),
      });
      supplierList.forEach((s) => supplierMap.set(s.id, s.name));
    }

    const costCenterIds = [...new Set(allBills.map((b) => b.costCenterId).filter(Boolean))];
    if (costCenterIds.length > 0) {
      const ccList = await db.query.costCenters.findMany({
        where: (costCenters, { inArray }) => inArray(costCenters.id, costCenterIds as number[]),
      });
      ccList.forEach((cc) => costCenterMap.set(cc.id, cc.name));
    }

    const today = new Date().toISOString().split("T")[0];

    let result: BillWithDetails[] = allBills.map((b) => {
      let computedStatus = b.status as "pending" | "paid" | "overdue";
      const dueDateStr = String(b.dueDate).split("T")[0];
      if (b.status === "pending" && dueDateStr < today) {
        computedStatus = "overdue";
      }

      if (filters?.status) {
        if (filters.status === "overdue" && computedStatus !== "overdue") return null;
        if (filters.status !== "overdue" && b.status !== filters.status) return null;
      }

      return {
        id: b.id,
        dueDate: b.dueDate,
        paidDate: b.paidDate,
        amount: b.amount,
        description: b.description,
        status: computedStatus,
        category: b.category,
        supplierId: b.supplierId,
        supplierName: b.supplierId ? supplierMap.get(b.supplierId) || null : null,
        costCenterId: b.costCenterId,
        costCenterName: b.costCenterId ? costCenterMap.get(b.costCenterId) || null : null,
        createdAt: b.createdAt,
      };
    }).filter(Boolean) as BillWithDetails[];

    if (filters?.category) {
      result = result.filter((b) => b.category === filters.category);
    }

    return { success: true, data: result };
  } catch {
    return { success: false, error: "Erro ao buscar contas a pagar" };
  }
}

function mapBillCategoryToFinancialCategory(billCategory: string): "venda_producao" | "insumos_aves" | "insumos_jadm" | "infraestrutura" | "logistica" | "outros" {
  const lower = billCategory.toLowerCase();
  if (lower.includes("ração") || lower.includes("racao") || lower.includes("aves")) return "insumos_aves";
  if (lower.includes("muda") || lower.includes("semente") || lower.includes("insumo")) return "insumos_jadm";
  if (lower.includes("infra") || lower.includes("manutenção") || lower.includes("manutencao")) return "infraestrutura";
  if (lower.includes("combust") || lower.includes("transporte") || lower.includes("entrega")) return "logistica";
  return "outros";
}
