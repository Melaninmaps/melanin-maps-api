import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

function getApiBase() { return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""; }
async function getToken() { try { return Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token"); } catch { return null; } }
async function authHeaders(): Promise<Record<string, string>> { const t = await getToken(); return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }; }

type TravelStyle = "budget" | "mid-range" | "luxury";
type Interest = "food" | "nightlife" | "history" | "art" | "shopping" | "nature" | "music" | "wellness";

interface DayActivity {
  time: string; title: string; description: string;
  type: string; businessName?: string | null; businessType?: string | null;
  tip?: string | null; isBlackOwned?: boolean;
}
interface ItineraryDay { day: number; theme: string; activities: DayActivity[]; }
interface TravelItinerary {
  destination: string; totalDays: number; overview: string;
  highlights: string[]; days: ItineraryDay[];
  safetyNote: string; packingTips: string[];
}

const TRIP_DURATIONS = [
  { value: 3, label: "Weekend\nGetaway", sub: "3 days" },
  { value: 5, label: "Extended\nTrip", sub: "5 days" },
  { value: 7, label: "Week\nVacation", sub: "7 days" },
  { value: 10, label: "Grand\nAdventure", sub: "10 days" },
];

const STYLES: { value: TravelStyle; emoji: string; label: string; sub: string }[] = [
  { value: "budget", emoji: "🎒", label: "Budget", sub: "Stretch every dollar" },
  { value: "mid-range", emoji: "✈️", label: "Balanced", sub: "Comfort without excess" },
  { value: "luxury", emoji: "👑", label: "Luxury", sub: "Treat yourself" },
];

const INTERESTS: { value: Interest; emoji: string; label: string }[] = [
  { value: "food", emoji: "🍽️", label: "Food" },
  { value: "nightlife", emoji: "🎵", label: "Nightlife" },
  { value: "history", emoji: "🏛️", label: "History" },
  { value: "art", emoji: "🎨", label: "Art" },
  { value: "shopping", emoji: "🛍️", label: "Shopping" },
  { value: "nature", emoji: "🌿", label: "Nature" },
  { value: "music", emoji: "🎤", label: "Music" },
  { value: "wellness", emoji: "🧘", label: "Wellness" },
];

const ACTIVITY_ICON: Record<string, string> = {
  breakfast: "☕", lunch: "🍽️", dinner: "🌙", attraction: "🏛️",
  shopping: "🛍️", experience: "⭐", rest: "😌", nightlife: "🎵",
};

export default function TravelPlannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [phase, setPhase] = useState<"form" | "generating" | "result">("form");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(5);
  const [style, setStyle] = useState<TravelStyle>("mid-range");
  const [interests, setInterests] = useState<Interest[]>(["food", "history"]);
  const [itinerary, setItinerary] = useState<TravelItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  function toggleInterest(i: Interest) {
    setInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  }

  async function generate() {
    if (!destination.trim()) return;
    setPhase("generating");
    setError(null);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/travel-planner/generate`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ destination: destination.trim(), days, style, interests }),
      });
      if (!res.ok) { setError("Could not generate itinerary. Try again."); setPhase("form"); return; }
      const data = await res.json() as { itinerary: TravelItinerary };
      setItinerary(data.itinerary);
      setPhase("result");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { setError("Connection error. Check your network and try again."); setPhase("form"); }
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: "#1A3B2B", borderBottomColor: "#2D7A4F55" }]}>
        <TouchableOpacity onPress={() => phase === "result" ? setPhase("form") : router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: "#FFFFFF" }]}>
            {phase === "result" ? itinerary?.destination ?? "Your Itinerary" : "AI Travel Planner"}
          </Text>
          <Text style={[s.headerSub, { color: "rgba(255,255,255,0.7)" }]}>
            {phase === "result" ? `${itinerary?.totalDays}-day trip · Powered by KinfolkAI` : "Powered by KinfolkAI · Centers Black culture"}
          </Text>
        </View>
        {phase === "result" && (
          <TouchableOpacity style={s.replanBtn} onPress={() => setPhase("form")} activeOpacity={0.8}>
            <Feather name="refresh-cw" size={15} color="#FFFFFF" />
            <Text style={s.replanTxt}>Replan</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── FORM PHASE ─── */}
      {(phase === "form" || phase === "generating") && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 48 }} keyboardShouldPersistTaps="handled">

            {error && (
              <View style={[s.errorBanner, { backgroundColor: "#DC262615", borderColor: "#DC262640" }]}>
                <Feather name="alert-circle" size={14} color="#DC2626" />
                <Text style={[s.errorTxt, { color: "#DC2626" }]}>{error}</Text>
              </View>
            )}

            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Where are you going?</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={destination}
              onChangeText={setDestination}
              placeholder="e.g. Atlanta, GA  or  Accra, Ghana"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
              returnKeyType="done"
            />

            <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginTop: 20 }]}>How long?</Text>
            <View style={s.durationRow}>
              {TRIP_DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[s.durationCard, { borderColor: days === d.value ? "#2D7A4F" : colors.border, backgroundColor: days === d.value ? "#2D7A4F18" : colors.card }]}
                  onPress={() => setDays(d.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.durationLabel, { color: days === d.value ? "#2D7A4F" : colors.foreground }]}>{d.label}</Text>
                  <Text style={[s.durationSub, { color: days === d.value ? "#2D7A4F" : colors.mutedForeground }]}>{d.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Travel style</Text>
            <View style={s.styleRow}>
              {STYLES.map((st) => (
                <TouchableOpacity
                  key={st.value}
                  style={[s.styleCard, { borderColor: style === st.value ? "#CA922B" : colors.border, backgroundColor: style === st.value ? "#CA922B18" : colors.card }]}
                  onPress={() => setStyle(st.value)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 22 }}>{st.emoji}</Text>
                  <Text style={[s.styleLabel, { color: style === st.value ? "#CA922B" : colors.foreground }]}>{st.label}</Text>
                  <Text style={[s.styleSub, { color: colors.mutedForeground }]}>{st.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginTop: 20 }]}>What do you love? <Text style={{ color: colors.mutedForeground + "88" }}>(pick any)</Text></Text>
            <View style={s.interestsGrid}>
              {INTERESTS.map((i) => {
                const active = interests.includes(i.value);
                return (
                  <TouchableOpacity
                    key={i.value}
                    style={[s.interestChip, { borderColor: active ? "#2D7A4F" : colors.border, backgroundColor: active ? "#2D7A4F18" : colors.card }]}
                    onPress={() => toggleInterest(i.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 16 }}>{i.emoji}</Text>
                    <Text style={[s.interestLabel, { color: active ? "#2D7A4F" : colors.foreground }]}>{i.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[s.generateBtn, { backgroundColor: "#2D7A4F", opacity: destination.trim() ? 1 : 0.5 }]}
              onPress={generate}
              disabled={!destination.trim() || phase === "generating"}
              activeOpacity={0.85}
            >
              {phase === "generating" ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={s.generateBtnTxt}>KinfolkAI is planning your trip…</Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Feather name="map" size={18} color="#fff" />
                  <Text style={s.generateBtnTxt}>Generate My Itinerary</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[s.disclaimer, { color: colors.mutedForeground }]}>
              KinfolkAI centers Black-owned businesses, historically Black neighborhoods, and culturally rich experiences in every itinerary.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ─── RESULT PHASE ─── */}
      {phase === "result" && itinerary && (
        <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}>

          {/* Overview hero */}
          <View style={[s.overviewCard, { backgroundColor: "#1A3B2B" }]}>
            <Text style={s.overviewText}>{itinerary.overview}</Text>
            <View style={s.highlightsList}>
              {itinerary.highlights.map((h, i) => (
                <View key={i} style={s.highlightRow}>
                  <Text style={s.highlightDot}>✦</Text>
                  <Text style={s.highlightTxt}>{h}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Safety note */}
          {itinerary.safetyNote && (
            <View style={[s.safetyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.safetyHeader}>
                <Feather name="shield" size={14} color="#2D7A4F" />
                <Text style={[s.safetyLabel, { color: "#2D7A4F" }]}>Safety & Context</Text>
              </View>
              <Text style={[s.safetyTxt, { color: colors.mutedForeground }]}>{itinerary.safetyNote}</Text>
            </View>
          )}

          {/* Day-by-day */}
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <Text style={[s.sectionHeading, { color: colors.foreground }]}>Your Itinerary</Text>
            {itinerary.days.map((day) => {
              const expanded = expandedDay === day.day - 1;
              return (
                <View key={day.day} style={[s.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={s.dayHeader}
                    onPress={() => setExpandedDay(expanded ? null : day.day - 1)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.dayBadge, { backgroundColor: "#2D7A4F" }]}>
                      <Text style={s.dayBadgeTxt}>Day {day.day}</Text>
                    </View>
                    <Text style={[s.dayTheme, { color: colors.foreground, flex: 1 }]}>{day.theme}</Text>
                    <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>

                  {expanded && (
                    <View style={s.dayBody}>
                      {day.activities.map((act, ai) => (
                        <View key={ai} style={[s.activityRow, ai < day.activities.length - 1 && s.activityBorder, { borderColor: colors.border }]}>
                          <View style={s.activityLeft}>
                            <Text style={s.activityTime}>{act.time}</Text>
                            <Text style={s.activityTypeEmoji}>{ACTIVITY_ICON[act.type] ?? "📍"}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={s.activityTitleRow}>
                              <Text style={[s.activityTitle, { color: colors.foreground }]}>{act.title}</Text>
                              {act.isBlackOwned && (
                                <View style={s.boBadge}>
                                  <Text style={s.boBadgeTxt}>B•O</Text>
                                </View>
                              )}
                            </View>
                            {act.businessName && (
                              <Text style={[s.activityBiz, { color: "#CA922B" }]}>📍 {act.businessName}</Text>
                            )}
                            <Text style={[s.activityDesc, { color: colors.mutedForeground }]}>{act.description}</Text>
                            {act.tip && (
                              <View style={[s.tipBox, { backgroundColor: "#CA922B10", borderColor: "#CA922B30" }]}>
                                <Feather name="zap" size={10} color="#CA922B" />
                                <Text style={[s.tipTxt, { color: "#CA922B" }]}>{act.tip}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Packing tips */}
          {itinerary.packingTips && itinerary.packingTips.length > 0 && (
            <View style={[s.packingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.sectionHeading, { color: colors.foreground, marginBottom: 10 }]}>Pack Smart</Text>
              {itinerary.packingTips.map((tip, i) => (
                <View key={i} style={s.packingRow}>
                  <Text style={{ color: "#CA922B" }}>→</Text>
                  <Text style={[s.packingTxt, { color: colors.mutedForeground }]}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6, marginLeft: -6 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSub: { fontSize: 11, marginTop: 1 },
  replanBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)" },
  replanTxt: { color: "#fff", fontSize: 12, fontWeight: "600" },
  fieldLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16 },
  durationRow: { flexDirection: "row", gap: 8 },
  durationCard: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  durationLabel: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  durationSub: { fontSize: 10, marginTop: 3 },
  styleRow: { flexDirection: "row", gap: 8 },
  styleCard: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, gap: 4 },
  styleLabel: { fontSize: 13, fontWeight: "700" },
  styleSub: { fontSize: 10, textAlign: "center" },
  interestsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  interestLabel: { fontSize: 13, fontWeight: "600" },
  generateBtn: { marginTop: 28, paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  generateBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
  disclaimer: { fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: 14 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  errorTxt: { fontSize: 13, flex: 1 },
  overviewCard: { padding: 20, marginBottom: 0 },
  overviewText: { color: "rgba(255,255,255,0.9)", fontSize: 15, lineHeight: 22, marginBottom: 16 },
  highlightsList: { gap: 8 },
  highlightRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  highlightDot: { color: "#CA922B", fontSize: 12, marginTop: 2 },
  highlightTxt: { color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 19, flex: 1 },
  safetyCard: { margin: 16, marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  safetyHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  safetyLabel: { fontSize: 12, fontWeight: "700" },
  safetyTxt: { fontSize: 13, lineHeight: 18 },
  sectionHeading: { fontSize: 17, fontWeight: "700", marginBottom: 12 },
  dayCard: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  dayHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  dayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dayBadgeTxt: { color: "#fff", fontSize: 11, fontWeight: "700" },
  dayTheme: { fontSize: 14, fontWeight: "600" },
  dayBody: { paddingHorizontal: 14, paddingBottom: 14 },
  activityRow: { paddingVertical: 12, flexDirection: "row", gap: 12 },
  activityBorder: { borderBottomWidth: 1 },
  activityLeft: { width: 48, alignItems: "center", gap: 4 },
  activityTime: { fontSize: 9, fontWeight: "600", color: "#CA922B", textAlign: "center" },
  activityTypeEmoji: { fontSize: 16 },
  activityTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 },
  activityTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  boBadge: { backgroundColor: "#2D7A4F", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  boBadgeTxt: { color: "#fff", fontSize: 9, fontWeight: "700" },
  activityBiz: { fontSize: 12, fontWeight: "600", marginBottom: 3 },
  activityDesc: { fontSize: 12, lineHeight: 17 },
  tipBox: { flexDirection: "row", gap: 5, alignItems: "flex-start", marginTop: 6, padding: 8, borderRadius: 8, borderWidth: 1 },
  tipTxt: { fontSize: 11, lineHeight: 16, flex: 1, fontWeight: "600" },
  packingCard: { margin: 16, padding: 16, borderRadius: 14, borderWidth: 1 },
  packingRow: { flexDirection: "row", gap: 8, marginBottom: 7 },
  packingTxt: { fontSize: 13, flex: 1, lineHeight: 18 },
});
