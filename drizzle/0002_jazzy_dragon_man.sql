CREATE TABLE "harvest_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"lote_code" varchar(30) NOT NULL,
	"public_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"bed_id" integer NOT NULL,
	"planting_id" integer,
	"quantity" varchar(30),
	"harvested_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	CONSTRAINT "harvest_batches_lote_code_unique" UNIQUE("lote_code"),
	CONSTRAINT "harvest_batches_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
ALTER TABLE "harvest_batches" ADD CONSTRAINT "harvest_batches_bed_id_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvest_batches" ADD CONSTRAINT "harvest_batches_planting_id_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."plantings"("id") ON DELETE set null ON UPDATE no action;