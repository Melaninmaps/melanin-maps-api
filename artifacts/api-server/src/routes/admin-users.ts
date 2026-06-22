import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendApprovalNotification } from "../lib/email";
import { sendPushToUser } from "../lib/pushNotifications";

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
        role: usersTable.role,
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
  const id = String(req.params.id);
  const { approved, role } = req.body;

  if (approved !== undefined && typeof approved !== "boolean") {
    res.status(400).json({ error: "approved must be a boolean" });
    return;
  }
  if (role !== undefined && !["user", "tester", "admin"].includes(role)) {
    res.status(400).json({ error: "role must be one of: user, tester, admin" });
    return;
  }
  if (approved === undefined && role === undefined) {
    res.status(400).json({ error: "Must provide approved or role" });
    return;
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (approved !== undefined) updateData.approved = approved;
  if (role !== undefined) updateData.role = role;

  try {
    const [updated] = await db
      .update(usersTable)
      .set(updateData as any)
      .where(eq(usersTable.id, id))
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        approved: usersTable.approved,
        role: usersTable.role,
      });
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (approved && updated.email) {
      sendApprovalNotification(updated.email, updated.firstName).catch(() => {});
      sendPushToUser(updated.id, {
        title: "You're approved! 🎉",
        body: "Welcome to Mapping With Melanin™. Start discovering now.",
        data: { screen: "/(tabs)/discover" },
      }).catch(() => {});
    }

    res.json({ user: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update user");
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/admin/users/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const id = String(req.params.id);
  const selfId = (req as any).user?.id;
  if (id === selfId) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }
  try {
    const [deleted] = await db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning({ id: usersTable.id, email: usersTable.email });
    if (!deleted) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    req.log.info({ deletedUserId: deleted.id, deletedEmail: deleted.email, by: selfId }, "Admin deleted user account");
    res.json({ ok: true, deleted });
  } catch (err) {
    req.log.error({ err }, "Failed to delete user");
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
