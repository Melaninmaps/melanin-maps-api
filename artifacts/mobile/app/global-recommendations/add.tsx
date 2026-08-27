import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
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

const RECOMMENDATION_TYPES = [
  { id: "restaurant", label: "Restaurant", icon: "🍽️" },
  { id: "cafe", label: "Café", icon: "☕" },
  { id: "hotel", label: "Hotel", icon: "🏨" },
  { id: "salon", label: "Salon / Barber", icon: "✂️" },
  { id: "market", label: "Market / Shop", icon: "🛍️" },
  { id: "attraction", label: "Attraction", icon: "🎭" },
  { id: "guide", label: "Tour Guide", icon: "🗺️" },
  { id: "healthcare", label: "Healthcare", icon: "🏥" },
  { id: "transportation", label: "Transportation", icon: "🚌" },
  { id: "other", label: "Other", icon: "📍" },
];

const POPULAR_COMMUNITIES = [
  { flag: "🇯🇲", label: "Jamaica" },
  { flag: "🇬🇭", label: "Ghana" },
  { flag: "🇳🇬", label: "Nigeria" },
  { flag: "🇲🇽", label: "Mexico" },
  { flag: "🇵🇷", label: "Puerto Rico" },
  { flag: "🇧🇷", label: "Brazil" },
  { flag: "🇰🇪", label: "Kenya" },
  { flag: "🇹🇹", label: "Trinidad" },
  { flag: "🇸🇳", label: "Senegal" },
  { flag: "🇭🇹", label: "Haiti" },
  { flag: "🇨🇴", label: "Colombia" },
  { flag: "🇮🇳", label: "India" },
  { flag: "🇰🇷", label: "Korea" },
  { flag: "🇵🇭", label: "Philippines" },
  { flag: "🇿🇦", label: "South Africa" },
  { flag: "🇧🇧", label: "Barbados" },
];

const BADGE_LABELS: Record<string, string> = {
  local_insider: "Local Insider",
  community_ambassador: "Community Ambassador",
  global_guide: "Global Guide",
};

export default function AddGlobalRecommendation() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ prompt?: string }>();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [socialMedia, setSocialMedia] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [reason, setReason] = useState("");
  const [personalConnection, setPersonalConnection] = useState("");
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState<string | null>(null);

  const toggleCommunity = (label: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelectedCommunities((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  const handleSubmit = async () => {
    if (!country.trim()) { Alert.alert("Required", "Please enter a country."); return; }
    if (!businessName.trim()) { Alert.alert("Required", "Please enter a business name."); return; }
    if (!selectedType) { Alert.alert("Required", "Please select a recommendation type."); return; }

    setLoading(true);
    try {
      const token = await getToken();
      const base = getApiBase();
      const res = await fetch(`${base}/api/global-recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          country: country.trim(),
          city: city.trim() || undefined,
          businessName: businessName.trim(),
          website: website.trim() || undefined,
          socialMedia: socialMedia.trim() || undefined,
          type: selectedType,
          reason: reason.trim() || undefined,
          personalConnection: personalConnection.trim() || undefined,
          communities: selectedCommunities,
        }),
      });
      const data = await res.json() as { badge?: string; message?: string; error?: string };
      if (res.ok) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEarnedBadge(data.badge ?? null);
        setSubmitted(true);
      } else {
        Alert.alert("Error", data.error ?? "Could not submit. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const c = colors;

  if (submitted) {
    return (
      <View style={[styles.root, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/business-owner" as never)}>
            <Feather name="arrow-left" size={22} color={c.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Recommendation Sent</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: c.primary + "18" }]}>
            <Text style={{ fontSize: 40 }}>🌍</Text>
          </View>
          <Text style={[styles.successTitle, { color: c.foreground }]}>Thank you for sharing!</Text>
          <Text style={[styles.successSub, { color: c.mutedForeground }]}>
            Your recommendation is under review. Once approved, it will help travelers discover this place with confidence.
          </Text>
          {earnedBadge && (
            <View style={[styles.badgePill, { backgroundColor: c.primary + "15", borderColor: c.primary + "40" }]}>
              <Feather name="award" size={14} color={c.primary} />
              <Text style={[styles.badgeTxt, { color: c.primary }]}>
                You&apos;ve earned: {BADGE_LABELS[earnedBadge] ?? earnedBadge}
              </Text>
            </View>
          )}
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.addAnother, { backgroundColor: c.primary }]}
            onPress={() => {
              setSubmitted(false);
              setCountry(""); setCity(""); setBusinessName(""); setWebsite("");
              setSocialMedia(""); setSelectedType(""); setReason("");
              setPersonalConnection(""); setSelectedCommunities([]);
            }}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addAnotherTxt}>Add Another Recommendation</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.canGoBack() ? router.back() : router.replace("/business-owner" as never)}>
            <Text style={[styles.doneTxt, { color: c.mutedForeground }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: c.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/business-owner" as never)}>
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Share a Place</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro */}
        <View style={[styles.introBanner, { backgroundColor: c.primary + "12", borderColor: c.primary + "28" }]}>
          <Text style={{ fontSize: 24 }}>🌍</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.introTitle, { color: c.foreground }]}>Help Travelers Discover Places You Trust</Text>
            <Text style={[styles.introSub, { color: c.mutedForeground }]}>
              Recommend a business or experience outside the US that the community should know about.
            </Text>
          </View>
        </View>

        {/* Location */}
        <Text style={[styles.section, { color: c.mutedForeground }]}>LOCATION</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.inputWrap}>
            <Feather name="globe" size={16} color={c.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: c.foreground }]}
              placeholder="Country *"
              placeholderTextColor={c.mutedForeground}
              value={country}
              onChangeText={setCountry}
              autoCapitalize="words"
            />
          </View>
          <View style={[styles.sep, { backgroundColor: c.border }]} />
          <View style={styles.inputWrap}>
            <Feather name="map-pin" size={16} color={c.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: c.foreground }]}
              placeholder="City (optional)"
              placeholderTextColor={c.mutedForeground}
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Business Info */}
        <Text style={[styles.section, { color: c.mutedForeground }]}>BUSINESS DETAILS</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.inputWrap}>
            <Feather name="briefcase" size={16} color={c.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: c.foreground }]}
              placeholder="Business name *"
              placeholderTextColor={c.mutedForeground}
              value={businessName}
              onChangeText={setBusinessName}
              autoCapitalize="words"
            />
          </View>
          <View style={[styles.sep, { backgroundColor: c.border }]} />
          <View style={styles.inputWrap}>
            <Feather name="link" size={16} color={c.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: c.foreground }]}
              placeholder="Website (optional)"
              placeholderTextColor={c.mutedForeground}
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
          <View style={[styles.sep, { backgroundColor: c.border }]} />
          <View style={styles.inputWrap}>
            <Feather name="instagram" size={16} color={c.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: c.foreground }]}
              placeholder="Social media handle (optional)"
              placeholderTextColor={c.mutedForeground}
              value={socialMedia}
              onChangeText={setSocialMedia}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Type */}
        <Text style={[styles.section, { color: c.mutedForeground }]}>TYPE OF PLACE *</Text>
        <View style={styles.typeGrid}>
          {RECOMMENDATION_TYPES.map((t) => {
            const active = selectedType === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.typeChip, {
                  backgroundColor: active ? c.primary : c.card,
                  borderColor: active ? c.primary : c.border,
                }]}
                onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setSelectedType(t.id); }}
                activeOpacity={0.8}
              >
                <Text style={styles.typeEmoji}>{t.icon}</Text>
                <Text style={[styles.typeLabel, { color: active ? "#fff" : c.foreground }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Why */}
        <Text style={[styles.section, { color: c.mutedForeground }]}>YOUR STORY</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <TextInput
            style={[styles.textArea, { color: c.foreground }]}
            placeholder="Why do you recommend it? What makes it special? (optional)"
            placeholderTextColor={c.mutedForeground}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <View style={[styles.sep, { backgroundColor: c.border }]} />
          <TextInput
            style={[styles.textArea, { color: c.foreground }]}
            placeholder="Your personal connection — e.g. 'I grew up in this neighborhood' (optional)"
            placeholderTextColor={c.mutedForeground}
            value={personalConnection}
            onChangeText={setPersonalConnection}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        {/* Communities */}
        <Text style={[styles.section, { color: c.mutedForeground }]}>COMMUNITIES YOU KNOW</Text>
        <Text style={[styles.sectionSub, { color: c.mutedForeground }]}>
          Which communities or cultures do you feel connected to? Select all that apply.
        </Text>
        <View style={styles.communityGrid}>
          {POPULAR_COMMUNITIES.map((com) => {
            const active = selectedCommunities.includes(com.label);
            return (
              <TouchableOpacity
                key={com.label}
                style={[styles.communityChip, {
                  backgroundColor: active ? c.primary + "18" : c.card,
                  borderColor: active ? c.primary : c.border,
                }]}
                onPress={() => toggleCommunity(com.label)}
                activeOpacity={0.8}
              >
                <Text style={styles.communityFlag}>{com.flag}</Text>
                <Text style={[styles.communityLabel, { color: active ? c.primary : c.foreground }]}>{com.label}</Text>
                {active && <Feather name="check" size={12} color={c.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submit, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="send" size={16} color="#fff" />
              <Text style={styles.submitTxt}>Submit Recommendation</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: c.mutedForeground }]}>
          All recommendations are reviewed before appearing publicly. You&apos;ll earn a contributor badge once your first recommendation is approved.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20 },
  introBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24,
  },
  introTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 4, lineHeight: 21 },
  introSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  section: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8 },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginBottom: 10, marginTop: -4 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 24 },
  inputWrap: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  inputIcon: { width: 20 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  textArea: { padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, minHeight: 72 },
  sep: { height: 1 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  typeChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 50, borderWidth: 1.5,
  },
  typeEmoji: { fontSize: 15 },
  typeLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  communityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  communityChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 50, borderWidth: 1.5,
  },
  communityFlag: { fontSize: 16 },
  communityLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  submit: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 17, borderRadius: 16, marginBottom: 12,
  },
  submitTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  disclaimer: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, textAlign: "center", marginBottom: 8 },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 },
  successIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, textAlign: "center" },
  badgePill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 50, borderWidth: 1,
  },
  badgeTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  addAnother: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 8,
  },
  addAnotherTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  doneTxt: { fontSize: 14, fontFamily: "Inter_500Medium", paddingVertical: 8 },
});
