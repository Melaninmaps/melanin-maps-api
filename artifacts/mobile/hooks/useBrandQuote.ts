import { useMemo } from "react";
import { BRAND_QUOTES, type QuoteCategory, type BrandQuote } from "@/constants/brandQuotes";

interface UseBrandQuoteOptions {
  category: QuoteCategory;
  offset?: number;
}

export function useBrandQuote({ category, offset = 0 }: UseBrandQuoteOptions): BrandQuote {
  return useMemo(() => {
    const quotes = BRAND_QUOTES[category];
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    return quotes[(dayIndex + offset) % quotes.length];
  }, [category, offset]);
}

export function useBrandQuoteText({ category, offset = 0 }: UseBrandQuoteOptions): string {
  return useBrandQuote({ category, offset }).text;
}
