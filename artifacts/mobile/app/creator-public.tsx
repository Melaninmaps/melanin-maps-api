import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import Constants from "expo-constants";

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
  return Platform.OS === "web" ? "" : `http://${host}:8080`;
}

const PLATFORM_META: Record<string, { label: string; icon: string; color: string }> = {
  tiktok:    { label: "TikTok",     icon: "♪",  color: "#010101" },
  instagram: { label: "Instagram",  icon: "◈",  color: "#E1306C" },
  youtube:   { label: "YouTube",    icon: "▶",  color: "#FF0000" },
  facebook:  { label: "Facebook",   icon: "f",  color: "#1877F2" },
  pinterest: { label: "Pinterest",  icon: "📌", color: "#E60023" },
  twitter:   { label: "X / Twitter", icon: "𝕏", color: "#000000" },
  x:         { label: "X",          icon: "𝕏",  color: "#000000" },
};

type CreatorData = {
  id: number;
  userId: string;
  bio: string | null;
  categories: string[];
  platforms: { platform: string; handle: string; url: string }[];
  primaryPlatform: string | null;
  city: string | null;
  state: string | null;
  isPremier: boolean;
  coveredLocations: string[];
  isPublic: boolean;
  user: { firstName: string | null; lastName: string | null; profileImageUrl: string | null } | null;
};

export default function CreatorPublicScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CreatorData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`${getApiBase()}/api/creator-profile/${encodeURIComponent(userId)}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then((data: { profile?: CreatorData } | null) => { if (data?.profile) setProfile(data.profile); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  const name = profile
    ? [profile.user?.firstName, profile.user?.lastName].filter(Boolean).join(" ") || "Creator"
    : "";
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "??";

  const openLink = (url: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url).catch(() => {});
  };

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  if (notFound || !profile) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.centerState}>
          <Feather name="user-x" size={40} color={colors.muted} />
          <Text style={[s.notFoundTitle, { color: colors.foreground }]}>Creator not found</Text>
        </View>
      </View>
    );
  }

  const primaryPlatform = profile.platforms.find(p => p.platform === profile.primaryPlatform) ?? profile.platforms[0];
  const otherPlatforms = profile.platforms.filter(p => p !== primaryPlatform);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad + 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero header */}
        <View style={[s.hero, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={s.backInHero} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>

          <View style={[s.avatarRing, { borderColor: profile.isPremier ? "#F59E0B" : colors.primary + "40" }]}>
            <View style={[s.avatar, { backgroundColor: colors.primary }]}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </View>
          </View>

          {profile.isPremier && (
            <View style={[s.premierBadge, { backgroundColor: "#F59E0B20", borderColor: "#F59E0B40" }]}>
              <Text style={s.premierText}>⭐ Premier Creator</Text>
            </View>
          )}

          <Text style={[s.name, { color: colors.foreground }]}>{name}</Text>

          {(profile.city || profile.state) && (
            <View style={s.locationRow}>
              <Feather name="map-pin" size={13} color={colors.mutedForeground} />
              <Text style={[s.locationText, { color: colors.mutedForeground }]}>
                {[profile.city, profile.state].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}

          {profile.bio && (
            <Text style={[s.bio, { color: colors.foreground }]}>{profile.bio}</Text>
          )}

          {profile.categories.length > 0 && (
            <View style={s.catRow}>
              {profile.categories.map(cat => (
                <View key={cat} style={[s.catChip, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                  <Text style={[s.catText, { color: colors.primary }]}>{cat}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Primary platform — big link card */}
        {primaryPlatform && (
          <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>MAIN CHANNEL</Text>
            <TouchableOpacity
              style={[s.primaryPlatformCard, {
                backgroundColor: (PLATFORM_META[primaryPlatform.platform.toLowerCase()]?.color ?? colors.primary) + "14",
                borderColor: (PLATFORM_META[primaryPlatform.platform.toLowerCase()]?.color ?? colors.primary) + "40",
              }]}
              onPress={() => primaryPlatform.url && openLink(primaryPlatform.url)}
              activeOpacity={0.8}
            >
              <View style={[s.platformIconLarge, {
                backgroundColor: (PLATFORM_META[primaryPlatform.platform.toLowerCase()]?.color ?? colors.primary) + "20",
              }]}>
                <Text style={{ fontSize: 22 }}>
                  {PLATFORM_META[primaryPlatform.platform.toLowerCase()]?.icon ?? "🔗"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.platformLabel, { color: colors.foreground }]}>
                  {PLATFORM_META[primaryPlatform.platform.toLowerCase()]?.label ?? primaryPlatform.platform}
                </Text>
                <Text style={[s.platformHandle, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {primaryPlatform.handle || primaryPlatform.url}
                </Text>
              </View>
              <View style={[s.visitBtn, { backgroundColor: PLATFORM_META[primaryPlatform.platform.toLowerCase()]?.color ?? colors.primary }]}>
                <Feather name="external-link" size={14} color="#FFFFFF" />
                <Text style={s.visitBtnText}>Visit</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Other platforms */}
        {otherPlatforms.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>ALSO ON</Text>
            <View style={{ gap: 10 }}>
              {otherPlatforms.map((p) => {
                const meta = PLATFORM_META[p.platform.toLowerCase()];
                return (
                  <TouchableOpacity
                    key={p.platform}
                    style={[s.platformRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => p.url && openLink(p.url)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.platformIconSmall, { backgroundColor: (meta?.color ?? colors.primary) + "18" }]}>
                      <Text style={{ fontSize: 16 }}>{meta?.icon ?? "🔗"}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.platformLabel, { color: colors.foreground }]}>{meta?.label ?? p.platform}</Text>
                      <Text style={[s.platformHandle, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {p.handle || p.url}
                      </Text>
                    </View>
                    <Feather name="external-link" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Covered locations */}
        {profile.coveredLocations.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>COVERS</Text>
            <View style={s.locationTags}>
              {profile.coveredLocations.map(loc => (
                <TouchableOpacity
                  key={loc}
                  style={[s.locationTag, { backgroundColor: "#0369A112", borderColor: "#0369A130" }]}
                  onPress={() => router.push({ pathname: "/location-feed", params: { location: loc } } as any)}
                  activeOpacity={0.8}
                >
                  <Feather name="map-pin" size={11} color="#0369A1" />
                  <Text style={[s.locationTagText, { color: "#0369A1" }]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {profile.platforms.length === 0 && (
          <View style={s.noLinksState}>
            <Feather name="link" size={28} color={colors.muted} />
            <Text style={[s.noLinksTxt, { color: colors.mutedForeground }]}>No social links added yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  backBtn: { padding: 16 },
  backInHero: { position: "absolute", top: 16, left: 16, zIndex: 10, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  hero: { alignItems: "center", paddingHorizontal: 20, paddingBottom: 24, gap: 10, borderBottomWidth: 1 },
  avatarRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, alignItems: "center", justifyContent: "center", marginTop: 44 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 30, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  premierBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  premierText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#F59E0B" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  bio: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, textAlign: "center", maxWidth: 320 },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  catChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  catText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 },
  primaryPlatformCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1.5 },
  platformIconLarge: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  platformRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  platformIconSmall: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  platformLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  platformHandle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  visitBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  visitBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  locationTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  locationTag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  locationTagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  noLinksState: { alignItems: "center", paddingVertical: 32, gap: 10 },
  noLinksTxt: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
