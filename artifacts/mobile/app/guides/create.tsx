import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase() { return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""; }
async function getToken() { try { return Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token"); } catch { return null; } }
async function authHeaders(): Promise<Record<string, string>> { const t = await getToken(); return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }; }

type StoryType = { key: string; label: string; emoji: string; subjectHint: string; contextHint: string; storyHint: string };

const STORY_TYPES: StoryType[] = [
  {
    key: "university",
    label: "University / HBCU",
    emoji: "🎓",
    subjectHint: "e.g. Howard University, Spelman College, FAMU",
    contextHint: "e.g. I spent 4 years at Howard University (2018–2022)",
    storyHint: "What made your experience unique? What do you wish you'd known on day one?",
  },
  {
    key: "health",
    label: "Health Journey",
    emoji: "💊",
    subjectHint: "e.g. Type 2 Diabetes, Lupus, Hypertension, Sickle Cell",
    contextHint: "e.g. I've been living with Type 2 Diabetes for 20 years",
    storyHint: "What would you tell someone newly diagnosed? What changed your life?",
  },
  {
    key: "business",
    label: "Business Story",
    emoji: "💼",
    subjectHint: "e.g. My Salon in Atlanta, Starting a Food Truck in Philly",
    contextHint: "e.g. I launched my business in 2021 with $3,000",
    storyHint: "What's the real story? What do aspiring entrepreneurs need to hear?",
  },
  {
    key: "neighborhood",
    label: "Neighborhood / City",
    emoji: "🏙️",
    subjectHint: "e.g. South Side Chicago, Harlem NY, West Oakland",
    contextHint: "e.g. I've lived in Harlem my whole life (30+ years)",
    storyHint: "What do outsiders miss? What makes this neighborhood special?",
  },
  {
    key: "career",
    label: "Career Path",
    emoji: "🚀",
    subjectHint: "e.g. Breaking into Tech, Medicine as a Black Doctor",
    contextHint: "e.g. I've been a software engineer for 10 years at major tech companies",
    storyHint: "What doors did you have to push open? What advice do you wish you had?",
  },
  {
    key: "travel",
    label: "Travel / Relocation",
    emoji: "✈️",
    subjectHint: "e.g. Moving to Ghana, Lagos for Black Americans, Brazil",
    contextHint: "e.g. I relocated to Accra in 2022 and have been here 2 years",
    storyHint: "What do people need to know before they go? What surprised you?",
  },
  {
    key: "lifestyle",
    label: "Lifestyle / Culture",
    emoji: "🌱",
    subjectHint: "e.g. Plant-Based Living, Natural Hair Journey, Raising Black Kids",
    contextHint: "e.g. I've been plant-based for 8 years",
    storyHint: "What's your lived experience? What resources actually helped?",
  },
  {
    key: "general",
    label: "Something Else",
    emoji: "✨",
    subjectHint: "What is your guide about?",
    contextHint: "e.g. I've been doing this for X years",
    storyHint: "Share your story. Why does this guide matter?",
  },
];

const EMOJI_PICKS = ["🎓", "💊", "💼", "🏙️", "🚀", "✈️", "🌱", "✨", "🏥", "🍽️", "🏠", "🤝", "📚", "💰", "🎨", "🧘", "⚡", "🌍", "🎵", "🏋️"];

export default function CreateGuideScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [step, setStep] = useState<"type" | "form">("type");
  const [storyType, setStoryType] = useState<StoryType>(STORY_TYPES[0]);

  const [title, setTitle] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [experienceContext, setExperienceContext] = useState("");
  const [personalStory, setPersonalStory] = useState("");
  const [city, setCity] = useState("");
  const [subjectEmoji, setSubjectEmoji] = useState(STORY_TYPES[0].emoji);
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length >= 5 && subjectName.trim().length >= 2;

  const handleCreate = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Sign in required", "Please sign in to create a Pay It Forward guide.");
        setSaving(false);
        return;
      }
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/guides`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({
          title: title.trim(),
          subjectName: subjectName.trim(),
          storyType: storyType.key,
          subjectEmoji,
          experienceContext: experienceContext.trim() || undefined,
          personalStory: personalStory.trim() || undefined,
          city: city.trim() || undefined,
          isPublic,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        Alert.alert("Error", err.error ?? "Failed to create guide");
        return;
      }
      const data = await res.json() as { guide: { id: string } };
      router.replace({ pathname: "/guides/[id]", params: { id: data.guide.id } } as never);
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Step 1: Choose story type ──────────────────────────────────────────────
  if (step === "type") {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Pay It Forward</Text>
          </View>
          <Text style={[s.stepSub, { color: colors.mutedForeground }]}>What kind of guide are you creating?</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          <View style={[s.heroBanner, { backgroundColor: "#CA922B" + "18", borderColor: "#CA922B" + "40" }]}>
            <Text style={s.heroEmoji}>🕊️</Text>
            <Text style={[s.heroTitle, { color: colors.foreground }]}>Leave a legacy.</Text>
            <Text style={[s.heroSub, { color: colors.mutedForeground }]}>
              Your lived experience can guide thousands of people who come after you. A guide you create today keeps helping people for years.
            </Text>
          </View>

          <Text style={[s.label, { color: colors.mutedForeground, marginTop: 20 }]}>CHOOSE YOUR STORY TYPE</Text>
          {STORY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[s.typeCard, {
                backgroundColor: colors.card,
                borderColor: storyType.key === type.key ? "#CA922B" : colors.border,
                borderWidth: storyType.key === type.key ? 2 : 1,
              }]}
              onPress={() => { setStoryType(type); setSubjectEmoji(type.emoji); }}
              activeOpacity={0.75}
            >
              <Text style={s.typeEmoji}>{type.emoji}</Text>
              <Text style={[s.typeLabel, { color: colors.foreground }]}>{type.label}</Text>
              {storyType.key === type.key && (
                <Feather name="check-circle" size={18} color="#CA922B" />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: "#CA922B", marginTop: 20 }]}
            onPress={() => setStep("form")}
            activeOpacity={0.85}
          >
            <Text style={s.nextBtnTxt}>Continue with {storyType.emoji} {storyType.label}</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Step 2: Fill in guide details ──────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => setStep("type")} style={s.backBtn} activeOpacity={0.7}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>{storyType.emoji} {storyType.label}</Text>
            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: canSave ? "#CA922B" : colors.muted, opacity: saving ? 0.6 : 1 }]}
              onPress={handleCreate}
              disabled={!canSave || saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.saveTxt}>Publish</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        >
          {/* Emoji picker */}
          <Text style={[s.label, { color: colors.mutedForeground }]}>Guide Emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {EMOJI_PICKS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[s.emojiBtn, { backgroundColor: colors.card, borderColor: subjectEmoji === e ? "#CA922B" : colors.border }]}
                  onPress={() => setSubjectEmoji(e)}
                  activeOpacity={0.7}
                >
                  <Text style={s.emojiTxt}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Title */}
          <Text style={[s.label, { color: colors.mutedForeground }]}>Guide Title *</Text>
          <TextInput
            style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            placeholder={`e.g. My ${storyType.label} Guide`}
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />

          {/* Subject name */}
          <Text style={[s.label, { color: colors.mutedForeground }]}>Subject *</Text>
          <TextInput
            style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            placeholder={storyType.subjectHint}
            placeholderTextColor={colors.mutedForeground}
            value={subjectName}
            onChangeText={setSubjectName}
            maxLength={200}
          />

          {/* Experience context */}
          <Text style={[s.label, { color: colors.mutedForeground }]}>Your Context</Text>
          <TextInput
            style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            placeholder={storyType.contextHint}
            placeholderTextColor={colors.mutedForeground}
            value={experienceContext}
            onChangeText={setExperienceContext}
            maxLength={150}
          />
          <Text style={[s.hint, { color: colors.mutedForeground }]}>This shows under your name — e.g. "4 years at Howard" or "20 years managing diabetes"</Text>

          {/* Personal story */}
          <Text style={[s.label, { color: colors.mutedForeground }]}>Your Story</Text>
          <TextInput
            style={[s.input, s.multiline, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            placeholder={storyType.storyHint}
            placeholderTextColor={colors.mutedForeground}
            value={personalStory}
            onChangeText={setPersonalStory}
            maxLength={2000}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={[s.charCount, { color: colors.mutedForeground }]}>{personalStory.length}/2000</Text>

          {/* City */}
          <Text style={[s.label, { color: colors.mutedForeground }]}>City (optional)</Text>
          <TextInput
            style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            placeholder="e.g. Atlanta, GA"
            placeholderTextColor={colors.mutedForeground}
            value={city}
            onChangeText={setCity}
            maxLength={100}
          />

          {/* Visibility toggle */}
          <View style={[s.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.toggleLabel, { color: colors.foreground }]}>
                {isPublic ? "🌍 Share with the community" : "🔒 Keep private for now"}
              </Text>
              <Text style={[s.toggleSub, { color: colors.mutedForeground }]}>
                {isPublic
                  ? "Anyone can read and follow this guide"
                  : "Only you can see this — publish when ready"}
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: colors.muted, true: "#CA922B" }}
              thumbColor="#fff"
            />
          </View>

          <Text style={[s.footerNote, { color: colors.mutedForeground }]}>
            💡 After publishing, you can add sections and tips directly from the guide page. Start with the basics — you can always add more later.
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { padding: 6, marginLeft: -6 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700" },
  stepSub: { fontSize: 13, marginTop: 4 },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, minWidth: 80, alignItems: "center" },
  saveTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  heroBanner: { borderRadius: 18, borderWidth: 1, padding: 20, alignItems: "center", marginBottom: 8 },
  heroEmoji: { fontSize: 40, marginBottom: 10 },
  heroTitle: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  heroSub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 8, textTransform: "uppercase" },
  typeCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, marginBottom: 8 },
  typeEmoji: { fontSize: 24 },
  typeLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 24 },
  nextBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
  emojiBtn: { width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  emojiTxt: { fontSize: 22 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 4 },
  multiline: { minHeight: 110 },
  hint: { fontSize: 11, lineHeight: 16, marginBottom: 18 },
  charCount: { fontSize: 11, textAlign: "right", marginBottom: 18 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  toggleLabel: { fontSize: 15, fontWeight: "600", marginBottom: 3 },
  toggleSub: { fontSize: 12 },
  footerNote: { fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 4 },
});
