import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { VideoReportModal } from "@/components/VideoReportModal";
import { ReviewRequestModal } from "@/components/ReviewRequestModal";

export interface VideoItem {
  id: string;
  title: string;
  destination: string;
  country: string;
  creator: string;
  creatorHandle: string;
  duration: string;
  views: string;
  likes: string;
  thumbColor: string;
  thumbEmoji: string;
  featured?: boolean;
  businessResponse?: {
    responder: string;
    role: string;
    text: string;
    date: string;
  };
  issueResolved?: {
    resolvedDate: string;
    creatorFollowUp: string;
  };
}

interface Props {
  visible: boolean;
  video: VideoItem | null;
  onClose: () => void;
}

export function VideoDetailModal({ visible, video, onClose }: Props) {
  const colors = useColors();
  const [liked, setLiked] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showReviewRequest, setShowReviewRequest] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [responseSubmitted, setResponseSubmitted] = useState(false);
  const [markedResolved, setMarkedResolved] = useState(false);

  if (!video) return null;

  const handleLike = () => {
    setLiked((v) => !v);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const handleResponseSubmit = () => {
    if (!responseText.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setResponseSubmitted(true);
    setShowResponseForm(false);
  };

  const handleClose = () => {
    setShowResponseForm(false);
    setResponseText("");
    setResponseSubmitted(false);
    setMarkedResolved(false);
    setLiked(false);
    onClose();
  };

  const isResolved = !!(video.issueResolved || markedResolved);

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
              {/* Video thumbnail placeholder */}
              <View style={[styles.videoThumb, { backgroundColor: video.thumbColor }]}>
                <Text style={styles.videoThumbEmoji}>{video.thumbEmoji}</Text>
                <View style={styles.playOverlay}>
                  <View style={styles.playBtn}>
                    <Feather name="play" size={24} color="#fff" />
                  </View>
                </View>
                <View style={[styles.durationPill, { backgroundColor: "rgba(0,0,0,0.65)" }]}>
                  <Text style={styles.durationTxt}>{video.duration}</Text>
                </View>
              </View>

              <View style={styles.body}>
                {/* Title & close */}
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={3}>
                    {video.title}
                  </Text>
                  <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                    <Feather name="x" size={20} color={colors.foreground} />
                  </TouchableOpacity>
                </View>

                {/* Creator info */}
                <View style={styles.creatorRow}>
                  <View style={[styles.creatorDot, { backgroundColor: video.thumbColor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.creatorName, { color: colors.foreground }]}>{video.creator}</Text>
                    <Text style={[styles.creatorHandle, { color: colors.mutedForeground }]}>{video.creatorHandle}</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <Feather name="eye" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.statTxt, { color: colors.mutedForeground }]}>{video.views}</Text>
                  </View>
                </View>

                {/* Action bar */}
                <View style={[styles.actionBar, { borderColor: colors.border }]}>
                  <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.75}>
                    <Feather name={liked ? "heart" : "heart"} size={18} color={liked ? "#E53E3E" : colors.mutedForeground} />
                    <Text style={[styles.actionTxt, { color: liked ? "#E53E3E" : colors.mutedForeground }]}>
                      {liked ? "Liked" : "Like"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.75}>
                    <Feather name="share-2" size={18} color={colors.mutedForeground} />
                    <Text style={[styles.actionTxt, { color: colors.mutedForeground }]}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.75}>
                    <Feather name="bookmark" size={18} color={colors.mutedForeground} />
                    <Text style={[styles.actionTxt, { color: colors.mutedForeground }]}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setShowReport(true)}
                    activeOpacity={0.75}
                  >
                    <Feather name="flag" size={18} color={colors.mutedForeground} />
                    <Text style={[styles.actionTxt, { color: colors.mutedForeground }]}>Report</Text>
                  </TouchableOpacity>
                </View>

                {/* Location */}
                <View style={styles.locationRow}>
                  <Feather name="map-pin" size={13} color={colors.primary} />
                  <Text style={[styles.locationTxt, { color: colors.primary }]}>
                    {video.destination}, {video.country}
                  </Text>
                </View>

                {/* Content policy note */}
                <View style={[styles.policyBar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Feather name="shield" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.policyTxt, { color: colors.mutedForeground }]}>
                    This is community content. Businesses cannot pay to remove or suppress videos. They may respond publicly, report to our moderation team, or request a formal review.
                  </Text>
                </View>

                {/* ── Issue Resolved Banner ── */}
                {isResolved && (
                  <View style={styles.resolvedBanner}>
                    <View style={styles.resolvedBannerTop}>
                      <View style={styles.resolvedIconWrap}>
                        <Feather name="check-circle" size={18} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resolvedTitle}>Issue Resolved</Text>
                        <Text style={styles.resolvedDate}>
                          {video.issueResolved?.resolvedDate ?? "Recently"}
                        </Text>
                      </View>
                    </View>
                    {(video.issueResolved?.creatorFollowUp || markedResolved) && (
                      <View style={styles.resolvedFollowUp}>
                        <Feather name="message-circle" size={12} color="#2D7A4F" />
                        <Text style={styles.resolvedFollowUpTxt}>
                          {markedResolved && !video.issueResolved
                            ? "The business acknowledged this feedback and took action. The creator marked this issue as resolved."
                            : video.issueResolved?.creatorFollowUp}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.resolvedNote}>
                      This badge means the creator returned, saw the business's response, and confirmed the issue was addressed.
                    </Text>
                  </View>
                )}

                {/* Business Response card */}
                {(video.businessResponse || responseSubmitted) && (
                  <View style={[styles.responseCard, { backgroundColor: colors.card, borderColor: isResolved ? "#2D7A4F40" : colors.border }]}>
                    <View style={styles.responseHeader}>
                      <View style={[styles.responseIcon, { backgroundColor: colors.primary + "18" }]}>
                        <Feather name="briefcase" size={14} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.responseFrom, { color: colors.foreground }]}>
                          {responseSubmitted && !video.businessResponse
                            ? "Business Response"
                            : video.businessResponse?.responder ?? "Business Response"}
                        </Text>
                        <Text style={[styles.responseRole, { color: colors.mutedForeground }]}>
                          {responseSubmitted && !video.businessResponse
                            ? "Owner · Just now"
                            : `${video.businessResponse?.role ?? "Owner"} · ${video.businessResponse?.date ?? ""}`}
                        </Text>
                      </View>
                      <View style={[styles.verifiedBadge, { backgroundColor: colors.primary + "18" }]}>
                        <Text style={[styles.verifiedTxt, { color: colors.primary }]}>Verified</Text>
                      </View>
                    </View>
                    <Text style={[styles.responseText, { color: colors.foreground }]}>
                      {responseSubmitted && !video.businessResponse
                        ? responseText
                        : video.businessResponse?.text}
                    </Text>

                    {/* Mark as Resolved — shown when there's a response but not yet resolved */}
                    {(video.businessResponse || responseSubmitted) && !isResolved && (
                      <TouchableOpacity
                        style={styles.markResolvedBtn}
                        onPress={() => {
                          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          setMarkedResolved(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Feather name="check-circle" size={14} color="#2D7A4F" />
                        <Text style={styles.markResolvedTxt}>Mark as Resolved — the business addressed my concern</Text>
                      </TouchableOpacity>
                    )}

                    <View style={[styles.responseFooter, { borderTopColor: colors.border }]}>
                      <Feather name="info" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.responseFooterTxt, { color: colors.mutedForeground }]}>
                        Business responses are visible to all users and cannot alter the original video.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Business actions row — Request Review */}
                {(video.businessResponse || responseSubmitted) && (
                  <TouchableOpacity
                    style={[styles.reviewRequestBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                    onPress={() => setShowReviewRequest(true)}
                    activeOpacity={0.8}
                  >
                    <Feather name="search" size={15} color={colors.mutedForeground} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reviewRequestLabel, { color: colors.foreground }]}>Request a Moderation Review</Text>
                      <Text style={[styles.reviewRequestSub, { color: colors.mutedForeground }]}>
                        If you believe this video violates our policies, request a human review.
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}

                {/* Add Business Response CTA */}
                {!responseSubmitted && !video.businessResponse && !showResponseForm && (
                  <View style={styles.businessActionsCol}>
                    <TouchableOpacity
                      style={[styles.addResponseBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                      onPress={() => setShowResponseForm(true)}
                      activeOpacity={0.8}
                    >
                      <Feather name="message-square" size={16} color={colors.primary} />
                      <Text style={[styles.addResponseTxt, { color: colors.primary }]}>
                        Add a Business Response
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.reviewRequestBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                      onPress={() => setShowReviewRequest(true)}
                      activeOpacity={0.8}
                    >
                      <Feather name="search" size={15} color={colors.mutedForeground} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reviewRequestLabel, { color: colors.foreground }]}>Request a Moderation Review</Text>
                        <Text style={[styles.reviewRequestSub, { color: colors.mutedForeground }]}>
                          If you believe this video violates our policies, request a human review.
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Response form */}
                {showResponseForm && (
                  <View style={[styles.responseForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.responseFormTitle, { color: colors.foreground }]}>
                      Respond as the Business
                    </Text>
                    <Text style={[styles.responseFormNote, { color: colors.mutedForeground }]}>
                      Your response will be visible to all users. It cannot be used to alter or remove the original video.
                    </Text>
                    <TextInput
                      style={[styles.responseInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                      placeholder="Thank the reviewer, clarify any inaccuracies, or address their concerns professionally..."
                      placeholderTextColor={colors.mutedForeground}
                      multiline
                      numberOfLines={5}
                      value={responseText}
                      onChangeText={setResponseText}
                    />
                    <View style={styles.responseFormBtns}>
                      <TouchableOpacity
                        style={[styles.responseFormCancel, { borderColor: colors.border }]}
                        onPress={() => { setShowResponseForm(false); setResponseText(""); }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.responseFormCancelTxt, { color: colors.mutedForeground }]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.responseFormSubmit, { backgroundColor: responseText.trim() ? colors.primary : colors.secondary }]}
                        onPress={handleResponseSubmit}
                        disabled={!responseText.trim()}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.responseFormSubmitTxt, { color: responseText.trim() ? "#fff" : colors.mutedForeground }]}>
                          Post Response
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={{ height: 32 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <VideoReportModal
        visible={showReport}
        videoTitle={video.title}
        onClose={() => setShowReport(false)}
      />

      <ReviewRequestModal
        visible={showReviewRequest}
        videoTitle={video.title}
        onClose={() => setShowReviewRequest(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%" },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginVertical: 12 },
  videoThumb: {
    height: 210, alignItems: "center", justifyContent: "center",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  videoThumbEmoji: { fontSize: 52, opacity: 0.6 },
  playOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  playBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
    paddingLeft: 3,
  },
  durationPill: {
    position: "absolute", bottom: 12, right: 12,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  durationTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  body: { padding: 20, gap: 14 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold", lineHeight: 24 },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  creatorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  creatorDot: { width: 10, height: 10, borderRadius: 5 },
  creatorName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  creatorHandle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statTxt: { fontSize: 13, fontFamily: "Inter_400Regular" },
  actionBar: {
    flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1,
    paddingVertical: 10,
  },
  actionBtn: { flex: 1, alignItems: "center", gap: 4 },
  actionTxt: { fontSize: 11, fontFamily: "Inter_500Medium" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  policyBar: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  policyTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  responseCard: {
    borderRadius: 14, borderWidth: 1, overflow: "hidden", gap: 12, padding: 14,
  },
  responseHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  responseIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  responseFrom: { fontSize: 14, fontFamily: "Inter_700Bold" },
  responseRole: { fontSize: 12, fontFamily: "Inter_400Regular" },
  verifiedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  verifiedTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  responseText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  responseFooter: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    borderTopWidth: 1, paddingTop: 10, marginTop: 2,
  },
  responseFooterTxt: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, fontStyle: "italic" },
  addResponseBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16,
  },
  addResponseTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  responseForm: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  responseFormTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  responseFormNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  responseInput: {
    borderWidth: 1, borderRadius: 10, padding: 12,
    fontSize: 14, fontFamily: "Inter_400Regular",
    minHeight: 110, textAlignVertical: "top",
  },
  responseFormBtns: { flexDirection: "row", gap: 10 },
  responseFormCancel: {
    flex: 1, borderWidth: 1, borderRadius: 10,
    alignItems: "center", paddingVertical: 12,
  },
  responseFormCancelTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  responseFormSubmit: {
    flex: 2, borderRadius: 10, alignItems: "center", paddingVertical: 12,
  },
  responseFormSubmitTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  resolvedBanner: {
    borderRadius: 14, backgroundColor: "#2D7A4F", padding: 14, gap: 10,
  },
  resolvedBannerTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  resolvedIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  resolvedTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  resolvedDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)" },
  resolvedFollowUp: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, padding: 10,
  },
  resolvedFollowUpTxt: {
    flex: 1, fontSize: 13, fontFamily: "Inter_400Regular",
    color: "#fff", lineHeight: 19, fontStyle: "italic",
  },
  resolvedNote: {
    fontSize: 11, fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)", lineHeight: 16,
  },
  markResolvedBtn: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#2D7A4F12", borderRadius: 10, padding: 10, marginTop: 4,
  },
  markResolvedTxt: {
    flex: 1, fontSize: 13, fontFamily: "Inter_500Medium",
    color: "#2D7A4F", lineHeight: 18,
  },
  businessActionsCol: { gap: 10 },
  reviewRequestBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
  },
  reviewRequestLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  reviewRequestSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
});
