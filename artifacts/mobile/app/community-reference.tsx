import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const CATEGORIES: { value: string; label: string; description: string }[] = [
  { value: "employer", label: "Employer", description: "A workplace known to treat minorities fairly" },
  { value: "mentor", label: "Mentor / Coaching", description: "Mentorship programs or professional development orgs" },
  { value: "service", label: "Essential Service", description: "Hospital, transit, utility, or community service" },
  { value: "travel", label: "Travel & Hospitality", description: "Hotels, airlines, or travel providers" },
  { value: "general", label: "General Resource", description: "Any other community-helpful organization" },
];

async function getToken(): Promise<string | null> {
  try {
    return Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token");
  } catch {
    return null;
  }
}

export default function CommunityReferenceScreen() {
  const colors = useColors();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("employer");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedCat = CATEGORIES.find((c) => c.value === category)!;

  const handleNext = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter the organization name.");
      return;
    }
    if (!city.trim() || !state.trim()) {
      Alert.alert("Required", "Please enter a city and state.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert("Required", "Please share why this is a trusted community resource.");
      return;
    }
    const token = await getToken();
    if (!token) {
      Alert.alert("Sign In Required", "You must be signed in to submit a community reference.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/businesses/community-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, referenceCategory: category, city, state, website, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      Alert.alert(
        "Reference Added",
        `${name} has been added as a Community Reference. It will appear in search and can be @mentioned in your posts and saved spaces.`,
        [{ text: "Done", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => (step === 2 ? setStep(1) : router.back())} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Add Community Reference</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Disclaimer banner */}
        <View style={s.disclaimer}>
          <Feather name="info" size={13} color="#0369A1" />
          <Text style={s.disclaimerText}>
            Community References are shared by members as helpful resources. They are{" "}
            <Text style={{ fontFamily: "Inter_700Bold" }}>not promoted or endorsed</Text> by Mapping With Melanin™, and the
            organization is never contacted or notified.
          </Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 1 ? (
            <>
              <Text style={[s.stepLabel, { color: colors.mutedForeground }]}>STEP 1 OF 2 — Organization Details</Text>

              <Text style={[s.label, { color: colors.foreground }]}>Organization Name *</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. Kaiser Permanente, Marriott International"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />

              <Text style={[s.label, { color: colors.foreground }]}>Reference Category *</Text>
              <View style={s.catGrid}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[
                      s.catCard,
                      { backgroundColor: colors.card, borderColor: category === c.value ? "#0369A1" : colors.border },
                      category === c.value && { backgroundColor: "#E0F2FE" },
                    ]}
                    onPress={() => setCategory(c.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.catLabel, { color: category === c.value ? "#0369A1" : colors.foreground }]}>{c.label}</Text>
                    <Text style={[s.catDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{c.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.label, { color: colors.foreground }]}>City *</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="City"
                    placeholderTextColor={colors.mutedForeground}
                    value={city}
                    onChangeText={setCity}
                    autoCapitalize="words"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ width: 90 }}>
                  <Text style={[s.label, { color: colors.foreground }]}>State *</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="e.g. MD"
                    placeholderTextColor={colors.mutedForeground}
                    value={state}
                    onChangeText={setState}
                    autoCapitalize="characters"
                    maxLength={2}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[s.btn, { backgroundColor: "#0369A1" }]}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={s.btnText}>Continue</Text>
                <Feather name="arrow-right" size={16} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[s.stepLabel, { color: colors.mutedForeground }]}>STEP 2 OF 2 — Resource Details</Text>

              <View style={s.summaryRow}>
                <View style={s.summaryBadge}>
                  <Feather name="link" size={12} color="#0369A1" />
                  <Text style={s.summaryBadgeText}>Community Reference</Text>
                </View>
                <Text style={[s.summaryName, { color: colors.foreground }]}>{name}</Text>
                <Text style={[s.summaryCat, { color: colors.mutedForeground }]}>{selectedCat.label} · {city}, {state}</Text>
              </View>

              <Text style={[s.label, { color: colors.foreground }]}>Website or Link</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="https://careers.example.com"
                placeholderTextColor={colors.mutedForeground}
                value={website}
                onChangeText={setWebsite}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={[s.hint, { color: colors.mutedForeground }]}>
                Link to a careers page, LinkedIn profile, program site, or any relevant URL.
              </Text>

              <Text style={[s.label, { color: colors.foreground }]}>Why is this a trusted community resource? *</Text>
              <TextInput
                style={[
                  s.input,
                  s.textarea,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
                ]}
                placeholder="Share what you know — fair hiring practices, mentorship programs, good benefits for minority employees, etc."
                placeholderTextColor={colors.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[s.btn, { backgroundColor: submitting ? "#93C5FD" : "#0369A1" }]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={submitting}
              >
                <Feather name="check-circle" size={16} color="#fff" />
                <Text style={s.btnText}>{submitting ? "Submitting…" : "Add Community Reference"}</Text>
              </TouchableOpacity>

              <Text style={[s.footerNote, { color: colors.mutedForeground }]}>
                By submitting, you confirm this is a good-faith community recommendation. This listing will appear in search results with a clear &quot;Community Reference&quot; designation and will never be promoted or featured alongside minority-owned businesses.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#E0F2FE",
    borderBottomWidth: 1,
    borderBottomColor: "#BAE6FD",
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "flex-start",
  },
  disclaimerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#0369A1",
    flex: 1,
    lineHeight: 17,
  },
  scroll: {
    padding: 20,
    paddingBottom: 60,
  },
  stepLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 20,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    marginBottom: 4,
  },
  textarea: {
    minHeight: 110,
    paddingTop: 12,
    marginBottom: 4,
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  catGrid: {
    gap: 10,
    marginBottom: 20,
  },
  catCard: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  catLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 3,
  },
  catDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  btnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
  },
  summaryRow: {
    backgroundColor: "#E0F2FE",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    padding: 14,
    marginBottom: 20,
    gap: 4,
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  summaryBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#0369A1",
  },
  summaryName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  summaryCat: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  footerNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 8,
  },
});
