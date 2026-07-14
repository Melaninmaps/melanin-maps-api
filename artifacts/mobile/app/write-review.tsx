import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  Alert,
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

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

const VISIT_TIMES = ["Morning", "Afternoon", "Evening", "Late Night"];
const GROUP_TYPES = ["Solo", "Partner", "Friends", "Family", "Work Colleagues"];
const GROUP_SIZES = ["Just me", "2 people", "3–5 people", "6+ people"];
const VISIT_FREQ = ["First time", "Occasionally", "Regularly", "Very frequently"];
const INCIDENT_TYPES = [
  "Racial profiling", "Verbal harassment", "Physical altercation",
  "Discrimination by staff", "Followed or surveilled", "Unwanted contact",
  "Property damage or theft", "Police involvement", "Other",
];
const INCIDENT_REPORTED = [
  "Reported to staff", "Reported to police", "Reported online", "Not reported", "Unsure",
];
const SAFETY_TIPS = [
  "Great for solo travelers", "Better with a group", "Avoid late at night",
  "Staff were welcoming", "Staff were unwelcoming", "Very inclusive atmosphere",
  "Keep valuables secure", "Well-lit and visible",
];

const TOTAL_STEPS = 4;

const RETURN_LABELS = ["", "Definitely not", "Probably not", "Maybe", "Probably yes", "Definitely yes"];
const RECOMMEND_LABELS = ["", "Not at all", "Unlikely", "Possibly", "Likely", "Absolutely"];

function StarRow({
  value, onChange, size = 28, color, emptyColor = "#D4D0C8",
}: {
  value: number; onChange: (v: number) => void; size?: number; color: string; emptyColor?: string;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity activeOpacity={0.85} key={n} onPress={() => onChange(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Feather name="star" size={size} color={n <= value ? color : emptyColor} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Chip({ label, selected, onPress, multi = false, color, primaryForeground, secondary, border, foreground }: {
  label: string; selected: boolean; onPress: () => void; multi?: boolean;
  color: string; primaryForeground: string; secondary: string; border: string; foreground: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: selected ? color : secondary, borderColor: selected ? color : border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {multi && selected && <Feather name="check" size={11} color={primaryForeground} style={{ marginRight: 2 }} />}
      <Text style={[styles.chipTxt, { color: selected ? primaryForeground : foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const VIDEO_PATTERNS: { platform: string; regex: RegExp }[] = [
  { platform: "YouTube", regex: /^https?:\/\/(www\.)?(youtube\.com\/(watch|shorts)|youtu\.be\/)/i },
  { platform: "TikTok", regex: /^https?:\/\/(www\.)?tiktok\.com\//i },
  { platform: "Instagram", regex: /^https?:\/\/(www\.)?instagram\.com\/(reel|p|tv)\//i },
  { platform: "Facebook", regex: /^https?:\/\/(www\.)?(facebook\.com|fb\.watch)\//i },
];

function isValidVideoUrl(url: string): boolean {
  return VIDEO_PATTERNS.some(({ regex }) => regex.test(url.trim()));
}

function detectVideoPlatform(url: string): string {
  const match = VIDEO_PATTERNS.find(({ regex }) => regex.test(url.trim()));
  return match?.platform ?? "Video";
}

function computeScore(safety: number, returnAlone: number, recommend: number): number {
  if (!safety || !returnAlone || !recommend) return 0;
  return Math.round((safety * 0.4 + returnAlone * 0.35 + recommend * 0.25) / 5 * 100);
}

export default function WriteReviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ businessId?: string; businessName?: string }>();

  const businessName = params.businessName ?? "Sweet Auburn BBQ";
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState(1);
  const [safetyRating, setSafetyRating] = useState(0);
  const [returnAloneRating, setReturnAloneRating] = useState(0);
  const [recommendRating, setRecommendRating] = useState(0);
  const [visitTime, setVisitTime] = useState("");
  const [groupType, setGroupType] = useState("");
  const [groupSize, setGroupSize] = useState("");
  const [visitFreq, setVisitFreq] = useState("");
  const [incidentOccurred, setIncidentOccurred] = useState<boolean | null>(null);
  const [incidentTypes, setIncidentTypes] = useState<string[]>([]);
  const [incidentReported, setIncidentReported] = useState("");
  const [tips, setTips] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const score = computeScore(safetyRating, returnAloneRating, recommendRating);

  const canNext1 = safetyRating > 0 && returnAloneRating > 0 && recommendRating > 0;
  const canNext2 = visitTime.length > 0 && groupType.length > 0;
  const canNext3 = incidentOccurred !== null;

  const canGoNext = step === 1 ? canNext1 : step === 2 ? canNext2 : step === 3 ? canNext3 : true;

  const next = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const cleanVideoLink = videoLink.trim() && isValidVideoUrl(videoLink) ? videoLink.trim() : undefined;

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const token = Platform.OS !== "web" ? await SecureStore.getItemAsync("auth_session_token") : null;
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          businessId: params.businessId,
          businessName: params.businessName,
          rating: safetyRating,
          text: comments.trim() || undefined,
          wouldReturnAlone: returnAloneRating,
          videoUrl: cleanVideoLink,
          safetyTips: tips.length > 0 ? tips : undefined,
          visitTime,
          groupType,
          groupSize,
          visitFrequency: visitFreq,
          incidentOccurred,
          incidentTypes: incidentTypes.length > 0 ? incidentTypes : undefined,
          incidentReported: incidentReported || undefined,
        }),
      });

      if (res.status === 409) {
        const data = await res.json() as { error?: string };
        Alert.alert("Already Reviewed", data.error ?? "You have already reviewed this business.");
        setSubmitting(false);
        return;
      }

      if (!res.ok && res.status !== 401) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        Alert.alert("Couldn't Submit", data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("No Connection", "Check your internet and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMulti = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  if (submitted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.doneWrap, { paddingTop: topPad }]}>
          <View style={[styles.doneCircle, { backgroundColor: colors.success + "20" }]}>
            <Feather name="check-circle" size={56} color={colors.success} />
          </View>
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>Survey Submitted!</Text>
          <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
            Your safety report helps the community make informed decisions.
          </Text>
          <View style={[styles.scoreCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <Text style={[styles.scoreNum, { color: colors.primary }]}>{score}</Text>
            <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Safety Score / 100</Text>
          </View>
          <View style={[styles.doneStat, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.doneStatNum, { color: colors.primary }]}>+20</Text>
            <Text style={[styles.doneStatLabel, { color: colors.mutedForeground }]}>Community Points earned</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
          >
            <Text style={[styles.doneBtnTxt, { color: colors.primaryForeground }]}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85}
          style={styles.back}
          onPress={() => step > 1 ? setStep((s) => s - 1) : router.canGoBack() ? router.back() : router.replace("/(tabs)")}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Business Safety Survey</Text>
          <Text style={[styles.headerStep, { color: colors.mutedForeground }]}>Step {step} of {TOTAL_STEPS}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${(step / TOTAL_STEPS) * 100}%` as any }]} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1 — Safety Ratings */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={[styles.bizChip, { backgroundColor: colors.secondary }]}>
              <Feather name="map-pin" size={13} color={colors.primary} />
              <Text style={[styles.bizChipTxt, { color: colors.foreground }]}>{businessName}</Text>
            </View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>🛡️ Safety Ratings</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              All three ratings are required — these form the safety score
            </Text>

            <View style={[styles.ratingBlock, { borderColor: colors.border }]}>
              <View style={styles.ratingBlockHeader}>
                <Text style={[styles.ratingBlockTitle, { color: colors.foreground }]}>Overall safety rating</Text>
                <Text style={[styles.ratingWeight, { color: colors.mutedForeground }]}>40%</Text>
              </View>
              <StarRow value={safetyRating} onChange={(v) => { setSafetyRating(v); if (Platform.OS !== "web") Haptics.selectionAsync(); }} size={32} color={colors.primary} />
              {safetyRating > 0 && (
                <Text style={[styles.ratingHint, { color: colors.primary }]}>
                  {["", "Very unsafe", "Unsafe", "Neutral", "Safe", "Very safe"][safetyRating]}
                </Text>
              )}
            </View>

            <View style={[styles.ratingBlock, { borderColor: colors.border }]}>
              <View style={styles.ratingBlockHeader}>
                <Text style={[styles.ratingBlockTitle, { color: colors.foreground }]}>Would you return alone?</Text>
                <Text style={[styles.ratingWeight, { color: colors.mutedForeground }]}>35%</Text>
              </View>
              <StarRow value={returnAloneRating} onChange={(v) => { setReturnAloneRating(v); if (Platform.OS !== "web") Haptics.selectionAsync(); }} size={32} color={colors.accent} />
              {returnAloneRating > 0 && (
                <Text style={[styles.ratingHint, { color: colors.accent }]}>{RETURN_LABELS[returnAloneRating]}</Text>
              )}
            </View>

            <View style={[styles.ratingBlock, { borderColor: colors.border }]}>
              <View style={styles.ratingBlockHeader}>
                <Text style={[styles.ratingBlockTitle, { color: colors.foreground }]}>Recommend to the community?</Text>
                <Text style={[styles.ratingWeight, { color: colors.mutedForeground }]}>25%</Text>
              </View>
              <StarRow value={recommendRating} onChange={(v) => { setRecommendRating(v); if (Platform.OS !== "web") Haptics.selectionAsync(); }} size={32} color={colors.primary} />
              {recommendRating > 0 && (
                <Text style={[styles.ratingHint, { color: colors.primary }]}>{RECOMMEND_LABELS[recommendRating]}</Text>
              )}
            </View>

            {canNext1 && (
              <View style={[styles.liveScore, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                <Text style={[styles.liveScoreLabel, { color: colors.mutedForeground }]}>Safety Score Preview</Text>
                <Text style={[styles.liveScoreNum, { color: colors.primary }]}>{score}<Text style={[styles.liveScoreOf, { color: colors.mutedForeground }]}>/100</Text></Text>
              </View>
            )}
          </View>
        )}

        {/* Step 2 — Visit Context */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>🕐 Visit Context</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Tell us about when and how you visited — time and group type are required
            </Text>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>When did you visit?</Text>
              <View style={styles.chips}>
                {VISIT_TIMES.map((t) => (
                  <Chip key={t} label={t} selected={visitTime === t} onPress={() => setVisitTime(t)}
                    color={colors.primary} primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Who were you with?</Text>
              <View style={styles.chips}>
                {GROUP_TYPES.map((t) => (
                  <Chip key={t} label={t} selected={groupType === t} onPress={() => setGroupType(t)}
                    color={colors.primary} primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>How large was your group? <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              <View style={styles.chips}>
                {GROUP_SIZES.map((t) => (
                  <Chip key={t} label={t} selected={groupSize === t} onPress={() => setGroupSize(t)}
                    color={colors.primary} primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>How often do you visit? <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              <View style={styles.chips}>
                {VISIT_FREQ.map((t) => (
                  <Chip key={t} label={t} selected={visitFreq === t} onPress={() => setVisitFreq(t)}
                    color={colors.primary} primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 3 — Incident Reporting */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>⚠️ Incident Reporting</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Your safety report is always anonymous and helps protect others
            </Text>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Did any safety incident occur?</Text>
              <View style={{ gap: 10 }}>
                {[
                  { val: false, label: "No, all good", icon: "check-circle" as const, col: colors.success },
                  { val: true, label: "Yes, something happened", icon: "alert-circle" as const, col: colors.destructive },
                ].map((opt) => (
                  <TouchableOpacity
                    key={String(opt.val)}
                    style={[
                      styles.incidentOption,
                      {
                        backgroundColor: incidentOccurred === opt.val ? opt.col + "12" : colors.card,
                        borderColor: incidentOccurred === opt.val ? opt.col : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setIncidentOccurred(opt.val);
                      if (!opt.val) { setIncidentTypes([]); setIncidentReported(""); }
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                    }}
                    activeOpacity={0.8}
                  >
                    <Feather name={opt.icon} size={20} color={incidentOccurred === opt.val ? opt.col : colors.mutedForeground} />
                    <Text style={[styles.incidentOptionTxt, { color: colors.foreground }]}>{opt.label}</Text>
                    {incidentOccurred === opt.val && <Feather name="check-circle" size={18} color={opt.col} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {incidentOccurred === true && (
              <>
                <View style={styles.qBlock}>
                  <Text style={[styles.qLabel, { color: colors.foreground }]}>What type of incident occurred? <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(select all that apply)</Text></Text>
                  <View style={styles.chips}>
                    {INCIDENT_TYPES.map((t) => (
                      <Chip key={t} label={t} selected={incidentTypes.includes(t)} multi
                        onPress={() => toggleMulti(incidentTypes, setIncidentTypes, t)}
                        color={colors.destructive} primaryForeground="#FFF"
                        secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                    ))}
                  </View>
                </View>

                <View style={styles.qBlock}>
                  <Text style={[styles.qLabel, { color: colors.foreground }]}>Was the incident reported? <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
                  <View style={styles.chips}>
                    {INCIDENT_REPORTED.map((t) => (
                      <Chip key={t} label={t} selected={incidentReported === t} onPress={() => setIncidentReported(t)}
                        color={colors.primary} primaryForeground={colors.primaryForeground}
                        secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* Step 4 — Tips + Comments */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>💡 Tips & Comments</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Completely optional — share what visitors should know
            </Text>

            {/* Video link — shown first, most prominent */}
            <View style={[styles.videoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Header */}
              <View style={styles.videoCardHeader}>
                <View style={[styles.videoCardIcon, { backgroundColor: "#7B2D8B18" }]}>
                  <Feather name="video" size={18} color="#7B2D8B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.videoCardTitle, { color: colors.foreground }]}>
                    Share a video of your visit
                  </Text>
                  <Text style={[styles.videoCardSub, { color: colors.mutedForeground }]}>
                    Optional — helps others see the real experience
                  </Text>
                </View>
              </View>

              {/* Platform badges */}
              <View style={styles.platformRow}>
                {[
                  { name: "TikTok",    color: "#010101", bg: "#01010112" },
                  { name: "Instagram", color: "#E1306C", bg: "#E1306C12" },
                  { name: "YouTube",   color: "#FF0000", bg: "#FF000012" },
                  { name: "Facebook",  color: "#1877F2", bg: "#1877F212" },
                ].map((p) => (
                  <View key={p.name} style={[styles.platformBadge, { backgroundColor: p.bg, borderColor: p.color + "30" }]}>
                    <Text style={[styles.platformBadgeText, { color: p.color }]}>{p.name}</Text>
                  </View>
                ))}
              </View>

              {/* Confirmed video card */}
              {videoLink.trim() && isValidVideoUrl(videoLink) ? (
                <View style={[styles.videoConfirmed, { backgroundColor: "#2D7A4F12", borderColor: "#2D7A4F30" }]}>
                  <Feather name="play-circle" size={22} color="#2D7A4F" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.videoConfirmedPlatform, { color: "#2D7A4F" }]}>
                      {detectVideoPlatform(videoLink)} video ready
                    </Text>
                    <Text style={[styles.videoConfirmedUrl, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {videoLink.trim()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => { setVideoLink(""); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x-circle" size={20} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Input row */}
                  <View style={[styles.videoInputRow, { borderColor: videoLink && !isValidVideoUrl(videoLink) ? colors.destructive : colors.border, backgroundColor: colors.background }]}>
                    <Feather name="link" size={14} color={colors.mutedForeground} />
                    <TextInput
                      style={[styles.videoInput, { color: colors.foreground }]}
                      placeholder="Paste video link here…"
                      placeholderTextColor={colors.mutedForeground}
                      value={videoLink}
                      onChangeText={setVideoLink}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                    {videoLink.length > 0 ? (
                      <TouchableOpacity onPress={() => setVideoLink("")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Feather name="x" size={14} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={async () => {
                          const text = await Clipboard.getStringAsync();
                          if (text?.startsWith("http")) {
                            setVideoLink(text.trim());
                            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        style={[styles.pasteBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
                      >
                        <Text style={[styles.pasteBtnText, { color: colors.primary }]}>Paste</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Inline validation error */}
                  {videoLink.length > 0 && !isValidVideoUrl(videoLink) && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 }}>
                      <Feather name="alert-circle" size={12} color={colors.destructive} />
                      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.destructive }}>
                        Paste a TikTok, Instagram, YouTube, or Facebook video link
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Quick safety tips for visitors</Text>
              <View style={styles.chips}>
                {SAFETY_TIPS.map((t) => (
                  <Chip key={t} label={t} selected={tips.includes(t)} multi
                    onPress={() => toggleMulti(tips, setTips, t)}
                    color={colors.primary} primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Anything else to share?</Text>
              <TextInput
                style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Share any additional context for the community…"
                placeholderTextColor={colors.mutedForeground}
                value={comments}
                onChangeText={(t) => t.length <= 500 && setComments(t)}
                multiline
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{comments.length}/500</Text>
            </View>

            <View style={[styles.anonRow, { backgroundColor: colors.secondary }]}>
              <Feather name="eye-off" size={16} color={colors.mutedForeground} />
              <Text style={[styles.anonTxt, { color: colors.mutedForeground }]}>
                Surveys are always shared anonymously with the community
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.anonRow, { backgroundColor: colors.secondary, marginHorizontal: 20, marginBottom: 6, borderRadius: 10 }]}>
        <Feather name="shield" size={15} color={colors.mutedForeground} />
        <Text style={[styles.anonTxt, { color: colors.mutedForeground }]}>
          Your review is community content. Businesses may respond publicly but cannot remove it. Only our moderation team removes content for verified policy violations.
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {step < TOTAL_STEPS ? (
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.nextBtn, { backgroundColor: canGoNext ? colors.primary : colors.muted }]}
            onPress={next}
            disabled={!canGoNext}
          >
            <Text style={[styles.nextTxt, { color: canGoNext ? colors.primaryForeground : colors.mutedForeground }]}>Continue</Text>
            <Feather name="arrow-right" size={18} color={canGoNext ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.nextBtn, { backgroundColor: submitting ? colors.muted : colors.primary, opacity: submitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Feather name={submitting ? "clock" : "send"} size={18} color={submitting ? colors.mutedForeground : colors.primaryForeground} />
            <Text style={[styles.nextTxt, { color: submitting ? colors.mutedForeground : colors.primaryForeground }]}>
              {submitting ? "Submitting…" : "Submit Survey"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerStep: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  progressTrack: { height: 3 },
  progressFill: { height: 3 },
  scroll: { padding: 20 },
  stepContent: { gap: 20 },
  bizChip: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  bizChipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30 },
  stepSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, marginTop: -8 },
  ratingBlock: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 },
  ratingBlockHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ratingBlockTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  ratingWeight: { fontSize: 12, fontFamily: "Inter_500Medium" },
  ratingHint: { fontSize: 13, fontFamily: "Inter_500Medium" },
  liveScore: { borderWidth: 1, borderRadius: 14, padding: 16, alignItems: "center", gap: 4 },
  liveScoreLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  liveScoreNum: { fontSize: 36, fontFamily: "Inter_700Bold" },
  liveScoreOf: { fontSize: 16, fontFamily: "Inter_400Regular" },
  qBlock: { gap: 10 },
  qLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  incidentOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1.5 },
  incidentOptionTxt: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  textarea: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 130 },
  charCount: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  qHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: -4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  anonRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12 },
  anonTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 17, borderRadius: 16 },
  nextTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 18 },
  doneCircle: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  doneSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 23 },
  scoreCard: { borderWidth: 1, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 40, alignItems: "center", gap: 4 },
  scoreNum: { fontSize: 48, fontFamily: "Inter_700Bold" },
  scoreLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  doneStat: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  doneStatNum: { fontSize: 24, fontFamily: "Inter_700Bold" },
  doneStatLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  doneBtn: { alignItems: "center", paddingVertical: 17, paddingHorizontal: 40, borderRadius: 16 },
  doneBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  videoCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 14 },
  videoCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  videoCardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  videoCardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  videoCardSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  platformRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  platformBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  platformBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  videoConfirmed: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  videoConfirmedPlatform: { fontSize: 13, fontFamily: "Inter_700Bold" },
  videoConfirmedUrl: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  videoInputRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  videoInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", paddingVertical: 0 },
  pasteBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  pasteBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
