import { useTheme } from "@/contexts/ThemeContext";
import colors from "@/constants/colors";

/**
 * Returns design tokens for the current color scheme.
 * Respects user override stored in AsyncStorage via ThemeContext.
 * Falls back to the light palette when dark key is undefined.
 */
export function useColors() {
  const { isDark } = useTheme();
  const palette = isDark && "dark" in colors
    ? colors.dark
    : colors.light;
  return { ...palette, radius: colors.radius };
}
