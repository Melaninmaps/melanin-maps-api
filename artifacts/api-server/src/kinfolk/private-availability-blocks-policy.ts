import {
  encryptOrdinaryMemoryContent,
  PrivateMemoryEncryptionIntegrityError,
  readOrdinaryMemoryContent,
} from "./private-memory-encryption";

export const AVAILABILITY_BLOCK_STORAGE_PLACEHOLDER = "[Encrypted private memory]";
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const supportedTimeZones = new Set(
  (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone") ?? [],
);

type AvailabilityField = "label" | "startAt" | "endAt" | "timeZone";

type AvailabilityIdentity = Pick<StoredPrivateAvailabilityBlock, "id" | "userId">;

type AvailabilityInterval = Readonly<{ startMs: number; endMs: number }>;

function exactObject(body: unknown, allowed: readonly string[]): body is Record<string, unknown> {
  return Boolean(body) && typeof body === "object" && !Array.isArray(body) &&
    Object.keys(body as Record<string, unknown>).every((key) => allowed.includes(key));
}

function text(value: unknown, maxLength: number, required: boolean): string | null {
  if (value === undefined && !required) return "";
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if ((required && !normalized) || normalized.length > maxLength || CONTROL.test(normalized)) return null;
  return normalized;
}

function localDateTime(value: unknown): string | null {
  if (typeof value !== "string" || !LOCAL_DATE_TIME.test(value)) return null;
  const match = LOCAL_DATE_TIME.exec(value)!;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (year < 100 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59) return null;
  const candidate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day && candidate.getUTCHours() === hour && candidate.getUTCMinutes() === minute
    ? value
    : null;
}

/** Canonical IANA names only; aliases and fixed-offset identifiers are not accepted. */
function ianaTimeZone(value: unknown): string | null {
  if (typeof value !== "string" || CONTROL.test(value) || value.trim() !== value || value.length > 80) return null;
  // Intl canonicalizes Etc/UTC to UTC but Etc/UTC is the IANA identifier for the UTC zone.
  return value === "Etc/UTC" || supportedTimeZones.has(value) ? value : null;
}

function partsAt(instant: number, timeZone: string): Record<string, string> {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-gregory", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instant));
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

function offsetAt(instant: number, timeZone: string): number {
  const parts = partsAt(instant, timeZone);
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second)) - instant;
}

function renderedLocalDateTime(instant: number, timeZone: string): string {
  const parts = partsAt(instant, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/**
 * Reject ambiguous and skipped local times rather than silently selecting a DST
 * interpretation. The selected local time and canonical IANA zone stay encrypted.
 */
function localInstant(value: string, timeZone: string): number | null {
  const match = LOCAL_DATE_TIME.exec(value)!;
  const naiveUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
  const offsets = new Set<number>();
  for (let offsetHours = -48; offsetHours <= 48; offsetHours += 6) {
    offsets.add(offsetAt(naiveUtc + offsetHours * 60 * 60 * 1_000, timeZone));
  }
  const matches = [...offsets]
    .map((offset) => naiveUtc - offset)
    .filter((candidate) => renderedLocalDateTime(candidate, timeZone) === value);
  return matches.length === 1 ? matches[0]! : null;
}

function interval(startAt: string, endAt: string, timeZone: string): AvailabilityInterval | null {
  const startMs = localInstant(startAt, timeZone);
  const endMs = localInstant(endAt, timeZone);
  return startMs !== null && endMs !== null && endMs > startMs ? { startMs, endMs } : null;
}

export type PrivateAvailabilityBlockInput = Readonly<{
  label: string;
  startAt: string;
  endAt: string;
  timeZone: string;
  planningOptIn: boolean;
}>;

export type PrivateAvailabilityPreviewInput = Readonly<{
  startAt: string;
  endAt: string;
  timeZone: string;
}>;

function parseBlockValues(body: Record<string, unknown>): PrivateAvailabilityBlockInput | null {
  const label = text(body.label, 120, false);
  const startAt = localDateTime(body.startAt);
  const endAt = localDateTime(body.endAt);
  const timeZone = ianaTimeZone(body.timeZone);
  const planningOptIn = body.planningOptIn;
  return label !== null && startAt && endAt && timeZone && typeof planningOptIn === "boolean" &&
    interval(startAt, endAt, timeZone)
    ? { label, startAt, endAt, timeZone, planningOptIn }
    : null;
}

/** Every create/update replaces this manual private record only after a member confirmation. */
export function parsePrivateAvailabilityBlockInput(body: unknown): PrivateAvailabilityBlockInput | null {
  if (!exactObject(body, ["label", "startAt", "endAt", "timeZone", "planningOptIn", "memberConfirmed"]) || body.memberConfirmed !== true) return null;
  return parseBlockValues(body);
}

/** Preview is an explicit member request, never an automatic context read. */
export function parsePrivateAvailabilityPreviewInput(body: unknown): PrivateAvailabilityPreviewInput | null {
  if (!exactObject(body, ["startAt", "endAt", "timeZone", "memberConfirmed"]) || body.memberConfirmed !== true) return null;
  const startAt = localDateTime(body.startAt);
  const endAt = localDateTime(body.endAt);
  const timeZone = ianaTimeZone(body.timeZone);
  return startAt && endAt && timeZone && interval(startAt, endAt, timeZone) ? { startAt, endAt, timeZone } : null;
}

export function parsePrivateAvailabilityBlockDeleteConfirmation(body: unknown): boolean {
  return exactObject(body, ["memberConfirmed"]) && body.memberConfirmed === true;
}

export function isPrivateAvailabilityBlockId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export type StoredPrivateAvailabilityBlock = Readonly<{
  id: string;
  userId: string;
  label: string;
  encryptedLabel: string;
  labelEncryptionKeyId: string;
  startAt: string;
  encryptedStartAt: string;
  startAtEncryptionKeyId: string;
  endAt: string;
  encryptedEndAt: string;
  endAtEncryptionKeyId: string;
  timeZone: string;
  encryptedTimeZone: string;
  timeZoneEncryptionKeyId: string;
  planningOptIn: boolean;
  memberConfirmedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}>;

function purpose(block: AvailabilityIdentity, field: AvailabilityField): string {
  return JSON.stringify(["kinfolk-private-availability-block-v1", block.userId, block.id, field]);
}

function sealField(value: string, block: AvailabilityIdentity, field: AvailabilityField) {
  const encrypted = encryptOrdinaryMemoryContent(JSON.stringify({ [field]: value }), block.userId, purpose(block, field));
  return { placeholder: encrypted.content, ciphertext: encrypted.encryptedContent, keyId: encrypted.encryptionKeyId };
}

function storedField(block: StoredPrivateAvailabilityBlock, field: AvailabilityField) {
  switch (field) {
    case "label": return { content: block.label, encryptedContent: block.encryptedLabel, encryptionKeyId: block.labelEncryptionKeyId };
    case "startAt": return { content: block.startAt, encryptedContent: block.encryptedStartAt, encryptionKeyId: block.startAtEncryptionKeyId };
    case "endAt": return { content: block.endAt, encryptedContent: block.encryptedEndAt, encryptionKeyId: block.endAtEncryptionKeyId };
    case "timeZone": return { content: block.timeZone, encryptedContent: block.encryptedTimeZone, encryptionKeyId: block.timeZoneEncryptionKeyId };
  }
}

function openField(block: StoredPrivateAvailabilityBlock, owner: string, field: AvailabilityField): string {
  const stored = storedField(block, field);
  if (stored.content !== AVAILABILITY_BLOCK_STORAGE_PLACEHOLDER || !stored.encryptedContent || !stored.encryptionKeyId) {
    throw new PrivateMemoryEncryptionIntegrityError();
  }
  const opened = readOrdinaryMemoryContent({ ...stored, purpose: purpose(block, field) }, owner);
  try {
    const value = (JSON.parse(opened) as Record<string, unknown>)[field];
    if (typeof value !== "string") throw new Error();
    return value;
  } catch {
    throw new PrivateMemoryEncryptionIntegrityError();
  }
}

/** Encrypts every member-entered label and time detail, binding each field to owner and record. */
export function sealPrivateAvailabilityBlock(input: PrivateAvailabilityBlockInput, block: AvailabilityIdentity) {
  const label = sealField(input.label, block, "label");
  const startAt = sealField(input.startAt, block, "startAt");
  const endAt = sealField(input.endAt, block, "endAt");
  const timeZone = sealField(input.timeZone, block, "timeZone");
  return {
    label: label.placeholder,
    encryptedLabel: label.ciphertext,
    labelEncryptionKeyId: label.keyId,
    startAt: startAt.placeholder,
    encryptedStartAt: startAt.ciphertext,
    startAtEncryptionKeyId: startAt.keyId,
    endAt: endAt.placeholder,
    encryptedEndAt: endAt.ciphertext,
    endAtEncryptionKeyId: endAt.keyId,
    timeZone: timeZone.placeholder,
    encryptedTimeZone: timeZone.ciphertext,
    timeZoneEncryptionKeyId: timeZone.keyId,
    planningOptIn: input.planningOptIn,
  };
}

/** Opens only an authenticated owner-scoped complete record; malformed stored intervals fail closed. */
export function openPrivateAvailabilityBlock(block: StoredPrivateAvailabilityBlock, owner: string): PrivateAvailabilityBlockInput {
  if (block.userId !== owner || !isPrivateAvailabilityBlockId(block.id) || !block.memberConfirmedAt || typeof block.planningOptIn !== "boolean") {
    throw new PrivateMemoryEncryptionIntegrityError();
  }
  const input = parseBlockValues({
    label: openField(block, owner, "label"),
    startAt: openField(block, owner, "startAt"),
    endAt: openField(block, owner, "endAt"),
    timeZone: openField(block, owner, "timeZone"),
    planningOptIn: block.planningOptIn,
  });
  if (!input) throw new PrivateMemoryEncryptionIntegrityError();
  return input;
}

/** Returns only a transient overlap calculation; labels and stored commitments never enter the result. */
export function privateAvailabilityConflicts(
  prospective: PrivateAvailabilityPreviewInput,
  blocks: readonly PrivateAvailabilityBlockInput[],
): number {
  const requestInterval = interval(prospective.startAt, prospective.endAt, prospective.timeZone);
  if (!requestInterval) throw new PrivateMemoryEncryptionIntegrityError();
  return blocks.reduce((count, block) => {
    if (!block.planningOptIn) return count;
    const blockInterval = interval(block.startAt, block.endAt, block.timeZone);
    if (!blockInterval) throw new PrivateMemoryEncryptionIntegrityError();
    return blockInterval.startMs < requestInterval.endMs && requestInterval.startMs < blockInterval.endMs ? count + 1 : count;
  }, 0);
}

/**
 * Manual private commitment storage only. It does not read, connect, sync, or
 * block any external calendar. Preview is member-confirmed and returns a safe
 * conflict summary only; it does not automatically use Kinfolk chat or memory,
 * profile, discovery, Map, Directory, Community, Safety, providers, reminders,
 * notifications, sharing, analytics, or any external service.
 */
export const KINFOLK_PRIVATE_AVAILABILITY_DEFAULT_NON_USE = Object.freeze([
  "Manual private availability blocks only; no external calendar is read, connected, synced, or blocked.",
  "Preview happens only after an explicit member-confirmed request and is not automatic Kinfolk chat or memory use.",
  "No profile, discovery, Map, Directory, Community, Safety, provider, reminder, notification, sharing, or analytics integration.",
  "A live calendar provider integration remains a separate future approval gate.",
]);
