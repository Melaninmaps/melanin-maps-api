import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

const CATEGORIES = [
  { id: "restaurant", icon: "coffee" as const, label: "Restaurant / Café", color: "#C9922B" },
  { id: "store", icon: "shopping-bag" as const, label: "Retail Store", color: "#3B82F6" },
  { id: "venue", icon: "music" as const, label: "Venue / Club", color: "#8B5CF6" },
  { id: "entertainment", icon: "film" as const, label: "Entertainment", color: "#EC4899" },
  { id: "hotel", icon: "home" as const, label: "Hotel / Stay", color: "#14B8A6" },
  { id: "other", icon: "map-pin" as const, label: "Other", color: "#6B7280" },
];

const CONCERN_TYPES = [
  { id: "racial_profiling", label: "Racial Profiling", icon: "eye" as const },
  { id: "hostile_staff", label: "Hostile Staff", icon: "user-x" as const },
  { id: "unsafe_environment", label: "Unsafe Environment", icon: "alert-triangle" as const },
  { id: "discrimination", label: "Discrimination", icon: "flag" as const },
  { id: "price_gouging", label: "Price Gouging", icon: "dollar-sign" as const },
  { id: "other", label: "Other", icon: "more-horizontal" as const },
];

interface ReportForm {
  spaceName: string;
  address: string;
  city: string;
  category: string;
  concernTypes: string[];
  description: string;
  isAnonymous: boolean;
}

const INITIAL: ReportForm = {
  spaceName: "",
  address: "",
  city: "",
  category: "",
  concernTypes: [],
  description: "",
  isAnonymous: true,
};

function Toggle({ label, sub, value, onToggle, colors }: {
  label: string; sub?: string; value: boolean; onToggle: () => void; colors: any;
}) {
  return (
    <TouchableOpacity
      style={[toggleS.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => { Haptics.selectionAsync(); onToggle(); }}
      activeOpacity={0.8}
    >
      <View style={{ flex: 1 }}>
        <Text style={[toggleS.label, { color: colors.foreground }]}>{label}</Text>
        {sub && <Text style={[toggleS.sub, { color: colors.mutedForeground }]}>{sub}</Text>}
      </View>
      <View style={[toggleS.track, { backgroundColor: value ? colors.primary : colors.muted }]}>
        <View style={[toggleS.thumb, { transform: [{ translateX: value ? 20 : 2 }] }]} />
      </View>
    </TouchableOpacity>
  );
}

const toggleS = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderRadius: 12, borderWidth: 1.5, marginBottom: 14,
  },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  track: { width: 44, height: 26, borderRadius: 13, justifyContent: "center" },
  thumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFF",
    position: "absolute",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
});

export default function ReportSpaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ReportForm>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleUseLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { Alert.alert("Location Access", "Enable location in Settings to use this feature."); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      if (geo) {
        const addr = [geo.streetNumber, geo.street].filter(Boolean).join(" ");
        setForm((f) => ({ ...f, address: addr, city: geo.city ?? f.city }));
      }
    } catch { Alert.alert("Location Error", "Could not get your location. Try again."); }
    finally { setLocating(false); }
  };

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const selectedCategory = CATEGORIES.find((c) => c.id === form.category);

  const animateTo = (next: number, dir: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: dir * -28, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(dir * 28);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  };

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateTo(step + 1, 1);
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) animateTo(step - 1, -1);
    else router.back();
  };

  const toggleConcern = (id: string) => {
    Haptics.selectionAsync();
    setForm((f) => ({
      ...f,
      concernTypes: f.concernTypes.includes(id)
        ? f.concernTypes.filter((c) => c !== id)
        : [...f.concernTypes, id],
    }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${API_BASE}/api/space-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          spaceName: form.spaceName.trim(),
          address: form.address.trim() || undefined,
          city: form.city.trim(),
          category: form.category,
          concernTypes: form.concernTypes,
          description: form.description.trim(),
          isAnonymous: form.isAnonymous,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Server error ${res.status}`);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Submission Failed", `${msg}\n\nPlease try again.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed1 = form.category !== "";
  const canProceed2 = form.concernTypes.length > 0;
  const canProceed3 = form.spaceName.trim().length > 0 && form.city.trim().length > 0 && form.description.trim().length >= 10;

  const canProceed = step === 1 ? canProceed1 : step === 2 ? canProceed2 : canProceed3;

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <View style={{ width: 22 }} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Report Submitted</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView contentContainerStyle={[styles.successWrap, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.successIcon, { backgroundColor: "#DC262615" }]}>
            <Feather name="alert-octagon" size={48} color="#DC2626" />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Thank You for Speaking Up</Text>
          <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
            Your report on <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{form.spaceName}</Text> has been submitted{form.isAnonymous ? " anonymously" : ""}.{"\n\n"}
            Our team reviews every report. Once a space receives <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>3 or more reports</Text>, a community warning is shown to other users.
          </Text>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Report Summary</Text>
            {[
              { icon: "map-pin" as const, label: "Space", value: form.spaceName },
              { icon: "navigation" as const, label: "Location", value: form.address ? `${form.address}, ${form.city}` : form.city },
              { icon: "tag" as const, label: "Category", value: CATEGORIES.find((c) => c.id === form.category)?.label ?? form.category },
              { icon: "flag" as const, label: "Concerns", value: form.concernTypes.map((id) => CONCERN_TYPES.find((c) => c.id === id)?.label ?? id).join(", ") },
            ].map((row) => (
              <View key={row.label} style={styles.summaryRow}>
                <Feather name={row.icon} size={14} color={colors.primary} />
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <Text style={[styles.summaryValue, { color: colors.foreground }]} numberOfLines={2}>{row.value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(tabs)")}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Back to Discover</Text>
            <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setForm(INITIAL); setSubmitted(false); setStep(1); }} activeOpacity={0.7}>
            <Text style={[styles.anotherLink, { color: colors.primary }]}>Submit another report</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={goBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Report a Space</Text>
          <Text style={[styles.headerStep, { color: colors.mutedForeground }]}>Step {step} of 3</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <View style={[styles.progressWrap, { backgroundColor: colors.background }]}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${(step / 3) * 100}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {step === 1 && (
              <View>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>What type of space is it?</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  Select the category that best describes the space you're reporting.
                </Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => {
                    const selected = form.category === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.catCard, {
                          backgroundColor: selected ? cat.color + "18" : colors.card,
                          borderColor: selected ? cat.color : colors.border,
                        }]}
                        onPress={() => { Haptics.selectionAsync(); setForm((f) => ({ ...f, category: cat.id })); }}
                        activeOpacity={0.82}
                      >
                        <View style={[styles.catIconWrap, { backgroundColor: cat.color + "22" }]}>
                          <Feather name={cat.icon} size={22} color={cat.color} />
                        </View>
                        <Text style={[styles.catLabel, { color: colors.foreground }]}>{cat.label}</Text>
                        {selected && (
                          <View style={[styles.catCheck, { backgroundColor: cat.color }]}>
                            <Feather name="check" size={10} color="#FFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>What are your concerns?</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  Select all that apply — you can choose more than one.
                </Text>
                <View style={styles.concernList}>
                  {CONCERN_TYPES.map((concern) => {
                    const selected = form.concernTypes.includes(concern.id);
                    return (
                      <TouchableOpacity
                        key={concern.id}
                        style={[styles.concernRow, {
                          backgroundColor: selected ? "#DC262612" : colors.card,
                          borderColor: selected ? "#DC2626" : colors.border,
                        }]}
                        onPress={() => toggleConcern(concern.id)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.concernIconWrap, { backgroundColor: selected ? "#DC262620" : colors.muted }]}>
                          <Feather name={concern.icon} size={18} color={selected ? "#DC2626" : colors.mutedForeground} />
                        </View>
                        <Text style={[styles.concernLabel, { color: colors.foreground }]}>{concern.label}</Text>
                        <View style={[styles.concernCheck, {
                          backgroundColor: selected ? "#DC2626" : "transparent",
                          borderColor: selected ? "#DC2626" : colors.border,
                        }]}>
                          {selected && <Feather name="check" size={12} color="#FFF" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {step === 3 && (
              <View>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>Location & Details</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  Provide as much detail as you're comfortable sharing.
                </Text>

                {selectedCategory && (
                  <View style={[styles.chip, { backgroundColor: selectedCategory.color + "15", borderColor: selectedCategory.color + "40" }]}>
                    <Feather name={selectedCategory.icon} size={13} color={selectedCategory.color} />
                    <Text style={[styles.chipText, { color: selectedCategory.color }]}>{selectedCategory.label}</Text>
                    <Text style={[styles.chipText, { color: colors.mutedForeground }]}>
                      · {form.concernTypes.length} concern{form.concernTypes.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                )}

                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Space / Business Name *</Text>
                  <TextInput
                    value={form.spaceName}
                    onChangeText={(v) => setForm((f) => ({ ...f, spaceName: v }))}
                    placeholder="e.g. Joe's Bar & Grill"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  />
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Address</Text>
                  <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>Optional — helps us identify the location</Text>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <TextInput
                      value={form.address}
                      onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                      placeholder="e.g. 123 Main St"
                      placeholderTextColor={colors.mutedForeground}
                      style={[styles.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    />
                    <TouchableOpacity
                      onPress={() => void handleUseLocation()}
                      disabled={locating}
                      style={{ padding: 10, borderRadius: 10, backgroundColor: colors.primary, opacity: locating ? 0.6 : 1 }}
                    >
                      {locating
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Feather name="navigation" size={16} color="#fff" />}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>City *</Text>
                  <TextInput
                    value={form.city}
                    onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                    placeholder="e.g. Atlanta, GA"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  />
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Description *</Text>
                  <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                    What happened? Any details that would help the community know what to expect.
                  </Text>
                  <TextInput
                    value={form.description}
                    onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                    placeholder="Describe your experience..."
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    numberOfLines={5}
                    style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  />
                  <Text style={[styles.charCount, { color: form.description.length >= 10 ? colors.mutedForeground : colors.destructive }]}>
                    {form.description.length} chars {form.description.length < 10 ? "(min 10)" : ""}
                  </Text>
                </View>

                <Toggle
                  label="Submit Anonymously"
                  sub="Your name won't be shown. Recommended."
                  value={form.isAnonymous}
                  onToggle={() => setForm((f) => ({ ...f, isAnonymous: !f.isAnonymous }))}
                  colors={colors}
                />

                <View style={[styles.disclaimer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Feather name="shield" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
                    Reports are reviewed before any warning is shown. Spaces flagged by 3 or more users will receive a community warning visible to all users.
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        {step > 1 && (
          <TouchableOpacity style={[styles.backFooterBtn, { backgroundColor: colors.secondary }]} onPress={goBack} activeOpacity={0.8}>
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: canProceed && !submitting ? colors.primary : colors.muted }]}
          onPress={step === 3 ? () => { void handleSubmit(); } : goNext}
          activeOpacity={0.85}
          disabled={!canProceed || submitting}
        >
          {step === 3 && <Feather name="send" size={16} color={canProceed && !submitting ? colors.primaryForeground : colors.mutedForeground} />}
          <Text style={[styles.nextBtnText, { color: canProceed && !submitting ? colors.primaryForeground : colors.mutedForeground }]}>
            {step === 3 ? (submitting ? "Submitting…" : "Submit Report") : "Continue"}
          </Text>
          {step < 3 && <Feather name="arrow-right" size={16} color={canProceed ? colors.primaryForeground : colors.mutedForeground} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { padding: 2 },
  headerCenter: { alignItems: "center", gap: 2 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  headerStep: { fontFamily: "Inter_400Regular", fontSize: 12 },
  progressWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginBottom: 6 },
  stepSub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 24 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  catCard: {
    width: "47%", borderRadius: 14, borderWidth: 1.5,
    padding: 16, alignItems: "center", gap: 10, position: "relative",
  },
  catIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  catLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, textAlign: "center" },
  catCheck: {
    position: "absolute", top: 8, right: 8, width: 18, height: 18,
    borderRadius: 9, alignItems: "center", justifyContent: "center",
  },
  concernList: { gap: 10 },
  concernRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1.5, borderRadius: 12, padding: 14,
  },
  concernIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  concernLabel: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15 },
  concernCheck: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, alignSelf: "flex-start", marginBottom: 20,
  },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 4 },
  fieldHint: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular",
  },
  textarea: { height: 120, textAlignVertical: "top", paddingTop: 12 },
  charCount: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4, textAlign: "right" },
  disclaimer: {
    flexDirection: "row", gap: 10, padding: 14,
    borderRadius: 12, borderWidth: 1, marginTop: 4,
  },
  disclaimerText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  footer: {
    flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 14,
    borderTopWidth: 1,
  },
  backFooterBtn: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  nextBtn: {
    flex: 1, height: 50, borderRadius: 14, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  nextBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  successWrap: { alignItems: "center", padding: 24, gap: 24 },
  successIcon: {
    width: 100, height: 100, borderRadius: 28,
    alignItems: "center", justifyContent: "center", marginTop: 20,
  },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 22, textAlign: "center" },
  successBody: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22, textAlign: "center" },
  summaryCard: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  summaryTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 4 },
  summaryRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 13, width: 70 },
  summaryValue: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13 },
  doneBtn: {
    width: "100%", height: 52, borderRadius: 14, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  doneBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  anotherLink: { fontFamily: "Inter_500Medium", fontSize: 14, textDecorationLine: "underline" },
});
