import {
  CALENDAR_AVAILABILITY_SOURCES,
  SHARED_PLAN_FREE_BUSY_PURPOSE,
} from "./contracts";
import {
  CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE,
  isCalendarAvailabilityStatePkceAttemptUsable,
} from "./state-pkce";
import type {
  CalendarAvailabilityVaultAccess,
  CalendarAvailabilityVaultEntryInput,
  CalendarAvailabilityVaultHandle,
  CalendarAvailabilityVaultResult,
  CalendarAvailabilityVaultUnavailable,
  CalendarAvailabilityVaultWriteInput,
  InMemoryCalendarAvailabilityVault,
} from "./vault-contracts";

type PlainRecord = Record<string, unknown>;
type ParsedWrite = Readonly<{
  attempt: CalendarAvailabilityVaultWriteInput["attempt"];
  entry: CalendarAvailabilityVaultEntryInput;
}>;

type EntriesByPurpose = Map<string, CalendarAvailabilityVaultEntryInput>;
type EntriesByProvider = Map<string, EntriesByPurpose>;

const UNAVAILABLE =
  CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE as CalendarAvailabilityVaultUnavailable;

function unavailable(): CalendarAvailabilityVaultUnavailable {
  return UNAVAILABLE;
}

function plainRecord(value: unknown): PlainRecord | null {
  try {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype
    ) {
      return null;
    }

    const record: PlainRecord = {};
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") return null;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
        return null;
      }
      record[key] = descriptor.value;
    }
    return record;
  } catch {
    return null;
  }
}

function exactRecord(
  value: unknown,
  expectedKeys: readonly string[],
): PlainRecord | null {
  const record = plainRecord(value);
  if (!record) return null;
  const keys = Object.keys(record);
  return keys.length === expectedKeys.length &&
    keys.every((key) => expectedKeys.includes(key))
    ? record
    : null;
}

function nonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasDeclaredProviderFamily(value: string): boolean {
  return CALENDAR_AVAILABILITY_SOURCES.some((candidate) => candidate === value);
}

function parseEntry(
  value: unknown,
): CalendarAvailabilityVaultEntryInput | null {
  const entry = exactRecord(value, [
    "ownerId",
    "providerFamily",
    "purpose",
    "handle",
    "sealedMaterial",
  ]);
  if (
    !entry ||
    !nonBlankString(entry.ownerId) ||
    !nonBlankString(entry.providerFamily) ||
    !nonBlankString(entry.purpose) ||
    !nonBlankString(entry.handle) ||
    !nonBlankString(entry.sealedMaterial) ||
    entry.purpose !== SHARED_PLAN_FREE_BUSY_PURPOSE ||
    !hasDeclaredProviderFamily(entry.providerFamily)
  ) {
    return null;
  }

  return {
    ownerId: entry.ownerId,
    providerFamily: entry.providerFamily,
    purpose: entry.purpose,
    handle: entry.handle,
    sealedMaterial: entry.sealedMaterial,
  };
}

function parseWrite(value: unknown): ParsedWrite | null {
  const write = exactRecord(value, ["attempt", "entry"]);
  const entry = write ? parseEntry(write.entry) : null;
  return write && entry
    ? {
        attempt:
          write.attempt as CalendarAvailabilityVaultWriteInput["attempt"],
        entry,
      }
    : null;
}

function parseAccess(value: unknown): CalendarAvailabilityVaultAccess | null {
  const access = exactRecord(value, [
    "attempt",
    "ownerId",
    "providerFamily",
    "purpose",
    "handle",
  ]);
  if (
    !access ||
    !nonBlankString(access.ownerId) ||
    !nonBlankString(access.providerFamily) ||
    !nonBlankString(access.purpose) ||
    !nonBlankString(access.handle) ||
    access.purpose !== SHARED_PLAN_FREE_BUSY_PURPOSE ||
    !hasDeclaredProviderFamily(access.providerFamily)
  ) {
    return null;
  }

  return {
    attempt: access.attempt as CalendarAvailabilityVaultAccess["attempt"],
    ownerId: access.ownerId,
    providerFamily: access.providerFamily,
    purpose: access.purpose,
    handle: access.handle,
  };
}

function attemptMatchesTuple(
  attempt: CalendarAvailabilityVaultWriteInput["attempt"],
  ownerId: string,
  providerFamily: string,
  purpose: string,
): boolean {
  try {
    return (
      isCalendarAvailabilityStatePkceAttemptUsable(attempt) &&
      attempt.attempt.ownerId === ownerId &&
      attempt.attempt.providerFamily === providerFamily &&
      attempt.attempt.purpose === purpose
    );
  } catch {
    return false;
  }
}

function opaqueHandle(handle: string): CalendarAvailabilityVaultHandle {
  return Object.freeze({ kind: "opaque-handle" as const, handle });
}

/**
 * Creates an isolated closure for deterministic fixture coverage. The sealed
 * material remains private to this closure and never participates in a public result.
 */
export function createInMemoryCalendarAvailabilityVault(): InMemoryCalendarAvailabilityVault {
  const entriesByOwner = new Map<string, EntriesByProvider>();

  function readStoredEntry(
    ownerId: string,
    providerFamily: string,
    purpose: string,
  ): CalendarAvailabilityVaultEntryInput | null {
    return (
      entriesByOwner.get(ownerId)?.get(providerFamily)?.get(purpose) ?? null
    );
  }

  function write(
    input: CalendarAvailabilityVaultWriteInput,
  ): CalendarAvailabilityVaultResult {
    const parsed = parseWrite(input);
    if (
      !parsed ||
      !attemptMatchesTuple(
        parsed.attempt,
        parsed.entry.ownerId,
        parsed.entry.providerFamily,
        parsed.entry.purpose,
      )
    ) {
      return unavailable();
    }

    let entriesByProvider = entriesByOwner.get(parsed.entry.ownerId);
    if (!entriesByProvider) {
      entriesByProvider = new Map<string, EntriesByPurpose>();
      entriesByOwner.set(parsed.entry.ownerId, entriesByProvider);
    }

    let entriesByPurpose = entriesByProvider.get(parsed.entry.providerFamily);
    if (!entriesByPurpose) {
      entriesByPurpose = new Map<string, CalendarAvailabilityVaultEntryInput>();
      entriesByProvider.set(parsed.entry.providerFamily, entriesByPurpose);
    }

    entriesByPurpose.set(parsed.entry.purpose, parsed.entry);
    return opaqueHandle(parsed.entry.handle);
  }

  function read(
    input: CalendarAvailabilityVaultAccess,
  ): CalendarAvailabilityVaultResult {
    const access = parseAccess(input);
    if (
      !access ||
      !attemptMatchesTuple(
        access.attempt,
        access.ownerId,
        access.providerFamily,
        access.purpose,
      )
    ) {
      return unavailable();
    }

    const entry = readStoredEntry(
      access.ownerId,
      access.providerFamily,
      access.purpose,
    );
    return entry && entry.handle === access.handle
      ? opaqueHandle(entry.handle)
      : unavailable();
  }

  function revoke(
    input: CalendarAvailabilityVaultAccess,
  ): CalendarAvailabilityVaultUnavailable {
    const access = parseAccess(input);
    if (
      !access ||
      !attemptMatchesTuple(
        access.attempt,
        access.ownerId,
        access.providerFamily,
        access.purpose,
      )
    ) {
      return unavailable();
    }

    const entriesByProvider = entriesByOwner.get(access.ownerId);
    const entriesByPurpose = entriesByProvider?.get(access.providerFamily);
    const entry = entriesByPurpose?.get(access.purpose);
    if (
      !entriesByProvider ||
      !entriesByPurpose ||
      !entry ||
      entry.handle !== access.handle
    ) {
      return unavailable();
    }

    entriesByPurpose.delete(access.purpose);
    if (entriesByPurpose.size === 0) {
      entriesByProvider.delete(access.providerFamily);
    }
    if (entriesByProvider.size === 0) {
      entriesByOwner.delete(access.ownerId);
    }

    return unavailable();
  }

  return Object.freeze({ write, read, revoke });
}
