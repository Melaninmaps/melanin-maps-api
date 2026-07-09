import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import Constants from "expo-constants";

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
  return Platform.OS === "web" ? "" : `http://${host}:8080`;
}

function formatTimeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: "♪", instagram: "◈", youtube: "▶", facebook: "f",
  pinterest: "📌", twitter: "𝕏", x: "𝕏",
};

type Creator = {
  id: number; userId: string; bio: string | null;
  categories: string[]; platforms: { platform: string; handle: string; url: string }[];
  primaryPlatform: string | null; city: string | null; state: string | null;
  isPremier: boolean; firstName: string | null; lastName: string | null;
};

type Post = {
  id: string; authorName: string; authorInitials: string; authorColor: string;
  content: string; category: string; postType: string;
  locationTag: string | null; upvotes: number; commentsCount: number; createdAt: string;
};

function CreatorCard({ creator, onPress }: { creator: Creator; onPress: () => void }) {
  const colors = useColors();
  const initials = [creator.firstName?.[0], creator.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "??";
  const name = [creator.firstName, creator.lastName].filter(Boolean).join(" ") || "Creator";
  const primaryPlatform = creator.platforms.find(p => p.platform === creator.primaryPlatform) ?? creator.platforms[0];

  return (
    <TouchableOpacity
      style={[s.creatorCard, { backgroundColor: colors.card, borderColor: creator.isPremier ? "#F59E0B" : colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {creator.isPremier && (
        <View style={s.premierBadge}>
          <Text style={s.premierText}>⭐ Premier</Text>
        </View>
      )}
      <View style={[s.creatorAvatar, { backgroundColor: "#CA922B" }]}>
        <Text style={s.creatorAvatarText}>{initials}</Text>
      </View>
      <Text style={[s.creatorName, { color: colors.foreground }]} numberOfLines={1}>{name}</Text>
      {creator.city && (
        <Text style={[s.creatorCity, { color: colors.mutedForeground }]} numberOfLines={1}>📍 {creator.city}</Text>
      )}
      {primaryPlatform && (
        <Text style={[s.creatorPlatform, { color: colors.primary }]} numberOfLines={1}>
          {PLATFORM_ICONS[primaryPlatform.platform.toLowerCase()] ?? "🔗"} {primaryPlatform.handle || primaryPlatform.platform}
        </Text>
      )}
      {creator.categories.length > 0 && (
        <Text style={[s.creatorCat, { color: colors.mutedForeground }]} numberOfLines={1}>
          {creator.categories.slice(0, 2).join(" · ")}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function PostRow({ post }: { post: Post }) {
  const colors = useColors();
  return (
    <View style={[s.postRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[s.postAvatar, { backgroundColor: post.authorColor }]}>
        <Text style={s.postInitials}>{post.authorInitials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Text style={[s.postAuthor, { color: colors.foreground }]}>{post.authorName}</Text>
          <Text style={[s.postTime, { color: colors.mutedForeground }]}>{formatTimeAgo(post.createdAt)}</Text>
        </View>
        <Text style={[s.postContent, { color: colors.foreground }]} numberOfLines={3}>{post.content}</Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Feather name="arrow-up" size={12} color={colors.mutedForeground} />
            <Text style={[s.postMeta, { color: colors.mutedForeground }]}>{post.upvotes}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Feather name="message-circle" size={12} color={colors.mutedForeground} />
            <Text style={[s.postMeta, { color: colors.mutedForeground }]}>{post.commentsCount}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function LocationFeedScreen() {
  const { location } = useLocalSearchParams<{ location: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    fetch(`${getApiBase()}/api/location-feed/${encodeURIComponent(location)}`)
      .then(r => r.json())
      .then((data: { creators?: Creator[]; posts?: Post[] }) => {
        setCreators(data.creators ?? []);
        setPosts(data.posts ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [location]);

  const premierCreators = creators.filter(c => c.isPremier);
  const otherCreators = creators.filter(c => !c.isPremier);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={s.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.locationPill}>
            <Feather name="map-pin" size={14} color="#0369A1" />
            <Text style={s.locationPillText}>{location}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Loading {location} feed…</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={p => p.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListHeaderComponent={
            <View>
              {/* Premier creators */}
              {premierCreators.length > 0 && (
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: "#F59E0B", letterSpacing: 0.8, textTransform: "uppercase" }}>
                      ⭐ Premier Creators — {location}
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingVertical: 4 }}>
                    {premierCreators.map(c => (
                      <CreatorCard
                        key={c.id}
                        creator={c}
                        onPress={() => router.push({ pathname: "/creator-public", params: { userId: c.userId } } as any)}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Other creators covering this location */}
              {otherCreators.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: colors.foreground }]}>Creators covering {location}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingVertical: 4 }}>
                    {otherCreators.map(c => (
                      <CreatorCard
                        key={c.id}
                        creator={c}
                        onPress={() => router.push({ pathname: "/creator-public", params: { userId: c.userId } } as any)}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Posts header */}
              <View style={s.section}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16 }}>
                  <Feather name="message-square" size={15} color={colors.primary} />
                  <Text style={[s.sectionTitle, { color: colors.foreground }]}>Posts from {location}</Text>
                </View>
              </View>

              {posts.length === 0 && (
                <View style={s.emptyState}>
                  <Feather name="map" size={36} color={colors.muted} />
                  <Text style={[s.emptyTitle, { color: colors.foreground }]}>No posts yet for {location}</Text>
                  <Text style={[s.emptySub, { color: colors.mutedForeground }]}>Be the first to tag this location in a community post.</Text>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => <PostRow post={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  locationPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#0369A115", borderWidth: 1, borderColor: "#0369A130" },
  locationPillText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0369A1" },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  section: { paddingTop: 20, paddingBottom: 4 },
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 10 },
  creatorCard: { width: 140, padding: 14, borderRadius: 16, borderWidth: 1.5, alignItems: "center", gap: 6, position: "relative" },
  premierBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "#F59E0B22", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  premierText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#F59E0B" },
  creatorAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  creatorAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  creatorName: { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "center" },
  creatorCity: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  creatorPlatform: { fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  creatorCat: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  postRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  postAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  postInitials: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  postAuthor: { fontSize: 13, fontFamily: "Inter_700Bold" },
  postTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  postContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  postMeta: { fontSize: 12, fontFamily: "Inter_500Medium" },
  emptyState: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
});
