import { useState } from "react";
import { Lock, Star, Zap, ExternalLink, Loader2, Shield, Heart } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface MembershipGateProps {
  requiredTier: "navigator" | "trailblazer";
  currentTier?: string | null;
  featureName: string;
  featureDescription?: string;
  children: React.ReactNode;
}

const TIER_META = {
  navigator: {
    label: "Navigator",
    color: "#2D7A4F",
    price: "$7.99/mo",
    annualPrice: "$79.99/yr",
    icon: Star,
    perks: [
      "Unlimited saved favorites",
      "Advanced safety insights",
      "Enhanced community features",
      "Priority support",
    ],
  },
  trailblazer: {
    label: "Trailblazer",
    color: "#CA922B",
    price: "$14.99/mo",
    annualPrice: "$149.99/yr",
    icon: Zap,
    perks: [
      "Everything in Navigator",
      "KinfolkAI travel planning",
      "Premium itineraries",
      "First access to every new feature",
    ],
  },
};

function isUnlocked(current: string | null | undefined, required: "navigator" | "trailblazer") {
  const TIER_RANK: Record<string, number> = {
    trailblazer: 3,
    legacy_member: 3,
    navigator: 2,
    community_builder: 2,
    founding: 3,
    beta: 3,
  };
  const currentRank = TIER_RANK[current ?? ""] ?? 0;
  const requiredRank = TIER_RANK[required] ?? 2;
  return currentRank >= requiredRank;
}

export function MembershipGate({ requiredTier, currentTier, featureName, featureDescription, children }: MembershipGateProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "annual" | null>(null);

  if (isUnlocked(currentTier, requiredTier)) {
    return <>{children}</>;
  }

  const meta = TIER_META[requiredTier];
  const Icon = meta.icon;

  async function startCheckout(interval: "monthly" | "annual") {
    setCheckoutLoading(interval);
    try {
      const res = await fetch(`${BASE}api/billing/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: requiredTier, interval }),
      });
      const d = await res.json() as { checkoutUrl?: string; error?: string };
      if (d.checkoutUrl) {
        window.location.href = d.checkoutUrl;
      } else {
        alert(d.error ?? "Could not start checkout. Please try again.");
      }
    } catch {
      alert("Could not connect. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  return (
    <div className="relative">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40 overflow-hidden max-h-48">
        {children}
      </div>

      {/* Gate overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 shadow-xl p-6 max-w-sm w-full mx-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: meta.color + "15" }}>
              <Lock className="w-5 h-5" style={{ color: meta.color }} />
            </div>
            <div>
              <p className="font-bold text-[#2B1507] text-sm">{featureName}</p>
              <p className="text-[#3A1F0E]/50 text-xs">{meta.label} membership required</p>
            </div>
          </div>

          {featureDescription && (
            <p className="text-[#3A1F0E]/65 text-sm mb-4 leading-relaxed">{featureDescription}</p>
          )}

          <div className="space-y-1.5 mb-5">
            {meta.perks.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: meta.color }} />
                <span className="text-[#3A1F0E]/70 text-xs">{p}</span>
              </div>
            ))}
          </div>

          {/* Mission note */}
          <div className="bg-[#FAF6EF] rounded-xl p-3 mb-4 flex items-start gap-2.5">
            <Heart className="w-4 h-4 text-[#CA922B] shrink-0 mt-0.5" />
            <p className="text-[#3A1F0E]/65 text-xs leading-relaxed">
              Your web subscription funds community programs — including the MWM Scholarship Fund.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => void startCheckout("monthly")}
              disabled={!!checkoutLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60 transition-colors"
              style={{ backgroundColor: meta.color }}
            >
              {checkoutLoading === "monthly"
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><ExternalLink className="w-3.5 h-3.5" /> Subscribe for {meta.price}</>
              }
            </button>
            <button
              onClick={() => void startCheckout("annual")}
              disabled={!!checkoutLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border disabled:opacity-60 transition-colors"
              style={{ color: meta.color, borderColor: meta.color + "40" }}
            >
              {checkoutLoading === "annual"
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>{meta.annualPrice} · Save ~17% annually</>
              }
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <Shield className="w-3 h-3 text-[#3A1F0E]/30" />
            <p className="text-[#3A1F0E]/35 text-xs">Secure checkout via Stripe · Cancel anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
}
