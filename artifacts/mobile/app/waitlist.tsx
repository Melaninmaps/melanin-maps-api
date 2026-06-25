import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const REFERRAL_URL = "https://melaninmaps.app/waitlist?ref=";
const SHARE_PLATFORMS = [
  { id: "twitter", label: "X / Twitter", icon: "twitter" as const, color: "#000" },
  { id: "facebook", label: "Facebook", icon: "facebook" as const, color: "#1877F2" },
  { id: "link", label: "Copy Link", icon: "link" as const, color: "#6B7280" },
  { id: "share", label: "Share", icon: "share-2" as const, color: "#3B1F0E" },
];

const BENEFITS = [
  { icon: "zap", label: "Early Access", desc: "First to explore new cities and features" },
  { icon: "shield", label: "Safety Insights", desc: "Community-driven safety scores, verified reviews, and real-time insights" },
  { icon: "map-pin", label: "48 States", desc: "2,400+ verified Black-owned businesses nationwide" },
  { icon: "users", label: "10K+ Members", desc: "Join a global community of travelers, entrepreneurs, and creators" },
];

export default function WaitlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
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
      const apiBase = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
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
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { position?: number };
        if (data.position) setPosition(data.position);
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
        <TouchableOpacity
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

              {/* Business owner toggle */}
              <TouchableOpacity
                style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: isBusinessOwner ? colors.primary + "60" : colors.border }]}
                onPress={() => { setIsBusinessOwner((v) => !v); setWebsiteUrl(""); }}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: colors.foreground }]}>I'm a business owner</Text>
                  <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>Get listed as a Black-owned business</Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: isBusinessOwner ? colors.primary : colors.muted }]}>
                  <View style={[styles.toggleThumb, { transform: [{ translateX: isBusinessOwner ? 18 : 2 }] }]} />
                </View>
              </TouchableOpacity>

              {/* Website / social URL — required for business owners */}
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

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={[styles.doneBtnTxt, { color: colors.primaryForeground }]}>Explore the App</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
});
