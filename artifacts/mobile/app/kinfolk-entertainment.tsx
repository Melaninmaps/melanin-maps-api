import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KinfolkEntertainmentSettings } from "@/components/KinfolkEntertainmentSettings";
import { useColors } from "@/hooks/useColors";

export default function KinfolkEntertainmentScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: Math.max(insets.top, 24),
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Back from Kinfolk entertainment settings"
        >
          <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold" }}>
            Back
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            color: colors.foreground,
            fontSize: 17,
            fontFamily: "Inter_700Bold",
          }}
        >
          Entertainment
        </Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <KinfolkEntertainmentSettings />
      </ScrollView>
    </View>
  );
}
