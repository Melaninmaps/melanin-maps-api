import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/push-token", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { token } = req.body as { token?: string };
  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "token required" });
    return;
  }
  try {
    await db
      .update(usersTable)
      .set({ pushToken: token })
      .where(eq(usersTable.id, req.user.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save push token");
    res.status(500).json({ error: "Failed to save push token" });
  }
});

export default router;
