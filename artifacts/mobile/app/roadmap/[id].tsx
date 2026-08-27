import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase() { return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""; }
async function getToken() { try { return Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token"); } catch { return null; } }
async function authHeaders(): Promise<Record<string, string>> { const t = await getToken(); return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }; }

interface Roadmap { id: string; title: string; description: string | null; coverEmoji: string; topicName: string | null; intent: string | null; totalSteps: number; completedSteps: number; }
interface RoadmapStep { id: string; category: string; categoryEmoji: string; title: string; description: string | null; displayOrder: number; isComplete: boolean; priority: string; externalUrl: string | null; externalLabel: string | null; }

const PRIORITY_COLOR: Record<string, string> = { high: "#DC2626", normal: "#CA922B", low: "#6B7280" };

export default function RoadmapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/roadmaps/${id}`, { headers: h });
      if (res.ok) {
        const data = await res.json() as { roadmap: Roadmap; steps: RoadmapStep[] };
        setRoadmap(data.roadmap);
        setSteps(data.steps);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { queueMicrotask(() => { load(); }); }, [load]);

  async function toggleStep(stepId: string) {
    if (!id) return;
    setToggling(stepId);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/roadmaps/${id}/steps/${stepId}/toggle`, { method: "PUT", headers: h });
      if (res.ok) {
        const data = await res.json() as { isComplete: boolean; completedSteps: number };
        setSteps((prev) => prev.map((s) => s.id === stepId ? { ...s, isComplete: data.isComplete } : s));
        setRoadmap((prev) => prev ? { ...prev, completedSteps: data.completedSteps } : prev);
        if (data.isComplete && Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch { /* silent */ } finally { setToggling(null); }
  }

  const categories = steps.reduce<Record<string, RoadmapStep[]>>((acc, step) => {
    const key = `${step.categoryEmoji} ${step.category}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(step);
    return acc;
  }, {});

  const progress = roadmap ? (roadmap.totalSteps > 0 ? roadmap.completedSteps / roadmap.totalSteps : 0) : 0;

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={s.center}><ActivityIndicator size="large" color="#CA922B" /></View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerEmoji]}>{roadmap?.coverEmoji ?? "🗺️"}</Text>
          </View>
          <Text style={[s.headerProgress, { color: "#CA922B" }]}>
            {roadmap?.completedSteps}/{roadmap?.totalSteps}
          </Text>
        </View>
        <Text style={[s.headerTitle, { color: colors.foreground }]} numberOfLines={2}>{roadmap?.title}</Text>
        {roadmap?.description && (
          <Text style={[s.headerDesc, { color: colors.mutedForeground }]}>{roadmap.description}</Text>
        )}
        <View style={[s.progressBar, { backgroundColor: colors.secondary }]}>
          <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: "#CA922B" }]} />
        </View>
        <Text style={[s.progressTxt, { color: colors.mutedForeground }]}>
          {Math.round(progress * 100)}% complete{progress === 1 ? " 🎉" : ""}
        </Text>
      </View>

      <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {Object.entries(categories).map(([cat, catSteps]) => {
          const doneCount = catSteps.filter((s) => s.isComplete).length;
          return (
            <View key={cat} style={s.category}>
              <View style={s.catHeader}>
                <Text style={[s.catLabel, { color: colors.foreground }]}>{cat}</Text>
                <Text style={[s.catCount, { color: colors.mutedForeground }]}>{doneCount}/{catSteps.length}</Text>
              </View>
              {catSteps.map((step) => (
                <TouchableOpacity
                  key={step.id}
                  style={[s.stepCard, { backgroundColor: colors.card, borderColor: step.isComplete ? "#CA922B30" : colors.border }]}
                  onPress={() => toggleStep(step.id)}
                  activeOpacity={0.75}
                >
                  <View style={[s.checkbox, { borderColor: step.isComplete ? "#CA922B" : colors.border, backgroundColor: step.isComplete ? "#CA922B" : "transparent" }]}>
                    {toggling === step.id
                      ? <ActivityIndicator size="small" color={step.isComplete ? "#fff" : "#CA922B"} />
                      : step.isComplete
                        ? <Feather name="check" size={13} color="#fff" />
                        : null}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={s.stepTitleRow}>
                      <Text style={[s.stepTitle, { color: step.isComplete ? colors.mutedForeground : colors.foreground }, step.isComplete && s.stepDone]} numberOfLines={2}>
                        {step.title}
                      </Text>
                      {step.priority === "high" && !step.isComplete && (
                        <View style={[s.priorityDot, { backgroundColor: PRIORITY_COLOR.high }]} />
                      )}
                    </View>
                    {step.description && (
                      <Text style={[s.stepDesc, { color: colors.mutedForeground }]} numberOfLines={3}>{step.description}</Text>
                    )}
                    {step.externalUrl && (
                      <TouchableOpacity
                        style={[s.stepLink, { borderColor: "#CA922B40" }]}
                        onPress={() => Linking.openURL(step.externalUrl!)}
                        activeOpacity={0.75}
                      >
                        <Feather name="external-link" size={11} color="#CA922B" />
                        <Text style={[s.stepLinkTxt, { color: "#CA922B" }]}>{step.externalLabel ?? "Learn more"}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  backBtn: { padding: 6, marginLeft: -6, marginRight: 10 },
  headerEmoji: { fontSize: 24 },
  headerProgress: { fontSize: 13, fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "700", lineHeight: 26, marginBottom: 4 },
  headerDesc: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: 6, borderRadius: 3 },
  progressTxt: { fontSize: 12 },
  category: { marginTop: 20, paddingHorizontal: 16 },
  catHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  catLabel: { fontSize: 15, fontWeight: "700" },
  catCount: { fontSize: 12 },
  stepCard: { flexDirection: "row", gap: 12, alignItems: "flex-start", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 },
  stepTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  stepDone: { textDecorationLine: "line-through" },
  stepDesc: { fontSize: 12, lineHeight: 17 },
  stepLink: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6, alignSelf: "flex-start", borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  stepLinkTxt: { fontSize: 11, fontWeight: "600" },
  priorityDot: { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },
});
