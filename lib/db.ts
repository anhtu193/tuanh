import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Sql = NeonQueryFunction<false, false>;

let sql: Sql | null = null;
let schemaReady: Promise<void> | null = null;

function connectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

export function getSql() {
  if (!sql) {
    sql = neon(connectionString());
  }
  return sql;
}

export async function ensureSchema() {
  if (!schemaReady) {
    const db = getSql();
    schemaReady = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS projects (
          id text PRIMARY KEY,
          title text NOT NULL,
          slug text NOT NULL UNIQUE,
          description text NOT NULL,
          project_url text,
          github_url text,
          image_url text NOT NULL,
          image_public_id text,
          technologies jsonb NOT NULL DEFAULT '[]'::jsonb,
          visible boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL
        )
      `;
      await db`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS visible boolean NOT NULL DEFAULT true
      `;
    })().catch((error: unknown) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}
