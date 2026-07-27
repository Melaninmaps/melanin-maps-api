const Phone = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: "22vw", height: "41.25vw", background: "linear-gradient(160deg,#2c2c2c,#1a1a1a)", borderRadius: "3.5vw", padding: "1.4vw 0.85vw", boxShadow: "0 3vw 10vw rgba(0,0,0,0.95), 0 0 0 0.15vw rgba(255,255,255,0.06)", position: "relative" }}>
    <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4.5vw", height: "0.55vw", background: "#111", borderRadius: "0.5vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: "2.8vw", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

export default function DemoS04ProfileSetup() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 25% 60%, rgba(202,146,43,0.09), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.45vh", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "5vw", width: "33vw", top: "10%", bottom: "10%", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "1.5vw" }}>COMMUNITY JOURNEY · SCREEN 3 OF 29</div>
        <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.8vw" }}>
          Build your<br />profile.
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.4vw", opacity: 0.7 }} />
        <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40", lineHeight: 1.7, marginBottom: "2.5vw" }}>
          Profile setup is short and intentional. We ask only what serves the community — your name, your city, and what roles you play. Are you a business owner? A content creator? An organizer? That context shapes everything.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw" }}>
          {[
            "Role flags (owner, creator, organizer) tailor every view",
            "City sets the neighborhood feed, map, and events instantly",
            "Profile photo optional — community, not vanity",
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "0.8vw", alignItems: "flex-start" }}>
              <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.5vw", flexShrink: 0 }} />
              <span className="font-body" style={{ fontSize: "0.88vw", color: "#D9C4A3", lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", right: "8vw", top: "50%", transform: "translateY(-50%)" }}>
        <Phone>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "2.2vw 1.2vw 1.2vw" }}>
            {/* Progress */}
            <div style={{ marginBottom: "1.8vw" }}>
              <div style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.5vw" }}>STEP 1 OF 4 — YOUR PROFILE</div>
              <div style={{ height: "0.25vw", background: "rgba(202,146,43,0.2)", borderRadius: "0.2vw" }}>
                <div style={{ width: "25%", height: "100%", background: "#CA922B", borderRadius: "0.2vw" }} />
              </div>
            </div>

            <div style={{ color: "#FAF6EF", fontSize: "1.05vw", fontWeight: 800, marginBottom: "0.4vw" }}>Tell us about yourself</div>
            <div style={{ color: "#5C3A1A", fontSize: "0.52vw", marginBottom: "1.8vw", lineHeight: 1.5 }}>This helps us personalize your experience right away</div>

            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "1.5vw" }}>
              <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "50%", background: "linear-gradient(135deg, #CA922B, #7B5408)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#FAF6EF", fontSize: "1.2vw", fontWeight: 800 }}>Z</span>
              </div>
              <div style={{ padding: "0.4vw 0.8vw", borderRadius: "0.6vw", border: "1px solid rgba(202,146,43,0.4)", background: "rgba(202,146,43,0.08)" }}>
                <span style={{ color: "#CA922B", fontSize: "0.52vw", fontWeight: 700 }}>Add photo</span>
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw", marginBottom: "1.5vw" }}>
              {[
                { label: "FIRST NAME", value: "Zara" },
                { label: "LAST NAME", value: "Mitchell" },
                { label: "CITY / NEIGHBORHOOD", value: "Washington, DC" },
              ].map((f, i) => (
                <div key={i}>
                  <div style={{ color: "#A87A40", fontSize: "0.48vw", marginBottom: "0.25vw", fontWeight: 600 }}>{f.label}</div>
                  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.6vw", padding: "0.55vw 0.8vw", border: `1px solid ${i === 2 ? "rgba(202,146,43,0.4)" : "rgba(255,255,255,0.08)"}` }}>
                    <span style={{ color: "#FAF6EF", fontSize: "0.6vw" }}>{f.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Role chips */}
            <div style={{ marginBottom: "1.5vw" }}>
              <div style={{ color: "#A87A40", fontSize: "0.48vw", marginBottom: "0.4vw", fontWeight: 600 }}>I AM A (SELECT ALL THAT APPLY)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4vw" }}>
                {[
                  { label: "Community Member", active: true },
                  { label: "Business Owner", active: false },
                  { label: "Content Creator", active: false },
                  { label: "Community Organizer", active: false },
                ].map((r, i) => (
                  <div key={i} style={{ padding: "0.35vw 0.6vw", borderRadius: "2vw", background: r.active ? "rgba(202,146,43,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${r.active ? "#CA922B" : "rgba(255,255,255,0.1)"}` }}>
                    <span style={{ color: r.active ? "#CA922B" : "#5C3A1A", fontSize: "0.48vw", fontWeight: r.active ? 700 : 400 }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "auto", background: "#CA922B", borderRadius: "0.8vw", padding: "0.75vw", textAlign: "center" }}>
              <span style={{ color: "#1C0E06", fontSize: "0.7vw", fontWeight: 800 }}>Continue</span>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
