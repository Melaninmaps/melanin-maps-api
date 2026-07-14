import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

interface UserResult {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
  isPrivate: boolean;
}

interface Props {
  query: string;
  onSelect: (mention: string, userId: string) => void;
}

export function UserMentionPicker({ query, onSelect }: Props) {
  const colors = useColors();
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 1) { setResults([]); return; }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY).catch(() => null);
        if (!token) return;
        const res = await fetch(`${getApiBase()}/api/users/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const data = await res.json() as { users: UserResult[] };
        if (!cancelled) setResults(data.users.slice(0, 6));
      } catch { /* ignore */ } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const timer = setTimeout(() => void run(), 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  if (results.length === 0 && !loading) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
        keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" horizontal={false} style={{ maxHeight: 200 }}>
          {results.map((u) => {
            const displayName = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "Unknown";
            const handle = u.username ? `@${u.username}` : "";
            const initials = (displayName[0] ?? "?").toUpperCase();
            return (
              <TouchableOpacity
                key={u.id}
                style={[styles.row, { borderBottomColor: colors.border }]}
                onPress={() => onSelect(u.username || displayName.replace(/\s+/g, "_"), u.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.avatar, { backgroundColor: colors.primary + "33" }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{displayName}</Text>
                  {handle ? <Text style={[styles.handle, { color: colors.mutedForeground }]}>{handle}</Text> : null}
                </View>
                {u.isPrivate && (
                  <Feather name="lock" size={13} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  loadingRow: { padding: 12, alignItems: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  handle: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
