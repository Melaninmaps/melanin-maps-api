import { useState } from "react";

const PRIMARY = "#C4622D";
const BG = "#1A0E07";
const CARD = "#2A1508";
const CARD2 = "#221104";
const BORDER = "#3D2010";
const TEXT = "#FBF7F0";
const MUTED = "#A08070";
const GREEN = "#2D7A4F";
const PURPLE = "#7C3AED";
const BLUE = "#3B6EA5";
const GOLD = "#C9922B";
const RED = "#DC2626";

type Tab = "my" | "spaces" | "business";

interface Toggles {
  hideNotInterested: boolean;
  hideUnresolvedAlerts: boolean;
  showWouldReturnAlone: boolean;
  prioritizeMinority: boolean;
  hidePreviouslyReported: boolean;
  safetyAlertsOnlySaved: boolean;
  mentorshipOnly: boolean;
  pauseDMs: boolean;
  requireFollowers: boolean;
  disablePromo: boolean;
  verifiedOnly: boolean;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        backgroundColor: on ? PRIMARY : BORDER, position: "relative", flexShrink: 0,
        transition: "background-color 0.2s", padding: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: 9, backgroundColor: TEXT,
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }} />
    </button>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 12, marginTop: 20 }}>
      <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0 }}>{title}</p>
      {subtitle && <p style={{ color: MUTED, fontSize: 11, margin: "3px 0 0", lineHeight: 1.5 }}>{subtitle}</p>}
    </div>
  );
}

function ToggleRow({
  icon, label, sub, on, onToggle, accent,
}: { icon: string; label: string; sub?: string; on: boolean; onToggle: () => void; accent?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: "center" }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: on ? (accent ?? TEXT) : TEXT, fontSize: 13, fontWeight: 500, margin: 0 }}>{label}</p>
        {sub && <p style={{ color: MUTED, fontSize: 11, margin: "2px 0 0", lineHeight: 1.5 }}>{sub}</p>}
      </div>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}

function InfoCard({ icon, color, bg, border, title, body }: { icon: string; color: string; bg: string; border: string; title: string; body: string }) {
  return (
    <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <p style={{ color, fontSize: 12, fontWeight: 700, margin: "0 0 3px" }}>{title}</p>
        <p style={{ color, fontSize: 11, margin: 0, lineHeight: 1.6, opacity: 0.9 }}>{body}</p>
      </div>
    </div>
  );
}

function BoundaryPill({ label, onRemove, color }: { label: string; onRemove: () => void; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 12px", borderRadius: 20, backgroundColor: color + "15", border: `1px solid ${color}30` }}>
      <span style={{ color, fontSize: 12, fontWeight: 500 }}>{label}</span>
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color, fontSize: 14, padding: 0, lineHeight: 1, opacity: 0.7 }}>✕</button>
    </div>
  );
}

const USER_BOUNDS_DEMO = ["@quietwalker", "@nova_trip22"];
const BIZ_BOUNDS_DEMO = ["Sunny Grill House", "Metro Staffing Co."];

export function CommunityBoundaries() {
  const [tab, setTab] = useState<Tab>("my");
  const [userBounds, setUserBounds] = useState<string[]>(USER_BOUNDS_DEMO);
  const [bizBounds, setBizBounds] = useState<string[]>(BIZ_BOUNDS_DEMO);
  const [toggles, setToggles] = useState<Toggles>({
    hideNotInterested: true,
    hideUnresolvedAlerts: false,
    showWouldReturnAlone: false,
    prioritizeMinority: true,
    hidePreviouslyReported: true,
    safetyAlertsOnlySaved: false,
    mentorshipOnly: false,
    pauseDMs: false,
    requireFollowers: false,
    disablePromo: true,
    verifiedOnly: false,
  });
  const [saved, setSaved] = useState(false);

  const t = (key: keyof Toggles) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "my", label: "My Boundaries", icon: "🛡️" },
    { id: "spaces", label: "Safe Space", icon: "✨" },
    { id: "business", label: "Business", icon: "🏪" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0D0704", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", padding: "16px" }}>
      <div style={{ width: 390, height: 844, backgroundColor: BG, borderRadius: 24, border: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <p style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: 0 }}>Community Boundaries</p>
              <p style={{ color: MUTED, fontSize: 12, margin: "3px 0 0" }}>Customize your experience</p>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: PURPLE + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
          </div>
          <div style={{ backgroundColor: PRIMARY + "10", border: `1px solid ${PRIMARY}25`, borderRadius: 10, padding: "7px 12px" }}>
            <p style={{ color: PRIMARY, fontSize: 11, margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
              We don't remove information — we give you control over your experience. Community knowledge stays intact.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ flex: 1, padding: "10px 4px", background: "none", border: "none", cursor: "pointer", borderBottom: `2px solid ${tab === id ? PRIMARY : "transparent"}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "border-color 0.15s" }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ color: tab === id ? PRIMARY : MUTED, fontSize: 10, fontWeight: tab === id ? 700 : 500 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 16px" }}>

          {/* ── MY BOUNDARIES ── */}
          {tab === "my" && (
            <div>
              {/* User → User */}
              <SectionHeader title="User Boundaries" subtitle="Control how other community members interact with you" />
              <InfoCard icon="💬" color="#7EB0DD" bg={BLUE + "10"} border={BLUE + "28"}
                title="Messages & mentions"
                body="Members you've set boundaries with can't message you or tag you in posts. Their content won't appear in your community feed." />

              {userBounds.length > 0 && (
                <div>
                  <p style={{ color: MUTED, fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Active user boundaries</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {userBounds.map(u => (
                      <BoundaryPill key={u} label={u} color={BLUE} onRemove={() => setUserBounds(prev => prev.filter(x => x !== u))} />
                    ))}
                  </div>
                </div>
              )}

              <button style={{ width: "100%", padding: "10px 0", borderRadius: 12, border: `1px dashed ${BORDER}`, backgroundColor: "transparent", color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 4 }}>
                + Set boundary with a user
              </button>

              <div style={{ backgroundColor: CARD2, borderRadius: 10, padding: "8px 12px", marginTop: 10, marginBottom: 4 }}>
                <p style={{ color: MUTED, fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                  📝 <strong style={{ color: TEXT }}>Reviews and safety reports</strong> about businesses remain visible — community knowledge is preserved even with personal boundaries in place.
                </p>
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: BORDER, margin: "20px 0 4px" }} />

              {/* User → Business */}
              <SectionHeader title="Business Boundaries" subtitle="Manage which businesses appear in your experience" />
              <InfoCard icon="🔕" color="#C4B5FD" bg={PURPLE + "10"} border={PURPLE + "28"}
                title="Hidden from your view"
                body="These businesses won't appear in searches, recommendations, or suggested itineraries. They still exist on the platform — just not in your feed." />

              {bizBounds.length > 0 && (
                <div>
                  <p style={{ color: MUTED, fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Hidden businesses</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {bizBounds.map(b => (
                      <BoundaryPill key={b} label={b} color={PURPLE} onRemove={() => setBizBounds(prev => prev.filter(x => x !== b))} />
                    ))}
                  </div>
                </div>
              )}

              <button style={{ width: "100%", padding: "10px 0", borderRadius: 12, border: `1px dashed ${BORDER}`, backgroundColor: "transparent", color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                + Hide a business from your experience
              </button>

              {/* Business → User (limited) */}
              <div style={{ height: 1, backgroundColor: BORDER, margin: "20px 0 4px" }} />
              <SectionHeader title="Business Interaction Controls" subtitle="For business accounts — manage incoming interactions" />
              <ToggleRow icon="💬" label="Accept direct messages" sub="Pause to stop all incoming DMs" on={!toggles.pauseDMs} onToggle={() => t("pauseDMs")} />
              <ToggleRow icon="👥" label="Allow post comments" sub="From all community members" on={!toggles.requireFollowers} onToggle={() => t("requireFollowers")} />
              <ToggleRow icon="📢" label="Receive promotional messages" on={!toggles.disablePromo} onToggle={() => t("disablePromo")} />
              <ToggleRow icon="✅" label="Verified users only" sub="Limit DMs to verified accounts" on={toggles.verifiedOnly} onToggle={() => t("verifiedOnly")} />

              <div style={{ backgroundColor: CARD2, borderRadius: 10, padding: "8px 12px", marginTop: 12 }}>
                <p style={{ color: MUTED, fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                  🚫 Businesses <strong style={{ color: TEXT }}>cannot</strong> prevent legitimate reviews or safety reports from being submitted. These protections exist for the whole community.
                </p>
              </div>
            </div>
          )}

          {/* ── SAFE SPACE PREFERENCES ── */}
          {tab === "spaces" && (
            <div>
              <SectionHeader title="Safe Space Preferences" subtitle="Shape your feed to match your comfort and values — not just an algorithm" />

              <InfoCard icon="✨" color={GOLD} bg={GOLD + "10"} border={GOLD + "28"}
                title="Your experience, your rules"
                body="These aren't filters — they're preferences. You're telling the platform what matters to you. Community safety data is always preserved for everyone." />

              <div style={{ marginTop: 4 }}>
                <ToggleRow icon="🚫" label="Hide 'Not Interested' businesses" sub="Businesses you've marked won't appear in your feed" on={toggles.hideNotInterested} onToggle={() => t("hideNotInterested")} accent={GREEN} />
                <ToggleRow icon="⚠️" label="Hide businesses with unresolved safety alerts" sub="Community-flagged concerns still being reviewed" on={toggles.hideUnresolvedAlerts} onToggle={() => t("hideUnresolvedAlerts")} accent={RED} />
                <ToggleRow icon="🚶" label="Prioritize 'Would Return Alone' rated" sub="Surfaces businesses with strong solo safety scores" on={toggles.showWouldReturnAlone} onToggle={() => t("showWouldReturnAlone")} accent={GREEN} />
                <ToggleRow icon="✊🏾" label="Prioritize verified minority-owned" sub="Surfaces Black-Owned and minority-certified businesses first" on={toggles.prioritizeMinority} onToggle={() => t("prioritizeMinority")} accent={PRIMARY} />
                <ToggleRow icon="📋" label="Hide businesses I've previously reported" sub="Removes them from your personal recommendations" on={toggles.hidePreviouslyReported} onToggle={() => t("hidePreviouslyReported")} accent={PURPLE} />
                <ToggleRow icon="🔔" label="Safety alerts only for saved places" sub="Limit safety notifications to businesses you've bookmarked" on={toggles.safetyAlertsOnlySaved} onToggle={() => t("safetyAlertsOnlySaved")} />
              </div>

              <div style={{ height: 1, backgroundColor: BORDER, margin: "20px 0 12px" }} />

              {/* Auto safety protection */}
              <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Automatic Safety Protection</p>
              <InfoCard icon="🤖" color="#C4B5FD" bg={PURPLE + "10"} border={PURPLE + "28"}
                title="Platform auto-escalation"
                body="When multiple verified users report harassment, hate speech, threats, or unsafe behavior — the platform automatically hides the content pending review, escalates to moderation, and notifies both parties throughout the process." />

              <div style={{ backgroundColor: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                {[
                  { icon: "🔍", label: "Content temporarily hidden", sub: "Pending platform review" },
                  { icon: "📣", label: "Escalated to moderation team", sub: "Reviewed within 24 hours" },
                  { icon: "📨", label: "Both parties notified", sub: "Kept informed throughout the process" },
                ].map((row, i) => (
                  <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: i < 2 ? `1px solid ${BORDER}` : "none" }}>
                    <span style={{ fontSize: 16 }}>{row.icon}</span>
                    <div>
                      <p style={{ color: TEXT, fontSize: 12, fontWeight: 600, margin: 0 }}>{row.label}</p>
                      <p style={{ color: MUTED, fontSize: 11, margin: "2px 0 0" }}>{row.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, backgroundColor: GREEN + "10", border: `1px solid ${GREEN}28`, borderRadius: 12, padding: "10px 14px" }}>
                <p style={{ color: "#4ADE80", fontSize: 11, fontWeight: 600, margin: "0 0 3px" }}>Our guiding principle</p>
                <p style={{ color: "#4ADE80", fontSize: 11, margin: 0, lineHeight: 1.65, opacity: 0.9 }}>
                  We don't remove information because two people disagree. We remove content that violates community standards — harassment, threats, doxxing, or hate speech. Everything else stays visible, managed, and moderated fairly.
                </p>
              </div>
            </div>
          )}

          {/* ── BUSINESS PREFERENCES ── */}
          {tab === "business" && (
            <div>
              <SectionHeader title="Business Community Preferences" subtitle="Control how your business engages with the community" />

              <InfoCard icon="🏪" color={GOLD} bg={GOLD + "10"} border={GOLD + "28"}
                title="For business accounts only"
                body="These preferences let you shape the kind of community interactions your business receives — without affecting your visibility in search or reviews." />

              <div style={{ marginTop: 4 }}>
                <ToggleRow icon="🎓" label="Mentorship requests only" sub="Only receive mentorship and partnership inquiries" on={toggles.mentorshipOnly} onToggle={() => t("mentorshipOnly")} accent={BLUE} />
                <ToggleRow icon="💬" label="Pause direct messages" sub="Temporarily stop all incoming DMs" on={toggles.pauseDMs} onToggle={() => t("pauseDMs")} accent={MUTED} />
                <ToggleRow icon="👥" label="Require followers before messaging" sub="Only people who follow you can send a message" on={toggles.requireFollowers} onToggle={() => t("requireFollowers")} />
                <ToggleRow icon="📢" label="Disable promotional messages" sub="Opt out of marketing and promotional DMs" on={toggles.disablePromo} onToggle={() => t("disablePromo")} accent={GREEN} />
                <ToggleRow icon="✅" label="Verified users only" sub="Limit messages to verified community members" on={toggles.verifiedOnly} onToggle={() => t("verifiedOnly")} />
              </div>

              <div style={{ height: 1, backgroundColor: BORDER, margin: "20px 0 12px" }} />

              <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>What businesses can never do</p>
              <div style={{ backgroundColor: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                {[
                  { icon: "🚫", label: "Prevent a review from being submitted" },
                  { icon: "🚫", label: "Suppress a legitimate safety report" },
                  { icon: "🚫", label: "Hide their profile from the community" },
                  { icon: "🚫", label: "Remove community-generated ratings" },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <span style={{ fontSize: 14 }}>{row.icon}</span>
                    <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{row.label}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, backgroundColor: PRIMARY + "10", border: `1px solid ${PRIMARY}25`, borderRadius: 12, padding: "10px 14px" }}>
                <p style={{ color: PRIMARY, fontSize: 11, fontWeight: 600, margin: "0 0 3px" }}>Platform promise</p>
                <p style={{ color: PRIMARY, fontSize: 11, margin: 0, lineHeight: 1.65, opacity: 0.9 }}>
                  These protections exist because the community's ability to share honest, accurate feedback is what makes Mapping with Melanin™ worth trusting.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px 20px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
          {saved ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, backgroundColor: GREEN + "20", border: `1px solid ${GREEN}40` }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <span style={{ color: "#4ADE80", fontSize: 14, fontWeight: 700 }}>Preferences saved</span>
            </div>
          ) : (
            <button onClick={handleSave}
              style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", backgroundColor: PRIMARY, color: TEXT, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Save Preferences
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
