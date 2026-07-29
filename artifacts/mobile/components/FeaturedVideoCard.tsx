import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export type VideoPurpose =
  | "meet_the_owner" | "our_story" | "customer_experience"
  | "product_demo" | "service_showcase" | "restaurant_tour"
  | "travel_guide" | "event_recap" | "community_story" | "behind_the_scenes";

export const VIDEO_PURPOSES: { id: VideoPurpose; label: string; emoji: string }[] = [
  { id: "meet_the_owner",       label: "Meet the Owner",       emoji: "👤" },
  { id: "our_story",            label: "Our Story",            emoji: "📖" },
  { id: "customer_experience",  label: "Customer Experience",  emoji: "🌟" },
  { id: "product_demo",         label: "Product Demo",         emoji: "📦" },
  { id: "service_showcase",     label: "Service Showcase",     emoji: "🛠️" },
  { id: "restaurant_tour",      label: "Restaurant Tour",      emoji: "🍽️" },
  { id: "travel_guide",         label: "Travel Guide",         emoji: "✈️" },
  { id: "event_recap",          label: "Event Recap",          emoji: "🎉" },
  { id: "community_story",      label: "Community Story",      emoji: "🤎" },
  { id: "behind_the_scenes",    label: "Behind the Scenes",    emoji: "🎬" },
];

type Platform2 = "youtube" | "tiktok" | "instagram" | "facebook" | "vimeo" | "unknown";

export function detectPlatform(url: string): Platform2 {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("facebook.com") || u.includes("fb.watch")) return "facebook";
  if (u.includes("vimeo.com")) return "vimeo";
  return "unknown";
}

export function getYoutubeThumbnail(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

const PLATFORM_META: Record<Platform2, { label: string; color: string; icon: string }> = {
  youtube:   { label: "YouTube",   color: "#FF0000", icon: "▶" },
  tiktok:    { label: "TikTok",    color: "#010101", icon: "♪" },
  instagram: { label: "Instagram", color: "#C13584", icon: "◈" },
  facebook:  { label: "Facebook",  color: "#1877F2", icon: "f" },
  vimeo:     { label: "Vimeo",     color: "#1AB7EA", icon: "v" },
  unknown:   { label: "Video",     color: "#666",    icon: "▶" },
};

type Props = {
  videoUrl: string;
  videoTitle?: string | null;
  videoPurpose?: string | null;
  businessName?: string;
};

export default function FeaturedVideoCard({ videoUrl, videoTitle, videoPurpose, businessName }: Props) {
  const colors = useColors();
  const platform = detectPlatform(videoUrl);
  const meta = PLATFORM_META[platform];
  const thumbnail = platform === "youtube" ? getYoutubeThumbnail(videoUrl) : null;
  const purpose = VIDEO_PURPOSES.find(p => p.id === videoPurpose);

  const sectionTitle = purpose
    ? `${purpose.emoji} ${purpose.label === "Meet the Owner" ? "Watch Our Story" : purpose.label === "Restaurant Tour" ? "See Us in Action" : "Watch Our Story"}`
    : "🎥 Watch Our Story";

  const displayTitle = videoTitle?.trim()
    || (businessName ? `A story from ${businessName}` : "Watch this video");

  const handleOpen = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(videoUrl).catch(() => {});
  };

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={s.header}>
        <Text style={[s.sectionLabel, { color: colors.foreground }]}>{sectionTitle}</Text>
        {purpose && (
          <View style={[s.purposeBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
            <Text style={[s.purposeText, { color: colors.primary }]}>🎥 {purpose.label}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity activeOpacity={0.88} onPress={handleOpen} style={s.playerWrap}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={s.thumbnail} contentFit="cover" />
        ) : (
          <View style={[s.thumbnailFallback, { backgroundColor: meta.color + "22" }]}>
            <Text style={[s.thumbnailIcon, { color: meta.color }]}>{meta.icon}</Text>
          </View>
        )}
        <View style={s.overlay}>
          <View style={[s.playBtn, { backgroundColor: meta.color }]}>
            <Feather name="play" size={22} color="#FFF" />
          </View>
        </View>
        <View style={[s.platformBadge, { backgroundColor: meta.color }]}>
          <Text style={s.platformLabel}>{meta.label}</Text>
        </View>
      </TouchableOpacity>

      <View style={s.footer}>
        <Feather name="video" size={13} color={colors.mutedForeground} />
        <Text style={[s.videoTitle, { color: colors.foreground }]} numberOfLines={2}>{displayTitle}</Text>
      </View>
      <Text style={[s.hostedOn, { color: colors.mutedForeground }]}>
        Hosted on {meta.label} · Opens in app
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, gap: 8 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 15, flex: 1 },
  purposeBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  purposeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  playerWrap: { height: 190, position: "relative" },
  thumbnail: { width: "100%", height: "100%" },
  thumbnailFallback: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  thumbnailIcon: { fontSize: 48, fontWeight: "700" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.25)" },
  playBtn: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  platformBadge: { position: "absolute", top: 10, right: 10, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  platformLabel: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 11 },
  footer: { flexDirection: "row", alignItems: "flex-start", gap: 7, paddingHorizontal: 14, paddingTop: 10 },
  videoTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1, lineHeight: 20 },
  hostedOn: { fontFamily: "Inter_400Regular", fontSize: 11, paddingHorizontal: 14, paddingBottom: 12, marginTop: 2 },
});
