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

// Status de plantio
export const plantingStatusEnum = pgEnum("planting_status", [
  "active",
  "harvested",
  "permanent",
]);

// Categoria de atividade
export const activityCategoryEnum = pgEnum("activity_category", [
  "horta",
  "aves",
  "bioinsumos",
  "geral",
]);

// Tipo de atividade
export const activityTypeEnum = pgEnum("activity_type", [
  "plantio",
  "colheita",
  "coleta_ovos",
  "limpeza_aviario",
  "coleta_esterco",
  "aplicacao_insumo",
  "rocagem",
]);

// Propósito do lote de aves
export const poultryPurposeEnum = pgEnum("poultry_purpose", [
  "postura",
  "corte",
  "dupla_aptidao",
  "matriz_genetica",
]);

// Status do lote
export const batchStatusEnum = pgEnum("batch_status", [
  "active",
  "retired",
  "sold",
]);

// Gênero do indivíduo
export const genderEnum = pgEnum("gender", ["macho", "femea"]);

// Status do indivíduo
export const individualStatusEnum = pgEnum("individual_status", [
  "ativo",
  "descartado",
  "morto",
]);

// Status de pagamento
export const paymentStatusEnum = pgEnum("payment_status", [
  "pago",
  "pendente",
]);

// Tipo de transação financeira
export const financialTransactionTypeEnum = pgEnum("financial_tx_type", [
  "revenue",
  "expense",
]);

// Categoria financeira
export const financialCategoryEnum = pgEnum("financial_category", [
  "venda_producao",
  "insumos_aves",
  "insumos_jadm",
  "infraestrutura",
  "logistica",
  "outros",
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
// MÓDULO 4: CADerno DE CAMPO E REGISTRO DE MANEJO
// ============================================================

// Tabela: Cultivos/Plantios (ciclo de vida no canteiro)
export const plantings = pgTable("plantings", {
  id: serial("id").primaryKey(),
  bedId: integer("bed_id")
    .notNull()
    .references(() => beds.id, { onDelete: "cascade" }),
  itemId: integer("item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  status: plantingStatusEnum("status").notNull().default("active"),
  plantedAt: timestamp("planted_at").defaultNow().notNull(),
  harvestedAt: timestamp("harvested_at"),
});

// Tabela: Atividades/Diário Unificado
export const fieldActivities = pgTable("field_activities", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  category: activityCategoryEnum("category").notNull(),
  activityType: activityTypeEnum("activity_type").notNull(),
  bedId: integer("bed_id").references(() => beds.id, { onDelete: "set null" }),
  itemId: integer("item_id").references(() => inventoryItems.id, {
    onDelete: "set null",
  }),
  batchId: integer("batch_id").references(() => poultryBatches.id, {
    onDelete: "set null",
  }),
  individualId: integer("individual_id").references(() => poultryIndividuals.id, {
    onDelete: "set null",
  }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  notes: text("notes"),
});

// ============================================================
// MÓDULO 5: AVICULTURA & GESTÃO GENÉTICA
// ============================================================

// Tabela: Lotes de Aves (Plantel Comercial)
export const poultryBatches = pgTable("poultry_batches", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  breed: varchar("breed", { length: 255 }).notNull(),
  purpose: poultryPurposeEnum("purpose").notNull(),
  initialQuantity: integer("initial_quantity").notNull(),
  currentQuantity: integer("current_quantity").notNull(),
  hatchDate: timestamp("hatch_date").notNull(),
  status: batchStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela: Indivíduos Reprodutores (Pedigree/Elite Genética)
// Self-referencing: fatherId/motherId -> mesma tabela
// Variável auxiliar para quebrar referência circular do TypeScript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pIndRef: any;

export const poultryIndividuals = pgTable("poultry_individuals", {
  id: serial("id").primaryKey(),
  ringId: varchar("ring_id", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  gender: genderEnum("gender").notNull(),
  fatherId: integer("father_id").references(
    () => _pIndRef?.id,
    { onDelete: "set null" }
  ),
  motherId: integer("mother_id").references(
    () => _pIndRef?.id,
    { onDelete: "set null" }
  ),
  batchId: integer("batch_id").references(() => poultryBatches.id, {
    onDelete: "set null",
  }),
  status: individualStatusEnum("status").notNull().default("ativo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

_pIndRef = poultryIndividuals;

// ============================================================
// MÓDULO 6: FINANCEIRO E VENDAS
// ============================================================

// Tabela: Vendas de Produção
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  itemId: integer("item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pendente"),
});

// Tabela: Transações Financeiras (Fluxo de Caixa)
export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  type: financialTransactionTypeEnum("type").notNull(),
  category: financialCategoryEnum("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  saleId: integer("sale_id").references(() => sales.id, {
    onDelete: "set null",
  }),
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

// Canteiro pertence a um talhão e tem muitos plantios e atividades
export const bedsRelations = relations(beds, ({ one, many }) => ({
  field: one(fields, {
    fields: [beds.fieldId],
    references: [fields.id],
  }),
  plantings: many(plantings),
  fieldActivities: many(fieldActivities),
}));

// Item de estoque tem muitas transações, plantios, atividades e vendas
export const inventoryItemsRelations = relations(
  inventoryItems,
  ({ many }) => ({
    transactions: many(inventoryTransactions),
    plantings: many(plantings),
    fieldActivities: many(fieldActivities),
    sales: many(sales),
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

// Plantio pertence a um canteiro e a um item
export const plantingsRelations = relations(plantings, ({ one }) => ({
  bed: one(beds, {
    fields: [plantings.bedId],
    references: [beds.id],
  }),
  item: one(inventoryItems, {
    fields: [plantings.itemId],
    references: [inventoryItems.id],
  }),
}));

// Atividade pertence a um canteiro, item, lote e indivíduo (opcionais)
export const fieldActivitiesRelations = relations(
  fieldActivities,
  ({ one }) => ({
    bed: one(beds, {
      fields: [fieldActivities.bedId],
      references: [beds.id],
    }),
    item: one(inventoryItems, {
      fields: [fieldActivities.itemId],
      references: [inventoryItems.id],
    }),
    batch: one(poultryBatches, {
      fields: [fieldActivities.batchId],
      references: [poultryBatches.id],
    }),
    individual: one(poultryIndividuals, {
      fields: [fieldActivities.individualId],
      references: [poultryIndividuals.id],
    }),
  })
);

// Lote tem muitos indivíduos
export const poultryBatchesRelations = relations(
  poultryBatches,
  ({ many }) => ({
    individuals: many(poultryIndividuals),
  })
);

// Indivíduo pertence a um lote e tem pai/mãe (auto-referência)
export const poultryIndividualsRelations = relations(
  poultryIndividuals,
  ({ one }) => ({
    batch: one(poultryBatches, {
      fields: [poultryIndividuals.batchId],
      references: [poultryBatches.id],
    }),
    father: one(poultryIndividuals, {
      fields: [poultryIndividuals.fatherId],
      references: [poultryIndividuals.id],
    }),
    mother: one(poultryIndividuals, {
      fields: [poultryIndividuals.motherId],
      references: [poultryIndividuals.id],
    }),
  })
);

// Venda pertence a um item e tem transações financeiras vinculadas
export const salesRelations = relations(sales, ({ one, many }) => ({
  item: one(inventoryItems, {
    fields: [sales.itemId],
    references: [inventoryItems.id],
  }),
  financialTransactions: many(financialTransactions),
}));

// Transação financeira pertence a uma venda (opcional)
export const financialTransactionsRelations = relations(
  financialTransactions,
  ({ one }) => ({
    sale: one(sales, {
      fields: [financialTransactions.saleId],
      references: [sales.id],
    }),
  })
);
