import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

interface Collection {
  id: string; title: string; description: string | null; coverEmoji: string;
  topicId: string | null; followCount: number; itemCount: number;
  creatorFirstName: string | null; creatorLastName: string | null;
  creatorCity: string | null;
}
function creatorDisplayName(col: Collection): string | null {
  const n = [col.creatorFirstName, col.creatorLastName].filter(Boolean).join(" ");
  return n || null;
}

export default function CollectionsIndexScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [collections, setCollections] = useState<Collection[]>([]);
  const [myCollections, setMyCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"browse" | "mine">("browse");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const token = await getToken();
      const [pubRes] = await Promise.all([
        fetch(`${getApiBase()}/api/collections`, { headers: h }),
      ]);
      if (pubRes.ok) {
        const d = await pubRes.json() as { collections: Collection[] };
        setCollections(d.collections ?? []);
      }
      if (token) {
        const meRes = await fetch(`${getApiBase()}/api/profile`, { headers: h });
        if (meRes.ok) {
          const me = await meRes.json() as { id?: string; user?: { id: string } };
          const myId = me.id ?? me.user?.id;
          if (myId) {
            const mineRes = await fetch(`${getApiBase()}/api/collections?userId=${myId}`, { headers: h });
            if (mineRes.ok) {
              const md = await mineRes.json() as { collections: Collection[] };
              setMyCollections(md.collections ?? []);
            }
          }
        }
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const display = activeTab === "browse" ? collections : myCollections;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Community Collections</Text>
            <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Curated guides from the community</Text>
          </View>
          <TouchableOpacity
            style={[s.createBtn, { backgroundColor: "#CA922B" }]}
            onPress={() => router.push("/collections/create" as never)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={15} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={s.tabRow}>
          {(["browse", "mine"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && { borderBottomColor: "#CA922B" }]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[s.tabTxt, { color: activeTab === tab ? "#CA922B" : colors.mutedForeground }, activeTab === tab && { fontWeight: "700" }]}>
                {tab === "browse" ? "Browse All" : "My Collections"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#CA922B" /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 40 }}>
          {display.length === 0 && (
            <View style={s.empty}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📌</Text>
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>
                {activeTab === "browse" ? "No collections yet" : "You haven't created any collections"}
              </Text>
              <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                {activeTab === "browse"
                  ? "Be the first to create a collection — Moving to Atlanta, Best of Philly, Diabetes Resources, and more."
                  : "Create your first collection to save and share businesses, hubs, mentors, and resources."}
              </Text>
              <TouchableOpacity
                style={[s.ctaBtn, { backgroundColor: "#CA922B", marginTop: 16 }]}
                onPress={() => router.push("/collections/create" as never)}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={14} color="#fff" />
                <Text style={s.ctaTxt}>Create a Collection</Text>
              </TouchableOpacity>
            </View>
          )}

          {display.map((col) => (
            <TouchableOpacity
              key={col.id}
              style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/collections/[id]", params: { id: col.id } } as never)}
              activeOpacity={0.75}
            >
              <Text style={s.cardEmoji}>{col.coverEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{col.title}</Text>
                {col.description && (
                  <Text style={[s.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{col.description}</Text>
                )}
                <View style={s.cardMeta}>
                  {creatorDisplayName(col) && <Text style={[s.cardMetaTxt, { color: colors.mutedForeground }]}>by {creatorDisplayName(col)}</Text>}
                  {col.creatorCity && <Text style={[s.cardMetaTxt, { color: colors.mutedForeground }]}>· {col.creatorCity}</Text>}
                  <Text style={[s.cardMetaTxt, { color: colors.mutedForeground }]}>· {col.itemCount} items</Text>
                  <Text style={[s.cardMetaTxt, { color: colors.mutedForeground }]}>· {col.followCount} followers</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 16, paddingBottom: 0, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 12 },
  backBtn: { padding: 6, marginLeft: -6 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 2 },
  createBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  tabRow: { flexDirection: "row" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2.5, borderBottomColor: "transparent" },
  tabTxt: { fontSize: 14 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  cardEmoji: { fontSize: 30 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  cardDesc: { fontSize: 12, lineHeight: 17, marginBottom: 6 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  cardMetaTxt: { fontSize: 11 },
  empty: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  emptySub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  ctaBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 22 },
  ctaTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
