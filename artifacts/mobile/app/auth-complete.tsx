import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";
import { persistAuthSession, useAuth } from "@/lib/auth";

export default function AuthComplete() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const colors = useColors();
  const { refreshUser } = useAuth();

  useEffect(() => {
    async function finish() {
      try {
        if (!token || typeof token !== "string") {
          router.replace("/login?recovery=secure_storage");
          return;
        }
        await persistAuthSession(token);
        const loaded = await refreshUser();
        router.replace(loaded ? "/(tabs)" : "/login?recovery=connection");
      } catch {
        // A deep-link credential write must not leave this spinner visible if
        // native secure storage rejects or never settles.
        router.replace("/login?recovery=secure_storage");
      }
    }
    void finish();
  }, [token, router, refreshUser]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
