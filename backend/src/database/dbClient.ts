import "dotenv/config";
import { Pool } from "pg";
import * as schema from "./schema/index.ts";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, {schema});