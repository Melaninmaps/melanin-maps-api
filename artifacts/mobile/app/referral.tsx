import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

const TIERS = [
  { label: "Pioneer", min: 0, max: 2, icon: "🌱", color: "#7B4F2E", bg: "#7B4F2E18", reward: "Community badge + early access" },
  { label: "Connector", min: 3, max: 9, icon: "🔗", color: "#C9922B", bg: "#C9922B18", reward: "$5 credit + featured profile" },
  { label: "Ambassador", min: 10, max: 24, icon: "✨", color: "#3B1F0E", bg: "#3B1F0E18", reward: "$25 credit + Ambassador badge" },
  { label: "Legend", min: 25, max: Infinity, icon: "👑", color: "#2D7A4F", bg: "#2D7A4F18", reward: "$100 credit + lifetime perks" },
];

const INVITES = [
  { name: "Zara M.", status: "joined", timeAgo: "2 days ago", color: "#3B1F0E" },
  { name: "Kwame A.", status: "joined", timeAgo: "1 week ago", color: "#2D7A4F" },
  { name: "Imani T.", status: "pending", timeAgo: "Invited 3 days ago", color: "#C9922B" },
];

export default function ReferralScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [loadingEntry, setLoadingEntry] = useState(true);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const apiBase = getApiBase();
        if (!token || !apiBase) return;
        const res = await fetch(`${apiBase}/api/waitlist/my-entry`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { entry: { referralCode?: string; referralCount?: number } | null };
          if (data.entry?.referralCode) {
            setReferralCode(data.entry.referralCode);
            setReferralCount(data.entry.referralCount ?? 0);
          }
        }
      } catch {}
      finally { setLoadingEntry(false); }
    };
    void fetchEntry();
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const currentTier = TIERS.find((t) => referralCount >= t.min && referralCount <= t.max) ?? TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];
  const progress = nextTier
    ? (referralCount - currentTier.min) / (nextTier.min - currentTier.min)
    : 1;

  const code = referralCode ?? "—";
  const referralUrl = referralCode
    ? `https://mappingwithmelanin.com/?ref=${referralCode}`
    : "https://mappingwithmelanin.com";

  const handleCopy = async () => {
    if (!referralCode) return;
    await Clipboard.setStringAsync(referralCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Join me on Mapping With Melanin — the community discovery app for us, by us! 🗺️✊🏾\n\nUse my referral code: ${code}\n${referralUrl}`,
        title: "Join Mapping With Melanin",
        url: referralUrl,
      });
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Referral Program</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 40 }]}
      >
        {/* Hero banner */}
        <View style={[styles.heroBanner, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroEmoji}>🗺️✊🏾</Text>
          <Text style={styles.heroTitle}>Grow Our Community</Text>
          <Text style={styles.heroSub}>
            Invite friends to join Mapping With Melanin and earn rewards for every person who signs up.
          </Text>
        </View>

        {/* Referral code card */}
        <View style={[styles.codeCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
          <Text style={[styles.codeLabel, { color: colors.mutedForeground }]}>Your Referral Code</Text>
          <View style={styles.codeRow}>
            {loadingEntry
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={[styles.codeText, { color: colors.primary }]}>{code}</Text>
            }
            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: copied ? "#2D7A4F18" : colors.secondary, borderColor: copied ? "#2D7A4F" : colors.border }]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Feather name={copied ? "check" : "copy"} size={15} color={copied ? "#2D7A4F" : colors.primary} />
              <Text style={[styles.copyBtnText, { color: copied ? "#2D7A4F" : colors.primary }]}>
                {copied ? "Copied!" : "Copy"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.codeUrl, { color: colors.mutedForeground }]} numberOfLines={1}>
            {referralUrl}
          </Text>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary }]}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Feather name="share-2" size={18} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Share Invite Link</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
          <View style={styles.progressHeader}>
            <View style={[styles.tierBadge, { backgroundColor: currentTier.bg }]}>
              <Text style={styles.tierEmoji}>{currentTier.icon}</Text>
              <Text style={[styles.tierName, { color: currentTier.color }]}>{currentTier.label}</Text>
            </View>
            <View style={styles.inviteCount}>
              <Text style={[styles.inviteNum, { color: colors.primary }]}>{referralCount}</Text>
              <Text style={[styles.inviteLabel, { color: colors.mutedForeground }]}>joined</Text>
            </View>
          </View>

          {nextTier && (
            <>
              <View style={styles.progressBarWrap}>
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: colors.primary }]} />
                </View>
                <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                  {nextTier.min - referralCount} more to reach {nextTier.label}
                </Text>
              </View>
              <View style={[styles.nextTierCard, { backgroundColor: nextTier.bg, borderColor: nextTier.color + "30" }]}>
                <Text style={styles.nextTierEmoji}>{nextTier.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nextTierLabel, { color: nextTier.color }]}>Next: {nextTier.label}</Text>
                  <Text style={[styles.nextTierReward, { color: colors.mutedForeground }]}>{nextTier.reward}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Reward tiers */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Reward Tiers</Text>
        {TIERS.map((tier, idx) => {
          const active = tier === currentTier;
          const unlocked = referralCount >= tier.min;
          return (
            <View
              key={tier.label}
              style={[
                styles.tierRow,
                {
                  backgroundColor: active ? tier.bg : colors.card,
                  borderColor: active ? tier.color + "50" : colors.border,
                  opacity: unlocked ? 1 : 0.55,
                },
              ]}
            >
              <View style={[styles.tierIcon, { backgroundColor: tier.bg }]}>
                <Text style={{ fontSize: 22 }}>{tier.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.tierTitleRow}>
                  <Text style={[styles.tierRowName, { color: tier.color }]}>{tier.label}</Text>
                  <Text style={[styles.tierRange, { color: colors.mutedForeground }]}>
                    {tier.max === Infinity ? `${tier.min}+` : `${tier.min}–${tier.max}`} referrals
                  </Text>
                </View>
                <Text style={[styles.tierRowReward, { color: colors.mutedForeground }]}>{tier.reward}</Text>
              </View>
              {unlocked && (
                <View style={[styles.checkBadge, { backgroundColor: "#2D7A4F" }]}>
                  <Feather name="check" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
          );
        })}

        {/* Invite history */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Invites</Text>
        {INVITES.map((invite) => (
          <View key={invite.name} style={[styles.inviteRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.inviteAvatar, { backgroundColor: invite.color }]}>
              <Text style={styles.inviteInitials}>{invite.name.split(" ").map((w) => w[0]).join("")}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inviteName, { color: colors.foreground }]}>{invite.name}</Text>
              <Text style={[styles.inviteTime, { color: colors.mutedForeground }]}>{invite.timeAgo}</Text>
            </View>
            <View style={[
              styles.inviteStatus,
              { backgroundColor: invite.status === "joined" ? "#2D7A4F18" : "#C9922B18" }
            ]}>
              <View style={[styles.statusDot, { backgroundColor: invite.status === "joined" ? "#2D7A4F" : "#C9922B" }]} />
              <Text style={[styles.statusText, { color: invite.status === "joined" ? "#2D7A4F" : "#C9922B" }]}>
                {invite.status === "joined" ? "Joined" : "Pending"}
              </Text>
            </View>
          </View>
        ))}

        {/* How it works */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How It Works</Text>
        <View style={[styles.howCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
          {[
            { step: "1", icon: "share-2", text: "Share your unique referral code or link with friends" },
            { step: "2", icon: "user-plus", text: "They sign up using your code within 30 days" },
            { step: "3", icon: "award", text: "You both receive rewards when they verify their account" },
          ].map((item) => (
            <View key={item.step} style={styles.howRow}>
              <View style={[styles.howStep, { backgroundColor: colors.primary }]}>
                <Text style={styles.howStepText}>{item.step}</Text>
              </View>
              <Feather name={item.icon as any} size={16} color={colors.primary} />
              <Text style={[styles.howText, { color: colors.foreground }]}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  content: { padding: 20, gap: 16 },
  heroBanner: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  heroEmoji: { fontSize: 36 },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#FFFFFF", textAlign: "center" },
  heroSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(251,247,240,0.85)", textAlign: "center", lineHeight: 21 },
  codeCard: {
    borderRadius: 18,
    padding: 20,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  codeLabel: { fontFamily: "Inter_500Medium", fontSize: 12 },
  codeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  codeText: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: 1.5 },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  copyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  codeUrl: { fontFamily: "Inter_400Regular", fontSize: 11 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 4,
  },
  shareBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFFFFF" },
  progressCard: {
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  tierEmoji: { fontSize: 18 },
  tierName: { fontFamily: "Inter_700Bold", fontSize: 15 },
  inviteCount: { alignItems: "flex-end" },
  inviteNum: { fontFamily: "Inter_700Bold", fontSize: 28 },
  inviteLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  progressBarWrap: { gap: 6 },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  nextTierCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  nextTierEmoji: { fontSize: 24 },
  nextTierLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 2 },
  nextTierReward: { fontFamily: "Inter_400Regular", fontSize: 11 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginTop: 4 },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  tierIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tierTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  tierRowName: { fontFamily: "Inter_700Bold", fontSize: 14 },
  tierRange: { fontFamily: "Inter_400Regular", fontSize: 11 },
  tierRowReward: { fontFamily: "Inter_400Regular", fontSize: 12 },
  checkBadge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  inviteAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  inviteInitials: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" },
  inviteName: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 2 },
  inviteTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  inviteStatus: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  howCard: {
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  howRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  howStep: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  howStepText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#FFFFFF" },
  howText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 20 },
});
