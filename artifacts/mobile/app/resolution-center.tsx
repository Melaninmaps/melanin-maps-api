import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

// ─── Control Matrix ───────────────────────────────────────────────────────────
const CONTROL_MATRIX = [
  { action: "Upload video",          business: false, user: true,  platform: false },
  { action: "Delete own video",      business: false, user: true,  platform: true  },
  { action: "Respond publicly",      business: true,  user: false, platform: false },
  { action: "Report a video",        business: true,  user: true,  platform: false },
  { action: "Decide removal",        business: false, user: false, platform: true  },
  { action: "Appeal moderation",     business: true,  user: true,  platform: false },
];

// ─── Mock resolutions ─────────────────────────────────────────────────────────
type ResolutionStatus = "awaiting_reviewer" | "resolved" | "under_review" | "no_action";

interface Resolution {
  id: string;
  videoTitle: string;
  creator: string;
  creatorHandle: string;
  date: string;
  status: ResolutionStatus;
  businessResponse: string;
  reviewerReply?: string;
}

const MOCK_RESOLUTIONS: Resolution[] = [
  {
    id: "1",
    videoTitle: "Treme, New Orleans — soul of the city",
    creator: "Dominique Beal",
    creatorHandle: "@dom_explores",
    date: "June 14, 2026",
    status: "resolved",
    businessResponse: "Thank you for visiting. The 45-min wait was during our Juneteenth dinner. We've added front-of-house staff and hope you'll return.",
    reviewerReply: "Went back last week — completely different experience. The owner genuinely listened. This is what accountability looks like. 🙏🏿",
  },
  {
    id: "2",
    videoTitle: "Harlem food crawl — old school & new wave",
    creator: "Janelle Ford",
    creatorHandle: "@janelleeats",
    date: "June 20, 2026",
    status: "awaiting_reviewer",
    businessResponse: "Janelle, your video brought in three new tables this week. We've updated our weekday menu to include the shrimp and grits you highlighted.",
  },
  {
    id: "3",
    videoTitle: "Hidden minority-owned gems in Salvador, Brazil 🇧🇷",
    creator: "Yara Mensah",
    creatorHandle: "@yaratravels",
    date: "June 10, 2026",
    status: "under_review",
    businessResponse: "We have requested a moderation review — the video contains factual inaccuracies about our hours and ownership.",
  },
  {
    id: "4",
    videoTitle: "Sweet Auburn & BeltLine — ATL's Black cultural corridor",
    creator: "Marcus Cole",
    creatorHandle: "@marcusinmotion",
    date: "June 3, 2026",
    status: "no_action",
    businessResponse: "Thank you for showcasing our neighborhood. We appreciate the thoughtful coverage.",
  },
];

const STATUS_META: Record<ResolutionStatus, { label: string; color: string; bg: string; icon: "check-circle" | "clock" | "search" | "minus-circle" }> = {
  resolved:          { label: "Issue Resolved",     color: "#2D7A4F", bg: "#2D7A4F18", icon: "check-circle" },
  awaiting_reviewer: { label: "Awaiting Reviewer",  color: "#C9922B", bg: "#C9922B18", icon: "clock" },
  under_review:      { label: "Under Review",        color: "#442A19", bg: "#442A1918", icon: "search" },
  no_action:         { label: "No Action Needed",    color: "#888",    bg: "#88888818", icon: "minus-circle" },
};

// ─── Notify Reviewer Modal ────────────────────────────────────────────────────
function NotifyModal({ visible, resolution, onClose }: {
  visible: boolean;
  resolution: Resolution | null;
  onClose: () => void;
}) {
  const colors = useColors();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSent(true);
    setTimeout(() => { setSent(false); setMessage(""); onClose(); }, 2500);
  };

  const handleClose = () => { setMessage(""); setSent(false); onClose(); };

  if (!resolution) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={nStyles.overlay}>
        <View style={[nStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[nStyles.handle, { backgroundColor: colors.border }]} />
          {sent ? (
            <View style={nStyles.success}>
              <Feather name="send" size={28} color="#2D7A4F" />
              <Text style={[nStyles.successTitle, { color: colors.foreground }]}>Notification Sent</Text>
              <Text style={[nStyles.successSub, { color: colors.mutedForeground }]}>
                {resolution.creator} has been invited to revisit and update their video. They remain in full control of their content.
              </Text>
            </View>
          ) : (
            <>
              <View style={nStyles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={[nStyles.title, { color: colors.foreground }]}>Invite Reviewer to Revisit</Text>
                  <Text style={[nStyles.sub, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {resolution.videoTitle}
                  </Text>
                </View>
                <TouchableOpacity activeOpacity={0.85} onPress={handleClose} style={nStyles.closeBtn}>
                  <Feather name="x" size={20} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <View style={[nStyles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="info" size={13} color={colors.mutedForeground} />
                <Text style={[nStyles.infoTxt, { color: colors.mutedForeground }]}>
                  The reviewer will receive a notification. They can choose to leave their video unchanged, edit it, add a follow-up, or mark the issue as resolved. They remain in full control.
                </Text>
              </View>

              <Text style={[nStyles.fieldLabel, { color: colors.foreground }]}>Message to reviewer</Text>
              <TextInput
                style={[nStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder={`Hi ${resolution.creator.split(" ")[0]}, we've addressed the concern you raised and would love to have you back. We hope you'll consider updating your video or adding a follow-up.`}
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={5}
                value={message}
                onChangeText={setMessage}
              />
              <Text style={[nStyles.note, { color: colors.mutedForeground }]}>
                You can send one invitation per video. The reviewer is never required to respond.
              </Text>
              <TouchableOpacity
                style={[nStyles.sendBtn, { backgroundColor: message.trim() ? colors.primary : colors.secondary }]}
                onPress={handleSend}
                disabled={!message.trim()}
                activeOpacity={0.85}
              >
                <Feather name="send" size={15} color={message.trim() ? "#fff" : colors.mutedForeground} />
                <Text style={[nStyles.sendTxt, { color: message.trim() ? "#fff" : colors.mutedForeground }]}>
                  Send Invitation
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const nStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 14 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 3 },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  infoTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 13, fontFamily: "Inter_400Regular", minHeight: 100, textAlignVertical: "top" },
  note: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, fontStyle: "italic" },
  sendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 12 },
  sendTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  success: { alignItems: "center", paddingVertical: 40, gap: 12 },
  successTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});

// ─── Resolution card ──────────────────────────────────────────────────────────
function ResolutionCard({
  resolution,
  colors,
  onNotify,
}: {
  resolution: Resolution;
  colors: ReturnType<typeof useColors>;
  onNotify: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[resolution.status];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setExpanded(v => !v); }}
        activeOpacity={0.8}
      >
        <View style={[styles.statusDot, { backgroundColor: meta.bg }]}>
          <Feather name={meta.icon} size={13} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
            {resolution.videoTitle}
          </Text>
          <Text style={[styles.cardCreator, { color: colors.mutedForeground }]}>
            {resolution.creatorHandle} · {resolution.date}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusPillTxt, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.cardBody, { borderTopColor: colors.border }]}>
          {/* Business response */}
          <View style={[styles.responseBlock, { backgroundColor: colors.secondary }]}>
            <View style={styles.responseBlockHeader}>
              <Feather name="briefcase" size={12} color={colors.primary} />
              <Text style={[styles.responseBlockLabel, { color: colors.primary }]}>Your Response</Text>
            </View>
            <Text style={[styles.responseBlockText, { color: colors.foreground }]}>
              {resolution.businessResponse}
            </Text>
          </View>

          {/* Reviewer reply */}
          {resolution.reviewerReply ? (
            <View style={[styles.responseBlock, { backgroundColor: "#2D7A4F12" }]}>
              <View style={styles.responseBlockHeader}>
                <Feather name="message-circle" size={12} color="#2D7A4F" />
                <Text style={[styles.responseBlockLabel, { color: "#2D7A4F" }]}>Reviewer Follow-Up</Text>
              </View>
              <Text style={[styles.responseBlockText, { color: colors.foreground }]}>
                {resolution.reviewerReply}
              </Text>
            </View>
          ) : resolution.status === "awaiting_reviewer" ? (
            <View style={[styles.awaitingNote, { borderColor: colors.border }]}>
              <Feather name="clock" size={13} color="#C9922B" />
              <Text style={[styles.awaitingTxt, { color: colors.mutedForeground }]}>
                Waiting for {resolution.creator.split(" ")[0]} to respond. You can send an invitation to revisit.
              </Text>
            </View>
          ) : null}

          {/* Actions */}
          {resolution.status === "awaiting_reviewer" && (
            <TouchableOpacity
              style={[styles.notifyBtn, { backgroundColor: colors.primary }]}
              onPress={onNotify}
              activeOpacity={0.85}
            >
              <Feather name="send" size={14} color="#fff" />
              <Text style={styles.notifyBtnTxt}>Invite Reviewer to Revisit</Text>
            </TouchableOpacity>
          )}

          {resolution.status === "under_review" && (
            <View style={[styles.reviewingNote, { backgroundColor: "#44291912", borderColor: "#44291930" }]}>
              <Feather name="shield" size={13} color="#442A19" />
              <Text style={[styles.reviewingTxt, { color: "#442A19" }]}>
                Our moderation team is reviewing this video. You'll be notified when a decision is made.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ResolutionCenterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [notifyTarget, setNotifyTarget] = useState<Resolution | null>(null);
  const [filter, setFilter] = useState<ResolutionStatus | "all">("all");

  const filtered = filter === "all"
    ? MOCK_RESOLUTIONS
    : MOCK_RESOLUTIONS.filter(r => r.status === filter);

  const counts = {
    all: MOCK_RESOLUTIONS.length,
    awaiting_reviewer: MOCK_RESOLUTIONS.filter(r => r.status === "awaiting_reviewer").length,
    resolved: MOCK_RESOLUTIONS.filter(r => r.status === "resolved").length,
    under_review: MOCK_RESOLUTIONS.filter(r => r.status === "under_review").length,
    no_action: MOCK_RESOLUTIONS.filter(r => r.status === "no_action").length,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Resolution Center</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Manage your responses and community feedback
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {/* Trust statement */}
        <View style={[styles.trustCard, { backgroundColor: "#2D7A4F", }]}>
          <View style={styles.trustRow}>
            <View style={styles.trustIconWrap}>
              <Feather name="shield" size={18} color="#fff" />
            </View>
            <Text style={styles.trustTitle}>Our Content Integrity Commitment</Text>
          </View>
          <Text style={styles.trustBody}>
            Mapping With Melanin™ does not and will never accept payment to remove, suppress, or deprioritize community videos or reviews. Every piece of community content is governed by the same transparent process — regardless of who posted it or who is named in it.
          </Text>
        </View>

        {/* Control matrix */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Who controls what</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Influence over community content is deliberately distributed. No single party has unilateral control.
          </Text>
          <View style={[styles.matrixTable, { borderColor: colors.border }]}>
            {/* Column headers */}
            <View style={[styles.matrixHeaderRow, { borderBottomColor: colors.border, backgroundColor: colors.secondary }]}>
              <Text style={[styles.matrixHeaderAction, { color: colors.mutedForeground }]}>Action</Text>
              <Text style={[styles.matrixHeaderCol, { color: colors.mutedForeground }]}>Business</Text>
              <Text style={[styles.matrixHeaderCol, { color: colors.mutedForeground }]}>User</Text>
              <Text style={[styles.matrixHeaderCol, { color: colors.mutedForeground }]}>Platform</Text>
            </View>
            {CONTROL_MATRIX.map((row, i) => (
              <View
                key={row.action}
                style={[
                  styles.matrixRow,
                  { borderBottomColor: colors.border },
                  i === CONTROL_MATRIX.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={[styles.matrixAction, { color: colors.foreground }]}>{row.action}</Text>
                <View style={styles.matrixCheckCell}>
                  {row.business
                    ? <Feather name="check" size={14} color="#2D7A4F" />
                    : <Feather name="minus" size={14} color={colors.border} />}
                </View>
                <View style={styles.matrixCheckCell}>
                  {row.user
                    ? <Feather name="check" size={14} color="#2D7A4F" />
                    : <Feather name="minus" size={14} color={colors.border} />}
                </View>
                <View style={styles.matrixCheckCell}>
                  {row.platform
                    ? <Feather name="check" size={14} color="#2D7A4F" />
                    : <Feather name="minus" size={14} color={colors.border} />}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* How the resolution flow works */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How resolution works</Text>
          {[
            { step: "1", icon: "video" as const, title: "Community member posts a video", body: "The video is their content, subject to our platform license. You cannot delete it." },
            { step: "2", icon: "message-square" as const, title: "You respond publicly", body: "Acknowledge the feedback, clarify inaccuracies, or explain what you've changed. Future customers see both sides." },
            { step: "3", icon: "check-circle" as const, title: "You mark it as resolved", body: "Once you've addressed the issue, mark it resolved and optionally invite the reviewer back." },
            { step: "4", icon: "send" as const, title: "Reviewer gets an invitation", body: "They can leave the video unchanged, edit it, add a follow-up, or confirm the issue is resolved. They decide." },
            { step: "5", icon: "award" as const, title: "Issue Resolved badge appears", body: "When the reviewer confirms, a visible badge is added. How you handle criticism is as telling as the criticism itself." },
          ].map((s) => (
            <View key={s.step} style={styles.flowRow}>
              <View style={[styles.flowStepNum, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[styles.flowStepNumTxt, { color: colors.primary }]}>{s.step}</Text>
              </View>
              <View style={[styles.flowIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={s.icon} size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.flowTitle, { color: colors.foreground }]}>{s.title}</Text>
                <Text style={[styles.flowBody, { color: colors.mutedForeground }]}>{s.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Resolution list */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your resolutions</Text>

          {/* Filter chips */}
          <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {([
              { key: "all", label: `All (${counts.all})` },
              { key: "awaiting_reviewer", label: `Awaiting (${counts.awaiting_reviewer})` },
              { key: "resolved", label: `Resolved (${counts.resolved})` },
              { key: "under_review", label: `Under Review (${counts.under_review})` },
              { key: "no_action", label: `No Action (${counts.no_action})` },
            ] as const).map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, filter === f.key && { backgroundColor: colors.primary }]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipTxt, { color: filter === f.key ? "#fff" : colors.mutedForeground }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ gap: 10 }}>
            {filtered.map((r) => (
              <ResolutionCard
                key={r.id}
                resolution={r}
                colors={colors}
                onNotify={() => setNotifyTarget(r)}
              />
            ))}
          </View>
        </View>

        {/* Appeal section */}
        <View style={[styles.appealCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="flag" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.appealTitle, { color: colors.foreground }]}>Disagree with a moderation decision?</Text>
            <Text style={[styles.appealSub, { color: colors.mutedForeground }]}>
              Both businesses and creators have the right to appeal. Decisions are reviewed by a second member of our team.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.appealBtn, { borderColor: colors.primary }]}
            onPress={() => Alert.alert("Appeals", "Appeal submissions open in the next update. All decisions can be appealed within 30 days.")}
            activeOpacity={0.8}
          >
            <Text style={[styles.appealBtnTxt, { color: colors.primary }]}>Appeal</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <NotifyModal
        visible={notifyTarget !== null}
        resolution={notifyTarget}
        onClose={() => setNotifyTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  trustCard: {
    margin: 16, borderRadius: 16, padding: 18, gap: 12,
  },
  trustRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  trustIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  trustTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff", flex: 1 },
  trustBody: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)", lineHeight: 20 },
  section: { paddingHorizontal: 16, marginBottom: 24, gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginTop: -4 },
  matrixTable: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  matrixHeaderRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1,
  },
  matrixHeaderAction: { flex: 2, fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  matrixHeaderCol: { width: 64, textAlign: "center", fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  matrixRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1,
  },
  matrixAction: { flex: 2, fontSize: 13, fontFamily: "Inter_400Regular" },
  matrixCheckCell: { width: 64, alignItems: "center" },
  flowRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  flowStepNum: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginTop: 2,
  },
  flowStepNumTxt: { fontSize: 12, fontFamily: "Inter_700Bold" },
  flowIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  flowTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  flowBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  filterRow: { gap: 8, paddingRight: 4 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#88888818",
  },
  filterChipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  statusDot: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18, marginBottom: 2 },
  cardCreator: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPillTxt: { fontSize: 10, fontFamily: "Inter_700Bold" },
  cardBody: { borderTopWidth: 1, padding: 14, gap: 10 },
  responseBlock: { borderRadius: 10, padding: 12, gap: 6 },
  responseBlockHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  responseBlockLabel: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.4 },
  responseBlockText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  awaitingNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    borderWidth: 1, borderRadius: 10, padding: 10,
  },
  awaitingTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  notifyBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 10,
  },
  notifyBtnTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  reviewingNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 10, borderRadius: 10, borderWidth: 1,
  },
  reviewingTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  appealCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginBottom: 8, padding: 16,
    borderRadius: 14, borderWidth: 1,
  },
  appealTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  appealSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  appealBtn: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  appealBtnTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
