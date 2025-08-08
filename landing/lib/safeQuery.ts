import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || "");

export async function safeQuery(text: string, params: unknown[]) {
  return sql(text, params);
}
