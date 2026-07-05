import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const SECTIONS = [
  {
    id: "collect",
    icon: "inbox" as const,
    color: "#2D7A4F",
    title: "What We Collect",
    items: [
      { label: "Account Information", body: "When you sign up, we collect your name, email address, and a hashed password. If you sign in via Google or Apple, we receive your name and email from those providers — we never store your Google or Apple password." },
      { label: "Profile Data", body: "Information you voluntarily add to your profile: photo, bio, city, and preferences. This data is optional and can be edited or deleted at any time." },
      { label: "Content You Create", body: "Reviews, safety survey responses, community posts, and event RSVPs you submit through the Platform. Safety surveys are stored anonymously — no individual response is ever publicly attributed to you." },
      { label: "Usage Data", body: "How you interact with the app: screens visited, searches performed, businesses viewed. This data helps us improve the Platform. You can opt out of analytics in Settings → Privacy & Safety." },
    ],
  },
  {
    id: "use",
    icon: "settings" as const,
    color: "#CA922B",
    title: "How We Use Your Data",
    items: [
      { label: "Providing the Service", body: "Your account data is used to authenticate you, personalize your experience, and save your preferences across sessions. We cannot operate the Platform without this data." },
      { label: "Community Safety", body: "Aggregated and anonymized safety survey data is used to calculate neighborhood safety scores and business-level safety ratings. Individual submissions are never publicly displayed." },
      { label: "Communications", body: "We may send you transactional emails (password resets, receipts, account updates) and — with your consent — community newsletters and product updates. You can manage email preferences in Settings." },
      { label: "Platform Improvement", body: "Aggregated usage data helps us identify popular features, fix bugs, and build new functionality. We do not use individual behavioral data for advertising or profiling." },
    ],
  },
  {
    id: "location",
    icon: "map-pin" as const,
    color: "#C9922B",
    title: "Location Data",
    items: [
      { label: "When We Access Location", body: "Location is accessed only when you use map-based features (\"Near Me\" searches, map view) and only when the app is in the foreground. We never access your location in the background." },
      { label: "What We Store", body: "We do not store your GPS coordinates. Location is used in real time to filter results and is discarded immediately after the request is fulfilled." },
      { label: "Your Control", body: "You can use the full Platform without enabling location services. You can revoke location permission at any time in your device settings. Only map-based features will be affected." },
    ],
  },
  {
    id: "sharing",
    icon: "share-2" as const,
    color: "#2D7A4F",
    title: "Sharing & Disclosure",
    items: [
      { label: "We Do Not Sell Your Data", body: "Mapping With Melanin™ does not sell, rent, or trade your personal information to third parties for marketing or advertising purposes, ever." },
      { label: "Service Providers", body: "We share limited data with trusted service providers who help us operate the Platform: Stripe (payment processing), Expo (push notifications), and our cloud database provider. These providers are contractually prohibited from using your data for any other purpose." },
      { label: "Legal Requirements", body: "We may disclose data if required by law, court order, or to protect the safety of our users or the public. We will notify you of such requests where legally permitted." },
      { label: "Business Transfers", body: "If Mapping With Melanin™ is acquired or merges with another company, your data may be transferred as part of that transaction. We will notify you before your data is subject to a different privacy policy." },
    ],
  },
  {
    id: "rights",
    icon: "user-check" as const,
    color: "#CA922B",
    title: "Your Rights",
    items: [
      { label: "Access & Correction", body: "You may view and edit your account information at any time through your Profile and Settings screens. If you believe data about you is inaccurate, contact us and we will correct it promptly." },
      { label: "Data Download", body: "You may request a copy of all data associated with your account by going to Settings → Privacy & Safety → Download My Data. We will provide your data in a portable format within 30 days." },
      { label: "Deletion", body: "You may request deletion of your account and all associated personal data at any time via Settings → Privacy & Safety → Delete Account. Aggregated, anonymized data (safety scores, statistics) is not deleted as it cannot be attributed to you." },
      { label: "Opt-Out", body: "You may opt out of analytics tracking, marketing emails, and personalized suggestions at any time in Settings → Privacy & Safety. Core service communications (receipts, security alerts) cannot be opted out of while you have an active account." },
    ],
  },
  {
    id: "retention",
    icon: "clock" as const,
    color: "#C9922B",
    title: "Data Retention",
    items: [
      { label: "Active Accounts", body: "We retain your data for as long as your account is active. You can delete your account at any time, which triggers deletion of your personal data within 30 days." },
      { label: "Inactive Accounts", body: "If your account has been inactive for 24 consecutive months, we will notify you by email and begin the process of archiving or deleting your account data." },
      { label: "Legal Obligations", body: "Some data may be retained longer if required by law (e.g., financial records related to Stripe transactions may be retained for up to 7 years for tax compliance)." },
    ],
  },
  {
    id: "security",
    icon: "lock" as const,
    color: "#2D7A4F",
    title: "Security",
    items: [
      { label: "How We Protect Your Data", body: "We use industry-standard encryption (TLS in transit, AES-256 at rest) to protect your data. Auth tokens are stored in your device's Secure Enclave (iOS) or Keystore (Android) — never in plain-text storage." },
      { label: "Breach Notification", body: "In the event of a data breach that affects your personal information, we will notify you within 72 hours of discovery and provide clear guidance on steps to protect yourself." },
      { label: "Your Responsibility", body: "Keep your password confidential and log out of shared devices. Contact us immediately at hello@mappingwithmelanin.com if you suspect unauthorized access to your account." },
    ],
  },
];

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/settings")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={[styles.introIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="shield" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.introTitle, { color: colors.foreground }]}>Privacy Policy</Text>
          <Text style={[styles.introBody, { color: colors.mutedForeground }]}>
            Your privacy matters to us. This policy explains exactly what data we collect, why we collect it, and how you control it.
          </Text>
          <Text style={[styles.introUpdate, { color: colors.mutedForeground }]}>Last updated: June 2026</Text>
        </View>

        <View style={[styles.tldrCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
          <Text style={[styles.tldrTitle, { color: colors.primary }]}>The Short Version</Text>
          <Text style={[styles.tldrBody, { color: colors.foreground }]}>
            We collect only what we need to run the app. We never sell your data. Safety surveys are always anonymous. You can delete your account — and all your data — at any time.
          </Text>
        </View>

        {SECTIONS.map((sec) => (
          <View key={sec.id} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBox, { backgroundColor: sec.color + "18" }]}>
                <Feather name={sec.icon} size={18} color={sec.color} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{sec.title}</Text>
            </View>
            <View style={{ gap: 14 }}>
              {sec.items.map((item) => (
                <View key={item.label} style={[styles.itemBlock, { borderLeftColor: sec.color + "55" }]}>
                  <Text style={[styles.itemLabel, { color: sec.color }]}>{item.label}</Text>
                  <Text style={[styles.itemBody, { color: colors.foreground }]}>{item.body}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={[styles.contactCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="mail" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactTitle, { color: colors.foreground }]}>Privacy Questions?</Text>
            <Text style={[styles.contactBody, { color: colors.mutedForeground }]}>
              Email hello@mappingwithmelanin.com or use the Contact Us screen in Settings. We aim to respond within 48 hours.
            </Text>
          </View>
        </View>

        <Text style={[styles.attorney, { color: colors.mutedForeground }]}>
          This policy was drafted for informational purposes and should be reviewed by a licensed attorney before public distribution.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  scroll: { padding: 20, gap: 16 },
  intro: { alignItems: "center", gap: 10, paddingBottom: 4 },
  introIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  introTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  introBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  introUpdate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  tldrCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 6 },
  tldrTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  tldrBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  itemBlock: { borderLeftWidth: 3, paddingLeft: 12, gap: 4 },
  itemLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  itemBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  contactCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  contactTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  contactBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  attorney: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 17, paddingHorizontal: 8 },
});
