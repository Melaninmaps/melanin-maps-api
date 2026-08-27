import { BRAND_QUOTES, type QuoteCategory, type BrandQuote } from "@/constants/brandQuotes";

const CURRENT_DAY_INDEX = Math.floor(Date.now() / 86_400_000);

interface UseBrandQuoteOptions {
  category: QuoteCategory;
  offset?: number;
}

export function useBrandQuote({ category, offset = 0 }: UseBrandQuoteOptions): BrandQuote {
  const quotes = BRAND_QUOTES[category];
  return quotes[(CURRENT_DAY_INDEX + offset) % quotes.length];
}

export function useBrandQuoteText({ category, offset = 0 }: UseBrandQuoteOptions): string {
  return useBrandQuote({ category, offset }).text;
}
