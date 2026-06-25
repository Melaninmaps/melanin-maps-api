import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const COOLDOWN_HOURS = 24;

export async function requireTrust(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" });
    return;
  }

  const [user] = await db
    .select({ approved: usersTable.approved, createdAt: usersTable.createdAt })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found", code: "AUTH_REQUIRED" });
    return;
  }

  if (!user.approved) {
    res.status(403).json({
      error: "Your account has been suspended. Contact hello@mappingwithmelanin.com to appeal.",
      code: "ACCOUNT_SUSPENDED",
    });
    return;
  }

  const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
  const accountAgeHours = accountAgeMs / (1000 * 60 * 60);
  if (accountAgeHours < COOLDOWN_HOURS) {
    const hoursLeft = Math.ceil(COOLDOWN_HOURS - accountAgeHours);
    res.status(403).json({
      error: `New accounts must wait ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""} before posting community content. This protects our community from spam.`,
      code: "ACCOUNT_COOLDOWN",
      hoursLeft,
    });
    return;
  }

  next();
}
