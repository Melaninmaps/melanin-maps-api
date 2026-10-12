import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const express = require("express") as typeof import("express");
const request = require("supertest") as typeof import("supertest");
const pg = require("pg") as typeof import("pg");

const PG_BIN = "/usr/lib/postgresql/16/bin";
const port = 55511;
const directory = mkdtempSync(join(tmpdir(), "mwm-private-checkin-"));
const socketDirectory = join(directory, "socket");
const databaseUrl = `postgresql://postgres@127.0.0.1:${port}/postgres`;

function shell(command: string, args: string[]): void {
  execFileSync(command, args, { stdio: "ignore" });
}
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

async function main(): Promise<void> {
  shell(`${PG_BIN}/initdb`, ["-D", directory, "-A", "trust", "-U", "postgres"]);
  mkdirSync(socketDirectory);
  shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-o", `-h 127.0.0.1 -p ${port} -k ${socketDirectory}`, "-w", "start"]);
  process.env.DATABASE_URL = databaseUrl;

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE check_ins (
        id varchar(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id varchar(255) NOT NULL,
        business_id varchar(255) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        user_lat numeric(10,7),
        user_lng numeric(10,7),
        verified_location boolean NOT NULL DEFAULT false,
        note text,
        review_badge text
      );
      CREATE TABLE points_ledger (
        id varchar(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id varchar(255) NOT NULL,
        action varchar(50) NOT NULL,
        points integer NOT NULL,
        entity_id varchar(255),
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const { default: checkinsRouter } = await import("../routes/checkins");
    const { default: directionsRouter } = await import("../routes/directions");
    const { default: communityAlertsRouter } = await import("../routes/community-alerts");
    const app = express();
    app.use(express.json());
    app.use((req: any, _res: any, next: () => void) => {
      req.user = req.header("x-qa-user") === "member" ? { id: "member" } : undefined;
      req.log = { error: () => undefined, warn: () => undefined, info: () => undefined };
      next();
    });
    app.use(checkinsRouter);
    app.use(directionsRouter);
    app.use(communityAlertsRouter);

    const coordinateAttempt = await request(app)
      .post("/checkins")
      .set("x-qa-user", "member")
      .send({ businessId: "business-a", lat: 39.95, lng: -75.17 });
    assert(coordinateAttempt.status === 400, "coordinate-bearing Check-In must be rejected");
    assert((await client.query("SELECT count(*)::int AS count FROM check_ins")).rows[0]?.count === 0, "rejected coordinate attempt must not persist a Check-In");

    const privateCheckin = await request(app)
      .post("/checkins")
      .set("x-qa-user", "member")
      .send({ businessId: "business-a" });
    assert(privateCheckin.status === 201, "coordinate-free private Check-In must persist");
    assert(privateCheckin.body?.checkIn?.verifiedLocation === false, "new Check-In must not claim location verification");
    assert(!("userLat" in privateCheckin.body.checkIn) && !("userLng" in privateCheckin.body.checkIn), "new Check-In response must not expose coordinate fields");

    const persisted = await client.query<{ user_lat: string | null; user_lng: string | null; verified_location: boolean }>(
      "SELECT user_lat, user_lng, verified_location FROM check_ins WHERE business_id = 'business-a'",
    );
    assert(persisted.rows[0]?.user_lat === null && persisted.rows[0]?.user_lng === null && persisted.rows[0]?.verified_location === false, "new Check-In must keep legacy coordinate columns empty");
    assert((await client.query("SELECT count(*)::int AS count FROM points_ledger WHERE action = 'checkin'")).rows[0]?.count === 1, "private Check-In must retain standard participation points");

    await client.query("INSERT INTO check_ins (user_id, business_id, user_lat, user_lng, verified_location) VALUES ('member', 'legacy-business', 40.7128, -74.0060, true)");
    const history = await request(app).get("/checkins/user").set("x-qa-user", "member");
    assert(history.status === 200, "member must be able to load private Check-In history");
    assert(history.body.checkIns.every((entry: Record<string, unknown>) => !("userLat" in entry) && !("userLng" in entry)), "legacy coordinates must not be returned through member history");

    const retiredRoute = await request(app).post("/directions/safety-context").send({ waypoints: [{ lat: 1, lng: 2 }] });
    assert(retiredRoute.status === 410, "route Safety overlay must remain retired without evaluating waypoints");

    const legacyAlertRoute = await request(app)
      .get("/community-alerts/minority-alternatives?lat=39.95&lng=-75.17")
      .set("x-qa-user", "member");
    assert(legacyAlertRoute.status === 410, "legacy coordinate-based alert routes must fail closed");

    console.log("PASS safety privacy integration: coordinate rejection, private Check-In persistence, legacy coordinate redaction, and retired Safety routes");
  } finally {
    await client.end();
    shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-m", "immediate", "stop"]);
    rmSync(directory, { recursive: true, force: true });
  }
}

void main().catch((error) => {
  console.error("FAIL safety privacy integration", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
});
