/**
 * City Story — Living Legacy Page
 * Full historical context for a city, opened from Library tab, map banner,
 * or welcome card. Param: slug (e.g. "philadelphia")
 */
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
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
async function getToken() {
  try { return Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token"); }
  catch { return null; }
}

interface CityProfile {
  city: string;
  state: string;
  slug: string;
  launchStatus: string;
  hasProfile: boolean;
  brief_context: string | null;
  historical_context: string | null;
  why_mwm_here: string | null;
  hero_image_url: string | null;
  key_neighborhoods: string[];
  key_figures: string[];
  migration_era: string | null;
  cultural_anchors: string[];
  business_count: number;
  cultural_site_count: number;
  community_story_count: number;
  story_updated_at: string | null;
}

const GOLD = "#CA922B";
const TEAL = "#2D7A4F";

export default function CityStoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [profile, setProfile] = useState<CityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [expandAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${getApiBase()}/api/cities/${slug}/story`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProfile(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load city story");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  function toggleExpand() {
    const toValue = expanded ? 0 : 1;
    Animated.timing(expandAnim, { toValue, duration: 260, useNativeDriver: false }).start();
    setExpanded(!expanded);
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, fontSize: 15 }}>
          {error ?? "City story not available"}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: GOLD, fontSize: 15, fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const paragraphs = profile.historical_context
    ? profile.historical_context.split("\n\n").filter(Boolean)
    : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIconBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerLabel, { color: GOLD }]}>LIVING LEGACY</Text>
          <Text style={[styles.headerCity, { color: colors.foreground }]} numberOfLines={1}>
            {profile.city}, {profile.state}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Era pill */}
        {profile.migration_era && (
          <View style={styles.eraPillRow}>
            <View style={[styles.eraPill, { backgroundColor: GOLD + "18", borderColor: GOLD + "40" }]}>
              <Feather name="clock" size={11} color={GOLD} />
              <Text style={[styles.eraPillTxt, { color: GOLD }]}>{profile.migration_era}</Text>
            </View>
          </View>
        )}

        {/* Stats bar */}
        <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{profile.business_count}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Businesses</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{profile.cultural_site_count}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Heritage Sites</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{profile.community_story_count}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Community Stories</Text>
          </View>
        </View>

        {/* Brief context — always visible */}
        {profile.hasProfile && profile.brief_context ? (
          <View style={styles.section}>
            <View style={[styles.goldBar, { backgroundColor: GOLD }]} />
            <Text style={[styles.briefText, { color: colors.foreground }]}>
              {profile.brief_context}
            </Text>

            {/* Expand / collapse full history */}
            {paragraphs.length > 0 && (
              <>
                <Pressable onPress={toggleExpand} style={styles.expandBtn}>
                  <Text style={[styles.expandTxt, { color: GOLD }]}>
                    {expanded ? "Hide Full History" : "Read Full History"}
                  </Text>
                  <Feather name={expanded ? "chevron-up" : "chevron-down"} size={15} color={GOLD} />
                </Pressable>

                {expanded && (
                  <View style={styles.fullHistory}>
                    {paragraphs.map((para, i) => (
                      <Text key={i} style={[styles.historyPara, { color: colors.foreground }]}>
                        {para.trim()}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={[styles.mutedNote, { color: colors.mutedForeground }]}>
              City story coming soon — check back after the founder visits {profile.city}.
            </Text>
          </View>
        )}

        {/* Why MWM Is Here */}
        {profile.why_mwm_here && (
          <View style={[styles.whyCard, { backgroundColor: TEAL + "10", borderColor: TEAL + "30" }]}>
            <Text style={[styles.whyLabel, { color: TEAL }]}>WHY MWM IS HERE</Text>
            <Text style={[styles.whyText, { color: colors.foreground }]}>{profile.why_mwm_here}</Text>
          </View>
        )}

        {/* Key Neighborhoods */}
        {profile.key_neighborhoods.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Key Neighborhoods</Text>
            <View style={styles.chipRow}>
              {profile.key_neighborhoods.map((n) => (
                <View key={n} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="map-pin" size={10} color={GOLD} />
                  <Text style={[styles.chipTxt, { color: colors.foreground }]}>{n}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Cultural Anchors */}
        {profile.cultural_anchors.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Cultural Anchors</Text>
            <View style={styles.chipRow}>
              {profile.cultural_anchors.map((a) => (
                <View key={a} style={[styles.chip, { backgroundColor: GOLD + "10", borderColor: GOLD + "30" }]}>
                  <Feather name="anchor" size={10} color={GOLD} />
                  <Text style={[styles.chipTxt, { color: GOLD }]}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Key Figures */}
        {profile.key_figures.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Community Pillars</Text>
            <View style={styles.chipRow}>
              {profile.key_figures.map((f) => (
                <View key={f} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="user" size={10} color={colors.mutedForeground} />
                  <Text style={[styles.chipTxt, { color: colors.foreground }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Explore Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Explore {profile.city}</Text>
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/cultural-heritage", params: { city: profile.city } } as never)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#7C3AED18" }]}>
                <Feather name="book-open" size={18} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: colors.foreground }]}>Cultural Heritage Sites</Text>
                <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>HBCUs, landmarks & historic districts</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/city-archive", params: { slug: profile.slug } } as never)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: GOLD + "18" }]}>
                <Feather name="users" size={18} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: colors.foreground }]}>Community Stories</Text>
                <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>Voices & memories from {profile.city}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {profile.story_updated_at && (
          <Text style={[styles.updatedNote, { color: colors.mutedForeground }]}>
            Last updated {new Date(profile.story_updated_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backIconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backBtn: { marginTop: 12 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  headerCity: { fontSize: 17, fontWeight: "700", marginTop: 2 },
  eraPillRow: { paddingHorizontal: 20, paddingTop: 16 },
  eraPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  eraPillTxt: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  statsBar: {
    flexDirection: "row",
    marginHorizontal: 20, marginTop: 14,
    borderRadius: 12, borderWidth: 1,
    paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },
  section: { paddingHorizontal: 20, paddingTop: 22 },
  goldBar: { width: 32, height: 3, borderRadius: 2, marginBottom: 12 },
  briefText: { fontSize: 16, lineHeight: 26, fontWeight: "500" },
  expandBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginTop: 14, alignSelf: "flex-start",
  },
  expandTxt: { fontSize: 14, fontWeight: "700" },
  fullHistory: { marginTop: 16, gap: 16 },
  historyPara: { fontSize: 15, lineHeight: 25, fontWeight: "400" },
  mutedNote: { fontSize: 14, lineHeight: 22, fontStyle: "italic" },
  whyCard: {
    marginHorizontal: 20, marginTop: 22,
    borderRadius: 12, borderWidth: 1,
    padding: 16,
  },
  whyLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8 },
  whyText: { fontSize: 14, lineHeight: 23 },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  chipTxt: { fontSize: 12, fontWeight: "600" },
  actionRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 12, borderWidth: 1,
    padding: 14,
  },
  actionIcon: {
    width: 40, height: 40,
    borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  actionTitle: { fontSize: 14, fontWeight: "700" },
  actionSub: { fontSize: 12, marginTop: 2 },
  updatedNote: { textAlign: "center", fontSize: 11, marginTop: 24, marginBottom: 8 },
});
