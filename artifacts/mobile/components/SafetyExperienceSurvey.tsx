import { Feather } from "@expo/vector-icons";
import { getCategoryRatingQuestions, getCategoryExperienceLabel } from "@/lib/categoryQuestions";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  businessName: string;
  businessCategory?: string;
  onClose: () => void;
  onSubmit?: (data: SafetySurveyData) => void;
}

export interface SafetySurveyData {
  overallSafety: number;
  returnAlone: number;
  wouldRecommend: number;
  belongingRating: number;
  wouldRecommendChip: string;
  wouldReturnChip: string;
  staffProfessional: string;
  timeOfDay: string;
  groupType: string;
  incidentOccurred: boolean;
  incidentCategories: string[];
  incidentParties: string[];
  incidentSeverity: string;
  reportedToBusiness: string;
  issueResolved: string;
  wouldReturn: string;
  incidentDescription: string;
  evidenceLinks: string;
  comments: string;
  categoryRatings: Record<string, number>;
}

const TIMES = ["Morning", "Afternoon", "Evening", "Night"];
const GROUPS = ["Solo", "With Partner", "With Friends", "With Family", "With Kids"];

const INCIDENT_CATEGORIES = [
  { group: "Customer Service", items: ["Staff was rude or dismissive", "Long wait or lack of assistance", "Service was inconsistent", "Refused service", "Other customer service concern"] },
  { group: "Safety", items: ["Felt unsafe", "Harassment by another customer", "Threatening behavior", "Theft or property concern", "Physical altercation", "Security concern"] },
  { group: "Business Experience", items: ["Pricing or billing issue", "Product or service quality issue", "Appointment or reservation problem", "Accessibility concern", "Cleanliness concern"] },
  { group: "Respect & Inclusion", items: ["Felt unwelcome", "Inappropriate comments or language", "Unequal treatment", "Cultural insensitivity", "I believe I may have experienced discrimination", "Other concern"] },
];
const INCIDENT_PARTIES = ["Employee", "Manager", "Business Owner", "Another Customer", "Security", "Unknown"];
const SEVERITIES = ["Minor", "Moderate", "Significant", "Serious"];
const REPORTED_OPTS = ["Yes", "No", "I attempted to"];
const RESOLVED_OPTS = ["Completely", "Partially", "No", "Not Applicable"];
const RETURN_OPTS = ["Yes", "Maybe", "No"];

function toggleArr(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const colors = useColors();
  return (
    <View style={sr.starRow}>
      <Text style={[sr.starLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={sr.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(n); }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Feather name="star" size={28} color={n <= value ? "#D4873A" : "#E5E7EB"} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function CheckBoxRow({ label, checked, onToggle, colors }: { label: string; checked: boolean; onToggle: () => void; colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  return (
    <TouchableOpacity
      style={styles.checkRow}
      onPress={() => { Haptics.selectionAsync(); onToggle(); }}
      activeOpacity={0.7}
    >
      <View style={[styles.checkBox, { borderColor: checked ? "#C4622D" : colors.border, backgroundColor: checked ? "#C4622D" : "transparent" }]}>
        {checked && <Feather name="check" size={11} color="#FBF7F0" />}
      </View>
      <Text style={[styles.checkLabel, { color: checked ? colors.foreground : colors.mutedForeground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SafetyExperienceSurvey({ visible, businessName, businessCategory, onClose, onSubmit }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const EMPTY_DATA: SafetySurveyData = {
    overallSafety: 0, returnAlone: 0, wouldRecommend: 0,
    belongingRating: 0, wouldRecommendChip: "", wouldReturnChip: "", staffProfessional: "",
    timeOfDay: "", groupType: "", incidentOccurred: false,
    incidentCategories: [], incidentParties: [], incidentSeverity: "",
    reportedToBusiness: "", issueResolved: "", wouldReturn: "",
    incidentDescription: "", evidenceLinks: "",
    comments: "", categoryRatings: {},
  };
  const [data, setData] = useState<SafetySurveyData>({ ...EMPTY_DATA });
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setStep(0);
    setData({ ...EMPTY_DATA });
    setSubmitted(false);
  };

  const handleClose = () => { reset(); onClose(); };

  useEffect(() => {
    if (!submitted) return;
    const t = setTimeout(() => { handleClose(); }, 3500);
    return () => clearTimeout(t);
  }, [submitted]);

  const canNext = () => {
    if (step === 0) return data.overallSafety > 0 && data.returnAlone > 0;
    if (step === 1) return data.belongingRating > 0 && data.wouldRecommendChip !== "" && data.wouldReturnChip !== "" && data.timeOfDay !== "" && data.groupType !== "";
    return true;
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < 3) { setStep(step + 1); return; }
    setSubmitted(true);
    onSubmit?.(data);
  };

  const categoryQuestions = getCategoryRatingQuestions(businessCategory);
  const categoryLabel = getCategoryExperienceLabel(businessCategory);
  const STEPS = ["Your Experience", "More Details", "Comments", categoryLabel];

  const isEmployer = (() => {
    const cat = (businessCategory ?? "").toLowerCase();
    return cat.includes("staffing") || cat.includes("employment") || cat.includes("recruiting") ||
      cat.includes("temp agency") || cat.includes("job placement") || cat.includes("workforce") ||
      cat.includes("hr ") || cat.includes("human resources") || cat.includes("hiring");
  })();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Share Your Experience</Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]} numberOfLines={1}>{businessName}</Text>
            </View>
            <View style={{ width: 22 }} />
          </View>

          {/* Step indicator */}
          {!submitted && (
            <View style={styles.stepBar}>
              {STEPS.map((s, i) => (
                <View key={s} style={styles.stepItem}>
                  <View style={[styles.stepDot, {
                    backgroundColor: i <= step ? "#C4622D" : colors.border,
                    width: i === step ? 28 : 8,
                  }]} />
                  {i < STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: i < step ? "#C4622D" : colors.border }]} />}
                </View>
              ))}
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {submitted ? (
              <View style={styles.thankYou}>
                <View style={[styles.thankIcon, { backgroundColor: "#2D7A4F18" }]}>
                  <Feather name="check-circle" size={44} color="#2D7A4F" />
                </View>
                <Text style={[styles.thankTitle, { color: colors.foreground }]}>Experience Shared</Text>
                <Text style={[styles.thankBiz, { color: colors.primary }]}>{businessName}</Text>
                <Text style={[styles.thankSub, { color: colors.mutedForeground }]}>
                  Your experience has been added to the Community Insights for this location. Every voice helps our community find spaces where they feel welcomed, safe, and they belong.
                </Text>
                <View style={[styles.thankPoints, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                  <Feather name="award" size={14} color={colors.primary} />
                  <Text style={[styles.thankPointsText, { color: colors.primary }]}>+10 community points earned</Text>
                </View>
                <TouchableOpacity style={[styles.doneBtn, { backgroundColor: "#2D7A4F" }]} onPress={handleClose}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : step === 0 ? (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>How was your experience?</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  Rate your experience at {businessName}
                </Text>
                <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <StarRow label="Overall Experience" value={data.overallSafety} onChange={(v) => setData({ ...data, overallSafety: v })} />
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <StarRow label="Did you feel welcomed and respected?" value={data.returnAlone} onChange={(v) => setData({ ...data, returnAlone: v })} />
                </View>
              </View>
            ) : step === 1 ? (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>Tell us more</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  Help the community understand what to expect
                </Text>

                {/* Belonging — signature question */}
                <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
                  <StarRow label="Did this feel like a place where you belonged?" value={data.belongingRating} onChange={(v) => setData({ ...data, belongingRating: v })} />
                </View>

                {/* Recommend */}
                <Text style={[styles.groupLabel, { color: colors.foreground }]}>Would you recommend this business?</Text>
                <View style={[styles.chipGrid, { marginBottom: 16 }]}>
                  {["Yes", "Maybe", "No"].map((o) => {
                    const activeColor = o === "Yes" ? "#2D7A4F" : o === "No" ? "#DC2626" : "#C4622D";
                    return (
                      <TouchableOpacity key={o} style={[styles.chip, { flex: 1, justifyContent: "center", backgroundColor: data.wouldRecommendChip === o ? activeColor : colors.card, borderColor: data.wouldRecommendChip === o ? activeColor : colors.border }]} onPress={() => { Haptics.selectionAsync(); setData({ ...data, wouldRecommendChip: o }); }}>
                        <Text style={[styles.chipText, { color: data.wouldRecommendChip === o ? "#FBF7F0" : colors.foreground, textAlign: "center" }]}>{o}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Would return */}
                <Text style={[styles.groupLabel, { color: colors.foreground }]}>Would you return?</Text>
                <View style={[styles.chipGrid, { marginBottom: 16 }]}>
                  {["Yes", "Maybe", "No"].map((o) => {
                    const activeColor = o === "Yes" ? "#2D7A4F" : o === "No" ? "#DC2626" : "#C4622D";
                    return (
                      <TouchableOpacity key={o} style={[styles.chip, { flex: 1, justifyContent: "center", backgroundColor: data.wouldReturnChip === o ? activeColor : colors.card, borderColor: data.wouldReturnChip === o ? activeColor : colors.border }]} onPress={() => { Haptics.selectionAsync(); setData({ ...data, wouldReturnChip: o }); }}>
                        <Text style={[styles.chipText, { color: data.wouldReturnChip === o ? "#FBF7F0" : colors.foreground, textAlign: "center" }]}>{o}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Staff professional */}
                <Text style={[styles.groupLabel, { color: colors.foreground }]}>Did staff resolve concerns professionally?</Text>
                <View style={[styles.chipGrid, { marginBottom: 20 }]}>
                  {["Yes", "Somewhat", "No", "N/A"].map((o) => {
                    const activeColor = o === "Yes" ? "#2D7A4F" : o === "No" ? "#DC2626" : "#C4622D";
                    return (
                      <TouchableOpacity key={o} style={[styles.chip, { flex: 1, justifyContent: "center", backgroundColor: data.staffProfessional === o ? activeColor : colors.card, borderColor: data.staffProfessional === o ? activeColor : colors.border }]} onPress={() => { Haptics.selectionAsync(); setData({ ...data, staffProfessional: o }); }}>
                        <Text style={[styles.chipText, { color: data.staffProfessional === o ? "#FBF7F0" : colors.foreground, textAlign: "center" }]}>{o}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.groupLabel, { color: colors.foreground }]}>Time of visit</Text>
                <View style={styles.chipGrid}>
                  {TIMES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.chip, {
                        backgroundColor: data.timeOfDay === t ? "#C4622D" : colors.card,
                        borderColor: data.timeOfDay === t ? "#C4622D" : colors.border,
                      }]}
                      onPress={() => { Haptics.selectionAsync(); setData({ ...data, timeOfDay: t }); }}
                    >
                      <Text style={[styles.chipText, { color: data.timeOfDay === t ? "#FBF7F0" : colors.foreground }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.groupLabel, { color: colors.foreground, marginTop: 16 }]}>Who were you with?</Text>
                <View style={styles.chipGrid}>
                  {GROUPS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, {
                        backgroundColor: data.groupType === g ? "#C4622D" : colors.card,
                        borderColor: data.groupType === g ? "#C4622D" : colors.border,
                      }]}
                      onPress={() => { Haptics.selectionAsync(); setData({ ...data, groupType: g }); }}
                    >
                      <Text style={[styles.chipText, { color: data.groupType === g ? "#FBF7F0" : colors.foreground }]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.groupLabel, { color: colors.foreground, marginTop: 16 }]}>Did an incident occur during your visit?</Text>
                <View style={{ flexDirection: "row", gap: 10, marginBottom: data.incidentOccurred ? 20 : 0 }}>
                  <TouchableOpacity
                    style={[styles.chip, { flex: 1, justifyContent: "center", backgroundColor: data.incidentOccurred === false ? "#2D7A4F" : colors.card, borderColor: data.incidentOccurred === false ? "#2D7A4F" : colors.border }]}
                    onPress={() => { Haptics.selectionAsync(); setData({ ...data, incidentOccurred: false, incidentCategories: [], incidentParties: [], incidentSeverity: "", reportedToBusiness: "", issueResolved: "", wouldReturn: "", incidentDescription: "", evidenceLinks: "" }); }}
                  >
                    <Text style={[styles.chipText, { color: data.incidentOccurred === false ? "#FBF7F0" : colors.foreground, textAlign: "center" }]}>No</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chip, { flex: 1, justifyContent: "center", backgroundColor: data.incidentOccurred === true ? "#DC2626" : colors.card, borderColor: data.incidentOccurred === true ? "#DC2626" : colors.border }]}
                    onPress={() => { Haptics.selectionAsync(); setData({ ...data, incidentOccurred: true }); }}
                  >
                    <Text style={[styles.chipText, { color: data.incidentOccurred === true ? "#FBF7F0" : colors.foreground, textAlign: "center" }]}>Yes</Text>
                  </TouchableOpacity>
                </View>

                {data.incidentOccurred === true && (
                  <View>
                    {/* Platform policy note */}
                    <View style={[styles.incidentPolicyNote, { backgroundColor: "#3B6EA510", borderColor: "#3B6EA530" }]}>
                      <Text style={{ fontSize: 16, marginTop: 1 }}>🔄</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.incidentPolicyTitle, { color: "#7EB0DD" }]}>How reports work on this platform</Text>
                        <Text style={[styles.incidentPolicyText, { color: "#7EB0DD" }]}>
                          The business receives your report and may respond publicly. If you agree the issue is resolved, you can update or remove your report. Reports automatically expire after 6 months unless there's ongoing community concern.
                        </Text>
                      </View>
                    </View>

                    {/* What happened */}
                    <Text style={[styles.incidentSectionTitle, { color: colors.foreground }]}>What best describes what happened?</Text>
                    <Text style={[styles.incidentSectionSub, { color: colors.mutedForeground }]}>Select all that apply</Text>

                    {INCIDENT_CATEGORIES.map((cat) => (
                      <View key={cat.group} style={{ marginBottom: 12 }}>
                        <View style={styles.incidentGroupHeader}>
                          <View style={[styles.incidentGroupLine, { backgroundColor: colors.border }]} />
                          <Text style={[styles.incidentGroupTitle, { color: "#C4622D" }]}>{cat.group}</Text>
                          <View style={[styles.incidentGroupLine, { backgroundColor: colors.border }]} />
                        </View>
                        {cat.items.map((item) => (
                          <CheckBoxRow key={item} label={item} checked={data.incidentCategories.includes(item)} onToggle={() => setData({ ...data, incidentCategories: toggleArr(data.incidentCategories, item) })} colors={colors} />
                        ))}
                      </View>
                    ))}

                    {/* Who was involved */}
                    <View style={[styles.incidentDivider, { backgroundColor: colors.border }]} />
                    <Text style={[styles.incidentSectionTitle, { color: colors.foreground }]}>Who was involved?</Text>
                    {INCIDENT_PARTIES.map((p) => (
                      <CheckBoxRow key={p} label={p} checked={data.incidentParties.includes(p)} onToggle={() => setData({ ...data, incidentParties: toggleArr(data.incidentParties, p) })} colors={colors} />
                    ))}

                    {/* Severity */}
                    <View style={[styles.incidentDivider, { backgroundColor: colors.border }]} />
                    <Text style={[styles.incidentSectionTitle, { color: colors.foreground }]}>How severe was the incident?</Text>
                    <View style={styles.chipGrid}>
                      {SEVERITIES.map((s) => {
                        const sColor = s === "Serious" ? "#DC2626" : s === "Significant" ? "#D97706" : "#C4622D";
                        return (
                          <TouchableOpacity key={s} style={[styles.chip, { backgroundColor: data.incidentSeverity === s ? sColor : colors.card, borderColor: data.incidentSeverity === s ? sColor : colors.border }]} onPress={() => { Haptics.selectionAsync(); setData({ ...data, incidentSeverity: s }); }}>
                            <Text style={[styles.chipText, { color: data.incidentSeverity === s ? "#FBF7F0" : colors.foreground }]}>{s}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Reported to business */}
                    <Text style={[styles.incidentSectionTitle, { color: colors.foreground, marginTop: 16 }]}>Did you report the concern to the business?</Text>
                    <View style={styles.chipGrid}>
                      {REPORTED_OPTS.map((o) => (
                        <TouchableOpacity key={o} style={[styles.chip, { backgroundColor: data.reportedToBusiness === o ? "#C4622D" : colors.card, borderColor: data.reportedToBusiness === o ? "#C4622D" : colors.border }]} onPress={() => { Haptics.selectionAsync(); setData({ ...data, reportedToBusiness: o }); }}>
                          <Text style={[styles.chipText, { color: data.reportedToBusiness === o ? "#FBF7F0" : colors.foreground }]}>{o}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Issue resolved */}
                    <Text style={[styles.incidentSectionTitle, { color: colors.foreground, marginTop: 16 }]}>Was the issue resolved during your visit?</Text>
                    <View style={styles.chipGrid}>
                      {RESOLVED_OPTS.map((o) => {
                        const rColor = o === "Completely" ? "#2D7A4F" : "#C4622D";
                        return (
                          <TouchableOpacity key={o} style={[styles.chip, { backgroundColor: data.issueResolved === o ? rColor : colors.card, borderColor: data.issueResolved === o ? rColor : colors.border }]} onPress={() => { Haptics.selectionAsync(); setData({ ...data, issueResolved: o }); }}>
                            <Text style={[styles.chipText, { color: data.issueResolved === o ? "#FBF7F0" : colors.foreground }]}>{o}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Would return */}
                    <Text style={[styles.incidentSectionTitle, { color: colors.foreground, marginTop: 16 }]}>Would you return if the issue were addressed?</Text>
                    <View style={styles.chipGrid}>
                      {RETURN_OPTS.map((o) => {
                        const rColor = o === "Yes" ? "#2D7A4F" : o === "No" ? "#DC2626" : "#C4622D";
                        return (
                          <TouchableOpacity key={o} style={[styles.chip, { backgroundColor: data.wouldReturn === o ? rColor : colors.card, borderColor: data.wouldReturn === o ? rColor : colors.border }]} onPress={() => { Haptics.selectionAsync(); setData({ ...data, wouldReturn: o }); }}>
                            <Text style={[styles.chipText, { color: data.wouldReturn === o ? "#FBF7F0" : colors.foreground }]}>{o}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Description */}
                    <View style={[styles.incidentDivider, { backgroundColor: colors.border }]} />
                    <Text style={[styles.incidentSectionTitle, { color: colors.foreground }]}>Please describe what happened.</Text>
                    <Text style={[styles.incidentSectionSub, { color: colors.mutedForeground }]}>Describe the events as accurately as possible — what occurred, where it happened, and who was involved. Focus on what you personally experienced or observed. (500–1,000 characters)</Text>
                    <TextInput
                      style={[styles.textArea, { backgroundColor: colors.card, borderColor: data.incidentDescription.length >= 500 ? "#2D7A4F" : colors.border, color: colors.foreground }]}
                      placeholder="Describe what happened..."
                      placeholderTextColor={colors.mutedForeground}
                      multiline
                      numberOfLines={6}
                      maxLength={1000}
                      value={data.incidentDescription}
                      onChangeText={(t) => setData({ ...data, incidentDescription: t })}
                      textAlignVertical="top"
                    />
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                      <Text style={{ color: data.incidentDescription.length >= 500 ? "#2D7A4F" : colors.mutedForeground, fontSize: 11 }}>
                        {data.incidentDescription.length >= 500 ? "✓ Good length" : `${data.incidentDescription.length}/500 minimum`}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{data.incidentDescription.length}/1,000</Text>
                    </View>

                    {/* Evidence links */}
                    <Text style={[styles.incidentSectionTitle, { color: colors.foreground, marginTop: 16 }]}>Supporting evidence</Text>
                    <Text style={[styles.incidentSectionSub, { color: colors.mutedForeground }]}>Add a link to a supporting video, social media post, or news article (optional)</Text>
                    <View style={[styles.evidenceInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={{ fontSize: 16 }}>🔗</Text>
                      <TextInput
                        style={[styles.evidenceTextInput, { color: colors.foreground }]}
                        placeholder="https://..."
                        placeholderTextColor={colors.mutedForeground}
                        value={data.evidenceLinks}
                        onChangeText={(t) => setData({ ...data, evidenceLinks: t })}
                        autoCapitalize="none"
                        keyboardType="url"
                      />
                    </View>
                  </View>
                )}
              </View>
            ) : step === 2 ? (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>Anything else to share?</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  Optional — your comments help future visitors
                </Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Describe your experience, what made you feel safe or unsafe..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={5}
                  value={data.comments}
                  onChangeText={(t) => setData({ ...data, comments: t })}
                  textAlignVertical="top"
                />
              </View>
            ) : (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>{categoryLabel}</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  Optional — rate specific aspects of your visit
                </Text>
                <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {categoryQuestions.map((q, i) => (
                    <View key={q.key}>
                      {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                      <StarRow
                        label={q.label}
                        value={data.categoryRatings[q.key] ?? 0}
                        onChange={(v) => setData({ ...data, categoryRatings: { ...data.categoryRatings, [q.key]: v } })}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {!submitted && (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              {step > 0 && (
                <TouchableOpacity style={[styles.backBtn, { borderColor: colors.border }]} onPress={() => setStep(step - 1)}>
                  <Text style={[styles.backBtnText, { color: colors.foreground }]}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: canNext() ? "#C4622D" : colors.border, flex: 1 }]}
                onPress={handleNext}
                disabled={!canNext()}
              >
                <Text style={[styles.nextBtnText, { color: canNext() ? "#FBF7F0" : colors.mutedForeground }]}>
                  {step === 3 ? "Submit" : "Next"}
                </Text>
                {step < 3 && <Feather name="arrow-right" size={16} color={canNext() ? "#FBF7F0" : colors.mutedForeground} />}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const sr = StyleSheet.create({
  starRow: { gap: 10 },
  starLabel: { fontFamily: "Inter_500Medium", fontSize: 14, marginBottom: 8 },
  stars: { flexDirection: "row", gap: 6 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  stepBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 4,
  },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  stepDot: { height: 8, borderRadius: 4 },
  stepLine: { flex: 1, height: 2, borderRadius: 1 },
  body: { padding: 20, paddingBottom: 8 },
  stepContent: { gap: 12 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  stepSub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 8 },
  ratingCard: { borderRadius: 16, padding: 18, borderWidth: 1, gap: 16 },
  divider: { height: 1 },
  groupLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 8 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 130,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  thankYou: { alignItems: "center", gap: 14, paddingTop: 40, paddingHorizontal: 8 },
  thankIcon: { width: 86, height: 86, borderRadius: 43, alignItems: "center", justifyContent: "center" },
  thankTitle: { fontFamily: "Inter_700Bold", fontSize: 26 },
  thankBiz: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginTop: -6 },
  thankSub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22, paddingHorizontal: 8 },
  thankPoints: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  thankPointsText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  doneBtn: { marginTop: 4, paddingHorizontal: 48, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FBF7F0" },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 6 },
  checkBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 },
  checkLabel: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, flex: 1 },
  incidentPolicyNote: { flexDirection: "row", gap: 10, alignItems: "flex-start", borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 20 },
  incidentPolicyTitle: { fontFamily: "Inter_700Bold", fontSize: 12, marginBottom: 4 },
  incidentPolicyText: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 17, opacity: 0.9 },
  incidentSectionTitle: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 4 },
  incidentSectionSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 10, lineHeight: 18 },
  incidentGroupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  incidentGroupLine: { flex: 1, height: 1 },
  incidentGroupTitle: { fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  incidentDivider: { height: 1, marginVertical: 16 },
  evidenceInput: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  evidenceTextInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, padding: 0 },
});
