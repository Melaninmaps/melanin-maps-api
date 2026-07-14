import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { BusinessMentionPicker, type BusinessResult } from "./BusinessMentionPicker";
import { UserMentionPicker } from "./UserMentionPicker";

type Visibility = "public" | "followers_only" | "only_me";

const VISIBILITY_OPTIONS: { value: Visibility; label: string; featherIcon: string }[] = [
  { value: "public", label: "Public", featherIcon: "globe" },
  { value: "followers_only", label: "Followers", featherIcon: "users" },
  { value: "only_me", label: "Only Me", featherIcon: "lock" },
];

const STANCE_TAGS: { key: string; label: string; featherIcon: string }[] = [
  { key: "community_favorite", label: "Community Favorite", featherIcon: "star" },
  { key: "hidden_gem",         label: "Hidden Gem",         featherIcon: "star" },
  { key: "supporting_local",   label: "Supporting Local",   featherIcon: "users" },
  { key: "visited_loved",      label: "Visited & Loved",    featherIcon: "heart" },
];

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

interface BusinessMention {
  id: string;
  name: string;
  tag: string | null;
  rating: number | null;
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

  // @ mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const mentionStartRef = useRef<number>(-1);

  // Business mention + stance
  const [pendingBusiness, setPendingBusiness] = useState<BusinessResult | null>(null);
  const [businessMention, setBusinessMention] = useState<BusinessMention | null>(null);
  const [showStanceSheet, setShowStanceSheet] = useState(false);
  const [stanceTag, setStanceTag] = useState<string | null>(null);
  const [stanceRating, setStanceRating] = useState<number>(0);

  // Detect @ trigger and track the query after it
  const handleTextChange = (t: string) => {
    setText(t);

    // Find the last @ that isn't followed by a space yet (active mention)
    let atIdx = -1;
    for (let i = t.length - 1; i >= 0; i--) {
      if (t[i] === "@") {
        const before = i === 0 ? " " : t[i - 1];
        if (before === " " || before === "\n" || i === 0) {
          atIdx = i;
          break;
        }
      } else if (t[i] === " " || t[i] === "\n") {
        break;
      }
    }

    if (atIdx >= 0) {
      const query = t.slice(atIdx + 1);
      if (!query.includes(" ") && !query.includes("\n")) {
        mentionStartRef.current = atIdx;
        setMentionQuery(query);
        return;
      }
    }
    mentionStartRef.current = -1;
    setMentionQuery(null);
  };

  // User mention selected — insert @username into text
  const handleUserSelect = (username: string) => {
    const start = mentionStartRef.current;
    if (start < 0) { setMentionQuery(null); return; }
    const before = text.slice(0, start);
    const after = text.slice(start + 1 + (mentionQuery?.length ?? 0));
    setText(`${before}@${username} ${after}`);
    setMentionQuery(null);
    mentionStartRef.current = -1;
  };

  // Business selected from picker → open stance sheet
  const handleBusinessSelect = (biz: BusinessResult) => {
    setMentionQuery(null);
    setPendingBusiness(biz);
    setStanceTag(null);
    setStanceRating(0);
    setShowStanceSheet(true);
  };

  // Stance confirmed — insert @BusinessName into text and store mention
  const confirmStance = () => {
    if (!pendingBusiness) return;
    const hasTag = !!stanceTag;
    const hasRating = stanceRating >= 3;
    if (!hasTag && !hasRating) {
      Alert.alert(
        "Stance required",
        "Please choose a community tag or a rating of 3 stars or more to mention this business."
      );
      return;
    }

    // Insert @BusinessName into text at the cursor position
    const start = mentionStartRef.current;
    const insertedMention = `@${pendingBusiness.name}`;
    if (start >= 0) {
      const before = text.slice(0, start);
      const after = text.slice(start + 1 + (mentionQuery?.length ?? 0));
      setText(`${before}${insertedMention} ${after}`);
    } else {
      setText((prev) => prev ? `${prev} ${insertedMention} ` : `${insertedMention} `);
    }

    setBusinessMention({
      id: pendingBusiness.id,
      name: pendingBusiness.name,
      tag: stanceTag,
      rating: hasRating ? stanceRating : null,
    });

    setShowStanceSheet(false);
    setPendingBusiness(null);
    mentionStartRef.current = -1;
    setMentionQuery(null);
  };

  const removeMention = () => {
    if (businessMention) {
      setText((prev) => prev.replace(`@${businessMention.name}`, "").replace(/\s{2,}/g, " ").trim());
    }
    setBusinessMention(null);
  };

  const handlePost = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPosting(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const body: Record<string, unknown> = {
        content: trimmed,
        visibility: visibility === "only_me" ? "followers_only" : visibility,
        category: "general",
        postType: "community",
      };
      if (businessMention) {
        body.mentionedBusinessId = businessMention.id;
        if (businessMention.tag) body.mentionedBusinessTag = businessMention.tag;
        if (businessMention.rating) body.mentionedBusinessRating = businessMention.rating;
      }
      const res = await fetch(`${getApiBase()}/api/community/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        Alert.alert("Couldn't post", (data as any)?.error ?? "Something went wrong");
        return;
      }
      setText("");
      setExpanded(false);
      setBusinessMention(null);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onPostCreated?.();
    } catch {
      Alert.alert("No connection", "Check your internet and try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
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
              onChangeText={handleTextChange}
              placeholder="What's on your mind? Use @ to mention a person or business…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              autoFocus
            />
            {/* Word counter + thread preview */}
            {(() => {
              const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
              const SEGMENT_LIMIT = 300;
              const numParts = wordCount > 0 ? Math.ceil(wordCount / SEGMENT_LIMIT) : 1;
              const isThread = numParts > 1;
              return (
                <View style={s.wordCountRow}>
                  <Text style={[s.charCount, { color: isThread ? colors.primary : colors.mutedForeground }]}>
                    {wordCount} {wordCount === 1 ? "word" : "words"}
                  </Text>
                  {isThread && (
                    <View style={[s.threadPreviewBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                      <Feather name="link" size={11} color={colors.primary} />
                      <Text style={[s.threadPreviewText, { color: colors.primary }]}>
                        Posts as {numParts}-part thread · 1/{numParts} → {numParts}/{numParts}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}

            {/* @ mention pickers */}
            {mentionQuery !== null && (
              <View style={s.pickersWrap}>
                <BusinessMentionPicker
                  query={mentionQuery}
                  onSelect={handleBusinessSelect}
                />
                <UserMentionPicker
                  query={mentionQuery}
                  onSelect={handleUserSelect}
                />
              </View>
            )}

            {/* Business mention chip */}
            {businessMention && (
              <View style={[s.mentionChip, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
                <Feather name="briefcase" size={13} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.mentionChipName, { color: colors.primary }]}>@{businessMention.name}</Text>
                  <Text style={[s.mentionChipTag, { color: colors.mutedForeground }]}>
                    {businessMention.tag
                      ? STANCE_TAGS.find(t => t.key === businessMention.tag)?.label
                      : businessMention.rating
                        ? `${businessMention.rating}★ rating`
                        : ""}
                  </Text>
                </View>
                <TouchableOpacity onPress={removeMention} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="x" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            )}

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
                    <Feather name={opt.featherIcon as any} size={14} color={opt.value === visibility ? colors.primary : colors.mutedForeground} />
                    <Text style={[s.visLabel, { color: active ? colors.primary : colors.mutedForeground }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Post button */}
            <View style={s.footer}>
              <TouchableOpacity
                style={[s.cancelBtn, { borderColor: colors.border }]}
                onPress={() => { setText(""); setExpanded(false); setBusinessMention(null); setMentionQuery(null); }}
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

      {/* Business stance bottom sheet (Modal) */}
      <Modal
        visible={showStanceSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStanceSheet(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.stanceSheet, { backgroundColor: colors.card }]}>
            <View style={[s.stanceHandle, { backgroundColor: colors.border }]} />

            <Text style={[s.stanceTitle, { color: colors.foreground }]}>
              Mentioning {pendingBusiness?.name}
            </Text>
            <Text style={[s.stanceSub, { color: colors.mutedForeground }]}>
              Choose a community stance tag — or give a rating of 3+ stars. Required to @mention a business.
            </Text>

            {/* Tag options */}
            <View style={s.tagGrid}>
              {STANCE_TAGS.map((t) => {
                const active = stanceTag === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      s.tagPill,
                      { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "18" : colors.secondary },
                    ]}
                    onPress={() => setStanceTag(active ? null : t.key)}
                    activeOpacity={0.75}
                  >
                    <Feather name={t.featherIcon as any} size={15} color={active ? colors.primary : colors.mutedForeground} />
                    <Text style={[s.tagLabel, { color: active ? colors.primary : colors.foreground }]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Rating (optional, 1-5 stars, 3+ accepted) */}
            <Text style={[s.ratingLabel, { color: colors.mutedForeground }]}>Or add a rating (3★ minimum):</Text>
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setStanceRating(stanceRating === star ? 0 : star)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text style={[s.star, { color: star <= stanceRating ? "#CA922B" : colors.border }]}>★</Text>
                </TouchableOpacity>
              ))}
              {stanceRating > 0 && stanceRating < 3 && (
                <Text style={[s.ratingWarn, { color: "#C0392B" }]}>  min 3★</Text>
              )}
            </View>

            {/* Actions */}
            <View style={s.stanceFooter}>
              <TouchableOpacity
                style={[s.cancelBtn, { borderColor: colors.border }]}
                onPress={() => { setShowStanceSheet(false); setPendingBusiness(null); }}
                activeOpacity={0.7}
              >
                <Text style={[s.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.postBtn,
                  {
                    backgroundColor: (stanceTag || stanceRating >= 3) ? colors.primary : colors.muted,
                    opacity: (stanceTag || stanceRating >= 3) ? 1 : 0.5,
                  },
                ]}
                onPress={confirmStance}
                activeOpacity={0.8}
              >
                <Feather name="check" size={14} color="#FFFFFF" />
                <Text style={s.postBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  wordCountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 14,
    marginTop: 4,
    gap: 8,
    flexWrap: "wrap",
  },
  charCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  threadPreviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  threadPreviewText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  pickersWrap: {
    marginHorizontal: 12,
    marginTop: 6,
  },
  mentionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  mentionChipName: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  mentionChipTag: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
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

  // Stance Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  stanceSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    gap: 4,
  },
  stanceHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  stanceTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    marginBottom: 4,
  },
  stanceSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  tagIcon: { fontSize: 16 },
  tagLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  ratingLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 20,
  },
  star: { fontSize: 30 },
  ratingWarn: { fontFamily: "Inter_400Regular", fontSize: 11 },
  stanceFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
});
