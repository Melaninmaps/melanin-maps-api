import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import {
  canonicalDirectoryPayload,
  directoryWorkerConcurrency,
  sha256Hex,
} from "../directoryImport/reviewPipeline";
import { publishDirectoryCommand } from "../directoryImport/productionPublisher";
import { startDirectoryPublicationWorker } from "../directoryImport/publicationWorker";

function command(overrides: Record<string, unknown> = {}) {
  const payload = {
    name: "Sunrise Studio",
    city: "Atlanta",
    address: "1 Main Street",
    latitude: 33.75,
    longitude: -84.39,
    category: "Wellness",
    automatedReviewApproved: true,
    ...overrides,
  };
  return {
    eventKey: "batch-1:1",
    payload,
    payloadHash: sha256Hex(canonicalDirectoryPayload(payload)),
  };
}

function productionPool(options: {
  prior?: any;
  existing?: any;
  insertId?: string;
  failOn?: string;
} = {}) {
  const queries: string[] = [];
  const client = {
    query: vi.fn(async (sql: string) => {
      queries.push(sql);
      if (options.failOn && sql.includes(options.failOn)) throw new Error("write failed");
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") return { rows: [] };
      if (sql.includes("SELECT payload_hash,outcome,record_id")) return { rows: options.prior ? [options.prior] : [] };
      if (sql.includes("SELECT id FROM businesses")) return { rows: options.existing ? [options.existing] : [] };
      if (sql.includes("INSERT INTO businesses")) return { rows: [{ id: options.insertId ?? "dir-created" }] };
      return { rows: [] };
    }),
    release: vi.fn(),
  };
  return { pool: { connect: vi.fn(async () => client) } as unknown as Pool, client, queries };
}

describe("publishDirectoryCommand", () => {
  it("replays an exact command from the inbox without a second insert", async () => {
    const { pool, client } = productionPool({
      prior: { payload_hash: command().payloadHash, outcome: "created", record_id: "dir-old" },
    });

    await expect(publishDirectoryCommand(pool, command())).resolves.toEqual({
      recordId: "dir-old",
      status: "created",
    });
    expect(client.query).toHaveBeenCalledWith("COMMIT");
    expect(client.query.mock.calls.filter(([sql]) => String(sql).includes("INSERT INTO businesses"))).toHaveLength(0);
    expect(client.query.mock.calls.filter(([sql]) => String(sql).includes("INSERT INTO directory_publication_inbox"))).toHaveLength(0);
  });

  it("rejects reuse of an event key with a different payload hash", async () => {
    const first = command();
    const { pool, client } = productionPool({
      prior: { payload_hash: "different-hash", outcome: "created", record_id: "dir-old" },
    });

    await expect(publishDirectoryCommand(pool, first)).rejects.toThrow("Command ID payload hash mismatch");
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
  });

  it("does not duplicate a production commit when the acknowledgement is retried", async () => {
    const { pool, client } = productionPool({ insertId: "dir-once" });
    const first = await publishDirectoryCommand(pool, command());
    expect(first).toEqual({ recordId: "dir-once", status: "created" });

    const replay = productionPool({
      prior: { payload_hash: command().payloadHash, outcome: "created", record_id: "dir-once" },
    });
    const second = await publishDirectoryCommand(replay.pool, command());
    expect(second).toEqual(first);
    expect(client.query.mock.calls.filter(([sql]) => String(sql).includes("INSERT INTO businesses"))).toHaveLength(1);
    expect(replay.client.query.mock.calls.filter(([sql]) => String(sql).includes("INSERT INTO businesses"))).toHaveLength(0);
  });

  it("uses the physical address—not a same-name city match—to link a storefront", async () => {
    const fake = productionPool({ existing: { id: "same-location" } });
    const result = await publishDirectoryCommand(fake.pool, command({
      name: "Common Name", city: "Atlanta", state: "GA", country: "United States",
      address: "100 Main Street", latitude: 33.75, longitude: -84.39,
    }));

    expect(result).toEqual({ recordId: "same-location", status: "linked_existing" });
    const lookup = fake.client.query.mock.calls.find(([sql]) => String(sql).includes("SELECT id FROM businesses"));
    const lookupCall = lookup as unknown as [string, unknown[]] | undefined;
    expect(String(lookupCall?.[0])).toContain("regexp_replace(COALESCE(address,'')");
    expect(lookupCall?.[1]).toEqual(expect.arrayContaining(["physical|common name|atlanta|ga|united states|100 main street"]));
  });

  it("uses an online destination host only for online listings", async () => {
    const fake = productionPool({ existing: { id: "same-online" } });
    const result = await publishDirectoryCommand(fake.pool, command({
      target_kind: "online_business", online_only: true, address: undefined,
      latitude: undefined, longitude: undefined, website: "https://www.example.com/shop",
    }));

    expect(result).toEqual({ recordId: "same-online", status: "linked_existing" });
    const lookup = fake.client.query.mock.calls.find(([sql]) => String(sql).includes("SELECT id FROM businesses"));
    const lookupCall = lookup as unknown as [string, unknown[]] | undefined;
    expect(String(lookupCall?.[0])).toContain("is_online_only=true");
    expect(lookupCall?.[1]).toEqual(expect.arrayContaining(["online|sunrise studio|atlanta||united states|example.com"]));
  });

  it("holds physical records with zero coordinates", async () => {
    const fake = productionPool();
    await expect(publishDirectoryCommand(fake.pool, command({
      latitude: 0, longitude: 0,
    }))).resolves.toEqual({
      recordId: null,
      status: "held",
    });
    expect(fake.pool.connect).not.toHaveBeenCalled();
  });

  it("rejects a physical record with a missing address", async () => {
    const fake = productionPool();
    await expect(publishDirectoryCommand(fake.pool, command({
      address: "", latitude: 33.75, longitude: -84.39,
    }))).rejects.toThrow("Physical publication requires address");
    expect(fake.client.query).toHaveBeenCalledWith("ROLLBACK");
  });

  it("creates online-only records without a physical location", async () => {
    const fake = productionPool({ insertId: "dir-online" });
    const result = await publishDirectoryCommand(fake.pool, command({
      target_kind: "online_business",
      online_only: true,
      address: undefined,
      latitude: undefined,
      longitude: undefined,
      website: "https://example.com",
    }));
    expect(result).toEqual({ recordId: "dir-online", status: "created" });
    const insert = fake.client.query.mock.calls.find(([sql]) => String(sql).includes("INSERT INTO businesses"));
    expect((insert as unknown[] | undefined)?.[1]).toEqual(
      expect.arrayContaining([true, null, null, null]),
    );
  });

  it("holds community resources", async () => {
    const fake = productionPool();
    await expect(publishDirectoryCommand(fake.pool, command({
      resource_category: "food assistance",
    }))).resolves.toEqual({ recordId: null, status: "held" });
    expect(fake.pool.connect).not.toHaveBeenCalled();
  });

  it("rolls back and releases the client when publication fails", async () => {
    const fake = productionPool({ failOn: "INSERT INTO businesses" });
    await expect(publishDirectoryCommand(fake.pool, command())).rejects.toThrow("write failed");
    expect(fake.client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(fake.client.release).toHaveBeenCalledOnce();
  });
});

describe("publication worker", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("uses the exact default concurrency of one", () => {
    expect(directoryWorkerConcurrency({})).toBe(1);
    expect(directoryWorkerConcurrency({ DIRECTORY_PUBLISHER_CONCURRENCY: "0" })).toBe(1);
    expect(directoryWorkerConcurrency({ DIRECTORY_PUBLISHER_CONCURRENCY: "2" })).toBe(2);
  });

  it("claims, publishes, and acknowledges an outbox command", async () => {
    const row = { id: "outbox-1", event_key: "batch-1:1", payload: command().payload, payload_hash: command().payloadHash };
    const reviewPool = {
      query: vi.fn()
        .mockResolvedValueOnce({ rows: [row] })
        .mockResolvedValue({ rows: [] }),
    } as unknown as Pool;
    const production = productionPool({ insertId: "dir-worker" });
    const stop = startDirectoryPublicationWorker(reviewPool, production.pool, {
      DIRECTORY_PUBLICATION_WORKER_ENABLED: "1",
      DIRECTORY_PUBLICATION_BATCH_SHA256: "a".repeat(64),
    });
    await vi.runOnlyPendingTimersAsync();
    stop?.();
    expect(reviewPool.query).toHaveBeenCalledWith(
      expect.stringContaining("JOIN directory_import_batches b"),
      ["a".repeat(64)],
    );
    expect(reviewPool.query).toHaveBeenCalledWith(expect.stringContaining("SET status='sent'"), ["outbox-1"]);
    expect(reviewPool.query).toHaveBeenCalledWith(expect.stringContaining("directory_review_acknowledgements"), ["batch-1:1", row.payload_hash]);
  });

  it("refuses to process a mixed historical queue without an exact batch checksum", () => {
    const reviewPool = { query: vi.fn() } as unknown as Pool;
    const production = productionPool();
    expect(() => startDirectoryPublicationWorker(reviewPool, production.pool, {
      DIRECTORY_PUBLICATION_WORKER_ENABLED: "1",
    })).toThrow("DIRECTORY_PUBLICATION_BATCH_SHA256");
    expect(reviewPool.query).not.toHaveBeenCalled();
  });
});
