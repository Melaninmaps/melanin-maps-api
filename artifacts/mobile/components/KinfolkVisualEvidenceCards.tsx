import React, { useMemo, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getApiBase } from "@/lib/api";
import { openExternalUrl } from "@/lib/safeLinking";
import { kinfolkVerifiedVisualAssetUrl } from "@/lib/kinfolkVisualEvidence";
import type { KinfolkVisualEvidence } from "@/hooks/useKinfolk";

function VisualEvidenceCard({ evidence, colors }: {
  evidence: KinfolkVisualEvidence;
  colors: { card: string; border: string; text: string; mutedForeground: string; primary: string };
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const assetUrl = useMemo(() => kinfolkVerifiedVisualAssetUrl(evidence.assetPath, getApiBase()), [evidence.assetPath]);
  if (!assetUrl) return null;

  return (
    <View testID="kinfolk-visual-evidence-card" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {!imageFailed ? (
        <Image
          source={{ uri: assetUrl }}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel={evidence.altText}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View testID="kinfolk-visual-evidence-image-unavailable" style={[styles.imageFallback, { backgroundColor: colors.border }]}>
          <Ionicons name="image-outline" size={22} color={colors.mutedForeground} />
          <Text style={[styles.fallbackText, { color: colors.mutedForeground }]}>Verified image unavailable</Text>
        </View>
      )}
      <View style={styles.copy}>
        <Text style={[styles.caption, { color: colors.text }]}>{evidence.caption}</Text>
        <Text style={[styles.detail, { color: colors.mutedForeground }]}>{evidence.whyThisImageFits}</Text>
        <Text style={[styles.rights, { color: colors.mutedForeground }]}>{evidence.rightsNotice}</Text>
        <TouchableOpacity
          onPress={() => void openExternalUrl(evidence.sourcePageUrl, { kind: "web" })}
          accessibilityRole="link"
          accessibilityLabel={`Open visual source from ${evidence.sourceName}`}
          style={styles.sourceLink}
        >
          <Ionicons name="open-outline" size={12} color={colors.primary} />
          <Text style={[styles.sourceText, { color: colors.primary }]} numberOfLines={2}>
            Source: {evidence.sourceName} — {evidence.sourceTitle}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Renders optional public source evidence only; private member image answers use another flow. */
export function KinfolkVisualEvidenceCards({
  evidence = [],
  notice = null,
  colors,
}: {
  evidence?: KinfolkVisualEvidence[];
  notice?: string | null;
  colors: { card: string; border: string; text: string; mutedForeground: string; primary: string };
}) {
  const safeEvidence = evidence.filter((item) => kinfolkVerifiedVisualAssetUrl(item.assetPath, getApiBase()) !== null).slice(0, 4);
  if (safeEvidence.length === 0 && !notice) return null;
  return (
    <View testID="kinfolk-visual-evidence" style={styles.wrapper}>
      {safeEvidence.map((item) => <VisualEvidenceCard key={item.id} evidence={item} colors={colors} />)}
      {notice ? <Text testID="kinfolk-visual-evidence-notice" style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border, color: colors.mutedForeground }]}>{notice}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8, marginTop: 8 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  image: { width: "100%", height: 220 },
  imageFallback: { height: 110, alignItems: "center", justifyContent: "center", gap: 6 },
  fallbackText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  copy: { padding: 11, gap: 5 },
  caption: { fontFamily: "Inter_600SemiBold", fontSize: 12, lineHeight: 17 },
  detail: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },
  rights: { fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 14 },
  sourceLink: { flexDirection: "row", alignItems: "flex-start", gap: 5, marginTop: 2 },
  sourceText: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 11, lineHeight: 15 },
  notice: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },
});
