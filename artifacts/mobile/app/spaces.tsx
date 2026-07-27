import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSpaces, type CreateSpacePayload } from "@/hooks/useSpaces";

const SPACE_TYPES = [
  { id: "rent", label: "For Rent", icon: "home" as const, color: "#2D7A4F" },
  { id: "sale", label: "For Sale", icon: "trending-up" as const, color: "#7C3AED" },
  { id: "business", label: "Business Space", icon: "briefcase" as const, color: "#C9922B" },
  { id: "residential", label: "Residential", icon: "heart" as const, color: "#3B82F6" },
];

function TypeBadge({ type, color }: { type: string; color?: string }) {
  const found = SPACE_TYPES.find((t) => t.id === type);
  const label = found?.label ?? type;
  const bg = (color ?? found?.color ?? "#6B7280") + "18";
  const fg = color ?? found?.color ?? "#6B7280";
  return (
    <View style={[badgeStyles.wrap, { backgroundColor: bg }]}>
      <Text style={[badgeStyles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  text: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
});

export default function SpacesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const { spaces, isLoading, refresh, createSpace } = useSpaces({
    q: search.trim() || undefined,
    spaceType: activeType ?? undefined,
  });

  const [form, setForm] = useState<CreateSpacePayload>({
    title: "",
    city: "",
    spaceType: "rent",
    state: "",
    neighborhood: "",
    address: "",
    description: "",
    priceLabel: "",
    listingUrl: "",
    agentName: "",
    agentPhone: "",
    agentEmail: "",
    agentUrl: "",
  });

  const handleCreate = async () => {
    setCreateError("");
    if (!form.title.trim()) { setCreateError("Title is required"); return; }
    if (!form.city.trim()) { setCreateError("City is required"); return; }
    setCreating(true);
    try {
      await createSpace({
        ...form,
        title: form.title.trim(),
        city: form.city.trim(),
        description: form.description?.trim() || undefined,
        neighborhood: form.neighborhood?.trim() || undefined,
        address: form.address?.trim() || undefined,
        state: form.state?.trim() || undefined,
        priceLabel: form.priceLabel?.trim() || undefined,
        listingUrl: form.listingUrl?.trim() || undefined,
        agentName: form.agentName?.trim() || undefined,
        agentPhone: form.agentPhone?.trim() || undefined,
        agentEmail: form.agentEmail?.trim() || undefined,
        agentUrl: form.agentUrl?.trim() || undefined,
      });
      setShowCreate(false);
      setForm({ title: "", city: "", spaceType: "rent" });
    } catch {
      setCreateError("Failed to post listing. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Community Spaces</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Spaces for rent, sale & business — shared by the community
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={18} color="#FBF7F0" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search city, neighborhood, or keyword…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity activeOpacity={0.85} onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Type filters */}
        <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          <View style={styles.typeRow}>
            <TouchableOpacity activeOpacity={0.85}
              style={[styles.typeChip, { borderColor: !activeType ? colors.primary : colors.border, backgroundColor: !activeType ? colors.primary + "18" : colors.card }]}
              onPress={() => setActiveType(null)}
            >
              <Text style={[styles.typeChipText, { color: !activeType ? colors.primary : colors.mutedForeground }]}>All Types</Text>
            </TouchableOpacity>
            {SPACE_TYPES.map((t) => (
              <TouchableOpacity activeOpacity={0.85}
                key={t.id}
                style={[styles.typeChip, { borderColor: activeType === t.id ? t.color : colors.border, backgroundColor: activeType === t.id ? t.color + "18" : colors.card }]}
                onPress={() => setActiveType(activeType === t.id ? null : t.id)}
              >
                <Feather name={t.icon} size={12} color={activeType === t.id ? t.color : colors.mutedForeground} />
                <Text style={[styles.typeChipText, { color: activeType === t.id ? t.color : colors.mutedForeground }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Listings */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : spaces.length === 0 ? (
        <View style={styles.center}>
          <Feather name="home" size={40} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No spaces found</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Know of a great space? Be the first to share it with the community.
          </Text>
          <TouchableOpacity activeOpacity={0.85} style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(true)}>
            <Text style={styles.emptyBtnText}>Post a Space</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
        keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
        >
          {spaces.map((space) => (
            <TouchableOpacity
              key={space.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/space/[id]", params: { id: space.id } })}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <TypeBadge type={space.spaceType} />
                {space.priceLabel && (
                  <Text style={[styles.price, { color: colors.foreground }]}>{space.priceLabel}</Text>
                )}
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{space.title}</Text>
              <View style={styles.cardLocation}>
                <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                <Text style={[styles.cardLocationText, { color: colors.mutedForeground }]}>
                  {[space.neighborhood, space.city, space.state].filter(Boolean).join(", ")}
                </Text>
              </View>
              {space.description ? (
                <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{space.description}</Text>
              ) : null}
              {space.sqft ? (
                <Text style={[styles.cardSqft, { color: colors.mutedForeground }]}>{space.sqft.toLocaleString()} sqft</Text>
              ) : null}
              <View style={styles.cardFooter}>
                {space.agentName ? (
                  <View style={styles.agentRow}>
                    <Feather name="user" size={11} color={colors.primary} />
                    <Text style={[styles.agentName, { color: colors.primary }]}>{space.agentName}</Text>
                  </View>
                ) : (
                  <Text style={[styles.postedBy, { color: colors.mutedForeground }]}>Shared by {space.postedByName ?? "Community"}</Text>
                )}
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Create Listing Modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowCreate(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Share a Space</Text>
              <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                Tell the community about a great space in a safe neighborhood
              </Text>

              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Space Type</Text>
              <View style={styles.typeRow}>
                {SPACE_TYPES.map((t) => (
                  <TouchableOpacity activeOpacity={0.85}
                    key={t.id}
                    style={[styles.typeChip, { flex: 1, borderColor: form.spaceType === t.id ? t.color : colors.border, backgroundColor: form.spaceType === t.id ? t.color + "18" : colors.card }]}
                    onPress={() => setForm((f) => ({ ...f, spaceType: t.id }))}
                  >
                    <Feather name={t.icon} size={12} color={form.spaceType === t.id ? t.color : colors.mutedForeground} />
                    <Text style={[styles.typeChipText, { color: form.spaceType === t.id ? t.color : colors.mutedForeground }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Title <Text style={{ color: "#DC2626" }}>*</Text></Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="e.g. Charming storefront in Sweet Auburn" placeholderTextColor={colors.mutedForeground} value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>City <Text style={{ color: "#DC2626" }}>*</Text></Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="Atlanta" placeholderTextColor={colors.mutedForeground} value={form.city} onChangeText={(v) => setForm((f) => ({ ...f, city: v }))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>State</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="GA" placeholderTextColor={colors.mutedForeground} value={form.state ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, state: v }))} autoCapitalize="characters" maxLength={2} />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Neighborhood</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="e.g. Sweet Auburn" placeholderTextColor={colors.mutedForeground} value={form.neighborhood ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, neighborhood: v }))} />
                </View>
                <View style={{ width: 90 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>ZIP Code</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="30314" placeholderTextColor={colors.mutedForeground} value={form.zipCode ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, zipCode: v }))} keyboardType="number-pad" maxLength={5} />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Address</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="Street address (optional)" placeholderTextColor={colors.mutedForeground} value={form.address ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} />

              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Price</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="e.g. $2,500/mo or From $450k" placeholderTextColor={colors.mutedForeground} value={form.priceLabel ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, priceLabel: v }))} />

              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Description</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, minHeight: 80, textAlignVertical: "top" }]} placeholder="What makes this a great space? Safe neighborhood? Good foot traffic? Parking?" placeholderTextColor={colors.mutedForeground} value={form.description ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} multiline numberOfLines={3} />

              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Listing URL</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="https://zillow.com/… or loopnet.com/…" placeholderTextColor={colors.mutedForeground} value={form.listingUrl ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, listingUrl: v }))} autoCapitalize="none" keyboardType="url" />

              <View style={[styles.agentSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.agentHeader}>
                  <Feather name="user-check" size={15} color={colors.primary} />
                  <Text style={[styles.agentSectionTitle, { color: colors.foreground }]}>Realtor / Agent Contact</Text>
                  <Text style={[styles.optionalTag, { color: colors.mutedForeground }]}>optional</Text>
                </View>
                <Text style={[styles.agentSectionSub, { color: colors.mutedForeground }]}>
                  Know the agent? Add their info so buyers can reach out directly.
                </Text>
                <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 8 }]} placeholder="Agent name" placeholderTextColor={colors.mutedForeground} value={form.agentName ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, agentName: v }))} />
                <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} placeholder="Phone number" placeholderTextColor={colors.mutedForeground} value={form.agentPhone ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, agentPhone: v }))} keyboardType="phone-pad" />
                <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} placeholder="Email address" placeholderTextColor={colors.mutedForeground} value={form.agentEmail ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, agentEmail: v }))} autoCapitalize="none" keyboardType="email-address" />
                <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginBottom: 0 }]} placeholder="Agent website" placeholderTextColor={colors.mutedForeground} value={form.agentUrl ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, agentUrl: v }))} autoCapitalize="none" keyboardType="url" />
              </View>

              {createError ? (
                <Text style={[styles.errorText, { color: "#DC2626" }]}>{createError}</Text>
              ) : null}

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: creating ? 0.6 : 1 }]}
                onPress={handleCreate}
                disabled={creating}
                activeOpacity={0.85}
              >
                {creating ? <ActivityIndicator color="#FBF7F0" size="small" /> : <Text style={styles.submitBtnText}>Post Listing</Text>}
              </TouchableOpacity>
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", marginLeft: 10 },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  typeRow: { flexDirection: "row", gap: 8, paddingBottom: 2 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  typeChipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  list: { padding: 16, gap: 14 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price: { fontFamily: "Inter_700Bold", fontSize: 15 },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, lineHeight: 21 },
  cardLocation: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardLocationText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  cardDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  cardSqft: { fontFamily: "Inter_400Regular", fontSize: 12 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  agentRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  agentName: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  postedBy: { fontFamily: "Inter_400Regular", fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FBF7F0" },
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "92%" },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 4 },
  sheetSub: { fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 24 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 6 },
  input: { borderRadius: 10, borderWidth: 1, padding: 12, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 14 },
  agentSection: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 20, gap: 4 },
  agentHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  agentSectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  optionalTag: { fontFamily: "Inter_400Regular", fontSize: 11 },
  agentSectionSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 12 },
  submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FBF7F0" },
});
