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
  uuid,
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
  "planned",
  "active",
  "harvested",
  "permanent",
]);

export const cropCycleTypeEnum = pgEnum("crop_cycle_type", [
  "ciclo_curto",
  "anual",
  "perene",
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
  "corte",
  "postura",
  "misto",
]);

export const poultryLocationTypeEnum = pgEnum("poultry_location_type", [
  "galpao",
  "piquete_rotativo",
  "pinteiro",
]);

export const poultryLocationStatusEnum = pgEnum("poultry_location_status", [
  "liberado",
  "vazio_sanitario",
]);

export const treatmentTypeEnum = pgEnum("treatment_type", [
  "fitoterapico_floral",
  "vacina_profilatica",
  "alopatico_comercial",
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

export const supplierStatusEnum = pgEnum("supplier_status", [
  "ativo",
  "inativo",
]);

export const billStatusEnum = pgEnum("bill_status", [
  "pending",
  "paid",
  "overdue",
]);

export const receivableStatusEnum = pgEnum("receivable_status", [
  "pending",
  "received",
  "overdue",
]);

export const installmentStatusEnum = pgEnum("installment_status", [
  "pending",
  "paid",
  "overdue",
  "cancelled",
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
  shortCode: varchar("short_code", { length: 10 }),
  area: decimal("area", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fields = pgTable("fields", {
  id: serial("id").primaryKey(),
  glebeId: integer("glebe_id")
    .notNull()
    .references(() => glebes.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  shortCode: varchar("short_code", { length: 10 }),
  area: decimal("area", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const beds = pgTable("beds", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id")
    .notNull()
    .references(() => fields.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  shortCode: varchar("short_code", { length: 10 }),
  area: decimal("area", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
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

export const crops = pgTable("crops", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cycleType: cropCycleTypeEnum("cycle_type").notNull(),
  averageCycleDays: integer("average_cycle_days").notNull(),
  seedRequirementPerM2: decimal("seed_requirement_per_m2", { precision: 10, scale: 4 }),
  seedlingRequirementPerM2: decimal("seedling_requirement_per_m2", { precision: 10, scale: 4 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const plantings = pgTable("plantings", {
  id: serial("id").primaryKey(),
  bedId: integer("bed_id")
    .references(() => beds.id, { onDelete: "set null" }),
  fieldId: integer("field_id")
    .references(() => fields.id, { onDelete: "set null" }),
  itemId: integer("item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  cropId: integer("crop_id")
    .references(() => crops.id, { onDelete: "set null" }),
  status: plantingStatusEnum("status").notNull().default("active"),
  plantedAt: timestamp("planted_at").defaultNow(),
  harvestedAt: timestamp("harvested_at"),
  expectedHarvestAt: timestamp("expected_harvest_at"),
  plannedAreaM2: decimal("planned_area_m2", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const harvestBatches = pgTable("harvest_batches", {
  id: serial("id").primaryKey(),
  loteCode: varchar("lote_code", { length: 30 }).notNull().unique(),
  publicToken: uuid("public_token").defaultRandom().notNull().unique(),
  bedId: integer("bed_id").notNull().references(() => beds.id, { onDelete: "set null" }),
  plantingId: integer("planting_id").references(() => plantings.id, { onDelete: "set null" }),
  quantity: varchar("quantity", { length: 30 }),
  harvestedAt: timestamp("harvested_at").defaultNow().notNull(),
  notes: text("notes"),
});

// ============================================================
// MÓDULO 5: AVICULTURA & GESTÃO GENÉTICA
// ============================================================

export const poultryLocations = pgTable("poultry_locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  shortCode: varchar("short_code", { length: 10 }),
  locationType: poultryLocationTypeEnum("location_type").notNull(),
  areaM2: decimal("area_m2", { precision: 10, scale: 2 }),
  capacity: integer("capacity"),
  status: poultryLocationStatusEnum("status").notNull().default("liberado"),
  sanitaryVoidStart: timestamp("sanitary_void_start"),
  associatedFieldId: integer("associated_field_id")
    .references(() => fields.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const poultryBatches = pgTable("poultry_batches", {
  id: serial("id").primaryKey(),
  batchCode: varchar("batch_code", { length: 30 }).notNull().unique(),
  breed: varchar("breed", { length: 255 }).notNull(),
  birthDate: date("birth_date").notNull(),
  arrivalDate: date("arrival_date").notNull(),
  initialQuantity: integer("initial_quantity").notNull(),
  activeQuantity: integer("active_quantity").notNull(),
  purpose: poultryPurposeEnum("purpose").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const poultryPlacements = pgTable("poultry_placements", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id")
    .notNull()
    .references(() => poultryLocations.id, { onDelete: "restrict" }),
  batchId: integer("batch_id")
    .notNull()
    .references(() => poultryBatches.id, { onDelete: "restrict" }),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
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
// MÓDULO 5B: OPERAÇÕES DIÁRIAS E PRONTUÁRIO SANITÁRIO
// ============================================================

export const poultryDailyRecords = pgTable("poultry_daily_records", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id")
    .notNull()
    .references(() => poultryLocations.id, { onDelete: "cascade" }),
  recordedAt: date("recorded_at").notNull(),
  eggsCollected: integer("eggs_collected").notNull().default(0),
  eggsBroken: integer("eggs_broken").notNull().default(0),
  feedConsumedKg: decimal("feed_consumed_kg", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const poultryHealthEvents = pgTable("poultry_health_events", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").references(() => poultryBatches.id, {
    onDelete: "set null",
  }),
  locationId: integer("location_id").references(() => poultryLocations.id, {
    onDelete: "set null",
  }),
  treatmentType: treatmentTypeEnum("treatment_type").notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  withdrawalDays: integer("withdrawal_days").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
// MÓDULO 3: GESTÃO FINANCEIRA ANALÍTICA (FASE 3.1)
// ============================================================

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  document: varchar("document", { length: 20 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  status: supplierStatusEnum("status").notNull().default("ativo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  status: billStatusEnum("status").notNull().default("pending"),
  category: varchar("category", { length: 100 }).notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id, {
    onDelete: "set null",
  }),
  costCenterId: integer("cost_center_id").references(() => costCenters.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const receivables = pgTable("receivables", {
  id: serial("id").primaryKey(),
  dueDate: date("due_date").notNull(),
  receivedDate: date("received_date"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  status: receivableStatusEnum("status").notNull().default("pending"),
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  customerId: integer("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const installments = pgTable("installments", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").references(() => bills.id, {
    onDelete: "cascade",
  }),
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "cascade",
  }),
  installmentNumber: integer("installment_number").notNull(),
  totalInstallments: integer("total_installments").notNull(),
  dueDate: date("due_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: installmentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  poultryLocation: many(poultryLocations),
}));

export const bedsRelations = relations(beds, ({ one, many }) => ({
  field: one(fields, {
    fields: [beds.fieldId],
    references: [fields.id],
  }),
  plantings: many(plantings),
  fieldActivities: many(fieldActivities),
  harvestBatches: many(harvestBatches),
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
  field: one(fields, {
    fields: [plantings.fieldId],
    references: [fields.id],
  }),
  item: one(inventoryItems, {
    fields: [plantings.itemId],
    references: [inventoryItems.id],
  }),
  crop: one(crops, {
    fields: [plantings.cropId],
    references: [crops.id],
  }),
}));

export const cropsRelations = relations(crops, ({ many }) => ({
  plantings: many(plantings),
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

export const poultryLocationsRelations = relations(poultryLocations, ({ one, many }) => ({
  field: one(fields, {
    fields: [poultryLocations.associatedFieldId],
    references: [fields.id],
  }),
  placements: many(poultryPlacements),
  dailyRecords: many(poultryDailyRecords),
  healthEvents: many(poultryHealthEvents),
}));

export const poultryBatchesRelations = relations(poultryBatches, ({ many }) => ({
  placements: many(poultryPlacements),
  individuals: many(poultryIndividuals),
  healthEvents: many(poultryHealthEvents),
}));

export const poultryPlacementsRelations = relations(poultryPlacements, ({ one }) => ({
  location: one(poultryLocations, {
    fields: [poultryPlacements.locationId],
    references: [poultryLocations.id],
  }),
  batch: one(poultryBatches, {
    fields: [poultryPlacements.batchId],
    references: [poultryBatches.id],
  }),
}));

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

export const poultryDailyRecordsRelations = relations(
  poultryDailyRecords,
  ({ one }) => ({
    location: one(poultryLocations, {
      fields: [poultryDailyRecords.locationId],
      references: [poultryLocations.id],
    }),
  })
);

export const poultryHealthEventsRelations = relations(
  poultryHealthEvents,
  ({ one }) => ({
    batch: one(poultryBatches, {
      fields: [poultryHealthEvents.batchId],
      references: [poultryBatches.id],
    }),
    location: one(poultryLocations, {
      fields: [poultryHealthEvents.locationId],
      references: [poultryLocations.id],
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
  receivables: many(receivables),
  installments: many(installments),
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
  bills: many(bills),
}));

export const harvestBatchesRelations = relations(harvestBatches, ({ one }) => ({
  bed: one(beds, {
    fields: [harvestBatches.bedId],
    references: [beds.id],
  }),
  planting: one(plantings, {
    fields: [harvestBatches.plantingId],
    references: [plantings.id],
  }),
}));

// ============================================================
// MÓDULO 3: RELACIONAMENTOS FINANCEIROS
// ============================================================

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  bills: many(bills),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [bills.supplierId],
    references: [suppliers.id],
  }),
  costCenter: one(costCenters, {
    fields: [bills.costCenterId],
    references: [costCenters.id],
  }),
  installments: many(installments),
}));

export const receivablesRelations = relations(receivables, ({ one }) => ({
  order: one(orders, {
    fields: [receivables.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [receivables.customerId],
    references: [customers.id],
  }),
}));

export const installmentsRelations = relations(installments, ({ one }) => ({
  bill: one(bills, {
    fields: [installments.billId],
    references: [bills.id],
  }),
  order: one(orders, {
    fields: [installments.orderId],
    references: [orders.id],
  }),
}));
