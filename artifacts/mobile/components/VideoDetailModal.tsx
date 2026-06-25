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
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [responseSubmitted, setResponseSubmitted] = useState(false);

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
    setLiked(false);
    onClose();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <ScrollView showsVerticalScrollIndicator={false}>
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
                    This is community content. Businesses cannot remove videos — they may respond publicly or report to our moderation team.
                  </Text>
                </View>

                {/* Business Response — existing */}
                {(video.businessResponse || responseSubmitted) && (
                  <View style={[styles.responseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                    <View style={[styles.responseFooter, { borderTopColor: colors.border }]}>
                      <Feather name="info" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.responseFooterTxt, { color: colors.mutedForeground }]}>
                        Business responses are visible to all users and cannot alter the original video.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Add Business Response CTA — mock: any user can "demo" this */}
                {!responseSubmitted && !video.businessResponse && !showResponseForm && (
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
    ...StyleSheet.absoluteFillObject,
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
});
