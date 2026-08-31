import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { RECOGNITION_TAGS, ENCOURAGEMENT_TAGS } from "@/constants/badges";

type SharePref = "private" | "anonymous" | "named";

interface Props {
  businessId: string;
  businessName: string;
  reviewId: string;
  reviewText: string;
  onDone: () => void;
}

export function CommunityAppreciationFlow({ businessId, businessName, reviewId, reviewText, onDone }: Props) {
  const colors = useColors();
  const [sharePref, setSharePref] = useState<SharePref>("private");
  const [selectedRecognition, setSelectedRecognition] = useState<string[]>([]);
  const [selectedEncouragement, setSelectedEncouragement] = useState<string[]>([]);
  const [commentOption, setCommentOption] = useState<"exact" | "summarize" | null>(null);
  const [appreciationNote, setAppreciationNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  const toggleRecognition = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRecognition(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleEncouragement = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEncouragement(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { getItemAsync } = await import("expo-secure-store");
      const token = await getItemAsync("auth_session_token");
      const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

      const res = await fetch(`${base}/api/community-appreciation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reviewId,
          businessId,
          businessName,
          sharePreference: sharePref,
          recognitionTags: selectedRecognition,
          encouragementTags: selectedEncouragement,
          commentOption: reviewText && sharePref !== "private" ? commentOption : null,
          reviewText: reviewText && sharePref !== "private" && commentOption ? reviewText : null,
          appreciationNote: appreciationNote.trim() || null,
        }),
      });
      const data = await res.json() as { newBadges?: string[] };
      setNewBadges(data.newBadges ?? []);
    } catch {}
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(false);
    setSubmitted(true);
  };

  const BADGE_META: Record<string, { emoji: string; label: string; description: string }> = {
    community_welcomed:    { emoji: "🏆", label: "Community Welcomed",    description: "Consistently reported as a welcoming environment." },
    respect_in_action:     { emoji: "🤝", label: "Respect in Action",     description: "Frequently recognized for respectful customer service." },
    community_favorite:    { emoji: "🌟", label: "Community Favorite",    description: "Highly recommended by community members." },
    accessibility_champion:{ emoji: "♿", label: "Accessibility Champion", description: "Frequently praised for accessibility." },
    family_friendly:       { emoji: "👨‍👩‍👧", label: "Family Friendly",    description: "Consistently recognized by families." },
    inclusive_workplace:   { emoji: "💼", label: "Inclusive Workplace",   description: "Based on employee feedback over time." },
    community_connector:   { emoji: "🌍", label: "Community Connector",   description: "Frequently supports local events and orgs." },
  };

  if (submitted) {
    return (
      <View style={[s.successWrap, { backgroundColor: colors.background }]}>
        <View style={[s.successIcon, { backgroundColor: "#CA922B18" }]}>
          <Text style={{ fontSize: 36 }}>🤎</Text>
        </View>
        <Text style={[s.successTitle, { color: colors.foreground }]}>Appreciation Sent</Text>
        <Text style={[s.successSub, { color: colors.mutedForeground }]}>
          {sharePref === "private"
            ? "Your recognition stays within the community."
            : `Your appreciation has been shared with ${businessName}.`}
        </Text>

        {newBadges.length > 0 && (
          <View style={[s.badgeUnlockBox, { borderColor: "#CA922B50", backgroundColor: "#CA922B0A" }]}>
            <Text style={[s.badgeUnlockTitle, { color: "#CA922B" }]}>🏅 Community Recognition Unlocked!</Text>
            {newBadges.map(id => {
              const m = BADGE_META[id];
              if (!m) return null;
              return (
                <View key={id} style={s.badgeUnlockRow}>
                  <Text style={s.badgeUnlockEmoji}>{m.emoji}</Text>
                  <View>
                    <Text style={[s.badgeUnlockLabel, { color: colors.foreground }]}>{m.label}</Text>
                    <Text style={[s.badgeUnlockDesc, { color: colors.mutedForeground }]}>{m.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={[s.doneBtn, { backgroundColor: colors.primary }]}
          onPress={onDone}
          activeOpacity={0.85}
        >
          <Text style={s.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasContent = selectedRecognition.length > 0 || selectedEncouragement.length > 0 || appreciationNote.trim().length > 0;
  const willShare = sharePref !== "private";

  return (
    <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={s.container}>
      <View style={[s.headerPill, { backgroundColor: "#CA922B18", borderColor: "#CA922B30" }]}>
        <Text style={[s.headerPillText, { color: "#CA922B" }]}>🤎 COMMUNITY RECOGNITION</Text>
      </View>

      <Text style={[s.heading, { color: colors.foreground }]}>
        Would you like to share your feedback with {businessName}?
      </Text>
      <Text style={[s.subheading, { color: colors.mutedForeground }]}>
        This step is entirely optional. Your review has already been submitted.
      </Text>

      {/* Share preference */}
      <View style={s.shareOptions}>
        {([
          { value: "private" as SharePref, label: "No, keep this within the community.", icon: "lock" },
          { value: "anonymous" as SharePref, label: "Yes, share anonymously.", icon: "user-x" },
          { value: "named" as SharePref, label: "Yes, include my name.", icon: "user-check" },
        ] as { value: SharePref; label: string; icon: string }[]).map(({ value, label, icon }) => (
          <TouchableOpacity
            key={value}
            style={[s.shareOption, {
              borderColor: sharePref === value ? colors.primary : colors.border,
              backgroundColor: sharePref === value ? colors.primary + "10" : colors.card,
            }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSharePref(value); }}
            activeOpacity={0.75}
          >
            <View style={[s.radioOuter, { borderColor: sharePref === value ? colors.primary : colors.border }]}>
              {sharePref === value && <View style={[s.radioInner, { backgroundColor: colors.primary }]} />}
            </View>
            <Feather name={icon as any} size={14} color={sharePref === value ? colors.primary : colors.mutedForeground} style={{ marginRight: 8 }} />
            <Text style={[s.shareOptionText, { color: sharePref === value ? colors.primary : colors.foreground, fontFamily: sharePref === value ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recognition */}
      <Text style={[s.sectionLabel, { color: colors.foreground }]}>🌟 Recognition</Text>
      <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>Select all that apply. Consistent selections earn Community Recognition Badges.</Text>
      {RECOGNITION_TAGS.map(({ tag }) => {
        const active = selectedRecognition.includes(tag);
        return (
          <TouchableOpacity
            key={tag}
            style={[s.checkRow, {
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.primary + "0D" : colors.card,
            }]}
            onPress={() => toggleRecognition(tag)}
            activeOpacity={0.75}
          >
            <View style={[s.checkbox, {
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.primary : "transparent",
            }]}>
              {active && <Feather name="check" size={11} color="#fff" />}
            </View>
            <Text style={[s.checkLabel, { color: active ? colors.primary : colors.foreground, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
              {tag}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Encouragement */}
      <Text style={[s.sectionLabel, { color: colors.foreground, marginTop: 24 }]}>💡 Encouragement</Text>
      <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>Suggest improvements or recognize individual efforts.</Text>
      {ENCOURAGEMENT_TAGS.map((tag) => {
        const active = selectedEncouragement.includes(tag);
        return (
          <TouchableOpacity
            key={tag}
            style={[s.checkRow, {
              borderColor: active ? "#7C3AED" : colors.border,
              backgroundColor: active ? "#7C3AED0D" : colors.card,
            }]}
            onPress={() => toggleEncouragement(tag)}
            activeOpacity={0.75}
          >
            <View style={[s.checkbox, {
              borderColor: active ? "#7C3AED" : colors.border,
              backgroundColor: active ? "#7C3AED" : "transparent",
            }]}>
              {active && <Feather name="check" size={11} color="#fff" />}
            </View>
            <Text style={[s.checkLabel, { color: active ? "#7C3AED" : colors.foreground, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
              {tag}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Comment sharing — only if they wrote text and are sharing */}
      {reviewText.trim().length > 0 && willShare && (
        <>
          <Text style={[s.sectionLabel, { color: colors.foreground, marginTop: 24 }]}>📝 Share my comments</Text>
          {[
            { value: "exact", label: "Send my written feedback exactly as written." },
            { value: "summarize", label: "Summarize my feedback before sending." },
          ].map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              style={[s.checkRow, {
                borderColor: commentOption === value ? colors.primary : colors.border,
                backgroundColor: commentOption === value ? colors.primary + "0D" : colors.card,
              }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCommentOption(commentOption === value ? null : value as "exact" | "summarize"); }}
              activeOpacity={0.75}
            >
              <View style={[s.checkbox, {
                borderColor: commentOption === value ? colors.primary : colors.border,
                backgroundColor: commentOption === value ? colors.primary : "transparent",
              }]}>
                {commentOption === value && <Feather name="check" size={11} color="#fff" />}
              </View>
              <Text style={[s.checkLabel, { color: commentOption === value ? colors.primary : colors.foreground }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Appreciation note */}
      {willShare && (
        <>
          <Text style={[s.sectionLabel, { color: colors.foreground, marginTop: 24 }]}>🤎 Note of Appreciation</Text>
          <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>
            Send a personal note to the business. Optional.
          </Text>
          <View style={[s.noteExamples, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              '"Thank you for creating a welcoming environment."',
              '"Your business made me feel comfortable."',
              '"Our community appreciates businesses like yours."',
            ].map((ex) => (
              <TouchableOpacity
                key={ex}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAppreciationNote(ex.replace(/^"|"$/g, "")); }}
                activeOpacity={0.7}
              >
                <Text style={[s.noteExample, { color: colors.mutedForeground }]}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[s.noteInput, { backgroundColor: colors.card, borderColor: appreciationNote ? colors.primary : colors.border, color: colors.foreground }]}
            placeholder="Write your own appreciation note..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            value={appreciationNote}
            onChangeText={setAppreciationNote}
          />
        </>
      )}

      {/* Footer note */}
      <Text style={[s.footerNote, { color: colors.mutedForeground }]}>
        &quot;Your feedback helps businesses grow and helps communities thrive.&quot;
      </Text>

      {/* Submit */}
      <TouchableOpacity
        style={[s.submitBtn, {
          backgroundColor: hasContent || sharePref === "private" ? colors.primary : colors.border,
          opacity: submitting ? 0.6 : 1,
        }]}
        onPress={submitting ? undefined : handleSubmit}
        activeOpacity={0.85}
      >
        {submitting
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={s.submitBtnText}>
              {sharePref === "private" ? "Submit & Keep Private" : "Send Appreciation"}
            </Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={s.skipBtn} onPress={onDone} activeOpacity={0.7}>
        <Text style={[s.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  headerPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 1, marginBottom: 14, marginTop: 4 },
  headerPillText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  heading: { fontSize: 16, fontFamily: "Inter_700Bold", lineHeight: 22, marginBottom: 6 },
  subheading: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 20 },
  shareOptions: { gap: 8, marginBottom: 24 },
  shareOption: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1.5, gap: 2 },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center", marginRight: 8 },
  radioInner: { width: 9, height: 9, borderRadius: 5 },
  shareOptionText: { fontSize: 13, lineHeight: 18, flex: 1 },
  sectionLabel: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10, lineHeight: 17 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", padding: 12, borderRadius: 10, borderWidth: 1.5, marginBottom: 6, gap: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 },
  checkLabel: { fontSize: 13, lineHeight: 19, flex: 1, fontFamily: "Inter_400Regular" },
  noteExamples: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 10, gap: 6 },
  noteExample: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, paddingVertical: 2 },
  noteInput: { borderRadius: 10, borderWidth: 1.5, padding: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 80, textAlignVertical: "top", marginTop: 4 },
  footerNote: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic", textAlign: "center", marginTop: 24, marginBottom: 16, lineHeight: 17 },
  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 10 },
  submitBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  skipBtn: { alignItems: "center", paddingVertical: 8 },
  skipText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingVertical: 32 },
  successIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  successTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8, textAlign: "center" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  badgeUnlockBox: { borderWidth: 1.5, borderRadius: 12, padding: 16, width: "100%", marginBottom: 20 },
  badgeUnlockTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 12 },
  badgeUnlockRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  badgeUnlockEmoji: { fontSize: 22 },
  badgeUnlockLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  badgeUnlockDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  doneBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 48, alignItems: "center" },
  doneBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
