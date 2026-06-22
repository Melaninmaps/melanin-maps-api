import { ExternalLink, Plane, Hotel, Car, Star, Shield, Percent, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL;

const PARTNERS = [
  {
    category: "Hotels & Stays",
    icon: Hotel,
    color: "#2D7A4F",
    bg: "#2D7A4F0F",
    partners: [
      { name: "Salamander Collection", desc: "Luxury resorts and boutique hotels celebrating Black excellence in hospitality", discount: "15% off rack rates", code: "MWM15" },
      { name: "Afro-Luxe Hotels", desc: "Curated collection of Minority-owned boutique properties across the US & Caribbean", discount: "10% off + free breakfast", code: "KINFOLK10" },
    ],
  },
  {
    category: "Flights & Travel",
    icon: Plane,
    color: "#1D4ED8",
    bg: "#1D4ED80F",
    partners: [
      { name: "Black Travel Alliance", desc: "Discounted airfare packages for culturally curated destinations worldwide", discount: "Up to $75 off flights", code: "MWM75" },
      { name: "TravelNoire", desc: "Group travel packages designed for Black travelers — safety-rated, community-reviewed", discount: "5% off all packages", code: "MELANIN5" },
    ],
  },
  {
    category: "Car Rentals",
    icon: Car,
    color: "#CA922B",
    bg: "#CA922B0F",
    partners: [
      { name: "Enterprise Rent-A-Car", desc: "Preferred rental partner with exclusive member rates at 8,500+ locations", discount: "20% off weekend rentals", code: "MWM20" },
      { name: "Rideshare Connect", desc: "Minority-owned rideshare network in select cities — support community drivers", discount: "First ride free", code: "KINFOLK1ST" },
    ],
  },
  {
    category: "Experiences",
    icon: Star,
    color: "#7B2D8B",
    bg: "#7B2D8B0F",
    partners: [
      { name: "Urban Soul Tours", desc: "Black culture walking tours and city experiences in 25+ US cities", discount: "25% off for members", code: "MELANIN25" },
      { name: "The Root Food Festival", desc: "Annual celebration of Black culinary culture — VIP tickets for members", discount: "VIP upgrade free", code: "MWMVIP" },
    ],
  },
];

const MEMBER_TIERS = [
  { tier: "Explorer (Free)", perks: ["No affiliate access"] },
  { tier: "Navigator", perks: ["All partner discounts", "Exclusive promo codes", "Member-only flash deals"] },
  { tier: "Trailblazer", perks: ["All Navigator perks", "Early access to new partners", "VIP experience upgrades", "Personal travel concierge"] },
  { tier: "Founding Member", perks: ["Everything, always", "Partner co-creation access", "Lifetime discount codes"] },
];

export default function Affiliate() {
  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#3A1F0E] to-[#1C0E06] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#CA922B20] border border-[#CA922B40] text-[#CA922B] text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <Percent size={14} />
            Members-Only Partner Discounts
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Travel Better.<br />
            <span className="text-[#CA922B]">Save More.</span>
          </h1>
          <p className="text-[#F5EBD8]/80 text-lg max-w-2xl mx-auto">
            Exclusive discounts from Minority-owned and Black-friendly travel partners — hotels, flights, car rentals, and experiences curated for our community.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href={`${BASE}membership`}>
              <Button className="bg-[#CA922B] hover:bg-[#B8811F] text-white font-semibold px-8 h-12 rounded-xl">
                Unlock with Navigator — $9/mo
              </Button>
            </Link>
            <Link href={`${BASE}explore`}>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 rounded-xl">
                Explore Businesses
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div className="bg-[#F5EBD8] border-y border-[#CA922B20] py-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 px-6">
          {[
            { icon: Shield, text: "All partners community-vetted" },
            { icon: Star, text: "Safety-rated destinations" },
            { icon: Percent, text: "Exclusive member pricing" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-[#3A1F0E] text-sm font-medium">
              <Icon size={15} className="text-[#CA922B]" />
              {text}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-14">
        {PARTNERS.map(({ category, icon: Icon, color, bg, partners }) => (
          <div key={category}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon size={20} style={{ color }} />
              </div>
              <h2 className="text-2xl font-bold text-[#3A1F0E]">{category}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {partners.map((p) => (
                <div key={p.name} className="bg-white rounded-2xl border border-[#E8D5B0] p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-[#3A1F0E] text-lg">{p.name}</h3>
                    <div className="shrink-0 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: bg, color }}>
                      {p.discount}
                    </div>
                  </div>
                  <p className="text-[#6B4C2A] text-sm leading-relaxed mb-4">{p.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs bg-[#FAF6EF] border border-[#E8D5B0] px-3 py-1.5 rounded-lg text-[#3A1F0E] font-bold tracking-wider">
                      {p.code}
                    </div>
                    <button className="flex items-center gap-1.5 text-sm font-semibold" style={{ color }}>
                      Copy code <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Tier access table */}
        <div className="bg-white rounded-2xl border border-[#E8D5B0] p-8">
          <h2 className="text-2xl font-bold text-[#3A1F0E] mb-2">What You Get by Tier</h2>
          <p className="text-[#6B4C2A] mb-8">Partner access scales with your membership.</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {MEMBER_TIERS.map((tier) => (
              <div key={tier.tier} className="p-4 rounded-xl bg-[#FAF6EF] border border-[#E8D5B0]">
                <div className="font-bold text-[#3A1F0E] text-sm mb-3">{tier.tier}</div>
                <ul className="space-y-2">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-xs text-[#6B4C2A]">
                      <div className="w-4 h-4 rounded-full bg-[#CA922B20] flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#CA922B]" />
                      </div>
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href={`${BASE}membership`}>
              <Button className="bg-[#3A1F0E] hover:bg-[#2B1507] text-white font-semibold px-10 h-12 rounded-xl">
                Upgrade Your Membership <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-[#6B4C2A]/60 text-xs">
          Partner discounts are subject to availability and may change. Codes are for Navigator, Trailblazer, and Founding Members only.
          Mapping with Melanin™ may earn a referral commission on qualifying bookings.
        </p>
      </div>
    </div>
  );
}
