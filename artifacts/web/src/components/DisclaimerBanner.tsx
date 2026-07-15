import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

type DisclaimerId =
  | "general" | "medical" | "legal" | "financial" | "employment"
  | "safety" | "travel" | "ai" | "community" | "business"
  | "emergency" | "resource" | "external" | "promotions" | "recognition";

const SHORT: Record<DisclaimerId, string> = {
  general:     "Information is for general purposes only. Verify before making important decisions.",
  medical:     "We do not provide medical advice. Consult a qualified healthcare professional.",
  legal:       "We do not provide legal advice. Consult a licensed attorney for your circumstances.",
  financial:   "Financial resources are informational only. Verify eligibility with the sponsoring organization.",
  employment:  "Employer reviews reflect individual user experiences. Exercise your own judgment.",
  safety:      "Safety ratings are based on community reports at a point in time. Conditions can change rapidly.",
  travel:      "Travel details may change without notice. Confirm directly with the business or organization.",
  ai:          "KinfolkAI responses may contain inaccuracies and should not replace professional advice.",
  community:   "Posts and reviews belong to their authors and do not reflect the views of Mapping with Melanin™.",
  business:    "Verification confirms requirements met at time of review — not an endorsement of future conduct.",
  emergency:   "We are not an emergency service. If you are in danger, call local emergency services immediately.",
  resource:    "Listed resources are for discovery only. Inclusion is not an endorsement.",
  external:    "External links are provided for convenience. We are not responsible for third-party content.",
  promotions:  "Sponsored content is clearly identified and does not affect our community-first commitment.",
  recognition: "Badges and rankings celebrate engagement and are not endorsements or quality guarantees.",
};

interface Props {
  type: DisclaimerId;
  className?: string;
  variant?: "subtle" | "bordered";
}

export function DisclaimerBanner({ type, className = "", variant = "subtle" }: Props) {
  const text = SHORT[type];
  const borderClass = variant === "bordered"
    ? "border border-[#CA922B]/20 bg-[#FAF6EF]"
    : "bg-[#FAF6EF]/60";

  return (
    <div className={`rounded-xl px-4 py-3 flex items-start gap-2.5 ${borderClass} ${className}`}>
      <AlertCircle className="w-4 h-4 text-[#CA922B] shrink-0 mt-0.5" />
      <p className="text-xs text-[#3A1F0E]/70 leading-relaxed">
        {text}{" "}
        <Link href={`/trust-and-safety#${type}`}>
          <span className="text-[#CA922B] hover:underline font-medium cursor-pointer">
            Full disclaimer
          </span>
        </Link>
      </p>
    </div>
  );
}
