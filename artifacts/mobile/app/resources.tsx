import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
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
type Colors = ReturnType<typeof useColors>;

type FeatherName = React.ComponentProps<typeof Feather>["name"];

interface Resource {
  name: string;
  desc: string;
  action: string;
  url: string;
  icon: FeatherName;
  color: string;
}

const CRISIS: Resource[] = [
  { name: "988 Suicide & Crisis Lifeline", desc: "Free, confidential support. Call or text anytime, 24/7.", action: "Call or Text 988", url: "tel:988", icon: "phone-call", color: "#DC2626" },
  { name: "Crisis Text Line", desc: "Text HOME to 741741 — free, confidential, 24/7.", action: "Text HOME to 741741", url: "sms:741741", icon: "message-circle", color: "#DC2626" },
  { name: "SAMHSA National Helpline", desc: "Free substance use & mental health referrals, 24/7.", action: "Call 1-800-662-4357", url: "tel:18006624357", icon: "heart", color: "#B91C1C" },
  { name: "Domestic Violence Hotline", desc: "Free, confidential support for survivors, 24/7.", action: "Call 1-800-799-7233", url: "tel:18007997233", icon: "shield", color: "#B91C1C" },
];

const MENTAL_HEALTH: Resource[] = [
  { name: "Black Mental Health Alliance", desc: "Mental health resources and therapist directory for Black communities.", action: "Visit Site", url: "https://blackmentalhealth.com", icon: "users", color: "#7B2D8B" },
  { name: "Therapy for Black Girls", desc: "Connecting Black women and girls to quality mental health care.", action: "Visit Site", url: "https://therapyforblackgirls.com", icon: "heart", color: "#7B2D8B" },
  { name: "Therapy for Black Men", desc: "Helping Black men find therapists and mental health support.", action: "Visit Site", url: "https://therapyforblackmen.org", icon: "user", color: "#4C1D95" },
  { name: "Boris Lawrence Henson Foundation", desc: "Mental health awareness and support for the African American community.", action: "Visit Site", url: "https://borislhensonfoundation.org", icon: "star", color: "#4C1D95" },
  { name: "Loveland Foundation", desc: "Therapy vouchers and financial assistance for Black women and girls.", action: "Visit Site", url: "https://thelovelandfoundation.org", icon: "gift", color: "#7B2D8B" },
  { name: "Melanin & Mental Health", desc: "Therapist directory and community for people of color.", action: "Visit Site", url: "https://melaninandmentalhealth.com", icon: "sun", color: "#7B2D8B" },
];

const RECOVERY: Resource[] = [
  { name: "AA Meeting Finder", desc: "Find Alcoholics Anonymous meetings near you, nationwide.", action: "Find Meetings", url: "https://www.aa.org/find-aa", icon: "map-pin", color: "#1D4ED8" },
  { name: "NA Meeting Search", desc: "Find Narcotics Anonymous meetings in your area.", action: "Find Meetings", url: "https://www.na.org/meetingsearch/", icon: "map-pin", color: "#1D4ED8" },
  { name: "Meeting Guide", desc: "150,000+ AA meetings worldwide — app and web search.", action: "Visit Site", url: "https://meetingguide.org", icon: "smartphone", color: "#1E40AF" },
  { name: "SMART Recovery", desc: "Science-based meetings and tools for any addiction.", action: "Find Meetings", url: "https://www.smartrecovery.org/community/calendar.php", icon: "compass", color: "#2D7A4F" },
  { name: "In The Rooms", desc: "Online recovery meetings — AA, NA, and more.", action: "Visit Site", url: "https://www.intherooms.com", icon: "monitor", color: "#1D4ED8" },
];

const TREATMENT: Resource[] = [
  { name: "SAMHSA Treatment Locator", desc: "Find substance use & mental health facilities near you.", action: "Find Treatment", url: "https://findtreatment.gov", icon: "search", color: "#CA922B" },
  { name: "Open Path Collective", desc: "Affordable therapy ($30–$80/session) with licensed therapists.", action: "Find a Therapist", url: "https://openpathcollective.org", icon: "dollar-sign", color: "#C9922B" },
  { name: "Psychology Today", desc: "Filter therapists by specialty, insurance, race/ethnicity.", action: "Find a Therapist", url: "https://www.psychologytoday.com/us/therapists", icon: "user-check", color: "#2B1507" },
  { name: "Inclusive Therapists", desc: "Culturally-responsive therapists for BIPOC communities.", action: "Visit Site", url: "https://www.inclusivetherapists.com", icon: "users", color: "#2D7A4F" },
];

const SECTIONS = [
  { title: "Crisis & Emergency", subtitle: "Immediate help — available 24/7", icon: "alert-circle" as FeatherName, accent: "#DC2626", data: CRISIS },
  { title: "Black Mental Health", subtitle: "Resources built for our community", icon: "heart" as FeatherName, accent: "#7B2D8B", data: MENTAL_HEALTH },
  { title: "NA & AA Meetings", subtitle: "Recovery meetings near you", icon: "map-pin" as FeatherName, accent: "#1D4ED8", data: RECOVERY },
  { title: "Find Treatment", subtitle: "Therapists, counselors & treatment centers", icon: "search" as FeatherName, accent: "#CA922B", data: TREATMENT },
];

function ResourceCard({ resource, colors }: { resource: Resource; colors: Colors }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.cardIcon, { backgroundColor: resource.color + "18" }]}>
        <Feather name={resource.icon} size={20} color={resource.color} />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: colors.foreground }]}>{resource.name}</Text>
        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{resource.desc}</Text>
        <TouchableOpacity
          style={[styles.cardBtn, { backgroundColor: resource.color + "15", borderColor: resource.color + "40" }]}
          onPress={() => Linking.openURL(resource.url).catch(() => {})}
          activeOpacity={0.75}
        >
          <Feather name={resource.url.startsWith("tel:") || resource.url.startsWith("sms:") ? "phone" : "external-link"} size={12} color={resource.color} />
          <Text style={[styles.cardBtnText, { color: resource.color }]}>{resource.action}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ResourcesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Resources</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroBanner, { backgroundColor: "#2B1507" }]}>
          <Feather name="heart" size={32} color="rgba(255,255,255,0.9)" />
          <Text style={styles.heroTitle}>You&apos;re Not Alone</Text>
          <Text style={styles.heroSub}>
            Help is always available. Whether you&apos;re in crisis, looking for a therapist, or searching for a recovery meeting — these resources are here for you.
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: section.accent + "18" }]}>
                <Feather name={section.icon} size={18} color={section.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>{section.subtitle}</Text>
              </View>
            </View>
            {section.data.map((r) => (
              <ResourceCard key={r.name} resource={r} colors={colors} />
            ))}
          </View>
        ))}

        <View style={[styles.footerNote, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="info" size={16} color={colors.mutedForeground} />
          <Text style={[styles.footerNoteText, { color: colors.mutedForeground }]}>
            If you know a resource that should be here, email us at{" "}
            <Text style={{ color: colors.primary }} onPress={() => Linking.openURL("mailto:hello@mappingwithmelanin.com").catch(() => {})}>
              hello@mappingwithmelanin.com
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  scroll: { padding: 16, gap: 8 },
  heroBanner: { borderRadius: 20, padding: 24, alignItems: "center", gap: 12, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFF", textAlign: "center" },
  heroSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.82)", textAlign: "center", lineHeight: 22 },
  section: { gap: 10, marginTop: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  sectionIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", gap: 12 },
  cardIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardBody: { flex: 1, gap: 6 },
  cardName: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  cardDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  cardBtn: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  cardBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  footerNote: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "flex-start", marginTop: 8 },
  footerNoteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
