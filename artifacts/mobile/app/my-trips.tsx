import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useItineraries, useTripTemporaryStays, type Itinerary, type TripTemporaryStay } from "@/hooks/useItineraries";
import TripItineraryOrganizer from "@/components/TripItineraryOrganizer";
import TripFlightContext from "@/components/TripFlightContext";
import PrivateAvailabilityBlocks from "@/components/PrivateAvailabilityBlocks";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function TripTemporaryStayManager({ tripId }: { tripId: string }) {
  const colors = useColors();
  const { stays, isLoading, error, linkStay, unlinkStay } = useTripTemporaryStays(tripId);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const link = async (stay: TripTemporaryStay) => {
    if (!confirmed || saving) return;
    setSaving(true);
    try {
      await linkStay(stay.id, true);
      setConfirmed(false);
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // The hook renders the owner-safe server outcome below on the next refresh.
    } finally {
      setSaving(false);
    }
  };

  const requestUnlink = (stay: TripTemporaryStay) => {
    Alert.alert("Unlink Temporary Stay?", `Remove “${stay.label}” from this private Trip? The Temporary Stay itself will not be changed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unlink", style: "destructive", onPress: () => {
          void (async () => {
            setSaving(true);
            try { await unlinkStay(stay.id, true); } catch { /* owner-safe hook error remains visible */ } finally { setSaving(false); }
          })();
        },
      },
    ]);
  };

  return (
    <View style={[styles.temporaryStays, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.temporaryStayHeading}>
        <Feather name="shield" size={16} color={colors.primary} />
        <Text style={[styles.temporaryStayTitle, { color: colors.foreground }]}>Temporary Stay (optional)</Text>
      </View>
      <Text style={[styles.temporaryStayBody, { color: colors.mutedForeground }]}>Choose only an existing active Temporary Stay saved in Settings. Its exact address remains encrypted; linking neither sends it to Kinfolk chat or memory nor triggers nearby search, calendar, booking, provider, reminders, sharing, Map, Directory, Community, Safety, or analytics. Creation and its Google disclosure remain in Settings.</Text>
      {error ? <Text accessibilityRole="alert" style={[styles.temporaryStayError, { color: "#B42318" }]}>{error}</Text> : null}
      {isLoading ? <ActivityIndicator style={styles.temporaryStayLoading} color={colors.primary} /> : null}
      {!isLoading && stays.length === 0 ? <Text style={[styles.temporaryStayEmpty, { color: colors.mutedForeground }]}>No active Temporary Stays are available for this Trip.</Text> : null}
      {!isLoading && stays.length > 0 ? (
        <>
          <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: confirmed }} accessibilityLabel="Confirm Temporary Stay link" onPress={() => setConfirmed((value) => !value)} style={styles.confirmRow}>
            <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: confirmed ? colors.primary : "transparent" }]}>{confirmed ? <Feather name="check" size={13} color="#FFFFFF" /> : null}</View>
            <Text style={[styles.confirmText, { color: colors.mutedForeground }]}>I confirm that I want to link one existing active Temporary Stay to this private Trip.</Text>
          </TouchableOpacity>
          {stays.map((stay) => (
            <View key={stay.id} style={[styles.temporaryStayRow, { borderTopColor: colors.border }]}>
              <View style={styles.temporaryStayCopy}>
                <Text style={[styles.temporaryStayLabel, { color: colors.foreground }]}>{stay.label}</Text>
                <Text style={[styles.temporaryStayDates, { color: colors.mutedForeground }]}>Arrival {formatDate(stay.arrivalDate)} · Departure {formatDate(stay.departureDate)} · Expires {formatDate(stay.expiresAt)}</Text>
              </View>
              {stay.linked ? (
                <TouchableOpacity disabled={saving} onPress={() => requestUnlink(stay)} accessibilityLabel={`Unlink ${stay.label} from this Trip`} style={[styles.unlinkButton, { borderColor: colors.border }]}><Text style={[styles.unlinkText, { color: colors.primary }]}>Unlink</Text></TouchableOpacity>
              ) : (
                <TouchableOpacity disabled={!confirmed || saving} onPress={() => void link(stay)} accessibilityLabel={`Confirm and link ${stay.label} to this Trip`} style={[styles.linkButton, { backgroundColor: colors.primary }, (!confirmed || saving) && styles.disabled]}><Text style={styles.linkText}>{saving ? "Linking…" : "Link"}</Text></TouchableOpacity>
              )}
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

/**
 * Account-backed, owner-only Trip management. It is intentionally not connected
 * to chat/memory, profile, discovery/Map/Directory/Community/Safety, providers,
 * calendar, hotels, events, documents, tasks/reminders, analytics, or sharing.
 * An optional, separately confirmed flight context is shown only on a selected
 * private Trip and never activates those integrations. The form never requests
 * an exact address, location, or coordinates.
 */
export default function MyTripsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    itineraries,
    isLoading,
    error: loadError,
    createItinerary,
    updateItinerary,
    deleteItinerary,
  } = useItineraries();
  const [selected, setSelected] = useState<Itinerary | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const error = actionError ?? loadError;

  const resetForm = () => {
    setSelected(null);
    setTitle("");
    setDestination("");
    setNotes("");
    setConfirmed(false);
    setActionError(null);
    setShowForm(false);
  };

  const beginCreate = () => {
    setSelected(null);
    setTitle("");
    setDestination("");
    setNotes("");
    setConfirmed(false);
    setActionError(null);
    setShowForm(true);
  };

  const beginInspect = (item: Itinerary) => {
    setSelected(item);
    setTitle(item.name);
    setDestination(item.destination);
    setNotes(item.notes);
    setConfirmed(false);
    setActionError(null);
    setShowForm(true);
  };

  const save = async () => {
    if (!confirmed || !title.trim() || !destination.trim() || saving) return;
    setSaving(true);
    setActionError(null);
    try {
      if (selected) {
        await updateItinerary(selected.id, { name: title, destination, notes }, true);
      } else {
        await createItinerary(title, notes, destination, true);
      }
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "This private Trip could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: Itinerary) => {
    const remove = async () => {
      setActionError(null);
      try {
        // The dialog plus memberConfirmed request makes deletion deliberate.
        await deleteItinerary(item.id, true);
        if (selected?.id === item.id) resetForm();
      } catch (cause) {
        setActionError(cause instanceof Error ? cause.message : "This private Trip could not be deleted.");
      }
    };
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert("Remove private Trip?", `Delete “${item.name}”?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void remove() },
      ]);
      return;
    }
    void remove();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={styles.backBtn} hitSlop={10} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>My Trips</Text>
        <TouchableOpacity style={[styles.newBtn, { backgroundColor: colors.primary }]} onPress={beginCreate} activeOpacity={0.85} accessibilityLabel="Create a private Trip">
          <Feather name="plus" size={15} color="#FFFFFF" />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 32 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.privacy, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="shield" size={16} color={colors.primary} />
          <View style={styles.privacyCopy}>
            <Text style={[styles.privacyTitle, { color: colors.foreground }]}>Private account Trips</Text>
            <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>Your title, city/region/country destination, and optional note are encrypted at rest. Trips are not automatically used in Kinfolk chat or memory, profile, discovery, Map, Directory, Community, Safety, providers, analytics, tasks, reminders, or sharing.</Text>
          </View>
        </View>
        <View style={[styles.legacy, { borderColor: colors.border }]}>
          <Feather name="archive" size={14} color={colors.mutedForeground} />
          <Text style={[styles.legacyText, { color: colors.mutedForeground }]}>Older device-only Saved Trips, if any, remain in this device&apos;s local storage. They were not moved to your account or deleted.</Text>
        </View>
        <PrivateAvailabilityBlocks />
        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: "#B42318" }]}>{error}</Text> : null}

        {showForm ? (
          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.foreground }]}>{selected ? `Inspect and edit ${selected.name}` : "Create a private Trip"}</Text>
              <TouchableOpacity onPress={resetForm} accessibilityLabel="Cancel Trip edit"><Text style={[styles.cancel, { color: colors.primary }]}>Cancel</Text></TouchableOpacity>
            </View>
            <Text style={[styles.label, { color: colors.foreground }]}>Trip title</Text>
            <TextInput accessibilityLabel="Trip title" value={title} onChangeText={setTitle} maxLength={120} placeholder="Weekend in New Orleans" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
            <Text style={[styles.label, { color: colors.foreground }]}>Destination</Text>
            <TextInput accessibilityLabel="Trip destination" value={destination} onChangeText={setDestination} maxLength={120} placeholder="City, region, or country only" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
            <Text style={[styles.help, { color: colors.mutedForeground }]}>Do not enter an exact address or coordinates.</Text>
            <Text style={[styles.label, { color: colors.foreground }]}>Optional note</Text>
            <TextInput accessibilityLabel="Trip note" value={notes} onChangeText={setNotes} maxLength={1000} multiline textAlignVertical="top" placeholder="What would you like to remember?" placeholderTextColor={colors.mutedForeground} style={[styles.input, styles.noteInput, { color: colors.foreground, borderColor: colors.border }]} />
            <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: confirmed }} accessibilityLabel="Confirm private Trip save" onPress={() => setConfirmed((value) => !value)} style={styles.confirmRow}>
              <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: confirmed ? colors.primary : "transparent" }]}>{confirmed ? <Feather name="check" size={13} color="#FFFFFF" /> : null}</View>
              <Text style={[styles.confirmText, { color: colors.mutedForeground }]}>I confirm that I want to {selected ? "replace" : "save"} this private Trip now.</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={!confirmed || !title.trim() || !destination.trim() || saving} onPress={() => void save()} style={[styles.saveButton, { backgroundColor: colors.primary }, (!confirmed || !title.trim() || !destination.trim() || saving) && styles.disabled]} accessibilityLabel={selected ? "Confirm and update Trip" : "Confirm and save Trip"}>
              {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <><Feather name={selected ? "edit-3" : "save"} size={15} color="#FFFFFF" /><Text style={styles.saveText}>{selected ? "Confirm and update Trip" : "Confirm and save Trip"}</Text></>}
            </TouchableOpacity>
          </View>
        ) : null}

        {selected ? <TripItineraryOrganizer tripId={selected.id} tripTitle={selected.name} /> : null}
        {selected ? <TripFlightContext tripId={selected.id} /> : null}
        {selected ? <TripTemporaryStayManager tripId={selected.id} /> : null}

        {isLoading ? <ActivityIndicator style={styles.loading} color={colors.primary} /> : null}
        {!isLoading && itineraries.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="bookmark" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No private Trips yet</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Create one when you choose. Saving a Trip does not connect it to chat, reminders, or sharing.</Text>
            <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={beginCreate} activeOpacity={0.85}><Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>Create a private Trip</Text></TouchableOpacity>
          </View>
        ) : null}

        {itineraries.map((itin) => (
          <View key={itin.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => beginInspect(itin)} activeOpacity={0.85} accessibilityLabel={`Inspect and edit ${itin.name}`} style={styles.cardRow}>
              <View style={[styles.icon, { backgroundColor: colors.primary + "18" }]}><Feather name="map-pin" size={18} color={colors.primary} /></View>
              <View style={styles.cardText}>
                <Text style={[styles.name, { color: colors.foreground }]}>{itin.name}</Text>
                <Text style={[styles.destination, { color: colors.mutedForeground }]}>{itin.destination}</Text>
                <Text style={[styles.date, { color: colors.mutedForeground }]}>Saved {formatDate(itin.createdAt)} · Tap to inspect or edit</Text>
              </View>
              <TouchableOpacity activeOpacity={0.85} onPress={() => handleDelete(itin)} hitSlop={8} accessibilityLabel={`Delete ${itin.name}`}><Feather name="trash-2" size={16} color={colors.mutedForeground} /></TouchableOpacity>
            </TouchableOpacity>
            {itin.notes.length > 0 ? <Text style={[styles.notes, { color: colors.mutedForeground, borderTopColor: colors.border }]} numberOfLines={3}>{itin.notes}</Text> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, gap: 12 }, backBtn: { padding: 4 }, title: { fontFamily: "Inter_700Bold", fontSize: 22, flex: 1 }, newBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 }, newBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#FFFFFF" }, list: { padding: 16, gap: 14 }, privacy: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", gap: 10 }, privacyCopy: { flex: 1 }, privacyTitle: { fontFamily: "Inter_700Bold", fontSize: 14 }, privacyText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 3 }, legacy: { borderRadius: 12, borderWidth: 1, borderStyle: "dashed", padding: 12, flexDirection: "row", gap: 8 }, legacyText: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, flex: 1 }, error: { fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 19 }, form: { borderRadius: 16, borderWidth: 1, padding: 14 }, formHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }, formTitle: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 16 }, cancel: { fontFamily: "Inter_600SemiBold", fontSize: 13 }, label: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 9 }, input: { fontFamily: "Inter_400Regular", fontSize: 14, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 5 }, noteInput: { minHeight: 88 }, help: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 }, confirmRow: { flexDirection: "row", gap: 9, alignItems: "flex-start", marginTop: 14 }, checkbox: { width: 19, height: 19, borderWidth: 1.5, borderRadius: 5, alignItems: "center", justifyContent: "center", marginTop: 1 }, confirmText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, flex: 1 }, saveButton: { borderRadius: 11, paddingHorizontal: 14, paddingVertical: 12, marginTop: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }, saveText: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 13 }, disabled: { opacity: 0.5 }, loading: { marginVertical: 26 }, empty: { alignItems: "center", paddingVertical: 42, paddingHorizontal: 28, gap: 12, marginTop: 6, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed" }, emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18 }, emptyBody: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 }, emptyBtn: { marginTop: 4, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24 }, emptyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 }, card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" }, cardRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }, icon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" }, cardText: { flex: 1 }, name: { fontFamily: "Inter_600SemiBold", fontSize: 16 }, destination: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 2 }, date: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 3 }, notes: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 10, borderTopWidth: 1 }, temporaryStays: { borderRadius: 16, borderWidth: 1, padding: 14 }, temporaryStayHeading: { flexDirection: "row", alignItems: "center", gap: 8 }, temporaryStayTitle: { fontFamily: "Inter_700Bold", fontSize: 15 }, temporaryStayBody: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 8 }, temporaryStayError: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 18, marginTop: 9 }, temporaryStayLoading: { marginVertical: 14 }, temporaryStayEmpty: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 12 }, temporaryStayRow: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, paddingTop: 12, marginTop: 12 }, temporaryStayCopy: { flex: 1 }, temporaryStayLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 }, temporaryStayDates: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 3 }, linkButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9 }, linkText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#FFFFFF" }, unlinkButton: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, borderWidth: 1 }, unlinkText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
});
