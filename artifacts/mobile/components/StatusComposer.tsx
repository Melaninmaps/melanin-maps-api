import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

type Visibility = "public" | "followers_only" | "only_me";

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: string }[] = [
  { value: "public", label: "Public", icon: "🌐" },
  { value: "followers_only", label: "Followers", icon: "👥" },
  { value: "only_me", label: "Only Me", icon: "🔒" },
];

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

interface Props {
  authorName: string;
  authorInitials: string;
  authorColor: string;
  onPostCreated?: () => void;
}

export function StatusComposer({ authorName, authorInitials, authorColor, onPostCreated }: Props) {
  const colors = useColors();
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handlePost = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPosting(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/community/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: trimmed,
          visibility: visibility === "only_me" ? "followers_only" : visibility,
          category: "general",
          postType: "community",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        Alert.alert("Couldn't post", (data as any)?.error ?? "Something went wrong");
        return;
      }
      setText("");
      setExpanded(false);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onPostCreated?.();
    } catch {
      Alert.alert("No connection", "Check your internet and try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={[s.wrap, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground }]}>
      {/* Composer header row */}
      <TouchableOpacity
        style={s.headerRow}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={[s.avatar, { backgroundColor: authorColor }]}>
          <Text style={s.initials}>{authorInitials}</Text>
        </View>
        {!expanded ? (
          <Text style={[s.placeholder, { color: colors.mutedForeground }]}>
            Share something with the community…
          </Text>
        ) : (
          <Text style={[s.authorLabel, { color: colors.foreground }]}>{authorName}</Text>
        )}
        <Feather name={expanded ? "chevron-up" : "edit-3"} size={16} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Expanded composer */}
      {expanded && (
        <>
          <TextInput
            style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            value={text}
            onChangeText={setText}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={1000}
            autoFocus
          />
          <Text style={[s.charCount, { color: colors.mutedForeground }]}>{text.length}/1000</Text>

          {/* Visibility picker */}
          <View style={s.visibilityRow}>
            {VISIBILITY_OPTIONS.map((opt) => {
              const active = visibility === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    s.visPill,
                    { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "15" : colors.secondary },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setVisibility(opt.value);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={s.visEmoji}>{opt.icon}</Text>
                  <Text style={[s.visLabel, { color: active ? colors.primary : colors.mutedForeground }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Post button */}
          <View style={s.footer}>
            <TouchableOpacity
              style={[s.cancelBtn, { borderColor: colors.border }]}
              onPress={() => { setText(""); setExpanded(false); }}
              activeOpacity={0.7}
            >
              <Text style={[s.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.postBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted, opacity: posting ? 0.7 : 1 }]}
              onPress={handlePost}
              disabled={posting || !text.trim()}
              activeOpacity={0.8}
            >
              {posting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="send" size={14} color="#FFFFFF" />
                  <Text style={s.postBtnText}>Post</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#FFFFFF" },
  placeholder: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  authorLabel: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 14 },
  input: {
    marginHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    minHeight: 80,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    textAlignVertical: "top",
  },
  charCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "right",
    marginRight: 14,
    marginTop: 4,
  },
  visibilityRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  visPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  visEmoji: { fontSize: 13 },
  visLabel: { fontFamily: "Inter_500Medium", fontSize: 12 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    padding: 12,
    paddingTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  postBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  postBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#FFFFFF" },
});
