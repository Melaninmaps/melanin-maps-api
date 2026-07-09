import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getApiBaseUrl } from "@/lib/auth";

const TOTAL_STEPS = 4;

const INTERESTS = [
  { id: "food", label: "Food & Dining", icon: "🍜" },
  { id: "arts", label: "Arts & Culture", icon: "🎨" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "entrepreneurship", label: "Entrepreneurship", icon: "💼" },
  { id: "music", label: "Music & Entertainment", icon: "🎵" },
  { id: "wellness", label: "Wellness & Fitness", icon: "🏋️" },
  { id: "fashion", label: "Fashion & Style", icon: "👗" },
  { id: "tech", label: "Tech & Innovation", icon: "💻" },
  { id: "spirituality", label: "Spirituality", icon: "🙏" },
  { id: "sports", label: "Sports & Outdoors", icon: "🏀" },
  { id: "community", label: "Community Service", icon: "🤝" },
  { id: "family", label: "Family & Parenting", icon: "👨‍👩‍👧" },
];

export default function ProfileSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [homeCity, setHomeCity] = useState("");
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [isContentCreator, setIsContentCreator] = useState(false);
  const [isCommunityOrganizer, setIsCommunityOrganizer] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [allowDm, setAllowDm] = useState(true);
  const [showCity, setShowCity] = useState(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const toggleInterest = (id: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNext = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else void handleFinish();
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBaseUrl();
      await fetch(`${base}/api/auth/user/setup`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          homeCity: homeCity.trim() || null,
          isBusinessOwner,
          isContentCreator,
          isCommunityOrganizer,
          allowDm,
          showCity,
          profileSetupComplete: true,
        }),
      });
    } catch {
      // Non-fatal — proceed to app regardless
    } finally {
      await AsyncStorage.setItem("@mapping_with_melanin_onboarding_complete", "true");
      await AsyncStorage.setItem("@mwm_profile_setup_complete", "true");
      setLoading(false);
      router.replace("/(tabs)");
    }
  };

  const skip = async () => {
    await AsyncStorage.setItem("@mapping_with_melanin_onboarding_complete", "true");
    await AsyncStorage.setItem("@mwm_profile_setup_complete", "true");
    router.replace("/(tabs)");
  };

  const c = colors;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => (step > 1 ? setStep((s) => s - 1) : router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ marginRight: 8 }}
          >
            <Feather name="arrow-left" size={22} color={c.foreground} />
          </TouchableOpacity>
          <View style={styles.progressDots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i < step ? c.primary : c.border,
                    width: i + 1 === step ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={skip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[styles.skipTxt, { color: c.mutedForeground }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Step label */}
        <Text style={[styles.stepLabel, { color: c.primary }]}>Step {step} of {TOTAL_STEPS}</Text>

        {/* ─── STEP 1: Home City ─── */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: c.foreground }]}>Where do you call home?</Text>
            <Text style={[styles.stepSub, { color: c.mutedForeground }]}>
              We'll use this to surface local businesses, events, and community intel near you.
            </Text>
            <View style={[styles.inputRow, { backgroundColor: c.card, borderColor: c.border }]}>
              <Feather name="map-pin" size={18} color={c.mutedForeground} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.input, { color: c.foreground }]}
                placeholder="City, State or City, Country"
                placeholderTextColor={c.mutedForeground}
                value={homeCity}
                onChangeText={setHomeCity}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleNext}
              />
            </View>
            <Text style={[styles.hint, { color: c.mutedForeground }]}>
              You can update this anytime from your profile settings.
            </Text>
          </View>
        )}

        {/* ─── STEP 2: Roles ─── */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: c.foreground }]}>What describes you?</Text>
            <Text style={[styles.stepSub, { color: c.mutedForeground }]}>
              Select all that apply. This helps us tailor your experience.
            </Text>
            <View style={styles.roleCards}>
              {[
                {
                  key: "biz",
                  icon: "briefcase",
                  label: "Business Owner",
                  sub: "Manage and promote your business on the platform",
                  val: isBusinessOwner,
                  set: setIsBusinessOwner,
                },
                {
                  key: "creator",
                  icon: "video",
                  label: "Content Creator",
                  sub: "Share reviews, videos, and travel content with the community",
                  val: isContentCreator,
                  set: setIsContentCreator,
                },
                {
                  key: "organizer",
                  icon: "users",
                  label: "Community Organizer",
                  sub: "Host events, lead groups, and build local connections",
                  val: isCommunityOrganizer,
                  set: setIsCommunityOrganizer,
                },
              ].map((role) => (
                <TouchableOpacity
                  key={role.key}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: role.val ? c.primary + "12" : c.card,
                      borderColor: role.val ? c.primary : c.border,
                    },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    role.set(!role.val);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleIconWrap, { backgroundColor: role.val ? c.primary + "20" : c.secondary }]}>
                    <Feather name={role.icon as any} size={22} color={role.val ? c.primary : c.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleLabel, { color: c.foreground }]}>{role.label}</Text>
                    <Text style={[styles.roleSub, { color: c.mutedForeground }]}>{role.sub}</Text>
                  </View>
                  <View
                    style={[
                      styles.roleCheck,
                      { backgroundColor: role.val ? c.primary : "transparent", borderColor: role.val ? c.primary : c.border },
                    ]}
                  >
                    {role.val && <Feather name="check" size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ─── STEP 3: Interests ─── */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: c.foreground }]}>What are you into?</Text>
            <Text style={[styles.stepSub, { color: c.mutedForeground }]}>
              Choose your interests to get personalized recommendations from KinfolkAI.
            </Text>
            <View style={styles.chipGrid}>
              {INTERESTS.map((item) => {
                const selected = selectedInterests.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? c.primary : c.card,
                        borderColor: selected ? c.primary : c.border,
                      },
                    ]}
                    onPress={() => toggleInterest(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chipIcon}>{item.icon}</Text>
                    <Text style={[styles.chipLabel, { color: selected ? c.primaryForeground : c.foreground }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.hint, { color: c.mutedForeground }]}>
              {selectedInterests.size === 0 ? "Tap any to select — you can pick multiple." : `${selectedInterests.size} selected`}
            </Text>
          </View>
        )}

        {/* ─── STEP 4: Privacy ─── */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: c.foreground }]}>Your privacy, your choice.</Text>
            <Text style={[styles.stepSub, { color: c.mutedForeground }]}>
              Control how others see you on the platform. You can change these anytime in Settings.
            </Text>
            <View style={styles.privacyCards}>
              {[
                {
                  icon: "globe" as const,
                  label: "Public Profile",
                  sub: "Other members can find and view your profile",
                  val: showCity,
                  set: setShowCity,
                },
                {
                  icon: "message-circle" as const,
                  label: "Allow Direct Messages",
                  sub: "Let other members send you messages",
                  val: allowDm,
                  set: setAllowDm,
                },
              ].map((item, i) => (
                <View
                  key={i}
                  style={[styles.privacyCard, { backgroundColor: c.card, borderColor: c.border }]}
                >
                  <View style={[styles.privacyIconWrap, { backgroundColor: c.secondary }]}>
                    <Feather name={item.icon} size={20} color={c.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.privacyLabel, { color: c.foreground }]}>{item.label}</Text>
                    <Text style={[styles.privacySub, { color: c.mutedForeground }]}>{item.sub}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      { backgroundColor: item.val ? c.primary : c.border },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                      item.set(!item.val);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.toggleThumb, { transform: [{ translateX: item.val ? 20 : 2 }] }]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={[styles.infoBox, { backgroundColor: c.secondary, borderColor: c.border }]}>
              <Feather name="shield" size={14} color={c.mutedForeground} />
              <Text style={[styles.infoTxt, { color: c.mutedForeground }]}>
                Your personal data is never sold. We use your preferences only to improve your experience on this platform.
              </Text>
            </View>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleNext}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.ctaTxt}>{step < TOTAL_STEPS ? "Continue" : "Let's Go!"}</Text>
              <Feather name={step < TOTAL_STEPS ? "arrow-right" : "check"} size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  progressDots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  skipTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
  stepLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 },
  stepContent: { marginBottom: 32 },
  stepTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 10, lineHeight: 34 },
  stepSub: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 23, marginBottom: 24 },
  inputRow: {
    flexDirection: "row", alignItems: "center", borderWidth: 1,
    borderRadius: 14, paddingHorizontal: 16, height: 54, marginBottom: 10,
  },
  input: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  hint: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  roleCards: { gap: 12 },
  roleCard: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 16,
    borderRadius: 14, borderWidth: 1.5,
  },
  roleIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  roleLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  roleSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  roleCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  chip: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 50, borderWidth: 1.5 },
  chipIcon: { fontSize: 16 },
  chipLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  privacyCards: { gap: 12, marginBottom: 20 },
  privacyCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, borderWidth: 1 },
  privacyIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  privacyLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  privacySub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: "center" },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  infoBox: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  infoTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  cta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 17, borderRadius: 14, marginTop: 4,
  },
  ctaTxt: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
});
