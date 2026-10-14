import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KinfolkCuriosityList, KinfolkCuriosityListItem } from "@workspace/db";
import {
  openCuriosityItemText,
  openCuriosityListName,
  parseCuriosityItemInput,
  parseCuriosityListInput,
  parseCuriosityListOrderInput,
  parseCuriosityListUseInput,
  sealCuriosityItemText,
  sealCuriosityListName,
} from "../curiosity-list-policy";
import { contextForExplicitCuriosityListUse, isDirectlyRelatedCuriosityRequest } from "../curiosity-list-conversation-use";
import { PrivateMemoryEncryptionIntegrityError } from "../private-memory-encryption";

const LIST_ID = "10000000-0000-4000-8000-000000000001";
const ITEM_ID = "10000000-0000-4000-8000-000000000002";
beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 41).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-curiosity-v1");
});
afterEach(() => vi.unstubAllEnvs());
function list(patch: Partial<KinfolkCuriosityList> = {}): KinfolkCuriosityList {
  const base = { id: LIST_ID, userId: "owner-a", allowKinfolkUse: false, createdAt: new Date(), updatedAt: new Date() };
  return { ...base, ...sealCuriosityListName("Yoruba textile traditions", base), ...patch } as KinfolkCuriosityList;
}
function item(patch: Partial<KinfolkCuriosityListItem> = {}): KinfolkCuriosityListItem {
  const base = { id: ITEM_ID, listId: LIST_ID, userId: "owner-a", position: 0, createdAt: new Date(), updatedAt: new Date() };
  return { ...base, ...sealCuriosityItemText("Adire indigo dyeing", base), ...patch } as KinfolkCuriosityListItem;
}

describe("private Curiosity List validation and encryption", () => {
  it("requires exact member confirmation, allowlists, and bounded private text", () => {
    expect(parseCuriosityListInput({ name: "  Yoruba textiles  ", memberConfirmed: true })).toEqual({ name: "Yoruba textiles" });
    expect(parseCuriosityItemInput({ text: "Adire", memberConfirmed: true })).toEqual({ text: "Adire" });
    expect(parseCuriosityListUseInput({ allowKinfolkUse: false, memberConfirmed: true })).toEqual({ allowKinfolkUse: false });
    expect(parseCuriosityListOrderInput({ itemIds: [ITEM_ID], memberConfirmed: true })).toEqual({ itemIds: [ITEM_ID] });
    for (const body of [{ name: "", memberConfirmed: true }, { name: "x".repeat(101), memberConfirmed: true }, { name: "valid", memberConfirmed: false }, { name: "valid", memberConfirmed: true, userId: "owner-b" }]) expect(parseCuriosityListInput(body)).toBeNull();
    for (const body of [{ text: "x".repeat(501), memberConfirmed: true }, { text: "topic", memberConfirmed: "true" }, { text: "topic", memberConfirmed: true, position: 9 }]) expect(parseCuriosityItemInput(body)).toBeNull();
    expect(parseCuriosityListOrderInput({ itemIds: [ITEM_ID, ITEM_ID], memberConfirmed: true })).toBeNull();
  });
  it("stores placeholders and ciphertext rather than list or item plaintext", () => {
    const privateList = list(); const privateItem = item();
    expect(privateList.name).toBe("[Encrypted private memory]"); expect(privateItem.itemText).toBe("[Encrypted private memory]");
    expect(JSON.stringify({ privateList, privateItem })).not.toContain("Yoruba textile traditions");
    expect(JSON.stringify({ privateList, privateItem })).not.toContain("Adire indigo dyeing");
    expect(openCuriosityListName(privateList, "owner-a")).toBe("Yoruba textile traditions");
    expect(openCuriosityItemText(privateItem, "owner-a")).toBe("Adire indigo dyeing");
    expect(() => openCuriosityListName(privateList, "owner-b")).toThrow(PrivateMemoryEncryptionIntegrityError);
    expect(() => openCuriosityItemText({ ...privateItem, listId: "10000000-0000-4000-8000-000000000003" }, "owner-a")).toThrow(PrivateMemoryEncryptionIntegrityError);
  });
});

describe("future explicit conversational Curiosity List use", () => {
  it("returns selected owner content only for an enabled directly related request", () => {
    const privateList = list({ allowKinfolkUse: true }); const privateItem = item();
    const context = contextForExplicitCuriosityListUse({ lists: [privateList], items: [privateItem], request: { authenticatedOwner: "owner-a", selectedListId: LIST_ID, message: "Help me learn about Yoruba weaving.", memberRequestedUse: true } });
    expect(context).toEqual({ listId: LIST_ID, name: "Yoruba textile traditions", items: ["Adire indigo dyeing"] });
    expect(isDirectlyRelatedCuriosityRequest("What is Yoruba weaving?", "Yoruba textile traditions", ["Adire indigo dyeing"])).toBe(true);
  });
  it("returns nothing for unrelated, disabled, revoked, or other-owner selection", () => {
    const enabled = list({ allowKinfolkUse: true }); const privateItem = item();
    const request = { authenticatedOwner: "owner-a", selectedListId: LIST_ID, memberRequestedUse: true as const };
    expect(contextForExplicitCuriosityListUse({ lists: [enabled], items: [privateItem], request: { ...request, message: "What is the weather tomorrow?" } })).toBeNull();
    expect(contextForExplicitCuriosityListUse({ lists: [{ ...enabled, allowKinfolkUse: false }], items: [privateItem], request: { ...request, message: "Tell me about Yoruba history" } })).toBeNull();
    expect(contextForExplicitCuriosityListUse({ lists: [enabled], items: [privateItem], request: { ...request, authenticatedOwner: "owner-b", message: "Tell me about Yoruba history" } })).toBeNull();
    expect(contextForExplicitCuriosityListUse({ lists: [enabled], items: [privateItem], request: { ...request, selectedListId: "10000000-0000-4000-8000-000000000099", message: "Tell me about Yoruba history" } })).toBeNull();
  });
});
