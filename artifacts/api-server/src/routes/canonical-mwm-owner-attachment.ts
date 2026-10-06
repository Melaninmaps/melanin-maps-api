import { Router, type IRouter, type Request, type Response } from "express";
import type { PoolClient } from "pg";
import crypto from "crypto";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";
import { isFounderOwnerRequest } from "../lib/protectedAdminAccess";
import { ensureCanonicalMwmOwnerAttachmentAuditSchema } from "../lib/startup-migrations";
import { CANONICAL_MWM_BUSINESS_ID } from "../kinfolk/community-need-feedback";

const router: IRouter = Router();
const CONFIRMATION = "ATTACH_CANONICAL_MWM_OWNER";

type CanonicalBusinessState = {
  id: string;
  name: string;
  website: string | null;
  status: string | null;
  listingStatus: string | null;
};

type ActiveOwnerLink = {
  id: string;
  userId: string;
  status: string;
  role: string;
};

function isAuthorizedFounder(req: Request, res: Response): req is Request & { user: NonNullable<Request["user"]> } {
  if (!isAdmin(req) || !isFounderOwnerRequest(req) || !req.user?.id) {
    res.status(403).json({ error: "Founder-owner authorization is required." });
    return false;
  }
  return true;
}

async function readCanonicalBusiness(client: PoolClient, forUpdate = false): Promise<CanonicalBusinessState | null> {
  const { rows } = await client.query<{
    id: string;
    name: string;
    website: string | null;
    status: string | null;
    listing_status: string | null;
  }>(
    `SELECT id, name, website, status, listing_status
       FROM businesses
      WHERE id = $1
      ${forUpdate ? "FOR UPDATE" : ""}`,
    [CANONICAL_MWM_BUSINESS_ID],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    website: row.website,
    status: row.status,
    listingStatus: row.listing_status,
  };
}

function assertCanonicalIdentity(business: CanonicalBusinessState): void {
  const expectedName = "mapping with melanin";
  const expectedWebsite = "mappingwithmelanin.com";
  const name = business.name.trim().toLowerCase();
  const website = String(business.website ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (name !== expectedName || website !== expectedWebsite) {
    throw new Error("Canonical Mapping With Melanin business identity did not match; no owner link was changed.");
  }
}

async function readActiveOwnerLinks(client: PoolClient, forUpdate = false): Promise<ActiveOwnerLink[]> {
  const { rows } = await client.query<{
    id: string;
    user_id: string;
    status: string;
    role: string;
  }>(
    `SELECT id, user_id, status, role
       FROM business_owner_links
      WHERE business_id = $1
        AND role = 'owner'
        AND status = 'approved'
        AND revoked_at IS NULL
      ORDER BY approved_at ASC NULLS LAST, created_at ASC
      ${forUpdate ? "FOR UPDATE" : ""}`,
    [CANONICAL_MWM_BUSINESS_ID],
  );
  return rows.map((row) => ({ id: row.id, userId: row.user_id, status: row.status, role: row.role }));
}

router.get("/admin/canonical-mwm-owner-attachment", async (req: Request, res: Response) => {
  if (!isAuthorizedFounder(req, res)) return;
  try {
    await ensureCanonicalMwmOwnerAttachmentAuditSchema();
  } catch (error) {
    req.log.error({ error }, "Canonical owner attachment audit schema is unavailable");
    return void res.status(503).json({ error: "CANONICAL_MWM_OWNER_AUDIT_SCHEMA_UNAVAILABLE" });
  }
  const client = await pool.connect();
  try {
    const business = await readCanonicalBusiness(client);
    if (!business) return void res.status(404).json({ error: "Canonical Mapping With Melanin business was not found." });
    assertCanonicalIdentity(business);
    const activeLinks = await readActiveOwnerLinks(client);
    const currentLink = activeLinks[0] ?? null;
    res.json({
      canonicalBusiness: business,
      attachment: {
        activeOwnerLinkPresent: Boolean(currentLink),
        attachedToCurrentFounder: currentLink?.userId === req.user.id,
        conflictingOwnerLinkPresent: Boolean(currentLink && currentLink.userId !== req.user.id),
      },
      confirmationRequired: CONFIRMATION,
    });
  } catch (error) {
    req.log.error({ error }, "Failed to preflight canonical Mapping With Melanin owner attachment");
    res.status(500).json({ error: "Canonical owner attachment preflight failed." });
  } finally {
    client.release();
  }
});

/**
 * This is deliberately not a generic admin ownership editor. It can attach only
 * the signed-in founder owner to the one verified canonical MWM profile, leaves
 * the business row untouched, and records a before/after append-only audit event.
 */
router.post("/admin/canonical-mwm-owner-attachment", async (req: Request, res: Response) => {
  if (!isAuthorizedFounder(req, res)) return;
  if ((req.body as { confirmation?: unknown } | undefined)?.confirmation !== CONFIRMATION) {
    return void res.status(400).json({ error: "Explicit canonical owner attachment confirmation is required." });
  }
  try {
    await ensureCanonicalMwmOwnerAttachmentAuditSchema();
  } catch (error) {
    req.log.error({ error }, "Canonical owner attachment audit schema is unavailable");
    return void res.status(503).json({ error: "CANONICAL_MWM_OWNER_AUDIT_SCHEMA_UNAVAILABLE" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["canonical_mwm_owner_attachment_v1"]);

    const { rows: founderRows } = await client.query<{ id: string; email: string | null; role: string | null }>(
      `SELECT id, email, role FROM users WHERE id = $1 FOR UPDATE`,
      [req.user.id],
    );
    const founder = founderRows[0];
    if (!founder || founder.id !== req.user.id) {
      throw new Error("Authenticated founder account could not be re-verified.");
    }

    const business = await readCanonicalBusiness(client, true);
    if (!business) {
      await client.query("ROLLBACK");
      return void res.status(404).json({ error: "Canonical Mapping With Melanin business was not found." });
    }
    assertCanonicalIdentity(business);

    const priorState = {
      business: {
        id: business.id,
        name: business.name,
        website: business.website,
        status: business.status,
        listingStatus: business.listingStatus,
      },
      activeOwnerLink: null as { id: string; userId: string } | null,
    };
    const activeLinks = await readActiveOwnerLinks(client, true);
    if (activeLinks.length > 1) {
      throw new Error("More than one active owner relationship exists; no owner relationship was changed.");
    }
    const priorLink = activeLinks[0] ?? null;
    priorState.activeOwnerLink = priorLink ? { id: priorLink.id, userId: priorLink.userId } : null;

    let action: "attached" | "already_attached" | "replaced_conflicting_owner";
    let newOwnerLinkId = priorLink?.id ?? null;
    if (priorLink?.userId === founder.id) {
      action = "already_attached";
    } else {
      if (priorLink) {
        await client.query(
          `UPDATE business_owner_links
              SET revoked_at = NOW(),
                  revoked_by = $1,
                  revocation_reason = 'Founder-authorized canonical Mapping With Melanin owner correction',
                  updated_at = NOW()
            WHERE id = $2 AND revoked_at IS NULL`,
          [founder.id, priorLink.id],
        );
        action = "replaced_conflicting_owner";
      } else {
        action = "attached";
      }
      newOwnerLinkId = `bol_mwm_${crypto.randomUUID()}`;
      await client.query(
        `INSERT INTO business_owner_links
           (id, user_id, business_id, role, status, approved_by, approved_at, created_at)
         VALUES ($1, $2, $3, 'owner', 'approved', $2, NOW(), NOW())`,
        [newOwnerLinkId, founder.id, CANONICAL_MWM_BUSINESS_ID],
      );
    }

    const nextState = {
      business: {
        id: business.id,
        status: business.status,
        listingStatus: business.listingStatus,
      },
      activeOwnerLink: { id: newOwnerLinkId, userId: founder.id },
    };
    await client.query(
      `INSERT INTO canonical_mwm_owner_attachment_audit
         (business_id, target_user_id, actor_user_id, action, prior_owner_link_id, prior_owner_user_id, new_owner_link_id, prior_state, next_state)
       VALUES ($1, $2, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)`,
      [
        CANONICAL_MWM_BUSINESS_ID,
        founder.id,
        action,
        priorLink?.id ?? null,
        priorLink?.userId ?? null,
        newOwnerLinkId,
        JSON.stringify(priorState),
        JSON.stringify(nextState),
      ],
    );

    await client.query("COMMIT");
    res.json({
      ok: true,
      action,
      business: {
        id: business.id,
        name: business.name,
        status: business.status,
        listingStatus: business.listingStatus,
      },
      ownerAttached: true,
      businessStateChanged: false,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    req.log.error({ error }, "Canonical Mapping With Melanin owner attachment failed");
    res.status(500).json({ error: "Canonical owner attachment failed without a partial change." });
  } finally {
    client.release();
  }
});

export default router;
