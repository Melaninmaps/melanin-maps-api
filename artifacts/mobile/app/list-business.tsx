import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
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

const CATEGORIES = [
  "Food",
  "Beauty",
  "Retail",
  "Tech",
  "Health",
  "Legal",
  "Finance",
  "Arts",
  "Fitness",
  "Travel",
  "Media",
  "Education",
];

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
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
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
  description: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  website: "",
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
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
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

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < TOTAL_STEPS) animateToStep(step + 1);
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) animateToStep(step - 1);
    else router.back();
  };

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    animateToStep(TOTAL_STEPS);
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
        <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.85}
            >
              <Text style={[styles.successBtnText, { color: colors.primaryForeground }]}>Back to Discover</Text>
              <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace("/(tabs)/profile")} activeOpacity={0.7}>
              <Text style={[styles.successLink, { color: colors.primary }]}>View my profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
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
                    onChangeText={update("name")}
                    placeholder="e.g. Sweet Auburn Grille"
                    colors={colors}
                  />

                  <View style={{ marginBottom: 16 }}>
                    <Text style={[fieldStyles.label, { color: colors.foreground, marginBottom: 10 }]}>Category *</Text>
                    <ChipGroup
                      options={CATEGORIES}
                      value={form.category}
                      onSelect={update("category") as (v: string) => void}
                      colors={colors}
                    />
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
                    label="This is a Black-owned business"
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
                    label="Website"
                    value={form.website}
                    onChangeText={update("website")}
                    placeholder="yourwebsite.com"
                    keyboardType="url"
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
                        Our team reviews every listing to ensure quality and authenticity. Black-owned businesses are eligible for our Verified badge after review.
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
              step === 1 && { marginLeft: 0 },
            ]}
            onPress={isLastForm ? handleSubmit : goNext}
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
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
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
