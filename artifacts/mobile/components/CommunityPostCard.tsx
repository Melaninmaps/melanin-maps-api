import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { CommunityPost } from "@/constants/types";

const CATEGORY_CONFIG = {
  recommendation: { label: "Recommendation", icon: "thumbs-up" as const, color: "#2D7A4F" },
  question: { label: "Question", icon: "help-circle" as const, color: "#D4873A" },
  alert: { label: "Alert", icon: "alert-triangle" as const, color: "#DC2626" },
  discussion: { label: "Discussion", icon: "message-circle" as const, color: "#C4622D" },
};

interface Props {
  post: CommunityPost;
}

export function CommunityPostCard({ post }: Props) {
  const colors = useColors();
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const config = CATEGORY_CONFIG[post.category];

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (liked) {
      setLikeCount((c) => c - 1);
    } else {
      setLikeCount((c) => c + 1);
    }
    setLiked((l) => !l);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: post.authorColor }]}>
          <Text style={styles.initials}>{post.authorInitials}</Text>
        </View>
        <View style={styles.authorInfo}>
          <Text style={[styles.author, { color: colors.foreground }]}>{post.author}</Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{post.timeAgo}</Text>
        </View>
        <View style={[styles.categoryTag, { backgroundColor: config.color + "15" }]}>
          <Feather name={config.icon} size={11} color={config.color} />
          <Text style={[styles.categoryText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>
      <Text style={[styles.content, { color: colors.foreground }]}>{post.content}</Text>
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity onPress={handleLike} style={styles.action} activeOpacity={0.7}>
          <Feather
            name="heart"
            size={16}
            color={liked ? "#C4622D" : colors.mutedForeground}
          />
          <Text style={[styles.actionText, { color: liked ? "#C4622D" : colors.mutedForeground }]}>
            {likeCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} activeOpacity={0.7}>
          <Feather name="message-circle" size={16} color={colors.mutedForeground} />
          <Text style={[styles.actionText, { color: colors.mutedForeground }]}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} activeOpacity={0.7}>
          <Feather name="share-2" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  authorInfo: {
    flex: 1,
  },
  author: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  content: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 20,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
});
