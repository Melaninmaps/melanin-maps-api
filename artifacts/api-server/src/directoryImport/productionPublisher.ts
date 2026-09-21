import type { Pool } from "pg";
import { classifyDirectoryRecord, canonicalDirectoryPayload, sha256Hex } from "./reviewPipeline";

export async function publishDirectoryCommand(
  productionPool: Pool, command: { eventKey: string; payload: Record<string, unknown>; payloadHash: string },
): Promise<{ recordId: string | null; status: "created" | "linked_existing" | "held" | "failed" }> {
  const payload = command.payload;
  if (sha256Hex(canonicalDirectoryPayload(payload)) !== command.payloadHash)
    throw new Error("Publication payload hash mismatch.");
  if (classifyDirectoryRecord(payload) === "community_resource" ||
      payload.automatedReviewApproved !== true ||
      (payload.latitude === 0 && payload.longitude === 0))
    return { recordId: null, status: "held" };
  // The inbox is the exactly-once boundary. A unique event key and hash make
  // retries safe even when the worker is interrupted after the write.
  const client = await productionPool.connect();
  try {
    await client.query("BEGIN");
    const prior = await client.query<{ payload_hash: string; outcome: any; record_id: string }>(
      `SELECT payload_hash,outcome,record_id FROM directory_publication_inbox WHERE event_key=$1 FOR UPDATE`, [command.eventKey]);
    if (prior.rows[0]) {
      if (prior.rows[0].payload_hash !== command.payloadHash) throw new Error("Command ID payload hash mismatch.");
      await client.query("COMMIT");
      return { recordId: prior.rows[0].record_id, status: prior.rows[0].outcome };
    }
    await client.query(`INSERT INTO directory_publication_inbox(event_key,payload_hash)
      VALUES($1,$2)`, [command.eventKey, command.payloadHash]);
    const online = classifyDirectoryRecord(payload) === "online_business";
    const name = String(payload.name ?? "").trim();
    const city = String(payload.city ?? "").trim();
    const website = payload.website ? String(payload.website) : null;
    const sourceReportedDesignations = Array.isArray(payload.ownership_designations)
      ? payload.ownership_designations.map(String).filter(Boolean)
      : Array.isArray(payload.ownershipDesignations)
        ? payload.ownershipDesignations.map(String).filter(Boolean)
        : [];
    const sourceReportedDesignation =
      payload.mwm_publication_classification === "source_reported_mwm_designation";
    const ownershipClaim = sourceReportedDesignation && sourceReportedDesignations.length > 0
      ? "source_reported_ownership_unverified"
      : "source_reputable_listing_unverified";
    const identity = `${online ? "online" : "physical"}|${name.toLowerCase()}|${city.toLowerCase()}|${website ?? payload.address ?? ""}`;
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM businesses WHERE lower(name)=lower($1) AND lower(city)=lower($2)
       AND COALESCE(website,'')=COALESCE($3,'') LIMIT 1 FOR UPDATE`, [name, city, website]);
    let recordId: string; let outcome: "created" | "linked_existing";
    if (existing.rows[0]) { recordId = existing.rows[0].id; outcome = "linked_existing"; }
    else {
      const id = `dir-${sha256Hex(identity).slice(0, 24)}`;
      const address = online ? null : String(payload.address ?? "").trim();
      const latitude = online ? null : Number(payload.latitude);
      const longitude = online ? null : Number(payload.longitude);
      if (!online && (!address || !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude === 0 && longitude === 0)) throw new Error("Physical publication requires address and non-zero coordinates.");
      const inserted = await client.query<{ id: string }>(`INSERT INTO businesses
        (id,name,category,subcategory,address,city,state,country,is_online_only,listing_status,
         owner_claim_status,verified,ownership_designations,verified_designations,ownership_claim,
         description,latitude,longitude,website,source_url,status)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'live_unclaimed','unclaimed',false,$10::jsonb,'[]'::jsonb,$11,
               $12,$13,$14,$15,$16,'active')
        RETURNING id`, [id,name,String(payload.category ?? "Other"),String(payload.subcategory ?? "General"),
        address,city,payload.state ?? null,payload.country ?? null,online,
        JSON.stringify(sourceReportedDesignations),ownershipClaim,String(payload.description ?? ""),
        latitude,longitude,website,payload.source_url ?? payload.sourceUrl ?? null]);
      recordId = inserted.rows[0]!.id; outcome = "created";
    }
    await client.query(`INSERT INTO directory_publication_provenance
      (event_key,source_batch_id,source_row,source_sha256,record_id,payload_hash,outcome)
      VALUES($1,$2,$3,$4,$5,$6,$7)`, [command.eventKey,payload.batch_id,payload.source_row,
      payload.source_sha256,recordId,command.payloadHash,outcome]);
    await client.query(`UPDATE directory_publication_inbox SET processed_at=now(),outcome=$2,record_id=$3 WHERE event_key=$1`,
      [command.eventKey,outcome,recordId]);
    await client.query("COMMIT");
    return { recordId, status: outcome };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
