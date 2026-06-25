import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, TextInput, Alert, ActivityIndicator,
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

function groupByCity(items: WishlistItem[]): Array<{ city: string; items: WishlistItem[] }> {
  const map = new Map<string, WishlistItem[]>();
  for (const item of items) {
    const key = item.city ?? "Unknown City";
    const group = map.get(key) ?? [];
    group.push(item);
    map.set(key, group);
  }
  return Array.from(map.entries()).map(([city, items]) => ({ city, items }));
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
  const catColor = getCategoryColor(item.category);

  return (
    <View style={[cardStyles.card, { backgroundColor: colors.card, borderColor: warningCount >= 3 ? "#7C2D1240" : colors.border }]}>
      {warningCount >= 3 && (
        <View style={cardStyles.warningBanner}>
          <Feather name="alert-octagon" size={12} color="#7C2D12" />
          <Text style={cardStyles.warningText}>{warningCount} community reports filed for this space</Text>
        </View>
      )}
      <View style={cardStyles.cardTop}>
        {item.category && (
          <View style={[cardStyles.badge, { backgroundColor: catColor + "18" }]}>
            <Text style={[cardStyles.badgeText, { color: catColor }]}>{item.category}</Text>
          </View>
        )}
        {item.neighborhood && (
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

      {item.mustTry && (
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
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  hood: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1 },
  deleteBtn: { padding: 2 },
  name: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 8 },
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

export default function WishlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { items, isLoading, load, removeItem, updateNotes } = useWishlist();
  const { isWarned } = useSpaceWarnings();

  useEffect(() => { void load(); }, [load]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert("Remove from wishlist?", "This spot will be removed from your Trips I'd Love list.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => { void removeItem(id); } },
    ]);
  }, [removeItem]);

  const handleNotesSave = useCallback((id: string, notes: string) => {
    void updateNotes(id, notes);
  }, [updateNotes]);

  const groups = groupByCity(items);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Trips I'd Love</Text>
          <Text style={styles.headerSub}>{items.length} spot{items.length !== 1 ? "s" : ""} saved</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/travel" as any)}
          style={[styles.kinfolkBtn, { backgroundColor: "#ffffff22" }]}
        >
          <Ionicons name="sparkles" size={15} color="#fff" />
          <Text style={styles.kinfolkBtnText}>KinfolkAI</Text>
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
            When KinfolkAI recommends a spot you'd love to visit, tap the bookmark icon to save it here.
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/travel" as any)}
          >
            <Ionicons name="sparkles" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>Ask KinfolkAI™</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.city}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group }) => (
            <View>
              <View style={styles.cityHeader}>
                <Ionicons name="location" size={15} color={colors.primary} />
                <Text style={[styles.cityName, { color: colors.text }]}>{group.city}</Text>
                <Text style={[styles.cityCount, { color: colors.mutedForeground }]}>
                  {group.items.length} spot{group.items.length !== 1 ? "s" : ""}
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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingBottom: 14 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#fff" },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#ffffff99" },
  kinfolkBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  kinfolkBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginBottom: 10, textAlign: "center" },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 28 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  cityHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, marginTop: 4 },
  cityName: { fontFamily: "Inter_700Bold", fontSize: 16, flex: 1 },
  cityCount: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
