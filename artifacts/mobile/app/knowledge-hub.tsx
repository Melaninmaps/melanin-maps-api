import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Channel { id: string; slug: string; label: string; icon: string; description?: string; color?: string }
interface Article { id: string; title: string; category: string; excerpt?: string }
interface Business { id: string; name: string; category: string; city: string; verified: boolean }
interface Event { id: string; title: string; category: string; city: string; event_date: string }

interface ChannelDetail {
  channel: Channel;
  articles: Article[];
  businesses: Business[];
  events: Event[];
}

export default function KnowledgeHubScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelDetail | null>(null);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelLoading, setChannelLoading] = useState(false);
  const primaryGold = "#CA922B";

  const getApiBase = () =>
    process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

  const getToken = async () => {
    try { return await SecureStore.getItemAsync("auth_session_token"); } catch { return null; }
  };

  const authHeaders = (token: string | null): Record<string, string> =>
    token ? { Authorization: `Bearer ${token}` } : {};

  const loadChannels = useCallback(async () => {
    setLoading(true);
    try {
      const apiBase = getApiBase();
      const token = await getToken();
      const [channelsRes, followingRes] = await Promise.all([
        fetch(`${apiBase}/api/channels`),
        token ? fetch(`${apiBase}/api/channels/my/following`, { headers: authHeaders(token) }) : null,
      ]);
      if (channelsRes.ok) {
        const d = await channelsRes.json() as { channels: Channel[] };
        setChannels(d.channels);
      }
      if (followingRes?.ok) {
        const d = await followingRes.json() as { following: string[] };
        setFollowing(d.following);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadChannels(); }, [loadChannels]);

  const openChannel = async (slug: string) => {
    setChannelLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/channels/${slug}`);
      if (res.ok) {
        const d = await res.json() as ChannelDetail;
        setSelectedChannel(d);
      }
    } catch { /* silent */ } finally { setChannelLoading(false); }
  };

  const toggleFollow = async (slug: string) => {
    const token = await getToken();
    if (!token) return;
    const isFollowing = following.includes(slug);
    setFollowing((prev) => isFollowing ? prev.filter((s) => s !== slug) : [...prev, slug]);
    try {
      await fetch(`${getApiBase()}/api/channels/${slug}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ follow: !isFollowing }),
      });
    } catch { /* silent */ }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={primaryGold} />
      </View>
    );
  }

  if (selectedChannel) {
    const { channel, articles, businesses, events } = selectedChannel;
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedChannel(null)} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.channelHeaderInfo}>
            <Text style={styles.channelHeaderIcon}>{channel.icon}</Text>
            <Text style={[styles.channelHeaderLabel, { color: colors.foreground }]}>{channel.label}</Text>
          </View>
          <TouchableOpacity
            style={[styles.followBtn, { backgroundColor: following.includes(channel.slug) ? channel.color + "20" : colors.card, borderColor: following.includes(channel.slug) ? channel.color + "60" : colors.border }]}
            onPress={() => void toggleFollow(channel.slug)}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: following.includes(channel.slug) ? (channel.color ?? primaryGold) : colors.mutedForeground }}>
              {following.includes(channel.slug) ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 16 }}>
          {channel.description && (
            <Text style={[styles.channelDesc, { color: colors.mutedForeground }]}>{channel.description}</Text>
          )}

          {articles.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📖 Articles & Resources</Text>
              {articles.map((a) => (
                <TouchableOpacity key={a.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.85}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{a.title}</Text>
                    <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>{a.category}</Text>
                    {a.excerpt && <Text style={[styles.cardExcerpt, { color: colors.mutedForeground }]} numberOfLines={2}>{a.excerpt}</Text>}
                  </View>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {businesses.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🏪 Local Businesses</Text>
              {businesses.map((b) => (
                <TouchableOpacity key={b.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push(`/business/${b.id}` as any)} activeOpacity={0.85}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{b.name}</Text>
                      {b.verified && <Text style={{ fontSize: 11, color: "#16A34A", fontWeight: "700" }}>✓</Text>}
                    </View>
                    <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>{b.category} · {b.city}</Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {events.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📅 Upcoming Events</Text>
              {events.map((e) => (
                <TouchableOpacity key={e.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push(`/event/${e.id}` as any)} activeOpacity={0.85}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{e.title}</Text>
                    <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>{e.city} · {new Date(e.event_date).toLocaleDateString()}</Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {articles.length === 0 && businesses.length === 0 && events.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>{channel.icon}</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Coming soon</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>This channel is growing — follow it to be notified when new resources are added.</Text>
              <TouchableOpacity style={[styles.followBtnLarge, { backgroundColor: channel.color ?? primaryGold }]} onPress={() => void toggleFollow(channel.slug)}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{following.includes(channel.slug) ? "Following" : "Follow Channel"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {channelLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={primaryGold} />
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Knowledge Hub</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 16 }}>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>Every question answered.</Text>
        <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>12 channels. Businesses, experts, events, and articles — all organized by what matters to your life.</Text>

        {following.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Channels</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              {channels.filter((c) => following.includes(c.slug)).map((ch) => (
                <TouchableOpacity
                  key={ch.slug}
                  style={[styles.followedChip, { backgroundColor: (ch.color ?? primaryGold) + "15", borderColor: (ch.color ?? primaryGold) + "40" }]}
                  onPress={() => void openChannel(ch.slug)}
                >
                  <Text style={{ fontSize: 16 }}>{ch.icon}</Text>
                  <Text style={[styles.followedChipLabel, { color: ch.color ?? primaryGold }]}>{ch.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All Channels</Text>
        <View style={styles.channelGrid}>
          {channels.map((ch) => (
            <TouchableOpacity
              key={ch.slug}
              style={[styles.channelCard, { backgroundColor: colors.card, borderColor: following.includes(ch.slug) ? (ch.color ?? primaryGold) + "60" : colors.border }]}
              onPress={() => void openChannel(ch.slug)}
              activeOpacity={0.85}
            >
              <View style={[styles.channelIconWrap, { backgroundColor: (ch.color ?? primaryGold) + "20" }]}>
                <Text style={styles.channelIcon}>{ch.icon}</Text>
              </View>
              <Text style={[styles.channelCardLabel, { color: colors.foreground }]}>{ch.label}</Text>
              {ch.description && <Text style={[styles.channelCardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{ch.description}</Text>}
              {following.includes(ch.slug) && (
                <View style={[styles.followingDot, { backgroundColor: ch.color ?? primaryGold }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center" },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  heroTitle: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  heroSub: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  channelGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  channelCard: { width: "47%", borderRadius: 14, borderWidth: 1.5, padding: 14, position: "relative" },
  channelIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  channelIcon: { fontSize: 22 },
  channelCardLabel: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  channelCardDesc: { fontSize: 11, lineHeight: 15 },
  followingDot: { position: "absolute", top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
  followedChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, marginHorizontal: 4 },
  followedChipLabel: { fontSize: 13, fontWeight: "600" },
  channelHeaderInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  channelHeaderIcon: { fontSize: 20 },
  channelHeaderLabel: { fontSize: 16, fontWeight: "700" },
  channelDesc: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  followBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  followBtnLarge: { borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 12 },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 13, marginBottom: 8, gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  cardMeta: { fontSize: 12, marginBottom: 2 },
  cardExcerpt: { fontSize: 12, lineHeight: 17 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: "center" },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  emptySub: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  loadingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" },
});
