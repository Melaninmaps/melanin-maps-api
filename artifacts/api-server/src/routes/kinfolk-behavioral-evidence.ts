import { Router, type IRouter, type Request, type Response } from "express";
import {
  approveBehavioralEvidence,
  clearBehavioralEvidence,
  getBehavioralEvidenceView,
  removeBehavioralEvidence,
  setBehavioralEvidenceMode,
} from "../kinfolk/behavioral-evidence-runtime";
import {
  BEHAVIORAL_EVIDENCE_DISCLOSURE,
  resolveBehavioralEvidenceMode,
} from "../kinfolk/behavioral-evidence-policy";

const router: IRouter = Router();
const validId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function owner(req: Request, res: Response): string | null {
  res.setHeader("Cache-Control", "no-store");
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return req.user.id;
}

function unavailable(res: Response): void {
  // The schema is optional until the explicitly approved source-only migration
  // runs. Never claim a save or deletion happened while it is unavailable.
  res.status(503).json({
    error: "KINFOLK_BEHAVIORAL_EVIDENCE_SCHEMA_UNAVAILABLE",
    message:
      "Behavioral evidence is unavailable until its approved migration is applied. No behavioral evidence was changed or used.",
  });
}

function malformed(res: Response): void {
  res.status(400).json({ error: "Malformed behavioral evidence request" });
}

router.get("/kinfolk/behavioral-evidence", async (req: Request, res: Response) => {
  const userId = owner(req, res);
  if (!userId) return;
  try {
    const view = await getBehavioralEvidenceView(userId);
    res.json({
      ...view,
      disclosure: BEHAVIORAL_EVIDENCE_DISCLOSURE,
    });
  } catch {
    unavailable(res);
  }
});

router.put("/kinfolk/behavioral-evidence/mode", async (req: Request, res: Response) => {
  const userId = owner(req, res);
  if (!userId) return;
  const requestedMode = isRecord(req.body)
    ? resolveBehavioralEvidenceMode(req.body.mode)
    : null;
  if (
    !isRecord(req.body) ||
    Object.keys(req.body).length !== 1 ||
    !("mode" in req.body) ||
    !requestedMode ||
    requestedMode !== req.body.mode
  ) {
    malformed(res);
    return;
  }
  try {
    const mode = await setBehavioralEvidenceMode(userId, requestedMode);
    res.json({ mode });
  } catch {
    unavailable(res);
  }
});

router.patch(
  "/kinfolk/behavioral-evidence/:id/approve",
  async (req: Request, res: Response) => {
    const userId = owner(req, res);
    if (!userId) return;
    if (!validId(req.params.id) || (req.body != null && (!isRecord(req.body) || Object.keys(req.body).length))) {
      malformed(res);
      return;
    }
    try {
      const evidence = await approveBehavioralEvidence(userId, req.params.id);
      if (!evidence) {
        res.status(404).json({ error: "Behavioral evidence not found" });
        return;
      }
      res.json({ evidence });
    } catch {
      unavailable(res);
    }
  },
);

router.delete("/kinfolk/behavioral-evidence/:id", async (req: Request, res: Response) => {
  const userId = owner(req, res);
  if (!userId) return;
  if (!validId(req.params.id)) {
    // Use the same generic response for malformed and cross-owner direct IDs.
    res.status(404).json({ error: "Behavioral evidence not found" });
    return;
  }
  try {
    const removed = await removeBehavioralEvidence(userId, req.params.id);
    if (!removed) {
      res.status(404).json({ error: "Behavioral evidence not found" });
      return;
    }
    res.json({ removed: true });
  } catch {
    unavailable(res);
  }
});

router.delete("/kinfolk/behavioral-evidence", async (req: Request, res: Response) => {
  const userId = owner(req, res);
  if (!userId) return;
  if (req.body != null && (!isRecord(req.body) || Object.keys(req.body).length)) {
    malformed(res);
    return;
  }
  try {
    const removed = await clearBehavioralEvidence(userId);
    res.json({ removed });
  } catch {
    unavailable(res);
  }
});

export default router;
