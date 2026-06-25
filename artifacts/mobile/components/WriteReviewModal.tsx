import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "logo-instagram" },
  { id: "twitter", label: "X / Twitter", icon: "logo-twitter" },
  { id: "tiktok", label: "TikTok", icon: "musical-notes" },
  { id: "facebook", label: "Facebook", icon: "logo-facebook" },
] as const;

const VIDEO_PATTERNS: { platform: string; regex: RegExp }[] = [
  { platform: "YouTube", regex: /^https?:\/\/(www\.)?(youtube\.com\/(watch|shorts)|youtu\.be\/)/i },
  { platform: "TikTok", regex: /^https?:\/\/(www\.)?tiktok\.com\//i },
  { platform: "Instagram", regex: /^https?:\/\/(www\.)?instagram\.com\/(reel|p|tv)\//i },
  { platform: "Facebook", regex: /^https?:\/\/(www\.)?(facebook\.com|fb\.watch)\//i },
];
function isValidVideoUrl(url: string) { return VIDEO_PATTERNS.some(({ regex }) => regex.test(url.trim())); }
function detectVideoPlatform(url: string) { return VIDEO_PATTERNS.find(({ regex }) => regex.test(url.trim()))?.platform ?? "Video"; }

type SocialPlatform = (typeof PLATFORMS)[number]["id"];

interface Props {
  visible: boolean;
  businessName: string;
  businessId?: string;
  onClose: () => void;
  onSubmit: (rating: number, text: string, wouldReturn: boolean, socialHandle?: string, socialPlatform?: string, videoUrl?: string, nonMinorityOwned?: boolean, communitySupport?: number, website?: string, location?: string) => void;
}

export function WriteReviewModal({ visible, businessName, businessId, onClose, onSubmit }: Props) {
  const colors = useColors();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null);
  const [socialHandle, setSocialHandle] = useState("");
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform | null>(null);
  const [videoLink, setVideoLink] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [communitySupport, setCommunitySupport] = useState(0);
  const [nonMinorityOwned, setNonMinorityOwned] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const reset = () => {
    setRating(0);
    setText("");
    setWouldReturn(null);
    setSocialHandle("");
    setSocialPlatform(null);
    setVideoLink("");
    setWebsite("");
    setLocation("");
    setCommunitySupport(0);
    setNonMinorityOwned(false);
    setSubmitted(false);
    setInviteSent(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (rating === 0 || wouldReturn === null) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const cleanHandle = socialHandle.trim().replace(/^@/, "");
    const hasInvite = cleanHandle.length > 0 && socialPlatform !== null;
    const cleanVideoUrl = videoLink.trim() && isValidVideoUrl(videoLink) ? videoLink.trim() : undefined;
    setInviteSent(hasInvite);
    setSubmitted(true);
    onSubmit(rating, text, wouldReturn, hasInvite ? cleanHandle : undefined, hasInvite ? socialPlatform! : undefined, cleanVideoUrl, nonMinorityOwned, communitySupport > 0 && !nonMinorityOwned ? communitySupport : undefined, website.trim() || undefined, location.trim() || undefined);
    setTimeout(() => {
      reset();
      onClose();
    }, 2200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {submitted ? (
            <View style={styles.successWrap}>
              <View style={[styles.successIcon, { backgroundColor: "#2D7A4F18" }]}>
                <Feather name="check-circle" size={40} color="#2D7A4F" />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Review Submitted!</Text>
              {inviteSent ? (
                <>
                  <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                    Thank you for helping the community.
                  </Text>
                  <View style={[styles.inviteBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "33" }]}>
                    <Ionicons name="paper-plane" size={14} color={colors.primary} />
                    <Text style={[styles.inviteBadgeText, { color: colors.primary }]}>
                      Invite sent to @{socialHandle.replace(/^@/, "")} — 60-day free trial unlocked!
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                  Thank you for helping the community.
                </Text>
              )}
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.title, { color: colors.foreground }]}>Write a Review</Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>{businessName}</Text>

              <Text style={[styles.label, { color: colors.foreground }]}>Your Rating</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setRating(s);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather
                      name="star"
                      size={34}
                      color={s <= rating ? "#D4873A" : colors.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.foreground }]}>Would you return alone?</Text>
              <View style={styles.yesNo}>
                <TouchableOpacity
                  style={[
                    styles.yesNoBtn,
                    {
                      borderColor: wouldReturn === true ? "#2D7A4F" : colors.border,
                      backgroundColor: wouldReturn === true ? "#2D7A4F18" : colors.card,
                    },
                  ]}
                  onPress={() => setWouldReturn(true)}
                >
                  <Feather name="thumbs-up" size={18} color={wouldReturn === true ? "#2D7A4F" : colors.mutedForeground} />
                  <Text style={[styles.yesNoText, { color: wouldReturn === true ? "#2D7A4F" : colors.foreground }]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.yesNoBtn,
                    {
                      borderColor: wouldReturn === false ? "#DC2626" : colors.border,
                      backgroundColor: wouldReturn === false ? "#DC262618" : colors.card,
                    },
                  ]}
                  onPress={() => setWouldReturn(false)}
                >
                  <Feather name="thumbs-down" size={18} color={wouldReturn === false ? "#DC2626" : colors.mutedForeground} />
                  <Text style={[styles.yesNoText, { color: wouldReturn === false ? "#DC2626" : colors.foreground }]}>No</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.foreground }]}>Your Experience <Text style={{ color: colors.mutedForeground }}>(optional)</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Share what made your visit memorable..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                value={text}
                onChangeText={setText}
              />

              {!nonMinorityOwned && (
                <>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    You <Text style={{ color: colors.primary }}>NEED</Text> to support!{" "}
                    <Text style={{ color: colors.mutedForeground }}>(optional)</Text>
                  </Text>
                  <Text style={[styles.supportSub, { color: colors.mutedForeground }]}>
                    How strongly would you recommend the community show up for this business?
                  </Text>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setCommunitySupport(communitySupport === s ? 0 : s);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather
                          name="star"
                          size={34}
                          color={s <= communitySupport ? colors.primary : colors.border}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  {communitySupport > 0 && (
                    <Text style={[styles.supportHint, { color: colors.primary }]}>
                      {communitySupport === 1 && "Worth checking out"}
                      {communitySupport === 2 && "Solid spot — spread the word"}
                      {communitySupport === 3 && "Strong community pick!"}
                      {communitySupport === 4 && "A must-visit — go now!"}
                      {communitySupport === 5 && "🔥 Drop everything and support this business!"}
                    </Text>
                  )}
                </>
              )}

              <Text style={[styles.label, { color: colors.foreground }]}>
                Website <Text style={{ color: colors.mutedForeground }}>(optional)</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="https://theirbusiness.com"
                placeholderTextColor={colors.mutedForeground}
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              <Text style={[styles.label, { color: colors.foreground }]}>
                Address / Location <Text style={{ color: colors.mutedForeground }}>(optional)</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. 123 Main St, Atlanta, GA"
                placeholderTextColor={colors.mutedForeground}
                value={location}
                onChangeText={setLocation}
              />

              {/* Video link section */}
              <View style={[styles.videoSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.videoHeader}>
                  <Feather name="play-circle" size={16} color={colors.primary} />
                  <Text style={[styles.videoTitle, { color: colors.foreground }]}>Add a Video</Text>
                  <View style={[styles.optionalBadge, { backgroundColor: colors.primary + "18" }]}>
                    <Text style={[styles.optionalText, { color: colors.primary }]}>optional</Text>
                  </View>
                </View>
                <Text style={[styles.inviteDesc, { color: colors.mutedForeground }]}>
                  Share a YouTube, TikTok, Instagram, or Facebook video link from your visit.
                </Text>
                <TextInput
                  style={[styles.videoInput, { backgroundColor: colors.background, borderColor: videoLink && !isValidVideoUrl(videoLink) ? "#DC2626" : videoLink && isValidVideoUrl(videoLink) ? "#2D7A4F" : colors.border, color: colors.foreground }]}
                  placeholder="https://www.tiktok.com/@user/video/..."
                  placeholderTextColor={colors.mutedForeground}
                  value={videoLink}
                  onChangeText={setVideoLink}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                {videoLink.length > 0 && (
                  <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: isValidVideoUrl(videoLink) ? "#2D7A4F" : "#DC2626" }}>
                    {isValidVideoUrl(videoLink) ? `✓ ${detectVideoPlatform(videoLink)} link detected` : "Please enter a valid YouTube, TikTok, Instagram, or Facebook URL"}
                  </Text>
                )}
              </View>

              {/* Social invite section */}
              <View style={[styles.inviteSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.inviteHeader}>
                  <Ionicons name="paper-plane-outline" size={16} color={colors.primary} />
                  <Text style={[styles.inviteTitle, { color: colors.foreground }]}>
                    Invite this business
                  </Text>
                  <View style={[styles.optionalBadge, { backgroundColor: colors.primary + "18" }]}>
                    <Text style={[styles.optionalText, { color: colors.primary }]}>optional</Text>
                  </View>
                </View>
                <Text style={[styles.inviteDesc, { color: colors.mutedForeground }]}>
                  Tag their social handle and we'll send them a 60-day free trial invitation to join Mapping With Melanin.
                </Text>

                <Text style={[styles.platformLabel, { color: colors.foreground }]}>Platform</Text>
                <View style={styles.platformRow}>
                  {PLATFORMS.map((p) => {
                    const selected = socialPlatform === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.platformChip,
                          {
                            borderColor: selected ? colors.primary : colors.border,
                            backgroundColor: selected ? colors.primary + "18" : colors.background,
                          },
                        ]}
                        onPress={() => setSocialPlatform(p.id)}
                      >
                        <Ionicons
                          name={p.icon as any}
                          size={14}
                          color={selected ? colors.primary : colors.mutedForeground}
                        />
                        <Text style={[styles.platformChipText, { color: selected ? colors.primary : colors.foreground }]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={[styles.handleInputRow, { backgroundColor: colors.background, borderColor: socialHandle ? colors.primary : colors.border }]}>
                  <Text style={[styles.atSign, { color: colors.mutedForeground }]}>@</Text>
                  <TextInput
                    style={[styles.handleInput, { color: colors.foreground }]}
                    placeholder="businesshandle"
                    placeholderTextColor={colors.mutedForeground}
                    value={socialHandle}
                    onChangeText={(v) => setSocialHandle(v.replace(/^@/, ""))}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {socialHandle.length > 0 && (
                    <TouchableOpacity onPress={() => setSocialHandle("")}>
                      <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.nmoRow, { borderColor: nonMinorityOwned ? "#C9922B" : colors.border, backgroundColor: nonMinorityOwned ? "#C9922B10" : colors.card }]}
                onPress={() => setNonMinorityOwned((v) => !v)}
                activeOpacity={0.8}
              >
                <View style={[styles.nmoCheck, { borderColor: nonMinorityOwned ? "#C9922B" : colors.border, backgroundColor: nonMinorityOwned ? "#C9922B" : "transparent" }]}>
                  {nonMinorityOwned && <Feather name="check" size={11} color="#fff" />}
                </View>
                <Text style={[styles.nmoText, { color: nonMinorityOwned ? "#C9922B" : colors.mutedForeground }]}>
                  This is not a minority-owned business
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: rating > 0 && wouldReturn !== null ? colors.primary : colors.muted,
                  },
                ]}
                onPress={handleSubmit}
                disabled={rating === 0 || wouldReturn === null}
                activeOpacity={0.85}
              >
                <Text style={styles.submitText}>
                  {socialHandle.trim() && socialPlatform && !nonMinorityOwned ? "Submit & Send Invite" : "Submit Review"}
                </Text>
              </TouchableOpacity>

              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "92%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    marginBottom: 4,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginBottom: 24,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 10,
  },
  stars: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  yesNo: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  yesNoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  yesNoText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  inviteSection: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  inviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inviteTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    flex: 1,
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  optionalText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  inviteDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  platformLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    marginBottom: 2,
  },
  platformRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  platformChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  platformChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  handleInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    marginTop: 4,
  },
  atSign: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  handleInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  supportSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 10,
  },
  supportHint: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 12,
    textAlign: "center",
  },
  nmoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  nmoCheck: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  nmoText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    flex: 1,
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  submitText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FBF7F0",
  },
  successWrap: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  successSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  inviteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  inviteBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    flex: 1,
  },
  videoSection: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  videoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  videoTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    flex: 1,
  },
  videoInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
});
