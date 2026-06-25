import { Stack } from "expo-router";

export default function BusinessOwnerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" options={{ presentation: "card" }} />
    </Stack>
  );
}
