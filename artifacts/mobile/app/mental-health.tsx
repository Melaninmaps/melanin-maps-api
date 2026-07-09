import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

type Resource = {
  id: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
  label: string;
  subtitle: string;
  description: string;
  actions: { label: string; type: "call" | "text" | "chat" | "link"; value: string }[];
};

const CRISIS_RESOURCES: Resource[] = [
  {
    id: "988",
    icon: "phone",
    color: "#DC2626",
    label: "988 Suicide & Crisis Lifeline",
    subtitle: "Call or text 988 — 24/7, free, confidential",
    description:
      "If you or someone you know is struggling or in crisis, help is available. Speak with a trained counselor in English or Spanish, anytime.",
    actions: [
      { label: "Call 988", type: "call", value: "tel:988" },
      { label: "Text 988", type: "text", value: "sms:988" },
      { label: "Chat Online", type: "link", value: "https://988lifeline.org/chat" },
    ],
  },
  {
    id: "crisis-text",
    icon: "message-square",
    color: "#7C3AED",
    label: "Crisis Text Line",
    subtitle: "Text HOME to 741741 — 24/7",
    description:
      "Free, confidential crisis counseling via text. Connect with a trained Crisis Counselor who can provide information and support.",
    actions: [
      { label: "Text HOME to 741741", type: "text", value: "sms:741741&body=HOME" },
    ],
  },
  {
    id: "nami",
    icon: "heart",
    color: "#0891B2",
    label: "NAMI Helpline",
    subtitle: "1-800-950-NAMI (6264) — Mon–Fri, 10am–10pm ET",
    description:
      "The National Alliance on Mental Illness offers peer support, information, and referrals to local services for individuals and families.",
    actions: [
      { label: "Call NAMI", type: "call", value: "tel:18009506264" },
      { label: "Text NAMI to 741741", type: "text", value: "sms:741741&body=NAMI" },
    ],
  },
  {
    id: "samhsa",
    icon: "activity",
    color: "#059669",
    label: "SAMHSA National Helpline",
    subtitle: "1-800-662-4357 — 24/7, free, confidential",
    description:
      "Treatment referral and information for individuals and families facing mental and/or substance use disorders. Available in English and Spanish.",
    actions: [
      { label: "Call SAMHSA", type: "call", value: "tel:18006624357" },
      { label: "Find Treatment", type: "link", value: "https://findtreatment.gov" },
    ],
  },
  {
    id: "trevor",
    icon: "star",
    color: "#CA922B",
    label: "The Trevor Project",
    subtitle: "1-866-488-7386 — 24/7 for LGBTQ+ youth",
    description:
      "Crisis intervention and suicide prevention services for LGBTQ+ young people under 25. Confidential and affirming.",
    actions: [
      { label: "Call TrevorLifeline", type: "call", value: "tel:18664887386" },
      { label: "Text START to 678-678", type: "text", value: "sms:678678&body=START" },
      { label: "TrevorChat", type: "link", value: "https://www.thetrevorproject.org/get-help" },
    ],
  },
  {
    id: "veterans",
    icon: "shield",
    color: "#1D4ED8",
    label: "Veterans Crisis Line",
    subtitle: "Dial 988 then press 1 — 24/7",
    description:
      "Connects veterans in crisis and their families and friends with qualified, caring responders through a confidential toll-free hotline.",
    actions: [
      { label: "Call 988, Press 1", type: "call", value: "tel:988" },
      { label: "Text 838255", type: "text", value: "sms:838255" },
      { label: "Chat Online", type: "link", value: "https://www.veteranscrisisline.net/get-help-now/chat" },
    ],
  },
  {
    id: "domestic",
    icon: "home",
    color: "#B91C1C",
    label: "Domestic Violence Hotline",
    subtitle: "1-800-799-7233 — 24/7",
    description:
      "Highly trained advocates are available 24/7 to talk confidentially with anyone experiencing domestic violence, seeking resources, or questioning unhealthy aspects of their relationship.",
    actions: [
      { label: "Call 1-800-799-7233", type: "call", value: "tel:18007997233" },
      { label: "Text START to 88788", type: "text", value: "sms:88788&body=START" },
      { label: "Chat Online", type: "link", value: "https://www.thehotline.org" },
    ],
  },
  {
    id: "black-emotional",
    icon: "users",
    color: "#92400E",
    label: "Boris Lawrence Henson Foundation",
    subtitle: "Free mental health referrals for Black community",
    description:
      "Fights stigma surrounding mental health issues in the African American community. Provides free mental health therapy referrals with culturally competent therapists.",
    actions: [
      { label: "Get a Referral", type: "link", value: "https://borislhensonfoundation.org/find-a-therapist" },
    ],
  },
  {
    id: "loveland",
    icon: "sun",
    color: "#D97706",
    label: "Loveland Foundation",
    subtitle: "Free therapy for Black women and girls",
    description:
      "Provides opportunity, mental wellness, and healing to communities of color through fellowships, residencies, listen line sessions, and more.",
    actions: [
      { label: "Apply for Therapy", type: "link", value: "https://thelovelandfoundation.org/loveland-therapy-fund" },
    ],
  },
];

const SECTION_RESOURCES: Resource[] = [
  {
    id: "caregiver",
    icon: "users",
    color: "#4338CA",
    label: "Caregiver Action Network",
    subtitle: "1-855-227-3640",
    description:
      "Support for family caregivers. Provides education, peer support, and resources.",
    actions: [
      { label: "Call CAN", type: "call", value: "tel:18552273640" },
      { label: "Learn More", type: "link", value: "https://www.caregiveraction.org" },
    ],
  },
  {
    id: "childhelp",
    icon: "star",
    color: "#DC2626",
    label: "Childhelp National Abuse Hotline",
    subtitle: "1-800-422-4453 — 24/7",
    description:
      "Crisis intervention, information, and referrals for child abuse. Serves all US states and territories.",
    actions: [
      { label: "Call Childhelp", type: "call", value: "tel:18004224453" },
    ],
  },
];

async function openLink(type: "call" | "text" | "chat" | "link", value: string) {
  const url = type === "text" && !value.startsWith("sms:") ? `sms:${value}` : value;
  const can = await Linking.canOpenURL(url);
  if (can) {
    await Linking.openURL(url);
  } else {
    Alert.alert("Unable to open", "Please copy the number and dial or text manually.");
  }
}

function ResourceCard({ resource }: { resource: Resource }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.selectionAsync();
          setExpanded((v) => !v);
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.cardIcon, { backgroundColor: resource.color + "18" }]}>
          <Feather name={resource.icon} size={22} color={resource.color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.cardLabel, { color: colors.foreground }]}>{resource.label}</Text>
          <Text style={[styles.cardSub, { color: resource.color }]}>{resource.subtitle}</Text>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{resource.description}</Text>
          <View style={styles.actionRow}>
            {resource.actions.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={[styles.actionBtn, { backgroundColor: resource.color }]}
                onPress={() => void openLink(a.type, a.value)}
                activeOpacity={0.85}
              >
                <Feather
                  name={a.type === "call" ? "phone" : a.type === "text" ? "message-square" : "external-link"}
                  size={13}
                  color="#fff"
                />
                <Text style={styles.actionBtnText}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function MentalHealthScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Mental Health Resources</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Confidential help, anytime
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        {/* Emergency Banner */}
        <TouchableOpacity
          style={styles.emergencyBanner}
          onPress={() => void openLink("call", "tel:911")}
          activeOpacity={0.9}
        >
          <View style={styles.emergencyLeft}>
            <Feather name="alert-triangle" size={22} color="#fff" />
            <View>
              <Text style={styles.emergencyTitle}>Life-Threatening Emergency?</Text>
              <Text style={styles.emergencySub}>Call 911 immediately</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color="#fff" />
        </TouchableOpacity>

        {/* 988 Quick-dial */}
        <View style={[styles.quickCard, { backgroundColor: "#DC262614", borderColor: "#DC262630" }]}>
          <View>
            <Text style={[styles.quickTitle, { color: colors.foreground }]}>Suicide & Crisis Lifeline</Text>
            <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>Free · Confidential · 24/7</Text>
          </View>
          <View style={styles.quickBtns}>
            <TouchableOpacity style={[styles.quickBtn, { backgroundColor: "#DC2626" }]} onPress={() => void openLink("call", "tel:988")} activeOpacity={0.85}>
              <Feather name="phone" size={15} color="#fff" />
              <Text style={styles.quickBtnText}>Call 988</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, { backgroundColor: "#7C3AED" }]} onPress={() => void openLink("text", "sms:988")} activeOpacity={0.85}>
              <Feather name="message-square" size={15} color="#fff" />
              <Text style={styles.quickBtnText}>Text 988</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main resources */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Crisis Resources</Text>
          {CRISIS_RESOURCES.map((r) => <ResourceCard key={r.id} resource={r} />)}
        </View>

        {/* Additional */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Additional Support</Text>
          {SECTION_RESOURCES.map((r) => <ResourceCard key={r.id} resource={r} />)}
        </View>

        {/* Recovery meetings link */}
        <TouchableOpacity
          style={[styles.meetingBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/na-aa-meetings" as Parameters<typeof router.push>[0])}
          activeOpacity={0.85}
        >
          <View style={[styles.meetingIcon, { backgroundColor: "#CA922B18" }]}>
            <Feather name="map-pin" size={22} color="#CA922B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.meetingTitle, { color: colors.foreground }]}>Find NA/AA Meetings Near You</Text>
            <Text style={[styles.meetingSub, { color: colors.mutedForeground }]}>
              Search for Narcotics Anonymous, Alcoholics Anonymous, Al-Anon, and SMART Recovery meetings in your area.
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={[styles.note, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={15} color={colors.mutedForeground} />
          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
            These resources are provided for informational purposes. Mapping With Melanin is not a crisis service.
            If you are in immediate danger, call 911.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 1 },
  scroll: { padding: 20, gap: 20 },
  emergencyBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#DC2626", borderRadius: 16, padding: 18, gap: 12 },
  emergencyLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  emergencyTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  emergencySub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#fff", opacity: 0.85, marginTop: 2 },
  quickCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, flexWrap: "wrap" },
  quickTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  quickSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  quickBtns: { flexDirection: "row", gap: 8 },
  quickBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  quickBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  section: { gap: 10 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  cardIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardLabel: { fontFamily: "Inter_700Bold", fontSize: 14 },
  cardSub: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginTop: 1 },
  cardBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  cardDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  actionBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff" },
  meetingBanner: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, borderWidth: 1, padding: 16 },
  meetingIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  meetingTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  meetingSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 3 },
  note: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  noteText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, flex: 1 },
});
