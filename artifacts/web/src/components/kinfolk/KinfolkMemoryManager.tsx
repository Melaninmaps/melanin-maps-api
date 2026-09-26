import { useCallback, useEffect, useState } from "react";
import { Loader2, Lock, Pencil, RotateCcw, Trash2, X } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface MemoryRecord {
  id: string;
  content: string;
  purpose: string;
  isSensitive: boolean;
  sensitiveConsentGrantedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface KinfolkMemoryManagerProps {
  onClose: () => void;
  onReset?: () => void;
}

function companionLabel(memory: MemoryRecord): string | null {
  if (memory.purpose !== "companion_context") return null;
  const label = /^Companion:\s*([^\n]{2,60})/im.exec(memory.content)?.[1]?.trim();
  return label || null;
}

function companionNotes(memory: MemoryRecord): string {
  return memory.content.replace(/^Companion:\s*[^\n]+\s*\nNotes:\s*/im, "");
}

export function KinfolkMemoryManager({ onClose, onReset }: KinfolkMemoryManagerProps) {
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [continuityEnabled, setContinuityEnabled] = useState(false);
  const [updatingContinuity, setUpdatingContinuity] = useState(false);
  const [editing, setEditing] = useState<{ id: string; content: string; sensitiveConfirmationRequired: boolean } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [response, continuityResponse] = await Promise.all([
        fetch(`${BASE}api/kinfolk/memories`, { credentials: "include" }),
        fetch(`${BASE}api/kinfolk/continuity`, { credentials: "include" }),
      ]);
      const body = await response.json().catch(() => ({})) as { memories?: MemoryRecord[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not load memory settings.");
      if (!continuityResponse.ok) throw new Error("Could not load continuity settings.");
      const continuity = await continuityResponse.json().catch(() => ({})) as { enabled?: boolean };
      setMemories(body.memories ?? []);
      setContinuityEnabled(continuity.enabled === true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load memory settings.");
    } finally { setLoading(false); }
  }, []);

  const updateContinuity = async (enabled: boolean) => {
    setUpdatingContinuity(true); setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/continuity`, {
        method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const body = await response.json().catch(() => ({})) as { enabled?: boolean; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Kinfolk could not update continuity. Please try again.");
      setContinuityEnabled(body.enabled === true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kinfolk could not update continuity. Please try again.");
    } finally { setUpdatingContinuity(false); }
  };

  useEffect(() => { void load(); }, [load]);

  const forget = async (id: string) => {
    const response = await fetch(`${BASE}api/kinfolk/memories/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
    if (response.ok) setMemories((items) => items.filter((item) => item.id !== id));
    else setError("Kinfolk could not forget that memory. Please try again.");
  };

  const saveEdit = async () => {
    if (!editing || !editing.content.trim() || savingEdit) return;
    setSavingEdit(true); setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/memories/${encodeURIComponent(editing.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editing.content.trim(), sensitiveConsent: editing.sensitiveConfirmationRequired }),
      });
      const body = await response.json().catch(() => ({})) as { memory?: MemoryRecord; error?: string };
      if (response.status === 409) {
        setEditing((current) => current ? { ...current, sensitiveConfirmationRequired: true } : current);
        return;
      }
      if (!response.ok || !body.memory) throw new Error(body.error ?? "Kinfolk could not edit that memory.");
      setMemories((items) => items.map((item) => item.id === body.memory!.id ? { ...item, ...body.memory! } : item));
      setEditing(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kinfolk could not edit that memory.");
    } finally { setSavingEdit(false); }
  };

  const resetKinfolk = async () => {
    const confirmed = window.confirm(
      "Start Kinfolk fresh? This permanently clears your Kinfolk chats, private Kinfolk memories, feedback, and Kinfolk-only preferences. It does not delete your account, password, profile, Community posts, DMs, circles, saved places, memberships, or other Mapping With Melanin data.",
    );
    if (!confirmed) return;
    setResetting(true); setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/reset`, {
        method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation: true }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Kinfolk could not reset. Please try again.");
      setMemories([]); setContinuityEnabled(false); setResetComplete(true); onReset?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kinfolk could not reset. Please try again.");
    } finally { setResetting(false); }
  };

  return <div data-testid="kinfolk-memory-manager" className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
    <section className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <header className="flex items-start justify-between border-b border-[#3A1F0E]/10 p-5">
        <div><div className="flex items-center gap-2"><Lock className="h-4 w-4 text-[#CA922B]" /><h2 className="font-serif text-xl font-bold text-[#2B1507]">What Kinfolk remembers</h2></div><p className="mt-1 text-xs text-[#3A1F0E]/50">Private to your account. After your first-use choice, Kinfolk can retain useful non-sensitive continuity; sensitive details always need their own confirmation.</p></div>
        <button onClick={onClose} aria-label="Close memory settings" className="rounded-full bg-[#FAF6EF] p-2"><X className="h-4 w-4" /></button>
      </header>
      <div className="max-h-[60vh] overflow-y-auto p-5">
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#CA922B]" /></div> : error ? <div className="py-8 text-center text-sm text-red-600">{error}<button onClick={() => void load()} className="ml-2 font-bold">Retry</button></div> : memories.length === 0 ? <div className="py-8 text-center"><p className="font-bold text-[#2B1507]">Nothing saved yet</p><p className="mt-1 text-sm text-[#3A1F0E]/50">When memory is on, Kinfolk can retain useful non-sensitive preferences, plans, projects, and goals. You can also save a specific note from the composer.</p></div> : <div className="space-y-3">{memories.map((memory) => {
          const companion = companionLabel(memory);
          const isEditing = editing?.id === memory.id;
          return <article key={memory.id} className="rounded-2xl border border-[#3A1F0E]/8 bg-[#FAF6EF] p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1">{isEditing ? <><textarea value={editing.content} onChange={(event) => setEditing({ ...editing, content: event.target.value })} maxLength={1000} rows={3} aria-label="Edit private Kinfolk memory" className="w-full resize-y rounded-xl border border-[#3A1F0E]/15 bg-white px-3 py-2 text-sm text-[#2B1507] outline-none focus:border-[#CA922B]/55" />{editing.sensitiveConfirmationRequired && <p className="mt-2 text-xs leading-5 text-[#8D5C17]">This memory is sensitive. Confirm separately to save this edit privately.</p>}<div className="mt-2 flex gap-3"><button type="button" onClick={() => void saveEdit()} disabled={savingEdit || !editing.content.trim()} className="rounded-lg bg-[#2B1507] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">{savingEdit ? "Saving…" : editing.sensitiveConfirmationRequired ? "Confirm sensitive edit" : "Save edit"}</button><button type="button" onClick={() => setEditing(null)} disabled={savingEdit} className="text-xs font-semibold text-[#3A1F0E]/55">Cancel</button></div></> : <><p className="text-sm text-[#3A1F0E]">{companion ? `Private note for ${companion}` : memory.content}</p>{companion ? <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/60">{companionNotes(memory)}</p> : <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#3A1F0E]/35">{memory.purpose.replace("_", " ")}{memory.isSensitive ? " · sensitive" : ""}{memory.isSensitive && !memory.sensitiveConsentGrantedAt ? " · confirmation required before use" : ""}</p>}</>}</div>{!isEditing && <div className="flex shrink-0 items-center gap-1"><button onClick={() => setEditing({ id: memory.id, content: memory.content, sensitiveConfirmationRequired: false })} aria-label={companion ? `Edit companion ${companion}` : "Edit this memory"} className="rounded-full p-2 text-[#3A1F0E]/35 hover:bg-[#CA922B]/10 hover:text-[#8D5C17]"><Pencil className="h-4 w-4" /></button><button onClick={() => void forget(memory.id)} aria-label={companion ? `Forget companion ${companion}` : "Forget this memory"} className="rounded-full p-2 text-[#3A1F0E]/35 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div>}</div></article>;
        })}</div>}
        <section className="mt-5 rounded-2xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-4" data-testid="kinfolk-continuity-control">
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-[#2B1507]">Continue private context between chats</p><p className="mt-1 text-xs leading-5 text-[#3A1F0E]/60">When on, Kinfolk can use your saved conversations and relevant ordinary continuity. Turn it off immediately any time; saved items remain until you edit, delete, or reset them.</p></div><button type="button" role="switch" aria-checked={continuityEnabled} aria-label="Continue private context between chats" disabled={updatingContinuity} onClick={() => void updateContinuity(!continuityEnabled)} className={`mt-0.5 h-7 w-12 rounded-full p-1 transition ${continuityEnabled ? "bg-[#CA922B]" : "bg-[#3A1F0E]/20"}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${continuityEnabled ? "translate-x-5" : "translate-x-0"}`} /></button></div>
        </section>
        <div className="mt-5 border-t border-[#3A1F0E]/10 pt-5"><div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"><RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-red-700" /><div className="min-w-0"><p className="text-sm font-semibold text-[#2B1507]">Reset Kinfolk</p><p className="mt-1 text-xs leading-5 text-[#3A1F0E]/65">Clear your Kinfolk chats, private Kinfolk memories, feedback, and Kinfolk-only preferences. Your account, password, profile, Community posts, DMs, circles, saved places, and memberships stay untouched.</p><button type="button" data-testid="reset-kinfolk" onClick={() => void resetKinfolk()} disabled={resetting} className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60">{resetting ? "Resetting…" : "Start Kinfolk fresh"}</button>{resetComplete && <p role="status" className="mt-2 text-xs text-emerald-700">Kinfolk is fresh. On your next use, choose whether it remembers ordinary continuity.</p>}</div></div></div>
      </div>
    </section>
  </div>;
}
