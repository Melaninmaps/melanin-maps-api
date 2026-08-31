import { useCallback, useEffect, useState } from "react";
import { Loader2, Lock, Trash2, X } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface MemoryRecord {
  id: string;
  content: string;
  purpose: string;
  isSensitive: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

export function KinfolkMemoryManager({ onClose }: { onClose: () => void }) {
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
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

  return <div data-testid="kinfolk-memory-manager" className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
    <section className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <header className="flex items-start justify-between border-b border-[#3A1F0E]/10 p-5">
        <div><div className="flex items-center gap-2"><Lock className="h-4 w-4 text-[#CA922B]" /><h2 className="font-serif text-xl font-bold text-[#2B1507]">What Kinfolk remembers</h2></div><p className="mt-1 text-xs text-[#3A1F0E]/50">Private to your account. Kinfolk never adds a memory unless you opt in.</p></div>
        <button onClick={onClose} aria-label="Close memory settings" className="rounded-full bg-[#FAF6EF] p-2"><X className="h-4 w-4" /></button>
      </header>
      <div className="max-h-[60vh] overflow-y-auto p-5">
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#CA922B]" /></div> : error ? <div className="py-8 text-center text-sm text-red-600">{error}<button onClick={() => void load()} className="ml-2 font-bold">Retry</button></div> : memories.length === 0 ? <div className="py-10 text-center"><p className="font-bold text-[#2B1507]">Nothing saved yet</p><p className="mt-1 text-sm text-[#3A1F0E]/50">Check “Remember this privately” before a message when you want Kinfolk to keep it.</p></div> : <div className="space-y-3">{memories.map((memory) => <article key={memory.id} className="rounded-2xl border border-[#3A1F0E]/8 bg-[#FAF6EF] p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="text-sm text-[#3A1F0E]">{memory.content}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#3A1F0E]/35">{memory.purpose.replace("_", " ")}{memory.isSensitive ? " · sensitive" : ""}</p></div><button onClick={() => void forget(memory.id)} aria-label="Forget this memory" className="rounded-full p-2 text-[#3A1F0E]/35 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></article>)}</div>}
      </div>
    </section>
  </div>;
}
