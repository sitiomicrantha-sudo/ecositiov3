import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Cria conexão HTTP serverless com o Neon Database
const sql = neon(process.env.DATABASE_URL!);

// Exporta instância do Drizzle ORM configurada para o Neon
export const db = drizzle(sql, { schema });
