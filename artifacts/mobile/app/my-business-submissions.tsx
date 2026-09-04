import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : process.env.EXPO_PUBLIC_API_URL ?? "";

type SubmissionStatus = "pending_review" | "needs_info" | "declined" | "published";

interface MemberSubmission {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  city: string;
  state: string | null;
  status: SubmissionStatus;
  review_note: string | null;
  matched_business_id: string | null;
}

const STATUS: Record<SubmissionStatus, { label: string; detail: string; icon: keyof typeof Feather.glyphMap; color: string }> = {
  pending_review: { label: "Pending review", detail: "Not public", icon: "clock", color: "#B7791F" },
  needs_info: { label: "More information needed", detail: "Not public", icon: "alert-circle", color: "#2563EB" },
  declined: { label: "Not published", detail: "Not public", icon: "x-circle", color: "#DC2626" },
  published: { label: "Published", detail: "Community-listed · Unclaimed · Not verified", icon: "check-circle", color: "#16803A" },
};

export default function MyBusinessSubmissionsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [submissions, setSubmissions] = useState<MemberSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const token = Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token");
      if (!token) throw new Error("Sign in with your approved community account to view submissions.");
      const response = await fetch(`${API_BASE}/api/community/business-submissions/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json() as { submissions?: MemberSubmission[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to load submissions");
      setSubmissions(data.submissions ?? []);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to load submissions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Business Submissions</Text>
        <TouchableOpacity onPress={() => router.push("/list-business" as never)} accessibilityLabel="Share another business">
          <Feather name="plus" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.mutedForeground }}>Loading submissions…</Text></View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          <Text style={[styles.intro, { color: colors.mutedForeground }]}>A submission stays private until an administrator publishes it.</Text>
          {error ? (
            <View style={[styles.notice, { borderColor: "#DC262655", backgroundColor: "#DC262610" }]}>
              <Text style={{ color: "#DC2626", flex: 1 }}>{error}</Text>
              <TouchableOpacity onPress={() => void load()}><Text style={{ color: colors.primary, fontWeight: "700" }}>Retry</Text></TouchableOpacity>
            </View>
          ) : null}

          {!error && submissions.length === 0 ? (
            <View style={styles.center}>
              <Feather name="briefcase" size={42} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No submissions yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Businesses you share will appear here with their review status.</Text>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => router.push("/list-business" as never)}>
                <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Share a Business</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {submissions.map((item) => {
            const status = STATUS[item.status] ?? STATUS.pending_review;
            return (
              <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.subcategory || item.category} · {[item.city, item.state].filter(Boolean).join(", ")}</Text>
                  </View>
                  <Feather name={status.icon} size={20} color={status.color} />
                </View>
                <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
                <Text style={[styles.statusDetail, { color: colors.mutedForeground }]}>{status.detail}</Text>
                {item.review_note ? (
                  <View style={[styles.reviewNote, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.reviewLabel, { color: colors.foreground }]}>Review note</Text>
                    <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>{item.review_note}</Text>
                  </View>
                ) : null}
                {item.status === "needs_info" ? (
                  <Text style={[styles.helpText, { color: colors.mutedForeground }]}>Update this submission from the Mapping With Melanin website. Your existing record and review history will be preserved.</Text>
                ) : null}
                {item.status === "published" && item.matched_business_id ? (
                  <TouchableOpacity style={[styles.outlineButton, { borderColor: colors.primary }]} onPress={() => router.push({ pathname: "/business/[id]", params: { id: item.matched_business_id! } } as never)}>
                    <Text style={{ color: colors.primary, fontWeight: "700" }}>View Community Listing</Text>
                  </TouchableOpacity>
                ) : null}
                <Text selectable style={[styles.id, { color: colors.mutedForeground }]}>Submission ID: {item.id}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 96, paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" },
  content: { padding: 18, gap: 14 },
  intro: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  notice: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: "row", gap: 12, alignItems: "center" },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginTop: 4 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  name: { fontFamily: "Inter_700Bold", fontSize: 18 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 },
  statusLabel: { fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 14 },
  statusDetail: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  reviewNote: { borderRadius: 12, padding: 12, marginTop: 12 },
  reviewLabel: { fontFamily: "Inter_700Bold", fontSize: 12, marginBottom: 4 },
  reviewText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  helpText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 12 },
  id: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 14 },
  primaryButton: { borderRadius: 14, paddingHorizontal: 20, paddingVertical: 13, marginTop: 8 },
  primaryButtonText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  outlineButton: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 12 },
});
