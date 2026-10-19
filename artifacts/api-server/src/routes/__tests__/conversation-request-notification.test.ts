import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const conversations = source("../conversations.ts");
const notifications = source("../../community/communitySocialNotifications.ts");

function createConversationRoute(): string {
  const marker = 'router.post("/conversations", async (req: Request, res: Response) => {';
  const start = conversations.indexOf(marker);
  if (start < 0) throw new Error("Missing conversation creation route");
  const end = conversations.indexOf("// ─── POST /api/conversations/:id/accept", start);
  return conversations.slice(start, end < 0 ? undefined : end);
}

function notificationCallSlice(route: string): string {
  const marker = "void deliverCommunitySocialNotification({";
  const start = route.indexOf(marker);
  if (start < 0) throw new Error("Missing conversation-request notification call");
  const end = route.indexOf("return void res.status(201).json({ conversation: conv });", start);
  return route.slice(start, end < 0 ? undefined : end);
}

describe("private pending DM request recipient notification", () => {
  it("delivers only after a newly inserted private-recipient pending request, never existing reuse or accepted creation", () => {
    const route = createConversationRoute();
    const existingReuse = 'if (existing.length > 0) return void res.json({ conversation: existing[0] });';
    const requestStatus = 'const requestStatus: "pending" | "accepted" = recipient.isPrivate ? "pending" : "accepted";';
    const insert = "const [conv] = await db";
    const pendingOnly = 'if (requestStatus === "pending") {';
    const notification = "void deliverCommunitySocialNotification({";

    for (const token of [existingReuse, requestStatus, insert, pendingOnly, notification]) {
      expect(route).toContain(token);
    }
    expect(route.indexOf(existingReuse)).toBeLessThan(route.indexOf(requestStatus));
    expect(route.indexOf(requestStatus)).toBeLessThan(route.indexOf(insert));
    expect(route.indexOf(insert)).toBeLessThan(route.indexOf(pendingOnly));
    expect(route.indexOf(pendingOnly)).toBeLessThan(route.indexOf(notification));
    expect((route.match(/deliverCommunitySocialNotification\(/g) ?? [])).toHaveLength(1);
  });

  it("uses generic Messages copy and only the new conversation identifier for recipient inbox routing", () => {
    const payload = notificationCallSlice(createConversationRoute());
    expect(payload).toContain('title: "Messages",');
    expect(payload).toContain('body: "You have a new item in Messages.",');
    expect(payload).toContain('entityType: "conversation_request",');
    expect(payload).toContain("entityId: String(conv.id),");
    expect(payload).toContain("data: { conversationId: conv.id },");
    for (const forbidden of [
      "title: title",
      "content:",
      "participantIds:",
      "businessId:",
      "location",
      "trip",
      "flight",
      "account",
      "grant",
      "req.body",
    ]) {
      expect(payload).not.toContain(forbidden);
    }
  });

  it("keeps blocked, recipient opt-in, and self suppression inside the existing social notification helper", () => {
    expect(notifications).toContain('entityType: "community_post" | "member_profile" | "conversation_request";');
    expect(notifications).toContain("if (notification.recipientId === notification.actorId)");
    expect(notifications).toContain("participantsAreBlocked(notification.actorId, notification.recipientId)");
    expect(notifications).toContain("recipientAllowsCommunityActivity(notification.recipientId)");
    expect(notifications).toContain("recipient?.notifCommunity === true");
    expect(notifications).toContain("blockerId, actorId");
    expect(notifications).toContain("blockedId, recipientId");
    expect(notifications).toContain("blockerId, recipientId");
    expect(notifications).toContain("blockedId, actorId");
  });

  it("makes notification and push failure non-critical after the successful conversation insert", () => {
    const route = createConversationRoute();
    const payload = notificationCallSlice(route);
    const inserted = route.indexOf("const [conv] = await db");
    const notification = route.indexOf("void deliverCommunitySocialNotification({");
    const response = route.indexOf("return void res.status(201).json({ conversation: conv });");
    expect(inserted).toBeLessThan(notification);
    expect(payload).toContain("}).catch(() => {});");
    expect(notification).toBeLessThan(response);
    expect(notifications).toContain("void sendPushToUser(notification.recipientId");
    expect(notifications).toContain("}).catch(() => {});");
  });
});
