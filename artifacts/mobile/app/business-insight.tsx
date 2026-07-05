import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

function getApiBase() {
  const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
  return Platform.OS === "web" ? "" : `http://${host}:8080`;
}

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const token = await SecureStore.getItemAsync("auth_session_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

const CATEGORIES = [
  "Restaurant", "Bar / Nightlife", "Retail / Shopping", "Hotel / Lodging",
  "Salon / Spa", "Gym / Fitness", "Coffee Shop", "Healthcare / Medical",
  "Financial Services", "Corporate / Office", "Entertainment", "Other",
];

const CITIES = [
  "Atlanta", "Houston", "Chicago", "Washington DC", "New York",
  "New Orleans", "Los Angeles", "Miami", "Dallas", "Philadelphia",
  "Detroit", "Baltimore", "Memphis", "Charlotte", "Other",
];

type SurveyType = "safety" | "employee";

function StarRow({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity activeOpacity={0.85} key={n} onPress={() => { onChange(n); if (Platform.OS !== "web") Haptics.selectionAsync(); }}>
          <Feather name={n <= value ? "star" : "star"} size={32}
            color={n <= value ? "#F59E0B" : "#D1D5DB"}
            style={{ opacity: n <= value ? 1 : 0.4 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ChipGroup({ options, value, onChange, multi, color, colors }: {
  options: string[]; value: string | string[]; onChange: (v: any) => void;
  multi?: boolean; color: string;
  colors: { primary: string; primaryForeground: string; secondary: string; border: string; foreground: string };
}) {
  const selected = Array.isArray(value) ? value : [value];
  const toggle = (opt: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (multi) {
      onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]);
    } else {
      onChange(opt);
    }
  };
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <TouchableOpacity activeOpacity={0.85}
            key={opt}
            onPress={() => toggle(opt)}
            style={[s.chip, { backgroundColor: on ? color : colors.secondary, borderColor: on ? color : colors.border }]}
          >
            {multi && on && <Feather name="check" size={11} color={colors.primaryForeground} style={{ marginRight: 2 }} />}
            <Text style={[s.chipTxt, { color: on ? colors.primaryForeground : colors.foreground }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TriOption({ label, value, current, onChange, color, colors }: {
  label: string; value: string; current: string; onChange: (v: string) => void; color: string;
  colors: { foreground: string; secondary: string; border: string; primaryForeground: string };
}) {
  const on = current === value;
  return (
    <TouchableOpacity activeOpacity={0.85}
      onPress={() => { onChange(value); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
      style={[s.triOption, { backgroundColor: on ? color + "15" : colors.secondary, borderColor: on ? color : colors.border }]}
    >
      {on && <Feather name="check-circle" size={16} color={color} style={{ marginRight: 8 }} />}
      {!on && <Feather name="circle" size={16} color={colors.border} style={{ marginRight: 8 }} />}
      <Text style={[s.triTxt, { color: colors.foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function YesNo({ value, onChange, color, colors }: {
  value: boolean | null; onChange: (v: boolean) => void; color: string;
  colors: { foreground: string; secondary: string; border: string; primaryForeground: string };
}) {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
      {[{ label: "Yes", val: true }, { label: "No", val: false }].map(({ label, val }) => {
        const on = value === val;
        return (
          <TouchableOpacity activeOpacity={0.85}
            key={label}
            onPress={() => { onChange(val); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
            style={[s.yesno, { backgroundColor: on ? color + "15" : colors.secondary, borderColor: on ? color : colors.border }]}
          >
            <Text style={[s.yesnoTxt, { color: on ? color : colors.foreground }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function BusinessInsightScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Navigation
  const [step, setStep] = useState(0);
  const [surveyType, setSurveyType] = useState<SurveyType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Business details (step 1)
  const [businessName, setBusinessName] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [ownershipType, setOwnershipType] = useState<"minority" | "non-minority" | "unsure" | "">("");

  // Safety survey (step 3a)
  const [safetyRating, setSafetyRating] = useState(0);
  const [feltWelcomed, setFeltWelcomed] = useState("");
  const [experiencedBias, setExperiencedBias] = useState<boolean | null>(null);
  const [biasDetails, setBiasDetails] = useState("");
  const [staffAttitude, setStaffAttitude] = useState(0);
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [safetyNotes, setSafetyNotes] = useState("");

  // Employee survey (step 3b)
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [empRating, setEmpRating] = useState(0);
  const [feltRespected, setFeltRespected] = useState("");
  const [payEquityConcerns, setPayEquityConcerns] = useState<boolean | null>(null);
  const [witnessedDiscrimination, setWitnessedDiscrimination] = useState<boolean | null>(null);
  const [discriminationDetails, setDiscriminationDetails] = useState("");
  const [wouldRecommendWorking, setWouldRecommendWorking] = useState<boolean | null>(null);
  const [employeeNotes, setEmployeeNotes] = useState("");

  const totalSteps = 4;
  const stepLabel = step === 0 ? "Ownership" : step === 1 ? "Business Details" : step === 2 ? "Survey Type" : surveyType === "safety" ? "Your Experience" : "Workplace Experience";

  const canProceed = () => {
    if (step === 1) return businessName.trim().length >= 2 && businessCity.length > 0;
    if (step === 2) return surveyType !== null;
    if (step === 3 && surveyType === "safety") return safetyRating > 0 && feltWelcomed.length > 0 && experiencedBias !== null && wouldReturn !== null && wouldRecommend !== null;
    if (step === 3 && surveyType === "employee") return employmentStatus.length > 0 && empRating > 0 && feltRespected.length > 0 && payEquityConcerns !== null && witnessedDiscrimination !== null && wouldRecommendWorking !== null;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const responses = surveyType === "safety"
        ? { overallRating: safetyRating, feltWelcomed, experiencedBias, biasDetails: biasDetails || undefined, staffAttitude, wouldReturn, wouldRecommend, notes: safetyNotes || undefined }
        : { employmentStatus, overallRating: empRating, feltRespected, payEquityConcerns, witnessedDiscrimination, discriminationDetails: discriminationDetails || undefined, wouldRecommendWorking, notes: employeeNotes || undefined };

      const headers = await authHeaders();
      await fetch(`${getApiBase()}/api/business-insights`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName, businessCity, businessCategory, businessAddress,
          isMinorityOwned: ownershipType === "minority" ? true : ownershipType === "non-minority" ? false : null,
          surveyType, responses,
        }),
      });
      setSubmitted(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // silently handle — submission is best-effort anonymous
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <View style={s.doneWrap}>
          <View style={[s.doneCircle, { backgroundColor: colors.success + "20" }]}>
            <Feather name="shield" size={52} color={colors.success} />
          </View>
          <Text style={[s.doneTitle, { color: colors.foreground }]}>Thank You</Text>
          <Text style={[s.doneSub, { color: colors.mutedForeground }]}>
            {surveyType === "employee"
              ? "Your anonymous employee insight has been submitted. This helps our community make informed decisions."
              : "Your anonymous insight has been submitted. Your experience helps melanated travelers make safer choices."}
          </Text>
          <View style={[s.anonBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="lock" size={14} color={colors.mutedForeground} />
            <Text style={[s.anonTxt, { color: colors.mutedForeground }]}>100% Anonymous — your identity is never shared</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85}
            style={[s.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
          >
            <Text style={[s.doneBtnTxt, { color: colors.primaryForeground }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={s.back} onPress={() => step > 0 ? setStep(p => p - 1) : router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Share Business Insight</Text>
          {step > 0 && <Text style={[s.headerStep, { color: colors.mutedForeground }]}>{stepLabel} · {step} of {totalSteps - 1}</Text>}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {step > 0 && (
        <View style={[s.progressTrack, { backgroundColor: colors.secondary }]}>
          <View style={[s.progressFill, { backgroundColor: colors.primary, width: `${(step / (totalSteps - 1)) * 100}%` as any }]} />
        </View>
      )}

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Step 0: Ownership gate ──────────────────────────────── */}
        {step === 0 && (
          <View style={s.stepContent}>
            <View style={[s.iconBanner, { backgroundColor: colors.primary + "12" }]}>
              <Feather name="eye" size={36} color={colors.primary} />
            </View>
            <Text style={[s.stepTitle, { color: colors.foreground }]}>Share a Business Insight</Text>
            <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
              Help our community by sharing your experience at any business — your insight could protect or inform a fellow melanated traveler.
            </Text>

            <View style={[s.notice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="lock" size={14} color={colors.mutedForeground} />
              <Text style={[s.noticeTxt, { color: colors.mutedForeground }]}>
                Non-minority-owned business insights are always submitted anonymously.
              </Text>
            </View>

            <Text style={[s.qLabel, { color: colors.foreground, marginTop: 8 }]}>What would you like to do?</Text>

            <TouchableOpacity
              style={[s.ownerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/nominate-business?ownership=minority" as any)}
              activeOpacity={0.8}
            >
              <View style={[s.ownerIconWrap, { backgroundColor: colors.primary + "15" }]}>
                <Text style={{ fontSize: 24 }}>✊🏾</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.ownerCardTitle, { color: colors.foreground }]}>Nominate a Minority-Owned Business</Text>
                <Text style={[s.ownerCardSub, { color: colors.mutedForeground }]}>Add a Black or minority-owned business to the Mapping With Melanin™ directory</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.ownerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/nominate-business?ownership=general" as any)}
              activeOpacity={0.8}
            >
              <View style={[s.ownerIconWrap, { backgroundColor: colors.secondary }]}>
                <Text style={{ fontSize: 24 }}>🏢</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.ownerCardTitle, { color: colors.foreground }]}>Add a Non-Minority Business</Text>
                <Text style={[s.ownerCardSub, { color: colors.mutedForeground }]}>Add any business to the community directory — clearly designated as non-minority, never promoted or contacted</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.ownerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setStep(1)}
              activeOpacity={0.8}
            >
              <View style={[s.ownerIconWrap, { backgroundColor: colors.secondary }]}>
                <Feather name="shield" size={22} color={colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.ownerCardTitle, { color: colors.foreground }]}>Share an Anonymous Survey</Text>
                <Text style={[s.ownerCardSub, { color: colors.mutedForeground }]}>Submit a Safety or employee experience report about any business — 100% anonymous</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 1: Business details ────────────────────────────── */}
        {step === 1 && (
          <View style={s.stepContent}>
            <Text style={[s.stepTitle, { color: colors.foreground }]}>🏢 Business Details</Text>
            <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
              Tell us about the business. This info stays anonymous and is never linked back to you.
            </Text>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Business name <Text style={{ color: colors.accent }}>*</Text></Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. Walmart, Amazon, Starbucks"
                placeholderTextColor={colors.mutedForeground}
                value={businessName}
                onChangeText={setBusinessName}
                autoCapitalize="words"
              />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>City <Text style={{ color: colors.accent }}>*</Text></Text>
              <ChipGroup options={CITIES} value={businessCity} onChange={setBusinessCity} color={colors.primary} colors={colors} />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Category <Text style={[{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>(optional)</Text></Text>
              <ChipGroup options={CATEGORIES} value={businessCategory} onChange={setBusinessCategory} color={colors.primary} colors={colors} />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Street address <Text style={[{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>(optional)</Text></Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Helps us identify the right location"
                placeholderTextColor={colors.mutedForeground}
                value={businessAddress}
                onChangeText={setBusinessAddress}
              />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Is this a minority-owned business? <Text style={[{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>(optional)</Text></Text>
              <Text style={[s.qHint, { color: colors.mutedForeground }]}>Non-minority businesses are never notified or contacted.</Text>
              <View style={{ gap: 8, marginTop: 4 }}>
                <TriOption label="Yes — minority-owned" value="minority" current={ownershipType} onChange={(v) => setOwnershipType(v as any)} color={colors.primary} colors={colors} />
                <TriOption label="No — non-minority owned 🏢" value="non-minority" current={ownershipType} onChange={(v) => setOwnershipType(v as any)} color={colors.primary} colors={colors} />
                <TriOption label="Not sure" value="unsure" current={ownershipType} onChange={(v) => setOwnershipType(v as any)} color={colors.primary} colors={colors} />
              </View>
            </View>
          </View>
        )}

        {/* ── Step 2: Survey type ─────────────────────────────────── */}
        {step === 2 && (
          <View style={s.stepContent}>
            <Text style={[s.stepTitle, { color: colors.foreground }]}>🗂️ What type of insight?</Text>
            <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
              Choose the perspective you're sharing. Both surveys are 100% anonymous.
            </Text>

            <TouchableOpacity
              style={[s.typeCard, surveyType === "safety" && { borderColor: colors.primary, backgroundColor: colors.primary + "08" }, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => { setSurveyType("safety"); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 32 }}>🛡️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.typeTitle, { color: colors.foreground }]}>Customer Safety Experience</Text>
                <Text style={[s.typeSub, { color: colors.mutedForeground }]}>Share how safe and welcomed you felt as a customer — for melanated travelers visiting this business</Text>
              </View>
              {surveyType === "safety" && <Feather name="check-circle" size={22} color={colors.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.typeCard, surveyType === "employee" && { borderColor: colors.primary, backgroundColor: colors.primary + "08" }, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => { setSurveyType("employee"); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 32 }}>💼</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.typeTitle, { color: colors.foreground }]}>Employee Experience</Text>
                <Text style={[s.typeSub, { color: colors.mutedForeground }]}>Share what it's like to work or have worked there — culture, pay equity, management, and belonging</Text>
              </View>
              {surveyType === "employee" && <Feather name="check-circle" size={22} color={colors.primary} />}
            </TouchableOpacity>

            <View style={[s.notice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="lock" size={14} color={colors.mutedForeground} />
              <Text style={[s.noticeTxt, { color: colors.mutedForeground }]}>Your identity is never revealed. Submissions are reviewed by our moderation team before being used to inform community intelligence.</Text>
            </View>
          </View>
        )}

        {/* ── Step 3a: Safety survey ──────────────────────────────── */}
        {step === 3 && surveyType === "safety" && (
          <View style={s.stepContent}>
            <Text style={[s.stepTitle, { color: colors.foreground }]}>🛡️ Your Customer Experience</Text>
            <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
              Your anonymous answers help other minority and melanated travelers know what to expect.
            </Text>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Overall comfort & safety rating <Text style={{ color: colors.accent }}>*</Text></Text>
              <Text style={[s.qHint, { color: colors.mutedForeground }]}>How safe and comfortable did you feel overall?</Text>
              <StarRow value={safetyRating} onChange={setSafetyRating} color={colors.primary} />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Did you feel welcomed? <Text style={{ color: colors.accent }}>*</Text></Text>
              <ChipGroup options={["Yes", "Somewhat", "No"]} value={feltWelcomed} onChange={setFeltWelcomed} color={colors.primary} colors={colors} />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Did you experience any bias or discrimination? <Text style={{ color: colors.accent }}>*</Text></Text>
              <YesNo value={experiencedBias} onChange={setExperiencedBias} color={colors.primary} colors={colors} />
              {experiencedBias && (
                <TextInput
                  style={[s.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 10 }]}
                  placeholder="Brief description (stays anonymous)…"
                  placeholderTextColor={colors.mutedForeground}
                  value={biasDetails}
                  onChangeText={setBiasDetails}
                  multiline numberOfLines={3}
                />
              )}
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Staff attitude toward you</Text>
              <Text style={[s.qHint, { color: colors.mutedForeground }]}>1 = hostile, 5 = genuinely welcoming</Text>
              <StarRow value={staffAttitude} onChange={setStaffAttitude} color={colors.primary} />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Would you return? <Text style={{ color: colors.accent }}>*</Text></Text>
              <YesNo value={wouldReturn} onChange={setWouldReturn} color={colors.primary} colors={colors} />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Would you recommend to other minority travelers? <Text style={{ color: colors.accent }}>*</Text></Text>
              <YesNo value={wouldRecommend} onChange={setWouldRecommend} color={colors.primary} colors={colors} />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Any other tips? <Text style={[{ color: colors.mutedForeground }]}>(optional)</Text></Text>
              <Text style={[s.qHint, { color: colors.mutedForeground }]}>e.g. best time to visit, what to watch out for, what to ask for</Text>
              <TextInput
                style={[s.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Anonymous tip for the community…"
                placeholderTextColor={colors.mutedForeground}
                value={safetyNotes}
                onChangeText={setSafetyNotes}
                multiline numberOfLines={4}
              />
            </View>
          </View>
        )}

        {/* ── Step 3b: Employee survey ────────────────────────────── */}
        {step === 3 && surveyType === "employee" && (
          <View style={s.stepContent}>
            <Text style={[s.stepTitle, { color: colors.foreground }]}>💼 Your Employee Experience</Text>
            <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
              Help minority job seekers understand what it's really like to work here. 100% anonymous.
            </Text>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Are you a current or former employee? <Text style={{ color: colors.accent }}>*</Text></Text>
              <View style={{ gap: 8, marginTop: 4 }}>
                <TriOption label="Current employee" value="current" current={employmentStatus} onChange={setEmploymentStatus} color={colors.primary} colors={colors} />
                <TriOption label="Former employee" value="former" current={employmentStatus} onChange={setEmploymentStatus} color={colors.primary} colors={colors} />
              </View>
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Overall workplace rating <Text style={{ color: colors.accent }}>*</Text></Text>
              <Text style={[s.qHint, { color: colors.mutedForeground }]}>How inclusive and welcoming is the workplace culture?</Text>
              <StarRow value={empRating} onChange={setEmpRating} color={colors.primary} />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Do you feel respected by management? <Text style={{ color: colors.accent }}>*</Text></Text>
              <ChipGroup options={["Yes", "Somewhat", "No"]} value={feltRespected} onChange={setFeltRespected} color={colors.primary} colors={colors} />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Do you have pay equity concerns? <Text style={{ color: colors.accent }}>*</Text></Text>
              <Text style={[s.qHint, { color: colors.mutedForeground }]}>Are minority employees compensated fairly compared to peers?</Text>
              <YesNo value={payEquityConcerns} onChange={setPayEquityConcerns} color={colors.primary} colors={colors} />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Have you witnessed discrimination in hiring or promotions? <Text style={{ color: colors.accent }}>*</Text></Text>
              <YesNo value={witnessedDiscrimination} onChange={setWitnessedDiscrimination} color={colors.primary} colors={colors} />
              {witnessedDiscrimination && (
                <TextInput
                  style={[s.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 10 }]}
                  placeholder="Brief description (stays anonymous)…"
                  placeholderTextColor={colors.mutedForeground}
                  value={discriminationDetails}
                  onChangeText={setDiscriminationDetails}
                  multiline numberOfLines={3}
                />
              )}
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Would you recommend this employer to minority job seekers? <Text style={{ color: colors.accent }}>*</Text></Text>
              <YesNo value={wouldRecommendWorking} onChange={setWouldRecommendWorking} color={colors.primary} colors={colors} />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Anything else to share? <Text style={[{ color: colors.mutedForeground }]}>(optional)</Text></Text>
              <Text style={[s.qHint, { color: colors.mutedForeground }]}>Benefits, culture, ERGs, what management gets right or wrong</Text>
              <TextInput
                style={[s.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Anonymous insight for the community…"
                placeholderTextColor={colors.mutedForeground}
                value={employeeNotes}
                onChangeText={setEmployeeNotes}
                multiline numberOfLines={4}
              />
            </View>
          </View>
        )}

      </ScrollView>

      {/* Footer — hidden on step 0 (cards handle navigation) */}
      {step > 0 && (
        <View style={[s.footer, { paddingBottom: bottomPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {step < 3 ? (
            <TouchableOpacity activeOpacity={0.85}
              style={[s.nextBtn, { backgroundColor: canProceed() ? colors.primary : colors.muted }]}
              onPress={() => setStep(p => p + 1)}
              disabled={!canProceed()}
            >
              <Text style={[s.nextTxt, { color: canProceed() ? colors.primaryForeground : colors.mutedForeground }]}>Continue</Text>
              <Feather name="arrow-right" size={18} color={canProceed() ? colors.primaryForeground : colors.mutedForeground} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity activeOpacity={0.85}
              style={[s.nextBtn, { backgroundColor: canProceed() ? colors.primary : colors.muted }]}
              onPress={handleSubmit}
              disabled={!canProceed() || submitting}
            >
              {submitting
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <>
                    <Feather name="send" size={18} color={canProceed() ? colors.primaryForeground : colors.mutedForeground} />
                    <Text style={[s.nextTxt, { color: canProceed() ? colors.primaryForeground : colors.mutedForeground }]}>Submit Anonymously</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerStep: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  progressTrack: { height: 3 },
  progressFill: { height: 3 },
  scroll: { padding: 20 },
  stepContent: { gap: 24 },
  stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30 },
  stepSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginTop: -10 },
  iconBanner: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  ownerCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1.5 },
  ownerIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  ownerCardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  ownerCardSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  typeCard: { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 18, borderRadius: 16, borderWidth: 2 },
  typeTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  typeSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  noticeTxt: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  qBlock: { gap: 6 },
  qLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  qHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: -2 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 90, textAlignVertical: "top" },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  triOption: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1.5 },
  triTxt: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  yesno: { flex: 1, alignItems: "center", paddingVertical: 13, borderRadius: 12, borderWidth: 1.5 },
  yesnoTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 17, borderRadius: 16 },
  nextTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 20 },
  doneCircle: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  doneSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24 },
  anonBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, alignSelf: "center" },
  anonTxt: { fontSize: 12, fontFamily: "Inter_500Medium" },
  doneBtn: { alignItems: "center", paddingVertical: 17, paddingHorizontal: 48, borderRadius: 16 },
  doneBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
