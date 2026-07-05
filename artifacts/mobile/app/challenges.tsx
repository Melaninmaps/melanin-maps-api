import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import { BusinessChallengeApplyModal } from "@/components/BusinessChallengeApplyModal";

type Challenge = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  endsIn: string;
  participants: number;
  points: number;
  color: string;
  badge: string;
  tasks: string[];
  joined: boolean;
};

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: "restaurant-week",
    emoji: "🍽️",
    title: "Restaurant Week",
    description: "Dine at 3 minority-owned restaurants this week. Leave a review at each. Earn double points on every check-in.",
    endsIn: "5 days",
    participants: 1240,
    points: 300,
    color: "#C9922B",
    badge: "🏆 Restaurant Champion",
    tasks: ["Check in at 3 restaurants", "Leave a review at each", "Share one experience"],
    joined: false,
  },
  {
    id: "black-business-month",
    emoji: "🤎",
    title: "Black Business Month",
    description: "August is Black Business Month. Discover and support 5 new businesses across at least 2 categories.",
    endsIn: "18 days",
    participants: 3891,
    points: 500,
    color: "#CA922B",
    badge: "👑 Community Champion",
    tasks: ["Visit 5 new businesses", "Span 2+ categories", "Invite a friend"],
    joined: true,
  },
  {
    id: "support-local-saturday",
    emoji: "🏪",
    title: "Support Local Saturday",
    description: "Every Saturday this month: check in at a local minority-owned business. Earn a streak badge for 4 consecutive Saturdays.",
    endsIn: "26 days",
    participants: 892,
    points: 250,
    color: "#2D7A4F",
    badge: "🌟 Local Legend",
    tasks: ["Check in every Saturday", "4 consecutive weeks", "Share your favorites"],
    joined: false,
  },
  {
    id: "holiday-gift-guide",
    emoji: "🎁",
    title: "Holiday Gift Guide",
    description: "Build a community list of your top minority-owned gift picks. Lists with 5+ businesses earn a featured spot.",
    endsIn: "45 days",
    participants: 567,
    points: 200,
    color: "#DC2626",
    badge: "🎄 Gift Guide Creator",
    tasks: ["Create a community list", "Add 5+ businesses", "Share the list"],
    joined: false,
  },
];

export default function ChallengesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [challenges, setChallenges] = useState(MOCK_CHALLENGES);
  const [applyModal, setApplyModal] = useState<{ challengeId: string; challengeName: string } | null>(null);

  const handleJoin = (id: string) => {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, joined: !c.joined, participants: c.joined ? c.participants - 1 : c.participants + 1 } : c));
    const ch = challenges.find(c => c.id === id);
    if (ch && !ch.joined) {
      Alert.alert("You're in! 🎉", `You joined "${ch.title}". Complete the tasks to earn ${ch.points} points and the ${ch.badge} badge.`, [{ text: "Let's go!" }]);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/community" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Business Challenges</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroBanner, { backgroundColor: "#CA922B" }]}>
          <Text style={styles.heroEmoji}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Community Campaigns</Text>
            <Text style={styles.heroSub}>Join challenges, earn points, win badges — support local together</Text>
          </View>
        </View>

        {challenges.map((ch) => (
          <View key={ch.id} style={[styles.card, { backgroundColor: colors.card, borderColor: ch.joined ? ch.color : colors.border, borderWidth: ch.joined ? 2 : 1 }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.challengeIcon, { backgroundColor: ch.color + "20" }]}>
                <Text style={styles.challengeEmoji}>{ch.emoji}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.challengeTitle, { color: colors.foreground }]}>{ch.title}</Text>
                <View style={styles.metaRow}>
                  <View style={[styles.metaChip, { backgroundColor: ch.color + "18" }]}>
                    <Feather name="clock" size={10} color={ch.color} />
                    <Text style={[styles.metaChipTxt, { color: ch.color }]}>{ch.endsIn} left</Text>
                  </View>
                  <View style={[styles.metaChip, { backgroundColor: colors.secondary }]}>
                    <Feather name="users" size={10} color={colors.mutedForeground} />
                    <Text style={[styles.metaChipTxt, { color: colors.mutedForeground }]}>{ch.participants.toLocaleString()} joined</Text>
                  </View>
                </View>
              </View>
              {ch.joined && (
                <View style={[styles.joinedBadge, { backgroundColor: ch.color + "20" }]}>
                  <Feather name="check-circle" size={14} color={ch.color} />
                  <Text style={[styles.joinedTxt, { color: ch.color }]}>Joined</Text>
                </View>
              )}
            </View>

            <Text style={[styles.challengeDesc, { color: colors.mutedForeground }]}>{ch.description}</Text>

            <View style={[styles.tasksWrap, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.tasksTitle, { color: colors.foreground }]}>Tasks</Text>
              {ch.tasks.map((t, i) => (
                <View key={i} style={styles.taskRow}>
                  <View style={[styles.taskDot, { backgroundColor: ch.joined ? ch.color : colors.mutedForeground }]} />
                  <Text style={[styles.taskTxt, { color: colors.foreground }]}>{t}</Text>
                </View>
              ))}
            </View>

            <View style={styles.rewardsRow}>
              <View style={[styles.rewardChip, { backgroundColor: "#C9922B18" }]}>
                <Text style={styles.rewardEmoji}>⭐</Text>
                <Text style={[styles.rewardTxt, { color: "#C9922B" }]}>{ch.points} pts</Text>
              </View>
              <View style={[styles.rewardChip, { backgroundColor: colors.secondary }]}>
                <Text style={styles.rewardEmoji}>{ch.badge.split(" ")[0]}</Text>
                <Text style={[styles.rewardTxt, { color: colors.foreground }]}>{ch.badge.split(" ").slice(1).join(" ")}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: ch.joined ? colors.secondary : ch.color }]}
              onPress={() => handleJoin(ch.id)}
              activeOpacity={0.85}
            >
              <Text style={[styles.joinBtnTxt, { color: ch.joined ? colors.mutedForeground : "#FFF" }]}>
                {ch.joined ? "Leave Challenge" : "Join Challenge"}
              </Text>
              {!ch.joined && <Feather name="arrow-right" size={16} color="#FFF" />}
            </TouchableOpacity>

            {/* Business owner CTA */}
            <TouchableOpacity
              style={[styles.bizApplyBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={() => {
                if (!isAuthenticated) { router.push("/login" as never); return; }
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setApplyModal({ challengeId: ch.id, challengeName: ch.title });
              }}
              activeOpacity={0.8}
            >
              <Feather name="briefcase" size={13} color={colors.mutedForeground} />
              <Text style={[styles.bizApplyTxt, { color: colors.mutedForeground }]}>Own a business? Register it for this challenge</Text>
              <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: "#CA922B" }]}>
          <Text style={styles.infoEmoji}>💡</Text>
          <Text style={styles.infoTxt}>Business registrations are reviewed by the Mapping with Melanin™ team before approval. You'll be notified by email within 2–3 business days.</Text>
        </View>
      </ScrollView>

      {applyModal && (
        <BusinessChallengeApplyModal
          visible={!!applyModal}
          challengeId={applyModal.challengeId}
          challengeName={applyModal.challengeName}
          onClose={() => setApplyModal(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 38, height: 38, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  scroll: { padding: 16, gap: 14 },
  heroBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14 },
  heroEmoji: { fontSize: 30 },
  heroTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#FFF" },
  heroSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 2 },
  card: { borderRadius: 16, padding: 14, gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  challengeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  challengeEmoji: { fontSize: 22 },
  challengeTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  metaRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  metaChipTxt: { fontSize: 11, fontFamily: "Inter_500Medium" },
  joinedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  joinedTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  challengeDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  tasksWrap: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  tasksTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 2 },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  taskDot: { width: 6, height: 6, borderRadius: 3 },
  taskTxt: { fontSize: 13, fontFamily: "Inter_400Regular" },
  rewardsRow: { flexDirection: "row", gap: 8 },
  rewardChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  rewardEmoji: { fontSize: 15 },
  rewardTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  joinBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12 },
  joinBtnTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  bizApplyBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  bizApplyTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, padding: 14 },
  infoEmoji: { fontSize: 18, marginTop: 1 },
  infoTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", lineHeight: 18 },
});
