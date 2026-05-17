CREATE TYPE "treatment_type" AS ENUM ('fitoterapico_floral', 'vacina_profilatica', 'alopatico_comercial');--> statement-breakpoint
CREATE TABLE "poultry_daily_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer NOT NULL,
	"recorded_at" date NOT NULL,
	"eggs_collected" integer DEFAULT 0 NOT NULL,
	"eggs_broken" integer DEFAULT 0 NOT NULL,
	"feed_consumed_kg" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poultry_health_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer,
	"location_id" integer,
	"treatment_type" "treatment_type" NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"withdrawal_days" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "poultry_daily_records" ADD CONSTRAINT "poultry_daily_records_location_id_poultry_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."poultry_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poultry_health_events" ADD CONSTRAINT "poultry_health_events_batch_id_poultry_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."poultry_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poultry_health_events" ADD CONSTRAINT "poultry_health_events_location_id_poultry_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."poultry_locations"("id") ON DELETE set null ON UPDATE no action;
