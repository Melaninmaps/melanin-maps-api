import { CalendarClock, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

type Retention = { departureDateRequired: boolean; postDepartureGraceDays: number; extensionAllowedBeforeExpiry: boolean };
type Status = { enabled: boolean; disclosureVersion: string; disclosure: string; privacyNotice: string; retention: Retention };
type Stay = { id: string; label: string; isActive: boolean; arrivalDate: string; departureDate: string; expiresAt: string };

async function responseMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as { error?: unknown };
  return typeof body.error === "string" ? body.error : fallback;
}

/** A separate, explicit travel-location control; it never sends an address to Kinfolk chat. */
export function TemporaryStaysSettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [stays, setStays] = useState<Stay[]>([]);
  const [label, setLabel] = useState("");
  const [exactAddress, setExactAddress] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [extensions, setExtensions] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbySummary, setNearbySummary] = useState<string | null>(null);

  const resetDraft = useCallback(() => {
    setLabel(""); setExactAddress(""); setArrivalDate(""); setDepartureDate(""); setAccepted(false); setEditingId(null);
  }, []);
  const load = useCallback(async () => {
    setError(null);
    const statusResponse = await fetch(`${BASE}api/kinfolk/temporary-stays/status`, { credentials: "include" });
    if (!statusResponse.ok) { setError(await responseMessage(statusResponse, "Temporary Stays status could not be loaded.")); return; }
    const next = await statusResponse.json() as Status;
    setStatus(next);
    if (!next.enabled) { setStays([]); return; }
    const stayResponse = await fetch(`${BASE}api/kinfolk/temporary-stays`, { credentials: "include" });
    if (!stayResponse.ok) { setError(await responseMessage(stayResponse, "Temporary Stays could not be loaded.")); return; }
    const payload = await stayResponse.json() as { stays?: Stay[] };
    setStays(Array.isArray(payload.stays) ? payload.stays : []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!status?.enabled || !label.trim() || !exactAddress.trim() || !arrivalDate || !departureDate || !accepted || saving) return;
    setSaving(true); setError(null);
    try {
      const path = editingId ? `api/kinfolk/temporary-stays/${encodeURIComponent(editingId)}` : "api/kinfolk/temporary-stays";
      const response = await fetch(`${BASE}${path}`, {
        method: editingId ? "PUT" : "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), exactAddress: exactAddress.trim(), arrivalDate, departureDate, googleMapsGeocodingConsent: true, disclosureVersion: status.disclosureVersion }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, "This Temporary Stay could not be saved."));
      resetDraft(); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "This Temporary Stay could not be saved."); }
    finally { setSaving(false); }
  };
  const edit = (stay: Stay) => { setEditingId(stay.id); setLabel(stay.label); setExactAddress(""); setArrivalDate(stay.arrivalDate); setDepartureDate(stay.departureDate); setAccepted(false); setError("Re-enter the exact address and accept the Google Maps disclosure to update this encrypted stay."); };
  const setActive = async (stay: Stay, isActive: boolean) => { const response = await fetch(`${BASE}api/kinfolk/temporary-stays/${encodeURIComponent(stay.id)}/active`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) }); if (!response.ok) { setError(await responseMessage(response, "Temporary Stay status could not be updated.")); return; } await load(); };
  const extend = async (stay: Stay) => { const departure = extensions[stay.id] ?? ""; if (!departure) { setError("Choose a later departure date before extending this Temporary Stay."); return; } const response = await fetch(`${BASE}api/kinfolk/temporary-stays/${encodeURIComponent(stay.id)}/extend`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ departureDate: departure }) }); if (!response.ok) { setError(await responseMessage(response, "Temporary Stay could not be extended.")); return; } setExtensions((current) => ({ ...current, [stay.id]: "" })); await load(); };
  const remove = async (stay: Stay) => { const response = await fetch(`${BASE}api/kinfolk/temporary-stays/${encodeURIComponent(stay.id)}`, { method: "DELETE", credentials: "include" }); if (!response.ok) { setError(await responseMessage(response, "Temporary Stay could not be deleted.")); return; } await load(); };
  const nearby = async (stay: Stay) => { const response = await fetch(`${BASE}api/kinfolk/temporary-stays/${encodeURIComponent(stay.id)}/nearby`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" }); if (!response.ok) { setError(await responseMessage(response, "Nearby directory search could not run.")); return; } const payload = await response.json() as { businesses?: unknown[] }; setNearbySummary(`${Array.isArray(payload.businesses) ? payload.businesses.length : 0} nearby directory results loaded from ${stay.label}.`); };

  return <section data-testid="kinfolk-temporary-stays" className="border-t border-[#3A1F0E]/8 pt-6">
    <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#CA922B]" /><h4 className="text-sm font-bold text-[#2B1507]">Temporary Stays</h4></div>
    <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">A separate encrypted stay for travel. It is never Kinfolk chat memory, a check-in, analytics, a public activity, or an automatic recommendation.</p>
    {error ? <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
    {!status ? <p className="mt-3 text-xs text-[#3A1F0E]/50">Checking Temporary Stays…</p> : null}
    {status && !status.enabled ? <div className="mt-3 rounded-2xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-4 text-xs leading-5 text-[#3A1F0E]/60">Temporary Stays is currently off. Nothing is saved, sent to Google Maps, or available to Kinfolk until the separately governed capability is enabled.</div> : null}
    {status?.enabled ? <div className="mt-4 space-y-3">
      {stays.map((stay) => <div key={stay.id} className="rounded-2xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-[#2B1507]">{stay.label}</p><p className="mt-1 text-xs text-[#3A1F0E]/55">{stay.arrivalDate} to {stay.departureDate} · encrypted until {new Date(stay.expiresAt).toLocaleDateString()}</p></div><div className="flex flex-wrap gap-3 text-xs font-bold">{stay.isActive ? <button type="button" onClick={() => void nearby(stay)} className="text-[#8D5C17]">Use for nearby directory search</button> : null}<button type="button" onClick={() => void setActive(stay, !stay.isActive)} className="text-[#8D5C17]">{stay.isActive ? "Pause" : "Resume"}</button><button type="button" onClick={() => edit(stay)} className="text-[#8D5C17]">Edit</button><button type="button" onClick={() => void remove(stay)} className="inline-flex items-center gap-1 text-red-700"><Trash2 className="h-3.5 w-3.5" />Delete</button></div></div><div className="mt-3 flex flex-wrap gap-2"><input type="date" aria-label={`Extend ${stay.label} departure date`} value={extensions[stay.id] ?? ""} onChange={(event) => setExtensions((current) => ({ ...current, [stay.id]: event.target.value }))} className="rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-xs" /><button type="button" onClick={() => void extend(stay)} className="rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-xs font-bold text-[#8D5C17]">Extend stay</button></div></div>)}
      {nearbySummary ? <p className="rounded-xl bg-[#FFF8EC] px-3 py-2 text-xs text-[#3A1F0E]/70">{nearbySummary}</p> : null}
      <div className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-4"><p className="text-sm font-semibold text-[#2B1507]">{editingId ? "Edit Temporary Stay" : "Save a Temporary Stay"}</p><p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">{status.privacyNotice}</p><input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} placeholder="Nickname, for example Conference hotel" aria-label="Temporary Stay nickname" className="mt-3 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" /><input value={exactAddress} onChange={(event) => setExactAddress(event.target.value)} maxLength={300} placeholder="Exact address" aria-label="Exact Temporary Stay address" className="mt-2 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" /><div className="mt-2 grid gap-2 sm:grid-cols-2"><input type="date" value={arrivalDate} onChange={(event) => setArrivalDate(event.target.value)} aria-label="Temporary Stay arrival date" className="w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" /><input type="date" value={departureDate} onChange={(event) => setDepartureDate(event.target.value)} aria-label="Temporary Stay departure date" className="w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" /></div><label className="mt-3 flex gap-2 text-xs leading-5 text-[#3A1F0E]/60"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>{status.disclosure}</span></label><button type="button" disabled={!label.trim() || !exactAddress.trim() || !arrivalDate || !departureDate || !accepted || saving} onClick={() => void save()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#2B1507] px-3 py-2 text-xs font-bold text-white disabled:opacity-55"><ShieldCheck className="h-3.5 w-3.5" />{saving ? "Saving…" : editingId ? "Save Temporary Stay changes" : "Save Temporary Stay"}</button>{editingId ? <button type="button" onClick={resetDraft} className="ml-3 text-xs font-bold text-[#8D5C17]">Cancel edit</button> : null}</div>
    </div> : null}
  </section>;
}
