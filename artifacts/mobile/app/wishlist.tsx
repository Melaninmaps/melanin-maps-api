import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, TextInput, Alert, ActivityIndicator, Modal,
  KeyboardAvoidingView, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useWishlist, type WishlistItem } from "@/hooks/useWishlist";
import { useSpaceWarnings } from "@/hooks/useSpaceWarnings";
import { Feather } from "@expo/vector-icons";

const GOLD = "#C9922B";

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Drink": "#DC2626", "Music & Live Events": "#7C3AED",
  "Culture & Art": "#0891B2", "Beauty & Wellness": "#DB2777",
  "History": "#92400E", "Nightlife": "#1D4ED8",
  "Outdoors": "#15803D", "Family-Friendly": "#F59E0B",
  "Shopping": "#9333EA", "Coffee": "#78350F",
};

function getCategoryColor(cat: string | null): string {
  if (!cat) return GOLD;
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (cat.toLowerCase().includes(key.toLowerCase().split(" ")[0])) return color;
  }
  return GOLD;
}

function groupItems(items: WishlistItem[]): Array<{ label: string; icon: "location" | "globe-outline"; items: WishlistItem[] }> {
  const map = new Map<string, WishlistItem[]>();
  for (const item of items) {
    let key: string;
    if (item.destinationType === "destination") {
      key = item.country ? `📍 ${item.country}` : item.city ? `📍 ${item.city}` : "📍 Destinations";
    } else {
      key = item.city ?? "Unknown City";
    }
    const group = map.get(key) ?? [];
    group.push(item);
    map.set(key, group);
  }
  return Array.from(map.entries()).map(([label, grpItems]) => ({
    label,
    icon: label.startsWith("📍") ? "globe-outline" : "location",
    items: grpItems,
  }));
}

function AddDestinationModal({
  visible, onClose, onSave, colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, city: string, country: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(""); setCity(""); setCountry(""); setSaving(false); };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), city.trim(), country.trim());
    reset();
    onClose();
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={modalStyles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[modalStyles.title, { color: colors.foreground }]}>Add a Destination</Text>
            <Text style={[modalStyles.sub, { color: colors.mutedForeground }]}>
              Save a city, state, region, or country you'd love to visit
            </Text>

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              Destination name <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Lagos, Accra, New Orleans, Tokyo"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              City & State <Text style={[modalStyles.optional, { color: colors.mutedForeground }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Atlanta, GA"
              placeholderTextColor={colors.mutedForeground}
              value={city}
              onChangeText={setCity}
            />

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              Country <Text style={[modalStyles.optional, { color: colors.mutedForeground }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Ghana, Nigeria, Japan, USA"
              placeholderTextColor={colors.mutedForeground}
              value={country}
              onChangeText={setCountry}
            />

            <View style={[modalStyles.hint, { backgroundColor: colors.secondary }]}>
              <Ionicons name="globe-outline" size={14} color={colors.mutedForeground} />
              <Text style={[modalStyles.hintText, { color: colors.mutedForeground }]}>
                Destinations are grouped separately from businesses in your list
              </Text>
            </View>

            <TouchableOpacity
              style={[modalStyles.saveBtn, { backgroundColor: name.trim() ? colors.primary : colors.muted }]}
              onPress={handleSave}
              disabled={!name.trim() || saving}
              activeOpacity={0.85}
            >
              <Ionicons name="bookmark" size={16} color={name.trim() ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[modalStyles.saveBtnText, { color: name.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                {saving ? "Saving…" : "Save Destination"}
              </Text>
            </TouchableOpacity>
            <View style={{ height: 16 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function WishlistCard({
  item, onDelete, onNotesSave, colors, warningCount = 0,
}: {
  item: WishlistItem;
  onDelete: (id: string) => void;
  onNotesSave: (id: string, notes: string) => void;
  colors: ReturnType<typeof useColors>;
  warningCount?: number;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(item.notes ?? "");
  const isDestination = item.destinationType === "destination";
  const catColor = isDestination ? colors.primary : getCategoryColor(item.category);

  return (
    <View style={[cardStyles.card, { backgroundColor: colors.card, borderColor: warningCount >= 3 ? "#7C2D1240" : isDestination ? colors.primary + "40" : colors.border }]}>
      {warningCount >= 3 && (
        <View style={cardStyles.warningBanner}>
          <Feather name="alert-octagon" size={12} color="#7C2D12" />
          <Text style={cardStyles.warningText}>{warningCount} community reports filed for this space</Text>
        </View>
      )}
      <View style={cardStyles.cardTop}>
        {isDestination ? (
          <View style={[cardStyles.badge, { backgroundColor: colors.primary + "18" }]}>
            <Ionicons name="globe-outline" size={11} color={colors.primary} />
            <Text style={[cardStyles.badgeText, { color: colors.primary }]}>Destination</Text>
          </View>
        ) : item.category ? (
          <View style={[cardStyles.badge, { backgroundColor: catColor + "18" }]}>
            <Text style={[cardStyles.badgeText, { color: catColor }]}>{item.category}</Text>
          </View>
        ) : null}
        {!isDestination && item.neighborhood && (
          <Text style={[cardStyles.hood, { color: colors.mutedForeground }]}>
            <Ionicons name="location-outline" size={11} /> {item.neighborhood}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={cardStyles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <Text style={[cardStyles.name, { color: colors.text }]}>{item.businessName}</Text>

      {isDestination && (item.city || item.country) && (
        <View style={cardStyles.locationRow}>
          <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
          <Text style={[cardStyles.locationText, { color: colors.mutedForeground }]}>
            {[item.city, item.country].filter(Boolean).join(" · ")}
          </Text>
        </View>
      )}

      {!isDestination && item.mustTry && (
        <View style={[cardStyles.mustTry, { backgroundColor: GOLD + "12", borderColor: GOLD + "30" }]}>
          <Ionicons name="star" size={12} color={GOLD} />
          <Text style={[cardStyles.mustTryText, { color: colors.text }]}>
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>Must try: </Text>{item.mustTry}
          </Text>
        </View>
      )}

      {item.description && (
        <Text style={[cardStyles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {editingNotes ? (
        <View style={cardStyles.notesEdit}>
          <TextInput
            style={[cardStyles.notesInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            value={notesText}
            onChangeText={setNotesText}
            placeholder="Add your notes..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            autoFocus
          />
          <View style={cardStyles.notesBtns}>
            <TouchableOpacity onPress={() => { setEditingNotes(false); setNotesText(item.notes ?? ""); }}>
              <Text style={[cardStyles.notesCancel, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cardStyles.notesSave, { backgroundColor: colors.primary }]}
              onPress={() => { onNotesSave(item.id, notesText); setEditingNotes(false); }}
            >
              <Text style={cardStyles.notesSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setEditingNotes(true)} style={cardStyles.notesRow}>
          <Ionicons name={item.notes ? "create-outline" : "add-circle-outline"} size={14} color={colors.primary} />
          <Text style={[cardStyles.notesText, { color: item.notes ? colors.text : colors.mutedForeground }]}>
            {item.notes ?? "Add notes..."}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  hood: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1 },
  deleteBtn: { padding: 2, marginLeft: "auto" },
  name: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 6 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  locationText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  mustTry: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 8, borderWidth: 1, padding: 8, marginBottom: 8 },
  mustTryText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginBottom: 8 },
  notesRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 4 },
  notesText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  notesEdit: { marginTop: 8 },
  notesInput: { borderRadius: 8, borderWidth: 1, padding: 10, fontFamily: "Inter_400Regular", fontSize: 13, minHeight: 72, textAlignVertical: "top" },
  notesBtns: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12, marginTop: 8 },
  notesCancel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  notesSave: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  notesSaveText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },
  warningBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#7C2D1215", borderColor: "#7C2D1240",
    borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 10,
  },
  warningText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#7C2D12", flex: 1 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 4 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 24 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 8 },
  optional: { fontFamily: "Inter_400Regular", fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 20 },
  hint: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, padding: 12, marginBottom: 24 },
  hintText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, flex: 1 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
});

export default function WishlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { items, isLoading, load, addItem, removeItem, updateNotes } = useWishlist();
  const { isWarned } = useSpaceWarnings();
  const [addDestModalOpen, setAddDestModalOpen] = useState(false);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert("Remove from list?", "This will be removed from your Trips I'd Love list.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => { void removeItem(id); } },
    ]);
  }, [removeItem]);

  const handleNotesSave = useCallback((id: string, notes: string) => {
    void updateNotes(id, notes);
  }, [updateNotes]);

  const handleAddDestination = useCallback(async (name: string, city: string, country: string) => {
    await addItem({
      businessName: name,
      city: city || null,
      country: country || null,
      destinationType: "destination",
    });
  }, [addItem]);

  const groups = groupItems(items);
  const businessCount = items.filter((i) => i.destinationType !== "destination").length;
  const destCount = items.filter((i) => i.destinationType === "destination").length;

  const subtitle = [
    businessCount > 0 && `${businessCount} spot${businessCount !== 1 ? "s" : ""}`,
    destCount > 0 && `${destCount} destination${destCount !== 1 ? "s" : ""}`,
  ].filter(Boolean).join(" · ") || "Nothing saved yet";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Trips I'd Love</Text>
          <Text style={styles.headerSub}>{subtitle}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setAddDestModalOpen(true)}
          style={[styles.headerBtn, { backgroundColor: "#ffffff22" }]}
        >
          <Ionicons name="globe-outline" size={15} color="#fff" />
          <Text style={styles.headerBtnText}>Add Place</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/travel" as any)}
          style={[styles.headerBtn, { backgroundColor: "#ffffff22" }]}
        >
          <Ionicons name="sparkles" size={15} color="#fff" />
          <Text style={styles.headerBtnText}>KinfolkAI</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "14" }]}>
            <Ionicons name="bookmark-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing saved yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Save businesses from KinfolkAI™ or add any city, country, or destination you'd love to visit.
          </Text>
          <View style={styles.emptyBtns}>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => setAddDestModalOpen(true)}
            >
              <Ionicons name="globe-outline" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Add a Place</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.secondary }]}
              onPress={() => router.push("/travel" as any)}
            >
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={[styles.emptyBtnText, { color: colors.primary }]}>Ask KinfolkAI™</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.label}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group }) => (
            <View>
              <View style={styles.cityHeader}>
                <Ionicons name={group.icon} size={15} color={colors.primary} />
                <Text style={[styles.cityName, { color: colors.text }]}>
                  {group.label.replace(/^📍 /, "")}
                </Text>
                <Text style={[styles.cityCount, { color: colors.mutedForeground }]}>
                  {group.items.length} {group.icon === "globe-outline" ? "destination" : "spot"}{group.items.length !== 1 ? "s" : ""}
                </Text>
              </View>
              {group.items.map((item) => (
                <WishlistCard
                  key={item.id} item={item} colors={colors}
                  onDelete={handleDelete} onNotesSave={handleNotesSave}
                  warningCount={isWarned(item.businessName, item.city ?? "")}
                />
              ))}
            </View>
          )}
          ListFooterComponent={() => (
            <TouchableOpacity
              style={[styles.addDestBtn, { borderColor: colors.primary + "40", backgroundColor: colors.primary + "08" }]}
              onPress={() => setAddDestModalOpen(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.addDestBtnText, { color: colors.primary }]}>Add a destination</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <AddDestinationModal
        visible={addDestModalOpen}
        onClose={() => setAddDestModalOpen(false)}
        onSave={handleAddDestination}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#fff" },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#ffffff99" },
  headerBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 },
  headerBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginBottom: 10, textAlign: "center" },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 28 },
  emptyBtns: { flexDirection: "row", gap: 12 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14 },
  emptyBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  cityHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, marginTop: 4 },
  cityName: { fontFamily: "Inter_700Bold", fontSize: 16, flex: 1 },
  cityCount: { fontFamily: "Inter_400Regular", fontSize: 12 },
  addDestBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderStyle: "dashed", borderRadius: 14, paddingVertical: 14, marginTop: 8 },
  addDestBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
