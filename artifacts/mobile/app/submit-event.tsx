import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function authHeaders(): Promise<Record<string, string>> {
  try {
    if (Platform.OS === "web") return {};
    const token = await SecureStore.getItemAsync("auth_session_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

const EVENT_CATEGORIES = [
  "Cultural", "Music", "Food & Drink", "Business & Networking",
  "Art & Gallery", "Health & Wellness", "Education", "Festival",
  "Faith & Spirituality", "Sports & Fitness", "Social", "Other",
];

const CITIES = [
  "Atlanta", "Houston", "Chicago", "Washington DC", "New York",
  "New Orleans", "Los Angeles", "Miami", "Dallas", "Philadelphia",
  "Detroit", "Baltimore", "Memphis", "Charlotte", "Birmingham",
  "Jackson", "Richmond", "Raleigh", "Nashville", "Other",
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
  "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
  "TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

function ChipGroup({ options, value, onChange, color, colors }: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  color: string;
  colors: any;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
      {options.map((opt) => {
        const on = value === opt;
        return (
          <TouchableOpacity activeOpacity={0.85}
            key={opt}
            onPress={() => { onChange(opt); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
            style={[s.chip, { backgroundColor: on ? color : colors.secondary, borderColor: on ? color : colors.border }]}
          >
            <Text style={[s.chipTxt, { color: on ? colors.primaryForeground : colors.foreground }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function SubmitEventScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Step 1 — Event Info
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Step 2 — Location
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [venue, setVenue] = useState("");

  // Step 3 — Details
  const [description, setDescription] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");

  const totalSteps = 3;

  const stepLabel = step === 1 ? "Event Info" : step === 2 ? "Location" : "Details";

  const canProceed = () => {
    if (step === 1) return title.trim().length >= 3 && category.length > 0 && date.trim().length >= 4;
    if (step === 2) return city.length > 0 && state.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const headers = await authHeaders();
      const apiBase = getApiBase();
      const body = {
        title: title.trim(),
        category,
        date: date.trim(),
        dateShort: date.trim().slice(0, 8),
        time: time.trim() || undefined,
        city,
        state,
        location: venue.trim() || undefined,
        description: description.trim() || undefined,
        organizer: organizer.trim() || undefined,
        isFree,
        price: isFree ? "Free" : price.trim() || "Paid",
      };
      const res = await fetch(`${apiBase}/api/events`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string; code?: string };
        if (err.code === "TIER_LIMIT_REACHED") {
          router.push("/membership");
          return;
        }
        throw new Error(err.error ?? "Submission failed");
      }
      setSubmitted(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <View style={s.doneWrap}>
          <View style={[s.doneCircle, { backgroundColor: colors.primary + "18" }]}>
            <Text style={{ fontSize: 52 }}>🎉</Text>
          </View>
          <Text style={[s.doneTitle, { color: colors.foreground }]}>Event Submitted!</Text>
          <Text style={[s.doneSub, { color: colors.mutedForeground }]}>
            Your event is now live in the community. Members whose interests match will see it at the top of their Events feed.
          </Text>
          <TouchableOpacity activeOpacity={0.85}
            style={[s.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/community")}
          >
            <Text style={[s.doneBtnTxt, { color: colors.primaryForeground }]}>Back to Community</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={s.back} onPress={() => step > 1 ? setStep(p => p - 1) : router.canGoBack() ? router.back() : router.replace("/(tabs)/community")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Host an Event</Text>
          <Text style={[s.headerStep, { color: colors.mutedForeground }]}>{stepLabel} · Step {step} of {totalSteps}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[s.progressTrack, { backgroundColor: colors.secondary }]}>
        <View style={[s.progressFill, { backgroundColor: colors.primary, width: `${(step / totalSteps) * 100}%` as any }]} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[s.scroll, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Step 1: Event Info ── */}
        {step === 1 && (
          <View style={s.stepContent}>
            <View style={[s.iconBanner, { backgroundColor: colors.primary + "12" }]}>
              <Text style={{ fontSize: 36 }}>📅</Text>
            </View>
            <Text style={[s.stepTitle, { color: colors.foreground }]}>Tell us about the event</Text>
            <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
              Events you add are shown to community members whose interests match — the most relevant rise to the top.
            </Text>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Event title <Text style={{ color: colors.accent }}>*</Text></Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. Juneteenth Block Party, Black Business Expo"
                placeholderTextColor={colors.mutedForeground}
                value={title}
                onChangeText={setTitle}
                autoCapitalize="words"
              />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Category <Text style={{ color: colors.accent }}>*</Text></Text>
              <ChipGroup options={EVENT_CATEGORIES} value={category} onChange={setCategory} color={colors.primary} colors={colors} />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Date <Text style={{ color: colors.accent }}>*</Text></Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. July 19, 2025"
                placeholderTextColor={colors.mutedForeground}
                value={date}
                onChangeText={setDate}
              />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Time <Text style={[{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>(optional)</Text></Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. 2:00 PM – 7:00 PM"
                placeholderTextColor={colors.mutedForeground}
                value={time}
                onChangeText={setTime}
              />
            </View>
          </View>
        )}

        {/* ── Step 2: Location ── */}
        {step === 2 && (
          <View style={s.stepContent}>
            <Text style={[s.stepTitle, { color: colors.foreground }]}>📍 Where is it happening?</Text>
            <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
              Location helps community members in that area find your event.
            </Text>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>City <Text style={{ color: colors.accent }}>*</Text></Text>
              <ChipGroup options={CITIES} value={city} onChange={setCity} color={colors.primary} colors={colors} />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>State <Text style={{ color: colors.accent }}>*</Text></Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {US_STATES.map((st) => {
                  const on = state === st;
                  return (
                    <TouchableOpacity activeOpacity={0.85}
                      key={st}
                      onPress={() => { setState(st); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                      style={[s.stateChip, { backgroundColor: on ? colors.primary : colors.secondary, borderColor: on ? colors.primary : colors.border }]}
                    >
                      <Text style={[s.stateChipTxt, { color: on ? colors.primaryForeground : colors.foreground }]}>{st}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Venue / Address <Text style={[{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>(optional)</Text></Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. Historic Fourth Ward Park, 680 Dallas St"
                placeholderTextColor={colors.mutedForeground}
                value={venue}
                onChangeText={setVenue}
              />
            </View>
          </View>
        )}

        {/* ── Step 3: Details ── */}
        {step === 3 && (
          <View style={s.stepContent}>
            <Text style={[s.stepTitle, { color: colors.foreground }]}>✨ Final details</Text>
            <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
              A great description helps community members decide if this event is for them.
            </Text>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Description <Text style={[{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>(optional)</Text></Text>
              <TextInput
                style={[s.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="What can attendees expect? Who is it for? What makes it special?"
                placeholderTextColor={colors.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
              />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Organizer / Host name <Text style={[{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>(optional)</Text></Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Your name, org, or community group"
                placeholderTextColor={colors.mutedForeground}
                value={organizer}
                onChangeText={setOrganizer}
              />
            </View>

            <View style={s.qBlock}>
              <Text style={[s.qLabel, { color: colors.foreground }]}>Is this event free?</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
                <Switch
                  value={isFree}
                  onValueChange={setIsFree}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={isFree ? colors.primaryForeground : colors.mutedForeground}
                />
                <Text style={[s.switchLabel, { color: colors.foreground }]}>{isFree ? "Free to attend" : "Paid event"}</Text>
              </View>
              {!isFree && (
                <TextInput
                  style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 10 }]}
                  placeholder="e.g. $10, $25–$50"
                  placeholderTextColor={colors.mutedForeground}
                  value={price}
                  onChangeText={setPrice}
                />
              )}
            </View>

            <View style={[s.reviewBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.reviewLabel, { color: colors.mutedForeground }]}>Review</Text>
              <Text style={[s.reviewTitle, { color: colors.foreground }]}>{title}</Text>
              <Text style={[s.reviewMeta, { color: colors.mutedForeground }]}>
                {category} · {date}{time ? ` · ${time}` : ""}
              </Text>
              <Text style={[s.reviewMeta, { color: colors.mutedForeground }]}>
                {venue ? `${venue}, ` : ""}{city}, {state}
              </Text>
              <Text style={[s.reviewMeta, { color: colors.mutedForeground }]}>
                {isFree ? "Free" : price || "Paid"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: bottomPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {step < totalSteps ? (
          <TouchableOpacity activeOpacity={0.85}
            style={[s.nextBtn, { backgroundColor: canProceed() ? colors.primary : colors.muted }]}
            onPress={() => { setStep(p => p + 1); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            disabled={!canProceed()}
          >
            <Text style={[s.nextTxt, { color: canProceed() ? colors.primaryForeground : colors.mutedForeground }]}>Continue</Text>
            <Feather name="arrow-right" size={18} color={canProceed() ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.85}
            style={[s.nextBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color={colors.primaryForeground} />
              : <>
                  <Feather name="calendar" size={18} color={colors.primaryForeground} />
                  <Text style={[s.nextTxt, { color: colors.primaryForeground }]}>Submit Event</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>
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
  iconBanner: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30 },
  stepSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginTop: -10 },
  qBlock: { gap: 6 },
  qLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 110, textAlignVertical: "top" },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  stateChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  stateChipTxt: { fontSize: 12, fontFamily: "Inter_500Medium" },
  switchLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  reviewBox: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 4 },
  reviewLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  reviewTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  reviewMeta: { fontSize: 13, fontFamily: "Inter_400Regular" },
  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 17, borderRadius: 16 },
  nextTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 20 },
  doneCircle: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  doneSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24 },
  doneBtn: { alignItems: "center", paddingVertical: 17, paddingHorizontal: 48, borderRadius: 16 },
  doneBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
