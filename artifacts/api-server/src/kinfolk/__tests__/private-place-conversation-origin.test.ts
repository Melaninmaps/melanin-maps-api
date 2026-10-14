import { describe, expect, it } from "vitest";
import {
  resolveExplicitPrivatePlaceLabel,
  resolvePrivatePlaceConversationOrigin,
} from "../private-place-conversation-origin";
import {
  PRIVATE_PLACES_EXPLICIT_NEARBY_DISCLOSURE_VERSION,
  sealPrivatePlace,
} from "../private-places-policy";

const ENV = {
  KINFOLK_PRIVATE_PLACES_ENABLED: "true",
  KINFOLK_PRIVATE_PLACES_ENCRYPTION_KEYS: `v1:${Buffer.alloc(32, 23).toString("base64")}`,
} as NodeJS.ProcessEnv;

function sealedPlace(latitude = 39.9526, longitude = -75.1652) {
  return sealPrivatePlace({
    exactAddress: "1234 Private Lane, Philadelphia, PA 19103",
    googleFormattedAddress: "1234 Private Lane, Philadelphia, PA 19103, USA",
    latitude,
    longitude,
  }, ENV);
}

function dependencies(rows: readonly Record<string, unknown>[]) {
  const calls: Array<{ statement: string; values: readonly unknown[] }> = [];
  const radiusCalls: unknown[] = [];
  return {
    calls,
    radiusCalls,
    dependencies: {
      environment: ENV,
      query: {
        query: async <T extends { id: string; label: string; encrypted_payload: string; encryption_key_version: string; geocode_provider: string; is_active: boolean; disclosure_version: string }>(
          statement: string,
          values: readonly unknown[],
        ) => {
          calls.push({ statement, values });
          return { rows: rows as readonly T[] };
        },
      },
      repository: {
        findWithinRadius: async (scope: unknown) => {
          radiusCalls.push(scope);
          return [];
        },
      },
    },
  };
}

describe("private Saved Place conversation origin", () => {
  it("requires a nearby-business request and an exact active member label, never a casual mention", () => {
    expect(resolveExplicitPrivatePlaceLabel("Can you recommend coffee near Mom's house?", ["Mom's house", "Work"]))
      .toBe("Mom's house");
    expect(resolveExplicitPrivatePlaceLabel("I miss Mom's house today.", ["Mom's house"])).toBeNull();
    expect(resolveExplicitPrivatePlaceLabel("Find coffee near my house", ["Mom's house"])).toBeNull();
    expect(resolveExplicitPrivatePlaceLabel("What is near Mom's house?", ["Mom's house"])).toBeNull();
    expect(resolveExplicitPrivatePlaceLabel("Anything near Mom's house?", ["Mom's house"])).toBeNull();
    expect(resolveExplicitPrivatePlaceLabel("Find a clinic near Mom's house.", ["Mom's house"])).toBeNull();
  });

  it("does not use a Saved Place for qualified care navigation", async () => {
    const sealed = sealedPlace();
    const fixture = dependencies([{
      id: "place-care",
      label: "Mom's house",
      encrypted_payload: sealed.encryptedPayload,
      encryption_key_version: sealed.encryptionKeyVersion,
      geocode_provider: "google_maps",
      is_active: true,
      disclosure_version: PRIVATE_PLACES_EXPLICIT_NEARBY_DISCLOSURE_VERSION,
    }]);
    await expect(resolvePrivatePlaceConversationOrigin({
      ownerId: "member-a",
      message: "Find a clinic near Mom's house.",
      dependencies: fixture.dependencies,
    })).resolves.toEqual({ state: "not_requested" });
    expect(fixture.calls).toEqual([]);
    expect(fixture.radiusCalls).toEqual([]);
  });

  it("uses an owner-scoped active row and passes only decrypted coordinates to governed discovery", async () => {
    const sealed = sealedPlace(39.9526, -75.1652);
    const fixture = dependencies([{
      id: "place-1",
      label: "Mom's house",
      encrypted_payload: sealed.encryptedPayload,
      encryption_key_version: sealed.encryptionKeyVersion,
      geocode_provider: "google_maps",
      is_active: true,
      disclosure_version: PRIVATE_PLACES_EXPLICIT_NEARBY_DISCLOSURE_VERSION,
    }]);

    const result = await resolvePrivatePlaceConversationOrigin({
      ownerId: "member-a",
      message: "Please recommend a restaurant near Mom's house within 5 miles.",
      dependencies: fixture.dependencies,
    });

    expect(result).toEqual({ state: "matched", businesses: [], radiusMiles: 5 });
    expect(fixture.calls).toHaveLength(1);
    expect(fixture.calls[0]?.statement).toContain("WHERE user_id = $1");
    expect(fixture.calls[0]?.values).toEqual(["member-a"]);
    expect(fixture.radiusCalls).toEqual([{ latitude: 39.9526, longitude: -75.1652, radiusMiles: 5 }]);
    expect(JSON.stringify(result)).not.toContain("Private Lane");
    expect(JSON.stringify(result)).not.toContain("39.9526");
  });

  it("uses the current encrypted payload after replacement and does not retain an old origin", async () => {
    const replacement = sealedPlace(40.7128, -74.006);
    const fixture = dependencies([{
      id: "place-1",
      label: "Work",
      encrypted_payload: replacement.encryptedPayload,
      encryption_key_version: replacement.encryptionKeyVersion,
      geocode_provider: "google_maps",
      is_active: true,
      disclosure_version: PRIVATE_PLACES_EXPLICIT_NEARBY_DISCLOSURE_VERSION,
    }]);

    await resolvePrivatePlaceConversationOrigin({
      ownerId: "member-a",
      message: "Show businesses near Work.",
      dependencies: fixture.dependencies,
    });

    expect(fixture.radiusCalls).toEqual([{ latitude: 40.7128, longitude: -74.006, radiusMiles: 8 }]);
  });

  it("fails closed for disabled, paused, deleted-or-revoked, and synthetic-fixture origins", async () => {
    const disabled = await resolvePrivatePlaceConversationOrigin({
      ownerId: "member-a",
      message: "Find coffee near Mom's house.",
      dependencies: { environment: {} },
    });
    expect(disabled).toEqual({ state: "not_requested" });

    const absent = dependencies([]);
    await expect(resolvePrivatePlaceConversationOrigin({
      ownerId: "member-a",
      message: "Find coffee near Mom's house.",
      dependencies: absent.dependencies,
    })).resolves.toEqual({ state: "not_requested" });
    expect(absent.radiusCalls).toEqual([]);

    const sealedPaused = sealedPlace();
    const paused = dependencies([{
      id: "place-paused",
      label: "Mom's house",
      encrypted_payload: sealedPaused.encryptedPayload,
      encryption_key_version: sealedPaused.encryptionKeyVersion,
      geocode_provider: "google_maps",
      is_active: false,
      disclosure_version: PRIVATE_PLACES_EXPLICIT_NEARBY_DISCLOSURE_VERSION,
    }]);
    await expect(resolvePrivatePlaceConversationOrigin({
      ownerId: "member-a",
      message: "Find coffee near Mom's house.",
      dependencies: paused.dependencies,
    })).resolves.toEqual({ state: "securely_unavailable" });
    expect(paused.radiusCalls).toEqual([]);

    const sealed = sealedPlace();
    const synthetic = dependencies([{
      id: "place-fixture",
      label: "Test place",
      encrypted_payload: sealed.encryptedPayload,
      encryption_key_version: sealed.encryptionKeyVersion,
      geocode_provider: "synthetic_private_places_qa",
      is_active: true,
      disclosure_version: PRIVATE_PLACES_EXPLICIT_NEARBY_DISCLOSURE_VERSION,
    }]);
    await expect(resolvePrivatePlaceConversationOrigin({
      ownerId: "member-a",
      message: "Find food near Test place.",
      dependencies: synthetic.dependencies,
    })).resolves.toEqual({ state: "matched", businesses: [], radiusMiles: 8 });
    expect(synthetic.radiusCalls).toEqual([]);
  });

  it("treats an unreadable encrypted payload as unavailable instead of falling back to a model-visible address", async () => {
    const fixture = dependencies([{
      id: "place-1",
      label: "School",
      encrypted_payload: "malformed",
      encryption_key_version: "v1",
      geocode_provider: "google_maps",
      is_active: true,
      disclosure_version: PRIVATE_PLACES_EXPLICIT_NEARBY_DISCLOSURE_VERSION,
    }]);
    await expect(resolvePrivatePlaceConversationOrigin({
      ownerId: "member-a",
      message: "Find coffee near School.",
      dependencies: fixture.dependencies,
    })).resolves.toEqual({ state: "securely_unavailable" });
    expect(fixture.radiusCalls).toEqual([]);
  });

  it("requires refreshed explicit consent before an older Saved Place can become a chat origin", async () => {
    const sealed = sealedPlace();
    const fixture = dependencies([{
      id: "place-legacy-consent",
      label: "Work",
      encrypted_payload: sealed.encryptedPayload,
      encryption_key_version: sealed.encryptionKeyVersion,
      geocode_provider: "google_maps",
      is_active: true,
      disclosure_version: "private-places-google-geocoding-v1",
    }]);
    await expect(resolvePrivatePlaceConversationOrigin({
      ownerId: "member-a",
      message: "Find food near Work.",
      dependencies: fixture.dependencies,
    })).resolves.toEqual({ state: "consent_required" });
    expect(fixture.radiusCalls).toEqual([]);
  });
});
