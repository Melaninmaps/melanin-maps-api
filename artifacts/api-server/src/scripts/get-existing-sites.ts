import pg from "pg";
import { readFileSync, writeFileSync } from "fs";

async function main() {
  const url = readFileSync("/tmp/railway_db_url.txt", "utf8").trim();
  const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 2 });
  const r = await pool.query("SELECT LOWER(name) as n, LOWER(city) as c FROM cultural_sites");
  const rows = r.rows.map((row: any) => row.n + "||" + row.c);
  writeFileSync("/tmp/existing_sites.json", JSON.stringify(rows));
  console.log("Existing sites in Railway DB:", rows.length);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
