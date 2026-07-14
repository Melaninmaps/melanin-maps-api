import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_700Bold,
  PlayfairDisplay_700Bold_Italic,
} from "@expo-google-fonts/playfair-display";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, usePathname, type Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { Alert, Animated, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProviderWrapper } from "@/components/KeyboardProviderWrapper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import * as SecureStore from "expo-secure-store";

// Crash reporter: intercept ALL unhandled JS errors before ErrorBoundary mounts
// so we can read the actual error on next launch as an Alert.
(function installCrashReporter() {
  try {
    const prev = (global as any).ErrorUtils?.getGlobalHandler?.();
    (global as any).ErrorUtils?.setGlobalHandler?.((err: Error, isFatal?: boolean) => {
      try {
        const msg = err?.message ?? String(err);
        const stack = (err?.stack ?? "").substring(0, 600);
        AsyncStorage.setItem(
          "@__crash__",
          JSON.stringify({ msg, stack, fatal: isFatal, ts: new Date().toISOString() })
        ).catch(() => {});
      } catch {}
      if (prev) prev(err, isFatal);
    });
  } catch {}
})();
import { FRESH_LOGIN_KEY, getBiometricCapabilities, isBiometricsEnabled, enableBiometrics } from "@/hooks/useBiometrics";
import { AIChatWidget } from "@/components/AIChatWidget";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { initializeRevenueCat, SubscriptionProvider } from "@/lib/revenuecat";

function PushNotificationRegistrar() {
  useEffect(() => {
    async function registerToken() {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        if (!token) return;
        const Notifications = await import("expo-notifications").catch(() => null);
        if (!Notifications) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const perms: any = await Notifications.requestPermissionsAsync();
        if (!perms?.granted && perms?.status !== "granted") return;
        const pushToken = await Notifications.getExpoPushTokenAsync({ projectId: "0f873107-7787-46ab-9a04-685c2a6756b1" }).catch(() => null);
        if (!pushToken?.data) return;
        const apiBase = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
        if (!apiBase) return;
        await fetch(`${apiBase}/api/notifications/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ token: pushToken.data, platform: Platform.OS }),
        });
      } catch {}
    }
    void registerToken();
  }, []);
  return null;
}

function BrandedLoader() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={loader.root}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Image
          source={require("../assets/images/logo.png")}
          style={loader.logo}
          contentFit="contain"
        />
      </Animated.View>
      <View style={loader.dotsRow}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} delay={i * 220} />
        ))}
      </View>
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const op = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(op, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.25, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, [op, delay]);

  return <Animated.View style={[loader.dot, { opacity: op }]} />;
}

const loader = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1C0E06",
    alignItems: "center",
    justifyContent: "center",
    gap: 48,
  },
  logo: { width: 160, height: 160 },
  dotsRow: { flexDirection: "row", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(251,247,240,0.9)" },
});

try {
  initializeRevenueCat();
} catch (err: any) {
  if (__DEV__) {
    console.warn("RevenueCat init skipped:", err?.message ?? "Unknown error");
  }
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function BiometricEnrollmentPrompt() {
  const { isAuthenticated } = useAuth();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || shownRef.current || (Platform.OS as string) === "web") return;
    shownRef.current = true;
    void (async () => {
      try {
        const freshLogin = await SecureStore.getItemAsync(FRESH_LOGIN_KEY);
        if (freshLogin !== "1") return;
        await SecureStore.deleteItemAsync(FRESH_LOGIN_KEY);
        const alreadyEnabled = await isBiometricsEnabled();
        if (alreadyEnabled) return;
        const { isSupported, label } = await getBiometricCapabilities();
        if (!isSupported) return;
        Alert.alert(
          `Enable ${label}?`,
          `Sign in faster next time using ${label} — no password needed.`,
          [
            { text: "Not Now", style: "cancel" },
            { text: `Enable ${label}`, onPress: () => { void enableBiometrics(label); } },
          ]
        );
      } catch { }
    })();
  }, [isAuthenticated]);

  return null;
}

// Paths where unauthenticated users are allowed to land.
const AUTH_EXEMPT = [
  "/onboarding",
  "/login",
  "/signup",
  "/phone-login",
  "/forgot-password",
  "/reset-password",
  "/auth-complete",
  "/pending-approval",
  "/waitlist",
  "/dob-collection",
  "/profile-setup",
  "/community-guidelines",
  "/community-standards",
  "/roadmap",
  "/contact",
  "/affiliate",
];

function OnboardingChecker() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("preview=1")) return;
    let active = true;
    AsyncStorage.getItem("@mapping_with_melanin_onboarding_complete")
      .then((val) => {
        if (active && !val) router.replace("/onboarding");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router]);

  return null;
}

/**
 * Hard auth gate — once onboarding is done, any unauthenticated user who
 * navigates to a protected route is bounced to /login.
 */
function AuthGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) return;
    // Allow auth-exempt paths through
    if (AUTH_EXEMPT.some((p) => pathname === p || pathname.startsWith(p + "/"))) return;
    // Check onboarding: only enforce auth once the user has completed onboarding
    AsyncStorage.getItem("@mapping_with_melanin_onboarding_complete")
      .then((val) => {
        if (val) {
          router.replace("/login");
        }
      })
      .catch(() => {});
  }, [isLoading, isAuthenticated, pathname, router]);

  return null;
}

function ApprovalChecker() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user && user.approved === false) {
      router.replace("/pending-approval");
    }
  }, [isLoading, isAuthenticated, user, router]);

  return null;
}

function DobChecker() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();
  const SKIP_PATHS = [
    "/onboarding", "/login", "/signup", "/dob-collection",
    "/pending-approval", "/profile-setup", "/auth-complete",
    "/forgot-password", "/reset-password",
  ];

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) return;
    if (SKIP_PATHS.some((p) => pathname.startsWith(p))) return;
    // Only enforce DOB collection once profile setup has been completed
    if (user.profileSetupComplete && !user.dateOfBirth) {
      router.replace("/dob-collection" as Href);
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  return null;
}

function SessionExpiryWatcher() {
  const router = useRouter();
  const { isLoading, sessionExpired } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (sessionExpired) {
      router.replace("/login?expired=1");
    }
  }, [isLoading, sessionExpired, router]);

  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back", headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="business/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="business-vibes"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="event/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="list-business"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="report-safety"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="travel"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="admin"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="messages"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="referral"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="jobs/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="profile-setup"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="auth-complete"
        options={{
          headerShown: false,
          presentation: "card",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="verify-phone"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="membership"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="business-verify"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="write-review"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="business-dashboard"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="business-owner"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="notifications-settings"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="interests"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="neighborhood-survey"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="employer-survey"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="business-insight"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="location-feed"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="creator-public"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="topic-feed"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="notification-center"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="itinerary-feedback"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="waitlist"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="roadmap"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="community-guidelines"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="community-standards"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="spaces"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="my-community"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="space/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="safety-info"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="contact"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="wishlist"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="affiliate"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="billing"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen name="phone-login" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="business-guide" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="business-intelligence" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="business-search" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="challenges" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="checkin" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="city-archive" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="community-hub" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="community-lists" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="community-verified" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="compare-neighborhoods" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="connections" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="create-journal" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="create-list" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="creator-profile" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="cultural-preference" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="destination" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="dob-collection" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="family-circle" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="family-mode" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="family-settings" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="find-friends" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="health-hub" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="journals" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="kinfolk-settings" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="kinfolk-tasks" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="knowledge-hub" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="library-article" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="library-expert" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="library-topic" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="life-journey" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="location-share" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="melanin-wrapped" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="member-connections" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="mental-health" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="mentorship" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="my-trips" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="na-aa-meetings" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="nominate-business" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      <Stack.Screen name="notification-prefs" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="officer-watch" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="opportunities" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="pending-approval" options={{ headerShown: false, presentation: "card", gestureEnabled: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="relocation-planner" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="report-intelligence" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="report-police" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="report-space" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="resolution-center" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="resources" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="safety-hub" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="safety-survey" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="safety-tip" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="smart-pathway" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="smart-search" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="submit-event" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="terms" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="travel-planner" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="travel-videos" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="trust-verification" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="upgrade" options={{ headerShown: false, presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return <BrandedLoader />;

  return (
    <ThemeProvider>
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SubscriptionProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProviderWrapper>
                <View style={{ flex: 1 }}>
                  <OnboardingChecker />
                  <AuthGate />
                  <ApprovalChecker />
                  <DobChecker />
                  <SessionExpiryWatcher />
                  <BiometricEnrollmentPrompt />
                  <PushNotificationRegistrar />
                  <RootLayoutNav />
                  <AIChatWidget />
                  <OfflineBanner />
                </View>
              </KeyboardProviderWrapper>
            </GestureHandlerRootView>
            </SubscriptionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
    </ThemeProvider>
  );
}
