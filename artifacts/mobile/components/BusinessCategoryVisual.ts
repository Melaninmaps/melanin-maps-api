import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

/**
 * Visual-only fallback for businesses without a supplied image.
 * Real business imageUrl content remains preferred at every surface.
 */
export function getBusinessCategoryIcon(
  category?: string | null,
  subcategory?: string | null,
): FeatherIconName {
  const value = `${category ?? ""} ${subcategory ?? ""}`.toLowerCase();

  if (/(beauty|hair|barber|salon|nail|spa|cosmetic)/.test(value)) return "scissors";
  if (/(auto|mechanic|repair|vehicle|car)/.test(value)) return "tool";
  if (/(food|restaurant|dining|cafe|coffee|bakery|catering)/.test(value)) return "coffee";
  if (/(retail|shop|boutique|apparel|clothing)/.test(value)) return "shopping-bag";
  if (/(health|wellness|medical|therapy|fitness)/.test(value)) return "heart";
  if (/(tech|software|digital)/.test(value)) return "monitor";
  if (/(legal)/.test(value)) return "file-text";
  if (/(finance|accounting|insurance)/.test(value)) return "dollar-sign";
  if (/(art|culture|creative|music)/.test(value)) return "music";

  return "map-pin";
}
