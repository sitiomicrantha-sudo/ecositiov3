CREATE TYPE "supplier_status" AS ENUM ('ativo', 'inativo');--> statement-breakpoint
CREATE TYPE "bill_status" AS ENUM ('pending', 'paid', 'overdue');--> statement-breakpoint
CREATE TYPE "receivable_status" AS ENUM ('pending', 'received', 'overdue');--> statement-breakpoint
CREATE TYPE "installment_status" AS ENUM ('pending', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"document" varchar(20),
	"email" varchar(255),
	"phone" varchar(50),
	"status" "supplier_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" date,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"status" "bill_status" DEFAULT 'pending' NOT NULL,
	"category" varchar(100) NOT NULL,
	"supplier_id" integer,
	"cost_center_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receivables" (
	"id" serial PRIMARY KEY NOT NULL,
	"due_date" date NOT NULL,
	"received_date" date,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"status" "receivable_status" DEFAULT 'pending' NOT NULL,
	"order_id" integer,
	"customer_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installments" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer,
	"order_id" integer,
	"installment_number" integer NOT NULL,
	"total_installments" integer NOT NULL,
	"due_date" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "installment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installments" ADD CONSTRAINT "installments_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installments" ADD CONSTRAINT "installments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
