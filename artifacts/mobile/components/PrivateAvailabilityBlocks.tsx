import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  usePrivateAvailabilityBlocks,
  type PrivateAvailabilityBlock,
  type PrivateAvailabilityBlockInput,
} from "@/hooks/useItineraries";

function defaultTimeZone(): string {
  const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return resolved === "UTC" ? "Etc/UTC" : resolved || "Etc/UTC";
}

function emptyInput(): PrivateAvailabilityBlockInput {
  return { label: "", startAt: "", endAt: "", timeZone: defaultTimeZone(), planningOptIn: false };
}

/** Manual private planning controls only; never reads, connects, or syncs an external calendar. */
export default function PrivateAvailabilityBlocks() {
  const colors = useColors();
  const { blocks, isLoading, error, createBlock, updateBlock, deleteBlock, preview } = usePrivateAvailabilityBlocks();
  const [editing, setEditing] = useState<PrivateAvailabilityBlock | null>(null);
  const [input, setInput] = useState<PrivateAvailabilityBlockInput>(emptyInput);
  const [saveConfirmed, setSaveConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewStartAt, setPreviewStartAt] = useState("");
  const [previewEndAt, setPreviewEndAt] = useState("");
  const [previewTimeZone, setPreviewTimeZone] = useState(defaultTimeZone);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState<{ hasConflict: boolean; conflictCount: number } | null>(null);

  const reset = () => { setEditing(null); setInput(emptyInput()); setSaveConfirmed(false); setActionError(null); };
  const beginEdit = (block: PrivateAvailabilityBlock) => {
    setEditing(block);
    setInput({ label: block.label, startAt: block.startAt, endAt: block.endAt, timeZone: block.timeZone, planningOptIn: block.planningOptIn });
    setSaveConfirmed(false); setActionError(null);
  };
  const save = async () => {
    if (!saveConfirmed || !input.startAt || !input.endAt || !input.timeZone.trim() || saving) return;
    setSaving(true); setActionError(null);
    try {
      if (editing) await updateBlock(editing.id, input, true); else await createBlock(input, true);
      reset();
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "This private availability block could not be saved."); }
    finally { setSaving(false); }
  };
  const requestDelete = (block: PrivateAvailabilityBlock) => {
    Alert.alert("Delete private availability block?", "This requires your confirmation. The block is manual/private and no external calendar is changed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void (async () => {
        setActionError(null);
        try { await deleteBlock(block.id, true); if (editing?.id === block.id) reset(); }
        catch (cause) { setActionError(cause instanceof Error ? cause.message : "This private availability block could not be deleted."); }
      })() },
    ]);
  };
  const checkPreview = async () => {
    if (!previewConfirmed || !previewStartAt || !previewEndAt || !previewTimeZone.trim() || previewing) return;
    setPreviewing(true); setPreviewResult(null); setActionError(null);
    try {
      setPreviewResult(await preview({ startAt: previewStartAt, endAt: previewEndAt, timeZone: previewTimeZone }, true));
      setPreviewConfirmed(false);
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "The private availability preview could not be checked."); }
    finally { setPreviewing(false); }
  };
  const issue = actionError ?? error;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.heading}><Feather name="clock" size={16} color={colors.primary} /><Text style={[styles.title, { color: colors.foreground }]}>Private Availability Blocks</Text></View>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>Manual private planning only. Save a short label and local start/end time with a canonical IANA time zone; all of those details are encrypted at rest and shown only to you.</Text>
      <Text style={[styles.notice, { color: colors.mutedForeground, borderColor: colors.border }]}>No external calendar is connected, read, synced, or blocked. A live calendar provider integration is a separate future approval gate. Blocks are never automatically used in Kinfolk chat or memory, profile, discovery, Map, Directory, Community, Safety, reminders, notifications, sharing, or analytics.</Text>
      {issue ? <Text accessibilityRole="alert" style={[styles.error, { color: "#B42318" }]}>{issue}</Text> : null}

      <View style={[styles.inner, { borderColor: colors.border }]}>
        <View style={styles.formHeading}><Text style={[styles.innerTitle, { color: colors.foreground }]}>{editing ? "Edit private block" : "Add private block"}</Text>{editing ? <TouchableOpacity onPress={reset} accessibilityLabel="Cancel private availability edit"><Text style={[styles.cancel, { color: colors.primary }]}>Cancel</Text></TouchableOpacity> : null}</View>
        <Text style={[styles.label, { color: colors.foreground }]}>Optional short label</Text>
        <TextInput accessibilityLabel="Private availability label" value={input.label} onChangeText={(label) => setInput({ ...input, label })} maxLength={120} placeholder="Personal commitment" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>Start (YYYY-MM-DDTHH:mm, local to zone)</Text>
        <TextInput accessibilityLabel="Private availability start" value={input.startAt} onChangeText={(startAt) => setInput({ ...input, startAt })} placeholder="2026-10-20T09:00" autoCapitalize="none" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>End (YYYY-MM-DDTHH:mm, local to zone)</Text>
        <TextInput accessibilityLabel="Private availability end" value={input.endAt} onChangeText={(endAt) => setInput({ ...input, endAt })} placeholder="2026-10-20T10:00" autoCapitalize="none" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>Canonical IANA time zone</Text>
        <TextInput accessibilityLabel="Private availability time zone" value={input.timeZone} onChangeText={(timeZone) => setInput({ ...input, timeZone })} maxLength={80} placeholder="America/New_York" autoCapitalize="none" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
        <Text style={[styles.help, { color: colors.mutedForeground }]}>Use a named IANA zone such as America/New_York, not UTC or a numeric offset.</Text>
        <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: input.planningOptIn }} accessibilityLabel="Opt in to future manual planning checks" onPress={() => setInput({ ...input, planningOptIn: !input.planningOptIn })} style={styles.confirmRow}><View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: input.planningOptIn ? colors.primary : "transparent" }]}>{input.planningOptIn ? <Feather name="check" size={13} color="#FFFFFF" /> : null}</View><Text style={[styles.confirmText, { color: colors.mutedForeground }]}>Allow this block only when I deliberately run a manual availability preview.</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: saveConfirmed }} accessibilityLabel="Confirm private availability save" onPress={() => setSaveConfirmed((value) => !value)} style={styles.confirmRow}><View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: saveConfirmed ? colors.primary : "transparent" }]}>{saveConfirmed ? <Feather name="check" size={13} color="#FFFFFF" /> : null}</View><Text style={[styles.confirmText, { color: colors.mutedForeground }]}>I confirm that I want to {editing ? "replace" : "save"} this manual private block now.</Text></TouchableOpacity>
        <TouchableOpacity disabled={!saveConfirmed || !input.startAt || !input.endAt || !input.timeZone.trim() || saving} onPress={() => void save()} accessibilityLabel={editing ? "Confirm and update private availability block" : "Confirm and save private availability block"} style={[styles.button, { backgroundColor: colors.primary }, (!saveConfirmed || !input.startAt || !input.endAt || !input.timeZone.trim() || saving) && styles.disabled]}>{saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <><Feather name={editing ? "edit-3" : "save"} size={15} color="#FFFFFF" /><Text style={styles.buttonText}>{editing ? "Confirm and update block" : "Confirm and save block"}</Text></>}</TouchableOpacity>
      </View>

      <View style={[styles.inner, { borderColor: colors.border }]}>
        <Text style={[styles.innerTitle, { color: colors.foreground }]}>Explicit availability preview</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Check a prospective interval only when you choose. The result returns whether opted-in blocks conflict and a safe count; it never reveals labels, commitment details, another member&apos;s data, or provider state.</Text>
        <Text style={[styles.label, { color: colors.foreground }]}>Prospective start</Text>
        <TextInput accessibilityLabel="Prospective availability start" value={previewStartAt} onChangeText={setPreviewStartAt} placeholder="2026-10-20T09:00" autoCapitalize="none" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>Prospective end</Text>
        <TextInput accessibilityLabel="Prospective availability end" value={previewEndAt} onChangeText={setPreviewEndAt} placeholder="2026-10-20T10:00" autoCapitalize="none" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>Prospective canonical IANA time zone</Text>
        <TextInput accessibilityLabel="Prospective availability time zone" value={previewTimeZone} onChangeText={setPreviewTimeZone} maxLength={80} placeholder="America/New_York" autoCapitalize="none" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
        <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: previewConfirmed }} accessibilityLabel="Confirm private availability preview" onPress={() => setPreviewConfirmed((value) => !value)} style={styles.confirmRow}><View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: previewConfirmed ? colors.primary : "transparent" }]}>{previewConfirmed ? <Feather name="check" size={13} color="#FFFFFF" /> : null}</View><Text style={[styles.confirmText, { color: colors.mutedForeground }]}>I confirm that I want to run this private manual availability preview now.</Text></TouchableOpacity>
        <TouchableOpacity disabled={!previewConfirmed || !previewStartAt || !previewEndAt || !previewTimeZone.trim() || previewing} onPress={() => void checkPreview()} accessibilityLabel="Confirm and check private availability conflicts" style={[styles.previewButton, { borderColor: colors.border }, (!previewConfirmed || !previewStartAt || !previewEndAt || !previewTimeZone.trim() || previewing) && styles.disabled]}><Text style={[styles.previewText, { color: colors.foreground }]}>{previewing ? "Checking…" : "Confirm and check conflicts"}</Text></TouchableOpacity>
        {previewResult ? <Text accessibilityLiveRegion="polite" style={[styles.previewResult, { color: colors.mutedForeground }]}>{previewResult.hasConflict ? `Conflict detected with ${previewResult.conflictCount} opted-in private block${previewResult.conflictCount === 1 ? "" : "s"}.` : "No opted-in private block conflicts with this interval."}</Text> : null}
      </View>

      <Text style={[styles.innerTitle, { color: colors.foreground }]}>Saved private blocks</Text>
      {isLoading ? <ActivityIndicator style={styles.loading} color={colors.primary} /> : null}
      {!isLoading && blocks.length === 0 ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>No private availability blocks yet. Add one only when you choose.</Text> : null}
      {blocks.map((block) => <View key={block.id} style={[styles.row, { borderTopColor: colors.border }]}><TouchableOpacity onPress={() => beginEdit(block)} accessibilityLabel={`Edit ${block.label || "private availability block"}`} style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{block.label || "Private availability block"}</Text><Text style={[styles.rowText, { color: colors.mutedForeground }]}>{block.startAt} to {block.endAt} · {block.timeZone} · {block.planningOptIn ? "Included in manual previews" : "Excluded from manual previews"}</Text></TouchableOpacity><TouchableOpacity onPress={() => requestDelete(block)} accessibilityLabel={`Delete ${block.label || "private availability block"}`} hitSlop={8}><Feather name="trash-2" size={16} color="#B42318" /></TouchableOpacity></View>)}
      <Text style={[styles.footer, { color: colors.mutedForeground }]}>Only your signed-in owner view receives decrypted block details. It never receives ciphertext, key IDs, fingerprints, another member&apos;s blocks, or an external-calendar state.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 }, heading: { flexDirection: "row", alignItems: "center", gap: 8 }, title: { fontFamily: "Inter_700Bold", fontSize: 16 }, body: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 }, notice: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, borderWidth: 1, borderRadius: 10, padding: 10 }, error: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 18 }, inner: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 7 }, formHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, innerTitle: { fontFamily: "Inter_700Bold", fontSize: 14 }, cancel: { fontFamily: "Inter_600SemiBold", fontSize: 12 }, label: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: 2 }, input: { fontFamily: "Inter_400Regular", fontSize: 13, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 9 }, help: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 }, confirmRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 4 }, checkbox: { width: 19, height: 19, borderWidth: 1.5, borderRadius: 5, alignItems: "center", justifyContent: "center", marginTop: 1 }, confirmText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 }, button: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, marginTop: 5, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }, buttonText: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 12 }, previewButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, marginTop: 5, alignItems: "center" }, previewText: { fontFamily: "Inter_600SemiBold", fontSize: 12 }, previewResult: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 18, marginTop: 3 }, disabled: { opacity: 0.5 }, loading: { marginVertical: 10 }, empty: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 }, row: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, paddingTop: 10, marginTop: 2 }, rowCopy: { flex: 1 }, rowTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13 }, rowText: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 3 }, footer: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 2 },
});
