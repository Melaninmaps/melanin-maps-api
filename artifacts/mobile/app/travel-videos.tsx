import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
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
import { useAuth } from "@/lib/auth";
import { useMembership } from "@/hooks/useMembership";
import { UpgradeModal } from "@/components/UpgradeModal";
import { VideoDetailModal, type VideoItem } from "@/components/VideoDetailModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 20 * 2 - 12) / 2;

// ─── Mock data ────────────────────────────────────────────────────────────────
type VideoCard = VideoItem;

const MOCK_VIDEOS: VideoCard[] = [
  {
    id: "1",
    title: "Hidden Black-owned gems in Salvador, Brazil 🇧🇷",
    destination: "Salvador",
    country: "Brazil",
    creator: "Yara Mensah",
    creatorHandle: "@yaratravels",
    duration: "4:32",
    views: "12.4K",
    likes: "891",
    thumbColor: "#2D7A4F",
    thumbEmoji: "🇧🇷",
    featured: true,
  },
  {
    id: "2",
    title: "Sweet Auburn & BeltLine — ATL's Black cultural corridor",
    destination: "Atlanta",
    country: "USA",
    creator: "Marcus Cole",
    creatorHandle: "@marcusinmotion",
    duration: "6:18",
    views: "34.1K",
    likes: "2.3K",
    thumbColor: "#C9922B",
    thumbEmoji: "🌆",
    featured: true,
  },
  {
    id: "3",
    title: "Accra in 48 hours — where to eat, stay & vibe",
    destination: "Accra",
    country: "Ghana",
    creator: "Nana Ama",
    creatorHandle: "@nanaamagh",
    duration: "8:05",
    views: "28.7K",
    likes: "1.9K",
    thumbColor: "#8B2500",
    thumbEmoji: "🇬🇭",
    featured: true,
  },
  {
    id: "4",
    title: "Treme, New Orleans — soul of the city",
    destination: "New Orleans",
    country: "USA",
    creator: "Dominique Beal",
    creatorHandle: "@dom_explores",
    duration: "5:47",
    views: "9.2K",
    likes: "614",
    thumbColor: "#4A1A6B",
    thumbEmoji: "🎺",
    businessResponse: {
      responder: "Dooky Chase's Restaurant",
      role: "Owner",
      date: "June 14, 2026",
      text: "Thank you for visiting and capturing the spirit of Treme so beautifully. The 45-minute wait you mentioned was during our annual Juneteenth dinner — we were operating at capacity with a packed house. We've since added two additional front-of-house staff and hope you'll consider visiting us again.",
    },
    issueResolved: {
      resolvedDate: "June 22, 2026",
      creatorFollowUp: "Went back last week — completely different experience. No wait, the staff was attentive, and the food was outstanding. The owner genuinely listened. This is what accountability looks like. 🙏🏿",
    },
  },
  {
    id: "5",
    title: "Cape Town: District Six & the Bo-Kaap",
    destination: "Cape Town",
    country: "South Africa",
    creator: "Zola Dlamini",
    creatorHandle: "@zolaontour",
    duration: "7:12",
    views: "15.3K",
    likes: "1.1K",
    thumbColor: "#1A4A8B",
    thumbEmoji: "🇿🇦",
  },
  {
    id: "6",
    title: "Harlem food crawl — old school & new wave",
    destination: "New York",
    country: "USA",
    creator: "Janelle Ford",
    creatorHandle: "@janelleeats",
    duration: "3:58",
    views: "21.0K",
    likes: "1.7K",
    thumbColor: "#CA922B",
    thumbEmoji: "🗽",
    businessResponse: {
      responder: "Sylvia's Restaurant",
      role: "General Manager",
      date: "June 20, 2026",
      text: "Janelle, we're so glad you included us! Your video brought in three new tables this week who mentioned seeing it here — that's the power of authentic community storytelling. We've updated our weekday menu to include the shrimp and grits you highlighted. Come back soon!",
    },
  },
  {
    id: "7",
    title: "Kingston nightlife that doesn't make the tourist guides",
    destination: "Kingston",
    country: "Jamaica",
    creator: "Devon Reid",
    creatorHandle: "@devonjamaica",
    duration: "9:23",
    views: "18.6K",
    likes: "1.4K",
    thumbColor: "#1A6B2B",
    thumbEmoji: "🇯🇲",
  },
  {
    id: "8",
    title: "Houston's Third Ward — culture, history & food",
    destination: "Houston",
    country: "USA",
    creator: "Aaliyah Simmons",
    creatorHandle: "@aaliyah_htx",
    duration: "5:03",
    views: "7.8K",
    likes: "503",
    thumbColor: "#6B3B1A",
    thumbEmoji: "🤠",
  },
];

const DESTINATIONS = [
  "All", "Brazil", "Atlanta", "Accra", "Ghana", "New Orleans",
  "Cape Town", "New York", "Jamaica", "Houston", "Dubai", "Nairobi",
];

const FEED_TABS = ["Trending", "Following", "My Videos"];

const FREE_VIDEO_LIMIT = 5;
const FREE_VIDEO_COUNT = 2; // mock: free user has uploaded 2

// ─── Video Card ───────────────────────────────────────────────────────────────
function VideoTile({
  video,
  colors,
  onPress,
}: {
  video: VideoCard;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tile, { width: CARD_WIDTH, backgroundColor: colors.card }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {/* Thumbnail */}
      <View style={[styles.thumb, { backgroundColor: video.thumbColor }]}>
        <Text style={styles.thumbEmoji}>{video.thumbEmoji}</Text>
        <View style={styles.thumbOverlay}>
          <View style={styles.playBtn}>
            <Ionicons name="play" size={14} color="#fff" />
          </View>
        </View>
        <View style={[styles.durationBadge, { backgroundColor: "rgba(0,0,0,0.65)" }]}>
          <Text style={styles.durationTxt}>{video.duration}</Text>
        </View>
        {video.featured && (
          <View style={[styles.featuredBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.featuredTxt}>Featured</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.tileInfo}>
        <Text style={[styles.tileTitle, { color: colors.foreground }]} numberOfLines={2}>
          {video.title}
        </Text>
        <TouchableOpacity
          style={styles.tileCreatorRow}
          onPress={() => router.push({ pathname: "/creator-profile", params: { handle: video.creatorHandle } } as never)}
          activeOpacity={0.7}
        >
          <View style={[styles.creatorDot, { backgroundColor: video.thumbColor }]} />
          <Text style={[styles.tileCreator, { color: colors.mutedForeground }]} numberOfLines={1}>
            {video.creator}
          </Text>
          <Feather name="chevron-right" size={11} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={styles.tileStats}>
          <Feather name="eye" size={11} color={colors.mutedForeground} />
          <Text style={[styles.tileStat, { color: colors.mutedForeground }]}>{video.views}</Text>
          <Feather name="heart" size={11} color={colors.mutedForeground} />
          <Text style={[styles.tileStat, { color: colors.mutedForeground }]}>{video.likes}</Text>
        </View>
        {video.issueResolved && (
          <View style={[styles.resolvedBadge]}>
            <Feather name="check-circle" size={10} color="#fff" />
            <Text style={styles.resolvedBadgeTxt}>Issue Resolved</Text>
          </View>
        )}
        {!video.issueResolved && video.businessResponse && (
          <View style={[styles.responseBadge, { backgroundColor: colors.primary + "18" }]}>
            <Feather name="briefcase" size={10} color={colors.primary} />
            <Text style={[styles.responseBadgeTxt, { color: colors.primary }]}>Business responded</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function TravelVideosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { subscription } = useMembership();
  const isPremium = subscription !== null && (subscription.productName === "Navigator" || subscription.productName === "Trailblazer");

  const [search, setSearch] = useState("");
  const [activeDestination, setActiveDestination] = useState("All");
  const [activeFeedTab, setActiveFeedTab] = useState("Trending");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoCard | null>(null);

  const filtered = MOCK_VIDEOS.filter((v) => {
    const matchesDestination =
      activeDestination === "All" ||
      v.destination.toLowerCase().includes(activeDestination.toLowerCase()) ||
      v.country.toLowerCase().includes(activeDestination.toLowerCase());
    const matchesSearch =
      !search ||
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.destination.toLowerCase().includes(search.toLowerCase()) ||
      v.creator.toLowerCase().includes(search.toLowerCase());
    return matchesDestination && matchesSearch;
  });

  function handleUpload() {
    if (!isAuthenticated) {
      Alert.alert("Sign in required", "Create a free account to share your travel videos.");
      return;
    }
    if (!isPremium && FREE_VIDEO_COUNT >= FREE_VIDEO_LIMIT) {
      setShowUpgradeModal(true);
      return;
    }
    Alert.alert(
      "Upload Travel Video",
      isPremium
        ? "Video upload coming soon. You'll be able to upload directly from your camera roll."
        : `You've used ${FREE_VIDEO_COUNT} of ${FREE_VIDEO_LIMIT} free uploads. Upgrade for unlimited.`,
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Travel Videos</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Authentic stories from the community
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
          onPress={handleUpload}
          activeOpacity={0.8}
        >
          <Feather name="upload" size={14} color="#fff" />
          <Text style={styles.uploadTxt}>Upload</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        {/* Search */}
        <View style={[styles.searchWrap, { paddingTop: 10 }]}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search destinations, creators..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity activeOpacity={0.85} onPress={() => setSearch("")}>
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sticky: feed tabs + destinations */}
        <View style={{ backgroundColor: colors.background }}>
          {/* Feed tabs */}
          <ScrollView
        keyboardDismissMode="on-drag"
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.feedTabsRow}
          >
            {FEED_TABS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.feedTab,
                  activeFeedTab === t && { backgroundColor: colors.primary },
                ]}
                onPress={() => setActiveFeedTab(t)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.feedTabTxt,
                    { color: activeFeedTab === t ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Destination chips */}
          <ScrollView
        keyboardDismissMode="on-drag"
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {DESTINATIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      activeDestination === d ? colors.primary + "22" : colors.card,
                    borderColor:
                      activeDestination === d ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveDestination(d)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.chipTxt,
                    {
                      color:
                        activeDestination === d ? colors.primary : colors.mutedForeground,
                      fontFamily:
                        activeDestination === d ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Free upload limit bar */}
        {!isPremium && activeFeedTab === "My Videos" && (
          <View style={[styles.limitBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.limitLabelRow}>
                <Text style={[styles.limitLabel, { color: colors.foreground }]}>
                  Video uploads — {FREE_VIDEO_COUNT}/{FREE_VIDEO_LIMIT} used
                </Text>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setShowUpgradeModal(true)}>
                  <Text style={[styles.limitLink, { color: colors.primary }]}>Go unlimited →</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.limitTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.limitFill,
                    {
                      backgroundColor: FREE_VIDEO_COUNT >= FREE_VIDEO_LIMIT ? "#DC2626" : colors.primary,
                      width: `${(FREE_VIDEO_COUNT / FREE_VIDEO_LIMIT) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Premium creator features banner */}
        {!isPremium && activeFeedTab !== "My Videos" && (
          <TouchableOpacity
            style={[styles.creatorBanner, { backgroundColor: "#CA922B" }]}
            onPress={() => setShowUpgradeModal(true)}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 20 }}>🎥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.creatorBannerTitle}>Become a Creator</Text>
              <Text style={styles.creatorBannerSub}>
                Unlimited uploads · Featured travel guides · Creator analytics · AI captions
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#C9922B" />
          </TouchableOpacity>
        )}

        {/* Video grid */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>🗺️</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No videos yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {activeFeedTab === "My Videos"
                ? "Upload your first travel video to get started."
                : "Be the first to share a video from this destination."}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {(activeFeedTab === "My Videos" ? [] : filtered).map((video) => (
              <VideoTile
                key={video.id}
                video={video}
                colors={colors}
                onPress={() => setSelectedVideo(video)}
              />
            ))}
            {activeFeedTab === "My Videos" && (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>📹</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  Your travel videos
                </Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Upload your first video to share your experience with the community.
                </Text>
                <TouchableOpacity
                  style={[styles.emptyUploadBtn, { backgroundColor: colors.primary }]}
                  onPress={handleUpload}
                  activeOpacity={0.8}
                >
                  <Feather name="upload" size={15} color="#fff" />
                  <Text style={styles.emptyUploadTxt}>Upload a Video</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Premium perks footer */}
        {isPremium && (
          <View style={[styles.premiumPerks, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.premiumPerksHeader}>
              <Text style={{ fontSize: 16 }}>⭐</Text>
              <Text style={[styles.premiumPerksTitle, { color: colors.foreground }]}>
                Your Creator Perks
              </Text>
            </View>
            {[
              "Unlimited video uploads (up to 10 min each)",
              "Priority placement in destination searches",
              "Creator analytics for every video",
              "AI-generated captions & hashtags",
              "Destination collections",
              "Creator badge on your profile",
              "Eligible for future creator partnerships",
            ].map((perk, i) => (
              <View key={i} style={styles.perkRow}>
                <Feather name="check-circle" size={14} color={colors.primary} />
                <Text style={[styles.perkTxt, { color: colors.mutedForeground }]}>{perk}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Content policy banner */}
        <View style={[styles.contentPolicyBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="shield" size={14} color={colors.mutedForeground} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.contentPolicyTitle, { color: colors.foreground }]}>Community Content Policy</Text>
            <Text style={[styles.contentPolicyBody, { color: colors.mutedForeground }]}>
              Videos are owned by their creators. Businesses cannot remove community content — they may respond publicly or report to our moderation team for review.
            </Text>
          </View>
        </View>

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="travel video creator tools"
      />

      <VideoDetailModal
        visible={selectedVideo !== null}
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  uploadBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  uploadTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 14, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  feedTabsRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  feedTab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
  },
  feedTabTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  chipsRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  chipTxt: { fontSize: 13 },
  limitBar: {
    marginHorizontal: 16, marginBottom: 12,
    padding: 14, borderRadius: 12, borderWidth: 1, flexDirection: "row",
  },
  limitLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  limitLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  limitLink: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  limitTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  limitFill: { height: "100%", borderRadius: 3 },
  creatorBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginBottom: 14,
    padding: 14, borderRadius: 14,
  },
  creatorBannerTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 3 },
  creatorBannerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#ffffff99" },
  grid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 16, gap: 12,
  },
  tile: { borderRadius: 14, overflow: "hidden" },
  thumb: {
    width: "100%", height: CARD_WIDTH * 0.75,
    alignItems: "center", justifyContent: "center",
  },
  thumbEmoji: { fontSize: 32, opacity: 0.7 },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center", justifyContent: "center",
  },
  playBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
    paddingLeft: 2,
  },
  durationBadge: {
    position: "absolute", bottom: 7, right: 7,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  durationTxt: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#fff" },
  featuredBadge: {
    position: "absolute", top: 7, left: 7,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4,
  },
  featuredTxt: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#fff" },
  tileInfo: { padding: 10, gap: 4 },
  tileTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", lineHeight: 17 },
  tileCreatorRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  creatorDot: { width: 7, height: 7, borderRadius: 4 },
  tileCreator: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  tileStats: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  tileStat: { fontSize: 11, fontFamily: "Inter_400Regular", marginRight: 4 },
  responseBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginTop: 4, alignSelf: "flex-start",
  },
  responseBadgeTxt: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  resolvedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginTop: 4, alignSelf: "flex-start",
    backgroundColor: "#2D7A4F",
  },
  resolvedBadgeTxt: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#fff" },
  contentPolicyBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    margin: 16, padding: 14, borderRadius: 12, borderWidth: 1,
  },
  contentPolicyTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  contentPolicyBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  emptyState: {
    alignItems: "center", paddingVertical: 48, paddingHorizontal: 32,
    width: "100%",
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyUploadBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  emptyUploadTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  premiumPerks: {
    margin: 16, padding: 16, borderRadius: 14, borderWidth: 1, gap: 10,
  },
  premiumPerksHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  premiumPerksTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  perkRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  perkTxt: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
});
