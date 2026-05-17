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
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

export const unitEnum = pgEnum("unit", ["kg", "unit", "liters"]);

export const itemTypeEnum = pgEnum("item_type", ["input", "final_product"]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "entry",
  "exit",
]);

export const categoryEnum = pgEnum("category", [
  "muda",
  "estaca",
  "semente",
  "insumo",
]);

export const plantingStatusEnum = pgEnum("planting_status", [
  "active",
  "harvested",
  "permanent",
]);

export const activityCategoryEnum = pgEnum("activity_category", [
  "horta",
  "aves",
  "bioinsumos",
  "geral",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "plantio",
  "colheita",
  "coleta_ovos",
  "limpeza_aviario",
  "coleta_esterco",
  "aplicacao_insumo",
  "rocagem",
  "alimentacao_racao",
  "manejo_ambiencia",
  "movimentacao_piquete",
]);

export const poultryPurposeEnum = pgEnum("poultry_purpose", [
  "postura",
  "corte",
  "dupla_aptidao",
  "matriz_genetica",
]);

export const batchStatusEnum = pgEnum("batch_status", [
  "active",
  "retired",
  "sold",
]);

export const genderEnum = pgEnum("gender", ["macho", "femea"]);

export const individualStatusEnum = pgEnum("individual_status", [
  "ativo",
  "descartado",
  "morto",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pago",
  "pendente",
]);

export const orderTypeEnum = pgEnum("order_type", ["balcao", "delivery"]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "pix",
  "dinheiro",
  "cartao",
  "pendente",
]);

export const financialTransactionTypeEnum = pgEnum("financial_tx_type", [
  "revenue",
  "expense",
]);

export const financialCategoryEnum = pgEnum("financial_category", [
  "venda_producao",
  "insumos_aves",
  "insumos_jadm",
  "infraestrutura",
  "logistica",
  "outros",
]);

export const customerTypeEnum = pgEnum("customer_type", [
  "b2c",
  "b2b",
]);

export const customerStatusEnum = pgEnum("customer_status", [
  "active",
  "inactive",
]);

// ============================================================
// CENTROS DE CUSTO
// ============================================================

export const costCenters = pgTable("cost_centers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
});

// ============================================================
// MÓDULOS DO SISTEMA (ERP Modular)
// ============================================================

export const systemModules = pgTable("system_modules", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
});

// ============================================================
// MÓDULO 1: ESTRUTURA TOPOLÓGICA
// ============================================================

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  totalArea: decimal("total_area", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 10 }).notNull().default("m²"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  unit: unitEnum("unit").notNull(),
  type: itemTypeEnum("type").notNull(),
  category: categoryEnum("category").notNull().default("insumo"),
  location: varchar("location", { length: 255 }),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  costCenterId: integer("cost_center_id").references(() => costCenters.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
// MÓDULO 4: CADERNO DE CAMPO E REGISTRO DE MANEJO
// ============================================================

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
// MÓDULO 6: FINANCEIRO, PDV E VENDAS
// ============================================================

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: customerTypeEnum("type").notNull().default("b2c"),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  document: varchar("document", { length: 50 }),
  status: customerStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  customerId: integer("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  customerName: varchar("customer_name", { length: 255 }),
  type: orderTypeEnum("type").notNull().default("balcao"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("pendente"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pendente"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  itemId: integer("item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  type: financialTransactionTypeEnum("type").notNull(),
  category: financialCategoryEnum("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  costCenterId: integer("cost_center_id").references(() => costCenters.id, {
    onDelete: "set null",
  }),
});

// ============================================================
// RELACIONAMENTOS (Drizzle Relations)
// ============================================================

export const propertiesRelations = relations(properties, ({ many }) => ({
  glebes: many(glebes),
}));

export const glebesRelations = relations(glebes, ({ one, many }) => ({
  property: one(properties, {
    fields: [glebes.propertyId],
    references: [properties.id],
  }),
  fields: many(fields),
}));

export const fieldsRelations = relations(fields, ({ one, many }) => ({
  glebe: one(glebes, {
    fields: [fields.glebeId],
    references: [glebes.id],
  }),
  beds: many(beds),
}));

export const bedsRelations = relations(beds, ({ one, many }) => ({
  field: one(fields, {
    fields: [beds.fieldId],
    references: [fields.id],
  }),
  plantings: many(plantings),
  fieldActivities: many(fieldActivities),
}));

export const inventoryItemsRelations = relations(
  inventoryItems,
  ({ many }) => ({
    transactions: many(inventoryTransactions),
    plantings: many(plantings),
    fieldActivities: many(fieldActivities),
    orderItems: many(orderItems),
  })
);

export const inventoryTransactionsRelations = relations(
  inventoryTransactions,
  ({ one }) => ({
    item: one(inventoryItems, {
      fields: [inventoryTransactions.itemId],
      references: [inventoryItems.id],
    }),
  })
);

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

export const poultryBatchesRelations = relations(
  poultryBatches,
  ({ many }) => ({
    individuals: many(poultryIndividuals),
  })
);

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

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  financialTransactions: many(financialTransactions),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  item: one(inventoryItems, {
    fields: [orderItems.itemId],
    references: [inventoryItems.id],
  }),
}));

export const financialTransactionsRelations = relations(
  financialTransactions,
  ({ one }) => ({
    order: one(orders, {
      fields: [financialTransactions.orderId],
      references: [orders.id],
    }),
    costCenter: one(costCenters, {
      fields: [financialTransactions.costCenterId],
      references: [costCenters.id],
    }),
  })
);

export const costCentersRelations = relations(costCenters, ({ many }) => ({
  inventoryItems: many(inventoryItems),
  financialTransactions: many(financialTransactions),
}));
