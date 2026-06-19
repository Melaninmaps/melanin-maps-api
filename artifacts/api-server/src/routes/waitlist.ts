import { Router, type IRouter, type Request, type Response } from "express";
import { db, waitlistTable } from "@workspace/db";
import { count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.post("/waitlist", async (req: Request, res: Response) => {
  try {
    const { email, referralCode, referredBy } = req.body as {
      email?: string;
      referralCode?: string;
      referredBy?: string;
    };

    if (!email || !email.includes("@")) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    const code = referralCode ?? email.replace(/[@.]/g, "").toUpperCase().slice(0, 8);

    await db
      .insert(waitlistTable)
      .values({ email: email.toLowerCase().trim(), referralCode: code, referredBy: referredBy ?? null })
      .onConflictDoNothing();

    const [{ total }] = await db.select({ total: count() }).from(waitlistTable);

    res.status(201).json({ success: true, position: Number(total), referralCode: code });
  } catch (err) {
    req.log.error({ err }, "Failed to join waitlist");
    res.status(500).json({ error: "Failed to join waitlist" });
  }
});

router.get("/waitlist/count", async (_req: Request, res: Response) => {
  try {
    const [{ total }] = await db.select({ total: count() }).from(waitlistTable);
    res.json({ count: Number(total) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch count" });
  }
});

export default router;
