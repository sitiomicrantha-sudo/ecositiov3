"use server";

import { db } from "@/db";
import { properties, glebes, fields, beds } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// ============================================================
// SCHEMAS DE VALIDAÇÃO (Zod)
// ============================================================

const propertySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  totalArea: z.string().regex(/^\d+(\.\d{1,2})?$/, "Área deve ser um número válido"),
  unit: z.string().min(1).max(10).default("m²"),
});

const glebeSchema = z.object({
  propertyId: z.number().int().positive("ID da propriedade deve ser positivo"),
  name: z.string().min(1, "Nome é obrigatório").max(255),
  shortCode: z.string().max(10).optional().nullable(),
  area: z.string().regex(/^\d+(\.\d{1,2})?$/, "Área deve ser um número válido"),
  description: z.string().optional(),
});

const glebeUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  shortCode: z.string().max(10).optional().nullable(),
  area: z.string().regex(/^\d+(\.\d{1,2})?$/, "Área deve ser um número válido"),
  description: z.string().optional(),
});

const fieldSchema = z.object({
  glebeId: z.number().int().positive("ID da gleba deve ser positivo"),
  name: z.string().min(1, "Nome é obrigatório").max(255),
  shortCode: z.string().max(10).optional().nullable(),
  area: z.string().regex(/^\d+(\.\d{1,2})?$/, "Área deve ser um número válido"),
  description: z.string().optional(),
});

const fieldUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  shortCode: z.string().max(10).optional().nullable(),
  area: z.string().regex(/^\d+(\.\d{1,2})?$/, "Área deve ser um número válido"),
  description: z.string().optional(),
});

const bedSchema = z.object({
  fieldId: z.number().int().positive("ID do talhão deve ser positivo"),
  name: z.string().min(1, "Nome é obrigatório").max(255),
  shortCode: z.string().max(10).optional().nullable(),
  area: z.string().regex(/^\d+(\.\d{1,2})?$/, "Área deve ser um número válido"),
  description: z.string().optional(),
});

const bedUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  shortCode: z.string().max(10).optional().nullable(),
  area: z.string().regex(/^\d+(\.\d{1,2})?$/, "Área deve ser um número válido"),
  description: z.string().optional(),
});

// Tipo de retorno padronizado para todas as actions
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================
// VALIDAÇÃO DE ÁREA ACUMULADA
// ============================================================

async function validateGlebeArea(propertyId: number, newArea: number, excludeGlebeId?: number): Promise<ActionResult<null>> {
  const property = await db.query.properties.findFirst({
    where: eq(properties.id, propertyId),
  });

  if (!property) {
    return { success: false, error: "Propriedade não encontrada" };
  }

  const totalArea = parseFloat(property.totalArea);
  if (totalArea === 0) return { success: true, data: null };

  const existingGlebes = await db.query.glebes.findMany({
    where: and(eq(glebes.propertyId, propertyId), eq(glebes.isActive, true)),
  });

  const totalGlebeArea = existingGlebes
    .filter((g) => g.id !== excludeGlebeId)
    .reduce((sum, g) => sum + parseFloat(g.area), 0);

  if (totalGlebeArea + newArea > totalArea) {
    return {
      success: false,
      error: `Área total das glebas (${(totalGlebeArea + newArea).toLocaleString("pt-BR")} m²) excede a área da propriedade (${totalArea.toLocaleString("pt-BR")} m²)`,
    };
  }

  return { success: true, data: null };
}

async function validateFieldArea(glebeId: number, newArea: number, excludeFieldId?: number): Promise<ActionResult<null>> {
  const glebe = await db.query.glebes.findFirst({
    where: eq(glebes.id, glebeId),
  });

  if (!glebe) {
    return { success: false, error: "Gleba não encontrada" };
  }

  const totalArea = parseFloat(glebe.area);
  if (totalArea === 0) return { success: true, data: null };

  const existingFields = await db.query.fields.findMany({
    where: and(eq(fields.glebeId, glebeId), eq(fields.isActive, true)),
  });

  const totalFieldArea = existingFields
    .filter((f) => f.id !== excludeFieldId)
    .reduce((sum, f) => sum + parseFloat(f.area), 0);

  if (totalFieldArea + newArea > totalArea) {
    return {
      success: false,
      error: `Área total dos talhões (${(totalFieldArea + newArea).toLocaleString("pt-BR")} m²) excede a área da gleba (${totalArea.toLocaleString("pt-BR")} m²)`,
    };
  }

  return { success: true, data: null };
}

async function validateBedArea(fieldId: number, newArea: number, excludeBedId?: number): Promise<ActionResult<null>> {
  const field = await db.query.fields.findFirst({
    where: eq(fields.id, fieldId),
  });

  if (!field) {
    return { success: false, error: "Talhão não encontrado" };
  }

  const totalArea = parseFloat(field.area);
  if (totalArea === 0) return { success: true, data: null };

  const existingBeds = await db.query.beds.findMany({
    where: and(eq(beds.fieldId, fieldId), eq(beds.isActive, true)),
  });

  const totalBedArea = existingBeds
    .filter((b) => b.id !== excludeBedId)
    .reduce((sum, b) => sum + parseFloat(b.area), 0);

  if (totalBedArea + newArea > totalArea) {
    return {
      success: false,
      error: `Área total dos canteiros (${(totalBedArea + newArea).toLocaleString("pt-BR")} m²) excede a área do talhão (${totalArea.toLocaleString("pt-BR")} m²)`,
    };
  }

  return { success: true, data: null };
}

// ============================================================
// PROPERTIES (Propriedades)
// ============================================================

export async function createProperty(
  formData: z.infer<typeof propertySchema>
): Promise<ActionResult<typeof properties.$inferSelect>> {
  try {
    const validated = propertySchema.parse(formData);

    const [newProperty] = await db
      .insert(properties)
      .values({
        name: validated.name,
        totalArea: validated.totalArea,
        unit: validated.unit,
      })
      .returning();

    return { success: true, data: newProperty };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao criar propriedade" };
  }
}

export async function getProperties(): Promise<
  ActionResult<typeof properties.$inferSelect[]>
> {
  try {
    const allProperties = await db.query.properties.findMany({
      orderBy: (properties, { desc }) => [desc(properties.createdAt)],
    });

    return { success: true, data: allProperties };
  } catch {
    return { success: false, error: "Erro ao buscar propriedades" };
  }
}

export async function ensureDefaultProperty(): Promise<
  ActionResult<typeof properties.$inferSelect>
> {
  try {
    const existing = await db.query.properties.findFirst({
      where: eq(properties.id, 1),
    });

    if (existing) {
      return { success: true, data: existing };
    }

    const [newProperty] = await db
      .insert(properties)
      .values({
        name: "Sítio Micrantha",
        totalArea: "0",
        unit: "m²",
      })
      .returning();

    return { success: true, data: newProperty };
  } catch {
    return { success: false, error: "Erro ao garantir propriedade padrão" };
  }
}

export async function getPropertyById(
  id: number
): Promise<ActionResult<typeof properties.$inferSelect>> {
  try {
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, id),
    });

    if (!property) {
      return { success: false, error: "Propriedade não encontrada" };
    }

    return { success: true, data: property };
  } catch {
    return { success: false, error: "Erro ao buscar propriedade" };
  }
}

// ============================================================
// GLEBES (Glebas)
// ============================================================

export async function createGlebe(
  formData: z.infer<typeof glebeSchema>
): Promise<ActionResult<typeof glebes.$inferSelect>> {
  try {
    const validated = glebeSchema.parse(formData);
    const areaNum = parseFloat(validated.area);

    const areaValidation = await validateGlebeArea(validated.propertyId, areaNum);
    if (!areaValidation.success) {
      return { success: false, error: areaValidation.error };
    }

    const [newGlebe] = await db
      .insert(glebes)
      .values({
        propertyId: validated.propertyId,
        name: validated.name,
        shortCode: validated.shortCode || null,
        area: validated.area,
        description: validated.description || null,
      })
      .returning();

    return { success: true, data: newGlebe };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao criar gleba" };
  }
}

export async function updateGlebe(
  id: number,
  formData: z.infer<typeof glebeUpdateSchema>
): Promise<ActionResult<typeof glebes.$inferSelect>> {
  try {
    const validated = glebeUpdateSchema.parse(formData);
    const areaNum = parseFloat(validated.area);

    const existing = await db.query.glebes.findFirst({
      where: eq(glebes.id, id),
    });

    if (!existing) {
      return { success: false, error: "Gleba não encontrada" };
    }

    const areaValidation = await validateGlebeArea(existing.propertyId, areaNum, id);
    if (!areaValidation.success) {
      return { success: false, error: areaValidation.error };
    }

    const [updated] = await db
      .update(glebes)
      .set({
        name: validated.name,
        shortCode: validated.shortCode || null,
        area: validated.area,
        description: validated.description || null,
        updatedAt: new Date(),
      })
      .where(eq(glebes.id, id))
      .returning();

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao atualizar gleba" };
  }
}

export async function archiveGlebe(
  id: number
): Promise<ActionResult<typeof glebes.$inferSelect>> {
  try {
    const existing = await db.query.glebes.findFirst({
      where: eq(glebes.id, id),
    });

    if (!existing) {
      return { success: false, error: "Gleba não encontrada" };
    }

    if (!existing.isActive) {
      return { success: false, error: "Gleba já está arquivada" };
    }

    const [archived] = await db
      .update(glebes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(glebes.id, id))
      .returning();

    return { success: true, data: archived };
  } catch {
    return { success: false, error: "Erro ao arquivar gleba" };
  }
}

export async function getGlebesByProperty(
  propertyId: number
): Promise<ActionResult<typeof glebes.$inferSelect[]>> {
  try {
    const glebesList = await db.query.glebes.findMany({
      where: and(eq(glebes.propertyId, propertyId), eq(glebes.isActive, true)),
      orderBy: (glebes, { asc }) => [asc(glebes.name)],
    });

    return { success: true, data: glebesList };
  } catch {
    return { success: false, error: "Erro ao buscar glebas" };
  }
}

export async function getGlebeById(
  id: number
): Promise<ActionResult<typeof glebes.$inferSelect>> {
  try {
    const glebe = await db.query.glebes.findFirst({
      where: eq(glebes.id, id),
    });

    if (!glebe) {
      return { success: false, error: "Gleba não encontrada" };
    }

    return { success: true, data: glebe };
  } catch {
    return { success: false, error: "Erro ao buscar gleba" };
  }
}

// ============================================================
// FIELDS (Talhões)
// ============================================================

export async function createField(
  formData: z.infer<typeof fieldSchema>
): Promise<ActionResult<typeof fields.$inferSelect>> {
  try {
    const validated = fieldSchema.parse(formData);
    const areaNum = parseFloat(validated.area);

    const areaValidation = await validateFieldArea(validated.glebeId, areaNum);
    if (!areaValidation.success) {
      return { success: false, error: areaValidation.error };
    }

    const [newField] = await db
      .insert(fields)
      .values({
        glebeId: validated.glebeId,
        name: validated.name,
        shortCode: validated.shortCode || null,
        area: validated.area,
        description: validated.description || null,
      })
      .returning();

    return { success: true, data: newField };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao criar talhão" };
  }
}

export async function updateField(
  id: number,
  formData: z.infer<typeof fieldUpdateSchema>
): Promise<ActionResult<typeof fields.$inferSelect>> {
  try {
    const validated = fieldUpdateSchema.parse(formData);
    const areaNum = parseFloat(validated.area);

    const existing = await db.query.fields.findFirst({
      where: eq(fields.id, id),
    });

    if (!existing) {
      return { success: false, error: "Talhão não encontrado" };
    }

    const areaValidation = await validateFieldArea(existing.glebeId, areaNum, id);
    if (!areaValidation.success) {
      return { success: false, error: areaValidation.error };
    }

    const [updated] = await db
      .update(fields)
      .set({
        name: validated.name,
        shortCode: validated.shortCode || null,
        area: validated.area,
        description: validated.description || null,
        updatedAt: new Date(),
      })
      .where(eq(fields.id, id))
      .returning();

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao atualizar talhão" };
  }
}

export async function archiveField(
  id: number
): Promise<ActionResult<typeof fields.$inferSelect>> {
  try {
    const existing = await db.query.fields.findFirst({
      where: eq(fields.id, id),
    });

    if (!existing) {
      return { success: false, error: "Talhão não encontrado" };
    }

    if (!existing.isActive) {
      return { success: false, error: "Talhão já está arquivado" };
    }

    const [archived] = await db
      .update(fields)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(fields.id, id))
      .returning();

    return { success: true, data: archived };
  } catch {
    return { success: false, error: "Erro ao arquivar talhão" };
  }
}

export async function getFieldsByGlebe(
  glebeId: number
): Promise<ActionResult<typeof fields.$inferSelect[]>> {
  try {
    const fieldsList = await db.query.fields.findMany({
      where: and(eq(fields.glebeId, glebeId), eq(fields.isActive, true)),
      orderBy: (fields, { asc }) => [asc(fields.name)],
    });

    return { success: true, data: fieldsList };
  } catch {
    return { success: false, error: "Erro ao buscar talhões" };
  }
}

export async function getFieldById(
  id: number
): Promise<ActionResult<typeof fields.$inferSelect>> {
  try {
    const field = await db.query.fields.findFirst({
      where: eq(fields.id, id),
    });

    if (!field) {
      return { success: false, error: "Talhão não encontrado" };
    }

    return { success: true, data: field };
  } catch {
    return { success: false, error: "Erro ao buscar talhão" };
  }
}

// ============================================================
// BEDS (Canteiros)
// ============================================================

export async function createBed(
  formData: z.infer<typeof bedSchema>
): Promise<ActionResult<typeof beds.$inferSelect>> {
  try {
    const validated = bedSchema.parse(formData);
    const areaNum = parseFloat(validated.area);

    const areaValidation = await validateBedArea(validated.fieldId, areaNum);
    if (!areaValidation.success) {
      return { success: false, error: areaValidation.error };
    }

    const [newBed] = await db
      .insert(beds)
      .values({
        fieldId: validated.fieldId,
        name: validated.name,
        shortCode: validated.shortCode || null,
        area: validated.area,
        description: validated.description || null,
      })
      .returning();

    return { success: true, data: newBed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao criar canteiro" };
  }
}

export async function updateBed(
  id: number,
  formData: z.infer<typeof bedUpdateSchema>
): Promise<ActionResult<typeof beds.$inferSelect>> {
  try {
    const validated = bedUpdateSchema.parse(formData);
    const areaNum = parseFloat(validated.area);

    const existing = await db.query.beds.findFirst({
      where: eq(beds.id, id),
    });

    if (!existing) {
      return { success: false, error: "Canteiro não encontrado" };
    }

    const areaValidation = await validateBedArea(existing.fieldId, areaNum, id);
    if (!areaValidation.success) {
      return { success: false, error: areaValidation.error };
    }

    const [updated] = await db
      .update(beds)
      .set({
        name: validated.name,
        shortCode: validated.shortCode || null,
        area: validated.area,
        description: validated.description || null,
        updatedAt: new Date(),
      })
      .where(eq(beds.id, id))
      .returning();

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Erro ao atualizar canteiro" };
  }
}

export async function archiveBed(
  id: number
): Promise<ActionResult<typeof beds.$inferSelect>> {
  try {
    const existing = await db.query.beds.findFirst({
      where: eq(beds.id, id),
    });

    if (!existing) {
      return { success: false, error: "Canteiro não encontrado" };
    }

    if (!existing.isActive) {
      return { success: false, error: "Canteiro já está arquivado" };
    }

    const [archived] = await db
      .update(beds)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(beds.id, id))
      .returning();

    return { success: true, data: archived };
  } catch {
    return { success: false, error: "Erro ao arquivar canteiro" };
  }
}

export async function getBedsByField(
  fieldId: number
): Promise<ActionResult<typeof beds.$inferSelect[]>> {
  try {
    const bedsList = await db.query.beds.findMany({
      where: and(eq(beds.fieldId, fieldId), eq(beds.isActive, true)),
      orderBy: (beds, { asc }) => [asc(beds.name)],
    });

    return { success: true, data: bedsList };
  } catch {
    return { success: false, error: "Erro ao buscar canteiros" };
  }
}
