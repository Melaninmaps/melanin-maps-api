import { describe, expect, it } from "vitest";
import { sealTemporaryStay } from "../temporary-stays-policy";
import { purgeExpiredTemporaryStays } from "../temporary-stay-retention";

const ENV = {
  KINFOLK_PRIVATE_PLACES_ENABLED: "true",
  KINFOLK_PRIVATE_PLACES_ENCRYPTION_KEYS: `v1:${Buffer.alloc(32, 31).toString("base64")}`,
} as NodeJS.ProcessEnv;

describe("Temporary Stay retention cleanup", () => {
  it("deletes only encrypted stays beyond their seven-day departure grace window", async () => {
    const expired = sealTemporaryStay({
      exactAddress: "1000 Synthetic Avenue, Exampleville, PA 19199",
      googleFormattedAddress: "1000 Synthetic Avenue, Exampleville, PA 19199, USA",
      latitude: 39.9526,
      longitude: -75.1652,
      arrivalDate: "2026-10-01",
      departureDate: "2026-10-02",
    }, ENV);
    const current = sealTemporaryStay({
      exactAddress: "2000 Synthetic Avenue, Exampleville, PA 19199",
      googleFormattedAddress: "2000 Synthetic Avenue, Exampleville, PA 19199, USA",
      latitude: 39.9527,
      longitude: -75.1653,
      arrivalDate: "2026-10-20",
      departureDate: "2026-10-21",
    }, ENV);
    const deleted: string[] = [];
    const database = {
      query: async <T>(sql: string, values: unknown[] = []) => {
        if (sql.startsWith("SELECT")) {
          return { rows: [
            { id: "expired", user_id: "owner", encrypted_payload: expired.encryptedPayload, encryption_key_version: expired.encryptionKeyVersion },
            { id: "current", user_id: "owner", encrypted_payload: current.encryptedPayload, encryption_key_version: current.encryptionKeyVersion },
          ] as T[], rowCount: 2 };
        }
        if (sql.startsWith("DELETE")) {
          deleted.push(String(values[0]));
          return { rows: [{ id: values[0] }] as T[], rowCount: 1 };
        }
        throw new Error("unexpected query");
      },
    } as never;
    const result = await purgeExpiredTemporaryStays({ database, environment: ENV, now: new Date("2026-10-10T00:00:00.000Z") });
    expect(result).toEqual({ deleted: 1, retainedUnreadable: 0, scanned: 2 });
    expect(deleted).toEqual(["expired"]);
  });

  it("retains unreadable ciphertext instead of deleting a member record", async () => {
    const database = {
      query: async <T>(sql: string) => sql.startsWith("SELECT")
        ? { rows: [{ id: "unreadable", user_id: "owner", encrypted_payload: "bad", encryption_key_version: "v1" }] as T[], rowCount: 1 }
        : { rows: [] as T[], rowCount: 0 },
    } as never;
    await expect(purgeExpiredTemporaryStays({ database, environment: ENV, now: new Date("2026-10-10T00:00:00.000Z") }))
      .resolves.toEqual({ deleted: 0, retainedUnreadable: 1, scanned: 1 });
  });
});
