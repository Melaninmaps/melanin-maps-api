import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import { useShowLove, createShowLoveNomination, type ShowLoveNomination } from "@/hooks/useShowLove";
import { ShowLoveCard } from "@/components/ShowLoveCard";

const NOMINEE_TYPES = [
  { value: "person", label: "Person / Creator" },
  { value: "business", label: "Small Business" },
  { value: "organization", label: "Organization / Nonprofit" },
  { value: "event", label: "Event" },
  { value: "artist", label: "Artist / Musician" },
];

const CATEGORIES = [
  { value: "food", label: "Great Food" },
  { value: "community_service", label: "Community Service" },
  { value: "education", label: "Educational Content" },
  { value: "travel", label: "Travel" },
  { value: "fitness", label: "Fitness" },
  { value: "beauty", label: "Beauty" },
  { value: "parenting", label: "Parenting" },
  { value: "financial_education", label: "Financial Education" },
  { value: "entrepreneurship", label: "Entrepreneurship" },
  { value: "arts_culture", label: "Arts & Culture" },
  { value: "advocacy", label: "Local Advocacy" },
  { value: "music", label: "Music" },
  { value: "photography", label: "Photography" },
  { value: "mentorship", label: "Mentorship" },
  { value: "coaching", label: "Coaching" },
  { value: "other", label: "Other" },
];

const WHAT_KNOWN_FOR_OPTIONS = [
  "Great food", "Community service", "Educational content", "Travel guides",
  "Fitness", "Beauty & grooming", "Parenting", "Financial education",
  "Entrepreneurship", "Arts & Culture", "Local advocacy", "Hidden gems",
  "Supporting locals", "Mentorship", "Storytelling",
];

const FILTER_TYPES = [
  { value: "", label: "All" },
  { value: "person", label: "People" },
  { value: "business", label: "Businesses" },
  { value: "organization", label: "Organizations" },
  { value: "artist", label: "Artists" },
];

export default function ShowLoveScreen() {
  const { colors, isDark } = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [filterType, setFilterType] = useState("");
  const { nominations, isLoading, refetch } = useShowLove({ nomineeType: filterType || undefined });
  const [localNominations, setLocalNominations] = useState<ShowLoveNomination[]>([]);
  const displayNominations = localNominations.length > 0 ? localNominations : nominations;

  React.useEffect(() => {
    setLocalNominations(nominations);
  }, [nominations]);

  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [nomineeType, setNomineeType] = useState("person");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeHandle, setNomineeHandle] = useState("");
  const [nomineeCity, setNomineeCity] = useState("");
  const [category, setCategory] = useState("");
  const [whatKnownFor, setWhatKnownFor] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [experience, setExperience] = useState("");

  const resetForm = () => {
    setStep(1);
    setNomineeType("person");
    setNomineeName("");
    setNomineeHandle("");
    setNomineeCity("");
    setCategory("");
    setWhatKnownFor([]);
    setReason("");
    setExperience("");
  };

  const handleSubmit = async () => {
    if (!reason.trim() || reason.length < 20) {
      Alert.alert("More detail needed", "Please write at least 20 characters explaining why you're showing love.");
      return;
    }
    setIsSubmitting(true);
    const result = await createShowLoveNomination({
      nomineeName: nomineeName.trim(),
      nomineeType,
      nomineeHandle: nomineeHandle.trim() || undefined,
      category,
      whatKnownFor,
      reason: reason.trim(),
      experience: experience.trim() || undefined,
      city: nomineeCity.trim() || undefined,
    });
    setIsSubmitting(false);
    if (result.ok) {
      setShowForm(false);
      resetForm();
      refetch();
      Alert.alert("Show Love Sent!", "Your recognition has been shared with the community.");
    } else {
      Alert.alert("Error", result.error ?? "Failed to submit. Please try again.");
    }
  };

  const toggleKnownFor = (tag: string) => {
    setWhatKnownFor((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const canProceedStep1 = nomineeName.trim().length > 0;
  const canProceedStep2 = category.length > 0;
  const canSubmitStep3 = reason.trim().length >= 20;

  const bg = isDark ? colors.background : "#FFFDF9";

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Show Love</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Celebrate the people making a difference</Text>
        </View>
        {user ? (
          <Pressable
            onPress={() => { resetForm(); setShowForm(true); }}
            style={[styles.showLoveBtn, { backgroundColor: "#CA922B" }]}
          >
            <Feather name="heart" size={14} color="#FFF" />
            <Text style={styles.showLoveBtnText}>Show Love</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_TYPES.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setFilterType(f.value)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filterType === f.value ? "#CA922B" : (isDark ? "rgba(202,146,43,0.1)" : "rgba(202,146,43,0.08)"),
                borderColor: filterType === f.value ? "#CA922B" : "rgba(202,146,43,0.3)",
              },
            ]}
          >
            <Text style={[styles.filterChipText, { color: filterType === f.value ? "#FFF" : "#A6720F" }]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Feed */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color="#CA922B" />
        </View>
      ) : displayNominations.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="heart" size={40} color="#CA922B" style={{ opacity: 0.4 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No nominations yet</Text>
          <Text style={[styles.emptyBody, { color: colors.muted }]}>
            Be the first to recognize someone making a difference.
          </Text>
          {user ? (
            <Pressable
              onPress={() => { resetForm(); setShowForm(true); }}
              style={[styles.emptyCTA, { backgroundColor: "#CA922B" }]}
            >
              <Text style={styles.emptyCTAText}>Show Love First</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={displayNominations}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ShowLoveCard
              nomination={item}
              onReactionChange={(updated) => {
                setLocalNominations((prev) =>
                  prev.map((n) => (n.id === updated.id ? updated : n))
                );
              }}
            />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Nomination modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={[styles.modalRoot, { backgroundColor: bg }]}>
            {/* Modal header */}
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }]}>
              <Pressable onPress={() => { setShowForm(false); resetForm(); }}>
                <Feather name="x" size={22} color={colors.text} />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {step === 1 ? "Who are you recognizing?" : step === 2 ? "What are they known for?" : "Why are you showing love?"}
              </Text>
              <View style={{ width: 22 }} />
            </View>

            {/* Step indicator */}
            <View style={styles.stepRow}>
              {[1, 2, 3].map((s) => (
                <View key={s} style={[styles.stepDot, { backgroundColor: step >= s ? "#CA922B" : (isDark ? "rgba(255,255,255,0.15)" : "#E8DDC8") }]} />
              ))}
            </View>

            <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
              {step === 1 && (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Type of recognition</Text>
                  <View style={styles.typeGrid}>
                    {NOMINEE_TYPES.map((t) => (
                      <Pressable
                        key={t.value}
                        onPress={() => setNomineeType(t.value)}
                        style={[
                          styles.typeOption,
                          {
                            backgroundColor: nomineeType === t.value ? "rgba(202,146,43,0.15)" : (isDark ? "rgba(255,255,255,0.05)" : "#F5F0E8"),
                            borderColor: nomineeType === t.value ? "#CA922B" : (isDark ? "rgba(255,255,255,0.1)" : "#E8DDC8"),
                          },
                        ]}
                      >
                        <Text style={[styles.typeOptionText, { color: nomineeType === t.value ? "#CA922B" : colors.text }]}>
                          {t.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { color: colors.muted, marginTop: 20 }]}>Their name *</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F5F0E8", borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E8DDC8" }]}
                    placeholder="Full name, business name, or creator name"
                    placeholderTextColor={colors.muted}
                    value={nomineeName}
                    onChangeText={setNomineeName}
                    maxLength={200}
                  />

                  <Text style={[styles.fieldLabel, { color: colors.muted, marginTop: 16 }]}>Handle or username (optional)</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F5F0E8", borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E8DDC8" }]}
                    placeholder="@handle or @username"
                    placeholderTextColor={colors.muted}
                    value={nomineeHandle}
                    onChangeText={setNomineeHandle}
                    autoCapitalize="none"
                    maxLength={100}
                  />

                  <Text style={[styles.fieldLabel, { color: colors.muted, marginTop: 16 }]}>City (optional)</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F5F0E8", borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E8DDC8" }]}
                    placeholder="Washington DC, Atlanta, Lagos..."
                    placeholderTextColor={colors.muted}
                    value={nomineeCity}
                    onChangeText={setNomineeCity}
                    maxLength={100}
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Category *</Text>
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map((c) => (
                      <Pressable
                        key={c.value}
                        onPress={() => setCategory(c.value)}
                        style={[
                          styles.categoryOption,
                          {
                            backgroundColor: category === c.value ? "#CA922B" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(202,146,43,0.08)"),
                            borderColor: category === c.value ? "#CA922B" : "rgba(202,146,43,0.25)",
                          },
                        ]}
                      >
                        <Text style={[styles.categoryOptionText, { color: category === c.value ? "#FFF" : "#A6720F" }]}>
                          {c.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { color: colors.muted, marginTop: 20 }]}>What are they known for? (optional)</Text>
                  <Text style={[styles.fieldHint, { color: colors.muted }]}>Select all that apply</Text>
                  <View style={styles.tagsGrid}>
                    {WHAT_KNOWN_FOR_OPTIONS.map((tag) => (
                      <Pressable
                        key={tag}
                        onPress={() => toggleKnownFor(tag)}
                        style={[
                          styles.tagChip,
                          {
                            backgroundColor: whatKnownFor.includes(tag) ? "rgba(202,146,43,0.15)" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(202,146,43,0.06)"),
                            borderColor: whatKnownFor.includes(tag) ? "#CA922B" : "rgba(202,146,43,0.25)",
                          },
                        ]}
                      >
                        <Text style={[styles.tagChipText, { color: whatKnownFor.includes(tag) ? "#CA922B" : colors.muted }]}>
                          {tag}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {step === 3 && (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Why are you showing love? *</Text>
                  <Text style={[styles.fieldHint, { color: colors.muted }]}>20–500 characters · Be thoughtful and specific</Text>
                  <TextInput
                    style={[styles.textarea, { color: colors.text, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F5F0E8", borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E8DDC8" }]}
                    placeholder={`Tell the community why ${nomineeName || "this person"} deserves recognition...`}
                    placeholderTextColor={colors.muted}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                  />
                  <Text style={[styles.charCount, { color: reason.length < 20 ? "#E57373" : colors.muted }]}>
                    {reason.length}/500
                  </Text>

                  <Text style={[styles.fieldLabel, { color: colors.muted, marginTop: 20 }]}>Share a memorable experience (optional)</Text>
                  <Text style={[styles.fieldHint, { color: colors.muted }]}>A story is worth a thousand likes</Text>
                  <TextInput
                    style={[styles.textarea, { color: colors.text, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F5F0E8", borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E8DDC8", minHeight: 80 }]}
                    placeholder="She introduced me to my favorite bookstore in the neighborhood..."
                    placeholderTextColor={colors.muted}
                    value={experience}
                    onChangeText={setExperience}
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                  />
                </>
              )}
            </ScrollView>

            {/* Navigation buttons */}
            <View style={[styles.formFooter, { borderTopColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", paddingBottom: insets.bottom + 16 }]}>
              {step > 1 && (
                <Pressable onPress={() => setStep((s) => s - 1)} style={[styles.backFormBtn, { borderColor: isDark ? "rgba(255,255,255,0.15)" : "#E8DDC8" }]}>
                  <Text style={[styles.backFormBtnText, { color: colors.muted }]}>Back</Text>
                </Pressable>
              )}
              {step < 3 ? (
                <Pressable
                  onPress={() => setStep((s) => s + 1)}
                  disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                  style={[
                    styles.nextBtn,
                    {
                      backgroundColor: (step === 1 ? canProceedStep1 : canProceedStep2) ? "#CA922B" : (isDark ? "rgba(255,255,255,0.1)" : "#E8DDC8"),
                      flex: step > 1 ? 1 : undefined,
                    },
                  ]}
                >
                  <Text style={[styles.nextBtnText, { color: (step === 1 ? canProceedStep1 : canProceedStep2) ? "#FFF" : colors.muted }]}>
                    Next
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleSubmit}
                  disabled={!canSubmitStep3 || isSubmitting}
                  style={[styles.nextBtn, { backgroundColor: canSubmitStep3 ? "#CA922B" : (isDark ? "rgba(255,255,255,0.1)" : "#E8DDC8"), flex: 1 }]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={[styles.nextBtnText, { color: canSubmitStep3 ? "#FFF" : colors.muted }]}>
                      Send Love
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 1 },
  showLoveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  showLoveBtnText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: "row" },
  filterChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  filterChipText: { fontSize: 12, fontWeight: "700" },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyCTA: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 8 },
  emptyCTAText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 15, fontWeight: "700" },
  stepRow: { flexDirection: "row", gap: 6, paddingHorizontal: 20, paddingVertical: 12 },
  stepDot: { height: 4, flex: 1, borderRadius: 2 },
  formContent: { padding: 20, paddingBottom: 40 },
  fieldLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldHint: { fontSize: 12, marginBottom: 10, marginTop: -4 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textarea: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 120,
    lineHeight: 20,
  },
  charCount: { fontSize: 11, textAlign: "right", marginTop: 4 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeOption: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  typeOptionText: { fontSize: 13, fontWeight: "600" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryOption: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  categoryOptionText: { fontSize: 12, fontWeight: "700" },
  tagsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  tagChipText: { fontSize: 11, fontWeight: "600" },
  formFooter: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  backFormBtn: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  backFormBtnText: { fontSize: 14, fontWeight: "600" },
  nextBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  nextBtnText: { fontSize: 15, fontWeight: "800" },
});
