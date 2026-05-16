import {
  pgTable,
  serial,
  varchar,
  decimal,
  text,
  timestamp,
  integer,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

// Unidade de medida para itens de estoque
export const unitEnum = pgEnum("unit", ["kg", "unit", "liters"]);

// Tipo de item: insumo (input) ou produto final (final_product)
export const itemTypeEnum = pgEnum("item_type", ["input", "final_product"]);

// Tipo de transação: entrada (entry) ou saída (exit)
export const transactionTypeEnum = pgEnum("transaction_type", [
  "entry",
  "exit",
]);

// Categoria de germoplasma/insumo
export const categoryEnum = pgEnum("category", [
  "muda",
  "estaca",
  "semente",
  "insumo",
]);

// ============================================================
// MÓDULO 1: ESTRUTURA TOPOLÓGICA
// Hierarquia: Propriedade > Gleba > Talhão > Canteiro
// ============================================================

// Tabela: Propriedades (raiz da hierarquia)
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  totalArea: decimal("total_area", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 10 }).notNull().default("m²"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela: Glebas (vinculadas à propriedade)
export const glebes = pgTable("glebes", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  area: decimal("area", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela: Talhões (vinculados à gleba)
export const fields = pgTable("fields", {
  id: serial("id").primaryKey(),
  glebeId: integer("glebe_id")
    .notNull()
    .references(() => glebes.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  area: decimal("area", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela: Canteiros (vinculados ao talhão - unidade mínima de controle)
export const beds = pgTable("beds", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id")
    .notNull()
    .references(() => fields.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  area: decimal("area", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================
// MÓDULO 3: ESTOQUE BÁSICO
// ============================================================

// Tabela: Itens de estoque (insumos e produtos finais)
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  unit: unitEnum("unit").notNull(),
  type: itemTypeEnum("type").notNull(),
  category: categoryEnum("category").notNull().default("insumo"),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela: Transações de estoque (entradas e saídas)
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  date: date("date").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// RELACIONAMENTOS (Drizzle Relations)
// ============================================================

// Propriedade tem muitas glebas
export const propertiesRelations = relations(properties, ({ many }) => ({
  glebes: many(glebes),
}));

// Gleba pertence a uma propriedade e tem muitos talhões
export const glebesRelations = relations(glebes, ({ one, many }) => ({
  property: one(properties, {
    fields: [glebes.propertyId],
    references: [properties.id],
  }),
  fields: many(fields),
}));

// Talhão pertence a uma gleba e tem muitos canteiros
export const fieldsRelations = relations(fields, ({ one, many }) => ({
  glebe: one(glebes, {
    fields: [fields.glebeId],
    references: [glebes.id],
  }),
  beds: many(beds),
}));

// Canteiro pertence a um talhão
export const bedsRelations = relations(beds, ({ one }) => ({
  field: one(fields, {
    fields: [beds.fieldId],
    references: [fields.id],
  }),
}));

// Item de estoque tem muitas transações
export const inventoryItemsRelations = relations(
  inventoryItems,
  ({ many }) => ({
    transactions: many(inventoryTransactions),
  })
);

// Transação pertence a um item
export const inventoryTransactionsRelations = relations(
  inventoryTransactions,
  ({ one }) => ({
    item: one(inventoryItems, {
      fields: [inventoryTransactions.itemId],
      references: [inventoryItems.id],
    }),
  })
);
