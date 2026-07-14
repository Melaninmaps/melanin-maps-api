import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Animated, KeyboardAvoidingView, Modal,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase() { return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""; }
async function getToken() { try { return Platform.OS !== "web" ? await SecureStore.getItemAsync("auth_session_token") : null; } catch { return null; } }
async function authedFetch(path: string, opts?: RequestInit) {
  const token = await getToken();
  return fetch(`${getApiBase()}${path}`, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers ?? {}) } });
}

interface Checkin { id: string; date: string; mood: number | null; energyLevel: number | null; stressLevel: number | null; sleepHours: string | null; gratitude: string | null; intention: string | null; }
interface Goal { id: string; type: string; title: string; targetValue: string | null; currentValue: string; unit: string | null; frequency: string; streakCount: number; isActive: boolean; }

const MOOD_EMOJI = ["", "😔", "😕", "😐", "🙂", "😊"];
const MOOD_LABELS = ["", "Rough", "Low", "Okay", "Good", "Great"];
const GOAL_TYPES = [
  { key: "fitness", label: "Fitness", icon: "activity", color: "#16A34A" },
  { key: "mental", label: "Mental Health", icon: "heart", color: "#7C3AED" },
  { key: "nutrition", label: "Nutrition", icon: "coffee", color: "#CA922B" },
  { key: "sleep", label: "Sleep", icon: "moon", color: "#2563EB" },
  { key: "social", label: "Social", icon: "users", color: "#0891B2" },
  { key: "spiritual", label: "Spiritual", icon: "sun", color: "#D97706" },
  { key: "financial", label: "Financial", icon: "dollar-sign", color: "#059669" },
];

function ScaleSelector({ value, onChange, max = 5, color = "#CA922B" }: { value: number; onChange: (v: number) => void; max?: number; color?: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <TouchableOpacity
          key={n}
          style={[sc.dot, { backgroundColor: n <= value ? color : "transparent", borderColor: n <= value ? color : "#D1D5DB", width: 34, height: 34 }]}
          onPress={() => onChange(n)}
          activeOpacity={0.8}
        >
          <Text style={[sc.dotText, { color: n <= value ? "#fff" : "#9CA3AF" }]}>{n}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const sc = StyleSheet.create({
  dot: { borderRadius: 17, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  dotText: { fontFamily: "Inter_700Bold", fontSize: 13 },
});

function GoalCard({ goal, colors, onIncrement }: { goal: Goal; colors: any; onIncrement: (id: string) => void }) {
  const typeConfig = GOAL_TYPES.find(t => t.key === goal.type) ?? { label: goal.type, icon: "target", color: "#CA922B" };
  const target = parseFloat(goal.targetValue ?? "0");
  const current = parseFloat(goal.currentValue ?? "0");
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  return (
    <View style={[gc.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={gc.row}>
        <View style={[gc.icon, { backgroundColor: typeConfig.color + "18" }]}>
          <Feather name={typeConfig.icon as any} size={16} color={typeConfig.color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[gc.title, { color: colors.foreground }]}>{goal.title}</Text>
          <Text style={[gc.sub, { color: colors.mutedForeground }]}>{typeConfig.label} · {goal.frequency}</Text>
        </View>
        {goal.streakCount > 0 && (
          <View style={gc.streak}>
            <Text style={gc.streakNum}>{goal.streakCount}</Text>
            <Text style={gc.streakLabel}>day streak</Text>
          </View>
        )}
      </View>
      {target > 0 && (
        <>
          <View style={[gc.progressBg, { backgroundColor: colors.muted }]}>
            <View style={[gc.progressFill, { width: `${pct}%` as any, backgroundColor: typeConfig.color }]} />
          </View>
          <Text style={[gc.progressText, { color: colors.mutedForeground }]}>
            {current} / {target} {goal.unit ?? ""} ({Math.round(pct)}%)
          </Text>
        </>
      )}
      <TouchableOpacity
        style={[gc.logBtn, { borderColor: typeConfig.color }]}
        onPress={() => onIncrement(goal.id)}
        activeOpacity={0.85}
      >
        <Feather name="check" size={14} color={typeConfig.color} />
        <Text style={[gc.logBtnText, { color: typeConfig.color }]}>Log Progress</Text>
      </TouchableOpacity>
    </View>
  );
}
const gc = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  streak: { alignItems: "center", backgroundColor: "#CA922B15", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  streakNum: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#CA922B" },
  streakLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: "#CA922B" },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  logBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  logBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
});

export default function WellnessTrackerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [streak, setStreak] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [addGoalType, setAddGoalType] = useState("fitness");
  const [addGoalForm, setAddGoalForm] = useState({ title: "", targetValue: "", unit: "", frequency: "daily" });
  const [addGoalSaving, setAddGoalSaving] = useState(false);

  // Today's check-in state
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [stress, setStress] = useState(0);
  const [sleep, setSleep] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [intention, setIntention] = useState("");
  const streakAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      const [ciRes, goalsRes] = await Promise.all([
        authedFetch("/api/wellness/checkins?days=7"),
        authedFetch("/api/wellness/goals"),
      ]);
      if (ciRes.ok) {
        const d = await ciRes.json() as { checkins: Checkin[]; streak: number; todayCheckin: Checkin | null };
        setStreak(d.streak);
        if (d.todayCheckin) {
          const c = d.todayCheckin;
          setCheckin(c);
          setMood(c.mood ?? 0);
          setEnergy(c.energyLevel ?? 0);
          setStress(c.stressLevel ?? 0);
          setSleep(c.sleepHours ?? "");
          setGratitude(c.gratitude ?? "");
          setIntention(c.intention ?? "");
        }
      }
      if (goalsRes.ok) {
        const d = await goalsRes.json() as { goals: Goal[] };
        setGoals(d.goals ?? []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  useEffect(() => {
    if (streak > 0) {
      Animated.spring(streakAnim, { toValue: 1, useNativeDriver: true, tension: 50 }).start();
    }
  }, [streak]);

  const handleSaveCheckin = async () => {
    if (!mood) { Alert.alert("How are you feeling?", "Please select your mood to check in."); return; }
    setSaving(true);
    try {
      const res = await authedFetch("/api/wellness/checkin", {
        method: "POST",
        body: JSON.stringify({ mood, energyLevel: energy || null, stressLevel: stress || null, sleepHours: sleep ? parseFloat(sleep) : null, gratitude: gratitude.trim() || null, intention: intention.trim() || null }),
      });
      if (res.ok) {
        const d = await res.json() as { streak: number };
        setStreak(d.streak);
        Alert.alert("Check-in saved!", d.streak > 1 ? `You're on a ${d.streak}-day wellness streak!` : "Keep it up — your health matters.");
      } else {
        Alert.alert("Error", "Could not save check-in. Please try again.");
      }
    } catch { Alert.alert("Error", "Network error."); }
    finally { setSaving(false); }
  };

  const handleGoalIncrement = (id: string) => {
    Alert.prompt("Log Progress", "How much did you complete?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log", onPress: async (val: string | undefined) => {
        const amount = parseFloat(val ?? "1");
        if (isNaN(amount)) return;
        try {
          await authedFetch(`/api/wellness/goals/${id}`, { method: "PATCH", body: JSON.stringify({ streakIncrement: true, currentValue: amount }) });
          await loadData();
        } catch {}
      }},
    ], "plain-text", "1");
  };

  const handleAddGoal = async () => {
    if (!addGoalForm.title.trim()) { Alert.alert("Required", "Please enter a goal title."); return; }
    setAddGoalSaving(true);
    try {
      const res = await authedFetch("/api/wellness/goals", {
        method: "POST",
        body: JSON.stringify({ type: addGoalType, ...addGoalForm, targetValue: addGoalForm.targetValue ? parseFloat(addGoalForm.targetValue) : undefined }),
      });
      if (res.ok) { setAddGoalOpen(false); setAddGoalForm({ title: "", targetValue: "", unit: "", frequency: "daily" }); await loadData(); }
      else { Alert.alert("Error", "Could not add goal."); }
    } catch { Alert.alert("Error", "Network error."); }
    finally { setAddGoalSaving(false); }
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const hasCheckedIn = !!checkin;

  if (loading) {
    return <View style={[s.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}><ActivityIndicator size="large" color="#CA922B" /></View>;
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Wellness Tracker</Text>
            <Text style={[s.headerSub, { color: colors.mutedForeground }]}>{today}</Text>
          </View>
          {streak > 0 && (
            <Animated.View style={[s.streakBadge, { transform: [{ scale: streakAnim }] }]}>
              <Text style={s.streakFire}>🔥</Text>
              <Text style={s.streakCount}>{streak}</Text>
            </Animated.View>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Today's Check-in */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <Feather name="sun" size={16} color="#CA922B" />
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>
              {hasCheckedIn ? "Today's Check-in ✓" : "Daily Check-in"}
            </Text>
          </View>

          <Text style={[s.label, { color: colors.foreground }]}>How are you feeling? {mood > 0 ? `${MOOD_EMOJI[mood]} ${MOOD_LABELS[mood]}` : ""}</Text>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity
                key={n}
                style={[s.moodBtn, { borderColor: mood === n ? "#CA922B" : colors.border, backgroundColor: mood === n ? "#CA922B15" : colors.card }]}
                onPress={() => setMood(n)}
                activeOpacity={0.8}
              >
                <Text style={s.moodEmoji}>{MOOD_EMOJI[n]}</Text>
                <Text style={[s.moodLabel, { color: mood === n ? "#CA922B" : colors.mutedForeground }]}>{MOOD_LABELS[n]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, { color: colors.foreground }]}>Energy Level</Text>
          <ScaleSelector value={energy} onChange={setEnergy} color="#16A34A" />

          <Text style={[s.label, { color: colors.foreground, marginTop: 14 }]}>Stress Level</Text>
          <ScaleSelector value={stress} onChange={setStress} color="#DC2626" />

          <Text style={[s.label, { color: colors.foreground, marginTop: 14 }]}>Sleep last night (hours)</Text>
          <TextInput
            style={[s.smallInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder="e.g. 7.5"
            placeholderTextColor={colors.mutedForeground}
            value={sleep} onChangeText={setSleep} keyboardType="decimal-pad"
          />

          <Text style={[s.label, { color: colors.foreground, marginTop: 14 }]}>One thing I'm grateful for</Text>
          <TextInput
            style={[s.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder="What are you thankful for today?"
            placeholderTextColor={colors.mutedForeground}
            value={gratitude} onChangeText={setGratitude} multiline numberOfLines={2}
          />

          <Text style={[s.label, { color: colors.foreground, marginTop: 12 }]}>Today's intention</Text>
          <TextInput
            style={[s.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder="What do you want to focus on today?"
            placeholderTextColor={colors.mutedForeground}
            value={intention} onChangeText={setIntention} multiline numberOfLines={2}
          />

          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={() => { void handleSaveCheckin(); }}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#1C0E06" size="small" /> : (
              <>
                <Feather name={hasCheckedIn ? "refresh-cw" : "check"} size={16} color="#1C0E06" />
                <Text style={s.saveBtnText}>{hasCheckedIn ? "Update Check-in" : "Save Check-in"}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Goals */}
        <View style={s.goalsHeader}>
          <Text style={[s.goalsTitle, { color: colors.foreground }]}>Wellness Goals</Text>
          <TouchableOpacity style={s.addGoalBtn} onPress={() => setAddGoalOpen(true)} activeOpacity={0.85}>
            <Feather name="plus" size={14} color="#CA922B" />
            <Text style={s.addGoalBtnText}>Add Goal</Text>
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <View style={[s.emptyGoals, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="target" size={28} color={colors.mutedForeground} />
            <Text style={[s.emptyGoalsText, { color: colors.mutedForeground }]}>Set a wellness goal to start tracking your progress.</Text>
            <TouchableOpacity style={s.addGoalBtn} onPress={() => setAddGoalOpen(true)} activeOpacity={0.85}>
              <Feather name="plus" size={14} color="#CA922B" />
              <Text style={s.addGoalBtnText}>Add Your First Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map(g => (
            <GoalCard key={g.id} goal={g} colors={colors}
              onIncrement={id => { void handleGoalIncrement(id); }} />
          ))
        )}

        {/* Find Support */}
        <View style={[s.supportCard, { backgroundColor: "#7C3AED10", borderColor: "#7C3AED30" }]}>
          <Feather name="phone" size={18} color="#7C3AED" />
          <View style={{ flex: 1 }}>
            <Text style={[s.supportTitle, { color: "#7C3AED" }]}>Need to Talk?</Text>
            <Text style={[s.supportBody, { color: colors.mutedForeground }]}>988 Suicide & Crisis Lifeline — call or text 988 anytime, 24/7.</Text>
          </View>
          <TouchableOpacity
            onPress={() => { void (async () => { const { Linking } = await import("react-native"); Linking.openURL("tel:988").catch(() => {}); })(); }}
            style={[s.callBtn, { backgroundColor: "#7C3AED" }]}
            activeOpacity={0.85}
          >
            <Text style={s.callBtnText}>Call 988</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={addGoalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddGoalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setAddGoalOpen(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Add Wellness Goal</Text>
            <View style={{ width: 22 }} />
          </View>
          <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={[s.label, { color: colors.foreground }]}>Goal Type</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {GOAL_TYPES.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[s.typeChip, { borderColor: addGoalType === t.key ? t.color : colors.border, backgroundColor: addGoalType === t.key ? t.color + "15" : colors.card }]}
                  onPress={() => setAddGoalType(t.key)}
                  activeOpacity={0.8}
                >
                  <Feather name={t.icon as any} size={13} color={addGoalType === t.key ? t.color : colors.mutedForeground} />
                  <Text style={[s.typeChipText, { color: addGoalType === t.key ? t.color : colors.mutedForeground }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.label, { color: colors.foreground }]}>Goal Title*</Text>
            <TextInput
              style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="e.g. Walk 30 min daily, Meditate 10 min, Drink 8 glasses of water"
              placeholderTextColor={colors.mutedForeground}
              value={addGoalForm.title} onChangeText={v => setAddGoalForm(f => ({ ...f, title: v }))}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: colors.foreground }]}>Target (optional)</Text>
                <TextInput
                  style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                  placeholder="e.g. 30"
                  placeholderTextColor={colors.mutedForeground}
                  value={addGoalForm.targetValue} onChangeText={v => setAddGoalForm(f => ({ ...f, targetValue: v }))}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: colors.foreground }]}>Unit</Text>
                <TextInput
                  style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                  placeholder="min, oz, miles..."
                  placeholderTextColor={colors.mutedForeground}
                  value={addGoalForm.unit} onChangeText={v => setAddGoalForm(f => ({ ...f, unit: v }))}
                />
              </View>
            </View>

            <Text style={[s.label, { color: colors.foreground }]}>Frequency</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {["daily", "weekly", "monthly"].map(f => (
                <TouchableOpacity
                  key={f}
                  style={[s.typeChip, { borderColor: addGoalForm.frequency === f ? "#CA922B" : colors.border, backgroundColor: addGoalForm.frequency === f ? "#CA922B15" : colors.card }]}
                  onPress={() => setAddGoalForm(prev => ({ ...prev, frequency: f }))}
                  activeOpacity={0.8}
                >
                  <Text style={[s.typeChipText, { color: addGoalForm.frequency === f ? "#CA922B" : colors.mutedForeground }]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[s.saveBtn, { marginTop: 24 }, addGoalSaving && { opacity: 0.6 }]}
              onPress={() => { void handleAddGoal(); }}
              disabled={addGoalSaving}
              activeOpacity={0.85}
            >
              {addGoalSaving ? <ActivityIndicator color="#1C0E06" size="small" /> : (
                <>
                  <Feather name="check" size={16} color="#1C0E06" />
                  <Text style={s.saveBtnText}>Add Goal</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingBottom: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 22 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  streakBadge: { alignItems: "center", backgroundColor: "#CA922B15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  streakFire: { fontSize: 18 },
  streakCount: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#CA922B", lineHeight: 20 },
  scroll: { padding: 16, gap: 12, paddingBottom: 48 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 6 },
  moodBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, gap: 4 },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontFamily: "Inter_500Medium", fontSize: 10 },
  smallInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 15, width: 120 },
  textArea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14, minHeight: 72, textAlignVertical: "top" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#CA922B", borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#1C0E06" },
  goalsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  goalsTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  addGoalBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: "#CA922B15" },
  addGoalBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#CA922B" },
  emptyGoals: { borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 12, padding: 28 },
  emptyGoalsText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 21 },
  supportCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1, marginTop: 4 },
  supportTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  supportBody: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 2 },
  callBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  callBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  modalBody: { padding: 20, gap: 4, paddingBottom: 48 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  typeChipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15 },
});
