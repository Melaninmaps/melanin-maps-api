import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("social authorization contracts", () => {
  const conversations = source("../routes/conversations.ts");
  const circles = source("../routes/circles.ts");

  it("protects direct messages from nonparticipants, blocks, and unavailable recipients", () => {
    expect(conversations).toContain("function conversationHasParticipant");
    expect(conversations).toContain("async function usersAreBlocked");
    expect(conversations).toContain("async function dmConversationIsBlocked");
    expect(conversations).toContain("userBlocksTable");
    expect(conversations).toContain("Recipient not found");
    expect(conversations).toContain("This member is not accepting direct messages");
    expect(conversations).toContain("A direct message is unavailable for this member");
    expect(conversations).toContain("Conversation not found");
    expect(conversations.match(/conversationHasParticipant\(conv, req\.user\.id\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(conversations.match(/dmConversationIsBlocked\(conv, req\.user\.id\)/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("requires Circle membership and binds all votes to the URL Circle", () => {
    expect(circles).toMatch(/router\.post\("\/circles\/:id\/suggestions\/:sugId\/upvote",[\s\S]*?getCircleWithAuth\(circleId, uid\(req\), res\)/);
    expect(circles).toMatch(/router\.delete\("\/circles\/:id\/suggestions\/:sugId",[\s\S]*?getCircleWithAuth\(circleId, uid\(req\), res\)/);
    expect(circles).toContain("The selected member is not in this circle");
    expect(circles).toContain("Plan not found in this circle");
    expect(circles).toContain("plan.circleId !== circleId");
  });
});
