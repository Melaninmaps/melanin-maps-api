import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  kinfolkVoiceSourceFailureMessage,
  type KinfolkVoiceSourceFailure,
} from "@/lib/kinfolkVoiceSourceContract";
import type { KinfolkVoiceSourceController } from "@/hooks/useKinfolkVoiceSource";

export type KinfolkVoiceSourceControlsProps = Readonly<{
  source: KinfolkVoiceSourceController;
  /** Places the reviewed text in the host composer; it must not send a turn. */
  onUseTranscript: (transcript: string) => void | Promise<void>;
}>;

function isPermissionFailure(failure: KinfolkVoiceSourceFailure | null): boolean {
  return failure === "permission_denied" || failure === "permission_unavailable";
}

/**
 * Focused renderer for use beside a Kinfolk text composer. It intentionally
 * knows nothing about chat rendering or sending: member review is required.
 */
export function KinfolkVoiceSourceControls({
  source,
  onUseTranscript,
}: KinfolkVoiceSourceControlsProps) {
  const colors = useColors();
  const [renderError, setRenderError] = useState<string | null>(null);
  const { state } = source;
  const isBusy = state.phase === "requesting_permission"
    || state.phase === "starting"
    || state.phase === "stopping"
    || state.phase === "uploading";

  useEffect(() => {
    if (state.phase !== "review") setRenderError(null);
  }, [state.phase]);

  const useTranscript = async () => {
    const transcript = state.transcript.trim();
    if (!transcript) return;
    setRenderError(null);
    try {
      await onUseTranscript(transcript);
      source.clearTranscript();
    } catch {
      // Keep the editable transcript available. A host-render failure must not
      // lose a member's words or cause the transcript to be sent automatically.
      setRenderError(kinfolkVoiceSourceFailureMessage("transcript_render_failed"));
    }
  };

  if (!source.isNative) return null;

  return (
    <View style={[styles.root, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Ask Kinfolk by voice</Text>
          <Text style={[styles.privacy, { color: colors.mutedForeground }]}>
            Record up to 60 seconds. Nothing is uploaded until you stop, and canceled recordings are discarded.
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={source.canStop ? "Stop recording for Kinfolk" : "Start recording a Kinfolk question, 60 second maximum"}
          accessibilityState={{ busy: isBusy, selected: state.phase === "recording" }}
          activeOpacity={0.8}
          disabled={isBusy || (!source.canStart && !source.canStop)}
          onPress={() => void (source.canStop ? source.stop() : source.start())}
          style={[
            styles.micButton,
            { backgroundColor: state.phase === "recording" ? "#B42318" : colors.primary, opacity: isBusy || (!source.canStart && !source.canStop) ? 0.58 : 1 },
          ]}
        >
          {isBusy
            ? <ActivityIndicator color="#FFF" />
            : <Feather name={source.canStop ? "square" : "mic"} size={18} color="#FFF" />}
        </TouchableOpacity>
      </View>

      {state.phase === "recording" ? (
        <View style={[styles.notice, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
          <Text accessibilityLiveRegion="polite" style={[styles.noticeText, { color: "#991B1B" }]}>Recording {source.elapsedSeconds}s / 60s. Tap Stop to transcribe.</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Cancel recording and discard local audio"
            onPress={() => void source.cancel()}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {state.message ? (
        <Text accessibilityLiveRegion="polite" style={[styles.status, { color: state.phase === "error" || renderError ? "#B91C1C" : colors.mutedForeground }]}>
          {renderError ?? state.message}
        </Text>
      ) : null}

      {isPermissionFailure(state.failure) ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open phone settings to enable microphone permission"
          onPress={() => void source.openMicrophoneSettings()}
          style={[styles.settingsButton, { borderColor: colors.primary }]}
        >
          <Text style={[styles.settingsText, { color: colors.primary }]}>Open microphone settings</Text>
        </TouchableOpacity>
      ) : null}

      {state.phase === "error" && !isPermissionFailure(state.failure) ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Try recording a Kinfolk voice question again"
          onPress={() => void source.start()}
          style={[styles.retryButton, { borderColor: colors.primary }]}
        >
          <Feather name="rotate-ccw" size={14} color={colors.primary} />
          <Text style={[styles.settingsText, { color: colors.primary }]}>Try again</Text>
        </TouchableOpacity>
      ) : null}

      {state.phase === "review" ? (
        <View style={[styles.review, { borderTopColor: colors.border }]}>
          <Text style={[styles.reviewTitle, { color: colors.foreground }]}>Review transcription</Text>
          <Text style={[styles.privacy, { color: colors.mutedForeground }]}>Edit it if needed. It will not be sent until you review it in the message composer and tap Send.</Text>
          <TextInput
            accessibilityLabel="Review Kinfolk voice transcription"
            multiline
            value={state.transcript}
            onChangeText={source.updateTranscript}
            style={[styles.transcript, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
            textAlignVertical="top"
          />
          <View style={styles.reviewActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Add reviewed transcription to Kinfolk message draft"
              disabled={!state.transcript.trim()}
              onPress={() => void useTranscript()}
              style={[styles.useButton, { backgroundColor: colors.primary, opacity: state.transcript.trim() ? 1 : 0.58 }]}
            >
              <Text style={styles.useText}>Add to draft</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Discard voice transcription without sending"
              onPress={source.clearTranscript}
              style={[styles.discardButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.settingsText, { color: colors.mutedForeground }]}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 9 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 14 },
  privacy: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 2 },
  micButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  notice: { minHeight: 40, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 10 },
  noticeText: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 11, lineHeight: 15 },
  cancelButton: { paddingVertical: 4, paddingHorizontal: 3 },
  cancelText: { color: "#B91C1C", fontFamily: "Inter_700Bold", fontSize: 12 },
  status: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 17 },
  settingsButton: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryButton: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 6 },
  settingsText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  review: { gap: 8, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  reviewTitle: { fontFamily: "Inter_700Bold", fontSize: 13 },
  transcript: { minHeight: 88, borderWidth: 1, borderRadius: 10, padding: 10, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  reviewActions: { flexDirection: "row", gap: 8 },
  useButton: { flex: 1, minHeight: 40, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  useText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 12 },
  discardButton: { minHeight: 40, borderWidth: 1, borderRadius: 9, justifyContent: "center", alignItems: "center", paddingHorizontal: 12 },
});
