import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMembership } from "@/hooks/useMembership";

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function StatusBadge({ status, colors }: { status: string; colors: ReturnType<typeof useColors> }) {
  const isActive = status === "active" || status === "trialing";
  const label = status === "trialing" ? "Free Trial" : status.charAt(0).toUpperCase() + status.slice(1);
  const bg = isActive ? "#2D7A4F18" : colors.secondary;
  const color = isActive ? "#2D7A4F" : colors.mutedForeground;
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

export default function BillingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { subscription, products, openPortal } = useMembership();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const activeProduct = subscription?.productName
    ? products.find((p) => p.name === subscription.productName)
    : null;

  const activePrice = activeProduct?.prices?.[0] ?? null;

  const handleManage = async () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (Platform.OS === "ios") {
      await Linking.openURL("https://apps.apple.com/account/subscriptions");
    } else {
      await openPortal();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85}
          style={styles.back}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Billing & Invoices</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {subscription ? (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardRow}>
                <View style={[styles.planIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name="award" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, { color: colors.foreground }]}>
                    {subscription.productName ?? "Membership"}
                  </Text>
                  {activePrice && (
                    <Text style={[styles.planPrice, { color: colors.mutedForeground }]}>
                      {formatAmount(activePrice.unitAmount, activePrice.currency)}
                      {activePrice.recurring ? `/${activePrice.recurring.interval}` : ""}
                    </Text>
                  )}
                </View>
                <StatusBadge status={subscription.status} colors={colors} />
              </View>

              {subscription.status === "trialing" && (
                <View style={[styles.trialBanner, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "20" }]}>
                  <Feather name="clock" size={14} color={colors.primary} />
                  <Text style={[styles.trialText, { color: colors.primary }]}>
                    You are on a free trial. Your card will not be charged until it ends.
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.manageBtn, { backgroundColor: colors.primary }]}
              onPress={handleManage}
              activeOpacity={0.85}
            >
              <Feather name="external-link" size={16} color="#FFFFFF" />
              <Text style={styles.manageBtnText}>
                {Platform.OS === "ios" ? "Manage Apple Subscription" : "Manage Subscription & Invoices"}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.portalNote, { color: colors.mutedForeground }]}>
              {Platform.OS === "ios"
                ? "Manage your subscription, update payment methods, and cancel in iOS Settings → Apple ID → Subscriptions."
                : "Opens the customer portal where you can view invoices, update payment methods, and cancel your subscription."}
            </Text>
          </>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="credit-card" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Active Subscription</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              You are currently on the free Explorer plan. Upgrade to unlock KinfolkAI™, advanced analytics, and more.
            </Text>
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/membership")}
              activeOpacity={0.85}
            >
              <Feather name="arrow-up-circle" size={16} color="#FFFFFF" />
              <Text style={styles.upgradeBtnText}>View Membership Plans</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.infoSection, { borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.mutedForeground }]}>BILLING SUPPORT</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              {
                id: "email",
                icon: "mail" as const,
                label: "Email Support",
                sub: "hello@mappingwithmelanin.com",
                onPress: () => Linking.openURL("mailto:hello@mappingwithmelanin.com?subject=Billing%20Support%20%E2%80%94%20Mapping%20with%20Melanin"),
              },
              {
                id: "contact",
                icon: "message-circle" as const,
                label: "Contact Us",
                sub: "Questions about your account",
                onPress: () => router.push("/contact"),
              },
            ].map((item, idx, arr) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity style={styles.infoRow} onPress={item.onPress} activeOpacity={0.7}>
                  <View style={[styles.infoRowIcon, { backgroundColor: colors.secondary }]}>
                    <Feather name={item.icon} size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoRowLabel, { color: colors.foreground }]}>{item.label}</Text>
                    <Text style={[styles.infoRowSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.border} />
                </TouchableOpacity>
                {idx < arr.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {Platform.OS !== "ios" && (
          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            Payments are processed securely. Mapping With Melanin™ does not store your card information.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  planName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  planPrice: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  trialBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  trialText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  manageBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  portalNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  upgradeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  infoSection: { gap: 8 },
  infoTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  infoCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  infoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  infoRowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  infoRowLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  infoRowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  sep: { height: 1, marginLeft: 60 },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    textAlign: "center",
    paddingHorizontal: 12,
    marginTop: 8,
  },
});
