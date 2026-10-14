import React, { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CURRENT_CHAPTER_KINDS, isSensitiveChapterKind, parseCurrentChapterKind, type CurrentChapterView } from "@workspace/constants";
import { getApiBase } from "@/lib/api";
import { useColors } from "@/hooks/useColors";
import { useUnsavedKinfolkExitGuard } from "@/hooks/useUnsavedKinfolkExitGuard";
const ERROR = "Current Chapter could not be securely accessed. Please retry. Sensitive changes require a supported current-password confirmation.";

export function CurrentChapterManager({ getToken }: { getToken: () => Promise<string | null> }) {
  const colors = useColors();
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
    const token = await getToken(); const base = getApiBase();
    if (!token || !base) throw new Error(ERROR);
    const response = await fetch(`${base}/api/kinfolk/${path || "current-chapters"}`, {
      method, cache: "no-store", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) throw new Error(ERROR);
    return response.json() as Promise<{ chapters?: CurrentChapterView[]; chapter?: CurrentChapterView }>;
  };
  const load = useCallback(async () => {
    try { setChapters((await request()).chapters ?? []); setError(""); }
    catch { setChapters([]); setError(ERROR); }
  }, [getToken]);
  useEffect(() => { void load(); }, [load]);
  const reauth = async () => {
    if (!password) throw new Error(ERROR);
    try { await request("sensitive-memory-vault/reauth", "POST", { password }); }
    finally { setPassword(""); }
  };
  const clearDraft = () => { setEditing(null); setKind(""); setNote(""); setMemberConfirmed(false); setSensitiveConfirmed(false); setAllowRelevantUse(false); setPassword(""); };
  const save = async (): Promise<boolean> => {
    if (!selected || !memberConfirmed || (sensitive && !sensitiveConfirmed) || busy) return false;
    setBusy(true); setError("");
    try {
      if (sensitive) await reauth();
      await request(`current-chapters${editing ? `/${encodeURIComponent(editing.id)}` : ""}`, editing ? "PATCH" : "POST", {
        kind: selected, note: note.trim(), memberConfirmed: true, sensitiveConfirmed, allowRelevantUse,
      });
      clearDraft(); await load(); return true;
    } catch { setError(ERROR); return false; }
    finally { setBusy(false); }
  };
  useUnsavedKinfolkExitGuard({ dirty: Boolean(kind || note || editing), saving: busy, screenLabel: "Current Chapter", onSave: save, onDiscard: clearDraft });
  const lifecycle = (chapter: CurrentChapterView, action: "end" | "remove") => {
    if (busy) return;
    Alert.alert(action === "end" ? "End Current Chapter?" : "Remove Current Chapter?", action === "end" ? "Its dated history stays private." : "This permanently deletes the chapter and its saved history and revokes use.", [
      { text: "Cancel", style: "cancel" },
      { text: action === "end" ? "End (keep history)" : "Remove and revoke", style: action === "remove" ? "destructive" : "default", onPress: () => { void (async () => {
        setBusy(true); setError("");
        try {
          if (chapter.isSensitive) await reauth();
          await request(`current-chapters/${encodeURIComponent(chapter.id)}${action === "end" ? "/end" : ""}`, action === "end" ? "POST" : "DELETE", action === "end" ? { memberConfirmed: true } : undefined);
          if (editing?.id === chapter.id) clearDraft();
          await load();
        } catch { setError(ERROR); }
        finally { setBusy(false); }
      })(); } },
    ]);
  };
  const unlock = async () => { setBusy(true); try { await reauth(); await load(); } catch { setError(ERROR); } finally { setBusy(false); } };
  const textStyle = { color: colors.foreground };
  const button = (label: string, action: () => void, disabled = false) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={action} style={[styles.button, { borderColor: colors.border, opacity: disabled ? 0.5 : 1 }]}><Text style={textStyle}>{label}</Text></TouchableOpacity>;
  const toggle = (label: string, value: boolean, change: (value: boolean) => void) => <View style={styles.toggle}><Text style={[textStyle, { flex: 1 }]}>{label}</Text><Switch accessibilityLabel={label} value={value} onValueChange={change} disabled={busy} /></View>;
  return <View testID="current-chapter-manager" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Text style={[textStyle, styles.title]}>Current Chapter</Text>
    <Text style={textStyle}>A private, member-set chapter—not a stable preference or private-memory note. Nothing you search, save, visit or say creates one. Ending preserves dated history; removing deletes it and revokes use.</Text>
    {!!error && <View><Text accessibilityRole="alert" style={textStyle}>{error}</Text>{button("Retry", () => void load(), busy)}</View>}
    <Text style={textStyle}>Choose a chapter (optional)</Text>
    <View style={styles.kinds}>{Object.entries(CURRENT_CHAPTER_KINDS).map(([id, label]) => <TouchableOpacity key={id} accessibilityRole="radio" accessibilityState={{ checked: kind === id, disabled: busy }} disabled={busy} onPress={() => { setKind(id); setMemberConfirmed(false); setSensitiveConfirmed(false); }} style={[styles.button, { borderColor: kind === id ? colors.primary : colors.border }]}><Text style={textStyle}>{label}</Text></TouchableOpacity>)}</View>
    <Text style={textStyle}>Short private note (optional, 500 characters)</Text>
    <TextInput accessibilityLabel="Short private chapter note" multiline maxLength={500} value={note} editable={!busy} onChangeText={(value) => { setNote(value); setMemberConfirmed(false); setSensitiveConfirmed(false); }} style={[styles.input, textStyle, { borderColor: colors.border }]} />
    {toggle("Allow use only for a directly relevant private Kinfolk conversation. Never discovery, Map, Directory, Library, Community, Safety or profiles.", allowRelevantUse, (value) => { setAllowRelevantUse(value); setMemberConfirmed(false); setSensitiveConfirmed(false); })}
    {toggle(`Keep this as my Current Chapter${editing?.endedAt ? " (edit saved history only; do not reactivate)" : ""}`, memberConfirmed, setMemberConfirmed)}
    {sensitive && toggle("I explicitly confirm this sensitive chapter. Its note is encrypted; review and changes require recent password confirmation. Relevant use is limited to direct medical or emotional support.", sensitiveConfirmed, setSensitiveConfirmed)}
    {(sensitive || chapters.some((chapter) => chapter.isSensitive)) && <View><Text style={textStyle}>Current password for sensitive chapters</Text><TextInput accessibilityLabel="Current password for sensitive chapters" secureTextEntry autoComplete="current-password" value={password} editable={!busy} onChangeText={setPassword} style={[styles.input, textStyle, { borderColor: colors.border }]} />{button("Review sensitive chapters", () => void unlock(), busy || !password)}<Text style={textStyle}>Confirm your password again when editing, ending or removing a sensitive chapter. Unsupported sign-in methods stay locked.</Text></View>}
    {button(busy ? "Working…" : editing ? "Confirm chapter edit" : "Confirm new chapter", () => void save(), busy || !selected || !memberConfirmed || (sensitive && (!sensitiveConfirmed || !password)))}
    {button("Cancel draft", clearDraft, busy)}
    <Text style={[textStyle, styles.title]}>Current chapters and dated history</Text>
    {!chapters.length && <Text style={textStyle}>No chapters saved.</Text>}
    {chapters.map((chapter) => <View key={chapter.id} style={[styles.card, { borderColor: colors.border }]}>
      <Text style={[textStyle, styles.title]}>{chapter.kind ? CURRENT_CHAPTER_KINDS[chapter.kind] : "Sensitive chapter (locked)"}</Text>
      <Text style={textStyle}>{chapter.endedAt ? "Ended history" : "Current"}: {new Date(chapter.startedAt).toLocaleDateString()}{chapter.endedAt ? ` — ${new Date(chapter.endedAt).toLocaleDateString()}` : ""}</Text>
      {!chapter.vaultLocked && <Text style={textStyle}>{chapter.note || "No private note"}</Text>}
      {button(chapter.endedAt ? "Edit history" : "Edit", () => { setEditing(chapter); setKind(chapter.kind ?? ""); setNote(chapter.note ?? ""); setAllowRelevantUse(chapter.allowRelevantUse); setMemberConfirmed(false); setSensitiveConfirmed(false); }, busy || chapter.vaultLocked)}
      {!chapter.endedAt && button("End (keep history)", () => lifecycle(chapter, "end"), busy || (chapter.isSensitive && !password))}
      {button("Remove and revoke", () => lifecycle(chapter, "remove"), busy || (chapter.isSensitive && !password))}
    </View>)}
  </View>;
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12, marginVertical: 12 },
  title: { fontSize: 16, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 44 },
  button: { borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 44 },
  kinds: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 8 },
});
