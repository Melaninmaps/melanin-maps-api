import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
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
import { CATEGORY_GROUPS, getCategoryGroup, isLiveCategory, type CategoryGroup } from "@/constants/categories";

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

const HOURS_OPTIONS = [
  "Mon–Fri 9am–5pm",
  "Mon–Fri 9am–9pm",
  "Mon–Sat 10am–8pm",
  "Mon–Sun 10am–10pm",
  "Mon–Sun 8am–6pm",
  "By Appointment",
  "Custom",
];

const TOTAL_STEPS = 4;

interface FormData {
  name: string;
  category: string;
  subcategory: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  priceRange: string;
  hours: string;
  customHours: string;
  tags: string;
  isBlackOwned: boolean;
  isVerified: boolean;
}

const INITIAL_FORM: FormData = {
  name: "",
  category: "",
  subcategory: "",
  description: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  website: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  priceRange: "",
  hours: "",
  customHours: "",
  tags: "",
  isBlackOwned: true,
  isVerified: false,
};

function ProgressBar({ step, total, colors }: { step: number; total: number; colors: any }) {
  return (
    <View style={progressStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            progressStyles.segment,
            {
              backgroundColor: i < step ? colors.primary : colors.border,
              flex: 1,
            },
          ]}
        />
      ))}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: { flexDirection: "row", gap: 6, marginBottom: 6 },
  segment: { height: 4, borderRadius: 2 },
});

function StepLabel({ step, total, title, colors }: { step: number; total: number; title: string; colors: any }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={[stepLabelStyles.step, { color: colors.primary }]}>Step {step} of {total}</Text>
      <Text style={[stepLabelStyles.title, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

const stepLabelStyles = StyleSheet.create({
  step: { fontFamily: "Inter_500Medium", fontSize: 12, marginBottom: 4 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
});

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad" | "url" | "email-address" | "numeric";
  colors: any;
  hint?: string;
}

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType = "default", colors, hint }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fieldStyles.wrap}>
      <Text style={[fieldStyles.label, { color: colors.foreground }]}>{label}</Text>
      {hint && <Text style={[fieldStyles.hint, { color: colors.mutedForeground }]}>{hint}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "url" || keyboardType === "email-address" ? "none" : "sentences"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          fieldStyles.input,
          multiline && fieldStyles.multiline,
          {
            backgroundColor: colors.card,
            borderColor: focused ? colors.primary : colors.border,
            color: colors.foreground,
          },
        ]}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { gap: 6, marginBottom: 16 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  hint: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: -2 },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  multiline: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
});

function ChipGroup({ options, value, onSelect, colors }: { options: string[]; value: string; onSelect: (v: string) => void; colors: any }) {
  return (
    <View style={chipStyles.row}>
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => { Haptics.selectionAsync(); onSelect(opt); }}
            style={[
              chipStyles.chip,
              {
                backgroundColor: selected ? colors.primary : colors.card,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[chipStyles.chipText, { color: selected ? colors.primaryForeground : colors.foreground }]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
});

function Toggle({ label, value, onToggle, colors }: { label: string; value: boolean; onToggle: () => void; colors: any }) {
  return (
    <TouchableOpacity
      style={[toggleStyles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => { Haptics.selectionAsync(); onToggle(); }}
      activeOpacity={0.8}
    >
      <View style={{ flex: 1 }}>
        <Text style={[toggleStyles.label, { color: colors.foreground }]}>{label}</Text>
      </View>
      <View style={[toggleStyles.track, { backgroundColor: value ? colors.primary : colors.muted }]}>
        <View style={[toggleStyles.thumb, { transform: [{ translateX: value ? 20 : 2 }] }]} />
      </View>
    </TouchableOpacity>
  );
}

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  label: { fontFamily: "Inter_500Medium", fontSize: 14 },
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    position: "relative",
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default function ListBusinessScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [waitlistCat, setWaitlistCat] = useState<CategoryGroup | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistCity, setWaitlistCity] = useState("");
  const [aiFilling, setAiFilling] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const update = (field: keyof FormData) => (value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const animateToStep = (nextStep: number) => {
    const direction = nextStep > step ? 1 : -1;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: direction * -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(direction * 30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleAiFill = async () => {
    if (!form.name.trim() || aiFilling) return;
    setAiFilling(true);
    setAiSuggestion(null);
    try {
      const apiBase = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      const res = await fetch(`${apiBase}/api/businesses/smart-fill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), city: form.city.trim() || undefined }),
      });
      if (!res.ok) return;
      const data = await res.json() as { fields?: { category?: string; subcategory?: string; description?: string; hours?: string; priceRange?: string; tags?: string[] } };
      const fields = data.fields;
      if (!fields) return;
      if (fields.category) update("category")(fields.category);
      if (fields.subcategory) update("subcategory")(fields.subcategory);
      const parts: string[] = [];
      if (fields.priceRange) parts.push(`${fields.priceRange} price range`);
      if (fields.hours) parts.push(fields.hours);
      if (fields.tags?.length) parts.push(fields.tags.join(", "));
      setAiSuggestion(parts.length ? parts.join(" · ") : "Category auto-selected!");
    } catch { /* silent */ }
    finally { setAiFilling(false); }
  };

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < TOTAL_STEPS) animateToStep(step + 1);
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) animateToStep(step - 1);
    else router.back();
  };

  const handleWaitlistSubmit = async () => {
    if (!waitlistCat || !waitlistEmail.trim() || !waitlistEmail.includes("@")) return;
    setWaitlistSubmitting(true);
    try {
      const apiBase = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      await fetch(`${apiBase}/api/category-waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentCategory: waitlistCat.name,
          email: waitlistEmail.trim(),
          city: waitlistCity.trim() || null,
          businessName: form.name.trim() || null,
        }),
      });
      setWaitlistDone(true);
    } catch { } finally {
      setWaitlistSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const apiBase = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${apiBase}/api/businesses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          subcategory: form.subcategory || form.category,
          description: form.description,
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          phone: form.phone,
          website: form.website || null,
          instagram: form.instagram || null,
          facebook: form.facebook || null,
          tiktok: form.tiktok || null,
          priceRange: form.priceRange,
          hours: form.hours,
          customHours: form.customHours,
          tags: form.tags,
          isBlackOwned: form.isBlackOwned,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Submission failed");
      }
      if (token) {
        await fetch(`${apiBase}/api/auth/user/setup`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ isBusinessOwner: true }),
        }).catch(() => {});
      }
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      animateToStep(TOTAL_STEPS);
    } catch (err) {
      Alert.alert("Submission Error", err instanceof Error ? err.message : "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return form.name.trim().length > 0 && form.category.length > 0;
    if (step === 2) return form.address.trim().length > 0 && form.city.trim().length > 0 && form.state.trim().length > 0;
    if (step === 3) return true;
    return true;
  };

  const isLastForm = step === 3;
  const isSuccess = step === 4;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={goBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isSuccess ? "Submitted!" : "List Your Business"}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {!isSuccess && (
        <View style={[styles.progressWrap, { backgroundColor: colors.background }]}>
          <ProgressBar step={step} total={TOTAL_STEPS} colors={colors} />
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {isSuccess ? (
          <View style={styles.successContainer}>
            <View style={[styles.successIconWrap, { backgroundColor: colors.primary + "15" }]}>
              <Image
                source={require("@/assets/images/bento-businesses.jpg")}
                style={styles.successImage}
                contentFit="cover"
              />
              <View style={[styles.successBadge, { backgroundColor: "#22C55E" }]}>
                <Feather name="check" size={22} color="#FFFFFF" />
              </View>
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              You're on the Map!
            </Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{form.name || "Your business"}</Text>
              {" "}has been submitted for review. Our team will verify your listing within 1–3 business days. You'll receive a confirmation once it goes live.
            </Text>

            <View style={[styles.successCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[
                { icon: "check-circle", label: "Submitted", value: "Under review", color: "#22C55E" },
                { icon: "clock", label: "Review time", value: "1–3 business days", color: colors.primary },
                { icon: "shield", label: "Verification", value: "Pending", color: colors.accent },
              ].map((item) => (
                <View key={item.label} style={styles.successRow}>
                  <Feather name={item.icon as any} size={16} color={item.color} />
                  <Text style={[styles.successRowLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                  <Text style={[styles.successRowValue, { color: colors.foreground }]}>{item.value}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.successBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.replace("/business-owner" as any)}
              activeOpacity={0.85}
            >
              <Text style={[styles.successBtnText, { color: colors.primaryForeground }]}>Manage Your Business</Text>
              <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace("/(tabs)")} activeOpacity={0.7}>
              <Text style={[styles.successLink, { color: colors.primary }]}>Back to Discover</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
        keyboardDismissMode="on-drag"
            contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 120 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {step === 1 && (
                <View>
                  <StepLabel step={1} total={TOTAL_STEPS} title="Business Basics" colors={colors} />

                  <Field
                    label="Business Name *"
                    value={form.name}
                    onChangeText={(v) => { update("name")(v); setAiSuggestion(null); }}
                    placeholder="e.g. Sweet Auburn Grille"
                    colors={colors}
                  />

                  {form.name.trim().length >= 3 && (
                    <TouchableOpacity
                      style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primary + "18", borderWidth: 1, borderColor: colors.primary + "44", borderRadius: 10, padding: 12, marginBottom: 16 }}
                      onPress={handleAiFill}
                      disabled={aiFilling}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 16 }}>{aiFilling ? "⏳" : "✨"}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.primary }}>
                          {aiFilling ? "KinfolkAI is filling in details…" : "AI Fill — let KinfolkAI help"}
                        </Text>
                        {aiSuggestion && (
                          <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }} numberOfLines={2}>{aiSuggestion}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}

                  <View style={{ marginBottom: 16 }}>
                    <Text style={[fieldStyles.label, { color: colors.foreground, marginBottom: 6 }]}>Category *</Text>
                    <Text style={[fieldStyles.hint, { color: colors.mutedForeground, marginBottom: 10 }]}>
                      Select your business category. More categories launching soon.
                    </Text>
                    {/* Parent category chips */}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {CATEGORY_GROUPS.map((group) => {
                        const isSelected = form.category === group.name;
                        const isWaitlisted = !group.liveAtLaunch;
                        return (
                          <TouchableOpacity
                            key={group.name}
                            onPress={() => {
                              if (isWaitlisted) {
                                Haptics.selectionAsync();
                                setWaitlistCat(group);
                                setWaitlistDone(false);
                                setWaitlistEmail("");
                                setWaitlistCity("");
                                update("category")("");
                                update("subcategory")("");
                                return;
                              }
                              Haptics.selectionAsync();
                              update("category")(group.name);
                              update("subcategory")("");
                              setWaitlistCat(null);
                              setWaitlistDone(false);
                            }}
                            style={[
                              chipStyles.chip,
                              {
                                backgroundColor: isSelected
                                  ? colors.primary
                                  : isWaitlisted
                                  ? colors.muted
                                  : colors.card,
                                borderColor: isSelected ? colors.primary : colors.border,
                                opacity: isWaitlisted ? 0.75 : 1,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                              },
                            ]}
                            activeOpacity={0.8}
                          >
                            <Text style={{ fontSize: 13 }}>{group.emoji}</Text>
                            <Text style={[chipStyles.chipText, { color: isSelected ? colors.primaryForeground : colors.foreground }]}>
                              {group.name}
                            </Text>
                            {isWaitlisted && (
                              <Text style={{ fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
                                Soon
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Subcategory chips — shown when a live category is selected */}
                    {form.category && isLiveCategory(form.category) && (
                      <View style={{ marginTop: 14 }}>
                        <Text style={[fieldStyles.hint, { color: colors.mutedForeground, marginBottom: 8 }]}>
                          Choose a subcategory (optional):
                        </Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                          {(getCategoryGroup(form.category)?.subcategories ?? []).map((sub) => {
                            const isSubSelected = form.subcategory === sub.name;
                            return (
                              <TouchableOpacity
                                key={sub.name}
                                onPress={() => { Haptics.selectionAsync(); update("subcategory")(isSubSelected ? "" : sub.name); }}
                                style={[chipStyles.chip, {
                                  backgroundColor: isSubSelected ? colors.primary + "22" : colors.card,
                                  borderColor: isSubSelected ? colors.primary : colors.border,
                                }]}
                                activeOpacity={0.8}
                              >
                                <Text style={[chipStyles.chipText, { color: isSubSelected ? colors.primary : colors.foreground }]}>
                                  {sub.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* Coming-soon waitlist capture */}
                    {waitlistCat && !isLiveCategory(waitlistCat.name) && (
                      <View style={{ marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
                        {waitlistDone ? (
                          <View style={{ alignItems: "center", gap: 6 }}>
                            <Text style={{ fontSize: 22 }}>🎉</Text>
                            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: colors.foreground, textAlign: "center" }}>
                              You're on the waitlist!
                            </Text>
                            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, textAlign: "center" }}>
                              We'll notify you when {waitlistCat.emoji} {waitlistCat.name} launches on Mapping With Melanin.
                            </Text>
                            <TouchableOpacity activeOpacity={0.85} onPress={() => { setWaitlistCat(null); setWaitlistDone(false); }}>
                              <Text style={{ fontSize: 13, color: colors.primary, fontFamily: "Inter_600SemiBold", marginTop: 4 }}>
                                Pick a different category
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <>
                            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: colors.foreground }}>
                              {waitlistCat.emoji} {waitlistCat.name} — Coming Soon
                            </Text>
                            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, lineHeight: 18 }}>
                              This category isn't live yet. Drop your email and we'll notify you the moment it launches.
                            </Text>
                            <TextInput
                              style={{ borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }}
                              placeholder="Your email address *"
                              placeholderTextColor={colors.mutedForeground}
                              value={waitlistEmail}
                              onChangeText={setWaitlistEmail}
                              keyboardType="email-address"
                              autoCapitalize="none"
                            />
                            <TextInput
                              style={{ borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }}
                              placeholder="Your city (optional)"
                              placeholderTextColor={colors.mutedForeground}
                              value={waitlistCity}
                              onChangeText={setWaitlistCity}
                              autoCapitalize="words"
                            />
                            <TouchableOpacity activeOpacity={0.85}
                              onPress={handleWaitlistSubmit}
                              disabled={waitlistSubmitting || !waitlistEmail.includes("@")}
                              style={{ backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 11, alignItems: "center", opacity: (waitlistSubmitting || !waitlistEmail.includes("@")) ? 0.5 : 1 }}
                            >
                              <Text style={{ color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                                {waitlistSubmitting ? "Saving…" : "Notify Me When Live"}
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    )}
                  </View>

                  <Field
                    label="Description"
                    value={form.description}
                    onChangeText={update("description")}
                    placeholder="Tell the community what makes your business special..."
                    multiline
                    colors={colors}
                    hint="Highlight what makes you unique (50–300 characters recommended)"
                  />

                  <View style={{ marginBottom: 16 }}>
                    <Text style={[fieldStyles.label, { color: colors.foreground, marginBottom: 10 }]}>Tags</Text>
                    <Field
                      label=""
                      value={form.tags}
                      onChangeText={update("tags")}
                      placeholder="e.g. vegan, outdoor-seating, family-friendly"
                      colors={colors}
                      hint="Separate with commas — helps people find you"
                    />
                  </View>

                  <Toggle
                    label="This is a minority-owned business"
                    value={form.isBlackOwned}
                    onToggle={() => update("isBlackOwned")(!form.isBlackOwned)}
                    colors={colors}
                  />
                </View>
              )}

              {step === 2 && (
                <View>
                  <StepLabel step={2} total={TOTAL_STEPS} title="Location" colors={colors} />

                  <Field
                    label="Street Address *"
                    value={form.address}
                    onChangeText={update("address")}
                    placeholder="123 Main Street"
                    colors={colors}
                  />

                  <View style={styles.row}>
                    <View style={{ flex: 2 }}>
                      <Field
                        label="City *"
                        value={form.city}
                        onChangeText={update("city")}
                        placeholder="Atlanta"
                        colors={colors}
                      />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Field
                        label="State *"
                        value={form.state}
                        onChangeText={update("state")}
                        placeholder="GA"
                        colors={colors}
                      />
                    </View>
                  </View>

                  <Field
                    label="ZIP Code"
                    value={form.zip}
                    onChangeText={update("zip")}
                    placeholder="30303"
                    keyboardType="numeric"
                    colors={colors}
                  />

                  <View style={[styles.mapHint, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    <Feather name="map-pin" size={16} color={colors.primary} />
                    <Text style={[styles.mapHintText, { color: colors.foreground }]}>
                      Your address will be used to place a pin on the Mapping With Melanin community map.
                    </Text>
                  </View>
                </View>
              )}

              {step === 3 && (
                <View>
                  <StepLabel step={3} total={TOTAL_STEPS} title="Contact & Hours" colors={colors} />

                  <Field
                    label="Phone Number"
                    value={form.phone}
                    onChangeText={update("phone")}
                    placeholder="(404) 555-0123"
                    keyboardType="phone-pad"
                    colors={colors}
                  />

                  <Field
                    label="Website (optional)"
                    value={form.website}
                    onChangeText={update("website")}
                    placeholder="yourwebsite.com"
                    keyboardType="url"
                    colors={colors}
                  />

                  <Field
                    label="Instagram (optional)"
                    value={form.instagram}
                    onChangeText={update("instagram")}
                    placeholder="@yourbusiness"
                    colors={colors}
                  />

                  <Field
                    label="Facebook (optional)"
                    value={form.facebook}
                    onChangeText={update("facebook")}
                    placeholder="facebook.com/yourbusiness"
                    colors={colors}
                  />

                  <Field
                    label="TikTok (optional)"
                    value={form.tiktok}
                    onChangeText={update("tiktok")}
                    placeholder="@yourbusiness"
                    colors={colors}
                  />

                  <View style={{ marginBottom: 16 }}>
                    <Text style={[fieldStyles.label, { color: colors.foreground, marginBottom: 6 }]}>Price Range</Text>
                    <ChipGroup
                      options={PRICE_RANGES}
                      value={form.priceRange}
                      onSelect={update("priceRange") as (v: string) => void}
                      colors={colors}
                    />
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text style={[fieldStyles.label, { color: colors.foreground, marginBottom: 6 }]}>Hours of Operation</Text>
                    <ChipGroup
                      options={HOURS_OPTIONS}
                      value={form.hours}
                      onSelect={update("hours") as (v: string) => void}
                      colors={colors}
                    />
                    {form.hours === "Custom" && (
                      <View style={{ marginTop: 12 }}>
                        <Field
                          label="Custom Hours"
                          value={form.customHours}
                          onChangeText={update("customHours")}
                          placeholder="e.g. Tue–Sun 11am–10pm, closed Mon"
                          colors={colors}
                        />
                      </View>
                    )}
                  </View>

                  <View style={[styles.reviewNotice, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                    <Feather name="shield" size={16} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reviewNoticeTitle, { color: colors.foreground }]}>Verification Process</Text>
                      <Text style={[styles.reviewNoticeText, { color: colors.mutedForeground }]}>
                        Our team reviews every listing to ensure quality and authenticity. Minority-owned businesses are eligible for our Verified badge after review.
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {!isSuccess && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
          {step === 1 && !canProceed() && form.name.trim().length > 0 && (
            <Text style={[styles.footerHint, { color: colors.mutedForeground }]}>
              Select a live category (✓) to continue
            </Text>
          )}
          <View style={styles.footerBtns}>
            {step > 1 && (
              <TouchableOpacity
                style={[styles.backFooterBtn, { backgroundColor: colors.secondary }]}
                onPress={goBack}
                activeOpacity={0.8}
              >
                <Feather name="arrow-left" size={18} color={colors.foreground} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.nextBtn,
                { backgroundColor: canProceed() ? colors.primary : colors.muted },
              ]}
              onPress={isLastForm ? () => { void handleSubmit(); } : goNext}
              activeOpacity={0.85}
              disabled={!canProceed()}
            >
              <Text style={[styles.nextBtnText, { color: canProceed() ? colors.primaryForeground : colors.mutedForeground }]}>
                {isLastForm ? "Submit Listing" : "Continue"}
              </Text>
              <Feather
                name={isLastForm ? "send" : "arrow-right"}
                size={16}
                color={canProceed() ? colors.primaryForeground : colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 2 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  progressWrap: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  row: { flexDirection: "row" },
  mapHint: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
    marginTop: 4,
  },
  mapHintText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
  reviewNotice: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
    marginTop: 8,
  },
  reviewNoticeTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 4 },
  reviewNoticeText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  footer: {
    flexDirection: "column",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  footerHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  footerBtns: {
    flexDirection: "row",
    gap: 12,
  },
  backFooterBtn: {
    width: 50,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 14,
    gap: 8,
  },
  nextBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },

  successContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 16,
  },
  successIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    marginBottom: 8,
  },
  successImage: { width: "100%", height: "100%" },
  successBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  successTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    textAlign: "center",
  },
  successSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  successCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    marginTop: 8,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  successRowLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
  },
  successRowValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  successBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  successBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  successLink: { fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 4 },
});
