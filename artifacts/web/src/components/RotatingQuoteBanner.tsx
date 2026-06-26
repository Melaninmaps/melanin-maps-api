import { useState } from "react";
import { BRAND_QUOTES } from "@/lib/quotes";

interface Props {
  variant?: "dark" | "light" | "cream";
  className?: string;
}

export function RotatingQuoteBanner({ variant = "dark", className = "" }: Props) {
  const [quoteIndex] = useState<number>(() => Math.floor(Math.random() * BRAND_QUOTES.length));
  const quote = BRAND_QUOTES[quoteIndex];

  if (variant === "light") {
    return (
      <section className={`py-14 bg-white border-y border-[#3A1F0E]/5 ${className}`}>
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#CA922B]/30" />
            <span className="text-[#CA922B] text-xs font-bold tracking-[0.3em] uppercase">Mapping With Melanin™</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#CA922B]/30" />
          </div>
          <blockquote className="text-2xl md:text-3xl font-serif font-bold text-[#3A1F0E] leading-snug">
            "{quote}"
          </blockquote>
        </div>
      </section>
    );
  }

  if (variant === "cream") {
    return (
      <section className={`py-14 bg-[#FAF6EF] ${className}`}>
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#CA922B]/40" />
            <span className="text-[#CA922B]/70 text-xs font-bold tracking-[0.3em] uppercase">✦ Our Philosophy ✦</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#CA922B]/40" />
          </div>
          <blockquote className="text-2xl md:text-3xl font-serif font-bold text-[#3A1F0E] leading-snug italic">
            "{quote}"
          </blockquote>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-14 bg-[#2B1507] ${className}`}>
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <div className="flex items-center justify-center gap-4 mb-5">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#CA922B]/40" />
          <span className="text-[#CA922B] text-xs font-bold tracking-[0.3em] uppercase">✦ Our Philosophy ✦</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#CA922B]/40" />
        </div>
        <blockquote className="text-2xl md:text-3xl font-serif font-bold text-white leading-snug">
          "{quote}"
        </blockquote>
      </div>
    </section>
  );
}
