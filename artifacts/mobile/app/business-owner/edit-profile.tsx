import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
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

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

const CATEGORIES = [
  "Food & Beverage",
  "Shopping & Retail",
  "Beauty & Personal Care",
  "Health & Wellness",
  "Professional Services",
  "Home Services",
  "Automotive",
  "Real Estate & Housing",
  "Technology",
  "Creative Services",
  "Events & Entertainment",
  "Travel & Hospitality",
  "Family & Education",
  "Pet Services",
  "Community & Nonprofit",
];

const HOURS_OPTIONS = [
  "Mon–Fri 9am–5pm",
  "Mon–Fri 9am–9pm",
  "Mon–Sat 10am–8pm",
  "Mon–Sun 10am–10pm",
  "Mon–Sun 8am–6pm",
  "By Appointment",
  "Custom",
];

type FormState = {
  name: string;
  category: string;
  description: string;
  phone: string;
  website: string;
  hours: string;
};

export default function EditBusinessProfile() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "", category: "", description: "", phone: "", website: "", hours: "",
  });
  const [original, setOriginal] = useState<FormState | null>(null);

  const update = (key: keyof FormState) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/businesses/mine`, { headers });
      if (res.ok) {
        const data = await res.json() as { business: FormState & { id: string } | null };
        if (data.business) {
          const f: FormState = {
            name: data.business.name ?? "",
            category: data.business.category ?? "",
            description: data.business.description ?? "",
            phone: data.business.phone ?? "",
            website: data.business.website ?? "",
            hours: data.business.hours ?? "",
          };
          setForm(f);
          setOriginal(f);
        }
      }
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const isDirty = original !== null && JSON.stringify(form) !== JSON.stringify(original);

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("Business name required", "Please enter your business name.");
      return;
    }
    if (!form.category) {
      Alert.alert("Category required", "Please select a business category.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/businesses/mine/profile`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          description: form.description.trim(),
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          hours: form.hours.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOriginal({ ...form });
      Alert.alert("Changes saved!", "Your business profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Save failed", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/business-owner" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Business Profile</Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: isDirty ? colors.primary : colors.secondary, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving || !isDirty}
        >
          <Text style={[styles.saveBtnTxt, { color: isDirty ? "#FFF" : colors.mutedForeground }]}>
            {saving ? "Saving…" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Business Name */}
        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: colors.foreground }]}>Business Name <Text style={{ color: "#DC2626" }}>*</Text></Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Your business name"
            placeholderTextColor={colors.mutedForeground}
            value={form.name}
            onChangeText={update("name")}
            autoCapitalize="words"
          />
        </View>

        {/* Category */}
        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: colors.foreground }]}>Business Category <Text style={{ color: "#DC2626" }}>*</Text></Text>
          <Text style={[styles.groupHelper, { color: colors.mutedForeground }]}>
            This is how your business is classified and discovered on the map.
          </Text>
          <TouchableOpacity
            style={[styles.selectBtn, { backgroundColor: colors.card, borderColor: form.category ? colors.primary : colors.border }]}
            onPress={() => { setShowCategories(v => !v); setShowHours(false); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.selectBtnTxt, { color: form.category ? colors.foreground : colors.mutedForeground }]}>
              {form.category || "Select a category"}
            </Text>
            <Feather name={showCategories ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          {showCategories && (
            <View style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.pickerOption,
                    form.category === cat && { backgroundColor: colors.primary + "18" },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    update("category")(cat);
                    setShowCategories(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerOptionTxt, { color: form.category === cat ? colors.primary : colors.foreground, fontFamily: form.category === cat ? "Inter_700Bold" : "Inter_400Regular" }]}>
                    {cat}
                  </Text>
                  {form.category === cat && <Feather name="check" size={14} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: colors.foreground }]}>About Your Business</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Describe what makes your business special — products, services, story, community focus…"
            placeholderTextColor={colors.mutedForeground}
            value={form.description}
            onChangeText={(t) => t.length <= 500 && update("description")(t)}
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{form.description.length}/500</Text>
        </View>

        {/* Phone */}
        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: colors.foreground }]}>Phone Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="+1 (404) 555-0100"
            placeholderTextColor={colors.mutedForeground}
            value={form.phone}
            onChangeText={update("phone")}
            keyboardType="phone-pad"
          />
        </View>

        {/* Website */}
        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: colors.foreground }]}>Website</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="https://yourbusiness.com"
            placeholderTextColor={colors.mutedForeground}
            value={form.website}
            onChangeText={update("website")}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        {/* Hours */}
        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: colors.foreground }]}>Business Hours</Text>
          <TouchableOpacity
            style={[styles.selectBtn, { backgroundColor: colors.card, borderColor: form.hours ? colors.primary : colors.border }]}
            onPress={() => { setShowHours(v => !v); setShowCategories(false); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.selectBtnTxt, { color: form.hours ? colors.foreground : colors.mutedForeground }]}>
              {form.hours || "Select hours"}
            </Text>
            <Feather name={showHours ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          {showHours && (
            <View style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {HOURS_OPTIONS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.pickerOption, form.hours === h && { backgroundColor: colors.primary + "18" }]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    update("hours")(h);
                    setShowHours(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerOptionTxt, { color: form.hours === h ? colors.primary : colors.foreground, fontFamily: form.hours === h ? "Inter_700Bold" : "Inter_400Regular" }]}>
                    {h}
                  </Text>
                  {form.hours === h && <Feather name="check" size={14} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {form.hours === "Custom" && (
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 8 }]}
              placeholder="e.g. Tue–Sun 11am–9pm, Closed Mon"
              placeholderTextColor={colors.mutedForeground}
              value={form.hours === "Custom" ? "" : form.hours}
              onChangeText={update("hours")}
            />
          )}
        </View>

        {/* Save footer */}
        <TouchableOpacity
          style={[styles.saveFooterBtn, { backgroundColor: isDirty ? colors.primary : colors.secondary, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving || !isDirty}
          activeOpacity={0.85}
        >
          <Feather name="check" size={16} color={isDirty ? "#FFF" : colors.mutedForeground} />
          <Text style={[styles.saveFooterTxt, { color: isDirty ? "#FFF" : colors.mutedForeground }]}>
            {saving ? "Saving changes…" : isDirty ? "Save Changes" : "No changes to save"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 12 },
  backBtn: { width: 38, height: 38, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold" },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 16, gap: 20 },
  group: { gap: 6 },
  groupLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  groupHelper: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 100 },
  charCount: { fontSize: 11, textAlign: "right", fontFamily: "Inter_400Regular" },
  selectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  selectBtnTxt: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  picker: { borderWidth: 1, borderRadius: 12, overflow: "hidden", marginTop: 4 },
  pickerOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 },
  pickerOptionTxt: { fontSize: 14, flex: 1 },
  saveFooterBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  saveFooterTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
