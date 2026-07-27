import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/contexts/ThemeContext";

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

interface Disclaimer {
  id: string;
  title: string;
  short: string;
  full: string;
}

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  general:     "info",
  medical:     "heart",
  legal:       "file-text",
  financial:   "dollar-sign",
  employment:  "briefcase",
  safety:      "shield",
  travel:      "map-pin",
  ai:          "cpu",
  community:   "users",
  business:    "check-circle",
  emergency:   "alert-triangle",
  resource:    "book-open",
  external:    "external-link",
  promotions:  "speaker",
  recognition: "award",
};

const POLICY_LINKS = [
  { label: "Community Guidelines", route: "/community-guidelines" },
  { label: "Privacy Policy",       route: "/privacy-policy" },
  { label: "Terms of Service",     route: "/terms" },
  { label: "Safety Philosophy",    route: "/safety-info" },
];

function DisclaimerRow({
  d,
  defaultOpen,
  colors,
  isDark,
}: {
  d: Disclaimer;
  defaultOpen: boolean;
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={[styles.card, { backgroundColor: isDark ? colors.card : "#fff", borderColor: colors.border }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpen(o => !o)}
        style={styles.cardHeader}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: "#CA922B22" }]}>
            <Feather
              name={CATEGORY_ICONS[d.id] ?? "info"}
              size={16}
              color="#CA922B"
            />
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{d.title}</Text>
        </View>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>

      {!open && (
        <Text style={[styles.shortText, { color: colors.mutedForeground }]} numberOfLines={2}>
          {d.short}
        </Text>
      )}

      {open && (
        <View style={[styles.fullTextContainer, { backgroundColor: isDark ? colors.muted : "#FAF6EF", borderTopColor: colors.border }]}>
          <Text style={[styles.fullText, { color: colors.foreground }]}>{d.full}</Text>
        </View>
      )}
    </View>
  );
}

export default function TrustAndSafetyScreen() {
  const colors = useColors();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();

  const [disclaimers, setDisclaimers] = useState<Disclaimer[]>([]);
  const [loading, setLoading] = useState(true);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    const apiBase = getApiBase();
    fetch(`${apiBase}/api/legal/disclaimers`)
      .then(r => r.json())
      .then(d => setDisclaimers(d.disclaimers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: "#2B1507" }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.back}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}
        >
          <Feather name="arrow-left" size={22} color="#F5EBD8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trust & Safety</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Feather name="shield" size={28} color="#CA922B" />
          </View>
          <Text style={styles.heroTitle}>How We Protect You</Text>
          <Text style={styles.heroBody}>
            Mapping with Melanin™ helps people discover businesses, communities, resources, and
            opportunities. We encourage you to verify important information and make decisions
            appropriate for your individual circumstances.
          </Text>
        </View>

        {/* Platform policy links */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PLATFORM POLICIES</Text>
          <View style={[styles.policyCard, { backgroundColor: isDark ? colors.card : "#fff", borderColor: colors.border }]}>
            {POLICY_LINKS.map((p, i) => (
              <TouchableOpacity
                key={p.route}
                activeOpacity={0.7}
                onPress={() => router.push(p.route as never)}
                style={[
                  styles.policyRow,
                  i < POLICY_LINKS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.policyLabel, { color: colors.foreground }]}>{p.label}</Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Disclaimers */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DISCLAIMERS</Text>
          {loading ? (
            <View style={[styles.skeletonCard, { backgroundColor: isDark ? colors.card : "#fff", borderColor: colors.border }]}>
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading…</Text>
            </View>
          ) : (
            <View style={styles.disclaimerList}>
              {disclaimers.map(d => (
                <DisclaimerRow
                  key={d.id}
                  d={d}
                  defaultOpen={params.section === d.id}
                  colors={colors}
                  isDark={isDark}
                />
              ))}
            </View>
          )}
        </View>

        {/* Contact */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Questions about our policies?
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Linking.openURL("mailto:legal@mappingwithmelanin.com")}
          >
            <Text style={styles.footerLink}>legal@mappingwithmelanin.com</Text>
          </TouchableOpacity>
          <Text style={[styles.footerMeta, { color: colors.mutedForeground }]}>
            Last updated July 2026
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { color: "#F5EBD8", fontSize: 18, fontWeight: "700" },
  scroll: { paddingHorizontal: 16, paddingTop: 0 },

  hero: {
    alignItems: "center",
    backgroundColor: "#2B1507",
    marginHorizontal: -16,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    marginBottom: 24,
  },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(202,146,43,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  heroBody: {
    color: "rgba(245,235,216,0.75)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 320,
  },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 2,
  },

  policyCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  policyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  policyLabel: { fontSize: 15, fontWeight: "500" },

  disclaimerList: { gap: 8 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  shortText: {
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  fullTextContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fullText: { fontSize: 13, lineHeight: 20 },

  skeletonCard: {
    borderRadius: 14,
    borderWidth: 1,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { fontSize: 13 },

  footer: { alignItems: "center", paddingTop: 12, gap: 6 },
  footerText: { fontSize: 13 },
  footerLink: { color: "#CA922B", fontSize: 13, fontWeight: "600" },
  footerMeta: { fontSize: 11 },
});
