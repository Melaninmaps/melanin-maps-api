import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

const REFERRAL_URL = "https://mappingwithmelanin.com/waitlist?ref=";
const SHARE_PLATFORMS = [
  { id: "twitter", label: "X / Twitter", icon: "twitter" as const, color: "#000" },
  { id: "facebook", label: "Facebook", icon: "facebook" as const, color: "#1877F2" },
  { id: "link", label: "Copy Link", icon: "link" as const, color: "#6B7280" },
  { id: "share", label: "Share", icon: "share-2" as const, color: "#CA922B" },
];

const BENEFITS = [
  { icon: "zap", label: "Early Access", desc: "First to explore new cities and features" },
  { icon: "shield", label: "Safety Insights", desc: "Community-driven safety scores, verified reviews, and real-time insights" },
  { icon: "map-pin", label: "48 States", desc: "2,400+ verified minority-owned businesses nationwide" },
  { icon: "users", label: "10K+ Members", desc: "Join a global community of travelers, entrepreneurs, and creators" },
];

const BIZ_CATEGORIES = [
  "Restaurant", "Café", "Retail", "Beauty & Wellness", "Health & Fitness", "Arts & Culture",
  "Entertainment", "Professional Services", "Tech", "Home Services", "Food & Beverage", "Other",
];

function getApiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}

function RecommendModal({
  visible, onClose, isAuthenticated,
}: { visible: boolean; onClose: () => void; isAuthenticated: boolean }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [bizName, setBizName] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ recommendationCount: number; pointsEarned: number } | null>(null);

  const reset = () => {
    setBizName(""); setWebsite(""); setCity(""); setState("");
    setCategory(""); setNote(""); setBizEmail("");
    setDone(false); setResult(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!bizName.trim()) return;
    setLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(`${getApiBase()}/api/waitlist/recommend-business`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: bizName.trim(),
          website: website.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          category: category || undefined,
          note: note.trim() || undefined,
          businessEmail: bizEmail.trim() || undefined,
        }),
      });
      const data = await res.json() as { recommendationCount?: number; pointsEarned?: number };
      setResult({ recommendationCount: data.recommendationCount ?? 1, pointsEarned: data.pointsEarned ?? 0 });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    finally { setLoading(false); setDone(true); }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <View style={[s.modalSheet, { backgroundColor: colors.background, paddingBottom: bottomPad + 16 }]}>
          <View style={[s.modalHandle, { backgroundColor: colors.border }]} />

          {!done ? (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Help a Business Join 🤎</Text>
              <Text style={[s.modalSub, { color: colors.mutedForeground }]}>
                Know a minority-owned business you'd love to see on Mapping with Melanin™? Help us grow our community by recommending a business you believe others should discover.
              </Text>

              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Business Name <Text style={{ color: colors.destructive }}>*</Text></Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: bizName.trim() ? colors.border : (!bizName ? colors.border : colors.destructive), color: colors.foreground }]}
                value={bizName} onChangeText={setBizName}
                placeholder="e.g. Sweet Auburn Bistro"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
              />

              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Website or Social Media</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={website} onChangeText={setWebsite}
                placeholder="https://... or @handle"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="url" autoCapitalize="none" autoCorrect={false}
              />

              <View style={s.rowFields}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>City</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    value={city} onChangeText={setCity}
                    placeholder="Atlanta" placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="words"
                  />
                </View>
                <View style={{ width: 80 }}>
                  <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>State</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    value={state} onChangeText={(t) => setState(t.toUpperCase())}
                    placeholder="GA" placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="characters" maxLength={2}
                  />
                </View>
              </View>

              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {BIZ_CATEGORIES.map((c) => (
                  <TouchableOpacity activeOpacity={0.85}
                    key={c}
                    style={[s.chip, { backgroundColor: category === c ? colors.primary : colors.card, borderColor: category === c ? colors.primary : colors.border }]}
                    onPress={() => setCategory(category === c ? "" : c)}
                  >
                    <Text style={[s.chipText, { color: category === c ? "#FFFFFF" : colors.foreground }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Why should this business join? <Text style={{ color: colors.mutedForeground + "80" }}>(optional)</Text></Text>
              <TextInput
                style={[s.input, s.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={note} onChangeText={setNote}
                placeholder="Share why this business matters to you and the community…"
                placeholderTextColor={colors.mutedForeground}
                multiline maxLength={300}
              />

              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>
                Business Email <Text style={{ color: colors.mutedForeground + "80" }}>(so we can invite them)</Text>
              </Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={bizEmail} onChangeText={setBizEmail}
                placeholder="hello@theirbusiness.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address" autoCapitalize="none"
              />

              {isAuthenticated && (
                <View style={[s.pointsHint, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "25" }]}>
                  <Text style={{ fontSize: 18 }}>🤎</Text>
                  <Text style={[s.pointsHintText, { color: colors.primary }]}>You'll earn <Text style={{ fontFamily: "Inter_700Bold" }}>20 Community Builder Points</Text> for this recommendation.</Text>
                </View>
              )}

              <TouchableOpacity
                style={[s.submitBtn, { backgroundColor: bizName.trim().length >= 2 ? colors.primary : colors.muted, opacity: bizName.trim().length >= 2 ? 1 : 0.5 }]}
                onPress={handleSubmit}
                disabled={!bizName.trim() || loading}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                  <Text style={s.submitBtnText}>Recommend This Business →</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={s.doneWrap}>
              <Text style={{ fontSize: 52, textAlign: "center" }}>🤎</Text>
              <Text style={[s.doneTitle, { color: colors.foreground }]}>Thank you!</Text>
              <Text style={[s.doneSub, { color: colors.mutedForeground }]}>
                Your recommendation for <Text style={{ fontFamily: "Inter_700Bold", color: colors.foreground }}>{bizName}</Text> has been received.
              </Text>

              {(result?.recommendationCount ?? 0) >= 2 && (
                <View style={[s.countCard, { backgroundColor: colors.primary, borderRadius: 16, padding: 20, alignItems: "center", gap: 4 }]}>
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 28, color: "#FFFFFF" }}>
                    {result!.recommendationCount}
                  </Text>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "rgba(255,255,255,0.9)" }}>
                    community members have recommended this business
                  </Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4, textAlign: "center" }}>
                    That's not just an invitation — that's demand. "Our community is already looking for you."
                  </Text>
                </View>
              )}

              {(result?.pointsEarned ?? 0) > 0 && (
                <View style={[s.pointsBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                  <Text style={{ fontSize: 20 }}>🤎</Text>
                  <Text style={[s.pointsBadgeText, { color: colors.primary }]}>
                    +{result!.pointsEarned} Community Builder Points earned!
                  </Text>
                </View>
              )}

              <View style={[s.badgeHint, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontSize: 20 }}>🏆</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.badgeHintTitle, { color: colors.foreground }]}>Community Recommended Badge</Text>
                  <Text style={[s.badgeHintSub, { color: colors.mutedForeground }]}>
                    When this business joins, they'll display a badge showing the community recommended them — not Mapping with Melanin™. Because the community did.
                  </Text>
                </View>
              </View>

              <TouchableOpacity activeOpacity={0.85}
                style={[s.submitBtn, { backgroundColor: colors.primary }]}
                onPress={() => { reset(); setBizName(""); }}
              >
                <Text style={s.submitBtnText}>Recommend Another Business</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={handleClose} style={{ alignItems: "center", paddingVertical: 12 }}>
                <Text style={[s.doneLink, { color: colors.mutedForeground }]}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function WaitlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState(Math.floor(Math.random() * 800) + 200);
  const [showRecommend, setShowRecommend] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);
  const [showFamilySection, setShowFamilySection] = useState(false);
  const [familyEmails, setFamilyEmails] = useState<string[]>([""]);
  const [familyAdded, setFamilyAdded] = useState(0);
  const [cityNomination, setCityNomination] = useState("");

  const referralCode = email.replace(/[@.]/g, "").toUpperCase().slice(0, 8) || "MELANIN";
  const referralLink = REFERRAL_URL + referralCode;

  const emailValid = email.includes("@") && email.includes(".");
  const websiteValid = !isBusinessOwner || websiteUrl.trim().length > 0;
  const valid = emailValid && websiteValid;

  const handleJoin = async () => {
    if (!valid) return;
    setLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const apiBase = getApiBase();
      const code = email.replace(/[@.]/g, "").toUpperCase().slice(0, 8);
      const res = await fetch(`${apiBase}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          isBusinessOwner,
          websiteUrl: isBusinessOwner ? websiteUrl.trim() : undefined,
          referralCode: code,
          cityNomination: cityNomination.trim() || undefined,
          familyEmails: showFamilySection
            ? familyEmails.filter(e => e.trim().includes("@") && e.trim().includes(".")).map(e => e.trim().toLowerCase())
            : undefined,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { position?: number; familyAdded?: number };
        if (data.position) setPosition(data.position);
        if (data.familyAdded) setFamilyAdded(data.familyAdded);
      }
    } catch {}
    setLoading(false);
    setSubmitted(true);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralLink);
    setCopied(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Mapping with Melanin™ — connecting people to trusted businesses, meaningful relationships, and thriving communities. Use my link to skip the line: ${referralLink}`,
        url: referralLink,
      });
    } catch {}
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85}
          style={styles.back}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Early Access</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!submitted ? (
          <>
            <View style={styles.hero}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logo}
                contentFit="contain"
              />
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>
                Join the Waitlist
              </Text>
              <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
                Be among the first to connect with trusted businesses, community safety intelligence, and AI travel guides across 200+ cities worldwide.
              </Text>

              <View style={[styles.positionBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                <Feather name="users" size={14} color={colors.primary} />
                <Text style={[styles.positionTxt, { color: colors.primary }]}>
                  {position.toLocaleString()}+ people already on the list
                </Text>
              </View>
            </View>

            <View style={styles.benefits}>
              {BENEFITS.map((b) => (
                <View key={b.icon} style={[styles.benefitRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.benefitIcon, { backgroundColor: colors.primary + "12" }]}>
                    <Feather name={b.icon as any} size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.benefitLabel, { color: colors.foreground }]}>{b.label}</Text>
                    <Text style={[styles.benefitDesc, { color: colors.mutedForeground }]}>{b.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.form}>
              <View style={styles.nameRow}>
                <TextInput
                  style={[styles.input, styles.nameInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="First name"
                  placeholderTextColor={colors.mutedForeground}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
                <TextInput
                  style={[styles.input, styles.nameInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Last name"
                  placeholderTextColor={colors.mutedForeground}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: emailValid || !email ? colors.border : colors.destructive, color: colors.foreground }]}
                placeholder="Enter your email to join"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: isBusinessOwner ? colors.primary + "60" : colors.border }]}
                onPress={() => { setIsBusinessOwner((v) => !v); setWebsiteUrl(""); }}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: colors.foreground }]}>I'm a business owner</Text>
                  <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>Get listed as a minority-owned business</Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: isBusinessOwner ? colors.primary : colors.muted }]}>
                  <View style={[styles.toggleThumb, { transform: [{ translateX: isBusinessOwner ? 18 : 2 }] }]} />
                </View>
              </TouchableOpacity>

              {isBusinessOwner && (
                <>
                  <Text style={[styles.formLabel, { color: colors.foreground }]}>
                    Website or Social Media <Text style={{ color: colors.destructive }}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, borderColor: !websiteUrl.trim() ? colors.destructive : colors.border, color: colors.foreground },
                    ]}
                    placeholder="https://yourbusiness.com or @handle"
                    placeholderTextColor={colors.mutedForeground}
                    value={websiteUrl}
                    onChangeText={setWebsiteUrl}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                    Required so we can verify and feature your business.
                  </Text>
                </>
              )}

              {/* Family Circle */}
              <TouchableOpacity
                style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: showFamilySection ? colors.primary + "60" : colors.border, marginTop: 4 }]}
                onPress={() => setShowFamilySection(v => !v)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Add a Family Circle 👨‍👩‍👧‍👦</Text>
                  <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>Register your household — reviewed and approved together</Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: showFamilySection ? colors.primary : colors.muted }]}>
                  <View style={[styles.toggleThumb, { transform: [{ translateX: showFamilySection ? 18 : 2 }] }]} />
                </View>
              </TouchableOpacity>

              {showFamilySection && (
                <View style={{ gap: 8, marginTop: 4 }}>
                  <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                    Each address is registered separately but reviewed as one circle. Up to 6 members.
                  </Text>
                  {familyEmails.map((fe, idx) => (
                    <View key={idx} style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                      <TextInput
                        style={[styles.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                        placeholder={`Family member ${idx + 1} email`}
                        placeholderTextColor={colors.mutedForeground}
                        value={fe}
                        onChangeText={(t) => {
                          const next = [...familyEmails];
                          next[idx] = t;
                          setFamilyEmails(next);
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        onPress={() => setFamilyEmails(familyEmails.filter((_, j) => j !== idx))}
                        style={{ padding: 8 }}
                        activeOpacity={0.7}
                      >
                        <Feather name="x" size={17} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {familyEmails.length < 6 && (
                    <TouchableOpacity
                      onPress={() => setFamilyEmails([...familyEmails, ""])}
                      style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border, justifyContent: "center", gap: 8 }]}
                      activeOpacity={0.8}
                    >
                      <Feather name="user-plus" size={15} color={colors.primary} />
                      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.primary }}>Add family member</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Put Your City on the Map */}
              <View style={[styles.archivePitch, { backgroundColor: "#1C0E0608", borderColor: "#CA922B30" }]}>
                <View style={styles.archivePitchHeader}>
                  <Text style={{ fontSize: 18 }}>🗺️</Text>
                  <Text style={[styles.archivePitchTitle, { color: colors.foreground }]}>Officially Put Your City on the Map</Text>
                </View>
                <Text style={[styles.archivePitchText, { color: colors.mutedForeground }]}>
                  Every city on the Welcome Home Tour gets a permanent community archive — interviews, food recs, local knowledge, and stories from residents. Nominate your city and we'll reach out when the tour arrives.
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 8 }]}
                  placeholder="e.g. Atlanta, GA"
                  placeholderTextColor={colors.mutedForeground}
                  value={cityNomination}
                  onChangeText={setCityNomination}
                />
              </View>

              <TouchableOpacity
                style={[styles.joinBtn, { backgroundColor: valid ? colors.primary : colors.muted }]}
                onPress={handleJoin}
                disabled={!valid || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <Text style={[styles.joinTxt, { color: colors.mutedForeground }]}>Joining…</Text>
                ) : (
                  <>
                    <Text style={[styles.joinTxt, { color: valid ? colors.primaryForeground : colors.mutedForeground }]}>Request Early Access</Text>
                    <Feather name="arrow-right" size={16} color={valid ? colors.primaryForeground : colors.mutedForeground} />
                  </>
                )}
              </TouchableOpacity>
              <Text style={[styles.privacy, { color: colors.mutedForeground }]}>
                No spam. Unsubscribe anytime. Your data is never sold.{"\n"}We don't sell your attention—we help our community discover great businesses.
              </Text>
            </View>

            {/* Who are we missing? */}
            <RecommendBanner colors={colors} onPress={() => setShowRecommend(true)} />
          </>
        ) : (
          <>
            <View style={styles.successHero}>
              <View style={[styles.successCircle, { backgroundColor: colors.success + "20" }]}>
                <Feather name="check-circle" size={52} color={colors.success} />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>You're on the list!</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                We'll send your early access invite to {email} when we launch in your city.
              </Text>

              <View style={[styles.positionCard, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.positionNum, { color: colors.primary }]}>#{position}</Text>
                <Text style={[styles.positionLabel, { color: colors.mutedForeground }]}>Your waitlist position</Text>
                <Text style={[styles.positionHint, { color: colors.mutedForeground }]}>Share your link to move up the list</Text>
              </View>

              {familyAdded > 0 && (
                <View style={[styles.positionCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "25", borderWidth: 1, gap: 4 }]}>
                  <Text style={{ fontSize: 28 }}>👨‍👩‍👧‍👦</Text>
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: colors.foreground, textAlign: "center" }}>
                    Family Circle Added!
                  </Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, textAlign: "center", lineHeight: 19 }}>
                    {familyAdded} family member{familyAdded > 1 ? "s" : ""} registered. Each will receive their own confirmation email and you'll be reviewed together.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.referralSection}>
              <Text style={[styles.referralTitle, { color: colors.foreground }]}>Get Early Access Faster</Text>
              <Text style={[styles.referralSub, { color: colors.mutedForeground }]}>
                Refer 1 friend to unlock early access. Refer 25+ to become an Ambassador.
              </Text>

              <View style={[styles.referralLinkBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.referralLink, { color: colors.foreground }]} numberOfLines={1}>{referralLink}</Text>
                <TouchableOpacity onPress={handleCopy} activeOpacity={0.8}>
                  <Feather name={copied ? "check" : "copy"} size={18} color={copied ? colors.success : colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.shareRow}>
                {SHARE_PLATFORMS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.shareBtn, { backgroundColor: p.color + "15", borderColor: p.color + "30" }]}
                    onPress={p.id === "link" ? handleCopy : p.id === "share" ? handleShare : undefined}
                    activeOpacity={0.8}
                  >
                    <Feather name={p.icon} size={18} color={p.color} />
                    <Text style={[styles.shareBtnTxt, { color: p.color }]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Invite a Friend to the Community */}
            <TouchableOpacity
              style={[styles.inviteCard, { backgroundColor: colors.card, borderColor: colors.primary + "50" }]}
              onPress={() => setShowInvite(true)}
              activeOpacity={0.88}
            >
              <View style={[styles.inviteCardIconWrap, { backgroundColor: colors.primary + "15" }]}>
                <Text style={{ fontSize: 28 }}>🤎</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.inviteCardTitleRow}>
                  <Text style={[styles.inviteCardTitle, { color: colors.foreground }]}>Add a Friend to the Community</Text>
                  {inviteCount > 0 && (
                    <View style={[styles.inviteCountBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.inviteCountText}>{inviteCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.inviteCardSub, { color: colors.mutedForeground }]}>
                  Enter their email and they're added immediately — no link needed. A personal invite lands in their inbox from you.
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.primary} />
            </TouchableOpacity>

            {/* Welcome Home Archive Pitch */}
            {cityNomination.trim() && (
              <View style={[styles.archivePitch, { backgroundColor: "#CA922B10", borderColor: "#CA922B30" }]}>
                <Text style={[styles.archivePitchTitle, { color: colors.foreground }]}>🗺️ {cityNomination.trim()} is Nominated!</Text>
                <Text style={[styles.archivePitchText, { color: colors.mutedForeground }]}>
                  When the Welcome Home Tour comes to your city, you'll have the chance to officially contribute to its archive — your words, your places, your community's story. Permanently.
                </Text>
              </View>
            )}

            {/* Nominate a friend */}
            <View style={[styles.archivePitch, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.archivePitchHeader}>
                <Text style={{ fontSize: 18 }}>🤎</Text>
                <Text style={[styles.archivePitchTitle, { color: colors.foreground }]}>Nominate a Friend</Text>
              </View>
              <Text style={[styles.archivePitchText, { color: colors.mutedForeground }]}>
                Know someone who should be part of this? Invite them to the waitlist — and nominate them to be a founding voice for their city's archive.
              </Text>
              <TouchableOpacity
                style={[styles.joinBtn, { backgroundColor: colors.primary, marginTop: 4 }]}
                onPress={() => setShowInvite(true)}
                activeOpacity={0.85}
              >
                <Text style={[styles.joinTxt, { color: colors.primaryForeground }]}>Invite a Friend</Text>
                <Feather name="user-plus" size={15} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>

            {/* Who are we missing? — after signup too */}
            <RecommendBanner colors={colors} onPress={() => setShowRecommend(true)} />

            <TouchableOpacity activeOpacity={0.85}
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={[styles.doneBtnTxt, { color: colors.primaryForeground }]}>Explore the App</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <RecommendModal
        visible={showRecommend}
        onClose={() => setShowRecommend(false)}
        isAuthenticated={isAuthenticated}
      />
      <InviteFriendModal
        visible={showInvite}
        referralCode={referralCode}
        onClose={(invited) => {
          setShowInvite(false);
          if (invited) setInviteCount((n) => n + 1);
        }}
      />
    </KeyboardAvoidingView>
  );
}

function InviteFriendModal({
  visible,
  onClose,
  referralCode,
}: {
  visible: boolean;
  onClose: (invited: boolean) => void;
  referralCode: string;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"email" | "social">("email");
  const [friendName, setFriendName] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [socialPlatform, setSocialPlatform] = useState("instagram");
  const [socialHandle, setSocialHandle] = useState("");
  const [socialName, setSocialName] = useState("");
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialDone, setSocialDone] = useState(false);
  const [socialCopyMsg, setSocialCopyMsg] = useState("");

  const PLATFORMS = [
    { id: "instagram", label: "Instagram" },
    { id: "tiktok", label: "TikTok" },
    { id: "x", label: "X / Twitter" },
    { id: "facebook", label: "Facebook" },
    { id: "linkedin", label: "LinkedIn" },
  ];

  const [recipientType, setRecipientType] = useState<"friend" | "business">("friend");
  const [bizName, setBizName] = useState("");

  const emailValid = friendEmail.includes("@") && friendEmail.includes(".");
  const canSubmit = emailValid && !loading && (recipientType === "friend" || !!bizName.trim());

  const reset = () => {
    setFriendName(""); setFriendEmail(""); setDone(false); setError("");
    setSocialHandle(""); setSocialName(""); setSocialDone(false); setSocialCopyMsg("");
    setBizName("");
  };

  const handleClose = (invited: boolean) => { reset(); onClose(invited); };

  const handleInvite = async () => {
    if (!canSubmit) return;
    setLoading(true); setError("");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(`${getApiBase()}/api/waitlist/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralCode,
          inviteeEmail: friendEmail.trim(),
          inviteeName: recipientType === "friend" ? (friendName.trim() || undefined) : undefined,
          businessName: recipientType === "business" ? bizName.trim() : undefined,
          type: recipientType,
        }),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        setError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch {
      setError("Couldn't send the invite. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialInvite = async () => {
    if (!socialHandle.trim() || socialLoading) return;
    setSocialLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(`${getApiBase()}/api/waitlist/social-refer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: socialPlatform,
          handleOrUrl: socialHandle.trim(),
          name: socialName.trim() || undefined,
          type: recipientType,
          referralCode: referralCode || undefined,
          bizName: recipientType === "business" ? bizName.trim() : undefined,
        }),
      });
      const data = await res.json() as { copyMessage?: string; error?: string };
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSocialCopyMsg(data.copyMessage ?? "");
      setSocialDone(true);
    } catch {
      setSocialDone(false);
    } finally {
      setSocialLoading(false);
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => handleClose(done || socialDone)}>
      <KeyboardAvoidingView style={inv.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => handleClose(done || socialDone)} />
        <View style={[inv.sheet, { backgroundColor: colors.background, paddingBottom: bottomPad + 20 }]}>
          <View style={[inv.handle, { backgroundColor: colors.border }]} />

          {!done && !socialDone ? (
            <>
              <View style={inv.titleRow}>
                <Text style={[inv.title, { color: colors.foreground }]}>Invite a Friend 🤎</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={() => handleClose(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <View style={[inv.tabRow, { borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[inv.tabBtn, tab === "email" && { backgroundColor: colors.primary }]}
                  onPress={() => setTab("email")}
                  activeOpacity={0.8}
                >
                  <Text style={[inv.tabBtnTxt, { color: tab === "email" ? colors.primaryForeground : colors.mutedForeground }]}>✉️ By Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[inv.tabBtn, tab === "social" && { backgroundColor: colors.primary }]}
                  onPress={() => setTab("social")}
                  activeOpacity={0.8}
                >
                  <Text style={[inv.tabBtnTxt, { color: tab === "social" ? colors.primaryForeground : colors.mutedForeground }]}>📲 By Social</Text>
                </TouchableOpacity>
              </View>

              {tab === "email" ? (
                <>
                  <View style={[inv.tabRow, { borderColor: colors.border }]}>
                    <TouchableOpacity style={[inv.tabBtn, recipientType === "friend" && { backgroundColor: colors.primary }]} onPress={() => setRecipientType("friend")} activeOpacity={0.8}>
                      <Text style={[inv.tabBtnTxt, { color: recipientType === "friend" ? colors.primaryForeground : colors.mutedForeground }]}>Friend</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[inv.tabBtn, recipientType === "business" && { backgroundColor: colors.primary }]} onPress={() => setRecipientType("business")} activeOpacity={0.8}>
                      <Text style={[inv.tabBtnTxt, { color: recipientType === "business" ? colors.primaryForeground : colors.mutedForeground }]}>Business</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[inv.sub, { color: colors.mutedForeground }]}>
                    {recipientType === "business" ? "We'll send them an invite to list their business on Mapping With Melanin™." : "We'll add them to the waitlist and send a personal invite from you."}
                  </Text>
                  {recipientType === "business" && (
                    <>
                      <Text style={[inv.label, { color: colors.mutedForeground }]}>Business Name <Text style={{ color: colors.destructive }}>*</Text></Text>
                      <TextInput
                        style={[inv.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                        value={bizName} onChangeText={setBizName}
                        placeholder="e.g. Sweet Auburn Bistro"
                        placeholderTextColor={colors.mutedForeground}
                        autoCapitalize="words" returnKeyType="next"
                      />
                    </>
                  )}
                  <Text style={[inv.label, { color: colors.mutedForeground }]}>{recipientType === "business" ? "Contact Name" : "Friend's Name"} <Text style={{ color: colors.mutedForeground + "80" }}>(optional)</Text></Text>
                  <TextInput
                    style={[inv.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    value={friendName}
                    onChangeText={setFriendName}
                    placeholder={recipientType === "business" ? "e.g. Marcus Johnson" : "e.g. Maya Johnson"}
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                  <Text style={[inv.label, { color: colors.mutedForeground }]}>
                    {recipientType === "business" ? "Business Email" : "Friend's Email"} <Text style={{ color: colors.destructive }}>*</Text>
                  </Text>
                  <TextInput
                    style={[inv.input, { backgroundColor: colors.card, borderColor: friendEmail && !emailValid ? colors.destructive : colors.border, color: colors.foreground }]}
                    value={friendEmail}
                    onChangeText={setFriendEmail}
                    placeholder={recipientType === "business" ? "hello@theirbusiness.com" : "maya@example.com"}
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="send"
                    onSubmitEditing={handleInvite}
                  />
                  {!!error && (
                    <View style={[inv.errorBox, { borderColor: colors.destructive + "40", backgroundColor: colors.destructive + "10" }]}>
                      <Feather name="alert-circle" size={14} color={colors.destructive} />
                      <Text style={[inv.errorText, { color: colors.destructive }]}>{error}</Text>
                    </View>
                  )}
                  <View style={[inv.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
                    <Text style={{ fontSize: 16 }}>✉️</Text>
                    <Text style={[inv.infoText, { color: colors.primary }]}>
                      They'll get a personal invite from <Text style={{ fontFamily: "Inter_700Bold" }}>you</Text> — not a generic email.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[inv.btn, { backgroundColor: canSubmit ? colors.primary : colors.muted, opacity: canSubmit ? 1 : 0.5 }]}
                    onPress={handleInvite}
                    disabled={!canSubmit}
                    activeOpacity={0.85}
                  >
                    {loading
                      ? <ActivityIndicator size="small" color="#FFF" />
                      : <Text style={inv.btnText}>{recipientType === "business" ? `Invite ${bizName.trim() ? bizName.trim().split(" ")[0] : "Business"} →` : `Add ${friendName.trim() ? friendName.trim().split(" ")[0] : "Friend"} to the Community →`}</Text>
                    }
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={[inv.tabRow, { borderColor: colors.border }]}>
                    <TouchableOpacity style={[inv.tabBtn, recipientType === "friend" && { backgroundColor: colors.primary }]} onPress={() => setRecipientType("friend")} activeOpacity={0.8}>
                      <Text style={[inv.tabBtnTxt, { color: recipientType === "friend" ? colors.primaryForeground : colors.mutedForeground }]}>Friend</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[inv.tabBtn, recipientType === "business" && { backgroundColor: colors.primary }]} onPress={() => setRecipientType("business")} activeOpacity={0.8}>
                      <Text style={[inv.tabBtnTxt, { color: recipientType === "business" ? colors.primaryForeground : colors.mutedForeground }]}>Business</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[inv.sub, { color: colors.mutedForeground }]}>
                    Enter their social handle or profile URL. We'll generate a message you can send them directly.
                  </Text>
                  {recipientType === "business" && (
                    <>
                      <Text style={[inv.label, { color: colors.mutedForeground }]}>Business Name <Text style={{ color: colors.destructive }}>*</Text></Text>
                      <TextInput
                        style={[inv.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                        value={bizName} onChangeText={setBizName}
                        placeholder="e.g. Sweet Auburn Bistro"
                        placeholderTextColor={colors.mutedForeground}
                        autoCapitalize="words" returnKeyType="next"
                      />
                    </>
                  )}
                  <Text style={[inv.label, { color: colors.mutedForeground }]}>{recipientType === "business" ? "Contact Name" : "Their Name"} <Text style={{ color: colors.mutedForeground + "80" }}>(optional)</Text></Text>
                  <TextInput
                    style={[inv.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    value={socialName}
                    onChangeText={setSocialName}
                    placeholder={recipientType === "business" ? "e.g. Marcus" : "e.g. Maya"}
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                  <Text style={[inv.label, { color: colors.mutedForeground }]}>Platform</Text>
                  <View style={[inv.platformRow]}>
                    {PLATFORMS.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[inv.platformChip, { borderColor: socialPlatform === p.id ? colors.primary : colors.border, backgroundColor: socialPlatform === p.id ? colors.primary + "15" : colors.card }]}
                        onPress={() => setSocialPlatform(p.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[inv.platformChipTxt, { color: socialPlatform === p.id ? colors.primary : colors.mutedForeground }]}>{p.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={[inv.label, { color: colors.mutedForeground }]}>Handle or Profile URL <Text style={{ color: colors.destructive }}>*</Text></Text>
                  <TextInput
                    style={[inv.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    value={socialHandle}
                    onChangeText={setSocialHandle}
                    placeholder="@handle or https://..."
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="send"
                    onSubmitEditing={handleSocialInvite}
                  />
                  <TouchableOpacity
                    style={[inv.btn, { backgroundColor: (socialHandle.trim() && (recipientType === "friend" || !!bizName.trim())) ? colors.primary : colors.muted, opacity: (socialHandle.trim() && (recipientType === "friend" || !!bizName.trim())) ? 1 : 0.5 }]}
                    onPress={handleSocialInvite}
                    disabled={!socialHandle.trim() || socialLoading || (recipientType === "business" && !bizName.trim())}
                    activeOpacity={0.85}
                  >
                    {socialLoading
                      ? <ActivityIndicator size="small" color="#FFF" />
                      : <Text style={inv.btnText}>Get Message to Send →</Text>
                    }
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : socialDone ? (
            <View style={inv.doneWrap}>
              <Text style={{ fontSize: 48, textAlign: "center" }}>📲</Text>
              <Text style={[inv.doneTitle, { color: colors.foreground }]}>Ready to send!</Text>
              <Text style={[inv.doneSub, { color: colors.mutedForeground }]}>
                Copy this message and send it to{socialName.trim() ? ` ${socialName.trim()}` : " them"} on {PLATFORMS.find(p => p.id === socialPlatform)?.label ?? socialPlatform}:
              </Text>
              {!!socialCopyMsg && (
                <View style={[inv.copyBox, { backgroundColor: colors.card, borderColor: colors.primary + "30" }]}>
                  <Text style={[inv.copyText, { color: colors.foreground }]}>{socialCopyMsg}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[inv.btn, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  await Clipboard.setStringAsync(socialCopyMsg);
                  if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                activeOpacity={0.85}
              >
                <Feather name="copy" size={16} color={colors.primaryForeground} />
                <Text style={inv.btnText}>Copy Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[inv.btn, { backgroundColor: colors.secondary, marginTop: 4 }]} onPress={reset} activeOpacity={0.85}>
                <Text style={[inv.btnText, { color: colors.foreground }]}>{recipientType === "business" ? "Refer Another" : "Invite Another Friend"}</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={() => handleClose(true)} style={{ alignItems: "center", paddingVertical: 14 }}>
                <Text style={[inv.doneLink, { color: colors.mutedForeground }]}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={inv.doneWrap}>
              <Text style={{ fontSize: 56, textAlign: "center" }}>🎉</Text>
              <Text style={[inv.doneTitle, { color: colors.foreground }]}>
                {friendName.trim() ? `${friendName.trim().split(" ")[0]} is in!` : "They're in!"}
              </Text>
              <Text style={[inv.doneSub, { color: colors.mutedForeground }]}>
                <Text style={{ fontFamily: "Inter_700Bold", color: colors.foreground }}>
                  {friendName.trim() || friendEmail}
                </Text>{" "}
                has been added to the community waitlist and sent a personal invite. They'll hear from us soon.
              </Text>

              <View style={[inv.successBadge, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                <Feather name="users" size={16} color={colors.primary} />
                <Text style={[inv.successBadgeText, { color: colors.primary }]}>
                  Your community is growing. Every person you add helps build something powerful.
                </Text>
              </View>

              <TouchableOpacity activeOpacity={0.85} style={[inv.btn, { backgroundColor: colors.primary }]} onPress={reset}>
                <Text style={inv.btnText}>Invite Another Friend</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={() => handleClose(true)} style={{ alignItems: "center", paddingVertical: 14 }}>
                <Text style={[inv.doneLink, { color: colors.mutedForeground }]}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function RecommendBanner({ colors, onPress }: { colors: ReturnType<typeof useColors>; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.recommendBanner, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.recommendBannerIcon, { backgroundColor: colors.primary + "15" }]}>
        <Text style={{ fontSize: 26 }}>🔍</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.recommendBannerTitle, { color: colors.foreground }]}>Who are we missing?</Text>
        <Text style={[styles.recommendBannerSub, { color: colors.mutedForeground }]}>
          Mapping with Melanin™ is built by the community. Help us discover businesses that deserve to be seen, celebrated, and supported.
        </Text>
      </View>
      <View style={[styles.recommendBannerBtn, { backgroundColor: colors.primary }]}>
        <Text style={styles.recommendBannerBtnText}>Recommend</Text>
        <Text style={{ fontSize: 14 }}>🤎</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  scroll: { padding: 20, gap: 24 },
  hero: { alignItems: "center", gap: 12 },
  logo: { width: 100, height: 100 },
  heroTitle: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  heroSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 23 },
  positionBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  positionTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  benefits: { gap: 10 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  benefitIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  benefitLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  benefitDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  form: { gap: 12 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, padding: 14 },
  toggleLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  toggleSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  toggle: { width: 42, height: 24, borderRadius: 12, justifyContent: "center" },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFF", position: "absolute" },
  fieldHint: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: -4 },
  nameRow: { flexDirection: "row", gap: 10 },
  nameInput: { flex: 1 },
  formLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  joinBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 17, borderRadius: 16 },
  joinTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  privacy: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  successHero: { alignItems: "center", gap: 16 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  positionCard: { borderRadius: 16, padding: 20, alignItems: "center", gap: 4, width: "100%" },
  positionNum: { fontSize: 40, fontFamily: "Inter_700Bold" },
  positionLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  positionHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  referralSection: { gap: 12 },
  referralTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  referralSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  referralLinkBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
  referralLink: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  shareRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  shareBtnTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  doneBtn: { alignItems: "center", paddingVertical: 17, borderRadius: 16 },
  doneBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  archivePitch: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  archivePitchHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  archivePitchTitle: { fontFamily: "Inter_700Bold", fontSize: 14, flex: 1 },
  archivePitchText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  inviteCard: {
    flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 2,
    borderRadius: 20, padding: 16,
  },
  inviteCardIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  inviteCardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  inviteCardTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  inviteCardSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 3 },
  inviteCountBadge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  inviteCountText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#FFF" },
  recommendBanner: {
    borderRadius: 20, borderWidth: 2, padding: 18, gap: 12,
    borderStyle: "dashed",
  },
  recommendBannerIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  recommendBannerTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 4 },
  recommendBannerSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  recommendBannerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 4,
  },
  recommendBannerBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFFFFF" },
});

const s = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 12, maxHeight: "92%" },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  modalSub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, marginBottom: 4 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 12, marginBottom: -4 },
  input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { height: 80, textAlignVertical: "top", paddingTop: 12 },
  rowFields: { flexDirection: "row", gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  pointsHint: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  pointsHintText: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1, lineHeight: 18 },
  submitBtn: { paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 4 },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFFFFF" },
  doneWrap: { alignItems: "center", gap: 16, paddingVertical: 8 },
  doneTitle: { fontFamily: "Inter_700Bold", fontSize: 26 },
  doneSub: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 22 },
  countCard: {},
  pointsBadge: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, width: "100%" },
  pointsBadgeText: { fontFamily: "Inter_700Bold", fontSize: 14, flex: 1 },
  badgeHint: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, width: "100%" },
  badgeHintTitle: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 4 },
  badgeHintSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  doneLink: { fontFamily: "Inter_500Medium", fontSize: 15 },
});

const inv = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 14, maxHeight: "92%" },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, flex: 1 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
  btn: { paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFF" },
  doneWrap: { alignItems: "center", gap: 16, paddingVertical: 8 },
  doneTitle: { fontFamily: "Inter_700Bold", fontSize: 26, textAlign: "center" },
  doneSub: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 22 },
  successBadge: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, width: "100%" },
  successBadgeText: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1, lineHeight: 19 },
  doneLink: { fontFamily: "Inter_500Medium", fontSize: 15 },
  tabRow: { flexDirection: "row", gap: 8, borderRadius: 14, padding: 4, borderWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  platformRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  platformChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  platformChipTxt: { fontFamily: "Inter_500Medium", fontSize: 12 },
  copyBox: { borderWidth: 1, borderRadius: 14, padding: 14, width: "100%" },
  copyText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
});
