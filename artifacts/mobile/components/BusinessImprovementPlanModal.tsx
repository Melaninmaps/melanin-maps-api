import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  businessCategory: string;
  businessCity: string;
}

interface Provider {
  id: string;
  name: string;
  category: string;
  ownershipLabel: string;
  isPreferenceMatch: boolean;
  description: string;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  verified: boolean;
  expandNote?: string;
}

interface RoadmapPhase {
  phase: number;
  title: string;
  description: string;
  estimatedCost: string;
  estimatedTime: string;
  serviceType: string;
}

interface Grant {
  name: string;
  amount: string;
  description: string;
  eligibility: string;
}

interface Plan {
  summary: string;
  providers: Provider[];
  expandedProviders: Provider[];
  roadmap: RoadmapPhase[];
  grantOpportunities: Grant[];
  totalEstimateRange: string;
  nextSteps: string[];
  legalNote: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ISSUE_TYPES = [
  { id: "Accessibility", emoji: "♿" },
  { id: "Extended Hours", emoji: "🕐" },
  { id: "Online Booking", emoji: "📱" },
  { id: "Vegan Options", emoji: "🌱" },
  { id: "Bilingual Staff", emoji: "🗣️" },
  { id: "Parking", emoji: "🅿️" },
  { id: "Technology", emoji: "💻" },
  { id: "Marketing", emoji: "📣" },
  { id: "Staffing", emoji: "👥" },
  { id: "Financial", emoji: "💰" },
  { id: "Renovation / Design", emoji: "🎨" },
  { id: "Other", emoji: "✨" },
];

const OWNERSHIP_OPTIONS = [
  { id: "black-owned", emoji: "✊🏾", label: "Black-owned businesses" },
  { id: "minority-owned", emoji: "🏅", label: "Minority-owned businesses" },
  { id: "women-owned", emoji: "♀️", label: "Women-owned businesses" },
  { id: "veteran-owned", emoji: "🎖️", label: "Veteran-owned businesses" },
  { id: "lgbtq-owned", emoji: "🌈", label: "LGBTQ+-owned businesses" },
  { id: "immigrant-owned", emoji: "🌍", label: "Immigrant-owned businesses" },
  { id: "disability-owned", emoji: "♿", label: "Disability-owned businesses" },
  { id: "local-only", emoji: "📍", label: "Local businesses only" },
];

const SERVICE_TYPES = [
  "General Contractor",
  "Architect / Designer",
  "Accessibility Consultant",
  "ADA Compliance Specialist",
  "Software / Technology Vendor",
  "Marketing Agency",
  "Accountant / Financial Advisor",
  "Grant Writer",
  "Small Business Lender",
  "HR / Staffing Agency",
  "Translator / Language Services",
  "Equipment Supplier",
  "Interior Designer",
  "Other",
];

const BUDGETS = [
  "Under $5,000",
  "$5,000 – $15,000",
  "$15,000 – $50,000",
  "$50,000+",
  "Looking for grants",
];

const TIMELINES = [
  "Immediately",
  "Within 3 months",
  "Within 6 months",
  "Within a year",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BusinessImprovementPlanModal({ visible, onClose, businessId, businessName, businessCategory, businessCity }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDark = colors.background === "#0A0A0A" || colors.background === "#111";

  // Steps: 1 = issue, 2 = ownership prefs, 3 = service types, 4 = budget/timeline, 5 = results
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);

  // Step 1
  const [issueType, setIssueType] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  // Step 2
  const [ownershipPrefs, setOwnershipPrefs] = useState<string[]>([]);
  const [noPreference, setNoPreference] = useState(false);

  // Step 3
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);

  // Step 4
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");

  const reset = useCallback(() => {
    setStep(1);
    setLoading(false);
    setPlan(null);
    setIssueType("");
    setIssueDescription("");
    setOwnershipPrefs([]);
    setNoPreference(false);
    setServiceTypes([]);
    setBudget("");
    setTimeline("");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const toggleOwnership = (id: string) => {
    setNoPreference(false);
    setOwnershipPrefs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleNoPreference = () => {
    setNoPreference((prev) => {
      if (!prev) setOwnershipPrefs([]);
      return !prev;
    });
  };

  const toggleService = (s: string) => {
    setServiceTypes((prev) =>
      prev.includes(s) ? prev.filter((p) => p !== s) : [...prev, s]
    );
  };

  const canNext = (): boolean => {
    if (step === 1) return issueType.length > 0;
    if (step === 2) return noPreference || ownershipPrefs.length > 0;
    if (step === 3) return serviceTypes.length > 0;
    if (step === 4) return budget.length > 0 && timeline.length > 0;
    return true;
  };

  const submit = async () => {
    setLoading(true);
    setStep(5);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const prefs = noPreference ? ["no-preference"] : ownershipPrefs;
      const resp = await fetch(`${getApiBase()}/api/business-improvement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          businessId,
          businessName,
          businessCategory,
          businessCity,
          issueType,
          issueDescription: issueDescription.trim() || undefined,
          ownershipPreferences: prefs,
          serviceTypes,
          budget,
          timeline,
        }),
      });
      if (!resp.ok) throw new Error("Failed to generate plan");
      const data = (await resp.json()) as Plan;
      setPlan(data);
    } catch {
      Alert.alert("Something went wrong", "We couldn't generate your plan right now. Please try again.");
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const AMBER = "#CA922B";
  const CARD_BG = isDark ? "#1C120A" : "#FFF8F0";
  const SECTION_BG = isDark ? "#2A1A08" : "#FFF3E2";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[s.root, { backgroundColor: isDark ? "#0D0703" : "#FAF7F4", paddingTop: insets.top || 16 }]}>

        {/* ── Header ── */}
        <View style={[s.header, { borderBottomColor: isDark ? "#2A1A0840" : "#E8D9C4" }]}>
          <View style={s.headerLeft}>
            <View style={[s.badge, { backgroundColor: AMBER }]}>
              <Feather name="zap" size={11} color="#FFF" />
              <Text style={s.badgeText}>KinfolkAI™</Text>
            </View>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Find Trusted Providers</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={s.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* ── Step indicator (hidden on results) ── */}
        {step < 5 && (
          <View style={s.stepRow}>
            {[1, 2, 3, 4].map((n) => (
              <View key={n} style={[s.stepDot, { backgroundColor: n <= step ? AMBER : isDark ? "#2A1A08" : "#E8D9C4" }]} />
            ))}
            <Text style={[s.stepLabel, { color: colors.mutedForeground }]}>Step {step} of 4</Text>
          </View>
        )}

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

          {/* ════════════════ STEP 1 — Issue ════════════════ */}
          {step === 1 && (
            <View>
              <Text style={[s.stepTitle, { color: colors.foreground }]}>What would you like to improve?</Text>
              <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
                Choose the challenge you're ready to tackle.
              </Text>
              <View style={s.chipGrid}>
                {ISSUE_TYPES.map((it) => {
                  const active = issueType === it.id;
                  return (
                    <TouchableOpacity
                      key={it.id}
                      style={[s.chip, { borderColor: active ? AMBER : isDark ? "#3A2510" : "#DDD", backgroundColor: active ? AMBER + "20" : CARD_BG }]}
                      onPress={() => { setIssueType(it.id); if (Platform.OS !== "web") void Haptics.selectionAsync(); }}
                      activeOpacity={0.8}
                    >
                      <Text style={s.chipEmoji}>{it.emoji}</Text>
                      <Text style={[s.chipLabel, { color: active ? AMBER : colors.foreground }]}>{it.id}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Describe it in your own words (optional)</Text>
              <TextInput
                style={[s.textarea, { backgroundColor: CARD_BG, borderColor: isDark ? "#3A2510" : "#DDD", color: colors.foreground }]}
                value={issueDescription}
                onChangeText={setIssueDescription}
                placeholder="e.g. Several customers mentioned we're not wheelchair accessible…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* ════════════════ STEP 2 — Ownership Preferences ════════════════ */}
          {step === 2 && (
            <View>
              <Text style={[s.stepTitle, { color: colors.foreground }]}>Who would you like to partner with?</Text>
              <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
                These are positive sourcing preferences, not exclusive requirements. If we can't find enough exact matches, we'll expand the search and let you know.
              </Text>

              {OWNERSHIP_OPTIONS.map((opt) => {
                const checked = ownershipPrefs.includes(opt.id);
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[s.checkRow, { backgroundColor: checked ? AMBER + "18" : CARD_BG, borderColor: checked ? AMBER : isDark ? "#3A2510" : "#DDD" }]}
                    onPress={() => toggleOwnership(opt.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.checkbox, { borderColor: checked ? AMBER : isDark ? "#5A3A18" : "#CCC", backgroundColor: checked ? AMBER : "transparent" }]}>
                      {checked && <Feather name="check" size={12} color="#FFF" />}
                    </View>
                    <Text style={s.checkEmoji}>{opt.emoji}</Text>
                    <Text style={[s.checkLabel, { color: colors.foreground }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}

              <View style={[s.divider, { backgroundColor: isDark ? "#2A1A08" : "#EEE" }]} />

              <TouchableOpacity
                style={[s.checkRow, { backgroundColor: noPreference ? AMBER + "18" : CARD_BG, borderColor: noPreference ? AMBER : isDark ? "#3A2510" : "#DDD" }]}
                onPress={toggleNoPreference}
                activeOpacity={0.8}
              >
                <View style={[s.checkbox, { borderColor: noPreference ? AMBER : isDark ? "#5A3A18" : "#CCC", backgroundColor: noPreference ? AMBER : "transparent" }]}>
                  {noPreference && <Feather name="check" size={12} color="#FFF" />}
                </View>
                <Text style={s.checkEmoji}>🚫</Text>
                <Text style={[s.checkLabel, { color: colors.foreground }]}>No ownership preference</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ════════════════ STEP 3 — Service Types ════════════════ */}
          {step === 3 && (
            <View>
              <Text style={[s.stepTitle, { color: colors.foreground }]}>What type of help do you need?</Text>
              <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
                Select all that apply. We'll search our platform for matching providers.
              </Text>
              {SERVICE_TYPES.map((svc) => {
                const active = serviceTypes.includes(svc);
                return (
                  <TouchableOpacity
                    key={svc}
                    style={[s.checkRow, { backgroundColor: active ? AMBER + "18" : CARD_BG, borderColor: active ? AMBER : isDark ? "#3A2510" : "#DDD" }]}
                    onPress={() => { toggleService(svc); if (Platform.OS !== "web") void Haptics.selectionAsync(); }}
                    activeOpacity={0.8}
                  >
                    <View style={[s.checkbox, { borderColor: active ? AMBER : isDark ? "#5A3A18" : "#CCC", backgroundColor: active ? AMBER : "transparent" }]}>
                      {active && <Feather name="check" size={12} color="#FFF" />}
                    </View>
                    <Text style={[s.checkLabel, { color: colors.foreground, marginLeft: 10 }]}>{svc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ════════════════ STEP 4 — Budget + Timeline ════════════════ */}
          {step === 4 && (
            <View>
              <Text style={[s.stepTitle, { color: colors.foreground }]}>Budget & Timeline</Text>
              <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
                This helps us find the right grant opportunities and providers for you.
              </Text>

              <Text style={[s.fieldLabel, { color: colors.foreground }]}>💰 What's your budget?</Text>
              {BUDGETS.map((b) => {
                const active = budget === b;
                return (
                  <TouchableOpacity
                    key={b}
                    style={[s.radioRow, { backgroundColor: active ? AMBER + "18" : CARD_BG, borderColor: active ? AMBER : isDark ? "#3A2510" : "#DDD" }]}
                    onPress={() => setBudget(b)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.radio, { borderColor: active ? AMBER : isDark ? "#5A3A18" : "#CCC" }]}>
                      {active && <View style={[s.radioDot, { backgroundColor: AMBER }]} />}
                    </View>
                    <Text style={[s.radioLabel, { color: colors.foreground }]}>{b}</Text>
                  </TouchableOpacity>
                );
              })}

              <Text style={[s.fieldLabel, { color: colors.foreground, marginTop: 20 }]}>🗓️ What's your timeline?</Text>
              {TIMELINES.map((t) => {
                const active = timeline === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[s.radioRow, { backgroundColor: active ? AMBER + "18" : CARD_BG, borderColor: active ? AMBER : isDark ? "#3A2510" : "#DDD" }]}
                    onPress={() => setTimeline(t)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.radio, { borderColor: active ? AMBER : isDark ? "#5A3A18" : "#CCC" }]}>
                      {active && <View style={[s.radioDot, { backgroundColor: AMBER }]} />}
                    </View>
                    <Text style={[s.radioLabel, { color: colors.foreground }]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ════════════════ STEP 5 — Results ════════════════ */}
          {step === 5 && (
            <View>
              {loading && (
                <View style={s.loadingBox}>
                  <ActivityIndicator size="large" color={AMBER} />
                  <Text style={[s.loadingTitle, { color: colors.foreground }]}>Building your plan…</Text>
                  <Text style={[s.loadingSub, { color: colors.mutedForeground }]}>
                    Searching for providers on Mapping With Melanin™ and generating your custom roadmap.
                  </Text>
                </View>
              )}

              {!loading && plan && (
                <>
                  {/* Summary */}
                  <View style={[s.summaryCard, { backgroundColor: SECTION_BG, borderColor: AMBER + "40" }]}>
                    <View style={[s.badge, { backgroundColor: AMBER, alignSelf: "flex-start", marginBottom: 10 }]}>
                      <Feather name="zap" size={11} color="#FFF" />
                      <Text style={s.badgeText}>Your Improvement Plan</Text>
                    </View>
                    <Text style={[s.summaryText, { color: colors.foreground }]}>{plan.summary}</Text>
                    {plan.totalEstimateRange ? (
                      <View style={s.estimateRow}>
                        <Feather name="dollar-sign" size={13} color={AMBER} />
                        <Text style={[s.estimateLabel, { color: AMBER }]}>Total estimate: {plan.totalEstimateRange}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Providers — Preference Matches */}
                  {plan.providers.length > 0 && (
                    <View style={s.section}>
                      <Text style={[s.sectionTitle, { color: colors.foreground }]}>✅ Matched Providers</Text>
                      <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>Found on Mapping With Melanin™ and match your preferences</Text>
                      {plan.providers.map((p) => (
                        <ProviderCard key={p.id} provider={p} amber={AMBER} cardBg={CARD_BG} colors={colors} isDark={isDark} />
                      ))}
                    </View>
                  )}

                  {/* Providers — Expanded */}
                  {plan.expandedProviders.length > 0 && (
                    <View style={s.section}>
                      <Text style={[s.sectionTitle, { color: colors.foreground }]}>🔍 Expanded Search</Text>
                      <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>Other minority-owned businesses on our platform</Text>
                      {plan.expandedProviders.map((p) => (
                        <ProviderCard key={p.id} provider={p} amber={AMBER} cardBg={CARD_BG} colors={colors} isDark={isDark} />
                      ))}
                    </View>
                  )}

                  {/* No providers found */}
                  {plan.providers.length === 0 && plan.expandedProviders.length === 0 && (
                    <View style={[s.emptyBox, { backgroundColor: CARD_BG, borderColor: isDark ? "#3A2510" : "#DDD" }]}>
                      <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                        We didn't find matching providers on our platform yet — but your roadmap and grant info below will still guide you forward.
                      </Text>
                    </View>
                  )}

                  {/* Roadmap */}
                  {plan.roadmap.length > 0 && (
                    <View style={s.section}>
                      <Text style={[s.sectionTitle, { color: colors.foreground }]}>🗺️ Your Roadmap</Text>
                      {plan.roadmap.map((phase) => (
                        <View key={phase.phase} style={[s.phaseCard, { backgroundColor: CARD_BG, borderColor: isDark ? "#3A2510" : "#E8D9C4" }]}>
                          <View style={[s.phaseBadge, { backgroundColor: AMBER }]}>
                            <Text style={s.phaseNum}>Phase {phase.phase}</Text>
                          </View>
                          <Text style={[s.phaseTitle, { color: colors.foreground }]}>{phase.title}</Text>
                          <Text style={[s.phaseDesc, { color: colors.mutedForeground }]}>{phase.description}</Text>
                          <View style={s.phaseMeta}>
                            <View style={s.phaseMetaItem}>
                              <Feather name="dollar-sign" size={12} color={AMBER} />
                              <Text style={[s.phaseMetaText, { color: colors.mutedForeground }]}>{phase.estimatedCost}</Text>
                            </View>
                            <View style={s.phaseMetaItem}>
                              <Feather name="clock" size={12} color={AMBER} />
                              <Text style={[s.phaseMetaText, { color: colors.mutedForeground }]}>{phase.estimatedTime}</Text>
                            </View>
                          </View>
                          {phase.serviceType ? (
                            <Text style={[s.phaseService, { color: AMBER }]}>Hire: {phase.serviceType}</Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Grants */}
                  {plan.grantOpportunities.length > 0 && (
                    <View style={s.section}>
                      <Text style={[s.sectionTitle, { color: colors.foreground }]}>💸 Grant Opportunities</Text>
                      {plan.grantOpportunities.map((g, i) => (
                        <View key={i} style={[s.grantCard, { backgroundColor: CARD_BG, borderColor: isDark ? "#3A2510" : "#E8D9C4" }]}>
                          <View style={s.grantHeader}>
                            <Text style={[s.grantName, { color: colors.foreground }]}>{g.name}</Text>
                            <View style={[s.grantBadge, { backgroundColor: "#2D7A4F20" }]}>
                              <Text style={[s.grantAmount, { color: "#2D7A4F" }]}>{g.amount}</Text>
                            </View>
                          </View>
                          <Text style={[s.grantDesc, { color: colors.mutedForeground }]}>{g.description}</Text>
                          <Text style={[s.grantElig, { color: colors.mutedForeground }]}>Eligibility: {g.eligibility}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Next Steps */}
                  {plan.nextSteps.length > 0 && (
                    <View style={s.section}>
                      <Text style={[s.sectionTitle, { color: colors.foreground }]}>⚡ Do This Week</Text>
                      {plan.nextSteps.map((step, i) => (
                        <View key={i} style={s.nextStepRow}>
                          <View style={[s.nextStepDot, { backgroundColor: AMBER }]}>
                            <Text style={s.nextStepNum}>{i + 1}</Text>
                          </View>
                          <Text style={[s.nextStepText, { color: colors.foreground }]}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Legal note */}
                  {plan.legalNote ? (
                    <Text style={[s.legalNote, { color: colors.mutedForeground }]}>{plan.legalNote}</Text>
                  ) : null}

                  <TouchableOpacity
                    style={[s.startOverBtn, { borderColor: isDark ? "#3A2510" : "#DDD" }]}
                    onPress={reset}
                    activeOpacity={0.7}
                  >
                    <Feather name="refresh-cw" size={14} color={AMBER} />
                    <Text style={[s.startOverText, { color: AMBER }]}>Start a New Plan</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── Navigation Footer (steps 1-4) ── */}
        {step < 5 && (
          <View style={[s.footer, { borderTopColor: isDark ? "#2A1A08" : "#E8D9C4", paddingBottom: insets.bottom + 12 }]}>
            {step > 1 && (
              <TouchableOpacity style={[s.backBtn, { borderColor: isDark ? "#3A2510" : "#DDD" }]} onPress={() => setStep((s) => s - 1)} activeOpacity={0.8}>
                <Feather name="arrow-left" size={16} color={colors.foreground} />
                <Text style={[s.backBtnText, { color: colors.foreground }]}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.nextBtn, { backgroundColor: canNext() ? AMBER : isDark ? "#3A2510" : "#E8D9C4", flex: step > 1 ? 1 : undefined }]}
              onPress={() => {
                if (!canNext()) return;
                if (step === 4) { if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); void submit(); }
                else setStep((s) => s + 1);
              }}
              activeOpacity={0.85}
              disabled={!canNext()}
            >
              <Text style={[s.nextBtnText, { color: canNext() ? "#FFF" : colors.mutedForeground }]}>
                {step === 4 ? "Find My Providers" : "Continue"}
              </Text>
              {step < 4 && <Feather name="arrow-right" size={16} color={canNext() ? "#FFF" : colors.mutedForeground} />}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Provider Card ─────────────────────────────────────────────────────────────

interface ProviderCardProps {
  provider: Provider;
  amber: string;
  cardBg: string;
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
}

function ProviderCard({ provider, amber, cardBg, colors, isDark }: ProviderCardProps) {
  return (
    <View style={[s.provCard, { backgroundColor: cardBg, borderColor: isDark ? "#3A2510" : "#E8D9C4" }]}>
      <View style={s.provHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[s.provName, { color: colors.foreground }]}>{provider.name}</Text>
          <Text style={[s.provCategory, { color: colors.mutedForeground }]}>{provider.category} • {provider.city}, {provider.state}</Text>
        </View>
        <View style={[s.ownerBadge, { backgroundColor: amber + "20" }]}>
          {provider.verified && <Feather name="check-circle" size={10} color={amber} style={{ marginRight: 3 }} />}
          <Text style={[s.ownerBadgeText, { color: amber }]}>{provider.ownershipLabel}</Text>
        </View>
      </View>
      {provider.description ? (
        <Text style={[s.provDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{provider.description}</Text>
      ) : null}
      {provider.expandNote ? (
        <Text style={[s.expandNote, { color: amber }]}>{provider.expandNote}</Text>
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerLeft: { gap: 4 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { color: "#FFF", fontSize: 10, fontFamily: "Inter_600SemiBold" },
  closeBtn: { padding: 4 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  stepDot: { width: 28, height: 4, borderRadius: 2 },
  stepLabel: { marginLeft: 6, fontSize: 12, fontFamily: "Inter_500Medium" },
  body: { padding: 20, paddingTop: 16 },
  stepTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 6, lineHeight: 26 },
  stepSub: { fontSize: 14, lineHeight: 20, marginBottom: 18, fontFamily: "Inter_400Regular" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  textarea: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 80, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  checkRow: { flexDirection: "row", alignItems: "center", padding: 13, borderRadius: 10, borderWidth: 1.5, marginBottom: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  checkEmoji: { fontSize: 16, marginLeft: 10 },
  checkLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", marginLeft: 8 },
  divider: { height: 1, marginVertical: 12 },
  radioRow: { flexDirection: "row", alignItems: "center", padding: 13, borderRadius: 10, borderWidth: 1.5, marginBottom: 8 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  radioLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", marginLeft: 12 },
  loadingBox: { alignItems: "center", paddingVertical: 60, gap: 16 },
  loadingTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  loadingSub: { fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 20, fontFamily: "Inter_400Regular" },
  summaryCard: { borderWidth: 1.5, borderRadius: 14, padding: 16, marginBottom: 20 },
  summaryText: { fontSize: 15, lineHeight: 22, fontFamily: "Inter_400Regular" },
  estimateRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  estimateLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 12 },
  provCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  provHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 6 },
  provName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  provCategory: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  ownerBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  ownerBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  provDesc: { fontSize: 13, lineHeight: 18, fontFamily: "Inter_400Regular" },
  expandNote: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 6 },
  emptyBox: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 },
  emptyText: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular", textAlign: "center" },
  phaseCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  phaseBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  phaseNum: { color: "#FFF", fontSize: 11, fontFamily: "Inter_700Bold" },
  phaseTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  phaseDesc: { fontSize: 13, lineHeight: 18, fontFamily: "Inter_400Regular", marginBottom: 10 },
  phaseMeta: { flexDirection: "row", gap: 16 },
  phaseMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  phaseMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  phaseService: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 6 },
  grantCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  grantHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 },
  grantName: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  grantBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  grantAmount: { fontSize: 12, fontFamily: "Inter_700Bold" },
  grantDesc: { fontSize: 13, lineHeight: 18, fontFamily: "Inter_400Regular", marginBottom: 4 },
  grantElig: { fontSize: 12, fontFamily: "Inter_400Regular" },
  nextStepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  nextStepDot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 1 },
  nextStepNum: { color: "#FFF", fontSize: 11, fontFamily: "Inter_700Bold" },
  nextStepText: { flex: 1, fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular" },
  legalNote: { fontSize: 11, lineHeight: 16, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 20, marginTop: 8, marginBottom: 20, fontStyle: "italic" },
  startOverBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 4 },
  startOverText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5 },
  backBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  nextBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
