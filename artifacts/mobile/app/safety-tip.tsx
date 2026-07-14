import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

const BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN ?? "localhost"}/api`;

const CATEGORIES = [
  { id: "violence", label: "Act of Violence", emoji: "⚠️" },
  { id: "harassment", label: "Harassment", emoji: "🚨" },
  { id: "discrimination", label: "Discrimination", emoji: "🚫" },
  { id: "theft", label: "Theft / Robbery", emoji: "💰" },
  { id: "hate_crime", label: "Hate Crime", emoji: "🛑" },
  { id: "other", label: "Other Safety Concern", emoji: "📍" },
] as const;

type CategoryId = typeof CATEGORIES[number]["id"];

export default function SafetyTipScreen() {
  const colors = useColors();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const [category, setCategory] = useState<CategoryId>("violence");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [locating, setLocating] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void autoLocate();
  }, []);

  async function autoLocate() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      if (geo) {
        if (geo.city) setCity(geo.city);
        if (geo.street && geo.streetNumber) setAddress(`${geo.streetNumber} ${geo.street}`);
      }
    } catch {
      // ignore
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit() {
    if (!description.trim()) {
      Alert.alert("Required", "Please describe the incident.");
      return;
    }
    if (!city.trim()) {
      Alert.alert("Required", "Please enter a city.");
      return;
    }
    if (lat === null || lng === null) {
      Alert.alert("Location Needed", "We need your location to pin this tip. Tap 'Use My Location' to try again.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${BASE}/safety-tips`, {
        method: "POST",
        headers,
        body: JSON.stringify({ businessName: businessName.trim() || undefined, address: address.trim() || undefined, city: city.trim(), lat, lng, description: description.trim(), category }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        Alert.alert("Error", j.error ?? "Failed to submit tip.");
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Tip Submitted ✓",
        "Thank you for keeping the community safe. Verified members within 10 miles have been alerted and can confirm your report.",
        [{ text: "Done", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Error", "Could not submit tip. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: top + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Submit Safety Tip</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={[styles.scroll, { paddingBottom: bottom + 32 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Info banner */}
          <View style={[styles.banner, { backgroundColor: "#DC26261A", borderColor: "#DC262640" }]}>
            <Feather name="alert-triangle" size={16} color="#DC2626" />
            <Text style={styles.bannerText}>
              Use this to report acts of violence, hate crimes, or harassment against community members at businesses that are <Text style={{ fontFamily: "Inter_700Bold" }}>not</Text> on this platform. The business is not notified — instead, verified members nearby will be alerted to confirm.
            </Text>
          </View>

          {/* Category */}
          <Text style={[styles.label, { color: colors.foreground }]}>Incident Type</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catChip, { borderColor: category === c.id ? "#DC2626" : colors.border, backgroundColor: category === c.id ? "#DC26261A" : colors.card }]}
                onPress={() => { Haptics.selectionAsync(); setCategory(c.id); }}
                activeOpacity={0.75}
              >
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <Text style={[styles.catLabel, { color: category === c.id ? "#DC2626" : colors.foreground }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Business name */}
          <Text style={[styles.label, { color: colors.foreground }]}>Business Name <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. Joe's Corner Store"
            placeholderTextColor={colors.mutedForeground}
            value={businessName}
            onChangeText={setBusinessName}
          />

          {/* Location */}
          <Text style={[styles.label, { color: colors.foreground }]}>Location</Text>
          <TouchableOpacity style={[styles.locRow, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={autoLocate} activeOpacity={0.8}>
            <Feather name={locating ? "loader" : "map-pin"} size={16} color="#CA922B" />
            <Text style={[styles.locText, { color: lat !== null ? colors.foreground : colors.mutedForeground }]}>
              {locating ? "Detecting location…" : lat !== null ? `${lat.toFixed(4)}, ${lng?.toFixed(4)} — detected` : "Tap to use my current location"}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 8 }]}
            placeholder="Street address (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 8 }]}
            placeholder="City *"
            placeholderTextColor={colors.mutedForeground}
            value={city}
            onChangeText={setCity}
          />

          {/* Description */}
          <Text style={[styles.label, { color: colors.foreground }]}>What happened? <Text style={[styles.optional, { color: "#DC2626" }]}>*</Text></Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Describe the incident. Include any details that would help community members confirm it…"
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* Disclaimer */}
          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            Your tip is anonymous to the business. False reports violate our community guidelines and may result in account suspension. Only submit what you witnessed or can confirm.
          </Text>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { opacity: submitting ? 0.6 : 1 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="send" size={16} color="#fff" />
                <Text style={styles.submitText}>Submit Safety Tip</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  scroll: { padding: 16, gap: 4 },
  banner: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 20, alignItems: "flex-start" },
  bannerText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#DC2626", lineHeight: 19 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 16, marginBottom: 6 },
  optional: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9CA3AF" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { height: 46, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 10, height: 46, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14 },
  locText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  textarea: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingTop: 12, fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 120 },
  disclaimer: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 14 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#DC2626", borderRadius: 12, height: 52, marginTop: 24 },
  submitText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
