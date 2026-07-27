import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { AlertItem } from "@/constants/types";

interface Props {
  alert: AlertItem;
  onDismiss: () => void;
}

const SEVERITY_COLOR = {
  low: "#2D7A4F",
  medium: "#C9922B",
  high: "#DC2626",
};

const TYPE_ICON: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  weather: "cloud-rain",
  safety: "alert-triangle",
  community: "users",
  business: "briefcase",
  travel: "navigation",
};

const SOURCE_LABEL: Record<string, string> = {
  nws: "NWS",
  fema: "FEMA",
  community: "Community",
};

export function AlertBanner({ alert, onDismiss }: Props) {
  const colors = useColors();
  const alertColor = SEVERITY_COLOR[alert.severity];
  const iconName = TYPE_ICON[alert.type] ?? "alert-triangle";
  const sourceLabel = alert.source ? SOURCE_LABEL[alert.source] : null;

  return (
    <View style={[styles.banner, { backgroundColor: alertColor + "15", borderColor: alertColor + "40" }]}>
      <Feather name={iconName} size={16} color={alertColor} style={styles.icon} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: alertColor }]}>{alert.title}</Text>
        <Text style={[styles.message, { color: colors.foreground }]} numberOfLines={2}>
          {alert.message}
        </Text>
        <View style={styles.meta}>
          {sourceLabel && (
            <View style={[styles.sourceBadge, { backgroundColor: alertColor + "20" }]}>
              <Text style={[styles.sourceText, { color: alertColor }]}>{sourceLabel}</Text>
            </View>
          )}
          <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{alert.timeAgo} · {alert.location}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Feather name="x" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  icon: {
    marginTop: 1,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  message: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  sourceBadge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sourceText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  timeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
});
