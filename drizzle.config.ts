import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import path from "path";

// Carrega variáveis do .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
