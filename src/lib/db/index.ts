import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Falls back to a placeholder URL so the module loads during `next build`
// without DATABASE_URL set. Real queries will fail at runtime — that's expected
// during local builds without a DB connection configured.
const sql = neon(process.env.DATABASE_URL ?? "postgresql://user:password@localhost/placeholder");
export const db = drizzle(sql, { schema });
