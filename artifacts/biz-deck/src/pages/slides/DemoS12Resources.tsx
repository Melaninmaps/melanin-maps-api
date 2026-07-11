const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS12Resources() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 40%, rgba(202,146,43,0.07), transparent 50%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>WELLNESS & RESOURCES</div>
        <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.1, marginBottom: "1vw" }}>
          We built the resources the community actually needs.
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", lineHeight: 1.7 }}>
          We can't build a platform for the whole person and ignore mental health. The melanated diaspora faces disproportionate barriers to mental health care — stigma, cost, cultural mismatch. We put these resources here because being a trusted community platform means showing up for the hardest moments too.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {["Crisis resources are one tap away — not buried three menus deep", "Black-specific mental health organizations curated, not generically listed", "Meeting locators serve recovery communities with shared cultural context", "Resources appear in the community tab — normalized, not hidden", "Our presence here signals that wellness is part of belonging"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#3A2010" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two phones */}
      <div className="absolute" style={{ right: "3vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "2vw" }}>
        {/* Phone 1 — Crisis & mental health */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.75vw", fontWeight: 800 }}>Mental Health & Resources</div>
            {/* Crisis banner */}
            <div style={{ background: "rgba(180,30,30,0.2)", borderRadius: "0.7vw", padding: "0.55vw 0.7vw", border: "1px solid rgba(180,30,30,0.5)" }}>
              <div style={{ color: "#E86060", fontSize: "0.46vw", fontWeight: 700, marginBottom: "0.25vw" }}>IMMEDIATE SUPPORT</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3vw" }}>
                {[
                  { label: "988 Suicide & Crisis Lifeline", action: "Call" },
                  { label: "SAMHSA: 1-800-662-4357", action: "Call" },
                  { label: "Crisis Text Line — Text HOME to 741741", action: "Text" },
                ].map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#D9C4A3", fontSize: "0.48vw" }}>{c.label}</span>
                    <div style={{ background: "rgba(180,30,30,0.3)", borderRadius: "0.3vw", padding: "0.08vw 0.35vw", border: "1px solid rgba(180,30,30,0.5)" }}>
                      <span style={{ color: "#E86060", fontSize: "0.42vw", fontWeight: 700 }}>{c.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 700 }}>BLACK MENTAL HEALTH</div>
            {["Therapy for Black Girls", "Black Men Heal", "Boris Lawrence Henson Foundation", "National Queer & Trans Therapists"].map((org, i) => (
              <div key={i} style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.5vw", padding: "0.42vw 0.55vw", border: "1px solid rgba(202,146,43,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#D9C4A3", fontSize: "0.5vw" }}>{org}</span>
                <span style={{ color: "#CA922B", fontSize: "0.44vw" }}>Visit →</span>
              </div>
            ))}
          </div>
        </Phone>

        {/* Phone 2 — AA/NA + Recovery */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.72vw", fontWeight: 800 }}>Recovery Resources</div>
            <div style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 700 }}>MEETING FINDERS</div>
            {["AA Meeting Locator — aa.org", "NA Meetings Near You — na.org", "SMART Recovery Meetings", "Al-Anon Family Groups", "Celebrate Recovery Finder"].map((r, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.5vw", padding: "0.42vw 0.55vw", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#D9C4A3", fontSize: "0.5vw" }}>{r}</span>
                <span style={{ color: "#CA922B", fontSize: "0.44vw" }}>→</span>
              </div>
            ))}
            <div style={{ height: "1px", background: "rgba(202,146,43,0.15)" }} />
            <div style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 700 }}>TREATMENT LOCATORS</div>
            {["SAMHSA Treatment Finder", "Substance Abuse Locator", "Inpatient/Outpatient Programs", "Community Health Centers"].map((r, i) => (
              <div key={i} style={{ background: "rgba(202,146,43,0.07)", borderRadius: "0.5vw", padding: "0.42vw 0.55vw", border: "1px solid rgba(202,146,43,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#D9C4A3", fontSize: "0.5vw" }}>{r}</span>
                <span style={{ color: "#CA922B", fontSize: "0.44vw" }}>Find →</span>
              </div>
            ))}
          </div>
        </Phone>
      </div>
    </div>
  );
}
