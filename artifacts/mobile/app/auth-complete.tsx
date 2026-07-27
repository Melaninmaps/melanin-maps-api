import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

export default function AuthComplete() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const colors = useColors();
  const { refreshUser } = useAuth();

  useEffect(() => {
    async function finish() {
      try {
        if (token && typeof token === "string") {
          await SecureStore.setItemAsync("auth_session_token", token);
          await SecureStore.setItemAsync("@melanin_maps_fresh_login", "1");
          await refreshUser();
        }
      } catch {}
      router.replace("/(tabs)");
    }
    void finish();
  }, [token, router, refreshUser]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
