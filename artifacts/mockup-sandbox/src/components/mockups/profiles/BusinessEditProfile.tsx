const GOLD = "#CA922B";
const BG = "#0F0800";
const CARD = "#1C0E00";
const CARD2 = "#231200";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.4)";
const GREEN = "#2D7A4F";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-4 mb-4">
      <p style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: 11, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 10 }}>{title}</p>
      <div style={{ background: CARD2, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  label, value, placeholder, isUrl = false, isTextarea = false, badge, last = false
}: {
  label: string; value?: string; placeholder?: string;
  isUrl?: boolean; isTextarea?: boolean; badge?: string; last?: boolean;
}) {
  return (
    <div style={{ padding: "12px 16px", borderBottom: last ? "none" : `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, fontFamily: "system-ui" }}>{label}</span>
        {isUrl && (
          <span style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}55`, borderRadius: 4, padding: "1px 6px", fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: 0.5 }}>URL</span>
        )}
        {badge && (
          <span style={{ background: `${GREEN}22`, border: `1px solid ${GREEN}55`, borderRadius: 4, padding: "1px 6px", fontSize: 9, color: GREEN, fontWeight: 700 }}>{badge}</span>
        )}
      </div>
      {isTextarea ? (
        <div style={{ background: `${BG}cc`, borderRadius: 8, border: `1px solid rgba(255,255,255,0.12)`, padding: "8px 10px", minHeight: 56 }}>
          <p style={{ color: value ? "rgba(255,255,255,0.85)" : MUTED, fontSize: 13, margin: 0, lineHeight: 1.5, fontFamily: "system-ui" }}>
            {value || placeholder}
          </p>
        </div>
      ) : (
        <div style={{ background: `${BG}cc`, borderRadius: 8, border: `1px solid rgba(255,255,255,0.12)`, padding: "9px 10px" }}>
          <p style={{ color: value ? "rgba(255,255,255,0.85)" : MUTED, fontSize: 13, margin: 0, fontFamily: "system-ui" }}>
            {value || placeholder}
          </p>
        </div>
      )}
    </div>
  );
}

function PhotoGrid() {
  const colors = ["#5C3A1E", "#3B1E0A", "#7B4F1A", "#2D1A08"];
  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, margin: 0 }}>Business Photos</p>
          <p style={{ color: MUTED, fontSize: 10, margin: "2px 0 0", fontFamily: "system-ui" }}>Tap to set cover · Long press to remove</p>
        </div>
        <span style={{ color: MUTED, fontSize: 10 }}>3/10</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {colors.map((c, i) => (
          <div key={i} style={{ position: "relative", width: 64, height: 64, borderRadius: 10, background: c, border: i === 0 ? `2.5px solid ${GOLD}` : `1px solid ${BORDER}`, flexShrink: 0 }}>
            {i === 0 && (
              <div style={{ position: "absolute", bottom: 3, left: 3, background: GOLD, borderRadius: 4, padding: "2px 5px", display: "flex", alignItems: "center", gap: 3 }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span style={{ color: "#fff", fontSize: 8, fontWeight: 700 }}>Cover</span>
              </div>
            )}
          </div>
        ))}
        <div style={{ width: 64, height: 64, borderRadius: 10, border: `1.5px dashed ${BORDER}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5" fill={GOLD}/><polyline points="21 15 16 10 5 21"/></svg>
          <span style={{ color: GOLD, fontSize: 9, fontWeight: 600 }}>Add</span>
        </div>
      </div>
    </div>
  );
}

function VideoLinks() {
  const vids = [
    { platform: "YouTube", icon: "▶", url: "youtube.com/watch?v=abc123" },
    { platform: "TikTok", icon: "♪", url: "tiktok.com/@deja_cooks/123" },
  ];
  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, margin: 0 }}>Video Links</p>
            <span style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}55`, borderRadius: 4, padding: "1px 6px", fontSize: 9, color: GOLD, fontWeight: 700 }}>URL</span>
          </div>
          <p style={{ color: MUTED, fontSize: 10, margin: "2px 0 0" }}>YouTube, TikTok, Instagram, Facebook</p>
        </div>
        <span style={{ color: MUTED, fontSize: 10 }}>2/5</span>
      </div>
      {vids.map((v, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: `${BG}cc`, borderRadius: 8, border: `1px solid rgba(255,255,255,0.1)`, padding: "8px 10px", marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: `${GOLD}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: GOLD, fontSize: 12 }}>{v.icon}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: 600, margin: 0 }}>{v.platform}</p>
            <p style={{ color: MUTED, fontSize: 10, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.url}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, border: `1px dashed ${BORDER}` }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span style={{ color: GOLD, fontSize: 11, fontWeight: 600 }}>Paste a video URL…</span>
      </div>
    </div>
  );
}

function IntroVideo() {
  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, margin: 0 }}>Owner Intro Video</p>
            <span style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}55`, borderRadius: 4, padding: "1px 6px", fontSize: 9, color: GOLD, fontWeight: 700 }}>URL</span>
            <span style={{ background: `${GREEN}22`, border: `1px solid ${GREEN}55`, borderRadius: 4, padding: "1px 6px", fontSize: 9, color: GREEN, fontWeight: 700 }}>hosted</span>
          </div>
          <p style={{ color: MUTED, fontSize: 10, margin: "3px 0 0", lineHeight: 1.4 }}>Upload a short video (≤2 min). Shows a "Watch Owner Intro" button on your listing</p>
        </div>
        <div style={{ background: `${GOLD}15`, borderRadius: 10, padding: "8px 12px", border: `1px solid ${GOLD}30`, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill={GOLD} stroke="none"/></svg>
          <span style={{ color: GOLD, fontSize: 9, fontWeight: 700 }}>Live</span>
        </div>
      </div>
    </div>
  );
}

function ScheduleRow() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const open = [true, true, true, true, true, true, false];
  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, margin: 0 }}>Weekly Availability Calendar</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: MUTED, fontSize: 10 }}>Show on listing</span>
          <div style={{ width: 30, height: 16, borderRadius: 8, background: GREEN, display: "flex", alignItems: "center", padding: "0 2px", justifyContent: "flex-end" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff" }} />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {days.map((d, i) => (
          <div key={d} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: open[i] ? "rgba(255,255,255,0.8)" : MUTED, fontSize: 11, fontWeight: 600, width: 30 }}>{d}</span>
            {open[i] ? (
              <>
                <div style={{ flex: 1, background: `${BG}cc`, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 6, padding: "5px 8px", textAlign: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>9:00 AM</span>
                </div>
                <span style={{ color: MUTED, fontSize: 10 }}>–</span>
                <div style={{ flex: 1, background: `${BG}cc`, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 6, padding: "5px 8px", textAlign: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>{i === 5 ? "6:00 PM" : "5:00 PM"}</span>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "5px 8px", textAlign: "center" }}>
                <span style={{ color: MUTED, fontSize: 10 }}>Closed</span>
              </div>
            )}
            <div style={{ width: 28, height: 16, borderRadius: 8, background: open[i] ? GREEN : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", padding: "0 2px", justifyContent: open[i] ? "flex-end" : "flex-start" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BusinessEditProfile() {
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, -apple-system, sans-serif", overflowX: "hidden" }}>
      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px 4px" }}>
        <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>9:41</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="3" width="3" height="8" rx="1" fill="white" opacity="0.4"/><rect x="4" y="2" width="3" height="9" rx="1" fill="white" opacity="0.6"/><rect x="8" y="0" width="3" height="11" rx="1" fill="white" opacity="0.8"/><rect x="12" y="0" width="3" height="11" rx="1" fill="white"/></svg>
          <div style={{ display: "flex", alignItems: "center" }}><div style={{ width: 24, height: 12, border: "1px solid rgba(255,255,255,0.6)", borderRadius: 2, position: "relative" }}><div style={{ position: "absolute", left: 2, top: 2, bottom: 2, width: 16, background: "white", borderRadius: 1 }}/></div></div>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "Georgia, serif" }}>Edit Business Profile</span>
        <div style={{ background: GOLD, borderRadius: 8, padding: "7px 16px" }}>
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>Save</span>
        </div>
      </div>

      <div style={{ paddingTop: 20, paddingBottom: 100 }}>

        {/* URL badge legend */}
        <div style={{ margin: "0 16px 20px", background: `${GOLD}10`, border: `1px solid ${GOLD}30`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}55`, borderRadius: 4, padding: "2px 8px", fontSize: 9, color: GOLD, fontWeight: 700 }}>URL</span>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>Fields marked URL accept full links (https://…)</span>
        </div>

        {/* Photos */}
        <Section title="Photos & Media">
          <PhotoGrid />
          <VideoLinks />
          <IntroVideo />
        </Section>

        {/* Core info */}
        <Section title="Business Info">
          <Row label="Business Name" value="Deja's Soul Kitchen" />
          <Row label="Tagline" value="Soul food rooted in love and community." placeholder="One-line pitch shown under your name" />
          <Row label="Category" value="Food & Beverage" />
          <Row label="Subcategory" value="Soul Food / Southern" />
          <Row label="Description" value="We bring authentic Southern soul food to the community — from smothered chicken to peach cobbler, everything is made from scratch with love." isTextarea />
          <Row label="Price Range" value="$$" last />
        </Section>

        {/* Contact */}
        <Section title="Contact & Location">
          <Row label="Phone" value="(202) 555-0141" placeholder="(___) ___-____" />
          <Row label="Website" value="dejassoulkitchen.com" placeholder="yoursite.com" isUrl />
          <Row label="Hours (short label)" value="Mon–Sat 11am–9pm" placeholder='e.g. "Mon–Fri 9am–5pm" or "By Appointment"' />
          <Row label="Street Address" value="1418 U St NW" />
          <Row label="City" value="Washington" />
          <Row label="State" value="DC" />
          <Row label="ZIP" value="20009" last />
        </Section>

        {/* Social */}
        <Section title="Social Media">
          <Row label="Instagram" value="@deja_soul_kitchen" placeholder="@handle or full URL" isUrl />
          <Row label="TikTok" value="@dejas_kitchen" placeholder="@handle or full URL" isUrl />
          <Row label="Facebook" placeholder="Page name or full URL" isUrl />
          <Row label="Twitter / X" placeholder="@handle or full URL" isUrl />
          <Row label="YouTube" value="youtube.com/@dejakitchen" placeholder="Channel URL" isUrl />
          <Row label="Pinterest" placeholder="Profile URL" isUrl last />
        </Section>

        {/* Owner */}
        <Section title="Owner Story">
          <Row label="Owner Name" value="Deja Williams" />
          <Row label="Owner Bio" value="DC-native chef with 15 years of experience bringing Grandma Bea's recipes to new generations." isTextarea />
          <Row label="Owner Story" value="I started selling plates out of my apartment in 2019. What began as a pandemic project became a full restaurant in 2022 — proof that community support changes everything." isTextarea last />
        </Section>

        {/* Schedule */}
        <Section title="Availability">
          <ScheduleRow />
        </Section>

        {/* Milestones */}
        <Section title="Milestones & Trust">
          <Row label="In Business Since" value="2019" placeholder="Year founded" />
          <Row label="At Current Location Since" value="2022" placeholder="Year you moved to this address" badge="shown as badge" last />
        </Section>

      </div>
    </div>
  );
}
