import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
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

const PERKS = [
  { icon: "map-pin" as const, text: "Find Minority-owned businesses across 48 states" },
  { icon: "shield" as const, text: "Access community safety intelligence" },
  { icon: "users" as const, text: "Connect with 10,000+ community members" },
  { icon: "star" as const, text: "Discover verified, authenticity-checked spots" },
];

export default function PendingApprovalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const pulse = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const firstName = user?.firstName ?? "there";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#3A1F0E", "#1C0E06"]}
        style={[styles.topGrad, { paddingTop: insets.top + 20 }]}
      >
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulse }] }]}>
          <View style={styles.iconCircle}>
            <Feather name="clock" size={36} color="#C9922B" />
          </View>
        </Animated.View>
        <Text style={styles.eyebrow}>ACCESS PENDING</Text>
        <Text style={styles.title}>Almost There, {firstName}!</Text>
        <Text style={styles.sub}>
          Your account is in our review queue. We personally approve each member to keep the community trusted and curated.
        </Text>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Feather name="mail" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>What happens next?</Text>
          </View>
          <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
            Our team reviews every account — usually within 24–48 hours. You'll receive an email at{" "}
            <Text style={[styles.emailHighlight, { color: colors.primary }]}>
              {user?.email ?? "your email"}
            </Text>
            {" "}the moment you're approved.
          </Text>
        </View>

        <Text style={[styles.perksTitle, { color: colors.foreground }]}>
          What's waiting for you inside
        </Text>

        {PERKS.map((perk) => (
          <View
            key={perk.text}
            style={[styles.perkRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.perkIcon, { backgroundColor: colors.primary + "18" }]}>
              <Feather name={perk.icon} size={16} color={colors.primary} />
            </View>
            <Text style={[styles.perkText, { color: colors.foreground }]}>{perk.text}</Text>
          </View>
        ))}

        <View style={[styles.quoteCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
          <Text style={[styles.quoteText, { color: colors.foreground }]}>
            "Because the best journeys are shared — and every community starts with trust."
          </Text>
          <Text style={[styles.quoteSig, { color: colors.primary }]}>— Mapping With Melanin™</Text>
        </View>

        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: colors.border }]}
          onPress={async () => {
            await logout();
            router.replace("/(tabs)");
          }}
          activeOpacity={0.75}
        >
          <Feather name="log-out" size={15} color={colors.mutedForeground} />
          <Text style={[styles.signOutText, { color: colors.mutedForeground }]}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGrad: {
    paddingHorizontal: 28,
    paddingBottom: 36,
    alignItems: "center",
    gap: 10,
  },
  iconWrap: { marginBottom: 4 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(201,146,43,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "rgba(201,146,43,0.9)",
    letterSpacing: 1.8,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
    color: "#FAF1E4",
    textAlign: "center",
    lineHeight: 36,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    lineHeight: 22,
  },
  body: {
    padding: 20,
    gap: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  cardText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
  },
  emailHighlight: {
    fontFamily: "Inter_600SemiBold",
  },
  perksTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    marginTop: 4,
    marginBottom: -2,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  perkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  perkText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  quoteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 8,
    marginTop: 4,
  },
  quoteText: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 15,
    lineHeight: 24,
    fontStyle: "italic",
  },
  quoteSig: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  signOutText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
