import { useCallback, useEffect, useState } from "react";
import { Loader2, Lock, RotateCcw, Trash2, X } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface MemoryRecord {
  id: string;
  content: string;
  purpose: string;
  isSensitive: boolean;
  expiresAt?: string | null;
  createdAt: string;
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

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/memories`, { credentials: "include" });
      const body = await response.json().catch(() => ({})) as { memories?: MemoryRecord[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not load memory settings.");
      setMemories(body.memories ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load memory settings.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const forget = async (id: string) => {
    const response = await fetch(`${BASE}api/kinfolk/memories/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
    if (response.ok) setMemories((items) => items.filter((item) => item.id !== id));
    else setError("Kinfolk could not forget that memory. Please try again.");
  };

  const resetKinfolk = async () => {
    const confirmed = window.confirm(
      "Start Kinfolk fresh? This permanently clears your Kinfolk chats, private Kinfolk memories, feedback, and Kinfolk-only preferences. It does not delete your account, password, profile, Community posts, DMs, circles, saved places, memberships, or other Mapping With Melanin data.",
    );
    if (!confirmed) return;

    setResetting(true); setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/reset`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: true }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Kinfolk could not reset. Please try again.");
      setMemories([]);
      setResetComplete(true);
      onReset?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kinfolk could not reset. Please try again.");
    } finally { setResetting(false); }
  };

  return <div data-testid="kinfolk-memory-manager" className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
    <section className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <header className="flex items-start justify-between border-b border-[#3A1F0E]/10 p-5">
        <div><div className="flex items-center gap-2"><Lock className="h-4 w-4 text-[#CA922B]" /><h2 className="font-serif text-xl font-bold text-[#2B1507]">What Kinfolk remembers</h2></div><p className="mt-1 text-xs text-[#3A1F0E]/50">Private to your account. Kinfolk never adds a memory unless you opt in.</p></div>
        <button onClick={onClose} aria-label="Close memory settings" className="rounded-full bg-[#FAF6EF] p-2"><X className="h-4 w-4" /></button>
      </header>
      <div className="max-h-[60vh] overflow-y-auto p-5">
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#CA922B]" /></div> : error ? <div className="py-8 text-center text-sm text-red-600">{error}<button onClick={() => void load()} className="ml-2 font-bold">Retry</button></div> : memories.length === 0 ? <div className="py-8 text-center"><p className="font-bold text-[#2B1507]">Nothing saved yet</p><p className="mt-1 text-sm text-[#3A1F0E]/50">Check “Remember this privately” before a message when you want Kinfolk to keep it.</p></div> : <div className="space-y-3">{memories.map((memory) => { const companion = companionLabel(memory); return <article key={memory.id} className="rounded-2xl border border-[#3A1F0E]/8 bg-[#FAF6EF] p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="text-sm text-[#3A1F0E]">{companion ? `Private note for ${companion}` : memory.content}</p>{companion ? <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/60">{companionNotes(memory)}</p> : <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#3A1F0E]/35">{memory.purpose.replace("_", " ")}{memory.isSensitive ? " · sensitive" : ""}</p>}</div><button onClick={() => void forget(memory.id)} aria-label={companion ? `Forget companion ${companion}` : "Forget this memory"} className="rounded-full p-2 text-[#3A1F0E]/35 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></article>; })}</div>}
        <div className="mt-5 border-t border-[#3A1F0E]/10 pt-5">
          <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
            <div className="min-w-0"><p className="text-sm font-semibold text-[#2B1507]">Reset Kinfolk</p><p className="mt-1 text-xs leading-5 text-[#3A1F0E]/65">Clear your Kinfolk chats, private Kinfolk memories, feedback, and Kinfolk-only preferences. Your account, password, profile, Community posts, DMs, circles, saved places, and memberships stay untouched.</p><button type="button" data-testid="reset-kinfolk" onClick={() => void resetKinfolk()} disabled={resetting} className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60">{resetting ? "Resetting…" : "Start Kinfolk fresh"}</button>{resetComplete && <p role="status" className="mt-2 text-xs text-emerald-700">Kinfolk is fresh. Memory and personalised suggestions are off until you turn them back on.</p>}</div>
          </div>
        </div>
      </div>
    </section>
  </div>;
}
