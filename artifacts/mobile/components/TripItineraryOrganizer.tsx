import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { type ItineraryEntry, type ItineraryEntryInput, useTripItinerary } from "@/hooks/useItineraries";

type EntryForm = ItineraryEntryInput;
const blank = (order: number): EntryForm => ({ dayLabel: `Day ${order}`, dayOrder: order, startTimeLabel: "", endTimeLabel: "", title: "", note: "" });

/** Private manual organizer only: no scheduling, booking, notification, sharing, or automatic service use. */
export default function TripItineraryOrganizer({ tripId, tripTitle }: Readonly<{ tripId: string; tripTitle: string }>) {
  const colors = useColors();
  const { entries, isLoading, error: loadError, createEntry, updateEntry, deleteEntry, reorderEntries } = useTripItinerary(tripId);
  const [selected, setSelected] = useState<ItineraryEntry | null>(null);
  const [form, setForm] = useState<EntryForm>(() => blank(1));
  const [showForm, setShowForm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const error = actionError ?? loadError;

  const reset = () => {
    setSelected(null); setForm(blank(entries.length + 1)); setConfirmed(false); setShowForm(false); setActionError(null);
  };
  const beginCreate = () => { setSelected(null); setForm(blank(entries.length + 1)); setConfirmed(false); setShowForm(true); setActionError(null); };
  const beginEdit = (entry: ItineraryEntry) => {
    setSelected(entry);
    setForm({ dayLabel: entry.dayLabel, dayOrder: entry.dayOrder, startTimeLabel: entry.startTimeLabel, endTimeLabel: entry.endTimeLabel, title: entry.title, note: entry.note });
    setConfirmed(false); setShowForm(true); setActionError(null);
  };
  const perform = async (operation: () => Promise<void>, fallback: string) => {
    setSaving(true); setActionError(null);
    try { await operation(); } catch (cause) { setActionError(cause instanceof Error ? cause.message : fallback); } finally { setSaving(false); }
  };
  const save = async () => {
    if (!confirmed || !form.dayLabel.trim() || !form.title.trim() || !Number.isInteger(form.dayOrder) || form.dayOrder < 1 || saving) return;
    await perform(async () => {
      if (selected) await updateEntry(selected.id, form, true); else await createEntry(form, true);
      reset();
    }, "This private itinerary item could not be saved.");
  };
  const confirmAction = (title: string, message: string, action: () => void, destructive = false) => {
    if (Platform.OS === "web") {
      if (typeof globalThis.confirm === "function" && globalThis.confirm(message)) action();
      return;
    }
    Alert.alert(title, message, [{ text: "Cancel", style: "cancel" }, { text: destructive ? "Delete" : "Reposition", style: destructive ? "destructive" : "default", onPress: action }]);
  };
  const remove = (entry: ItineraryEntry) => confirmAction("Remove private itinerary item?", `Delete “${entry.title}”? This requires your confirmation.`, () => {
    void perform(async () => { await deleteEntry(entry.id, true); if (selected?.id === entry.id) reset(); }, "This private itinerary item could not be deleted.");
  }, true);
  const move = (entry: ItineraryEntry, direction: -1 | 1) => {
    const index = entries.findIndex((current) => current.id === entry.id); const target = index + direction;
    if (index < 0 || target < 0 || target >= entries.length) return;
    const ordered = [...entries]; [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    confirmAction("Reposition private itinerary item?", "Reposition this private item now? This requires your confirmation.", () => {
      void perform(() => reorderEntries(ordered.map((current) => current.id), true), "This private itinerary could not be reordered.");
    });
  };
  const invalid = !confirmed || !form.dayLabel.trim() || !form.title.trim() || !Number.isInteger(form.dayOrder) || form.dayOrder < 1 || form.dayOrder > entries.length + (selected ? 0 : 1) || saving;

  return (
    <View style={[styles.shell, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.heading}><View style={styles.headingCopy}><Text style={[styles.kicker, { color: colors.primary }]}>PRIVATE MANUAL ORGANIZER</Text><Text style={[styles.title, { color: colors.foreground }]}>Day-by-day itinerary for {tripTitle}</Text><Text style={[styles.boundary, { color: colors.mutedForeground }]}>Private, manual itinerary items do not schedule, book, notify, share, or automatically use any service. They are not sent to Kinfolk chat or memory, profile, discovery, Map, Directory, Community, Safety, providers, calendars, flights, hotels, events, documents, tasks, reminders, or analytics.</Text></View><TouchableOpacity onPress={beginCreate} style={[styles.add, { backgroundColor: colors.primary }]} accessibilityLabel="Add private itinerary item"><Feather name="plus" size={15} color="#FFFFFF" /><Text style={styles.addText}>Add item</Text></TouchableOpacity></View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {showForm ? <View style={[styles.form, { borderColor: colors.border }]}><View style={styles.formHeader}><Text style={[styles.formTitle, { color: colors.foreground }]}>{selected ? `Edit ${selected.title}` : "Add a private day item"}</Text><TouchableOpacity onPress={reset} accessibilityLabel="Cancel itinerary edit"><Text style={[styles.cancel, { color: colors.primary }]}>Cancel</Text></TouchableOpacity></View>
        <Text style={[styles.label, { color: colors.foreground }]}>Day label</Text><TextInput accessibilityLabel="Itinerary day label" value={form.dayLabel} maxLength={80} onChangeText={(dayLabel) => setForm({ ...form, dayLabel })} placeholder="Day 1" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>Day order</Text><TextInput accessibilityLabel="Itinerary day order" value={form.dayOrder ? String(form.dayOrder) : ""} keyboardType="number-pad" maxLength={3} onChangeText={(value) => setForm({ ...form, dayOrder: Number(value) })} placeholder="1" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>Optional start time label</Text><TextInput accessibilityLabel="Itinerary start time label" value={form.startTimeLabel} maxLength={32} onChangeText={(startTimeLabel) => setForm({ ...form, startTimeLabel })} placeholder="9:00 AM" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>Optional end time label</Text><TextInput accessibilityLabel="Itinerary end time label" value={form.endTimeLabel} maxLength={32} onChangeText={(endTimeLabel) => setForm({ ...form, endTimeLabel })} placeholder="10:30 AM" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>Item title</Text><TextInput accessibilityLabel="Itinerary item title" value={form.title} maxLength={160} onChangeText={(title) => setForm({ ...form, title })} placeholder="Morning plan" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>Optional private note</Text><TextInput accessibilityLabel="Itinerary item note" value={form.note} maxLength={2000} multiline textAlignVertical="top" onChangeText={(note) => setForm({ ...form, note })} placeholderTextColor={colors.mutedForeground} style={[styles.input, styles.note, { color: colors.foreground, borderColor: colors.border }]} />
        <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: confirmed }} accessibilityLabel="Confirm private itinerary save" onPress={() => setConfirmed((value) => !value)} style={styles.confirm}><View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: confirmed ? colors.primary : "transparent" }]}>{confirmed ? <Feather name="check" size={13} color="#FFFFFF" /> : null}</View><Text style={[styles.confirmText, { color: colors.mutedForeground }]}>I confirm that I want to {selected ? "replace" : "save"} this private manual itinerary item now.</Text></TouchableOpacity>
        <TouchableOpacity disabled={invalid} onPress={() => void save()} style={[styles.save, { backgroundColor: colors.primary }, invalid && styles.disabled]} accessibilityLabel={selected ? "Confirm and update itinerary item" : "Confirm and save itinerary item"}>{saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <><Feather name={selected ? "edit-3" : "save"} size={15} color="#FFFFFF" /><Text style={styles.saveText}>{selected ? "Confirm and update item" : "Confirm and save item"}</Text></>}</TouchableOpacity>
      </View> : null}
      {isLoading ? <ActivityIndicator style={styles.loading} color={colors.primary} /> : null}
      {!isLoading && entries.length === 0 ? <Text style={[styles.empty, { color: colors.mutedForeground, borderColor: colors.border }]}>No private day items yet. Add one manually when you choose.</Text> : null}
      {entries.map((entry, index) => <View key={entry.id} style={[styles.item, { borderColor: colors.border }]}><TouchableOpacity style={styles.itemCopy} onPress={() => beginEdit(entry)} accessibilityLabel={`Inspect and edit ${entry.title}`}><Text style={[styles.order, { color: colors.primary }]}>{entry.dayLabel} · item {entry.dayOrder}</Text><Text style={[styles.itemTitle, { color: colors.foreground }]}>{entry.title}</Text>{entry.startTimeLabel || entry.endTimeLabel ? <Text style={[styles.time, { color: colors.mutedForeground }]}>{[entry.startTimeLabel, entry.endTimeLabel].filter(Boolean).join(" – ")}</Text> : null}{entry.note ? <Text style={[styles.itemNote, { color: colors.mutedForeground }]} numberOfLines={3}>{entry.note}</Text> : null}</TouchableOpacity><View style={styles.actions}><TouchableOpacity disabled={saving || index === 0} onPress={() => move(entry, -1)} accessibilityLabel={`Move ${entry.title} up`} style={saving || index === 0 ? styles.dim : undefined}><Feather name="arrow-up" size={17} color={colors.primary} /></TouchableOpacity><TouchableOpacity disabled={saving || index === entries.length - 1} onPress={() => move(entry, 1)} accessibilityLabel={`Move ${entry.title} down`} style={saving || index === entries.length - 1 ? styles.dim : undefined}><Feather name="arrow-down" size={17} color={colors.primary} /></TouchableOpacity><TouchableOpacity onPress={() => beginEdit(entry)} accessibilityLabel={`Edit ${entry.title}`}><Feather name="edit-3" size={16} color={colors.primary} /></TouchableOpacity><TouchableOpacity onPress={() => remove(entry)} accessibilityLabel={`Delete ${entry.title}`}><Feather name="trash-2" size={16} color="#B42318" /></TouchableOpacity></View></View>)}
      <Text style={[styles.footer, { color: colors.mutedForeground }]}><Feather name="shield" size={13} color={colors.primary} /> This owner organizer never receives ciphertext, encryption key IDs, fingerprints, another member&apos;s items, or a public share link.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 14 }, heading: { flexDirection: "row", gap: 10, alignItems: "flex-start" }, headingCopy: { flex: 1 }, kicker: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1 }, title: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 3 }, boundary: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 5 }, add: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 8 }, addText: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 12 }, error: { color: "#B42318", fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 18, marginTop: 10 }, form: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12 }, formHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, formTitle: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 14 }, cancel: { fontFamily: "Inter_600SemiBold", fontSize: 12 }, label: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: 9 }, input: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 9, marginTop: 4, fontFamily: "Inter_400Regular", fontSize: 13 }, note: { minHeight: 70 }, confirm: { flexDirection: "row", gap: 8, marginTop: 12, alignItems: "flex-start" }, checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 }, confirmText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 }, save: { marginTop: 12, borderRadius: 10, paddingVertical: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }, saveText: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 12 }, disabled: { opacity: 0.5 }, loading: { marginVertical: 20 }, empty: { borderWidth: 1, borderStyle: "dashed", borderRadius: 10, padding: 13, marginTop: 12, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 }, item: { borderTopWidth: 1, paddingVertical: 12, flexDirection: "row", gap: 9 }, itemCopy: { flex: 1 }, order: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.4 }, itemTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginTop: 3 }, time: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }, itemNote: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 4 }, actions: { gap: 12, paddingTop: 2 }, dim: { opacity: 0.35 }, footer: { flexDirection: "row", alignItems: "center", gap: 5, fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 15, marginTop: 8 },
});
