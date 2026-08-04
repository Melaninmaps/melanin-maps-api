import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

type PreviewChoice = "safety" | "discovery" | "business" | "community";
type Stage = "selection" | "preview" | "signup" | "success";

const GOLD = "#CA922B";
const BROWN = "#2B1507";
const SURFACE = "#3C1E0A";
const CREAM = "#F5F0E8";
const MUTED = "rgba(245, 240, 232, 0.55)";

// ── Card definitions ──────────────────────────────────────────────────────────

const CARDS: {
  id: PreviewChoice;
  title: string;
  subtitle: string;
  hook: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "safety",
    title: "Keep My People Safe",
    subtitle: "Navigate with confidence and awareness.",
    hook: "Because our peace of mind shouldn't be a luxury. Know before you go.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M18 3L5 9v9c0 8.3 5.6 16 13 18 7.4-2 13-9.7 13-18V9L18 3z" stroke={GOLD} strokeWidth="2" strokeLinejoin="round" fill="none"/>
        <path d="M12 18l4 4 8-8" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "discovery",
    title: "Find Trusted Businesses",
    subtitle: "Spend where you are celebrated.",
    hook: "Keep our dollars in our community. Discover the gems in your backyard.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="16" cy="16" r="10" stroke={GOLD} strokeWidth="2" fill="none"/>
        <path d="M24 24l7 7" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M12 16h8M16 12v8" stroke={GOLD} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "business",
    title: "I Own a Business",
    subtitle: "Grow your legacy with a loyal community.",
    hook: "Stop fighting algorithms. Connect directly with the people looking for you.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect x="4" y="14" width="28" height="18" rx="2" stroke={GOLD} strokeWidth="2" fill="none"/>
        <path d="M12 14V9a6 6 0 0112 0v5" stroke={GOLD} strokeWidth="2" strokeLinecap="round"/>
        <path d="M4 20h28" stroke={GOLD} strokeWidth="1.5" opacity="0.5"/>
        <circle cx="18" cy="23" r="2.5" stroke={GOLD} strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
  {
    id: "community",
    title: "Connect With Community",
    subtitle: "Find your tribe, honor your roots.",
    hook: "More than a map—it's our digital village. Welcome home.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="10" r="5" stroke={GOLD} strokeWidth="2" fill="none"/>
        <circle cx="7" cy="26" r="4" stroke={GOLD} strokeWidth="2" fill="none"/>
        <circle cx="29" cy="26" r="4" stroke={GOLD} strokeWidth="2" fill="none"/>
        <path d="M13 14.5C10.5 16 9 19 9 22" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M23 14.5C25.5 16 27 19 27 22" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11 26h14" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

// ── Preview mockup screens ────────────────────────────────────────────────────

function SafetyPreview() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#0f1923", borderRadius: 16 }}>
      {/* Map grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(202,146,43,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(202,146,43,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      {/* Danger zone */}
      <div style={{ position: "absolute", top: "38%", left: "15%", width: 130, height: 90, background: "rgba(220,50,50,0.18)", border: "1.5px solid rgba(220,50,50,0.5)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 10, color: "#ff8080", fontWeight: 600, textAlign: "center", padding: "0 8px" }}>⚠ Historical Sundown Town</span>
      </div>

      {/* Safe zone */}
      <div style={{ position: "absolute", top: "30%", right: "12%", width: 110, height: 80, background: "rgba(50,180,100,0.15)", border: "1.5px solid rgba(50,180,100,0.45)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 10, color: "#6ee7a0", fontWeight: 600, textAlign: "center", padding: "0 8px" }}>✓ Community Safe Space</span>
      </div>

      {/* Route line */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 300 220" preserveAspectRatio="none">
        <path d="M50 180 C70 160 90 140 130 120 C160 105 200 100 250 80" stroke={GOLD} strokeWidth="3" fill="none" strokeDasharray="6 3" strokeLinecap="round"/>
        <circle cx="50" cy="180" r="5" fill={GOLD}/>
        <circle cx="250" cy="80" r="5" fill={GOLD}/>
      </svg>

      {/* Map pins */}
      <div style={{ position: "absolute", top: "52%", left: "14%", display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50% 50% 50% 0", background: "#ff5555", transform: "rotate(-45deg)", boxShadow: "0 2px 6px rgba(255,85,85,0.5)" }} />
      </div>
      <div style={{ position: "absolute", top: "22%", right: "25%", display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50% 50% 50% 0", background: "#50c878", transform: "rotate(-45deg)", boxShadow: "0 2px 6px rgba(80,200,120,0.5)" }} />
      </div>
      <div style={{ position: "absolute", top: "60%", right: "18%", display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ width: 16, height: 16, borderRadius: "50% 50% 50% 0", background: GOLD, transform: "rotate(-45deg)", boxShadow: `0 2px 6px rgba(202,146,43,0.6)` }} />
      </div>

      {/* Push notification */}
      <div style={{ position: "absolute", top: 16, left: 16, right: 16, background: "rgba(20,12,6,0.92)", border: `1px solid rgba(202,146,43,0.35)`, borderRadius: 12, padding: "12px 14px", backdropFilter: "blur(8px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, background: GOLD, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10 }}>🗺</span>
          </div>
          <span style={{ fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: "0.04em" }}>COMMUNITY ALERT</span>
        </div>
        <p style={{ margin: 0, fontSize: 11.5, color: CREAM, lineHeight: 1.45 }}>Heavy police presence near 4th & Main. Community rerouting suggested.</p>
      </div>

      {/* Verified safe space card */}
      <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, background: "rgba(20,12,6,0.88)", border: "1px solid rgba(80,200,120,0.4)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#50c878", flexShrink: 0, boxShadow: "0 0 8px #50c878" }} />
        <div>
          <div style={{ fontSize: 11, color: "#6ee7a0", fontWeight: 600 }}>Verified Safe Space</div>
          <div style={{ fontSize: 12, color: CREAM }}>The Book & Bean Cafe · 0.3 mi away</div>
        </div>
      </div>
    </div>
  );
}

function DiscoveryPreview() {
  const businesses = [
    { name: "Treme Soul Kitchen", cat: "Soul Food", city: "New Orleans, LA", stars: 4.9, reviews: 138, badge: "Black-Owned", img: "https://images.pexels.com/photos/3184187/pexels-photo-3184187.jpeg?w=300&auto=compress" },
    { name: "Jefferson Street BBQ", cat: "Barbecue", city: "Nashville, TN", stars: 4.9, reviews: 97, badge: "Black-Owned", img: "https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?w=300&auto=compress" },
    { name: "Baba's Mediterranean", cat: "Mediterranean", city: "Birmingham, AL", stars: 4.8, reviews: 64, badge: "Immigrant-Owned", img: "https://images.pexels.com/photos/4553193/pexels-photo-4553193.jpeg?w=300&auto=compress" },
  ];

  return (
    <div style={{ width: "100%", height: "100%", background: "#1a0d05", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Search bar */}
      <div style={{ padding: "14px 14px 8px", flexShrink: 0 }}>
        <div style={{ background: "rgba(202,146,43,0.1)", border: `1px solid rgba(202,146,43,0.3)`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke={GOLD} strokeWidth="1.8"/><path d="M14 14l4 4" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round"/></svg>
          <span style={{ fontSize: 12, color: MUTED }}>Search community businesses near you…</span>
        </div>
        {/* Filter chips */}
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "nowrap", overflowX: "auto", paddingBottom: 2 }}>
          {["All", "Food", "Wellness", "Legal", "Beauty"].map((c, i) => (
            <span key={c} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: i === 0 ? GOLD : "rgba(202,146,43,0.12)", color: i === 0 ? BROWN : GOLD, fontWeight: 600, whiteSpace: "nowrap", border: `1px solid ${i === 0 ? GOLD : "rgba(202,146,43,0.25)"}`, flexShrink: 0 }}>{c}</span>
          ))}
        </div>
      </div>

      {/* Business list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {businesses.map((b) => (
          <div key={b.name} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(202,146,43,0.18)", borderRadius: 12, overflow: "hidden", display: "flex", height: 76 }}>
            <div style={{ width: 76, flexShrink: 0, background: "#3c1e0a", overflow: "hidden" }}>
              <img src={b.img} alt={b.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
            </div>
            <div style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12.5, color: CREAM, fontWeight: 600, lineHeight: 1.2 }}>{b.name}</div>
                <div style={{ fontSize: 10.5, color: MUTED, marginTop: 1 }}>{b.cat} · {b.city}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: GOLD }}>{"★".repeat(5)}</span>
                <span style={{ fontSize: 10, color: MUTED }}>{b.stars} ({b.reviews})</span>
                <span style={{ fontSize: 9.5, padding: "2px 6px", borderRadius: 10, background: "rgba(202,146,43,0.15)", color: GOLD, border: `1px solid rgba(202,146,43,0.3)`, marginLeft: "auto" }}>{b.badge}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BusinessPreview() {
  const bars = [62, 88, 74, 95, 82];
  const days = ["M", "T", "W", "T", "F"];

  return (
    <div style={{ width: "100%", height: "100%", background: "#1a0d05", borderRadius: 16, overflow: "hidden", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Stats row */}
      <div style={{ display: "flex", gap: 10 }}>
        {[{ label: "Profile Views", value: "342", delta: "+28%", color: "#6ee7a0" }, { label: "Saves This Week", value: "47", delta: "+12%", color: "#6ee7a0" }].map((s) => (
          <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(202,146,43,0.2)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, color: CREAM, fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: s.color, marginTop: 3 }}>{s.delta} vs last week</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(202,146,43,0.15)", borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ fontSize: 11, color: MUTED, marginBottom: 10, fontWeight: 600 }}>Weekly Foot Traffic</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 60, justifyContent: "space-between" }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: `${h}%`, background: i === 3 ? GOLD : "rgba(202,146,43,0.35)", borderRadius: "4px 4px 0 0", transition: "height 0.6s ease", boxShadow: i === 3 ? `0 0 10px rgba(202,146,43,0.4)` : "none" }} />
              <span style={{ fontSize: 9, color: MUTED }}>{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Flash deal */}
      <div style={{ background: `linear-gradient(135deg, rgba(202,146,43,0.2) 0%, rgba(202,146,43,0.08) 100%)`, border: `1.5px solid rgba(202,146,43,0.5)`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: "0.05em" }}>⚡ FLASH DEAL ACTIVE</div>
          <div style={{ fontSize: 12.5, color: CREAM, marginTop: 2 }}>15% off — expires in 1h 42m</div>
        </div>
        <div style={{ fontSize: 10, padding: "5px 10px", background: GOLD, color: BROWN, borderRadius: 8, fontWeight: 700 }}>Edit</div>
      </div>

      {/* Recent feedback */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 14px" }}>
        <div style={{ fontSize: 10, color: MUTED, marginBottom: 6 }}>Recent Community Feedback</div>
        <p style={{ margin: 0, fontSize: 12, color: CREAM, fontStyle: "italic", lineHeight: 1.5 }}>"So glad I found this place on the app. Felt welcomed immediately."</p>
        <div style={{ fontSize: 10, color: GOLD, marginTop: 4 }}>— Verified Community Member · ★★★★★</div>
      </div>
    </div>
  );
}

function CommunityPreview() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#1a0d05", borderRadius: 16, overflow: "hidden", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Post 1 */}
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(202,146,43,0.18)", borderRadius: 12, padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#7c3f1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: GOLD, fontWeight: 700, flexShrink: 0 }}>JW</div>
          <div>
            <div style={{ fontSize: 12, color: CREAM, fontWeight: 600 }}>Jasmine W.</div>
            <div style={{ fontSize: 10, color: MUTED }}>Washington, DC · 2h ago</div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: CREAM, lineHeight: 1.5 }}>Just found the most beautiful community mural near U Street. This app keeps revealing hidden gems in my own city 🙌</p>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <span style={{ fontSize: 10.5, color: MUTED }}>♡ 24</span>
          <span style={{ fontSize: 10.5, color: MUTED }}>💬 7 replies</span>
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "rgba(202,146,43,0.12)", color: GOLD, marginLeft: "auto" }}>Discovery</span>
        </div>
      </div>

      {/* Event card */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(202,146,43,0.3)", borderRadius: 12, padding: "10px 12px", display: "flex", gap: 12 }}>
        <div style={{ width: 44, flexShrink: 0, textAlign: "center", background: "rgba(202,146,43,0.15)", borderRadius: 8, padding: "6px 0", border: `1px solid rgba(202,146,43,0.3)` }}>
          <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: "0.05em" }}>AUG</div>
          <div style={{ fontSize: 18, color: CREAM, fontWeight: 700, lineHeight: 1.1 }}>15</div>
        </div>
        <div>
          <div style={{ fontSize: 12.5, color: CREAM, fontWeight: 600 }}>First Friday Black Art Walk</div>
          <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2 }}>Shaw Cultural District · 7pm</div>
          <div style={{ fontSize: 10, color: GOLD, marginTop: 4 }}>42 community members going</div>
        </div>
      </div>

      {/* Heritage site */}
      <div style={{ background: "rgba(202,146,43,0.08)", border: `1px solid rgba(202,146,43,0.25)`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(202,146,43,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M4 21V8l8-5 8 5v13" stroke={GOLD} strokeWidth="1.6" strokeLinejoin="round"/><rect x="9" y="13" width="6" height="8" stroke={GOLD} strokeWidth="1.4" rx="1"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: "0.04em" }}>HERITAGE SITE</div>
          <div style={{ fontSize: 12.5, color: CREAM, fontWeight: 600 }}>Madam C.J. Walker Building</div>
          <div style={{ fontSize: 10.5, color: MUTED }}>Indianapolis, IN</div>
        </div>
      </div>

      {/* HBCU connect */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a3a6a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>🎓</div>
        <div>
          <div style={{ fontSize: 10, color: MUTED }}>HBCU Connect</div>
          <div style={{ fontSize: 12, color: CREAM, fontWeight: 500 }}>Spelman Alumni Meetup · Tonight</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 10, padding: "4px 10px", borderRadius: 8, background: "rgba(202,146,43,0.15)", color: GOLD, border: `1px solid rgba(202,146,43,0.3)` }}>RSVP</div>
      </div>
    </div>
  );
}

const PREVIEW_CONTENT: Record<PreviewChoice, React.ReactNode> = {
  safety: <SafetyPreview />,
  discovery: <DiscoveryPreview />,
  business: <BusinessPreview />,
  community: <CommunityPreview />,
};

// ── Waitlist form ─────────────────────────────────────────────────────────────

function WaitlistForm({
  previewChoice,
  utmParams,
  onSuccess,
}: {
  previewChoice: PreviewChoice;
  utmParams: Record<string, string>;
  onSuccess: (position: number) => void;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 16px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(202,146,43,0.3)",
    borderRadius: 10,
    color: CREAM,
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required."); return; }

    setLoading(true);
    try {
      const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      const res = await fetch(`${BASE}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          city: city.trim() || undefined,
          previewChoice,
          ...utmParams,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return; }
      onSuccess(data.position ?? 0);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const cardLabel = CARDS.find((c) => c.id === previewChoice)?.title ?? "";

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
        You chose: {cardLabel}
      </div>
      <h2 style={{ margin: 0, fontSize: 26, fontFamily: "'Playfair Display', serif", color: CREAM, lineHeight: 1.2 }}>
        I Need This Today —<br />Join the Waitlist
      </h2>
      <p style={{ margin: 0, fontSize: 14, color: MUTED, lineHeight: 1.6 }}>
        We'll notify you the second your city goes live. No spam — just your community.
      </p>

      <input
        style={inputStyle}
        type="email"
        placeholder="Your email address *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <input
        style={inputStyle}
        type="text"
        placeholder="First name (optional)"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        autoComplete="given-name"
      />
      <input
        style={inputStyle}
        type="text"
        placeholder="Your city (optional)"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        autoComplete="address-level2"
      />

      {error && <p style={{ margin: 0, fontSize: 13, color: "#ff8080" }}>{error}</p>}

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "15px 24px",
          background: loading ? "rgba(202,146,43,0.4)" : GOLD,
          color: BROWN,
          border: "none",
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "'Playfair Display', serif",
          letterSpacing: "0.01em",
          transition: "background 0.2s, transform 0.1s",
          marginTop: 4,
        }}
      >
        {loading ? "Joining…" : previewChoice === "business" ? "Claim My Business — Join the Waitlist" : "I Need This Today — Join the Waitlist"}
      </button>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const [stage, setStage] = useState<Stage>("selection");
  const [selected, setSelected] = useState<PreviewChoice | null>(null);
  const [hoveredCard, setHoveredCard] = useState<PreviewChoice | null>(null);
  const [waitlistPosition, setWaitlistPosition] = useState(0);
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});
  const topRef = useRef<HTMLDivElement>(null);

  // Capture UTM params from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    if (params.get("utm_source")) utm.utmSource = params.get("utm_source")!;
    if (params.get("utm_medium")) utm.utmMedium = params.get("utm_medium")!;
    if (params.get("utm_campaign")) utm.utmCampaign = params.get("utm_campaign")!;
    setUtmParams(utm);
  }, []);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stage]);

  function handleCardSelect(id: PreviewChoice) {
    setSelected(id);
    setTimeout(() => setStage("preview"), 280);
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: BROWN,
    color: CREAM,
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    position: "relative",
    overflowX: "hidden",
  };

  // ── Selection screen ──────────────────────────────────────────────────────
  if (stage === "selection") {
    return (
      <div style={pageStyle}>
        <div ref={topRef} />
        {/* Subtle texture overlay */}
        <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(202,146,43,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 520, margin: "0 auto", padding: "48px 20px 60px", position: "relative" }}>
          {/* Logo mark */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke={GOLD} strokeWidth="1.5" fill="none"/>
                <path d="M8 18 C8 10 20 10 20 18" stroke={GOLD} strokeWidth="2" fill="none" strokeLinecap="round"/>
                <circle cx="14" cy="11" r="2.5" fill={GOLD}/>
              </svg>
              <span style={{ fontSize: 14, color: GOLD, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Mapping With Melanin</span>
            </div>
          </div>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{ margin: "0 0 12px", fontSize: "clamp(28px, 7vw, 40px)", fontFamily: "'Playfair Display', serif", color: CREAM, lineHeight: 1.15, fontWeight: 700 }}>
              What brings you<br />to the map?
            </h1>
            <p style={{ margin: 0, fontSize: 16, color: MUTED, lineHeight: 1.6, maxWidth: 360, marginInline: "auto" }}>
              Choose your preview and see how Mapping With Melanin is built for you.
            </p>
          </div>

          {/* 2×2 card grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {CARDS.map((card) => {
              const isHovered = hoveredCard === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardSelect(card.id)}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: isHovered ? "rgba(202,146,43,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${isHovered ? GOLD : "rgba(202,146,43,0.25)"}`,
                    borderRadius: 16,
                    padding: "22px 18px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.22s ease",
                    transform: isHovered ? "translateY(-2px)" : "none",
                    boxShadow: isHovered ? `0 8px 32px rgba(202,146,43,0.2)` : "none",
                    color: "inherit",
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{ marginBottom: 14 }}>{card.icon}</div>
                  <div style={{ fontSize: 15, fontFamily: "'Playfair Display', serif", color: CREAM, fontWeight: 700, lineHeight: 1.25, marginBottom: 6 }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                    {card.subtitle}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom note */}
          <p style={{ textAlign: "center", marginTop: 32, fontSize: 13, color: "rgba(245,240,232,0.35)" }}>
            Built for us, by us. Free to explore.
          </p>
        </div>
      </div>
    );
  }

  // ── Preview screen ────────────────────────────────────────────────────────
  if (stage === "preview" && selected) {
    const card = CARDS.find((c) => c.id === selected)!;
    return (
      <div style={pageStyle}>
        <div ref={topRef} />
        <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(202,146,43,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 0 120px", position: "relative" }}>
          {/* Back button */}
          <div style={{ padding: "20px 20px 0" }}>
            <button
              onClick={() => { setStage("selection"); setSelected(null); }}
              style={{ background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, padding: 0, fontFamily: "inherit" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Choose a different preview
            </button>
          </div>

          {/* Preview label */}
          <div style={{ padding: "20px 20px 0", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              Your Preview
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: "clamp(22px, 6vw, 30px)", fontFamily: "'Playfair Display', serif", color: CREAM, fontWeight: 700 }}>
              {card.title}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 340, marginInline: "auto" }}>
              {card.hook}
            </p>
          </div>

          {/* Phone frame mockup */}
          <div style={{ margin: "24px 20px", background: "#111", borderRadius: 32, padding: "10px", boxShadow: `0 0 0 2px rgba(202,146,43,0.35), 0 24px 80px rgba(0,0,0,0.6)`, overflow: "hidden" }}>
            {/* Notch */}
            <div style={{ width: 80, height: 22, background: "#111", borderRadius: "0 0 14px 14px", margin: "0 auto 4px", position: "relative", zIndex: 2 }} />
            {/* Screen content */}
            <div style={{ height: 400, borderRadius: 22, overflow: "hidden" }}>
              {PREVIEW_CONTENT[selected]}
            </div>
            {/* Home bar */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
              <div style={{ width: 100, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2 }} />
            </div>
          </div>

          {/* Feature highlights */}
          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {selected === "safety" && [
              "Community-verified safe routes updated in real time",
              "Historical sundown town data from documented records",
              "Push alerts from people in the area right now",
            ].map((f) => (
              <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: GOLD, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
            {selected === "discovery" && [
              "Verified ownership badges — Black-owned, Indigenous-owned, Immigrant-owned",
              "Community reviews from people who look like you",
              "Map clusters showing business density by neighborhood",
            ].map((f) => (
              <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: GOLD, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
            {selected === "business" && [
              "Real-time dashboard: views, saves, foot traffic trends",
              "Flash deals to attract loyal community customers",
              "Direct community feedback — no algorithm middleman",
            ].map((f) => (
              <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: GOLD, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
            {selected === "community" && [
              "Local events, cultural heritage sites, HBCU alumni networks",
              "Community posts from people in your city — real voices",
              "Curated cultural map layer — toggle anytime",
            ].map((f) => (
              <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: GOLD, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky CTA */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 20px 28px", background: `linear-gradient(to top, ${BROWN} 70%, transparent)`, display: "flex", justifyContent: "center", zIndex: 10 }}>
          <button
            onClick={() => setStage("signup")}
            style={{
              width: "100%",
              maxWidth: 480,
              padding: "16px 28px",
              background: GOLD,
              color: BROWN,
              border: "none",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Playfair Display', serif",
              boxShadow: `0 4px 24px rgba(202,146,43,0.4)`,
              letterSpacing: "0.01em",
            }}
          >
            {selected === "business" ? "Claim My Business — Join the Waitlist" : "I Need This Today — Join the Waitlist"}
          </button>
        </div>
      </div>
    );
  }

  // ── Signup screen ─────────────────────────────────────────────────────────
  if (stage === "signup" && selected) {
    return (
      <div style={pageStyle}>
        <div ref={topRef} />
        <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(202,146,43,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px 60px", position: "relative" }}>
          <button
            onClick={() => setStage("preview")}
            style={{ background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, padding: 0, fontFamily: "inherit", marginBottom: 32 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to preview
          </button>
          <WaitlistForm
            previewChoice={selected}
            utmParams={utmParams}
            onSuccess={(pos) => { setWaitlistPosition(pos); setStage("success"); }}
          />
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  return (
    <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div ref={topRef} />
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(202,146,43,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 24px", textAlign: "center", position: "relative" }}>
        {/* Seal */}
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: `2px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", boxShadow: `0 0 40px rgba(202,146,43,0.3)` }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M6 16l7 7L26 9" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>

        <h1 style={{ margin: "0 0 14px", fontSize: 32, fontFamily: "'Playfair Display', serif", color: CREAM, fontWeight: 700 }}>
          You're on the list, family.
        </h1>

        {waitlistPosition > 0 && (
          <div style={{ display: "inline-block", padding: "6px 18px", background: "rgba(202,146,43,0.15)", border: `1px solid rgba(202,146,43,0.4)`, borderRadius: 24, fontSize: 13, color: GOLD, fontWeight: 600, marginBottom: 20 }}>
            #{waitlistPosition.toLocaleString()} in line
          </div>
        )}

        <p style={{ margin: "0 0 32px", fontSize: 16, color: MUTED, lineHeight: 1.7 }}>
          We're building this for us, by us. We'll notify you the second your city goes live. Until then, keep the community strong.
        </p>

        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(202,146,43,0.2)", borderRadius: 14, padding: "18px 20px", textAlign: "left" }}>
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Spread the word</div>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: MUTED }}>Know someone who needs this? Share the map.</p>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "Share on X", href: `https://twitter.com/intent/tweet?text=I just joined the Mapping With Melanin waitlist — a community directory for finding trusted businesses and safe routes.&url=https://www.mappingwithmelanin.com/preview` },
              { label: "Share Link", href: "https://www.mappingwithmelanin.com/preview" },
            ].map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: "9px 12px", background: "rgba(202,146,43,0.12)", border: `1px solid rgba(202,146,43,0.3)`, borderRadius: 10, color: GOLD, fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none", display: "block" }}>
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
