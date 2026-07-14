import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

// ── Types ──────────────────────────────────────────────────────────────────────

type SourceTier = "official" | "verified_org" | "community_confirmed" | "community_shared";
type OppSourceTier = "community_shared" | "source_confirmed" | "organization_confirmed" | "mwm_reviewed";
type Category = "essential_support" | "education" | "jobs" | "business" | "housing" | "safety_rights";
type OppType = "job" | "housing" | "scholarship" | "grant" | "training" | "volunteer" | "other";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  subcategory: string | null;
  sourceTier: SourceTier;
  organization: string | null;
  url: string | null;
  phone: string | null;
  isNational: boolean;
  city: string | null;
  state: string | null;
  keywords: string[] | null;
}

interface Opportunity {
  id: string;
  type: OppType;
  title: string;
  organization: string | null;
  city: string | null;
  state: string | null;
  isRemote: boolean;
  payRange: string | null;
  scheduleType: string | null;
  rent: string | null;
  bedrooms: number | null;
  applicationLink: string | null;
  sourceTier: OppSourceTier;
  status: string;
  isSecondChance: boolean;
  description: string | null;
  createdAt: string;
  deadline: string | null;
  personalNote: string | null;
}

interface AiResult {
  query: string;
  summary: string;
  roadmapIntro: string;
  categories: Category[];
  resources: Resource[];
  opportunities: Opportunity[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIES: { key: Category | "all"; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "grid" },
  { key: "essential_support", label: "Essential Support", icon: "heart" },
  { key: "education", label: "Education", icon: "book" },
  { key: "jobs", label: "Jobs", icon: "briefcase" },
  { key: "business", label: "Business", icon: "trending-up" },
  { key: "housing", label: "Housing", icon: "home" },
  { key: "safety_rights", label: "Safety & Rights", icon: "shield" },
];

const OPP_TYPES: { key: OppType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "job", label: "Jobs" },
  { key: "housing", label: "Housing" },
  { key: "scholarship", label: "Scholarships" },
  { key: "grant", label: "Grants" },
  { key: "training", label: "Training" },
  { key: "volunteer", label: "Volunteer" },
];

const TIER_CONFIG: Record<SourceTier | OppSourceTier, { label: string; color: string; icon: string }> = {
  official:              { label: "Official Source",       color: "#16A34A", icon: "check-circle" },
  verified_org:          { label: "Verified Org",          color: "#CA922B", icon: "award" },
  community_confirmed:   { label: "Community Confirmed",   color: "#2563EB", icon: "users" },
  community_shared:      { label: "Community Shared",      color: "#6B7280", icon: "share-2" },
  source_confirmed:      { label: "Source Confirmed",      color: "#CA922B", icon: "link" },
  organization_confirmed:{ label: "Org Confirmed",         color: "#16A34A", icon: "check-circle" },
  mwm_reviewed:          { label: "MWM Reviewed",          color: "#7C3AED", icon: "star" },
};

const CATEGORY_COLORS: Record<Category, string> = {
  essential_support: "#DC2626",
  education:         "#2563EB",
  jobs:              "#16A34A",
  business:          "#CA922B",
  housing:           "#7C3AED",
  safety_rights:     "#0891B2",
};

const QUICK_PROMPTS = [
  "I need help with rent this month",
  "Find scholarships for Black nursing students",
  "I'm looking for second-chance employers",
  "Show me small business grants",
  "Where can I get free legal help?",
  "I need a food pantry open today",
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function TrustBadge({ tier, small }: { tier: SourceTier | OppSourceTier; small?: boolean }) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.community_shared;
  return (
    <View style={[tb.badge, { backgroundColor: cfg.color + "15" }]}>
      <Feather name={cfg.icon as any} size={small ? 9 : 11} color={cfg.color} />
      <Text style={[tb.text, { color: cfg.color, fontSize: small ? 10 : 11 }]}>{cfg.label}</Text>
    </View>
  );
}
const tb = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  text: { fontFamily: "Inter_600SemiBold" },
});

function ResourceCard({ item, colors, onReport }: { item: Resource; colors: any; onReport: (id: string) => void }) {
  const catColor = CATEGORY_COLORS[item.category] ?? "#CA922B";
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setExpanded((p) => !p)}
      activeOpacity={0.85}
    >
      <View style={s.cardTop}>
        <View style={[s.catDot, { backgroundColor: catColor + "20", borderColor: catColor + "40" }]}>
          <Feather name={(CATEGORIES.find((c) => c.key === item.category)?.icon ?? "grid") as any} size={13} color={catColor} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[s.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text>
          {item.organization && (
            <Text style={[s.cardOrg, { color: colors.mutedForeground }]}>{item.organization}</Text>
          )}
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </View>

      <TrustBadge tier={item.sourceTier} />

      {expanded && (
        <>
          {item.description ? (
            <Text style={[s.cardDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
          ) : null}
          {(item.city || item.state) && (
            <View style={s.metaRow}>
              <Feather name="map-pin" size={12} color={colors.mutedForeground} />
              <Text style={[s.metaText, { color: colors.mutedForeground }]}>
                {item.isNational ? "National" : [item.city, item.state].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}
          <View style={s.cardActions}>
            {item.url && (
              <TouchableOpacity
                style={[s.visitBtn, { backgroundColor: "#CA922B", borderColor: "#CA922B" }]}
                onPress={() => {
                  void (async () => {
                    const { Linking } = await import("react-native");
                    Linking.openURL(item.url!).catch(() => {});
                  })();
                }}
                activeOpacity={0.85}
              >
                <Feather name="external-link" size={13} color="#fff" />
                <Text style={s.visitBtnTxt}>Visit Resource</Text>
              </TouchableOpacity>
            )}
            {item.phone && (
              <TouchableOpacity
                style={[s.visitBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  void (async () => {
                    const { Linking } = await import("react-native");
                    Linking.openURL(`tel:${item.phone}`).catch(() => {});
                  })();
                }}
                activeOpacity={0.85}
              >
                <Feather name="phone" size={13} color={colors.foreground} />
                <Text style={[s.visitBtnTxt, { color: colors.foreground }]}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => onReport(item.id)} style={s.reportLink}>
            <Text style={[s.reportLinkText, { color: colors.mutedForeground }]}>Report outdated info</Text>
          </TouchableOpacity>
        </>
      )}
    </TouchableOpacity>
  );
}

function OpportunityCard({ item, colors, onReport }: { item: Opportunity; colors: any; onReport: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const typeLabel = OPP_TYPES.find((t) => t.key === item.type)?.label ?? item.type;
  const location = item.isRemote ? "Remote" : [item.city, item.state].filter(Boolean).join(", ") || "Location not listed";

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setExpanded((p) => !p)}
      activeOpacity={0.85}
    >
      <View style={s.cardTop}>
        <View style={[s.catDot, { backgroundColor: "#CA922B20", borderColor: "#CA922B40" }]}>
          <Feather name={item.type === "housing" ? "home" : item.type === "scholarship" ? "award" : "briefcase"} size={13} color="#CA922B" />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[s.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text>
          {item.organization && (
            <Text style={[s.cardOrg, { color: colors.mutedForeground }]}>{item.organization}</Text>
          )}
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </View>

      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <TrustBadge tier={item.sourceTier} small />
        <View style={[s.typePill, { backgroundColor: colors.muted }]}>
          <Text style={[s.typePillText, { color: colors.mutedForeground }]}>{typeLabel}</Text>
        </View>
        {item.isSecondChance && (
          <View style={[s.typePill, { backgroundColor: "#16A34A15" }]}>
            <Text style={[s.typePillText, { color: "#16A34A" }]}>Second Chance</Text>
          </View>
        )}
      </View>

      <View style={s.metaRow}>
        <Feather name="map-pin" size={12} color={colors.mutedForeground} />
        <Text style={[s.metaText, { color: colors.mutedForeground }]}>{location}</Text>
        {(item.payRange || item.rent) && (
          <>
            <Text style={{ color: colors.mutedForeground }}>·</Text>
            <Text style={[s.metaText, { color: colors.mutedForeground }]}>{item.payRange ?? item.rent}</Text>
          </>
        )}
      </View>

      {expanded && (
        <>
          {item.description && (
            <Text style={[s.cardDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
          )}
          {item.personalNote && (
            <View style={[s.noteBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="message-circle" size={12} color={colors.mutedForeground} />
              <Text style={[s.noteText, { color: colors.mutedForeground }]}>"{item.personalNote}"</Text>
            </View>
          )}
          {item.deadline && (
            <View style={s.metaRow}>
              <Feather name="clock" size={12} color="#DC2626" />
              <Text style={[s.metaText, { color: "#DC2626" }]}>
                Deadline: {new Date(item.deadline).toLocaleDateString()}
              </Text>
            </View>
          )}
          <View style={s.cardActions}>
            {item.applicationLink && (
              <TouchableOpacity
                style={[s.visitBtn, { backgroundColor: "#CA922B" }]}
                onPress={() => {
                  void (async () => {
                    const { Linking } = await import("react-native");
                    Linking.openURL(item.applicationLink!).catch(() => {});
                  })();
                }}
                activeOpacity={0.85}
              >
                <Feather name="external-link" size={13} color="#fff" />
                <Text style={s.visitBtnTxt}>Apply / View</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={[s.disclaimerBox, { borderColor: colors.border }]}>
            <Text style={[s.disclaimerText, { color: colors.mutedForeground }]}>
              Mapping with Melanin™ does not act as employer, landlord, or agent. Verify details directly with the provider before sharing personal information.
            </Text>
          </View>
          <TouchableOpacity onPress={() => onReport(item.id)} style={s.reportLink}>
            <Text style={[s.reportLinkText, { color: colors.mutedForeground }]}>Report issue</Text>
          </TouchableOpacity>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Submit Opportunity Modal ───────────────────────────────────────────────────

function SubmitOpportunityModal({ visible, onClose, colors }: { visible: boolean; onClose: () => void; colors: any }) {
  const [step, setStep] = useState<"type" | "form">("type");
  const [type, setType] = useState<OppType>("job");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", organization: "", city: "", state: "", description: "",
    payRange: "", scheduleType: "", applicationLink: "", submitterRole: "",
    isSecondChance: false, isRemote: false, personalNote: "",
    rent: "", bedrooms: "", leaseLength: "",
  });

  const reset = () => { setStep("type"); setForm({ title: "", organization: "", city: "", state: "", description: "", payRange: "", scheduleType: "", applicationLink: "", submitterRole: "", isSecondChance: false, isRemote: false, personalNote: "", rent: "", bedrooms: "", leaseLength: "" }); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!form.title.trim()) { Alert.alert("Required", "Please enter a title."); return; }
    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/resources/opportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ type, ...form, bedrooms: form.bedrooms ? parseInt(form.bedrooms, 10) : undefined }),
      });
      if (res.ok) {
        Alert.alert("Thank you!", "Your opportunity has been shared with the community.");
        handleClose();
      } else {
        const data = await res.json() as { error?: string };
        Alert.alert("Error", data.error ?? "Failed to submit. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isHousing = type === "housing";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[sm.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[sm.title, { color: colors.foreground }]}>
            {step === "type" ? "Share an Opportunity" : isHousing ? "Share a Housing Lead" : "Share a Job / Opportunity"}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={sm.body} keyboardShouldPersistTaps="handled">
          {step === "type" ? (
            <>
              <Text style={[sm.label, { color: colors.mutedForeground }]}>What type of opportunity?</Text>
              {(["job", "housing", "scholarship", "grant", "training", "volunteer", "other"] as OppType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[sm.typeBtn, { borderColor: type === t ? "#CA922B" : colors.border, backgroundColor: type === t ? "#CA922B10" : colors.card }]}
                  onPress={() => setType(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[sm.typeBtnText, { color: type === t ? "#CA922B" : colors.foreground }]}>
                    {OPP_TYPES.find((o) => o.key === t)?.label ?? t}
                  </Text>
                  {type === t && <Feather name="check" size={16} color="#CA922B" />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={sm.nextBtn} onPress={() => setStep("form")} activeOpacity={0.85}>
                <Text style={sm.nextBtnText}>Continue</Text>
                <Feather name="arrow-right" size={16} color="#1C0E06" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[sm.fieldLabel, { color: colors.foreground }]}>
                {isHousing ? "Property / Listing Name*" : "Title*"}
              </Text>
              <TextInput
                style={[sm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder={isHousing ? "e.g. 2BR in West Philly, available Aug 1" : "e.g. Customer Service Rep at Target"}
                placeholderTextColor={colors.mutedForeground}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              />

              <Text style={[sm.fieldLabel, { color: colors.foreground }]}>
                {isHousing ? "Property Manager / Building Name" : "Employer / Organization"}
              </Text>
              <TextInput
                style={[sm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder={isHousing ? "Optional" : "Optional"}
                placeholderTextColor={colors.mutedForeground}
                value={form.organization}
                onChangeText={(v) => setForm((f) => ({ ...f, organization: v }))}
              />

              <View style={sm.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[sm.fieldLabel, { color: colors.foreground }]}>City</Text>
                  <TextInput
                    style={[sm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                    placeholder="City"
                    placeholderTextColor={colors.mutedForeground}
                    value={form.city}
                    onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                  />
                </View>
                <View style={{ flex: 0.6 }}>
                  <Text style={[sm.fieldLabel, { color: colors.foreground }]}>State</Text>
                  <TextInput
                    style={[sm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                    placeholder="e.g. PA"
                    placeholderTextColor={colors.mutedForeground}
                    value={form.state}
                    onChangeText={(v) => setForm((f) => ({ ...f, state: v }))}
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {!isHousing && (
                <>
                  <Text style={[sm.fieldLabel, { color: colors.foreground }]}>Pay Range</Text>
                  <TextInput
                    style={[sm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                    placeholder="e.g. $18–$22/hr or $45,000–$55,000/yr"
                    placeholderTextColor={colors.mutedForeground}
                    value={form.payRange}
                    onChangeText={(v) => setForm((f) => ({ ...f, payRange: v }))}
                  />
                  <TouchableOpacity
                    style={[sm.toggle, { borderColor: form.isRemote ? "#CA922B" : colors.border }]}
                    onPress={() => setForm((f) => ({ ...f, isRemote: !f.isRemote }))}
                    activeOpacity={0.8}
                  >
                    <Feather name={form.isRemote ? "check-square" : "square"} size={18} color={form.isRemote ? "#CA922B" : colors.mutedForeground} />
                    <Text style={[sm.toggleText, { color: colors.foreground }]}>Remote / Work from home</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[sm.toggle, { borderColor: form.isSecondChance ? "#16A34A" : colors.border }]}
                    onPress={() => setForm((f) => ({ ...f, isSecondChance: !f.isSecondChance }))}
                    activeOpacity={0.8}
                  >
                    <Feather name={form.isSecondChance ? "check-square" : "square"} size={18} color={form.isSecondChance ? "#16A34A" : colors.mutedForeground} />
                    <Text style={[sm.toggleText, { color: colors.foreground }]}>Second-chance employer (considers applicants with records)</Text>
                  </TouchableOpacity>
                </>
              )}

              {isHousing && (
                <>
                  <View style={sm.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={[sm.fieldLabel, { color: colors.foreground }]}>Monthly Rent</Text>
                      <TextInput
                        style={[sm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                        placeholder="e.g. $1,200/mo"
                        placeholderTextColor={colors.mutedForeground}
                        value={form.rent}
                        onChangeText={(v) => setForm((f) => ({ ...f, rent: v }))}
                      />
                    </View>
                    <View style={{ flex: 0.6 }}>
                      <Text style={[sm.fieldLabel, { color: colors.foreground }]}>Bedrooms</Text>
                      <TextInput
                        style={[sm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                        placeholder="e.g. 2"
                        placeholderTextColor={colors.mutedForeground}
                        value={form.bedrooms}
                        onChangeText={(v) => setForm((f) => ({ ...f, bedrooms: v }))}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </>
              )}

              <Text style={[sm.fieldLabel, { color: colors.foreground }]}>Description</Text>
              <TextInput
                style={[sm.input, sm.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder="Describe the opportunity, requirements, or anything helpful..."
                placeholderTextColor={colors.mutedForeground}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                multiline
                numberOfLines={4}
              />

              <Text style={[sm.fieldLabel, { color: colors.foreground }]}>Official Application Link</Text>
              <TextInput
                style={[sm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder="https://..."
                placeholderTextColor={colors.mutedForeground}
                value={form.applicationLink}
                onChangeText={(v) => setForm((f) => ({ ...f, applicationLink: v }))}
                keyboardType="url"
                autoCapitalize="none"
              />

              <Text style={[sm.fieldLabel, { color: colors.foreground }]}>Your role</Text>
              <TextInput
                style={[sm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder="e.g. Employee, Hiring Manager, Current Resident, Community Member"
                placeholderTextColor={colors.mutedForeground}
                value={form.submitterRole}
                onChangeText={(v) => setForm((f) => ({ ...f, submitterRole: v }))}
              />

              <Text style={[sm.fieldLabel, { color: colors.foreground }]}>Personal note (optional)</Text>
              <TextInput
                style={[sm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder="Why I'm sharing this..."
                placeholderTextColor={colors.mutedForeground}
                value={form.personalNote}
                onChangeText={(v) => setForm((f) => ({ ...f, personalNote: v }))}
              />

              <View style={[sm.noteBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="info" size={13} color={colors.mutedForeground} />
                <Text style={[sm.noteBoxText, { color: colors.mutedForeground }]}>
                  This will be labeled as a Community {isHousing ? "Housing Lead" : "Hiring Lead"} — members will know it was shared by a community member, not the employer{isHousing ? " or property manager" : ""}.
                </Text>
              </View>

              <TouchableOpacity
                style={[sm.nextBtn, submitting && { opacity: 0.6 }]}
                onPress={() => { void handleSubmit(); }}
                activeOpacity={0.85}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#1C0E06" size="small" />
                ) : (
                  <>
                    <Feather name="send" size={16} color="#1C0E06" />
                    <Text style={sm.nextBtnText}>Share Opportunity</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const sm = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontFamily: "Inter_700Bold", fontSize: 17 },
  body: { padding: 20, gap: 4, paddingBottom: 48 },
  label: { fontFamily: "Inter_500Medium", fontSize: 14, marginBottom: 12 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15 },
  textarea: { height: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },
  typeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8 },
  typeBtnText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  toggle: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8, marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth },
  toggleText: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1, lineHeight: 20 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#CA922B", borderRadius: 14, paddingVertical: 16, marginTop: 20 },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#1C0E06" },
  noteBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 8 },
  noteBoxText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, flex: 1 },
});

// ── AI Search Modal ────────────────────────────────────────────────────────────

function AiSearchModal({ visible, onClose, colors }: { visible: boolean; onClose: () => void; colors: any }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) { setTimeout(() => inputRef.current?.focus(), 300); setResult(null); setQuery(""); }
  }, [visible]);

  const handleSearch = async (q?: string) => {
    const searchQuery = (q ?? query).trim();
    if (!searchQuery) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/resources/ai-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (res.ok) {
        const data = await res.json() as AiResult;
        setResult(data);
      } else {
        Alert.alert("Error", "Could not search resources. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[sm.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[sm.title, { color: colors.foreground }]}>KinfolkAI Resource Search</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          <Text style={[ai.subtitle, { color: colors.mutedForeground }]}>
            Describe what you need in your own words. KinfolkAI will find trusted resources for you.
          </Text>

          <View style={[ai.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              ref={inputRef}
              style={[ai.searchInput, { color: colors.foreground }]}
              placeholder="e.g. I need help with my electric bill this month..."
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              multiline
              returnKeyType="search"
              onSubmitEditing={() => { void handleSearch(); }}
            />
            <TouchableOpacity
              style={[ai.sendBtn, (!query.trim() || loading) && { opacity: 0.4 }]}
              onPress={() => { void handleSearch(); }}
              disabled={!query.trim() || loading}
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="search" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>

          {!result && !loading && (
            <>
              <Text style={[ai.promptsLabel, { color: colors.mutedForeground }]}>Try asking:</Text>
              {QUICK_PROMPTS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[ai.promptChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => { setQuery(p); void handleSearch(p); }}
                  activeOpacity={0.8}
                >
                  <Feather name="chevron-right" size={13} color="#CA922B" />
                  <Text style={[ai.promptText, { color: colors.foreground }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {result && (
            <View style={{ gap: 16, marginTop: 16 }}>
              <View style={[ai.roadmapCard, { backgroundColor: "#CA922B10", borderColor: "#CA922B30" }]}>
                <Feather name="compass" size={18} color="#CA922B" />
                <View style={{ flex: 1 }}>
                  <Text style={[ai.roadmapTitle, { color: "#CA922B" }]}>Your Resource Roadmap</Text>
                  <Text style={[ai.roadmapBody, { color: colors.foreground }]}>{result.roadmapIntro}</Text>
                </View>
              </View>

              {result.resources.length > 0 && (
                <>
                  <Text style={[ai.sectionTitle, { color: colors.foreground }]}>Trusted Resources ({result.resources.length})</Text>
                  {result.resources.map((r) => (
                    <ResourceCard key={r.id} item={r} colors={colors} onReport={() => {}} />
                  ))}
                </>
              )}

              {result.opportunities.length > 0 && (
                <>
                  <Text style={[ai.sectionTitle, { color: colors.foreground }]}>Community Opportunities ({result.opportunities.length})</Text>
                  {result.opportunities.map((o) => (
                    <OpportunityCard key={o.id} item={o} colors={colors} onReport={() => {}} />
                  ))}
                </>
              )}

              {result.resources.length === 0 && result.opportunities.length === 0 && (
                <View style={[ai.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="search" size={28} color={colors.mutedForeground} />
                  <Text style={[ai.emptyText, { color: colors.mutedForeground }]}>
                    No matches found yet. Try rephrasing or browse the categories below.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
const ai = StyleSheet.create({
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, marginBottom: 16 },
  searchBox: { flexDirection: "row", alignItems: "flex-end", gap: 10, borderWidth: 1, borderRadius: 14, padding: 12 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#CA922B", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  promptsLabel: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 24, marginBottom: 10 },
  promptChip: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  promptText: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1 },
  roadmapCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 12, borderWidth: 1 },
  roadmapTitle: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 4 },
  roadmapBody: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  emptyBox: { alignItems: "center", gap: 12, padding: 32, borderRadius: 14, borderWidth: 1 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 21 },
});

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function ResourcesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"resources" | "opportunities">("resources");
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [activeOppType, setActiveOppType] = useState<OppType | "all">("all");
  const [resources, setResources] = useState<Resource[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchResources = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      const res = await fetch(`${getApiBase()}/api/resources?${params.toString()}`);
      if (res.ok) {
        const data = await res.json() as { resources: Resource[] };
        setResources(data.resources ?? []);
      }
    } catch {}
  }, [activeCategory, searchQuery]);

  const fetchOpportunities = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (activeOppType !== "all") params.set("type", activeOppType);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      const res = await fetch(`${getApiBase()}/api/resources/opportunities?${params.toString()}`);
      if (res.ok) {
        const data = await res.json() as { opportunities: Opportunity[] };
        setOpportunities(data.opportunities ?? []);
      }
    } catch {}
  }, [activeOppType, searchQuery]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchResources(), fetchOpportunities()]).finally(() => setLoading(false));
  }, [fetchResources, fetchOpportunities]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchResources(), fetchOpportunities()]);
    setRefreshing(false);
  };

  const handleReport = async (id: string, isOpp?: boolean) => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const path = isOpp ? `/api/resources/opportunities/${id}/report` : `/api/resources/${id}/report`;
      await fetch(`${getApiBase()}${path}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      Alert.alert("Report received", "Thank you. Our team will review this resource.");
    } catch {}
  };

  const topPad = Platform.OS === "web" ? 20 : insets.top;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={s.headerTitleRow}>
          <View>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Resources</Text>
            <Text style={[s.headerSubtitle, { color: colors.mutedForeground }]}>Find help for today and opportunities for tomorrow</Text>
          </View>
          <TouchableOpacity
            style={[s.aiBtn, { backgroundColor: "#CA922B", }]}
            onPress={() => setAiSearchOpen(true)}
            activeOpacity={0.85}
          >
            <Feather name="compass" size={16} color="#1C0E06" />
            <Text style={s.aiBtnText}>Ask KinfolkAI</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[s.searchRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[s.searchInput, { color: colors.foreground }]}
            placeholder="Search resources..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab switcher */}
        <View style={[s.tabRow, { backgroundColor: colors.muted }]}>
          {(["resources", "opportunities"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.tabBtn, activeTab === tab && { backgroundColor: colors.card }]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabBtnText, { color: activeTab === tab ? colors.foreground : colors.mutedForeground }]}>
                {tab === "resources" ? "Resources" : "Opportunities"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category / Type filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
        style={[s.chipRow, { borderBottomColor: colors.border }]}
      >
        {activeTab === "resources"
          ? CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[s.chip, { borderColor: activeCategory === cat.key ? "#CA922B" : colors.border, backgroundColor: activeCategory === cat.key ? "#CA922B15" : colors.card }]}
              onPress={() => setActiveCategory(cat.key as any)}
              activeOpacity={0.8}
            >
              <Feather name={cat.icon as any} size={12} color={activeCategory === cat.key ? "#CA922B" : colors.mutedForeground} />
              <Text style={[s.chipText, { color: activeCategory === cat.key ? "#CA922B" : colors.mutedForeground }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))
          : OPP_TYPES.map((ot) => (
            <TouchableOpacity
              key={ot.key}
              style={[s.chip, { borderColor: activeOppType === ot.key ? "#CA922B" : colors.border, backgroundColor: activeOppType === ot.key ? "#CA922B15" : colors.card }]}
              onPress={() => setActiveOppType(ot.key as any)}
              activeOpacity={0.8}
            >
              <Text style={[s.chipText, { color: activeOppType === ot.key ? "#CA922B" : colors.mutedForeground }]}>{ot.label}</Text>
            </TouchableOpacity>
          ))
        }
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#CA922B" />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Loading resources...</Text>
        </View>
      ) : activeTab === "resources" ? (
        <FlatList
          data={resources}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void handleRefresh(); }} tintColor="#CA922B" />}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Feather name="heart" size={36} color={colors.mutedForeground} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No resources found</Text>
              <Text style={[s.emptyBody, { color: colors.mutedForeground }]}>
                Try a different category or ask KinfolkAI for help.
              </Text>
              <TouchableOpacity style={s.emptyAiBtn} onPress={() => setAiSearchOpen(true)} activeOpacity={0.85}>
                <Feather name="compass" size={15} color="#1C0E06" />
                <Text style={s.emptyAiBtnText}>Ask KinfolkAI</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <ResourceCard item={item} colors={colors} onReport={(id) => { void handleReport(id, false); }} />
          )}
        />
      ) : (
        <FlatList
          data={opportunities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void handleRefresh(); }} tintColor="#CA922B" />}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Feather name="briefcase" size={36} color={colors.mutedForeground} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No opportunities yet</Text>
              <Text style={[s.emptyBody, { color: colors.mutedForeground }]}>
                Be the first to share a job opening, housing lead, or scholarship.
              </Text>
              <TouchableOpacity style={s.emptyAiBtn} onPress={() => setSubmitOpen(true)} activeOpacity={0.85}>
                <Feather name="plus" size={15} color="#1C0E06" />
                <Text style={s.emptyAiBtnText}>Share an Opportunity</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <OpportunityCard item={item} colors={colors} onReport={(id) => { void handleReport(id, true); }} />
          )}
        />
      )}

      {/* FAB: Share Opportunity */}
      {activeTab === "opportunities" && (
        <TouchableOpacity
          style={[s.fab, { bottom: insets.bottom + 90 }]}
          onPress={() => setSubmitOpen(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={20} color="#1C0E06" />
          <Text style={s.fabText}>Share Opportunity</Text>
        </TouchableOpacity>
      )}

      <AiSearchModal visible={aiSearchOpen} onClose={() => setAiSearchOpen(false)} colors={colors} />
      <SubmitOpportunityModal visible={submitOpen} onClose={() => setSubmitOpen(false)} colors={colors} />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 0, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  headerTitleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  headerTitle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 26 },
  headerSubtitle: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 2, maxWidth: 200 },
  aiBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, flexShrink: 0 },
  aiBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#1C0E06" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  tabRow: { flexDirection: "row", borderRadius: 10, padding: 3, marginBottom: 12 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8 },
  tabBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  chipRow: { borderBottomWidth: StyleSheet.hairlineWidth, maxHeight: 50 },
  chips: { paddingHorizontal: 16, gap: 8, paddingVertical: 9 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  list: { padding: 16, gap: 10, paddingBottom: 160 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  catDot: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 1, flexShrink: 0 },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, lineHeight: 21 },
  cardOrg: { fontFamily: "Inter_400Regular", fontSize: 12 },
  cardDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  cardActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  visitBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  visitBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },
  reportLink: { paddingVertical: 4 },
  reportLinkText: { fontFamily: "Inter_400Regular", fontSize: 11, textDecorationLine: "underline" },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typePillText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  noteBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  noteText: { fontFamily: "Inter_400Regular", fontSize: 12, fontStyle: "italic", flex: 1, lineHeight: 18 },
  disclaimerBox: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  disclaimerText: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  emptyState: { alignItems: "center", gap: 12, paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  emptyBody: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 21 },
  emptyAiBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#CA922B", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyAiBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#1C0E06" },
  fab: { position: "absolute", right: 20, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#CA922B", paddingHorizontal: 20, paddingVertical: 14, borderRadius: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  fabText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#1C0E06" },
});
