import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string | null;
  type: string | null;
  description: string | null;
  url: string | null;
  isRemote: boolean | null;
  createdAt: string;
  postedByName: string | null;
  isPersonalReferral: boolean | null;
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const token = Platform.OS !== "web" ? await SecureStore.getItemAsync("auth_session_token") : null;
      const res = await fetch(`${getApiBase()}/api/jobs/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { setError("This listing is no longer available."); return; }
      const data = await res.json() as JobListing;
      setJob(data);
    } catch {
      setError("Unable to load this listing. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const handleApply = () => {
    if (job?.url) {
      const isIndeed = job.url.includes("indeed.com");
      const isLinkedIn = job.url.includes("linkedin.com");
      const isZipRecruiter = job.url.includes("ziprecruiter.com");
      const isJobBoard = isIndeed || isLinkedIn || isZipRecruiter;
      fetch(`${getApiBase()}/api/external-clicks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionName: isIndeed ? "Indeed" : isLinkedIn ? "LinkedIn" : isZipRecruiter ? "ZipRecruiter" : (job.company ?? "Employer"),
          institutionType: isJobBoard ? "job_board" : "employer",
          institutionUrl: job.url,
          referenceType: "job_apply",
          referenceId: id,
          source: "jobs",
          isSafetyRelated: false,
        }),
      }).catch(() => {});
      Linking.openURL(job.url).catch(() => {
        Alert.alert("Could not open link", "Copy the company name and search for the listing online.");
      });
    } else {
      Alert.alert("How to Apply", "Contact the poster directly through the community or search for this role on the company's careers page.");
    }
  };

  const c = colors;

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: c.border }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/opportunities")}
          style={styles.back}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.foreground }]} numberOfLines={1}>
          Job Details
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="briefcase" size={40} color={c.mutedForeground} style={{ marginBottom: 12 }} />
          <Text style={[styles.errorText, { color: c.foreground }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: c.secondary }]}
            onPress={() => void load()}
            activeOpacity={0.8}
          >
            <Text style={[styles.retryTxt, { color: c.foreground }]}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: c.border }]}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/opportunities")}
            activeOpacity={0.8}
          >
            <Text style={[styles.backTxt, { color: c.mutedForeground }]}>Back to Opportunities</Text>
          </TouchableOpacity>
        </View>
      ) : job ? (
        <ScrollView
        keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Type badge */}
          <View style={styles.badgeRow}>
            {job.type && (
              <View style={[styles.badge, { backgroundColor: c.primary + "15" }]}>
                <Text style={[styles.badgeTxt, { color: c.primary }]}>{job.type}</Text>
              </View>
            )}
            {job.isRemote && (
              <View style={[styles.badge, { backgroundColor: "#10B98115" }]}>
                <Text style={[styles.badgeTxt, { color: "#059669" }]}>Remote</Text>
              </View>
            )}
            {job.isPersonalReferral && (
              <View style={[styles.badge, { backgroundColor: "#6366F115" }]}>
                <Feather name="users" size={11} color="#6366F1" />
                <Text style={[styles.badgeTxt, { color: "#6366F1" }]}>Community Referral</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: c.foreground }]}>{job.title}</Text>

          {/* Company & location */}
          <View style={styles.metaRow}>
            <Feather name="briefcase" size={15} color={c.mutedForeground} />
            <Text style={[styles.metaTxt, { color: c.mutedForeground }]}>{job.company}</Text>
          </View>
          {(job.location || job.isRemote) && (
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={15} color={c.mutedForeground} />
              <Text style={[styles.metaTxt, { color: c.mutedForeground }]}>
                {[job.location, job.isRemote ? "Remote" : null].filter(Boolean).join(" · ")}
              </Text>
            </View>
          )}
          {job.postedByName && (
            <View style={styles.metaRow}>
              <Feather name="user" size={15} color={c.mutedForeground} />
              <Text style={[styles.metaTxt, { color: c.mutedForeground }]}>Shared by {job.postedByName}</Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: c.border }]} />

          {/* Description */}
          {job.description ? (
            <>
              <Text style={[styles.sectionLabel, { color: c.foreground }]}>About this role</Text>
              <Text style={[styles.description, { color: c.mutedForeground }]}>{job.description}</Text>
            </>
          ) : (
            <View style={[styles.noDescCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Feather name="info" size={18} color={c.mutedForeground} />
              <Text style={[styles.noDescTxt, { color: c.mutedForeground }]}>
                No description provided. Tap Apply to learn more about this role.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : null}

      {/* Apply CTA — always visible when job is loaded */}
      {job && !loading && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: c.border, backgroundColor: c.background }]}>
          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: c.primary }]}
            onPress={handleApply}
            activeOpacity={0.85}
          >
            <Feather name="external-link" size={18} color="#FFF" />
            <Text style={styles.applyTxt}>{job.url ? "Apply Now" : "How to Apply"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  errorText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  retryTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  backTxt: { fontSize: 14, fontFamily: "Inter_400Regular" },
  content: { padding: 20, gap: 4 },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30, marginBottom: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  metaTxt: { fontSize: 14, fontFamily: "Inter_400Regular" },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 20 },
  sectionLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
  description: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24 },
  noDescCard: { borderRadius: 12, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  noDescTxt: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 21 },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  applyTxt: { color: "#FFF", fontSize: 16, fontFamily: "Inter_700Bold" },
});
