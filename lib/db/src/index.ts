import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    const url = process.env.DATABASE_URL;
    const noSsl = !url || url.includes("localhost") || url.includes("127.0.0.1") || url.includes(".internal");
    const ssl = noSsl ? false : { rejectUnauthorized: false };
    _pool = new Pool({ connectionString: url, ssl });
  }
  return _pool;
}

export const pool: pg.Pool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    return (getPool() as any)[prop];
  },
});

export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_target, prop) {
      if (!_db) {
        _db = drizzle(getPool(), { schema });
      }
      return (_db as any)[prop];
    },
  },
);

export * from "./schema";
