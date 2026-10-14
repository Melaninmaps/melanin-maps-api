import { useCallback, useEffect, useState } from "react";
import { CURRENT_CHAPTER_KINDS, isSensitiveChapterKind, parseCurrentChapterKind, type CurrentChapterView } from "@workspace/constants";
const BASE = import.meta.env.BASE_URL;
const ERROR = "Current Chapter could not be securely accessed. Please retry. Sensitive changes require a supported current-password confirmation.";

/** Mounted only within the authenticated private memory settings manager. */
export function CurrentChapterManager() {
  const [chapters, setChapters] = useState<CurrentChapterView[]>([]);
  const [kind, setKind] = useState("");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState<CurrentChapterView | null>(null);
  const [memberConfirmed, setMemberConfirmed] = useState(false);
  const [sensitiveConfirmed, setSensitiveConfirmed] = useState(false);
  const [allowRelevantUse, setAllowRelevantUse] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selected = parseCurrentChapterKind(kind);
  const sensitive = Boolean((selected && isSensitiveChapterKind(selected)) || editing?.isSensitive);
  const request = async (path = "", method = "GET", body?: unknown) => {
    const response = await fetch(`${BASE}api/kinfolk/${path || "current-chapters"}`, {
      method, credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) throw new Error(ERROR);
    return response.json() as Promise<{ chapters?: CurrentChapterView[]; chapter?: CurrentChapterView }>;
  };
  const load = useCallback(async () => {
    try { setChapters((await request()).chapters ?? []); setError(""); }
    catch { setChapters([]); setError(ERROR); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const reauth = async () => {
    if (!password) throw new Error(ERROR);
    try { await request("sensitive-memory-vault/reauth", "POST", { password }); }
    finally { setPassword(""); }
  };
  const clearDraft = () => { setEditing(null); setKind(""); setNote(""); setMemberConfirmed(false); setSensitiveConfirmed(false); setAllowRelevantUse(false); setPassword(""); };
  const save = async () => {
    if (!selected || !memberConfirmed || (sensitive && !sensitiveConfirmed) || busy) return;
    setBusy(true); setError("");
    try {
      if (sensitive) await reauth();
      await request(`current-chapters${editing ? `/${encodeURIComponent(editing.id)}` : ""}`, editing ? "PATCH" : "POST", {
        kind: selected, note: note.trim(), memberConfirmed: true, sensitiveConfirmed, allowRelevantUse,
      });
      clearDraft(); await load();
    } catch { setError(ERROR); }
    finally { setBusy(false); }
  };
  const lifecycle = async (chapter: CurrentChapterView, action: "end" | "remove") => {
    if (busy || !window.confirm(action === "end" ? "End this Current Chapter? Its dated history stays private." : "Remove this chapter and its saved history permanently? Kinfolk can no longer use it.")) return;
    setBusy(true); setError("");
    try {
      if (chapter.isSensitive) await reauth();
      await request(`current-chapters/${encodeURIComponent(chapter.id)}${action === "end" ? "/end" : ""}`, action === "end" ? "POST" : "DELETE", action === "end" ? { memberConfirmed: true } : undefined);
      if (editing?.id === chapter.id) clearDraft();
      await load();
    } catch { setError(ERROR); }
    finally { setBusy(false); }
  };
  const unlock = async () => { setBusy(true); try { await reauth(); await load(); } catch { setError(ERROR); } finally { setBusy(false); } };
  return <section data-testid="current-chapter-manager" className="mb-5 space-y-3 rounded-2xl border p-4 text-sm">
    <h3 className="font-bold">Current Chapter</h3>
    <p>A private, member-set chapter—not a stable preference or private-memory note. Nothing you search, save, visit or say creates one. Ending preserves dated history; removing deletes it and revokes use.</p>
    {error && <p role="alert">{error} <button type="button" disabled={busy} onClick={() => void load()}>Retry</button></p>}
    <label className="block">Chapter kind<select value={kind} disabled={busy} onChange={(event) => { setKind(event.target.value); setMemberConfirmed(false); setSensitiveConfirmed(false); }} className="block w-full rounded border p-2">
      <option value="">Choose a chapter (optional)</option>{Object.entries(CURRENT_CHAPTER_KINDS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select></label>
    <label className="block">Short private note (optional, 500 characters)<textarea maxLength={500} value={note} disabled={busy} onChange={(event) => { setNote(event.target.value); setMemberConfirmed(false); setSensitiveConfirmed(false); }} className="block w-full rounded border p-2" /></label>
    <label className="block"><input type="checkbox" checked={allowRelevantUse} disabled={busy} onChange={(event) => { setAllowRelevantUse(event.target.checked); setMemberConfirmed(false); setSensitiveConfirmed(false); }} /> Allow use only for a directly relevant private Kinfolk conversation. Never discovery, Map, Directory, Library, Community, Safety or profiles.</label>
    <label className="block"><input type="checkbox" checked={memberConfirmed} disabled={busy} onChange={(event) => setMemberConfirmed(event.target.checked)} /> Keep this as my Current Chapter{editing?.endedAt ? " (edit saved history only; do not reactivate)" : ""}</label>
    {sensitive && <label className="block"><input type="checkbox" checked={sensitiveConfirmed} disabled={busy} onChange={(event) => setSensitiveConfirmed(event.target.checked)} /> I explicitly confirm this sensitive chapter. Its note is encrypted; review and changes require recent password confirmation. Relevant use is limited to direct medical or emotional support.</label>}
    {(sensitive || chapters.some((chapter) => chapter.isSensitive)) && <div><label>Current password for sensitive chapters<input type="password" autoComplete="current-password" value={password} disabled={busy} onChange={(event) => setPassword(event.target.value)} className="block w-full rounded border p-2" /></label><button type="button" disabled={busy || !password} onClick={() => void unlock()}>Review sensitive chapters</button><p>Confirm your password again when editing, ending or removing a sensitive chapter. Unsupported sign-in methods stay locked.</p></div>}
    <button type="button" disabled={busy || !selected || !memberConfirmed || (sensitive && (!sensitiveConfirmed || !password))} onClick={() => void save()}>{busy ? "Working…" : editing ? "Confirm chapter edit" : "Confirm new chapter"}</button>
    <button type="button" disabled={busy} onClick={clearDraft}>Cancel draft</button>
    <h4 className="font-bold">Current chapters and dated history</h4>
    {!chapters.length && <p>No chapters saved.</p>}
    {chapters.map((chapter) => <article key={chapter.id} className="space-y-1 rounded border p-3">
      <strong>{chapter.kind ? CURRENT_CHAPTER_KINDS[chapter.kind] : "Sensitive chapter (locked)"}</strong>
      <p>{chapter.endedAt ? "Ended history" : "Current"}: {new Date(chapter.startedAt).toLocaleDateString()}{chapter.endedAt ? ` — ${new Date(chapter.endedAt).toLocaleDateString()}` : ""}</p>
      {!chapter.vaultLocked && <p className="whitespace-pre-wrap">{chapter.note || "No private note"}</p>}
      <button type="button" disabled={busy || chapter.vaultLocked} onClick={() => { setEditing(chapter); setKind(chapter.kind ?? ""); setNote(chapter.note ?? ""); setAllowRelevantUse(chapter.allowRelevantUse); setMemberConfirmed(false); setSensitiveConfirmed(false); }}>Edit{chapter.endedAt ? " history" : ""}</button>
      {!chapter.endedAt && <button type="button" disabled={busy || (chapter.isSensitive && !password)} onClick={() => void lifecycle(chapter, "end")}>End (keep history)</button>}
      <button type="button" disabled={busy || (chapter.isSensitive && !password)} onClick={() => void lifecycle(chapter, "remove")}>Remove and revoke</button>
    </article>)}
  </section>;
}
