const Phone = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: "22vw", height: "41.25vw", background: "linear-gradient(160deg,#2c2c2c,#1a1a1a)", borderRadius: "3.5vw", padding: "1.4vw 0.85vw", boxShadow: "0 3vw 10vw rgba(0,0,0,0.95), 0 0 0 0.15vw rgba(255,255,255,0.06)", position: "relative" }}>
    <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4.5vw", height: "0.55vw", background: "#111", borderRadius: "0.5vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: "2.8vw", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

const safetyCards = [
  { title: "Safety Survey", desc: "Rate your neighborhood experience", icon: "survey", action: "Submit Report" },
  { title: "Check-In", desc: "Share your live location with trusted contacts", icon: "checkin", action: "Check In Now" },
  { title: "Meetup Verify", desc: "Verify a business meets before you arrive", icon: "verify", action: "Verify Meeting" },
  { title: "Move Alerts", desc: "Get notified of safety changes near you", icon: "alert", action: "Configure" },
];

export default function DemoS12SafetyHub() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#130A03" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 25% 50%, rgba(202,146,43,0.1), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.45vh", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "5vw", width: "33vw", top: "10%", bottom: "10%", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "1.5vw" }}>COMMUNITY JOURNEY · SCREEN 11 OF 29</div>
        <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.8vw" }}>
          The Safety<br />Hub.
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.4vw", opacity: 0.7 }} />
        <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40", lineHeight: 1.7, marginBottom: "2.5vw" }}>
          Safety is not a disclaimer — it is a feature. The Safety Hub centralizes four tools that have no equivalent in mainstream apps: neighborhood surveys, live check-ins, meetup verification, and proactive move alerts built for communities that navigate racialized safety dynamics daily.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw" }}>
          {[
            "Surveys aggregate community experience — not police data, not algorithms",
            "Check-in shares live location with up to 5 trusted contacts for any duration",
            "Meetup Verify: confirm a business is open and staffed before you drive there",
            "Move Alerts notify you if a neighborhood's safety score drops significantly",
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "0.8vw", alignItems: "flex-start" }}>
              <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.5vw", flexShrink: 0 }} />
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3", lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", right: "8vw", top: "50%", transform: "translateY(-50%)" }}>
        <Phone>
          <div style={{ padding: "0.55vw 0.9vw 0.3vw", display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#E8D5B7", fontSize: "0.52vw", fontWeight: 700 }}>9:41</span>
            <div style={{ width: "1vw", height: "0.5vw", border: "1px solid rgba(232,213,183,0.5)", borderRadius: "0.12vw", position: "relative" }}>
              <div style={{ position: "absolute", left: "0.1vw", top: "0.09vw", bottom: "0.09vw", width: "75%", background: "#E8D5B7", borderRadius: "0.05vw" }} />
            </div>
          </div>
          <div style={{ flex: 1, padding: "0.5vw 0.9vw 0", display: "flex", flexDirection: "column", gap: "0.7vw", overflowY: "hidden" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.88vw", fontWeight: 800 }}>Safety Hub</div>

            {/* Neighborhood score card */}
            <div style={{ background: "linear-gradient(135deg, rgba(76,175,80,0.15), rgba(76,175,80,0.05))", borderRadius: "0.8vw", padding: "0.8vw", border: "1px solid rgba(76,175,80,0.3)" }}>
              <div style={{ color: "rgba(76,175,80,0.9)", fontSize: "0.45vw", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.2vw" }}>SHAW / U STREET — CURRENT AREA</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#FAF6EF", fontSize: "0.72vw", fontWeight: 800 }}>Community Safety Score</div>
                  <div style={{ color: "#A87A40", fontSize: "0.47vw", marginTop: "0.08vw" }}>Based on 247 community reports</div>
                </div>
                <div style={{ width: "2.5vw", height: "2.5vw", borderRadius: "50%", border: "2px solid rgba(76,175,80,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "rgba(76,175,80,0.9)", fontSize: "0.85vw", fontWeight: 800 }}>84</span>
                </div>
              </div>
            </div>

            {/* Safety cards */}
            {safetyCards.map((card, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.75vw", padding: "0.7vw", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#FAF6EF", fontSize: "0.6vw", fontWeight: 800 }}>{card.title}</div>
                  <div style={{ color: "#5C3A1A", fontSize: "0.48vw", marginTop: "0.08vw", lineHeight: 1.4 }}>{card.desc}</div>
                </div>
                <div style={{ background: i === 0 ? "#CA922B" : "rgba(202,146,43,0.12)", borderRadius: "0.5vw", padding: "0.3vw 0.6vw", flexShrink: 0, border: i === 0 ? "none" : "1px solid rgba(202,146,43,0.3)" }}>
                  <span style={{ color: i === 0 ? "#1C0E06" : "#CA922B", fontSize: "0.42vw", fontWeight: 700 }}>{card.action}</span>
                </div>
              </div>
            ))}

            {/* Recent activity */}
            <div style={{ background: "rgba(202,146,43,0.06)", borderRadius: "0.75vw", padding: "0.6vw", border: "1px solid rgba(202,146,43,0.15)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.45vw", fontWeight: 700, marginBottom: "0.35vw" }}>RECENT COMMUNITY REPORTS</div>
              {["Shaw: Felt very welcome at U Street Market — Aisha W.", "Columbia Heights: Parking lot at night, use caution — Marcus J."].map((r, i) => (
                <div key={i} style={{ color: "#A87A40", fontSize: "0.47vw", lineHeight: 1.4, marginBottom: i === 0 ? "0.2vw" : 0, paddingBottom: i === 0 ? "0.2vw" : 0, borderBottom: i === 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>{r}</div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(202,146,43,0.2)", padding: "0.4vw 0 0.5vw", display: "flex", justifyContent: "space-around" }}>
            {["Home", "Map", "Community", "Profile"].map((t, i) => (
              <span key={i} style={{ fontSize: "0.4vw", color: i === 2 ? "#CA922B" : "rgba(250,246,239,0.2)" }}>{t}</span>
            ))}
          </div>
        </Phone>
      </div>
    </div>
  );
}
