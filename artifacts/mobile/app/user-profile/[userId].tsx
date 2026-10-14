import { Redirect, useLocalSearchParams } from "expo-router";

/**
 * Compatibility route for older links. Community member identity is rendered
 * only by /user/:id so owner/visitor privacy, follow, block, and messaging
 * behavior cannot drift between independent profile screens.
 */
export default function LegacyUserProfileRedirect() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  if (!userId) return <Redirect href="/community" />;
  return <Redirect href={{ pathname: "/user/[id]", params: { id: userId } }} />;
}
