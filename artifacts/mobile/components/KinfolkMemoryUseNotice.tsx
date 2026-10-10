import { Feather } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export type KinfolkMemoryUse = {
  applied: true;
  message: string;
};

/** A generic notice: it confirms use without exposing a private saved detail. */
export function KinfolkMemoryUseNotice({
  memoryUse,
}: {
  memoryUse: KinfolkMemoryUse;
}) {
  const colors = useColors();
  return (
    <View
      accessibilityLabel="Saved Kinfolk preference used"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginHorizontal: 14,
        marginTop: 8,
        alignSelf: "flex-start",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primary + "55",
        backgroundColor: colors.primary + "0D",
        paddingHorizontal: 10,
        paddingVertical: 7,
      }}
    >
      <Feather name="lock" size={13} color={colors.primary} />
      <Text
        style={{
          color: colors.mutedForeground,
          fontFamily: "Inter_500Medium",
          fontSize: 11,
        }}
      >
        {memoryUse.message}
      </Text>
    </View>
  );
}
