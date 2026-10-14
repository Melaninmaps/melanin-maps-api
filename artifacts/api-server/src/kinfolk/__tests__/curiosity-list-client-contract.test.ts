import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../../../../../", import.meta.url);
const read = (relative: string) => readFileSync(new URL(relative, root), "utf8");
const web = read("artifacts/web/src/features/library/CuriosityListsPanel.tsx");
const native = read("artifacts/mobile/components/CuriosityListsPanel.tsx");
const kinfolkRoute = read("artifacts/api-server/src/routes/kinfolk.ts");
const webChat = read("artifacts/web/src/pages/travel.tsx");
const nativeChat = read("artifacts/mobile/app/travel.tsx");
const nativeHook = read("artifacts/mobile/hooks/useKinfolk.ts");
const migration = read("artifacts/api-server/migrations/20261014_kinfolk_curiosity_lists.approval-required.sql");

describe("Curiosity Lists Web/native private-management contract", () => {
  it.each([["web", web], ["native", native]] as const)("%s offers private create/edit/reorder/remove and a separately labeled deliberate-use choice", (_surface, source) => {
    expect(source).toContain("Things I Want To Learn"); expect(source).toContain("encrypted at rest"); expect(source).toContain("Allow deliberate Kinfolk use for this list");
    expect(source).toContain("/kinfolk/curiosity-lists"); expect(source).toContain("items/order"); expect(source).toContain("memberConfirmed"); expect(source).toContain("Remove");
    expect(source).not.toMatch(/(?:score|streak|level|progress|achievement|completion)/i);
    expect(source).not.toMatch(/(?:analytics|trackEvent|localStorage|AsyncStorage|console\.)/i);
  });
  it("requires an explicit, owner-scoped, directly related one-turn chat selection", () => {
    expect(kinfolkRoute).toContain("parseExplicitCuriosityListId");
    expect(kinfolkRoute).toContain("curiosityListConversationSurfaceAllowed");
    expect(kinfolkRoute).toContain("contextForExplicitCuriosityListUse");
    expect(kinfolkRoute).toContain("buildExplicitCuriosityListPrompt");
    expect(kinfolkRoute).toContain("const authenticatedUserId = req.user.id");
    expect(kinfolkRoute).toContain("kinfolkCuriosityListsTable.userId, authenticatedUserId");
    expect(kinfolkRoute).toContain("kinfolkCuriosityListItemsTable.userId, authenticatedUserId");
    expect(kinfolkRoute).toContain("earlyDecision.route === \"general_knowledge\"");
    expect(kinfolkRoute).not.toContain("const allCuriosityLists");
  });
  it.each([["web", webChat], ["native", nativeChat]] as const)("%s primary chat sends only a selected list and clears it after send or cancellation", (_surface, source) => {
    expect(source).toContain("Private Curiosity List — next message only");
    expect(source).toContain("Use this private list for this message");
    expect(source).toContain("Cancel private list use");
    expect(source).toContain("curiosityListId");
    expect(source).toContain("setSelectedCuriosityListId(null)");
    expect(source).toContain("setCuriosityListCandidateId(\"\")");
    expect(source).toContain("allowKinfolkUse === true");
  });
  it("keeps the native chat request contract optional and one-message scoped", () => {
    expect(nativeHook).toContain("curiosityListId?: string");
    expect(nativeHook).toContain("curiosityListId: opts?.curiosityListId ?? undefined");
  });
  it("keeps the migration approval-only and without a backfill", () => {
    expect(migration).toContain("APPROVAL REQUIRED"); expect(migration).toContain("SOURCE ONLY"); expect(migration).not.toContain("INSERT INTO");
  });
});
