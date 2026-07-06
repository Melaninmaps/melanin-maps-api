import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { COMMUNITY_RATINGS } from "@/components/RatingStars";
import { getCaptionsForBusiness } from "@/constants/captions";
import { CommunityAppreciationFlow } from "@/components/CommunityAppreciationFlow";

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
  businessCategory?: string;
  reviewId?: string;
  initialRating?: number;
  initialText?: string;
  onClose: () => void;
  onSubmit: (rating: number, text: string, wouldReturn: boolean | null, socialHandle?: string, socialPlatform?: string, videoUrl?: string, nonMinorityOwned?: boolean, communitySupport?: number, website?: string, location?: string, isAnonymous?: boolean, volunteerAsMentor?: boolean, nowHiringUrl?: string, photos?: string[]) => void;
}

export function WriteReviewModal({ visible, businessName, businessId, businessCategory, reviewId, initialRating, initialText, onClose, onSubmit }: Props) {
  const colors = useColors();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [wouldReturn, setWouldReturn] = useState<"yes" | "maybe" | "no" | null>(null);
  const [socialHandle, setSocialHandle] = useState("");
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform | null>(null);
  const [videoLink, setVideoLink] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [communitySupport, setCommunitySupport] = useState(0);
  const [nonMinorityOwned, setNonMinorityOwned] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [recommendsAsEmployer, setRecommendsAsEmployer] = useState<boolean | null>(null);
  const [volunteerAsMentor, setVolunteerAsMentor] = useState(false);
  const [nowHiringUrl, setNowHiringUrl] = useState("");
  const [selectedCaptions, setSelectedCaptions] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [phase, setPhase] = useState<"form" | "success" | "appreciation">("form");
  const [capturedText, setCapturedText] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [volunteeredAsMentor, setVolunteeredAsMentor] = useState(false);

  const isEditMode = !!reviewId;

  React.useEffect(() => {
    if (isEditMode && visible) {
      if (initialRating) setRating(initialRating);
      if (initialText) setText(initialText);
      setWouldReturn("yes");
    }
  }, [isEditMode, visible, initialRating, initialText]);

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
    setIsAnonymous(false);
    setRecommendsAsEmployer(null);
    setVolunteerAsMentor(false);
    setNowHiringUrl("");
    setSelectedCaptions([]);
    setPhotos([]);
    setPhotoUploading(false);
    setPhase("form");
    setCapturedText("");
    setInviteSent(false);
    setVolunteeredAsMentor(false);
  };

  const handlePickPhoto = async () => {
    if (photos.length >= 4) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.75,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    setPhotoUploading(true);
    try {
      const { getItemAsync } = await import("expo-secure-store");
      const token = await getItemAsync("auth_session_token");
      const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      const formData = new FormData();
      const ext = asset.uri.split(".").pop() ?? "jpg";
      formData.append("photo", { uri: asset.uri, name: `photo.${ext}`, type: `image/${ext}` } as any);
      const res = await fetch(`${base}/api/reviews/photos`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.ok) {
        const data = await res.json() as { url: string };
        setPhotos((prev) => [...prev, data.url]);
      }
    } catch { /* silently ignore upload failures */ }
    finally { setPhotoUploading(false); }
  };

  const submitCaptions = (captions: string[]) => {
    if (!businessId || captions.length === 0) return;
    void (async () => {
      try {
        const { getItemAsync } = await import("expo-secure-store");
        const token = await getItemAsync("auth_session_token");
        const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
        await fetch(`${base}/api/captions/${businessId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ captions }),
        });
      } catch {}
    })();
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
    const willMentor = nonMinorityOwned && recommendsAsEmployer === true && !isAnonymous && volunteerAsMentor;
    const cleanNowHiring = nonMinorityOwned && recommendsAsEmployer === true && nowHiringUrl.trim() ? nowHiringUrl.trim() : undefined;
    const wouldReturnBool = wouldReturn === "yes" ? true : wouldReturn === "no" ? false : null;
    setInviteSent(hasInvite);
    setVolunteeredAsMentor(willMentor);
    setCapturedText(text);
    setPhase("success");
    onSubmit(rating, text, wouldReturnBool, hasInvite ? cleanHandle : undefined, hasInvite ? socialPlatform! : undefined, cleanVideoUrl, nonMinorityOwned, communitySupport > 0 && !nonMinorityOwned ? communitySupport : undefined, website.trim() || undefined, location.trim() || undefined, nonMinorityOwned ? isAnonymous : undefined, willMentor || undefined, cleanNowHiring, photos.length > 0 ? photos : undefined);
    if (isEditMode) {
      setTimeout(() => { reset(); onClose(); }, 1400);
      return;
    }
    submitCaptions(selectedCaptions);
    if (wouldReturn === "yes" && businessId) {
      setTimeout(() => setPhase("appreciation"), 1600);
    } else {
      setTimeout(() => { reset(); onClose(); }, 2200);
    }
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

          {phase === "appreciation" && businessId ? (
            <CommunityAppreciationFlow
              businessId={businessId}
              businessName={businessName}
              reviewId=""
              reviewText={capturedText}
              onDone={() => { reset(); onClose(); }}
            />
          ) : phase === "success" ? (
            <View style={styles.successWrap}>
              <View style={[styles.successIcon, { backgroundColor: "#2D7A4F18" }]}>
                <Feather name="check-circle" size={40} color="#2D7A4F" />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Review Submitted!</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                Thank you for helping the community.
              </Text>
              {inviteSent && (
                <View style={[styles.inviteBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "33" }]}>
                  <Ionicons name="paper-plane" size={14} color={colors.primary} />
                  <Text style={[styles.inviteBadgeText, { color: colors.primary }]}>
                    Invite sent to @{socialHandle.replace(/^@/, "")} — 60-day free trial unlocked!
                  </Text>
                </View>
              )}
              {volunteeredAsMentor && (
                <View style={[styles.inviteBadge, { backgroundColor: "#7C3AED18", borderColor: "#7C3AED33" }]}>
                  <Ionicons name="school" size={14} color="#7C3AED" />
                  <Text style={[styles.inviteBadgeText, { color: "#7C3AED" }]}>
                    You're now listed as a career mentor — thank you!
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.title, { color: colors.foreground }]}>Write a Review</Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>{businessName}</Text>

              <Text style={[styles.label, { color: colors.foreground }]}>Your Rating</Text>
              <View style={styles.ratingCards}>
                {COMMUNITY_RATINGS.map((r) => {
                  const selected = rating === r.level;
                  const isCrown = r.level === 5;
                  return (
                    <TouchableOpacity
                      key={r.level}
                      style={[styles.ratingCard, {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.primary + "12" : colors.card,
                      }]}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRating(r.level); }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.ratingCardEmoji}>{r.display}</Text>
                      <Text style={[styles.ratingCardLabel, {
                        color: selected ? colors.primary : colors.foreground,
                        fontFamily: selected && isCrown ? "Inter_700Bold" : "Inter_600SemiBold",
                      }]}>{r.label}</Text>
                      {selected && <Feather name="check-circle" size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: colors.foreground }]}>Would you come back?</Text>
              <View style={styles.yesNo}>
                <TouchableOpacity
                  style={[styles.yesNoBtn, {
                    borderColor: wouldReturn === "yes" ? "#2D7A4F" : colors.border,
                    backgroundColor: wouldReturn === "yes" ? "#2D7A4F18" : colors.card,
                  }]}
                  onPress={() => setWouldReturn("yes")}
                >
                  <Text style={{ fontSize: 16 }}>👍🏾</Text>
                  <Text style={[styles.yesNoText, { color: wouldReturn === "yes" ? "#2D7A4F" : colors.foreground }]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.yesNoBtn, {
                    borderColor: wouldReturn === "maybe" ? colors.primary : colors.border,
                    backgroundColor: wouldReturn === "maybe" ? colors.primary + "18" : colors.card,
                  }]}
                  onPress={() => setWouldReturn("maybe")}
                >
                  <Text style={{ fontSize: 16 }}>🤷🏾</Text>
                  <Text style={[styles.yesNoText, { color: wouldReturn === "maybe" ? colors.primary : colors.foreground }]}>Maybe</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.yesNoBtn, {
                    borderColor: wouldReturn === "no" ? "#DC2626" : colors.border,
                    backgroundColor: wouldReturn === "no" ? "#DC262618" : colors.card,
                  }]}
                  onPress={() => setWouldReturn("no")}
                >
                  <Text style={{ fontSize: 16 }}>👎🏾</Text>
                  <Text style={[styles.yesNoText, { color: wouldReturn === "no" ? "#DC2626" : colors.foreground }]}>No</Text>
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

              {/* Community Captions */}
              {getCaptionsForBusiness(businessCategory ?? "", recommendsAsEmployer === true).length > 0 && (
                <>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    What stands out?{" "}
                    <Text style={{ color: colors.mutedForeground }}>(optional)</Text>
                  </Text>
                  <Text style={[styles.supportSub, { color: colors.mutedForeground }]}>
                    Tap all that apply — your picks show up on the business profile
                  </Text>
                  <View style={styles.captionWrap}>
                    {getCaptionsForBusiness(businessCategory ?? "", recommendsAsEmployer === true).map((caption) => {
                      const active = selectedCaptions.includes(caption);
                      return (
                        <TouchableOpacity
                          key={caption}
                          style={[styles.captionChip, {
                            borderColor: active ? colors.primary : colors.border,
                            backgroundColor: active ? colors.primary + "15" : colors.card,
                          }]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedCaptions(prev =>
                              prev.includes(caption) ? prev.filter(c => c !== caption) : [...prev, caption]
                            );
                          }}
                          activeOpacity={0.7}
                        >
                          {active && <Feather name="check" size={11} color={colors.primary} />}
                          <Text style={[styles.captionChipText, { color: active ? colors.primary : colors.foreground }]}>
                            {caption}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {!nonMinorityOwned && (
                <>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    You <Text style={{ color: colors.primary }}>NEED</Text> to support!{" "}
                    <Text style={{ color: colors.mutedForeground }}>(optional)</Text>
                  </Text>
                  <Text style={[styles.supportSub, { color: colors.mutedForeground }]}>
                    How strongly would you recommend the community show up for this business?
                  </Text>
                  <View style={styles.ratingCards}>
                    {[
                      { level: 1, hearts: "🤎", label: "Worth checking out" },
                      { level: 2, hearts: "🤎🤎", label: "Solid spot — spread the word" },
                      { level: 3, hearts: "🤎🤎🤎", label: "Strong community pick!" },
                      { level: 4, hearts: "🤎🤎🤎🤎", label: "A must-visit — go now!" },
                      { level: 5, hearts: "🔥", label: "Drop everything and support!" },
                    ].map((s) => {
                      const selected = communitySupport === s.level;
                      return (
                        <TouchableOpacity
                          key={s.level}
                          style={[styles.ratingCard, {
                            borderColor: selected ? colors.primary : colors.border,
                            backgroundColor: selected ? colors.primary + "12" : colors.card,
                          }]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setCommunitySupport(communitySupport === s.level ? 0 : s.level);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.ratingCardEmoji}>{s.hearts}</Text>
                          <Text style={[styles.ratingCardLabel, {
                            color: selected ? colors.primary : colors.foreground,
                            fontFamily: selected ? "Inter_700Bold" : "Inter_600SemiBold",
                          }]}>{s.label}</Text>
                          {selected && <Feather name="check-circle" size={16} color={colors.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
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

              {/* Social post link section */}
              <View style={[styles.videoSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.videoHeader}>
                  <Feather name="link" size={16} color={colors.primary} />
                  <Text style={[styles.videoTitle, { color: colors.foreground }]}>Link Your Social Post</Text>
                  <View style={[styles.optionalBadge, { backgroundColor: colors.primary + "18" }]}>
                    <Text style={[styles.optionalText, { color: colors.primary }]}>optional</Text>
                  </View>
                </View>
                <Text style={[styles.inviteDesc, { color: colors.mutedForeground }]}>
                  Share a link to your Instagram, TikTok, Facebook, or YouTube post about this business. It'll appear on your profile and link back to your page.
                </Text>
                <TextInput
                  style={[styles.videoInput, { backgroundColor: colors.background, borderColor: videoLink && !isValidVideoUrl(videoLink) ? "#DC2626" : videoLink && isValidVideoUrl(videoLink) ? "#2D7A4F" : colors.border, color: colors.foreground }]}
                  placeholder="https://www.instagram.com/p/..."
                  placeholderTextColor={colors.mutedForeground}
                  value={videoLink}
                  onChangeText={setVideoLink}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                {videoLink.length > 0 && (
                  <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: isValidVideoUrl(videoLink) ? "#2D7A4F" : "#DC2626" }}>
                    {isValidVideoUrl(videoLink) ? `✓ ${detectVideoPlatform(videoLink)} post linked` : "Paste a link from Instagram, TikTok, Facebook, or YouTube"}
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
                onPress={() => {
                  const next = !nonMinorityOwned;
                  setNonMinorityOwned(next);
                  if (!next) {
                    setIsAnonymous(false);
                    setRecommendsAsEmployer(null);
                    setVolunteerAsMentor(false);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.nmoCheck, { borderColor: nonMinorityOwned ? "#C9922B" : colors.border, backgroundColor: nonMinorityOwned ? "#C9922B" : "transparent" }]}>
                  {nonMinorityOwned && <Feather name="check" size={11} color="#fff" />}
                </View>
                <Text style={[styles.nmoText, { color: nonMinorityOwned ? "#C9922B" : colors.mutedForeground }]}>
                  This is not a minority-owned business
                </Text>
              </TouchableOpacity>

              {nonMinorityOwned && (
                <View style={[styles.nmoExtras, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {/* Anonymous / Verified toggle */}
                  <Text style={[styles.label, { color: colors.foreground, marginBottom: 8 }]}>Post as</Text>
                  <View style={styles.anonRow}>
                    <TouchableOpacity
                      style={[styles.anonBtn, { borderColor: isAnonymous ? "#6B7280" : colors.border, backgroundColor: isAnonymous ? "#6B728018" : colors.background }]}
                      onPress={() => { setIsAnonymous(true); setVolunteerAsMentor(false); }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="eye-off-outline" size={15} color={isAnonymous ? "#6B7280" : colors.mutedForeground} />
                      <Text style={[styles.anonBtnText, { color: isAnonymous ? "#6B7280" : colors.foreground }]}>Anonymous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.anonBtn, { borderColor: !isAnonymous ? colors.primary : colors.border, backgroundColor: !isAnonymous ? colors.primary + "18" : colors.background }]}
                      onPress={() => setIsAnonymous(false)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="shield-checkmark-outline" size={15} color={!isAnonymous ? colors.primary : colors.mutedForeground} />
                      <Text style={[styles.anonBtnText, { color: !isAnonymous ? colors.primary : colors.foreground }]}>Verified User</Text>
                    </TouchableOpacity>
                  </View>
                  {isAnonymous && (
                    <Text style={[styles.anonHint, { color: colors.mutedForeground }]}>
                      Your name will appear as "Anonymous Community Member"
                    </Text>
                  )}

                  {/* Employer recommendation */}
                  <Text style={[styles.label, { color: colors.foreground, marginTop: 16, marginBottom: 8 }]}>
                    Would you recommend this place as an employer?
                  </Text>
                  <View style={styles.yesNo}>
                    <TouchableOpacity
                      style={[styles.yesNoBtn, { borderColor: recommendsAsEmployer === true ? "#2D7A4F" : colors.border, backgroundColor: recommendsAsEmployer === true ? "#2D7A4F18" : colors.background }]}
                      onPress={() => setRecommendsAsEmployer(true)}
                    >
                      <Feather name="thumbs-up" size={16} color={recommendsAsEmployer === true ? "#2D7A4F" : colors.mutedForeground} />
                      <Text style={[styles.yesNoText, { color: recommendsAsEmployer === true ? "#2D7A4F" : colors.foreground }]}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.yesNoBtn, { borderColor: recommendsAsEmployer === false ? "#DC2626" : colors.border, backgroundColor: recommendsAsEmployer === false ? "#DC262618" : colors.background }]}
                      onPress={() => { setRecommendsAsEmployer(false); setVolunteerAsMentor(false); }}
                    >
                      <Feather name="thumbs-down" size={16} color={recommendsAsEmployer === false ? "#DC2626" : colors.mutedForeground} />
                      <Text style={[styles.yesNoText, { color: recommendsAsEmployer === false ? "#DC2626" : colors.foreground }]}>No</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Now Hiring URL */}
                  {recommendsAsEmployer === true && (
                    <>
                      <Text style={[styles.label, { color: colors.foreground, marginTop: 16, marginBottom: 6 }]}>
                        Now Hiring link <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text>
                      </Text>
                      <Text style={[styles.anonHint, { color: colors.mutedForeground, marginBottom: 6 }]}>
                        Link directly to their careers page or job listing so candidates can apply
                      </Text>
                      <View style={[styles.handleInputRow, { borderColor: nowHiringUrl ? "#2D7A4F" : colors.border, backgroundColor: colors.background }]}>
                        <Ionicons name="briefcase-outline" size={15} color={nowHiringUrl ? "#2D7A4F" : colors.mutedForeground} />
                        <TextInput
                          style={[styles.handleInput, { color: colors.foreground }]}
                          placeholder="https://careers.example.com/jobs"
                          placeholderTextColor={colors.mutedForeground}
                          value={nowHiringUrl}
                          onChangeText={setNowHiringUrl}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="url"
                        />
                        {nowHiringUrl.length > 0 && (
                          <TouchableOpacity onPress={() => setNowHiringUrl("")}>
                            <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </>
                  )}

                  {/* Mentor volunteer — only if employer recommended + posting as verified */}
                  {recommendsAsEmployer === true && !isAnonymous && (
                    <TouchableOpacity
                      style={[styles.mentorRow, { borderColor: volunteerAsMentor ? "#7C3AED" : colors.border, backgroundColor: volunteerAsMentor ? "#7C3AED10" : colors.background }]}
                      onPress={() => setVolunteerAsMentor((v) => !v)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.nmoCheck, { borderColor: volunteerAsMentor ? "#7C3AED" : colors.border, backgroundColor: volunteerAsMentor ? "#7C3AED" : "transparent" }]}>
                        {volunteerAsMentor && <Feather name="check" size={11} color="#fff" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.mentorTitle, { color: volunteerAsMentor ? "#7C3AED" : colors.foreground }]}>
                          Volunteer as a career mentor
                        </Text>
                        <Text style={[styles.mentorSub, { color: colors.mutedForeground }]}>
                          Help job seekers in this industry — we'll list you in our mentorship directory
                        </Text>
                      </View>
                      <Ionicons name="school-outline" size={20} color={volunteerAsMentor ? "#7C3AED" : colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* ─── Photo picker ─────────────────────────────────────────── */}
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.label, { color: colors.foreground, marginBottom: 8 }]}>Photos (optional)</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {photos.map((uri, i) => (
                    <View key={uri} style={{ position: "relative" }}>
                      <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 8 }} resizeMode="cover" />
                      <TouchableOpacity
                        style={{ position: "absolute", top: -6, right: -6, backgroundColor: "#DC2626", borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" }}
                        onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <Text style={{ color: "#fff", fontSize: 12, lineHeight: 14 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {photos.length < 4 && (
                    <TouchableOpacity
                      style={{ width: 72, height: 72, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center", backgroundColor: colors.card }}
                      onPress={handlePickPhoto}
                      disabled={photoUploading}
                      activeOpacity={0.7}
                    >
                      {photoUploading ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ fontSize: 24, color: colors.mutedForeground }}>+</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: rating > 0 && wouldReturn !== null ? colors.primary : colors.muted,
                  },
                ]}
                onPress={handleSubmit}
                disabled={rating === 0 || wouldReturn === null || photoUploading}
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
  ratingCards: {
    gap: 8,
    marginBottom: 24,
  },
  ratingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  ratingCardEmoji: {
    fontSize: 20,
    lineHeight: 26,
    minWidth: 44,
  },
  ratingCardLabel: {
    flex: 1,
    fontSize: 15,
  },
  stars: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  yesNo: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  yesNoBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  yesNoText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
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
  captionWrap: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    marginBottom: 20,
  },
  captionChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  captionChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
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
    marginBottom: 10,
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
  nmoExtras: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    gap: 2,
  },
  anonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  anonBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  anonBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  anonHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 4,
    marginBottom: 4,
  },
  mentorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  mentorTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginBottom: 2,
  },
  mentorSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 15,
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
