import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useBrandQuote } from "@/hooks/useBrandQuote";
import type { QuoteCategory } from "@/constants/brandQuotes";

interface Props {
  category: QuoteCategory;
  offset?: number;
  variant?: "strip" | "card" | "inline";
  accentColor?: string;
  style?: object;
}

export function BrandQuoteBanner({ category, offset = 0, variant = "strip", accentColor, style }: Props) {
  const colors = useColors();
  const quote = useBrandQuote({ category, offset });
  const accent = accentColor ?? colors.primary ?? "#CA922B";

  if (variant === "inline") {
    return (
      <Text style={[s.inlineText, { color: colors.mutedForeground }, style]}>
        &quot;{quote.text}&quot;
      </Text>
    );
  }

  if (variant === "card") {
    return (
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
        <View style={[s.cardAccent, { backgroundColor: accent }]} />
        <View style={s.cardBody}>
          <Text style={[s.cardText, { color: colors.foreground }]}>&quot;{quote.text}&quot;</Text>
          <Text style={[s.cardBrand, { color: accent }]}>Mapping With Melanin™</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.strip, { borderLeftColor: accent }, style]}>
      <Text style={[s.stripText, { color: colors.mutedForeground }]}>&quot;{quote.text}&quot;</Text>
    </View>
  );
}

const s = StyleSheet.create({
  strip: {
    borderLeftWidth: 2.5,
    paddingLeft: 12,
    paddingVertical: 4,
    marginVertical: 4,
  },
  stripText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  card: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginVertical: 8,
  },
  cardAccent: {
    width: 3,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  cardBrand: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  inlineText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    textAlign: "center",
  },
});
