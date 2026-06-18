import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  { id: "service", label: "Service" },
  { id: "quality", label: "Quality" },
  { id: "atmosphere", label: "Atmosphere" },
  { id: "value", label: "Value" },
];

function StarRow({
  rating,
  onChange,
  size = 28,
  color,
}: {
  rating: number;
  onChange: (r: number) => void;
  size?: number;
  color: string;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity
          key={i}
          onPress={() => {
            onChange(i);
            if (Platform.OS !== "web") Haptics.selectionAsync();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Feather
            name={i <= rating ? "star" : "star"}
            size={size}
            color={i <= rating ? color : "#E8DDD0"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function WriteReviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ businessId?: string; businessName?: string }>();

  const businessName = params.businessName ?? "Sweet Auburn BBQ";

  const [overall, setOverall] = useState(0);
  const [catRatings, setCatRatings] = useState<Record<string, number>>({
    service: 0, quality: 0, atmosphere: 0, value: 0,
  });
  const [reviewText, setReviewText] = useState("");
  const [feltSafe, setFeltSafe] = useState<boolean | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const canSubmit = overall > 0 && reviewText.trim().length >= 10 && feltSafe !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
    await new Promise((r) => setTimeout(r, 1200));
    router.canGoBack() ? router.back() : router.replace("/(tabs)");
  };

  if (submitted) {
    return (
      <View style={[styles.root, styles.successRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.successIcon, { backgroundColor: colors.success + "18" }]}>
          <Feather name="check-circle" size={52} color={colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>Review Posted!</Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          Thank you for helping the community
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Write a Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.businessChip, { backgroundColor: colors.secondary }]}>
          <Feather name="map-pin" size={14} color={colors.primary} />
          <Text style={[styles.businessChipTxt, { color: colors.foreground }]}>{businessName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Overall Rating</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>How was your overall experience?</Text>
          <StarRow rating={overall} onChange={setOverall} size={40} color={colors.primary} />
          {overall > 0 && (
            <Text style={[styles.ratingLabel, { color: colors.primary }]}>
              {["", "Poor", "Fair", "Good", "Great", "Excellent!"][overall]}
            </Text>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rate by Category</Text>
          {CATEGORIES.map((cat) => (
            <View key={cat.id} style={styles.catRow}>
              <Text style={[styles.catLabel, { color: colors.foreground }]}>{cat.label}</Text>
              <StarRow
                rating={catRatings[cat.id]}
                onChange={(r) => setCatRatings((prev) => ({ ...prev, [cat.id]: r }))}
                size={22}
                color={colors.accent}
              />
            </View>
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Review</Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Share your experience to help the community…"
            placeholderTextColor={colors.mutedForeground}
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: reviewText.length < 10 && reviewText.length > 0 ? colors.destructive : colors.mutedForeground }]}>
            {reviewText.length} characters {reviewText.length < 10 && reviewText.length > 0 ? "(min 10)" : ""}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Safety Experience</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Did you feel welcomed and safe here?
          </Text>
          <View style={styles.safetyRow}>
            {[true, false].map((val) => (
              <TouchableOpacity
                key={String(val)}
                style={[
                  styles.safetyBtn,
                  {
                    backgroundColor: feltSafe === val ? (val ? colors.success : colors.destructive) : colors.card,
                    borderColor: feltSafe === val ? (val ? colors.success : colors.destructive) : colors.border,
                  },
                ]}
                onPress={() => {
                  setFeltSafe(val);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
                activeOpacity={0.8}
              >
                <Feather
                  name={val ? "check-circle" : "alert-circle"}
                  size={18}
                  color={feltSafe === val ? "#FFF" : colors.mutedForeground}
                />
                <Text style={[styles.safetyBtnTxt, { color: feltSafe === val ? "#FFF" : colors.foreground }]}>
                  {val ? "Yes, felt safe" : "No, concerns"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIsAnonymous(!isAnonymous)}
            activeOpacity={0.75}
          >
            <View>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Post Anonymously</Text>
              <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>Your name won't be shown</Text>
            </View>
            <View
              style={[
                styles.toggleSwitch,
                { backgroundColor: isAnonymous ? colors.primary : colors.border },
              ]}
            >
              <View style={[styles.toggleThumb, { transform: [{ translateX: isAnonymous ? 20 : 2 }] }]} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: canSubmit ? colors.primary : colors.muted }]}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
          activeOpacity={0.85}
        >
          <Feather name="send" size={16} color={canSubmit ? colors.primaryForeground : colors.mutedForeground} />
          <Text style={[styles.submitTxt, { color: canSubmit ? colors.primaryForeground : colors.mutedForeground }]}>
            {loading ? "Posting…" : "Post Review"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  successRoot: { alignItems: "center", justifyContent: "center", gap: 16 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 15, fontFamily: "Inter_400Regular" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20 },
  businessChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, marginBottom: 20,
  },
  businessChipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  section: { paddingVertical: 20, gap: 14 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  ratingLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1 },
  catRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catLabel: { fontSize: 15, fontFamily: "Inter_400Regular", width: 90 },
  textArea: {
    borderWidth: 1, borderRadius: 14, padding: 14,
    fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 120,
  },
  charCount: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  safetyRow: { flexDirection: "row", gap: 12 },
  safetyBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
  },
  safetyBtnTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  toggleSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  toggleSwitch: {
    width: 46, height: 26, borderRadius: 13, justifyContent: "center",
  },
  toggleThumb: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFF",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 17, borderRadius: 14,
  },
  submitTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
