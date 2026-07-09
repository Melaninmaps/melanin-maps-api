import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

const TOTAL_STEPS = 8;

const RELATIONSHIP_OPTIONS = [
  "Current Employee",
  "Former Employee",
  "Job Applicant",
  "Contractor",
  "Intern",
  "Customer",
];

const RECOMMEND_OPTIONS = [
  "Definitely",
  "Probably",
  "Unsure",
  "Probably Not",
  "Definitely Not",
];

const RETALIATION_OPTIONS = [
  "Never",
  "Rarely",
  "Sometimes",
  "Often",
  "Very Often",
];

function Chip({ label, selected, onPress, color, primaryForeground, secondary, border, foreground }: {
  label: string; selected: boolean; onPress: () => void;
  color: string; primaryForeground: string; secondary: string; border: string; foreground: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: selected ? color : secondary, borderColor: selected ? color : border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {selected && <Feather name="check" size={11} color={primaryForeground} style={{ marginRight: 3 }} />}
      <Text style={[styles.chipTxt, { color: selected ? primaryForeground : foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StarRating({ value, onChange, color, border, secondary, foreground }: {
  value: number; onChange: (v: number) => void;
  color: string; border: string; secondary: string; foreground: string;
}) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => { onChange(n); if (Platform.OS !== "web") Haptics.selectionAsync(); }} activeOpacity={0.7}>
          <Text style={[styles.star, { color: n <= value ? "#F59E0B" : border }]}>★</Text>
        </TouchableOpacity>
      ))}
      {value > 0 && (
        <Text style={[styles.starLabel, { color: foreground }]}>
          {value === 1 ? "Poor" : value === 2 ? "Fair" : value === 3 ? "Good" : value === 4 ? "Very Good" : "Excellent"}
        </Text>
      )}
    </View>
  );
}

function RatingRow({ label, value, onChange, color, border, secondary, foreground }: {
  label: string; value: number; onChange: (v: number) => void;
  color: string; border: string; secondary: string; foreground: string;
}) {
  return (
    <View style={styles.ratingRow}>
      <Text style={[styles.ratingLabel, { color: foreground }]}>{label}</Text>
      <StarRating value={value} onChange={onChange} color={color} border={border} secondary={secondary} foreground={foreground} />
    </View>
  );
}

function SectionHeader({ emoji, title, sub, foreground, mutedForeground }: {
  emoji: string; title: string; sub: string; foreground: string; mutedForeground: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.stepTitle, { color: foreground }]}>{emoji} {title}</Text>
      <Text style={[styles.stepSub, { color: mutedForeground }]}>{sub}</Text>
    </View>
  );
}

type Ratings = Record<string, number>;

export default function EmployerSurveyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  // Step 1
  const [relationship, setRelationship] = useState("");

  // Step 2 — Overall Experience
  const [overallRating, setOverallRating] = useState(0);
  const [recommend, setRecommend] = useState("");

  // Step 3 — Respect & Inclusion
  const [respect, setRespect] = useState<Ratings>({
    feltRespected: 0,
    feltWelcomed: 0,
    leadershipFair: 0,
    comfortableMyself: 0,
  });

  // Step 4 — Growth & Opportunity
  const [growth, setGrowth] = useState<Ratings>({
    promotionsMerit: 0,
    devOpportunities: 0,
    managementInvested: 0,
  });

  // Step 5 — Management
  const [management, setManagement] = useState<Ratings>({
    communicatedEffectively: 0,
    concernsTakenSeriously: 0,
    actedProfessionally: 0,
  });

  // Step 6 — Work Environment
  const [environment, setEnvironment] = useState<Ratings>({
    physicallySafe: 0,
    emotionallySafe: 0,
    policiesConsistent: 0,
    workLifeBalance: 0,
  });

  // Step 7 — Diversity & Belonging
  const [diversity, setDiversity] = useState<Ratings>({
    equalOpportunities: 0,
    inclusiveLeadership: 0,
    perspectivesValued: 0,
  });

  // Step 8 — Accountability
  const [accountability, setAccountability] = useState<Ratings>({
    managementAddressed: 0,
  });
  const [retaliation, setRetaliation] = useState("");

  const set = (setter: React.Dispatch<React.SetStateAction<Ratings>>, key: string) => (v: number) =>
    setter((prev) => ({ ...prev, [key]: v }));

  const allFilled = (r: Ratings) => Object.values(r).every((v) => v > 0);

  const canGoNext =
    step === 1 ? relationship.length > 0 :
    step === 2 ? overallRating > 0 && recommend.length > 0 :
    step === 3 ? allFilled(respect) :
    step === 4 ? allFilled(growth) :
    step === 5 ? allFilled(management) :
    step === 6 ? allFilled(environment) :
    step === 7 ? allFilled(diversity) :
    accountability.managementAddressed > 0 && retaliation.length > 0;

  const next = () => setStep((s) => s + 1);

  const handleSubmit = () => {
    setSubmitted(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const C = {
    color: colors.primary,
    primaryForeground: colors.primaryForeground,
    secondary: colors.secondary,
    border: colors.border,
    foreground: colors.foreground,
    mutedForeground: colors.mutedForeground,
  };

  if (submitted) {
    const avgOverall = overallRating;
    const avgRespect = Math.round(Object.values(respect).reduce((a, b) => a + b, 0) / Object.values(respect).length * 10) / 10;
    const avgGrowth = Math.round(Object.values(growth).reduce((a, b) => a + b, 0) / Object.values(growth).length * 10) / 10;

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.doneWrap, { paddingTop: topPad }]}>
          <View style={[styles.doneCircle, { backgroundColor: colors.success + "20" }]}>
            <Feather name="check-circle" size={56} color={colors.success} />
          </View>
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>Review Submitted!</Text>
          <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
            Thank you for sharing your experience. Your review helps the community make informed decisions.
          </Text>
          <View style={[styles.summaryRow, { backgroundColor: colors.secondary }]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: colors.primary }]}>{"★".repeat(avgOverall)}</Text>
              <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>Overall</Text>
            </View>
            <View style={[styles.profileDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: colors.primary }]}>{avgRespect}/5</Text>
              <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>Inclusion</Text>
            </View>
            <View style={[styles.profileDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: colors.primary }]}>{avgGrowth}/5</Text>
              <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>Growth</Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
          >
            <Text style={[styles.doneBtnTxt, { color: colors.primaryForeground }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const stepLabels = [
    "Your Role",
    "Overall",
    "Respect & Inclusion",
    "Growth",
    "Management",
    "Work Environment",
    "Diversity",
    "Accountability",
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.back}
          onPress={() => step > 1 ? setStep((s) => s - 1) : router.canGoBack() ? router.back() : router.replace("/(tabs)")}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Rate Your Employer</Text>
          <Text style={[styles.headerStep, { color: colors.mutedForeground }]}>{stepLabels[step - 1]} · {step} of {TOTAL_STEPS}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${(step / TOTAL_STEPS) * 100}%` as any }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1 — Relationship */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <SectionHeader emoji="👤" title="Your Role" sub="What best describes your relationship with this employer?" foreground={colors.foreground} mutedForeground={colors.mutedForeground} />
            <View style={styles.chips}>
              {RELATIONSHIP_OPTIONS.map((r) => (
                <Chip key={r} label={r} selected={relationship === r}
                  onPress={() => { setRelationship(r); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                  {...C} />
              ))}
            </View>
            {relationship === "Customer" && (
              <View style={[styles.noteBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                <Feather name="info" size={14} color={colors.primary} />
                <Text style={[styles.noteText, { color: colors.primary }]}>Customer reviews are included separately in employer reports.</Text>
              </View>
            )}
          </View>
        )}

        {/* Step 2 — Overall Experience */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <SectionHeader emoji="⭐" title="Overall Experience" sub="Rate your overall experience and likelihood to recommend." foreground={colors.foreground} mutedForeground={colors.mutedForeground} />
            <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.ratingCardLabel, { color: colors.foreground }]}>Overall, how would you rate your experience with this employer?</Text>
              <StarRating value={overallRating} onChange={setOverallRating} {...C} />
            </View>
            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Would you recommend this employer to someone you care about?</Text>
              <View style={{ gap: 8 }}>
                {RECOMMEND_OPTIONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.optionCard, { backgroundColor: recommend === r ? colors.primary + "12" : colors.card, borderColor: recommend === r ? colors.primary : colors.border }]}
                    onPress={() => { setRecommend(r); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.optionTxt, { color: recommend === r ? colors.primary : colors.foreground }]}>{r}</Text>
                    {recommend === r && <Feather name="check-circle" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 3 — Respect & Inclusion */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <SectionHeader emoji="🤝" title="Respect & Inclusion" sub="Rate each statement from 1 (strongly disagree) to 5 (strongly agree)." foreground={colors.foreground} mutedForeground={colors.mutedForeground} />
            <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <RatingRow label="I felt respected regardless of my background." value={respect.feltRespected} onChange={set(setRespect, "feltRespected")} {...C} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <RatingRow label="I felt welcomed and included in the workplace." value={respect.feltWelcomed} onChange={set(setRespect, "feltWelcomed")} {...C} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <RatingRow label="Leadership treated employees fairly." value={respect.leadershipFair} onChange={set(setRespect, "leadershipFair")} {...C} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <RatingRow label="I felt comfortable being myself at work." value={respect.comfortableMyself} onChange={set(setRespect, "comfortableMyself")} {...C} />
            </View>
          </View>
        )}

        {/* Step 4 — Growth & Opportunity */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <SectionHeader emoji="📈" title="Growth & Opportunity" sub="Rate each statement from 1 (strongly disagree) to 5 (strongly agree)." foreground={colors.foreground} mutedForeground={colors.mutedForeground} />
            <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <RatingRow label="Promotions were based on merit." value={growth.promotionsMerit} onChange={set(setGrowth, "promotionsMerit")} {...C} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <RatingRow label="Professional development opportunities were available." value={growth.devOpportunities} onChange={set(setGrowth, "devOpportunities")} {...C} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <RatingRow label="Management invested in employee growth." value={growth.managementInvested} onChange={set(setGrowth, "managementInvested")} {...C} />
            </View>
          </View>
        )}

        {/* Step 5 — Management */}
        {step === 5 && (
          <View style={styles.stepContent}>
            <SectionHeader emoji="🧭" title="Management" sub="Rate each statement from 1 (strongly disagree) to 5 (strongly agree)." foreground={colors.foreground} mutedForeground={colors.mutedForeground} />
            <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <RatingRow label="Management communicated effectively." value={management.communicatedEffectively} onChange={set(setManagement, "communicatedEffectively")} {...C} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <RatingRow label="Concerns were taken seriously." value={management.concernsTakenSeriously} onChange={set(setManagement, "concernsTakenSeriously")} {...C} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <RatingRow label="Leadership acted professionally." value={management.actedProfessionally} onChange={set(setManagement, "actedProfessionally")} {...C} />
            </View>
          </View>
        )}

        {/* Step 6 — Work Environment */}
        {step === 6 && (
          <View style={styles.stepContent}>
            <SectionHeader emoji="🏢" title="Work Environment" sub="Rate each statement from 1 (strongly disagree) to 5 (strongly agree)." foreground={colors.foreground} mutedForeground={colors.mutedForeground} />
            <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <RatingRow label="The workplace felt physically safe." value={environment.physicallySafe} onChange={set(setEnvironment, "physicallySafe")} {...C} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <RatingRow label="The workplace felt emotionally safe." value={environment.emotionallySafe} onChange={set(setEnvironment, "emotionallySafe")} {...C} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <RatingRow label="Policies were applied consistently." value={environment.policiesConsistent} onChange={set(setEnvironment, "policiesConsistent")} {...C} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <RatingRow label="Work-life balance was respected." value={environment.workLifeBalance} onChange={set(setEnvironment, "workLifeBalance")} {...C} />
            </View>
          </View>
        )}

        {/* Step 7 — Diversity & Belonging */}
        {step === 7 && (
          <View style={styles.stepContent}>
            <SectionHeader emoji="🌍" title="Diversity & Belonging" sub="Rate each statement from 1 (strongly disagree) to 5 (strongly agree)." foreground={colors.foreground} mutedForeground={colors.mutedForeground} />
            <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <RatingRow label="People from different backgrounds had equal opportunities." value={diversity.equalOpportunities} onChange={set(setDiversity, "equalOpportunities")} {...C} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <RatingRow label="I witnessed inclusive leadership." value={diversity.inclusiveLeadership} onChange={set(setDiversity, "inclusiveLeadership")} {...C} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <RatingRow label="Different perspectives were valued." value={diversity.perspectivesValued} onChange={set(setDiversity, "perspectivesValued")} {...C} />
            </View>
          </View>
        )}

        {/* Step 8 — Accountability */}
        {step === 8 && (
          <View style={styles.stepContent}>
            <SectionHeader emoji="⚖️" title="Accountability" sub="These questions help surface workplace accountability patterns." foreground={colors.foreground} mutedForeground={colors.mutedForeground} />
            <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <RatingRow label="If problems occurred, management addressed them appropriately." value={accountability.managementAddressed} onChange={set(setAccountability, "managementAddressed")} {...C} />
            </View>
            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Retaliation against employees was a concern.</Text>
              <View style={{ gap: 8 }}>
                {RETALIATION_OPTIONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.optionCard, { backgroundColor: retaliation === r ? colors.primary + "12" : colors.card, borderColor: retaliation === r ? colors.primary : colors.border }]}
                    onPress={() => { setRetaliation(r); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.optionTxt, { color: retaliation === r ? colors.primary : colors.foreground }]}>{r}</Text>
                    {retaliation === r && <Feather name="check-circle" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {step < TOTAL_STEPS ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.nextBtn, { backgroundColor: canGoNext ? colors.primary : colors.muted }]}
            onPress={next}
            disabled={!canGoNext}
          >
            <Text style={[styles.nextTxt, { color: canGoNext ? colors.primaryForeground : colors.mutedForeground }]}>Continue</Text>
            <Feather name="arrow-right" size={18} color={canGoNext ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.nextBtn, { backgroundColor: canGoNext ? colors.primary : colors.muted }]}
            onPress={handleSubmit}
            disabled={!canGoNext}
          >
            <Feather name="check" size={18} color={canGoNext ? colors.primaryForeground : colors.mutedForeground} />
            <Text style={[styles.nextTxt, { color: canGoNext ? colors.primaryForeground : colors.mutedForeground }]}>Submit Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerStep: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  progressTrack: { height: 3 },
  progressFill: { height: 3 },
  scroll: { padding: 20 },
  stepContent: { gap: 20 },
  sectionHeader: { gap: 6 },
  stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30 },
  stepSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  qBlock: { gap: 10 },
  qLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 22 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  chipTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
  ratingCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 16 },
  ratingCardLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 22 },
  ratingRow: { gap: 10 },
  ratingLabel: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 22 },
  stars: { flexDirection: "row", alignItems: "center", gap: 6 },
  star: { fontSize: 28 },
  starLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginLeft: 4 },
  divider: { height: 1 },
  optionCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  optionTxt: { fontSize: 15, fontFamily: "Inter_500Medium" },
  noteBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  noteText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 17, borderRadius: 16 },
  nextTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 18 },
  doneCircle: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  doneSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 23 },
  summaryRow: { flexDirection: "row", borderRadius: 16, padding: 16, alignSelf: "stretch" },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryVal: { fontSize: 15, fontFamily: "Inter_700Bold" },
  summaryKey: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  profileDivider: { width: 1, marginVertical: 4 },
  doneBtn: { alignItems: "center", paddingVertical: 17, paddingHorizontal: 40, borderRadius: 16 },
  doneBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
