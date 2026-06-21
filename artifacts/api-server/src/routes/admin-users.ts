import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email);
}

const router: IRouter = Router();

router.get("/admin/users", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const users = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        approved: usersTable.approved,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));
    res.json({ users });
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.status(500).json({ error: "Failed to list users" });
  }
});

router.patch("/admin/users/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { id } = req.params;
  const { approved } = req.body;
  if (typeof approved !== "boolean") {
    res.status(400).json({ error: "approved must be a boolean" });
    return;
  }
  try {
    const [updated] = await db
      .update(usersTable)
      .set({ approved, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning({ id: usersTable.id, approved: usersTable.approved });
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update user approval");
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;
