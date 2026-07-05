import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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

interface MentorProfile {
  id: string;
  userId: string;
  fullName: string;
  bio: string | null;
  industry: string | null;
  role: string;
  expertise: string | null;
  city: string | null;
  linkedinUrl: string | null;
  createdAt: string;
}

const ROLE_COLORS: Record<string, { color: string; label: string }> = {
  mentor: { color: "#2D7A4F", label: "Mentor" },
  mentee: { color: "#1D4ED8", label: "Mentee" },
  both: { color: "#7B2D8B", label: "Mentor & Mentee" },
};

const AVATAR_COLORS = ["#CA922B", "#2D7A4F", "#CA922B", "#1D4ED8", "#7B2D8B"];

function getApiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}
async function getToken() {
  try { return await SecureStore.getItemAsync("auth_session_token"); } catch { return null; }
}

export default function MentorshipScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profiles, setProfiles] = useState<MentorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "mentor" | "mentee">("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    async function load() {
      const apiBase = getApiBase();
      if (!apiBase) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (roleFilter !== "all") params.set("role", roleFilter);
        const res = await fetch(`${apiBase}/api/mentorship?${params}`);
        if (res.ok) {
          const data = await res.json() as { profiles: MentorProfile[] };
          setProfiles(data.profiles);
        }
      } catch {}
      setIsLoading(false);
    }
    load();
  }, [roleFilter]);

  const filtered = profiles.filter((p) =>
    search.length === 0 ||
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (p.city ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.industry ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const renderProfile = ({ item: p }: { item: MentorProfile }) => {
    const rc = ROLE_COLORS[p.role] ?? ROLE_COLORS.mentor;
    const initials = p.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const avatarBg = AVATAR_COLORS[p.fullName.charCodeAt(0) % AVATAR_COLORS.length];
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.foreground }]}>{p.fullName}</Text>
            <View style={styles.metaRow}>
              {p.industry && (
                <View style={styles.metaItem}>
                  <Feather name="briefcase" size={11} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{p.industry}</Text>
                </View>
              )}
              {p.city && (
                <View style={styles.metaItem}>
                  <Feather name="map-pin" size={11} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{p.city}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.rolePill, { backgroundColor: rc.color + "18" }]}>
            <Text style={[styles.roleText, { color: rc.color }]}>{rc.label}</Text>
          </View>
        </View>
        {p.bio ? (
          <Text style={[styles.bio, { color: colors.foreground }]} numberOfLines={3}>{p.bio}</Text>
        ) : null}
        {p.expertise ? (
          <View style={styles.expertiseRow}>
            {p.expertise.split(",").slice(0, 3).map((ex) => (
              <View key={ex.trim()} style={[styles.expertisePill, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.expertiseText, { color: colors.secondaryForeground }]}>{ex.trim()}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.availRow}>
          <View style={styles.availDot} />
          <Text style={styles.availText}>Available for connection</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Mentorship Network</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.searchRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchWrap, { backgroundColor: colors.muted }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, city, industry…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        {(["all", "mentor", "mentee"] as const).map((r) => (
          <TouchableOpacity activeOpacity={0.85}
            key={r}
            style={[styles.filterChip, { backgroundColor: roleFilter === r ? colors.primary : colors.secondary, borderColor: roleFilter === r ? colors.primary : colors.border }]}
            onPress={() => setRoleFilter(r)}
          >
            <Text style={[styles.filterText, { color: roleFilter === r ? "#FFFFFF" : colors.foreground }]}>
              {r === "all" ? "All" : r === "mentor" ? "Mentors" : "Mentees"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Feather name="users" size={40} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No profiles yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Be the first to join the mentorship network
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          renderItem={renderProfile}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  filterRow: {
    flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  card: {
    borderRadius: 16, borderWidth: 1, padding: 14, gap: 10,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#FFFFFF" },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 3 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  roleText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  bio: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  expertiseRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  expertisePill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  expertiseText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  availRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  availDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#2D7A4F" },
  availText: { fontFamily: "Inter_500Medium", fontSize: 11, color: "#2D7A4F" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", paddingHorizontal: 40 },
});
