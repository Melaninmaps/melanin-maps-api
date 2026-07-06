import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
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
async function authHeaders() { const t = await getToken(); return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }; }

interface Collection { id: string; title: string; description: string | null; coverEmoji: string; isPublic: boolean; followCount: number; itemCount: number; userId: string; creatorFirstName: string | null; creatorLastName: string | null; creatorAvatar: string | null; creatorCity: string | null; }
function creatorDisplayName(c: Collection): string | null {
  const n = [c.creatorFirstName, c.creatorLastName].filter(Boolean).join(" ");
  return n || null;
}
interface CollectionItem { id: string; itemType: string; itemId: string; itemName: string | null; itemEmoji: string | null; note: string | null; displayOrder: number; }

const ITEM_TYPE_EMOJI: Record<string, string> = {
  business: "🏢", hub: "✦", post: "💬", mentor: "🌟", place: "📍", event: "🎉", link: "🔗",
};

export default function CollectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const h = await authHeaders();
      setIsAuthenticated(!!(await getToken()));
      const res = await fetch(`${getApiBase()}/api/collections/${id}`, { headers: h });
      if (res.ok) {
        const data = await res.json() as { collection: Collection; items: CollectionItem[] };
        setCollection(data.collection);
        setItems(data.items);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function toggleFollow() {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    setFollowLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const h = await authHeaders();
      const method = following ? "DELETE" : "POST";
      const res = await fetch(`${getApiBase()}/api/collections/${id}/follow`, { method, headers: h });
      if (res.ok) setFollowing(!following);
    } catch { /* silent */ } finally { setFollowLoading(false); }
  }

  function navToItem(item: CollectionItem) {
    if (item.itemType === "business") router.push({ pathname: "/business/[id]", params: { id: item.itemId } } as never);
    else if (item.itemType === "hub") router.push({ pathname: "/library-topic", params: { topicId: item.itemId } } as never);
    else if (item.itemType === "mentor") router.push({ pathname: "/profile/[id]", params: { id: item.itemId } } as never);
  }

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

  const grouped = items.reduce<Record<string, CollectionItem[]>>((acc, item) => {
    const key = item.itemType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={[s.followBtn, { backgroundColor: following ? "#CA922B" : "transparent", borderColor: "#CA922B" }]}
            onPress={toggleFollow}
            disabled={followLoading}
            activeOpacity={0.8}
          >
            {followLoading
              ? <ActivityIndicator size="small" color={following ? "#fff" : "#CA922B"} />
              : <Feather name={following ? "bookmark" : "bookmark"} size={14} color={following ? "#fff" : "#CA922B"} />}
            <Text style={[s.followBtnTxt, { color: following ? "#fff" : "#CA922B" }]}>
              {following ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[s.collectionEmoji]}>{collection?.coverEmoji ?? "📌"}</Text>
        <Text style={[s.collectionTitle, { color: colors.foreground }]}>{collection?.title}</Text>
        {collection?.description && (
          <Text style={[s.collectionDesc, { color: colors.mutedForeground }]}>{collection.description}</Text>
        )}
        <View style={s.metaRow}>
          {collection && creatorDisplayName(collection) && (
            <Text style={[s.metaTxt, { color: colors.mutedForeground }]}>by {creatorDisplayName(collection)}</Text>
          )}
          {collection?.creatorCity && (
            <Text style={[s.metaTxt, { color: colors.mutedForeground }]}>· {collection.creatorCity}</Text>
          )}
          <Text style={[s.metaTxt, { color: colors.mutedForeground }]}>· {collection?.itemCount ?? 0} items</Text>
          <Text style={[s.metaTxt, { color: colors.mutedForeground }]}>· {collection?.followCount ?? 0} followers</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 8 }}>
        {items.length === 0 && (
          <View style={s.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📌</Text>
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>Nothing here yet</Text>
            <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
              The creator of this collection hasn't added anything yet.
            </Text>
          </View>
        )}

        {Object.entries(grouped).map(([type, typeItems]) => (
          <View key={type} style={s.group}>
            <Text style={[s.groupLabel, { color: colors.mutedForeground }]}>
              {ITEM_TYPE_EMOJI[type] ?? "📌"} {type.charAt(0).toUpperCase() + type.slice(1)}s
            </Text>
            {typeItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[s.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navToItem(item)}
                activeOpacity={0.75}
              >
                <Text style={s.itemEmoji}>{item.itemEmoji ?? ITEM_TYPE_EMOJI[item.itemType] ?? "📌"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.itemName, { color: colors.foreground }]} numberOfLines={2}>
                    {item.itemName ?? "Untitled"}
                  </Text>
                  {item.note && (
                    <Text style={[s.itemNote, { color: colors.mutedForeground }]} numberOfLines={2}>{item.note}</Text>
                  )}
                </View>
                {(type === "business" || type === "hub" || type === "mentor") && (
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backBtn: { padding: 6, marginLeft: -6, marginRight: 10 },
  followBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  followBtnTxt: { fontSize: 13, fontWeight: "700" },
  collectionEmoji: { fontSize: 32, marginBottom: 6 },
  collectionTitle: { fontSize: 22, fontWeight: "700", lineHeight: 28, marginBottom: 4 },
  collectionDesc: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  metaTxt: { fontSize: 12 },
  group: { marginTop: 16, paddingHorizontal: 16 },
  groupLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  itemCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  itemEmoji: { fontSize: 22 },
  itemName: { fontSize: 14, fontWeight: "600" },
  itemNote: { fontSize: 12, marginTop: 2 },
  empty: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  emptySub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
});
