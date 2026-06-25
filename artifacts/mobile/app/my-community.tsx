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
  city: string;
  state: string;
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
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: "", city: "", state: "", zipCode: "", neighborhood: "" });
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
    if (!form.label.trim() || !form.city.trim() || !form.state.trim()) {
      setFormError("Label, city, and state are required.");
      return;
    }
    setSaving(true);
    try {
      const apiBase = getApiBase();
      const token = await getToken();
      const res = await fetch(`${apiBase}/api/saved-locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          label: form.label.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zipCode: form.zipCode.trim() || undefined,
          neighborhood: form.neighborhood.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = (await res.json()) as { location: SavedLocation };
      setLocations((prev) => [...prev, data.location]);
      setForm({ label: "", city: "", state: "", zipCode: "", neighborhood: "" });
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

  const myComm = locations.find((l) => l.isMyComm);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
        <View style={[styles.commCard, { backgroundColor: myComm ? "#2D7A4F12" : colors.card, borderColor: myComm ? "#2D7A4F40" : colors.border }]}>
          <View style={[styles.commIcon, { backgroundColor: myComm ? "#2D7A4F20" : colors.muted }]}>
            <Feather name="home" size={22} color={myComm ? "#2D7A4F" : colors.mutedForeground} />
          </View>
          <View style={{ flex: 1 }}>
            {myComm ? (
              <>
                <Text style={[styles.commLabel, { color: "#2D7A4F" }]}>My Community</Text>
                <Text style={[styles.commCity, { color: colors.foreground }]}>
                  {myComm.label} — {myComm.city}, {myComm.state}{myComm.zipCode ? ` ${myComm.zipCode}` : ""}
                </Text>
                <Text style={[styles.commSub, { color: colors.mutedForeground }]}>
                  You'll get notified about events here
                </Text>
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

        {/* Saved locations list */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved Locations</Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : locations.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="map-pin" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No saved locations yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Tap + to save a city, neighborhood, or ZIP code
            </Text>
          </View>
        ) : (
          locations.map((loc) => (
            <View
              key={loc.id}
              style={[styles.locCard, { backgroundColor: colors.card, borderColor: loc.isMyComm ? "#2D7A4F40" : colors.border }]}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <View style={[styles.locPin, { backgroundColor: loc.isMyComm ? "#2D7A4F18" : colors.muted }]}>
                  <Feather name="map-pin" size={16} color={loc.isMyComm ? "#2D7A4F" : colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={[styles.locLabel, { color: colors.foreground }]}>{loc.label}</Text>
                    {loc.isMyComm && (
                      <View style={styles.myCommBadge}>
                        <Text style={styles.myCommBadgeText}>MY COMMUNITY</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.locDetail, { color: colors.mutedForeground }]}>
                    {[loc.neighborhood, loc.city, loc.state, loc.zipCode].filter(Boolean).join(", ")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(loc.id, loc.label)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <View style={[styles.locActions, { borderTopColor: colors.border }]}>
                {loc.isMyComm ? (
                  <TouchableOpacity style={styles.locActionBtn} onPress={() => handleUnset(loc.id)}>
                    <Feather name="x-circle" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.locActionText, { color: colors.mutedForeground }]}>Unset</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.locActionBtn} onPress={() => handleSetMyComm(loc.id)}>
                    <Feather name="home" size={14} color="#2D7A4F" />
                    <Text style={[styles.locActionText, { color: "#2D7A4F" }]}>Set as My Community</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.locActionBtn}
                  onPress={() => router.push({ pathname: "/spaces", params: { q: loc.city } } as any)}
                >
                  <Feather name="search" size={14} color={colors.primary} />
                  <Text style={[styles.locActionText, { color: colors.primary }]}>Browse spaces here</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Location Modal */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowAdd(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Save a Location</Text>
              <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                Give it a name and fill in the location details
              </Text>

              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Label <Text style={{ color: "#DC2626" }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder={'e.g. "Home", "ATL neighborhood", "Dad\'s area"'}
                placeholderTextColor={colors.mutedForeground}
                value={form.label}
                onChangeText={(v) => setForm((f) => ({ ...f, label: v }))}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    City <Text style={{ color: "#DC2626" }}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="Atlanta"
                    placeholderTextColor={colors.mutedForeground}
                    value={form.city}
                    onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                  />
                </View>
                <View style={{ width: 70 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    State <Text style={{ color: "#DC2626" }}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="GA"
                    placeholderTextColor={colors.mutedForeground}
                    value={form.state}
                    onChangeText={(v) => setForm((f) => ({ ...f, state: v }))}
                    autoCapitalize="characters"
                    maxLength={2}
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Neighborhood</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="e.g. West End"
                    placeholderTextColor={colors.mutedForeground}
                    value={form.neighborhood}
                    onChangeText={(v) => setForm((f) => ({ ...f, neighborhood: v }))}
                  />
                </View>
                <View style={{ width: 100 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>ZIP Code</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="30310"
                    placeholderTextColor={colors.mutedForeground}
                    value={form.zipCode}
                    onChangeText={(v) => setForm((f) => ({ ...f, zipCode: v }))}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              </View>

              {formError ? (
                <Text style={[styles.errorText, { color: "#DC2626" }]}>{formError}</Text>
              ) : null}

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
                onPress={handleAdd}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color="#FBF7F0" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Location</Text>
                )}
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
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 16, marginTop: 20 },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FBF7F0" },
});
