ALTER TABLE "poultry_locations" ADD COLUMN "associated_field_id" integer REFERENCES "public"."fields"("id") ON DELETE SET NULL;
