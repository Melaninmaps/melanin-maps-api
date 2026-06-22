import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const SECTIONS = [
  {
    id: "acceptance",
    icon: "check-circle" as const,
    color: "#2D7A4F",
    title: "Acceptance of Terms",
    clauses: [
      { heading: "Agreement to Terms", body: "By creating an account or using Mapping With Melanin™ (\"the Platform\"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform." },
      { heading: "Eligibility", body: "You must be at least 13 years of age to use the Platform. Users under 18 must have parental or guardian consent. By using the Platform, you represent that you meet these requirements." },
      { heading: "Updates", body: "We may update these Terms at any time. We will notify you of material changes via in-app notification or email. Continued use after notice constitutes acceptance of the updated Terms." },
    ],
  },
  {
    id: "about",
    icon: "map" as const,
    color: "#3B1F0E",
    title: "About the Platform",
    clauses: [
      { heading: "What We Provide", body: "Mapping with Melanin™ connects people to trusted businesses, meaningful relationships, thriving communities, and new opportunities through the power of shared experiences and community-driven insights." },
      { heading: "No Guarantee of Accuracy", body: "Business listings, safety ratings, and community-generated content are provided by users. We do not independently verify all information. Always use your own judgment when making decisions based on platform data." },
      { heading: "Service Availability", body: "We aim to maintain continuous availability but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue the Platform at any time with reasonable notice." },
    ],
  },
  {
    id: "content",
    icon: "edit-3" as const,
    color: "#C9922B",
    title: "User Content",
    clauses: [
      { heading: "Your Content", body: "You retain ownership of reviews, photos, posts, and other content you submit (\"User Content\"). By submitting User Content, you grant us a non-exclusive, royalty-free, worldwide license to display, distribute, and use it to operate the Platform." },
      { heading: "Content Standards", body: "User Content must comply with our Community Guidelines and Community Standards. Content that is false, harmful, harassing, or discriminatory will be removed and may result in account termination." },
      { heading: "Safety Reports", body: "Safety survey data is aggregated and anonymized before display. Individual safety submissions are never publicly attributed to a specific user. By submitting safety data, you affirm it is accurate to the best of your knowledge." },
    ],
  },
  {
    id: "businesses",
    icon: "briefcase" as const,
    color: "#2D7A4F",
    title: "Business Listings",
    clauses: [
      { heading: "Listing Your Business", body: "Businesses listed on the Platform must genuinely be Black-owned or substantially Black-led. Submitting false ownership information is a serious violation and may result in removal and legal action." },
      { heading: "Verification Badges", body: "\"Verified\" badges are granted after document review by our team. \"Self-Identified\" indicates the business owner has attested to ownership without third-party verification. Confidence scores reflect aggregated community signals." },
      { heading: "Business Owner Rights", body: "Verified business owners may respond to reviews and update business information. Owners may not request removal of negative reviews unless the review violates our Community Standards." },
    ],
  },
  {
    id: "payments",
    icon: "credit-card" as const,
    color: "#3B1F0E",
    title: "Membership & Payments",
    clauses: [
      { heading: "Membership Plans", body: "The Platform offers free and paid membership tiers. Paid memberships are billed on a recurring basis (monthly or annually) as selected at signup. All payments are processed securely via Stripe." },
      { heading: "Cancellation", body: "You may cancel your paid membership at any time through Settings. Cancellation takes effect at the end of the current billing period. We do not provide pro-rated refunds for partial billing periods." },
      { heading: "Refunds", body: "We offer refunds within 7 days of initial purchase if the Platform does not function as described. Refund requests must be submitted via our contact form. Subsequent renewals are non-refundable except where required by applicable law." },
    ],
  },
  {
    id: "prohibited",
    icon: "slash" as const,
    color: "#DC2626",
    title: "Prohibited Conduct",
    clauses: [
      { heading: "You May Not", body: "Use the Platform to harass, threaten, or discriminate against any person; submit false business listings or fabricated reviews; scrape, copy, or redistribute Platform data without written permission; impersonate another user, business, or Mapping With Melanin™ staff." },
      { heading: "Automated Access", body: "You may not use bots, scrapers, or automated tools to access or interact with the Platform without express written consent from Mapping With Melanin™." },
      { heading: "Consequences", body: "Violations of these prohibitions may result in content removal, account suspension, permanent ban, and/or legal action. We reserve the right to determine what constitutes a violation." },
    ],
  },
  {
    id: "liability",
    icon: "alert-triangle" as const,
    color: "#C9922B",
    title: "Disclaimers & Liability",
    clauses: [
      { heading: "Disclaimer of Warranties", body: "The Platform is provided \"as is\" without warranties of any kind, express or implied. We make no warranty that the Platform will be error-free, uninterrupted, or that safety information will prevent harm." },
      { heading: "Safety Disclaimer", body: "Safety ratings and community reports are informational only. Mapping With Melanin™ is not responsible for incidents that occur at listed businesses or locations. Always trust your own instincts and exercise independent judgment." },
      { heading: "Limitation of Liability", body: "To the maximum extent permitted by law, Mapping With Melanin™ shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, even if advised of the possibility of such damages." },
    ],
  },
  {
    id: "legal",
    icon: "file-text" as const,
    color: "#3B1F0E",
    title: "Governing Law & Disputes",
    clauses: [
      { heading: "Governing Law", body: "These Terms are governed by and construed in accordance with the laws of the United States and the state in which Mapping With Melanin™ is incorporated, without regard to conflict of law provisions." },
      { heading: "Dispute Resolution", body: "You agree to resolve any disputes with Mapping With Melanin™ through good-faith negotiation before pursuing formal legal action. If negotiation fails, disputes shall be resolved through binding arbitration." },
      { heading: "Severability", body: "If any provision of these Terms is found invalid or unenforceable, that provision will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions remain in full effect." },
    ],
  },
];

export default function TermsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/settings")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={[styles.introIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="file-text" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.introTitle, { color: colors.foreground }]}>Terms of Service</Text>
          <Text style={[styles.introBody, { color: colors.mutedForeground }]}>
            Please read these terms carefully before using Mapping With Melanin™. They govern your access to and use of the Platform.
          </Text>
          <Text style={[styles.introUpdate, { color: colors.mutedForeground }]}>Last updated: June 2026</Text>
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
              {sec.clauses.map((clause) => (
                <View key={clause.heading} style={[styles.clauseBlock, { borderLeftColor: sec.color + "55" }]}>
                  <Text style={[styles.clauseHeading, { color: sec.color }]}>{clause.heading}</Text>
                  <Text style={[styles.clauseBody, { color: colors.foreground }]}>{clause.body}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={[styles.contactCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="mail" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactTitle, { color: colors.foreground }]}>Questions About These Terms?</Text>
            <Text style={[styles.contactBody, { color: colors.mutedForeground }]}>
              Email us at legal@mappingwithmelanin.com or use the Contact Us screen in Settings.
            </Text>
          </View>
        </View>

        <Text style={[styles.attorney, { color: colors.mutedForeground }]}>
          This document was drafted for informational purposes. It should be reviewed by a licensed attorney before public distribution.
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
  intro: { alignItems: "center", gap: 10, paddingBottom: 8 },
  introIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  introTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  introBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  introUpdate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  clauseBlock: { borderLeftWidth: 3, paddingLeft: 12, gap: 4 },
  clauseHeading: { fontSize: 13, fontFamily: "Inter_700Bold" },
  clauseBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  contactCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  contactTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  contactBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  attorney: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 17, paddingHorizontal: 8 },
});
