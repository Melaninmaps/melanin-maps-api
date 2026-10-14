import { useCallback, useEffect, useState } from "react";
import { Loader2, Lock, Pencil, RotateCcw, Trash2, X } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface MemoryRecord {
  id: string;
  content: string | null;
  purpose: string;
  isSensitive: boolean;
  sensitiveRestricted?: boolean;
  vaultLocked?: boolean;
  sensitiveConsentGrantedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  pausedAt?: string | null;
  state?: "active" | "paused" | "expired";
}

interface KinfolkMemoryManagerProps {
  onClose: () => void;
  onReset?: () => void;
}

function companionLabel(memory: MemoryRecord): string | null {
  if (memory.purpose !== "companion_context") return null;
  const label = /^Companion:\s*([^\n]{2,60})/im.exec(memory.content ?? "")?.[1]?.trim();
  return label || null;
}

function companionNotes(memory: MemoryRecord): string {
  return (memory.content ?? "").replace(/^Companion:\s*[^\n]+\s*\nNotes:\s*/im, "");
}

export function KinfolkMemoryManager({ onClose, onReset }: KinfolkMemoryManagerProps) {
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [continuityEnabled, setContinuityEnabled] = useState(false);
  const [updatingContinuity, setUpdatingContinuity] = useState(false);
  const [editing, setEditing] = useState<{
    id: string;
    content: string;
    sensitiveConfirmationRequired: boolean;
    sensitivePassword: string;
    sensitiveRestricted: boolean;
  } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [updatingMemoryId, setUpdatingMemoryId] = useState<string | null>(null);
  const [vaultPassword, setVaultPassword] = useState("");
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [unlockingVault, setUnlockingVault] = useState(false);

  const loadReviewableMemories = async (): Promise<MemoryRecord[]> => {
    let offset = 0;
    const collected: MemoryRecord[] = [];
    while (true) {
      const response = await fetch(`${BASE}api/kinfolk/memories?includeInactive=true&offset=${offset}`, { credentials: "include" });
      const body = await response.json().catch(() => ({})) as { memories?: MemoryRecord[]; nextOffset?: number | null; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not load memory settings.");
      collected.push(...(body.memories ?? []));
      if (typeof body.nextOffset !== "number" || body.nextOffset <= offset) return collected;
      offset = body.nextOffset;
    }
  };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [reviewableMemories, continuityResponse] = await Promise.all([
        loadReviewableMemories(),
        fetch(`${BASE}api/kinfolk/continuity`, { credentials: "include" }),
      ]);
      if (!continuityResponse.ok) throw new Error("Could not load continuity settings.");
      const continuity = await continuityResponse.json().catch(() => ({})) as { enabled?: boolean };
      setMemories(reviewableMemories);
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

  const unlockSensitiveVault = async () => {
    if (!vaultPassword || unlockingVault) return;
    setUnlockingVault(true); setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/sensitive-memory-vault/reauth`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: vaultPassword }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Sensitive memory could not be opened.");
      const locked = memories.filter((memory) => memory.isSensitive);
      const opened = await Promise.all(locked.map(async (memory) => {
        const detail = await fetch(`${BASE}api/kinfolk/sensitive-memories/${encodeURIComponent(memory.id)}`, { credentials: "include" });
        const payload = await detail.json().catch(() => ({})) as { memory?: MemoryRecord; error?: string };
        if (!detail.ok || !payload.memory) throw new Error(payload.error ?? "A sensitive memory could not be opened.");
        return payload.memory;
      }));
      const byId = new Map(opened.map((memory) => [memory.id, memory]));
      setMemories((items) => items.map((memory) => byId.get(memory.id) ? { ...memory, ...byId.get(memory.id)!, vaultLocked: false } : memory));
      setVaultUnlocked(true); setVaultPassword("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sensitive memory could not be opened."); }
    finally { setUnlockingVault(false); }
  };

  const setSensitiveRestricted = async (memory: MemoryRecord, restricted: boolean) => {
    try {
      const response = await fetch(`${BASE}api/kinfolk/sensitive-memories/${encodeURIComponent(memory.id)}/restricted-use`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restricted }),
      });
      const body = await response.json().catch(() => ({})) as { memory?: Pick<MemoryRecord, "id" | "sensitiveRestricted">; error?: string };
      if (!response.ok || !body.memory) throw new Error(body.error ?? "Sensitive memory could not be updated.");
      setMemories((items) => items.map((item) => item.id === memory.id ? { ...item, sensitiveRestricted: body.memory!.sensitiveRestricted } : item));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sensitive memory could not be updated."); }
  };

  const setMemoryPaused = async (id: string, paused: boolean) => {
    if (updatingMemoryId) return;
    setUpdatingMemoryId(id); setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/memories/${encodeURIComponent(id)}/pause`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paused }),
      });
      const body = await response.json().catch(() => ({})) as { memory?: MemoryRecord; error?: string };
      if (!response.ok || !body.memory) throw new Error(body.error ?? "Kinfolk could not update that memory.");
      setMemories((items) => items.map((item) => item.id === body.memory!.id ? { ...item, ...body.memory! } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kinfolk could not update that memory.");
    } finally { setUpdatingMemoryId(null); }
  };

  const revokeMemory = async (id: string) => {
    const response = await fetch(`${BASE}api/kinfolk/memories/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
    if (response.ok) setMemories((items) => items.filter((item) => item.id !== id));
    else setError("Kinfolk could not revoke use of that memory. Please try again.");
  };

  const saveEdit = async () => {
    if (!editing || !editing.content.trim() || savingEdit) return;
    setSavingEdit(true); setError(null);
    try {
      if (editing.sensitiveConfirmationRequired && !vaultUnlocked) {
        if (!editing.sensitivePassword) {
          throw new Error("Confirm your current password before saving a sensitive memory.");
        }
        const reauth = await fetch(`${BASE}api/kinfolk/sensitive-memory-vault/reauth`, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: editing.sensitivePassword }),
        });
        const reauthBody = await reauth.json().catch(() => ({})) as { error?: string };
        if (!reauth.ok) throw new Error(reauthBody.error ?? "Sensitive memory could not be confirmed.");
        setVaultUnlocked(true);
      }
      const response = await fetch(`${BASE}api/kinfolk/memories/${encodeURIComponent(editing.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editing.content.trim(),
          sensitiveConsent: editing.sensitiveConfirmationRequired,
          sensitiveRestricted: editing.sensitiveRestricted,
        }),
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
        {memories.some((memory) => memory.isSensitive) ? <section data-testid="sensitive-memory-vault" className="mb-4 rounded-2xl border border-[#CA922B]/25 bg-[#FFF8EC] p-4"><p className="text-sm font-semibold text-[#2B1507]">Sensitive Memory Vault</p><p className="mt-1 text-xs leading-5 text-[#3A1F0E]/60">{vaultUnlocked ? "Unlocked briefly for this session. Sensitive details remain hidden from ordinary memory views." : "Sensitive details are hidden. Confirm your current password to review or change them."}</p>{!vaultUnlocked ? <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input type="password" value={vaultPassword} onChange={(event) => setVaultPassword(event.target.value)} disabled={unlockingVault} autoComplete="current-password" aria-label="Current password for sensitive memory vault" className="min-w-0 flex-1 rounded-xl border border-[#3A1F0E]/15 bg-white px-3 py-2 text-sm text-[#2B1507]" /><button type="button" disabled={!vaultPassword || unlockingVault} onClick={() => void unlockSensitiveVault()} className="rounded-xl bg-[#2B1507] px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{unlockingVault ? "Confirming…" : "Open sensitive vault"}</button></div> : null}</section> : null}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#CA922B]" /></div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-red-600">{error}<button onClick={() => void load()} className="ml-2 font-bold">Retry</button></div>
        ) : memories.length === 0 ? (
          <div className="py-8 text-center"><p className="font-bold text-[#2B1507]">Nothing saved yet</p><p className="mt-1 text-sm text-[#3A1F0E]/50">When memory is on, Kinfolk can retain useful non-sensitive preferences, plans, projects, and goals. You can also save a specific note from the composer.</p></div>
        ) : (
          <div className="space-y-3">
            {memories.map((memory) => {
              const companion = companionLabel(memory);
              const isLockedSensitive = memory.isSensitive && !vaultUnlocked;
              const isEditing = editing?.id === memory.id;
              return (
                <article key={memory.id} className="rounded-2xl border border-[#3A1F0E]/8 bg-[#FAF6EF] p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <>
                          <textarea value={editing.content} onChange={(event) => setEditing({ ...editing, content: event.target.value })} maxLength={1000} rows={3} aria-label="Edit private Kinfolk memory" className="w-full resize-y rounded-xl border border-[#3A1F0E]/15 bg-white px-3 py-2 text-sm text-[#2B1507] outline-none focus:border-[#CA922B]/55" />
                          {editing.sensitiveConfirmationRequired && <div className="mt-2 rounded-xl border border-[#CA922B]/25 bg-[#FFF8EC] p-3 text-xs leading-5 text-[#3A1F0E]"><p className="font-semibold">This memory is sensitive. Kinfolk has not saved the edit.</p><p className="mt-1">Choose how it may be used, then confirm your current password before saving.</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => setEditing({ ...editing, sensitiveRestricted: false })} className={`rounded-lg px-2 py-1 ${!editing.sensitiveRestricted ? "bg-[#2B1507] text-white" : "bg-white text-[#3A1F0E]"}`}>Allow relevant use</button><button type="button" onClick={() => setEditing({ ...editing, sensitiveRestricted: true })} className={`rounded-lg px-2 py-1 ${editing.sensitiveRestricted ? "bg-[#2B1507] text-white" : "bg-white text-[#3A1F0E]"}`}>Only mention if I ask</button></div>{!vaultUnlocked ? <input type="password" value={editing.sensitivePassword} onChange={(event) => setEditing({ ...editing, sensitivePassword: event.target.value })} autoComplete="current-password" aria-label="Current password to confirm sensitive memory edit" placeholder="Current password" className="mt-2 w-full rounded-lg border border-[#3A1F0E]/15 bg-white px-2 py-1.5" /> : null}</div>}
                          <div className="mt-2 flex gap-3"><button type="button" onClick={() => void saveEdit()} disabled={savingEdit || !editing.content.trim()} className="rounded-lg bg-[#2B1507] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">{savingEdit ? "Saving…" : editing.sensitiveConfirmationRequired ? "Confirm sensitive edit" : "Save edit"}</button><button type="button" onClick={() => setEditing(null)} disabled={savingEdit} className="text-xs font-semibold text-[#3A1F0E]/55">Cancel</button></div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-[#3A1F0E]">{isLockedSensitive ? "Sensitive private memory" : (companion ? `Private note for ${companion}` : memory.content)}</p>
                          {companion ? <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/60">{companionNotes(memory)}</p> : <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#3A1F0E]/35">{memory.purpose === "requirement_context" ? "saved requirement · not silently relaxed" : memory.purpose.replace("_", " ")}{memory.isSensitive ? " · sensitive" : ""}{memory.isSensitive && !memory.sensitiveConsentGrantedAt ? " · confirmation required before use" : ""}</p>}
                          {memory.state === "paused" ? <p className="mt-2 text-xs font-medium text-[#8D5C17]">Paused — Kinfolk will not use this memory until you resume it.</p> : null}{isLockedSensitive ? <p className="mt-2 text-xs font-medium text-[#8D5C17]">Locked — open the Sensitive Memory Vault to review or change this detail.</p> : null}
                        </>
                      )}
                    </div>
                    {!isEditing && !isLockedSensitive && (
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <button onClick={() => setEditing({ id: memory.id, content: memory.content ?? "", sensitiveConfirmationRequired: false, sensitivePassword: "", sensitiveRestricted: memory.sensitiveRestricted !== false })} aria-label={companion ? `Edit companion ${companion}` : "Edit this memory"} className="rounded-full p-2 text-[#3A1F0E]/35 hover:bg-[#CA922B]/10 hover:text-[#8D5C17]"><Pencil className="h-4 w-4" /></button>
                        <button type="button" onClick={() => void setMemoryPaused(memory.id, memory.state !== "paused")} disabled={updatingMemoryId === memory.id} aria-label={memory.state === "paused" ? "Resume use of this memory" : "Pause use of this memory"} className="rounded-lg px-2 py-1 text-[10px] font-semibold text-[#8D5C17] hover:bg-[#CA922B]/10 disabled:opacity-60">{memory.state === "paused" ? "Resume use" : "Pause use"}</button>
                        {memory.isSensitive ? <button type="button" onClick={() => void setSensitiveRestricted(memory, memory.sensitiveRestricted !== true)} className="rounded-lg px-2 py-1 text-[10px] font-semibold text-[#8D5C17] hover:bg-[#CA922B]/10">{memory.sensitiveRestricted !== false ? "Only mention if I ask" : "Relevant use allowed"}</button> : null}<button onClick={() => void revokeMemory(memory.id)} aria-label={companion ? `Revoke use of companion ${companion}` : "Revoke use of this memory"} title="Revoke use of this memory" disabled={updatingMemoryId === memory.id} className="rounded-full p-2 text-[#3A1F0E]/35 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <section className="mt-5 rounded-2xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-4" data-testid="kinfolk-continuity-control">
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-[#2B1507]">Continue private context between chats</p><p className="mt-1 text-xs leading-5 text-[#3A1F0E]/60">When on, Kinfolk can use your saved conversations and relevant ordinary continuity. Turn it off immediately any time; saved items remain until you edit, delete, or reset them.</p></div><button type="button" role="switch" aria-checked={continuityEnabled} aria-label="Continue private context between chats" disabled={updatingContinuity} onClick={() => void updateContinuity(!continuityEnabled)} className={`mt-0.5 h-7 w-12 rounded-full p-1 transition ${continuityEnabled ? "bg-[#CA922B]" : "bg-[#3A1F0E]/20"}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${continuityEnabled ? "translate-x-5" : "translate-x-0"}`} /></button></div>
        </section>
        <div className="mt-5 border-t border-[#3A1F0E]/10 pt-5"><div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"><RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-red-700" /><div className="min-w-0"><p className="text-sm font-semibold text-[#2B1507]">Reset Kinfolk</p><p className="mt-1 text-xs leading-5 text-[#3A1F0E]/65">Clear your Kinfolk chats, private Kinfolk memories, feedback, and Kinfolk-only preferences. Your account, password, profile, Community posts, DMs, circles, saved places, and memberships stay untouched.</p><button type="button" data-testid="reset-kinfolk" onClick={() => void resetKinfolk()} disabled={resetting} className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60">{resetting ? "Resetting…" : "Start Kinfolk fresh"}</button>{resetComplete && <p role="status" className="mt-2 text-xs text-emerald-700">Kinfolk is fresh. On your next use, choose whether it remembers ordinary continuity.</p>}</div></div></div>
      </div>
    </section>
  </div>;
}
