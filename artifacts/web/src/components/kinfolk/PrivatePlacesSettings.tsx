import { MapPin, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL;

type PrivatePlace = {
  id: string;
  label: string;
  isActive: boolean;
  geocodeProvider: string;
};

type PrivatePlacesStatus = {
  enabled: boolean;
  disclosureVersion: string;
  disclosure: string;
};

/** The nearby endpoint returns full governed records; retain only safe directory-card fields. */
type NearbyDirectoryBusiness = Readonly<{
  id: string;
  name: string;
  category: string;
  city: string;
  stateCode: string | null;
  verified: boolean;
}>;

function readPublicDirectoryBusinesses(payload: unknown): NearbyDirectoryBusiness[] {
  const businesses = payload && typeof payload === "object"
    ? (payload as { businesses?: unknown }).businesses
    : null;
  if (!Array.isArray(businesses)) return [];

  return businesses.flatMap((candidate): NearbyDirectoryBusiness[] => {
    if (!candidate || typeof candidate !== "object") return [];
    const result = candidate as Record<string, unknown>;
    const id = typeof result.id === "string" ? result.id.trim() : "";
    const name = typeof result.name === "string" ? result.name.trim() : "";
    if (!id || !name) return [];
    return [{
      id,
      name,
      category: typeof result.category === "string" ? result.category.trim() : "",
      city: typeof result.city === "string" ? result.city.trim() : "",
      stateCode: typeof result.stateCode === "string" && result.stateCode.trim() ? result.stateCode.trim() : null,
      verified: result.verified === true,
    }];
  });
}

async function responseMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as { error?: unknown };
  return typeof body.error === "string" ? body.error : fallback;
}

/**
 * An intentionally separate control center: it never passes an exact place to
 * Kinfolk chat. The only time the backend unseals coordinates is after a member
 * presses “Use for nearby directory search” for an active, selected place.
 */
export function PrivatePlacesSettings() {
  const [status, setStatus] = useState<PrivatePlacesStatus | null>(null);
  const [places, setPlaces] = useState<PrivatePlace[]>([]);
  const [label, setLabel] = useState("");
  const [exactAddress, setExactAddress] = useState("");
  const [acceptedDisclosure, setAcceptedDisclosure] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PrivatePlace | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyBusinesses, setNearbyBusinesses] = useState<NearbyDirectoryBusiness[]>([]);
  const [nearbySearched, setNearbySearched] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const statusResponse = await fetch(`${BASE}api/kinfolk/private-places/status`, { credentials: "include" });
    if (!statusResponse.ok) {
      setError(await responseMessage(statusResponse, "Private Places status could not be loaded."));
      return;
    }
    const nextStatus = (await statusResponse.json()) as PrivatePlacesStatus;
    setStatus(nextStatus);
    if (!nextStatus.enabled) {
      setPlaces([]);
      setNearbyBusinesses([]);
      setNearbySearched(false);
      return;
    }
    const placeResponse = await fetch(`${BASE}api/kinfolk/private-places`, { credentials: "include" });
    if (!placeResponse.ok) {
      setError(await responseMessage(placeResponse, "Private Places could not be loaded."));
      return;
    }
    const payload = (await placeResponse.json()) as { places?: PrivatePlace[] };
    setPlaces(Array.isArray(payload.places) ? payload.places : []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!status?.enabled || !label.trim() || !exactAddress.trim() || !acceptedDisclosure || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        editingPlace
          ? `${BASE}api/kinfolk/private-places/${encodeURIComponent(editingPlace.id)}`
          : `${BASE}api/kinfolk/private-places`,
        {
        method: editingPlace ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          exactAddress: exactAddress.trim(),
          googleMapsGeocodingConsent: true,
          disclosureVersion: status.disclosureVersion,
        }),
        },
      );
      if (!response.ok) throw new Error(await responseMessage(response, "This Private Place could not be saved."));
      setLabel("");
      setExactAddress("");
      setAcceptedDisclosure(false);
      setEditingPlace(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This Private Place could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (place: PrivatePlace, isActive: boolean) => {
    setError(null);
    setNearbyBusinesses([]);
    setNearbySearched(false);
    const response = await fetch(`${BASE}api/kinfolk/private-places/${encodeURIComponent(place.id)}/active`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (!response.ok) {
      setError(await responseMessage(response, "Private Place status could not be updated."));
      return;
    }
    await load();
  };

  const beginEdit = (place: PrivatePlace) => {
    // Exact addresses are never returned to the browser. Updating a record
    // therefore requires a deliberate re-entry and fresh Google disclosure.
    setEditingPlace(place);
    setLabel(place.label);
    setExactAddress("");
    setAcceptedDisclosure(false);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingPlace(null);
    setLabel("");
    setExactAddress("");
    setAcceptedDisclosure(false);
  };

  const remove = async (place: PrivatePlace) => {
    setError(null);
    setNearbyBusinesses([]);
    setNearbySearched(false);
    const response = await fetch(`${BASE}api/kinfolk/private-places/${encodeURIComponent(place.id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      setError(await responseMessage(response, "Private Place could not be deleted."));
      return;
    }
    await load();
  };

  const useForNearbySearch = async (place: PrivatePlace) => {
    setError(null);
    setNearbyBusinesses([]);
    setNearbySearched(false);
    const response = await fetch(`${BASE}api/kinfolk/private-places/${encodeURIComponent(place.id)}/nearby`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ radiusMiles: 8 }),
    });
    if (!response.ok) {
      setError(await responseMessage(response, "Nearby directory search could not run."));
      return;
    }
    const payload = (await response.json()) as unknown;
    setNearbyBusinesses(readPublicDirectoryBusinesses(payload));
    setNearbySearched(true);
  };

  return (
    <section data-testid="kinfolk-private-places" className="border-t border-[#3A1F0E]/8 pt-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-[#CA922B]" />
        <h4 className="text-sm font-bold text-[#2B1507]">Private Places</h4>
      </div>
      <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">
        Keep a place such as Mom&apos;s house or your school separate from Kinfolk. It is never chat memory, never a check-in, and never used automatically.
      </p>
      {error ? <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
      {!status ? <p className="mt-3 text-xs text-[#3A1F0E]/50">Checking Private Places…</p> : null}
      {status && !status.enabled ? (
        <div className="mt-3 rounded-2xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-4 text-xs leading-5 text-[#3A1F0E]/60">
          Private Places is currently off. Nothing is saved, sent to Google Maps, or available to Kinfolk until the separately governed capability is enabled.
        </div>
      ) : null}
      {status?.enabled ? (
        <div className="mt-4 space-y-3">
          {places.map((place) => (
            <div key={place.id} className="rounded-2xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#2B1507]">{place.label}</p>
                  <p className="mt-1 text-xs text-[#3A1F0E]/55">{place.isActive ? "Active only when you choose it" : "Paused — never used for nearby search"}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs font-bold">
                  {place.isActive ? <button type="button" onClick={() => void useForNearbySearch(place)} className="text-[#8D5C17]">Use for nearby directory search</button> : null}
                  <button type="button" onClick={() => beginEdit(place)} className="text-[#8D5C17]">Edit</button>
                  <button type="button" onClick={() => void setActive(place, !place.isActive)} className="text-[#8D5C17]">{place.isActive ? "Pause" : "Resume"}</button>
                  <button type="button" onClick={() => void remove(place)} className="inline-flex items-center gap-1 text-red-700"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                </div>
              </div>
            </div>
          ))}
          {nearbySearched ? (
            <section data-testid="private-places-nearby-results" aria-label="Nearby public business results" className="overflow-hidden rounded-2xl border border-[#3A1F0E]/10 bg-white">
              <p className="border-b border-[#3A1F0E]/10 bg-[#FFF8EC] px-4 py-3 text-xs font-bold text-[#2B1507]">Nearby public businesses</p>
              {nearbyBusinesses.length === 0 ? (
                <p className="px-4 py-3 text-xs leading-5 text-[#3A1F0E]/60">No public businesses were found in this search area.</p>
              ) : (
                <ul className="divide-y divide-[#3A1F0E]/10">
                  {nearbyBusinesses.map((business) => (
                    <li key={business.id} data-testid="private-places-nearby-result" className="hover:bg-[#FAF6EF]">
                      <Link href={`/businesses/${encodeURIComponent(business.id)}`} className="flex items-start justify-between gap-3 px-4 py-3">
                        <span className="min-w-0">
                          <strong className="block truncate text-sm text-[#2B1507]">{business.name}</strong>
                          <span className="mt-1 block text-xs text-[#3A1F0E]/60">{[business.category, business.city, business.stateCode].filter(Boolean).join(" · ")}</span>
                          {business.verified ? <span className="mt-1 block text-[11px] font-bold text-[#8D5C17]">Verified business</span> : null}
                        </span>
                        <span className="shrink-0 text-xs font-bold text-[#8D5C17]">View →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
          <div className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#2B1507]">{editingPlace ? `Update ${editingPlace.label}` : "Save a new Private Place"}</p>
                {editingPlace ? <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">For privacy, enter the current or replacement address again. It is never displayed back to the browser.</p> : null}
              </div>
              {editingPlace ? <button type="button" onClick={cancelEdit} className="text-xs font-bold text-[#8D5C17]">Cancel edit</button> : null}
            </div>
            <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} placeholder="Nickname, for example Mom’s house" aria-label="Private Place nickname" className="mt-3 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" />
            <input value={exactAddress} onChange={(event) => setExactAddress(event.target.value)} maxLength={300} placeholder="Exact address" aria-label="Exact Private Place address" className="mt-2 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" />
            <label className="mt-3 flex gap-2 text-xs leading-5 text-[#3A1F0E]/60">
              <input type="checkbox" checked={acceptedDisclosure} onChange={(event) => setAcceptedDisclosure(event.target.checked)} />
              <span>{status.disclosure}</span>
            </label>
            <button type="button" disabled={!label.trim() || !exactAddress.trim() || !acceptedDisclosure || saving} onClick={() => void save()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#2B1507] px-3 py-2 text-xs font-bold text-white disabled:opacity-55">
              <ShieldCheck className="h-3.5 w-3.5" />{saving ? "Saving…" : editingPlace ? "Update Private Place" : "Save Private Place"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
