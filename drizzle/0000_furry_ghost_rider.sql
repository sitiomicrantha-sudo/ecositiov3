CREATE TYPE "public"."activity_category" AS ENUM('horta', 'aves', 'bioinsumos', 'geral');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('plantio', 'colheita', 'coleta_ovos', 'limpeza_aviario', 'coleta_esterco', 'aplicacao_insumo', 'rocagem', 'alimentacao_racao', 'manejo_ambiencia', 'movimentacao_piquete');--> statement-breakpoint
CREATE TYPE "public"."batch_status" AS ENUM('active', 'retired', 'sold');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('muda', 'estaca', 'semente', 'insumo');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('b2c', 'b2b');--> statement-breakpoint
CREATE TYPE "public"."financial_category" AS ENUM('venda_producao', 'insumos_aves', 'insumos_jadm', 'infraestrutura', 'logistica', 'outros');--> statement-breakpoint
CREATE TYPE "public"."financial_tx_type" AS ENUM('revenue', 'expense');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('macho', 'femea');--> statement-breakpoint
CREATE TYPE "public"."individual_status" AS ENUM('ativo', 'descartado', 'morto');--> statement-breakpoint
CREATE TYPE "public"."item_type" AS ENUM('input', 'final_product');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('balcao', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('pix', 'dinheiro', 'cartao', 'pendente');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pago', 'pendente');--> statement-breakpoint
CREATE TYPE "public"."planting_status" AS ENUM('active', 'harvested', 'permanent');--> statement-breakpoint
CREATE TYPE "public"."poultry_purpose" AS ENUM('postura', 'corte', 'dupla_aptidao', 'matriz_genetica');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('entry', 'exit');--> statement-breakpoint
CREATE TYPE "public"."unit" AS ENUM('kg', 'unit', 'liters');--> statement-breakpoint
CREATE TABLE "beds" (
	"id" serial PRIMARY KEY NOT NULL,
	"field_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"area" numeric(10, 2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "customer_type" DEFAULT 'b2c' NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"document" varchar(50),
	"status" "customer_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"category" "activity_category" NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"bed_id" integer,
	"item_id" integer,
	"batch_id" integer,
	"individual_id" integer,
	"quantity" numeric(10, 2),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"glebe_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"area" numeric(10, 2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"type" "financial_tx_type" NOT NULL,
	"category" "financial_category" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" varchar(255) NOT NULL,
	"order_id" integer
);
--> statement-breakpoint
CREATE TABLE "glebes" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"area" numeric(10, 2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"unit" "unit" NOT NULL,
	"type" "item_type" NOT NULL,
	"category" "category" DEFAULT 'insumo' NOT NULL,
	"location" varchar(255),
	"base_price" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"type" "transaction_type" NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"date" date DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"customer_id" integer,
	"customer_name" varchar(255),
	"type" "order_type" DEFAULT 'balcao' NOT NULL,
	"payment_method" "payment_method" DEFAULT 'pendente' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pendente' NOT NULL,
	"delivery_fee" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plantings" (
	"id" serial PRIMARY KEY NOT NULL,
	"bed_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"status" "planting_status" DEFAULT 'active' NOT NULL,
	"planted_at" timestamp DEFAULT now() NOT NULL,
	"harvested_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "poultry_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"breed" varchar(255) NOT NULL,
	"purpose" "poultry_purpose" NOT NULL,
	"initial_quantity" integer NOT NULL,
	"current_quantity" integer NOT NULL,
	"hatch_date" timestamp NOT NULL,
	"status" "batch_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poultry_individuals" (
	"id" serial PRIMARY KEY NOT NULL,
	"ring_id" varchar(50) NOT NULL,
	"name" varchar(255),
	"gender" "gender" NOT NULL,
	"father_id" integer,
	"mother_id" integer,
	"batch_id" integer,
	"status" "individual_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "poultry_individuals_ring_id_unique" UNIQUE("ring_id")
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"total_area" numeric(10, 2) NOT NULL,
	"unit" varchar(10) DEFAULT 'm²' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_activities" ADD CONSTRAINT "field_activities_bed_id_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_activities" ADD CONSTRAINT "field_activities_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_activities" ADD CONSTRAINT "field_activities_batch_id_poultry_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."poultry_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_activities" ADD CONSTRAINT "field_activities_individual_id_poultry_individuals_id_fk" FOREIGN KEY ("individual_id") REFERENCES "public"."poultry_individuals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fields" ADD CONSTRAINT "fields_glebe_id_glebes_id_fk" FOREIGN KEY ("glebe_id") REFERENCES "public"."glebes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glebes" ADD CONSTRAINT "glebes_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_bed_id_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poultry_individuals" ADD CONSTRAINT "poultry_individuals_father_id_poultry_individuals_id_fk" FOREIGN KEY ("father_id") REFERENCES "public"."poultry_individuals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poultry_individuals" ADD CONSTRAINT "poultry_individuals_mother_id_poultry_individuals_id_fk" FOREIGN KEY ("mother_id") REFERENCES "public"."poultry_individuals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poultry_individuals" ADD CONSTRAINT "poultry_individuals_batch_id_poultry_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."poultry_batches"("id") ON DELETE set null ON UPDATE no action;