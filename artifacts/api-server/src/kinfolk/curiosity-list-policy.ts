import type { KinfolkCuriosityList, KinfolkCuriosityListItem } from "@workspace/db";
import {
  encryptOrdinaryMemoryContent,
  PrivateMemoryEncryptionIntegrityError,
  readOrdinaryMemoryContent,
} from "./private-memory-encryption";

const PLACEHOLDER = "[Encrypted private memory]";
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CuriosityListInput = { name: string };
export type CuriosityItemInput = { text: string };
export type CuriosityListUseInput = { allowKinfolkUse: boolean };
export type CuriosityListOrderInput = { itemIds: string[] };

function privateText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  return text.length > 0 && text.length <= maxLength && !CONTROL.test(text) ? text : null;
}
function exactObject(body: unknown, allowed: readonly string[]): body is Record<string, unknown> {
  return Boolean(body) && typeof body === "object" && !Array.isArray(body) &&
    Object.keys(body as Record<string, unknown>).every((key) => allowed.includes(key));
}
/** An affirmative action is required for every private-content mutation. */
function confirmed(body: Record<string, unknown>): boolean { return body.memberConfirmed === true; }

export function parseCuriosityListInput(body: unknown): CuriosityListInput | null {
  if (!exactObject(body, ["name", "memberConfirmed"]) || !confirmed(body)) return null;
  const name = privateText(body.name, 100);
  return name ? { name } : null;
}
export function parseCuriosityItemInput(body: unknown): CuriosityItemInput | null {
  if (!exactObject(body, ["text", "memberConfirmed"]) || !confirmed(body)) return null;
  const text = privateText(body.text, 500);
  return text ? { text } : null;
}
export function parseCuriosityListUseInput(body: unknown): CuriosityListUseInput | null {
  if (!exactObject(body, ["allowKinfolkUse", "memberConfirmed"]) || !confirmed(body) || typeof body.allowKinfolkUse !== "boolean") return null;
  return { allowKinfolkUse: body.allowKinfolkUse };
}
export function parseCuriosityListOrderInput(body: unknown): CuriosityListOrderInput | null {
  if (!exactObject(body, ["itemIds", "memberConfirmed"]) || !confirmed(body) || !Array.isArray(body.itemIds) || body.itemIds.length > 100) return null;
  const itemIds = body.itemIds;
  if (itemIds.some((id) => typeof id !== "string" || !UUID.test(id)) || new Set(itemIds).size !== itemIds.length) return null;
  return { itemIds };
}
export function parseMemberConfirmation(body: unknown): boolean {
  return exactObject(body, ["memberConfirmed"]) && confirmed(body);
}
export function isCuriosityListId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function listPurpose(list: Pick<KinfolkCuriosityList, "id">): string {
  return JSON.stringify(["kinfolk-curiosity-list-v1", list.id, "name"]);
}
function itemPurpose(item: Pick<KinfolkCuriosityListItem, "id" | "listId">): string {
  return JSON.stringify(["kinfolk-curiosity-list-v1", item.listId, item.id, "item"]);
}
export function sealCuriosityListName(name: string, list: Pick<KinfolkCuriosityList, "id" | "userId">) {
  const encrypted = encryptOrdinaryMemoryContent(JSON.stringify({ name }), list.userId, listPurpose(list));
  return { name: encrypted.content, encryptedName: encrypted.encryptedContent, encryptionKeyId: encrypted.encryptionKeyId };
}
export function openCuriosityListName(list: KinfolkCuriosityList, owner: string): string {
  if (list.userId !== owner || list.name !== PLACEHOLDER || !list.encryptedName || !list.encryptionKeyId) throw new PrivateMemoryEncryptionIntegrityError();
  const opened = readOrdinaryMemoryContent({ content: list.name, purpose: listPurpose(list), encryptedContent: list.encryptedName, encryptionKeyId: list.encryptionKeyId }, owner);
  try {
    const payload = JSON.parse(opened) as { name?: unknown };
    const name = privateText(payload.name, 100);
    if (!name) throw new Error();
    return name;
  } catch { throw new PrivateMemoryEncryptionIntegrityError(); }
}
export function sealCuriosityItemText(text: string, item: Pick<KinfolkCuriosityListItem, "id" | "listId" | "userId">) {
  const encrypted = encryptOrdinaryMemoryContent(JSON.stringify({ text }), item.userId, itemPurpose(item));
  return { itemText: encrypted.content, encryptedItemText: encrypted.encryptedContent, encryptionKeyId: encrypted.encryptionKeyId };
}
export function openCuriosityItemText(item: KinfolkCuriosityListItem, owner: string): string {
  if (item.userId !== owner || item.itemText !== PLACEHOLDER || !item.encryptedItemText || !item.encryptionKeyId) throw new PrivateMemoryEncryptionIntegrityError();
  const opened = readOrdinaryMemoryContent({ content: item.itemText, purpose: itemPurpose(item), encryptedContent: item.encryptedItemText, encryptionKeyId: item.encryptionKeyId }, owner);
  try {
    const payload = JSON.parse(opened) as { text?: unknown };
    const text = privateText(payload.text, 500);
    if (!text) throw new Error();
    return text;
  } catch { throw new PrivateMemoryEncryptionIntegrityError(); }
}
