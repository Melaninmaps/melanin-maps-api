import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { CATEGORY_GROUPS, getCategoryGroup } from "@/constants/categories";

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
  subcategory: string;
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
    name: "", category: "", subcategory: "", description: "", phone: "", website: "", hours: "",
  });
  const [original, setOriginal] = useState<FormState | null>(null);

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const update = (key: keyof FormState) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/businesses/mine`, { headers });
      if (res.ok) {
        const data = await res.json() as { business: (FormState & { id: string; imageUrl?: string; photos?: string[] }) | null };
        if (data.business) {
          const f: FormState = {
            name: data.business.name ?? "",
            category: data.business.category ?? "",
            subcategory: data.business.subcategory ?? "",
            description: data.business.description ?? "",
            phone: data.business.phone ?? "",
            website: data.business.website ?? "",
            hours: data.business.hours ?? "",
          };
          setForm(f);
          setOriginal(f);
          setBusinessId(data.business.id);
          setPhotos(data.business.photos ?? []);
          setCoverUrl(data.business.imageUrl ?? null);
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
          subcategory: form.subcategory || form.category,
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

  const handleAddPhoto = async () => {
    if ((Platform.OS as string) === "web") {
      Alert.alert("Not supported", "Photo upload is available on the mobile app.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photo library to upload business photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled || !result.assets.length) return;

    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("photo", {
        uri: asset.uri,
        type: asset.mimeType ?? "image/jpeg",
        name: "photo.jpg",
      } as unknown as Blob);

      const res = await fetch(`${getApiBase()}/api/businesses/mine/photos`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Upload failed");
      }
      const data = await res.json() as { url: string; photos: string[]; imageUrl: string };
      setPhotos(data.photos);
      setCoverUrl(data.imageUrl);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSetCover = async (url: string) => {
    if (url === coverUrl) return;
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/businesses/mine/photos/cover`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("Failed");
      setCoverUrl(url);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert("Error", "Could not set cover photo.");
    }
  };

  const handleDeletePhoto = (url: string) => {
    Alert.alert(
      "Remove photo",
      "Are you sure you want to remove this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              const headers: Record<string, string> = { "Content-Type": "application/json" };
              if (token) headers["Authorization"] = `Bearer ${token}`;
              const res = await fetch(`${getApiBase()}/api/businesses/mine/photos`, {
                method: "DELETE",
                headers,
                body: JSON.stringify({ url }),
              });
              if (!res.ok) throw new Error("Failed");
              const data = await res.json() as { photos: string[]; imageUrl: string | null };
              setPhotos(data.photos);
              setCoverUrl(data.imageUrl);
            } catch {
              Alert.alert("Error", "Could not remove photo.");
            }
          },
        },
      ]
    );
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
        {/* Photos */}
        <View style={styles.group}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={[styles.groupLabel, { color: colors.foreground }]}>Business Photos</Text>
              <Text style={[styles.groupHelper, { color: colors.mutedForeground }]}>
                Tap a photo to set it as your cover image. Long press to remove.
              </Text>
            </View>
            <Text style={[{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {photos.length}/10
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 10 }}>
            {photos.map((url) => {
              const isCover = url === coverUrl;
              return (
                <TouchableOpacity
                  key={url}
                  onPress={() => handleSetCover(url)}
                  onLongPress={() => handleDeletePhoto(url)}
                  activeOpacity={0.8}
                  style={[styles.photoThumb, { borderColor: isCover ? colors.primary : colors.border, borderWidth: isCover ? 2.5 : 1 }]}
                >
                  <Image source={{ uri: url }} style={styles.photoThumbImg} />
                  {isCover && (
                    <View style={[styles.coverBadge, { backgroundColor: colors.primary }]}>
                      <Feather name="star" size={10} color="#fff" />
                      <Text style={styles.coverBadgeTxt}>Cover</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {photos.length < 10 && (
              <TouchableOpacity
                onPress={handleAddPhoto}
                disabled={uploadingPhoto}
                style={[styles.addPhotoBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                activeOpacity={0.75}
              >
                {uploadingPhoto
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <>
                      <Feather name="plus" size={22} color={colors.primary} />
                      <Text style={[styles.addPhotoTxt, { color: colors.primary }]}>Add</Text>
                    </>
                }
              </TouchableOpacity>
            )}
          </ScrollView>

          {photos.length === 0 && !uploadingPhoto && (
            <TouchableOpacity
              onPress={handleAddPhoto}
              style={[styles.emptyPhotos, { borderColor: colors.border, backgroundColor: colors.card }]}
              activeOpacity={0.8}
            >
              <Feather name="camera" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyPhotosTxt, { color: colors.foreground }]}>Add your first photo</Text>
              <Text style={[styles.emptyPhotosHelper, { color: colors.mutedForeground }]}>
                Great photos help customers find and trust your business
              </Text>
            </TouchableOpacity>
          )}
        </View>

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
              {form.category ? `${CATEGORY_GROUPS.find(g => g.name === form.category)?.emoji ?? ""} ${form.category}` : "Select a category"}
            </Text>
            <Feather name={showCategories ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          {showCategories && (
            <View style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {CATEGORY_GROUPS.map((group) => (
                <TouchableOpacity
                  key={group.name}
                  style={[
                    styles.pickerOption,
                    form.category === group.name && { backgroundColor: colors.primary + "18" },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    update("category")(group.name);
                    setShowCategories(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 16 }}>{group.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerOptionTxt, { color: form.category === group.name ? colors.primary : colors.foreground, fontFamily: form.category === group.name ? "Inter_700Bold" : "Inter_400Regular" }]}>
                        {group.name}
                      </Text>
                      {!group.liveAtLaunch && (
                        <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>Coming soon</Text>
                      )}
                    </View>
                  </View>
                  {form.category === group.name && <Feather name="check" size={14} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {form.category && (
            <View style={{ marginTop: 10, gap: 6 }}>
              <Text style={[styles.groupHelper, { color: colors.mutedForeground }]}>Subcategory (optional)</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {(getCategoryGroup(form.category)?.subcategories ?? []).map((sub) => {
                  const isSubSelected = form.subcategory === sub.name;
                  return (
                    <TouchableOpacity
                      key={sub.name}
                      onPress={() => {
                        if (Platform.OS !== "web") Haptics.selectionAsync();
                        update("subcategory")(isSubSelected ? "" : sub.name);
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        borderWidth: 1,
                        backgroundColor: isSubSelected ? colors.primary + "15" : colors.background,
                        borderColor: isSubSelected ? colors.primary : colors.border,
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 12, fontFamily: isSubSelected ? "Inter_600SemiBold" : "Inter_400Regular", color: isSubSelected ? colors.primary : colors.foreground }}>
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
  photoThumb: { width: 90, height: 90, borderRadius: 12, overflow: "hidden", position: "relative" },
  photoThumbImg: { width: "100%", height: "100%" },
  coverBadge: { position: "absolute", bottom: 4, left: 4, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  coverBadgeTxt: { fontSize: 9, color: "#fff", fontFamily: "Inter_700Bold" },
  addPhotoBtn: { width: 90, height: 90, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4 },
  addPhotoTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  emptyPhotos: { borderWidth: 1.5, borderStyle: "dashed", borderRadius: 14, padding: 28, alignItems: "center", gap: 8, marginTop: 4 },
  emptyPhotosTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptyPhotosHelper: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
});
