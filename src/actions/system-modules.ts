"use server";

import { db } from "@/db";
import { systemModules } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getActiveModules() {
  try {
    const modules = await db.query.systemModules.findMany({
      orderBy: (systemModules, { asc }) => [asc(systemModules.name)],
    });
    return { success: true, data: modules };
  } catch {
    return { success: false, error: "Erro ao buscar módulos do sistema" };
  }
}

export async function toggleModule(
  moduleId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(systemModules)
      .set({ isActive })
      .where(eq(systemModules.id, moduleId));
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao alternar módulo" };
  }
}

export async function ensureDefaultModules() {
  const defaults = [
    { id: "vegetal", name: "Caderno de Campo", description: "Gestão de cultivos vegetais, plantios e colheitas", isActive: true },
    { id: "avicultura", name: "Avicultura", description: "Gestão de lotes, reprodutores e manejo de aves", isActive: true },
    { id: "criatorio", name: "Criatório / Incubação", description: "Gestão de incubação, ovoscopia e pintainhos", isActive: false },
    { id: "prv", name: "PRV (Pastoreio Racional)", description: "Gestão de piquetes e rotação de pastagens", isActive: false },
  ];

  for (const d of defaults) {
    const existing = await db.query.systemModules.findFirst({
      where: eq(systemModules.id, d.id),
    });

    if (!existing) {
      await db.insert(systemModules).values(d);
    }
  }
}
