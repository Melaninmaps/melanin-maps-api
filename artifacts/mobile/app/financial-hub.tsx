import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal,
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

interface FinancialGoal { id: string; type: string; title: string; description: string | null; targetAmount: string; currentAmount: string; deadline: string | null; isAchieved: boolean; motivationNote: string | null; currency: string; }
interface Resource { title: string; url: string; description: string; category: string; }

const GOAL_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; description: string }> = {
  savings:        { label: "Savings Goal",      icon: "dollar-sign", color: "#16A34A",  description: "Save toward something meaningful" },
  emergency_fund: { label: "Emergency Fund",    icon: "shield",      color: "#CA922B",  description: "3–6 months of expenses as a safety net" },
  debt_payoff:    { label: "Pay Off Debt",      icon: "trending-down",color: "#DC2626", description: "Pay down credit cards, loans, or other debt" },
  investment:     { label: "Investment",         icon: "trending-up", color: "#2563EB",  description: "Grow wealth through investing" },
  business:       { label: "Business Fund",     icon: "briefcase",   color: "#7C3AED",  description: "Capital for your business or side hustle" },
  education:      { label: "Education Fund",    icon: "book",        color: "#0891B2",  description: "Tuition, certifications, or learning" },
  home:           { label: "Home Purchase",     icon: "home",        color: "#D97706",  description: "Down payment or home improvements" },
  other:          { label: "Other Goal",        icon: "target",      color: "#6B7280",  description: "A custom financial goal" },
};

const RESOURCE_CATEGORY_COLORS: Record<string, string> = {
  budgeting: "#CA922B", literacy: "#2563EB", credit: "#16A34A",
  debt: "#DC2626", investing: "#7C3AED", banking: "#0891B2", empowerment: "#D97706",
};

function CircularProgress({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ * (1 - Math.min(1, pct / 100));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: size, height: size, borderRadius: size / 2, borderWidth: 5, borderColor: color + "25" }} />
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: size / 4, color }}>{Math.round(pct)}%</Text>
    </View>
  );
}

function GoalCard({ goal, colors, onCheckin, onDelete }: { goal: FinancialGoal; colors: any; onCheckin: (g: FinancialGoal) => void; onDelete: (id: string) => void; }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = GOAL_TYPE_CONFIG[goal.type] ?? GOAL_TYPE_CONFIG.other;
  const target = parseFloat(goal.targetAmount);
  const current = parseFloat(goal.currentAmount);
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const remaining = target - current;
  const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000) : null;

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <TouchableOpacity
      style={[gc.card, { backgroundColor: colors.card, borderColor: goal.isAchieved ? cfg.color : colors.border, borderWidth: goal.isAchieved ? 2 : 1 }]}
      onPress={() => setExpanded(p => !p)}
      activeOpacity={0.88}
    >
      <View style={gc.row}>
        <CircularProgress pct={pct} color={cfg.color} size={56} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Feather name={cfg.icon as any} size={13} color={cfg.color} />
            <Text style={[gc.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
            {goal.isAchieved && <View style={gc.achievedBadge}><Text style={gc.achievedText}>Achieved!</Text></View>}
          </View>
          <Text style={[gc.title, { color: colors.foreground }]}>{goal.title}</Text>
          <Text style={[gc.amounts, { color: colors.mutedForeground }]}>
            {fmt(current)} of {fmt(target)} saved
          </Text>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </View>

      <View style={[gc.progressBg, { backgroundColor: colors.muted }]}>
        <View style={[gc.progressFill, { width: `${pct}%` as any, backgroundColor: cfg.color }]} />
      </View>

      {expanded && (
        <>
          {goal.motivationNote && (
            <View style={[gc.noteBox, { backgroundColor: colors.muted }]}>
              <Text style={[gc.noteText, { color: colors.mutedForeground }]}>"{goal.motivationNote}"</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {remaining > 0 && !goal.isAchieved && (
              <View style={[gc.statChip, { backgroundColor: cfg.color + "15" }]}>
                <Text style={[gc.statLabel, { color: cfg.color }]}>{fmt(remaining)} to go</Text>
              </View>
            )}
            {daysLeft !== null && daysLeft > 0 && (
              <View style={[gc.statChip, { backgroundColor: colors.muted }]}>
                <Feather name="clock" size={11} color={colors.mutedForeground} />
                <Text style={[gc.statLabel, { color: colors.mutedForeground }]}>{daysLeft} days left</Text>
              </View>
            )}
          </View>
          {!goal.isAchieved && (
            <View style={gc.actions}>
              <TouchableOpacity style={[gc.addBtn, { backgroundColor: cfg.color }]} onPress={() => onCheckin(goal)} activeOpacity={0.85}>
                <Feather name="plus" size={14} color="#fff" />
                <Text style={gc.addBtnText}>Add Savings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[gc.deleteBtn, { borderColor: colors.border }]} onPress={() => onDelete(goal.id)} activeOpacity={0.85}>
                <Feather name="trash-2" size={14} color="#DC2626" />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
const gc = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  typeLabel: { fontFamily: "Inter_500Medium", fontSize: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 16 },
  amounts: { fontFamily: "Inter_400Regular", fontSize: 13 },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  noteBox: { padding: 10, borderRadius: 10 },
  noteText: { fontFamily: "Inter_400Regular", fontSize: 13, fontStyle: "italic" },
  statChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statLabel: { fontFamily: "Inter_500Medium", fontSize: 12 },
  actions: { flexDirection: "row", gap: 8 },
  addBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 10 },
  addBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  deleteBtn: { width: 42, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1 },
  achievedBadge: { backgroundColor: "#16A34A", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  achievedText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#fff" },
});

export default function FinancialHubScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState("savings");
  const [addForm, setAddForm] = useState({ title: "", targetAmount: "", deadline: "", motivationNote: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"goals" | "learn">("goals");

  const loadData = useCallback(async () => {
    try {
      const [goalsRes, resRes] = await Promise.all([
        authedFetch("/api/financial/goals"),
        fetch(`${getApiBase()}/api/financial/resources`),
      ]);
      if (goalsRes.ok) { const d = await goalsRes.json() as { goals: FinancialGoal[] }; setGoals(d.goals ?? []); }
      if (resRes.ok) { const d = await resRes.json() as { resources: Resource[] }; setResources(d.resources ?? []); }
    } catch {}
  }, []);

  useEffect(() => { setLoading(true); loadData().finally(() => setLoading(false)); }, [loadData]);

  const handleCheckin = (goal: FinancialGoal) => {
    Alert.prompt("Add Savings", `How much are you adding to "${goal.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Add", onPress: async (val: string | undefined) => {
        const amount = parseFloat(val ?? "0");
        if (isNaN(amount) || amount <= 0) { Alert.alert("Invalid", "Enter a valid amount."); return; }
        try {
          const res = await authedFetch(`/api/financial/goals/${goal.id}/checkin`, { method: "POST", body: JSON.stringify({ amount, note: "" }) });
          if (res.ok) {
            const d = await res.json() as { isAchieved: boolean; progress: number };
            if (d.isAchieved) Alert.alert("Goal Achieved!", `You hit your target for "${goal.title}". Amazing work!`);
            else Alert.alert("Saved!", `Progress: ${Math.round(d.progress)}% complete.`);
            await loadData();
          }
        } catch { Alert.alert("Error", "Could not update goal."); }
      }},
    ], "plain-text", "");
  };

  const handleDelete = (id: string) => {
    Alert.alert("Remove Goal", "Are you sure you want to remove this goal?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        await authedFetch(`/api/financial/goals/${id}`, { method: "DELETE" });
        await loadData();
      }},
    ]);
  };

  const handleAddGoal = async () => {
    if (!addForm.title.trim() || !addForm.targetAmount) { Alert.alert("Required", "Title and target amount are required."); return; }
    setAddSaving(true);
    try {
      const res = await authedFetch("/api/financial/goals", {
        method: "POST",
        body: JSON.stringify({ type: addType, title: addForm.title.trim(), targetAmount: parseFloat(addForm.targetAmount), deadline: addForm.deadline || undefined, motivationNote: addForm.motivationNote.trim() || undefined }),
      });
      if (res.ok) {
        setAddOpen(false);
        setAddForm({ title: "", targetAmount: "", deadline: "", motivationNote: "" });
        await loadData();
      } else { Alert.alert("Error", "Could not create goal."); }
    } catch { Alert.alert("Error", "Network error."); }
    finally { setAddSaving(false); }
  };

  const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0);
  const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.targetAmount), 0);
  const achieved = goals.filter(g => g.isAchieved).length;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Financial Hub</Text>
            <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Build wealth. One goal at a time.</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setAddOpen(true)} activeOpacity={0.85}>
            <Feather name="plus" size={16} color="#1C0E06" />
            <Text style={s.addBtnText}>New Goal</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.tabRow, { backgroundColor: colors.muted }]}>
          {(["goals", "learn"] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[s.tabBtn, activeTab === t && { backgroundColor: colors.card }]}
              onPress={() => setActiveTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabText, { color: activeTab === t ? colors.foreground : colors.mutedForeground }]}>
                {t === "goals" ? "My Goals" : "Financial Literacy"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#CA922B" /></View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll}>

          {activeTab === "goals" && (
            <>
              {/* Summary bar */}
              {goals.length > 0 && (
                <View style={[s.summaryCard, { backgroundColor: "#CA922B10", borderColor: "#CA922B25" }]}>
                  <View style={s.summaryItem}>
                    <Text style={s.summaryNum}>{goals.length}</Text>
                    <Text style={[s.summaryLabel, { color: "#CA922B" }]}>Active Goals</Text>
                  </View>
                  <View style={s.summaryDivider} />
                  <View style={s.summaryItem}>
                    <Text style={s.summaryNum}>${Math.round(totalSaved).toLocaleString()}</Text>
                    <Text style={[s.summaryLabel, { color: "#CA922B" }]}>Saved</Text>
                  </View>
                  <View style={s.summaryDivider} />
                  <View style={s.summaryItem}>
                    <Text style={s.summaryNum}>{achieved}</Text>
                    <Text style={[s.summaryLabel, { color: "#CA922B" }]}>Achieved</Text>
                  </View>
                </View>
              )}

              {goals.length === 0 ? (
                <View style={[s.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="dollar-sign" size={36} color={colors.mutedForeground} />
                  <Text style={[s.emptyTitle, { color: colors.foreground }]}>Start Your First Goal</Text>
                  <Text style={[s.emptyBody, { color: colors.mutedForeground }]}>Whether you're saving for a home, paying off debt, or building your emergency fund — your journey starts here.</Text>
                  <TouchableOpacity style={s.addBtn} onPress={() => setAddOpen(true)} activeOpacity={0.85}>
                    <Feather name="plus" size={15} color="#1C0E06" />
                    <Text style={s.addBtnText}>Create a Goal</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                goals.map(g => (
                  <GoalCard key={g.id} goal={g} colors={colors} onCheckin={handleCheckin} onDelete={handleDelete} />
                ))
              )}

              {/* Tip */}
              <View style={[s.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="info" size={14} color="#CA922B" />
                <Text style={[s.tipText, { color: colors.mutedForeground }]}>
                  <Text style={{ fontFamily: "Inter_600SemiBold", color: "#CA922B" }}>Tip: </Text>
                  The 50/30/20 rule — spend 50% on needs, 30% on wants, and save 20%. Even starting with $25/week builds real momentum.
                </Text>
              </View>
            </>
          )}

          {activeTab === "learn" && (
            <>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Trusted Financial Resources</Text>
              <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>Curated tools for building financial independence.</Text>
              {resources.map((r, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.resourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => { void (async () => { const { Linking } = await import("react-native"); Linking.openURL(r.url).catch(() => {}); })(); }}
                  activeOpacity={0.85}
                >
                  <View style={[s.resCatDot, { backgroundColor: (RESOURCE_CATEGORY_COLORS[r.category] ?? "#CA922B") + "20" }]}>
                    <Feather name="book-open" size={14} color={RESOURCE_CATEGORY_COLORS[r.category] ?? "#CA922B"} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[s.resTitle, { color: colors.foreground }]}>{r.title}</Text>
                    <Text style={[s.resDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{r.description}</Text>
                    <View style={[s.resCatPill, { backgroundColor: (RESOURCE_CATEGORY_COLORS[r.category] ?? "#CA922B") + "15" }]}>
                      <Text style={[s.resCatText, { color: RESOURCE_CATEGORY_COLORS[r.category] ?? "#CA922B" }]}>{r.category}</Text>
                    </View>
                  </View>
                  <Feather name="external-link" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}

              {/* Operation HOPE highlight */}
              <View style={[s.highlightCard, { backgroundColor: "#CA922B10", borderColor: "#CA922B30" }]}>
                <Text style={[s.highlightTitle, { color: "#CA922B" }]}>Free Financial Coaching</Text>
                <Text style={[s.highlightBody, { color: colors.mutedForeground }]}>Operation HOPE offers free 1:1 financial coaching for credit building, homeownership, and small business. Available in many cities.</Text>
                <TouchableOpacity
                  style={[s.highlightBtn, { backgroundColor: "#CA922B" }]}
                  onPress={() => { void (async () => { const { Linking } = await import("react-native"); Linking.openURL("https://www.operationhope.org").catch(() => {}); })(); }}
                  activeOpacity={0.85}
                >
                  <Text style={s.highlightBtnText}>Find a Coach</Text>
                  <Feather name="external-link" size={13} color="#1C0E06" />
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Add Goal Modal */}
      <Modal visible={addOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setAddOpen(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>New Financial Goal</Text>
            <View style={{ width: 22 }} />
          </View>
          <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={[s.fieldLabel, { color: colors.foreground }]}>Goal Type</Text>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {Object.entries(GOAL_TYPE_CONFIG).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[s.typeRow, { borderColor: addType === key ? cfg.color : colors.border, backgroundColor: addType === key ? cfg.color + "10" : colors.card }]}
                  onPress={() => setAddType(key)}
                  activeOpacity={0.8}
                >
                  <View style={[s.typeIcon, { backgroundColor: cfg.color + "20" }]}>
                    <Feather name={cfg.icon as any} size={16} color={cfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.typeLabel, { color: colors.foreground }]}>{cfg.label}</Text>
                    <Text style={[s.typeSub, { color: colors.mutedForeground }]}>{cfg.description}</Text>
                  </View>
                  {addType === key && <Feather name="check-circle" size={18} color={cfg.color} />}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.fieldLabel, { color: colors.foreground }]}>Goal Name*</Text>
            <TextInput
              style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="e.g. Emergency Fund, Pay off Visa, Down Payment"
              placeholderTextColor={colors.mutedForeground}
              value={addForm.title} onChangeText={v => setAddForm(f => ({ ...f, title: v }))}
            />

            <Text style={[s.fieldLabel, { color: colors.foreground }]}>Target Amount ($)*</Text>
            <TextInput
              style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="e.g. 5000"
              placeholderTextColor={colors.mutedForeground}
              value={addForm.targetAmount} onChangeText={v => setAddForm(f => ({ ...f, targetAmount: v }))}
              keyboardType="decimal-pad"
            />

            <Text style={[s.fieldLabel, { color: colors.foreground }]}>Target Date (optional)</Text>
            <TextInput
              style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              value={addForm.deadline} onChangeText={v => setAddForm(f => ({ ...f, deadline: v }))}
            />

            <Text style={[s.fieldLabel, { color: colors.foreground }]}>Why does this matter? (optional)</Text>
            <TextInput
              style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, height: 80, textAlignVertical: "top" }]}
              placeholder="Your motivation keeps you going when things get tough..."
              placeholderTextColor={colors.mutedForeground}
              value={addForm.motivationNote} onChangeText={v => setAddForm(f => ({ ...f, motivationNote: v }))}
              multiline numberOfLines={3}
            />

            <TouchableOpacity
              style={[s.submitBtn, addSaving && { opacity: 0.6 }]}
              onPress={() => { void handleAddGoal(); }}
              disabled={addSaving} activeOpacity={0.85}
            >
              {addSaving ? <ActivityIndicator color="#1C0E06" size="small" /> : (
                <>
                  <Feather name="check" size={16} color="#1C0E06" />
                  <Text style={s.submitBtnText}>Create Goal</Text>
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
  header: { borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingBottom: 0, gap: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 0 },
  headerTitle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 22 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#CA922B", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  addBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#1C0E06" },
  tabRow: { flexDirection: "row", borderRadius: 10, padding: 3, margin: 0, marginBottom: 12 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8 },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 16, gap: 12, paddingBottom: 48 },
  summaryCard: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 4 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryNum: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#CA922B" },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: "#CA922B25" },
  empty: { borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 12, padding: 32 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  emptyBody: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 21 },
  tipCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, flex: 1 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 2 },
  sectionSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 8 },
  resourceCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  resCatDot: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  resTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  resDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  resCatPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start", marginTop: 4 },
  resCatText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  highlightCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 8, marginTop: 4 },
  highlightTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  highlightBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  highlightBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignSelf: "flex-start", marginTop: 4 },
  highlightBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#1C0E06" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  modalBody: { padding: 20, gap: 4, paddingBottom: 48 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15 },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderRadius: 12, padding: 12 },
  typeIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  typeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  typeSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 1 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#CA922B", borderRadius: 14, paddingVertical: 16, marginTop: 20 },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#1C0E06" },
});
