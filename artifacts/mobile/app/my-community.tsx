import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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

const AUTH_TOKEN_KEY = "auth_session_token";

interface SavedLocation {
  id: string;
  label: string;
  locationType: string;
  city: string | null;
  state: string | null;
  industry: string | null;
  zipCode: string | null;
  neighborhood: string | null;
  isMyComm: boolean;
  createdAt: string;
}

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}
async function getToken() {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); }
  catch { return null; }
}

export default function MyCommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addType, setAddType] = useState<"geographic" | "professional">("geographic");
  const [form, setForm] = useState({ label: "", city: "", state: "", zipCode: "", neighborhood: "", industry: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const apiBase = getApiBase();
    const token = await getToken();
    if (!apiBase || !token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/saved-locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { locations: SavedLocation[] };
        setLocations(data.locations);
      }
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    setFormError(null);
    if (!form.label.trim()) { setFormError("Label is required."); return; }
    if (addType === "professional" && !form.industry.trim()) {
      setFormError("Please select an industry."); return;
    }
    if (addType === "geographic" && (!form.city.trim() || !form.state.trim())) {
      setFormError("City and state are required."); return;
    }
    setSaving(true);
    try {
      const apiBase = getApiBase();
      const token = await getToken();
      const body = addType === "professional"
        ? { label: form.label.trim(), locationType: "professional", industry: form.industry.trim() }
        : { label: form.label.trim(), city: form.city.trim(), state: form.state.trim(), zipCode: form.zipCode.trim() || undefined, neighborhood: form.neighborhood.trim() || undefined };
      const res = await fetch(`${apiBase}/api/saved-locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = (await res.json()) as { location: SavedLocation };
      setLocations((prev) => [...prev, data.location]);
      setForm({ label: "", city: "", state: "", zipCode: "", neighborhood: "", industry: "" });
      setShowAdd(false);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setFormError("Could not save location. Please try again.");
    } finally { setSaving(false); }
  };

  const handleSetMyComm = async (id: string) => {
    const apiBase = getApiBase();
    const token = await getToken();
    if (!apiBase || !token) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(`${apiBase}/api/saved-locations/${id}/set-my-community`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setLocations((prev) => prev.map((l) => ({ ...l, isMyComm: l.id === id })));
      }
    } catch {}
  };

  const handleUnset = async (id: string) => {
    const apiBase = getApiBase();
    const token = await getToken();
    if (!apiBase || !token) return;
    try {
      await fetch(`${apiBase}/api/saved-locations/${id}/unset-my-community`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations((prev) => prev.map((l) => ({ ...l, isMyComm: l.id === id ? false : l.isMyComm })));
    } catch {}
  };

  const handleDelete = (id: string, label: string) => {
    Alert.alert("Remove Location", `Remove "${label}" from your saved locations?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          const apiBase = getApiBase();
          const token = await getToken();
          if (!apiBase || !token) return;
          await fetch(`${apiBase}/api/saved-locations/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          setLocations((prev) => prev.filter((l) => l.id !== id));
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Community</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Save locations & get local event alerts</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAdd(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={18} color="#FBF7F0" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* My Community callout */}
        {(() => {
          const geoMyComm = locations.find((l) => l.isMyComm && l.locationType !== "professional");
          return (
            <View style={[styles.commCard, { backgroundColor: geoMyComm ? "#2D7A4F12" : colors.card, borderColor: geoMyComm ? "#2D7A4F40" : colors.border }]}>
              <View style={[styles.commIcon, { backgroundColor: geoMyComm ? "#2D7A4F20" : colors.muted }]}>
                <Feather name="home" size={22} color={geoMyComm ? "#2D7A4F" : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                {geoMyComm ? (
                  <>
                    <Text style={[styles.commLabel, { color: "#2D7A4F" }]}>My Community</Text>
                    <Text style={[styles.commCity, { color: colors.foreground }]}>
                      {geoMyComm.label} — {geoMyComm.city}, {geoMyComm.state}{geoMyComm.zipCode ? ` ${geoMyComm.zipCode}` : ""}
                    </Text>
                    <Text style={[styles.commSub, { color: colors.mutedForeground }]}>You'll get notified about events here</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.commLabel, { color: colors.mutedForeground }]}>No community set</Text>
                    <Text style={[styles.commSub, { color: colors.mutedForeground }]}>
                      Save a location and tap "Set as My Community" to get local event notifications.
                    </Text>
                  </>
                )}
              </View>
            </View>
          );
        })()}

        {/* Saved locations list */}
        {(() => {
          const geoLocs = locations.filter((l) => l.locationType !== "professional");
          const profLocs = locations.filter((l) => l.locationType === "professional");
          return (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved Locations</Text>
              {isLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
              ) : geoLocs.length === 0 ? (
                <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="map-pin" size={28} color={colors.mutedForeground} />
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No saved locations yet</Text>
                  <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Tap + to save a city, neighborhood, or ZIP code</Text>
                </View>
              ) : geoLocs.map((loc) => (
                <View key={loc.id} style={[styles.locCard, { backgroundColor: colors.card, borderColor: loc.isMyComm ? "#2D7A4F40" : colors.border }]}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                    <View style={[styles.locPin, { backgroundColor: loc.isMyComm ? "#2D7A4F18" : colors.muted }]}>
                      <Feather name="map-pin" size={16} color={loc.isMyComm ? "#2D7A4F" : colors.mutedForeground} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={[styles.locLabel, { color: colors.foreground }]}>{loc.label}</Text>
                        {loc.isMyComm && <View style={styles.myCommBadge}><Text style={styles.myCommBadgeText}>MY COMMUNITY</Text></View>}
                      </View>
                      <Text style={[styles.locDetail, { color: colors.mutedForeground }]}>
                        {[loc.neighborhood, loc.city, loc.state, loc.zipCode].filter(Boolean).join(", ")}
                      </Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => handleDelete(loc.id, loc.label)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.locActions, { borderTopColor: colors.border }]}>
                    {loc.isMyComm ? (
                      <TouchableOpacity activeOpacity={0.85} style={styles.locActionBtn} onPress={() => handleUnset(loc.id)}>
                        <Feather name="x-circle" size={14} color={colors.mutedForeground} />
                        <Text style={[styles.locActionText, { color: colors.mutedForeground }]}>Unset</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity activeOpacity={0.85} style={styles.locActionBtn} onPress={() => handleSetMyComm(loc.id)}>
                        <Feather name="home" size={14} color="#2D7A4F" />
                        <Text style={[styles.locActionText, { color: "#2D7A4F" }]}>Set as My Community</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity activeOpacity={0.85} style={styles.locActionBtn} onPress={() => router.push({ pathname: "/spaces", params: { q: loc.city ?? "" } } as any)}>
                      <Feather name="search" size={14} color={colors.primary} />
                      <Text style={[styles.locActionText, { color: colors.primary }]}>Browse spaces here</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {profLocs.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Professional Communities</Text>
                  {profLocs.map((loc) => (
                    <View key={loc.id} style={[styles.locCard, { backgroundColor: colors.card, borderColor: "#1D4ED840" }]}>
                      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                        <View style={[styles.locPin, { backgroundColor: "#1D4ED818" }]}>
                          <Feather name="briefcase" size={16} color="#1D4ED8" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.locLabel, { color: colors.foreground }]}>{loc.label}</Text>
                          <Text style={[styles.locDetail, { color: colors.mutedForeground }]}>{loc.industry}</Text>
                        </View>
                        <TouchableOpacity activeOpacity={0.85} onPress={() => handleDelete(loc.id, loc.label)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                        </TouchableOpacity>
                      </View>
                      <View style={[styles.locActions, { borderTopColor: colors.border }]}>
                          <TouchableOpacity activeOpacity={0.85} style={[styles.locActionBtn, { flex: 1 }]} onPress={() => router.push({ pathname: "/mentorship", params: { industry: loc.industry ?? "" } } as any)}>
                          <Feather name="users" size={14} color="#1D4ED8" />
                          <Text style={[styles.locActionText, { color: "#1D4ED8" }]}>Browse mentors</Text>
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.85} style={[styles.locActionBtn, { flex: 1 }]} onPress={() => router.push("/spaces" as any)}>
                          <Feather name="search" size={14} color={colors.primary} />
                          <Text style={[styles.locActionText, { color: colors.primary }]}>Find spaces</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          );
        })()}
      </ScrollView>

      {/* Add Location Modal */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => { setShowAdd(false); setAddType("geographic"); setForm({ label: "", city: "", state: "", zipCode: "", neighborhood: "", industry: "" }); setFormError(null); }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => { setShowAdd(false); setAddType("geographic"); setForm({ label: "", city: "", state: "", zipCode: "", neighborhood: "", industry: "" }); setFormError(null); }} />
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add a Community</Text>
              <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                Save a place or join your professional industry network
              </Text>

              {/* Type toggle */}
              <View style={[styles.typeToggle, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                {(["geographic", "professional"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeTab, addType === t && { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => { setAddType(t); setFormError(null); }}
                    activeOpacity={0.8}
                  >
                    <Feather name={t === "geographic" ? "map-pin" : "briefcase"} size={13} color={addType === t ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.typeTabText, { color: addType === t ? colors.foreground : colors.mutedForeground }]}>
                      {t === "geographic" ? "Location" : "Profession"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Label <Text style={{ color: "#DC2626" }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder={addType === "professional" ? 'e.g. "My Tech Network"' : 'e.g. "Home", "ATL neighborhood"'}
                placeholderTextColor={colors.mutedForeground}
                value={form.label}
                onChangeText={(v) => setForm((f) => ({ ...f, label: v }))}
              />

              {addType === "professional" ? (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Industry <Text style={{ color: "#DC2626" }}>*</Text>
                  </Text>
                  <View style={[styles.industryGrid]}>
                    {[
                      "Technology & Software","Healthcare & Wellness","Finance & Banking","Real Estate",
                      "Food & Beverage","Beauty & Grooming","Fashion & Retail","Entertainment & Media",
                      "Education & Training","Legal & Consulting","Construction & Trades","Arts & Culture",
                      "Nonprofit & Advocacy","Sports & Fitness","Travel & Hospitality","Marketing & PR",
                      "Music & Events","Other",
                    ].map((ind) => (
                      <TouchableOpacity
                        key={ind}
                        style={[styles.industryChip, { borderColor: form.industry === ind ? "#1D4ED8" : colors.border, backgroundColor: form.industry === ind ? "#1D4ED812" : colors.card }]}
                        onPress={() => setForm((f) => ({ ...f, industry: ind }))}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.industryChipText, { color: form.industry === ind ? "#1D4ED8" : colors.foreground }]}>{ind}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>City <Text style={{ color: "#DC2626" }}>*</Text></Text>
                      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="Atlanta" placeholderTextColor={colors.mutedForeground} value={form.city} onChangeText={(v) => setForm((f) => ({ ...f, city: v }))} />
                    </View>
                    <View style={{ width: 70 }}>
                      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>State <Text style={{ color: "#DC2626" }}>*</Text></Text>
                      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="GA" placeholderTextColor={colors.mutedForeground} value={form.state} onChangeText={(v) => setForm((f) => ({ ...f, state: v }))} autoCapitalize="characters" maxLength={2} />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Neighborhood</Text>
                      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="e.g. West End" placeholderTextColor={colors.mutedForeground} value={form.neighborhood} onChangeText={(v) => setForm((f) => ({ ...f, neighborhood: v }))} />
                    </View>
                    <View style={{ width: 100 }}>
                      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>ZIP Code</Text>
                      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder="30310" placeholderTextColor={colors.mutedForeground} value={form.zipCode} onChangeText={(v) => setForm((f) => ({ ...f, zipCode: v }))} keyboardType="number-pad" maxLength={5} />
                    </View>
                  </View>
                </>
              )}

              {formError ? <Text style={[styles.errorText, { color: "#DC2626" }]}>{formError}</Text> : null}

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]} onPress={handleAdd} disabled={saving} activeOpacity={0.85}>
                {saving ? <ActivityIndicator color="#FBF7F0" size="small" /> : <Text style={styles.submitBtnText}>Save</Text>}
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
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 16, gap: 16 },
  commCard: { flexDirection: "row", alignItems: "flex-start", gap: 14, borderWidth: 1.5, borderRadius: 16, padding: 16 },
  commIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  commLabel: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" },
  commCity: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginTop: 2 },
  commSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 3, lineHeight: 17 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 4 },
  empty: { borderWidth: 1, borderRadius: 16, padding: 32, alignItems: "center", gap: 10 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 19 },
  locCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  locPin: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  locLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  locDetail: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  myCommBadge: { backgroundColor: "#2D7A4F", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  myCommBadgeText: { fontFamily: "Inter_700Bold", fontSize: 9, color: "#FFF", letterSpacing: 0.5 },
  locActions: { flexDirection: "row", gap: 8, borderTopWidth: 1, paddingTop: 10 },
  locActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 6 },
  locActionText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "85%", minHeight: 400 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 4 },
  sheetSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 20, lineHeight: 19 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 8 },
  typeToggle: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 3, marginBottom: 4, gap: 2 },
  typeTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: "transparent" },
  typeTabText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  industryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  industryChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  industryChipText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 16, marginTop: 20 },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FBF7F0" },
});
