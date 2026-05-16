"use server";

import { db } from "@/db";
import { properties, glebes, fields, beds } from "@/db/schema";
import { eq } from "drizzle-orm";
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
  area: z.string().regex(/^\d+(\.\d{1,2})?$/, "Área deve ser um número válido"),
  description: z.string().optional(),
});

const fieldSchema = z.object({
  glebeId: z.number().int().positive("ID da gleba deve ser positivo"),
  name: z.string().min(1, "Nome é obrigatório").max(255),
  area: z.string().regex(/^\d+(\.\d{1,2})?$/, "Área deve ser um número válido"),
  description: z.string().optional(),
});

const bedSchema = z.object({
  fieldId: z.number().int().positive("ID do talhão deve ser positivo"),
  name: z.string().min(1, "Nome é obrigatório").max(255),
  area: z.string().regex(/^\d+(\.\d{1,2})?$/, "Área deve ser um número válido"),
  description: z.string().optional(),
});

// Tipo de retorno padronizado para todas as actions
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

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

// Garante que a propriedade padrão (ID 1) existe. Cria silenciosamente se não existir.
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
// GLEBES (Glebas)
// ============================================================

export async function createGlebe(
  formData: z.infer<typeof glebeSchema>
): Promise<ActionResult<typeof glebes.$inferSelect>> {
  try {
    const validated = glebeSchema.parse(formData);

    const [newGlebe] = await db
      .insert(glebes)
      .values({
        propertyId: validated.propertyId,
        name: validated.name,
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

export async function getGlebesByProperty(
  propertyId: number
): Promise<ActionResult<typeof glebes.$inferSelect[]>> {
  try {
    const glebesList = await db.query.glebes.findMany({
      where: eq(glebes.propertyId, propertyId),
      orderBy: (glebes, { asc }) => [asc(glebes.name)],
    });

    return { success: true, data: glebesList };
  } catch {
    return { success: false, error: "Erro ao buscar glebas" };
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

    const [newField] = await db
      .insert(fields)
      .values({
        glebeId: validated.glebeId,
        name: validated.name,
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

export async function getFieldsByGlebe(
  glebeId: number
): Promise<ActionResult<typeof fields.$inferSelect[]>> {
  try {
    const fieldsList = await db.query.fields.findMany({
      where: eq(fields.glebeId, glebeId),
      orderBy: (fields, { asc }) => [asc(fields.name)],
    });

    return { success: true, data: fieldsList };
  } catch {
    return { success: false, error: "Erro ao buscar talhões" };
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

    const [newBed] = await db
      .insert(beds)
      .values({
        fieldId: validated.fieldId,
        name: validated.name,
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

export async function getBedsByField(
  fieldId: number
): Promise<ActionResult<typeof beds.$inferSelect[]>> {
  try {
    const bedsList = await db.query.beds.findMany({
      where: eq(beds.fieldId, fieldId),
      orderBy: (beds, { asc }) => [asc(beds.name)],
    });

    return { success: true, data: bedsList };
  } catch {
    return { success: false, error: "Erro ao buscar canteiros" };
  }
}
