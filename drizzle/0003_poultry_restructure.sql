ALTER TABLE "field_activities" DROP CONSTRAINT IF EXISTS "field_activities_batch_id_poultry_batches_id_fk";--> statement-breakpoint
ALTER TABLE "field_activities" DROP CONSTRAINT IF EXISTS "field_activities_individual_id_poultry_individuals_id_fk";--> statement-breakpoint
DROP TABLE IF EXISTS "poultry_individuals" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "poultry_batches" CASCADE;--> statement-breakpoint
CREATE TYPE "poultry_location_type" AS ENUM ('galpao', 'piquete_rotativo', 'pinteiro');--> statement-breakpoint
CREATE TYPE "poultry_location_status" AS ENUM ('liberado', 'vazio_sanitario');--> statement-breakpoint
ALTER TYPE "poultry_purpose" ADD VALUE IF NOT EXISTS 'misto';--> statement-breakpoint
CREATE TABLE "poultry_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_code" varchar(30) NOT NULL,
	"breed" varchar(255) NOT NULL,
	"birth_date" date NOT NULL,
	"arrival_date" date NOT NULL,
	"initial_quantity" integer NOT NULL,
	"active_quantity" integer NOT NULL,
	"purpose" "poultry_purpose" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "poultry_batches_batch_code_unique" UNIQUE("batch_code")
);
--> statement-breakpoint
CREATE TABLE "poultry_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"short_code" varchar(10),
	"location_type" "poultry_location_type" NOT NULL,
	"area_m2" numeric(10, 2),
	"capacity" integer,
	"status" "poultry_location_status" DEFAULT 'liberado' NOT NULL,
	"sanitary_void_start" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poultry_placements" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer NOT NULL,
	"batch_id" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
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
ALTER TABLE "poultry_placements" ADD CONSTRAINT "poultry_placements_location_id_poultry_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."poultry_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poultry_placements" ADD CONSTRAINT "poultry_placements_batch_id_poultry_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."poultry_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poultry_individuals" ADD CONSTRAINT "poultry_individuals_father_id_poultry_individuals_id_fk" FOREIGN KEY ("father_id") REFERENCES "public"."poultry_individuals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poultry_individuals" ADD CONSTRAINT "poultry_individuals_mother_id_poultry_individuals_id_fk" FOREIGN KEY ("mother_id") REFERENCES "public"."poultry_individuals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poultry_individuals" ADD CONSTRAINT "poultry_individuals_batch_id_poultry_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."poultry_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_activities" ADD CONSTRAINT "field_activities_batch_id_poultry_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."poultry_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_activities" ADD CONSTRAINT "field_activities_individual_id_poultry_individuals_id_fk" FOREIGN KEY ("individual_id") REFERENCES "public"."poultry_individuals"("id") ON DELETE set null ON UPDATE no action;
