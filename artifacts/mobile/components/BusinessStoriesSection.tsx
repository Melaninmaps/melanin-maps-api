import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { type BusinessStory } from "@/hooks/useStories";

interface Props {
  stories: BusinessStory[];
}

const TYPE_CONFIG: Record<string, { icon: "star" | "tag" | "calendar" | "award"; color: string; label: string }> = {
  update: { icon: "star", color: "#2D7A4F", label: "Update" },
  offer: { icon: "tag", color: "#CA922B", label: "Special Offer" },
  event: { icon: "calendar", color: "#1D4ED8", label: "Event" },
  milestone: { icon: "award", color: "#7B2D8B", label: "Milestone" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

export function BusinessStoriesSection({ stories }: Props) {
  const colors = useColors();
  if (stories.length === 0) return null;

  return (
    <View>
      <Text style={[styles.title, { color: colors.foreground }]}>From the Owner</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {stories.map((story) => {
          const cfg = TYPE_CONFIG[story.storyType] ?? TYPE_CONFIG.update;
          return (
            <View key={story.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground }]}>
              <View style={[styles.typePill, { backgroundColor: cfg.color + "18" }]}>
                <Feather name={cfg.icon} size={11} color={cfg.color} />
                <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              <Text style={[styles.content, { color: colors.foreground }]} numberOfLines={4}>
                {story.content}
              </Text>
              <View style={styles.footer}>
                <Text style={[styles.author, { color: colors.mutedForeground }]}>— {story.authorName}</Text>
                <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeAgo(story.createdAt)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 10 },
  scroll: { gap: 10, paddingRight: 4 },
  card: {
    borderRadius: 14, borderWidth: 1, padding: 14,
    minWidth: 220, maxWidth: 260, gap: 8,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  typePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: "flex-start",
  },
  typeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  content: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  author: { fontFamily: "Inter_500Medium", fontSize: 11 },
  time: { fontFamily: "Inter_400Regular", fontSize: 11 },
});
