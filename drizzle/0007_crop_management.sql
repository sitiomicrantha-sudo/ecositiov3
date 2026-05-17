CREATE TYPE "crop_cycle_type" AS ENUM ('ciclo_curto', 'anual', 'perene');--> statement-breakpoint
ALTER TYPE "planting_status" ADD VALUE IF NOT EXISTS 'planned';--> statement-breakpoint
CREATE TABLE "crops" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"cycle_type" "crop_cycle_type" NOT NULL,
	"average_cycle_days" integer NOT NULL,
	"seed_requirement_per_m2" numeric(10, 4),
	"seedling_requirement_per_m2" numeric(10, 4),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plantings" ADD COLUMN "field_id" integer;--> statement-breakpoint
ALTER TABLE "plantings" ADD COLUMN "crop_id" integer;--> statement-breakpoint
ALTER TABLE "plantings" ADD COLUMN "expected_harvest_at" timestamp;--> statement-breakpoint
ALTER TABLE "plantings" ADD COLUMN "planned_area_m2" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "plantings" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "plantings" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "plantings" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "plantings" ALTER COLUMN "bed_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "plantings" ALTER COLUMN "planted_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE set null ON UPDATE no action;
