import { useState, useEffect } from "react";
import { Shield, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface Disclaimer {
  id: string;
  title: string;
  short: string;
  full: string;
}

const CATEGORIES = [
  { id: "general",     label: "General Information",     icon: "📋" },
  { id: "medical",     label: "Medical",                  icon: "🩺" },
  { id: "legal",       label: "Legal",                    icon: "⚖️" },
  { id: "financial",   label: "Financial",                icon: "💰" },
  { id: "employment",  label: "Employment",               icon: "💼" },
  { id: "safety",      label: "Safety",                   icon: "🛡️" },
  { id: "travel",      label: "Travel",                   icon: "✈️" },
  { id: "ai",          label: "AI (KinfolkAI)",           icon: "🤖" },
  { id: "community",   label: "Community Content",        icon: "👥" },
  { id: "business",    label: "Business Verification",    icon: "✅" },
  { id: "emergency",   label: "Emergency Services",       icon: "🚨" },
  { id: "resource",    label: "Resource Directory",       icon: "📚" },
  { id: "external",    label: "External Links",           icon: "🔗" },
  { id: "promotions",  label: "Promotions & Partnerships",icon: "📣" },
  { id: "recognition", label: "Community Recognition",    icon: "🏆" },
];

const TRUST_SECTIONS = [
  { id: "community-guidelines", label: "Community Guidelines",    href: "/community-guidelines" },
  { id: "privacy-policy",       label: "Privacy Policy",          href: "/privacy-policy" },
  { id: "terms",                label: "Terms of Service",         href: "/terms" },
  { id: "safety-center",        label: "Safety Center",            href: "/safety" },
];

function DisclaimerCard({ d }: { d: Disclaimer }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.location.hash === `#${d.id}`) setOpen(true);
  }, [d.id]);

  return (
    <div id={d.id} className="border border-[#3A1F0E]/10 rounded-2xl overflow-hidden scroll-mt-24">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-5 bg-white hover:bg-[#FAF6EF] transition-colors text-left"
      >
        <div>
          <span className="font-semibold text-[#2B1507] text-base">
            {CATEGORIES.find(c => c.id === d.id)?.label ?? d.title}
          </span>
          {!open && (
            <p className="text-sm text-[#3A1F0E]/60 mt-0.5 max-w-2xl">{d.short}</p>
          )}
        </div>
        {open
          ? <ChevronUp className="w-5 h-5 text-[#CA922B] shrink-0 ml-4" />
          : <ChevronDown className="w-5 h-5 text-[#CA922B] shrink-0 ml-4" />}
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 bg-[#FAF6EF] border-t border-[#3A1F0E]/8">
          <p className="text-sm text-[#3A1F0E]/80 leading-relaxed">{d.full}</p>
        </div>
      )}
    </div>
  );
}

export default function TrustAndSafety() {
  const [disclaimers, setDisclaimers] = useState<Disclaimer[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    fetch(`${BASE}api/legal/disclaimers`)
      .then(r => r.json())
      .then(d => setDisclaimers(d.disclaimers ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      setActiveSection(id);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [disclaimers]);

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <div className="bg-[#2B1507] text-[#F5EBD8] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#CA922B]/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-[#CA922B]" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            Trust & Safety Center
          </h1>
          <p className="text-[#F5EBD8]/80 text-lg max-w-2xl mx-auto leading-relaxed">
            Mapping with Melanin™ helps people discover businesses, communities, resources, and
            opportunities. We encourage you to verify important information, exercise personal
            judgment, and make decisions appropriate for your individual circumstances.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Platform policies */}
              <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-5">
                <h3 className="font-semibold text-[#2B1507] text-sm uppercase tracking-wide mb-4">
                  Platform Policies
                </h3>
                <ul className="space-y-2">
                  {TRUST_SECTIONS.map(s => (
                    <li key={s.id}>
                      <a
                        href={`${BASE.replace(/\/$/, "")}${s.href}`}
                        className="flex items-center gap-2 text-sm text-[#3A1F0E]/70 hover:text-[#CA922B] transition-colors py-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* TOC */}
              <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-5">
                <h3 className="font-semibold text-[#2B1507] text-sm uppercase tracking-wide mb-4">
                  Disclaimer Sections
                </h3>
                <ul className="space-y-1">
                  {CATEGORIES.map(c => (
                    <li key={c.id}>
                      <a
                        href={`#${c.id}`}
                        onClick={() => setActiveSection(c.id)}
                        className={`flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg transition-colors ${
                          activeSection === c.id
                            ? "bg-[#CA922B]/10 text-[#CA922B] font-medium"
                            : "text-[#3A1F0E]/70 hover:text-[#CA922B]"
                        }`}
                      >
                        <span className="text-base leading-none">{c.icon}</span>
                        {c.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-[#3A1F0E]/50 px-1">
                Questions?{" "}
                <a href="mailto:legal@mappingwithmelanin.com" className="text-[#CA922B] hover:underline">
                  Contact us
                </a>
              </p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 space-y-3 min-w-0">
            <div className="bg-white rounded-2xl border border-[#CA922B]/30 px-6 py-5 mb-6">
              <p className="text-sm text-[#3A1F0E]/70 leading-relaxed">
                The sections below contain the full text of each disclaimer. Short versions of
                relevant disclaimers appear throughout the app where they apply. Click any section
                to expand and read the full text.
              </p>
            </div>

            {disclaimers.length === 0 ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl bg-white border border-[#3A1F0E]/10 animate-pulse" />
                ))}
              </div>
            ) : (
              disclaimers.map(d => <DisclaimerCard key={d.id} d={d} />)
            )}

            <div className="pt-6 border-t border-[#3A1F0E]/10 text-center">
              <p className="text-xs text-[#3A1F0E]/50">
                Last updated: July 2026 · Mapping with Melanin™, LLC
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
