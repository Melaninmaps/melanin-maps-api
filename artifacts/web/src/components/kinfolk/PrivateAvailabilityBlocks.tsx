import { Clock3, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

type AvailabilityBlock = Readonly<{
  id: string;
  label: string;
  startAt: string;
  endAt: string;
  timeZone: string;
  planningOptIn: boolean;
  createdAt: string;
  updatedAt: string;
}>;

type AvailabilityForm = Omit<AvailabilityBlock, "id" | "createdAt" | "updatedAt">;
type Preview = Readonly<{ hasConflict: boolean; conflictCount: number }>;

function defaultTimeZone(): string {
  const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return resolved === "UTC" ? "Etc/UTC" : resolved || "Etc/UTC";
}

function emptyForm(): AvailabilityForm {
  return { label: "", startAt: "", endAt: "", timeZone: defaultTimeZone(), planningOptIn: false };
}

async function message(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => ({})) as { error?: unknown };
  return typeof body.error === "string" ? body.error : fallback;
}

/**
 * Member-controlled manual commitment storage. It does not read, connect, sync,
 * or block an external calendar; preview only runs after a separate confirmation.
 */
export default function PrivateAvailabilityBlocks() {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [form, setForm] = useState<AvailabilityForm>(emptyForm);
  const [editing, setEditing] = useState<AvailabilityBlock | null>(null);
  const [saveConfirmed, setSaveConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewStartAt, setPreviewStartAt] = useState("");
  const [previewEndAt, setPreviewEndAt] = useState("");
  const [previewTimeZone, setPreviewTimeZone] = useState(defaultTimeZone);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/availability-blocks`, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error(await message(response, "Private availability blocks could not be loaded."));
      const payload = await response.json() as { availabilityBlocks?: AvailabilityBlock[] };
      setBlocks(Array.isArray(payload.availabilityBlocks) ? payload.availabilityBlocks : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Private availability blocks could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm());
    setSaveConfirmed(false);
  };

  const save = async () => {
    if (!saveConfirmed || !form.startAt || !form.endAt || !form.timeZone.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const endpoint = editing
        ? `${BASE}api/kinfolk/availability-blocks/${encodeURIComponent(editing.id)}`
        : `${BASE}api/kinfolk/availability-blocks`;
      const response = await fetch(endpoint, {
        method: editing ? "PUT" : "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, memberConfirmed: true }),
      });
      if (!response.ok) throw new Error(await message(response, "This private availability block could not be saved."));
      resetForm();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This private availability block could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (block: AvailabilityBlock) => {
    setEditing(block);
    setForm({ label: block.label, startAt: block.startAt, endAt: block.endAt, timeZone: block.timeZone, planningOptIn: block.planningOptIn });
    setSaveConfirmed(false);
    setError(null);
  };

  const remove = async (block: AvailabilityBlock) => {
    if (!window.confirm("Delete this private availability block? This requires your confirmation.")) return;
    setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/availability-blocks/${encodeURIComponent(block.id)}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberConfirmed: true }),
      });
      if (!response.ok) throw new Error(await message(response, "This private availability block could not be deleted."));
      if (editing?.id === block.id) resetForm();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This private availability block could not be deleted.");
    }
  };

  const runPreview = async () => {
    if (!previewConfirmed || !previewStartAt || !previewEndAt || !previewTimeZone.trim() || previewing) return;
    setPreviewing(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/availability-blocks/preview`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: previewStartAt, endAt: previewEndAt, timeZone: previewTimeZone, memberConfirmed: true }),
      });
      if (!response.ok) throw new Error(await message(response, "The private availability preview could not be checked."));
      const result = await response.json() as Partial<Preview>;
      if (typeof result.hasConflict !== "boolean" || typeof result.conflictCount !== "number") throw new Error("The private availability preview could not be checked.");
      setPreview({ hasConflict: result.hasConflict, conflictCount: result.conflictCount });
      setPreviewConfirmed(false);
    } catch (cause) {
      setPreviewError(cause instanceof Error ? cause.message : "The private availability preview could not be checked.");
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <section className="mt-5 rounded-2xl border border-[#3A1F0E]/10 bg-white p-5" aria-labelledby="availability-title">
      <div className="flex items-start gap-2">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#8D5C17]" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8D5C17]">Manual private planning</p>
          <h2 id="availability-title" className="mt-1 font-serif text-xl font-bold text-[#2B1507]">Private Availability Blocks</h2>
          <p className="mt-2 text-sm leading-6 text-[#3A1F0E]/65">Save a private commitment with its local start/end time and canonical IANA time zone. The label and all time details are encrypted at rest and shown only to you.</p>
        </div>
      </div>
      <p className="mt-4 rounded-xl bg-[#FFF8EC] px-3 py-2 text-sm leading-6 text-[#3A1F0E]/70"><strong className="text-[#2B1507]">Manual, not a calendar integration.</strong> No external calendar is connected, read, synced, or blocked. A live calendar provider integration is a separate future approval gate. These blocks are never automatically used in Kinfolk chat or memory, profile, discovery, Map, Directory, Community, Safety, reminders, notifications, sharing, or analytics.</p>
      {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-5 rounded-xl border border-[#3A1F0E]/10 p-4" aria-labelledby="availability-form-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="availability-form-title" className="font-serif text-lg font-bold text-[#2B1507]">{editing ? "Edit private availability block" : "Add private availability block"}</h3>
          {editing ? <button type="button" onClick={resetForm} className="text-sm font-bold text-[#8D5C17]">Cancel edit</button> : null}
        </div>
        <label className="mt-4 block text-sm font-bold text-[#2B1507]">Optional short label
          <input aria-label="Private availability label" value={form.label} maxLength={120} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="Personal commitment" className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" />
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-bold text-[#2B1507]">Start (local to this time zone)
            <input aria-label="Private availability start" type="datetime-local" value={form.startAt} onChange={(event) => setForm({ ...form, startAt: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm font-bold text-[#2B1507]">End (local to this time zone)
            <input aria-label="Private availability end" type="datetime-local" value={form.endAt} onChange={(event) => setForm({ ...form, endAt: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="mt-3 block text-sm font-bold text-[#2B1507]">Canonical IANA time zone
          <input aria-label="Private availability time zone" value={form.timeZone} maxLength={80} onChange={(event) => setForm({ ...form, timeZone: event.target.value })} placeholder="America/New_York" className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" />
          <span className="mt-1 block text-xs font-normal text-[#3A1F0E]/55">Use a named IANA zone such as America/New_York, not UTC or a numeric offset.</span>
        </label>
        <label className="mt-4 flex items-start gap-2 text-sm leading-5 text-[#3A1F0E]/70">
          <input aria-label="Opt in to future manual planning checks" type="checkbox" checked={form.planningOptIn} onChange={(event) => setForm({ ...form, planningOptIn: event.target.checked })} className="mt-1" />
          <span>Allow this block to be considered only when I deliberately run a manual availability preview. Leaving this off keeps it out of every preview.</span>
        </label>
        <label className="mt-3 flex items-start gap-2 text-sm leading-5 text-[#3A1F0E]/70">
          <input aria-label="Confirm private availability save" type="checkbox" checked={saveConfirmed} onChange={(event) => setSaveConfirmed(event.target.checked)} className="mt-1" />
          <span>I confirm that I want to {editing ? "replace" : "save"} this manual private block now.</span>
        </label>
        <button type="button" disabled={!saveConfirmed || !form.startAt || !form.endAt || !form.timeZone.trim() || saving} onClick={() => void save()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2B1507] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{saving ? "Saving…" : editing ? "Confirm and update block" : "Confirm and save block"}
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-[#3A1F0E]/10 p-4" aria-labelledby="availability-preview-title">
        <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#8D5C17]" /><div><h3 id="availability-preview-title" className="font-serif text-lg font-bold text-[#2B1507]">Explicit availability preview</h3><p className="mt-1 text-sm leading-6 text-[#3A1F0E]/65">Check a prospective interval only when you choose. The result says whether opted-in blocks conflict and gives a safe count; it never reveals a label, commitment detail, other member data, or any provider state.</p></div></div>
        {previewError ? <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{previewError}</p> : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-bold text-[#2B1507]">Prospective start
            <input aria-label="Prospective availability start" type="datetime-local" value={previewStartAt} onChange={(event) => setPreviewStartAt(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm font-bold text-[#2B1507]">Prospective end
            <input aria-label="Prospective availability end" type="datetime-local" value={previewEndAt} onChange={(event) => setPreviewEndAt(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="mt-3 block text-sm font-bold text-[#2B1507]">Prospective canonical IANA time zone
          <input aria-label="Prospective availability time zone" value={previewTimeZone} maxLength={80} onChange={(event) => setPreviewTimeZone(event.target.value)} placeholder="America/New_York" className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" />
        </label>
        <label className="mt-3 flex items-start gap-2 text-sm leading-5 text-[#3A1F0E]/70">
          <input aria-label="Confirm private availability preview" type="checkbox" checked={previewConfirmed} onChange={(event) => setPreviewConfirmed(event.target.checked)} className="mt-1" />
          <span>I confirm that I want to run this private manual availability preview now.</span>
        </label>
        <button type="button" disabled={!previewConfirmed || !previewStartAt || !previewEndAt || !previewTimeZone.trim() || previewing} onClick={() => void runPreview()} className="mt-4 rounded-xl border border-[#2B1507]/20 px-4 py-2.5 text-sm font-bold text-[#2B1507] disabled:opacity-50">{previewing ? "Checking…" : "Confirm and check conflicts"}</button>
        {preview ? <p role="status" className="mt-3 rounded-xl bg-[#FFF8EC] px-3 py-2 text-sm leading-6 text-[#3A1F0E]/75">{preview.hasConflict ? `Conflict detected with ${preview.conflictCount} opted-in private block${preview.conflictCount === 1 ? "" : "s"}.` : "No opted-in private block conflicts with this interval."}</p> : null}
      </div>

      <div className="mt-5" aria-live="polite">
        <h3 className="font-serif text-lg font-bold text-[#2B1507]">Saved private blocks</h3>
        {loading ? <p className="mt-3 text-sm text-[#3A1F0E]/55">Opening your private availability blocks…</p> : null}
        {!loading && blocks.length === 0 ? <p className="mt-3 text-sm text-[#3A1F0E]/60">No private availability blocks yet. Add one only when you choose.</p> : null}
        <div className="mt-3 space-y-2">{blocks.map((block) => <article key={block.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#3A1F0E]/10 p-3"><button type="button" onClick={() => beginEdit(block)} className="min-w-0 flex-1 text-left"><span className="block text-sm font-bold text-[#2B1507]">{block.label || "Private availability block"}</span><span className="mt-1 block text-xs leading-5 text-[#3A1F0E]/60">{block.startAt} to {block.endAt} · {block.timeZone} · {block.planningOptIn ? "Included in manual previews" : "Excluded from manual previews"}</span></button><div className="flex items-center gap-1"><button type="button" onClick={() => beginEdit(block)} aria-label={`Edit ${block.label || "private availability block"}`} className="rounded-lg p-2 text-[#8D5C17] hover:bg-[#FFF8EC]"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void remove(block)} aria-label={`Delete ${block.label || "private availability block"}`} className="rounded-lg p-2 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></article>)}</div>
      </div>
      <p className="mt-5 text-xs leading-5 text-[#3A1F0E]/50">Only your signed-in owner view receives decrypted block details. It never receives ciphertext, key IDs, fingerprints, another member&apos;s blocks, or an external-calendar state.</p>
    </section>
  );
}
