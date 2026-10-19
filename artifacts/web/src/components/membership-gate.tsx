import { Lock, Star, Zap, Shield, Heart } from "lucide-react";

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

function isUnlocked(
  current: string | null | undefined,
  required: "navigator" | "trailblazer",
) {
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

export function MembershipGate({
  requiredTier,
  currentTier,
  featureName,
  featureDescription,
  children,
}: MembershipGateProps) {
  if (isUnlocked(currentTier, requiredTier)) {
    return <>{children}</>;
  }

  const meta = TIER_META[requiredTier];
  const Icon = meta.icon;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-40 overflow-hidden max-h-48">
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 shadow-xl p-6 max-w-sm w-full mx-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: meta.color + "15" }}
            >
              <Lock className="w-5 h-5" style={{ color: meta.color }} />
            </div>
            <div>
              <p className="font-bold text-[#2B1507] text-sm">{featureName}</p>
              <p className="text-[#3A1F0E]/50 text-xs">
                {meta.label} membership required
              </p>
            </div>
          </div>

          {featureDescription && (
            <p className="text-[#3A1F0E]/65 text-sm mb-4 leading-relaxed">
              {featureDescription}
            </p>
          )}

          <div className="space-y-1.5 mb-5">
            {meta.perks.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: meta.color }}
                />
                <span className="text-[#3A1F0E]/70 text-xs">{p}</span>
              </div>
            ))}
          </div>

          <div className="bg-[#FAF6EF] rounded-xl p-3 mb-4 flex items-start gap-2.5">
            <Heart className="w-4 h-4 text-[#CA922B] shrink-0 mt-0.5" />
            <p className="text-[#3A1F0E]/65 text-xs leading-relaxed">
              Mapping with Melanin supports community programs, including the
              MWM Scholarship Fund.
            </p>
          </div>

          <div
            role="status"
            className="rounded-xl border border-[#CA922B]/30 bg-[#FFF8EC] p-3"
          >
            <div className="flex items-start gap-2">
              <Shield
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: meta.color }}
              />
              <div className="space-y-2 text-xs leading-relaxed text-[#3A1F0E]/70">
                <p className="font-bold text-[#2B1507]">
                  Membership enrollment unavailable / Inscripción de membresía
                  no disponible
                </p>
                <p>
                  Membership enrollment and trials are temporarily unavailable
                  while the approved catalog and entitlement lifecycle are
                  reconciled. Existing verified member access remains active. /
                  La inscripción y las pruebas de membresía están temporalmente
                  no disponibles mientras se reconcilian el catálogo aprobado y
                  el ciclo de acceso. El acceso verificado existente de los
                  miembros permanece activo.
                </p>
                <p>
                  {meta.price} and {meta.annualPrice} are approved catalog
                  references only; no payment, trial, membership access, or
                  listing upgrade starts here. / {meta.price} y{" "}
                  {meta.annualPrice} son solo referencias de catálogo aprobadas;
                  aquí no se inicia ningún pago, prueba, acceso de membresía ni
                  mejora de listado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
