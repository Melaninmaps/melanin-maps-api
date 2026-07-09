import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
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

export default function PendingApprovalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, user } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSignOut = async () => {
    await logout();
    router.replace("/login");
  };

  const c = colors;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: topPad + 40, paddingBottom: bottomPad + 40, backgroundColor: c.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <Image source={require("@/assets/images/logo.png")} style={styles.logo} contentFit="contain" />

        <View style={[styles.iconWrap, { backgroundColor: "#FEF3C7" }]}>
          <Feather name="clock" size={40} color="#D97706" />
        </View>

        <Text style={[styles.title, { color: c.foreground }]}>You're on the list</Text>
        <Text style={[styles.sub, { color: c.mutedForeground }]}>
          {user?.firstName ? `Hi ${user.firstName}! ` : ""}
          Your account is pending approval. Our team reviews new members to keep the community safe and authentic.
        </Text>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.row}>
            <Feather name="mail" size={18} color={c.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: c.foreground }]}>Check your email</Text>
              <Text style={[styles.cardSub, { color: c.mutedForeground }]}>
                We'll notify you at {user?.email ?? "your email address"} as soon as you're approved.
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <View style={styles.row}>
            <Feather name="users" size={18} color={c.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: c.foreground }]}>Usually within 24 hours</Text>
              <Text style={[styles.cardSub, { color: c.mutedForeground }]}>
                Most accounts are reviewed and approved within one business day.
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: c.border }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={16} color={c.mutedForeground} />
          <Text style={[styles.signOutTxt, { color: c.mutedForeground }]}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  content: { flex: 1, alignItems: "center", paddingHorizontal: 28, gap: 20 },
  logo: { width: 72, height: 72 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24 },
  card: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 18, gap: 16 },
  row: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  cardSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  divider: { height: 1 },
  signOutBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  signOutTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
