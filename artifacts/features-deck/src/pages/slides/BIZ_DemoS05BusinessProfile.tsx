const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS05BusinessProfile() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 50%, rgba(202,146,43,0.07), transparent 55%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>BUSINESS PROFILES</div>
        <div className="font-display" style={{ fontSize: "3vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.1, marginBottom: "1vw" }}>
          More than a listing.<br /><span style={{ color: "#CA922B" }}>A reputation you can see.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", lineHeight: 1.7 }}>
          A five-star rating tells you very little. A 47-count "Welcoming" chip tells you everything. We built profiles that reflect what the community actually experiences — before you walk through the door.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {["Compliment chips turn qualitative trust into measurable signal", "Verified badges require documentation — not self-reporting", "Trust Score compounds with every real community interaction", "Owner responses show how a business treats its customers", "Saves + check-ins signal ongoing community endorsement"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#3A2010" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two phones */}
      <div className="absolute" style={{ right: "3vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "2vw" }}>
        {/* Phone 1 — Hero + Trust Score */}
        <Phone>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Hero image */}
            <div style={{ height: "35%", background: "linear-gradient(160deg, #2a1505, #4a2510)", flexShrink: 0, position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(13,8,5,0.8) 0%, transparent 60%)" }} />
              <div style={{ position: "absolute", bottom: "0.5vw", left: "0.7vw" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35vw" }}>
                  <span style={{ color: "#FAF6EF", fontSize: "0.72vw", fontWeight: 800 }}>Copper & Oak Bistro</span>
                  <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="#CA922B" stroke="none"><path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10" stroke="#1C0E06" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
                </div>
                <div style={{ color: "#A87A40", fontSize: "0.48vw" }}>Soul Food · Restaurant · DC</div>
              </div>
              <div style={{ position: "absolute", top: "0.5vw", right: "0.7vw" }}>
                <div style={{ background: "#CA922B", borderRadius: "0.5vw", padding: "0.2vw 0.5vw", display: "flex", alignItems: "center", gap: "0.2vw" }}>
                  <span style={{ color: "#1C0E06", fontSize: "0.6vw", fontWeight: 800 }}>97</span>
                  <span style={{ color: "#1C0E06", fontSize: "0.38vw" }}>Trust</span>
                </div>
              </div>
            </div>
            {/* Action buttons */}
            <div style={{ display: "flex", justifyContent: "space-around", padding: "0.6vw", borderBottom: "1px solid rgba(202,146,43,0.1)" }}>
              {[
                { icon: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 12 19.79 19.79 0 0 1 1.63 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.27a16 16 0 0 0 6.29 6.29l.61-.61a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" /></>, label: "Call" },
                { icon: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>, label: "Share" },
                { icon: <><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></>, label: "Save", gold: true },
              ].map((btn, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2vw" }}>
                  <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill={(btn as any).gold ? "#CA922B" : "none"} stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{btn.icon}</svg>
                  <span style={{ color: "#A87A40", fontSize: "0.42vw" }}>{btn.label}</span>
                </div>
              ))}
            </div>
            {/* Details */}
            <div style={{ padding: "0.5vw 0.8vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.4vw" }}>
              <div style={{ color: "#A87A40", fontSize: "0.46vw" }}>Open until 9 PM · 0.3 mi · $$</div>
              <div style={{ color: "#D9C4A3", fontSize: "0.52vw", lineHeight: 1.4 }}>Award-winning soul food in the heart of Capitol Hill. Community trust-rated.</div>
              {/* Stats row */}
              <div style={{ display: "flex", gap: "0.5vw" }}>
                {[{ val: "247", label: "Saves" }, { val: "124", label: "Reviews" }, { val: "38", label: "Check-ins" }].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", background: "rgba(202,146,43,0.08)", borderRadius: "0.5vw", padding: "0.3vw" }}>
                    <div style={{ color: "#CA922B", fontSize: "0.6vw", fontWeight: 800 }}>{s.val}</div>
                    <div style={{ color: "#5C3A1A", fontSize: "0.38vw" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Phone>

        {/* Phone 2 — Reviews + compliment chips */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#E8D5B7", fontSize: "0.6vw", fontWeight: 700 }}>9:41</span>
            </div>
            <div style={{ color: "#FAF6EF", fontSize: "0.78vw", fontWeight: 800 }}>Community Says</div>
            {/* Compliment chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35vw" }}>
              {[
                { label: "Welcoming", count: 47 },
                { label: "Authentic", count: 38 },
                { label: "Great Food", count: 52 },
                { label: "Safe Space", count: 29 },
                { label: "Worth It", count: 33 },
                { label: "Come Back", count: 41 },
              ].map((chip, i) => (
                <div key={i} style={{ padding: "0.28vw 0.55vw", borderRadius: "2vw", background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)", display: "flex", gap: "0.3vw", alignItems: "center" }}>
                  <span style={{ color: "#D9C4A3", fontSize: "0.46vw" }}>{chip.label}</span>
                  <span style={{ color: "#CA922B", fontSize: "0.44vw", fontWeight: 700 }}>×{chip.count}</span>
                </div>
              ))}
            </div>
            <div style={{ height: "1px", background: "rgba(202,146,43,0.15)" }} />
            {/* Reviews */}
            {[
              { name: "Danielle R.", stars: 5, text: "This place has my whole heart. The food, the vibe, the staff — absolutely everything.", owner: "Thank you Danielle! Sundays are made for this." },
              { name: "Marcus J.", stars: 5, text: "Every visit feels like family. Trust Score doesn't lie — this place is the real deal." },
            ].map((r, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.6vw", padding: "0.55vw" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2vw" }}>
                  <span style={{ color: "#FAF6EF", fontSize: "0.54vw", fontWeight: 700 }}>{r.name}</span>
                  <div style={{ display: "flex", gap: "0.15vw" }}>
                    {[...Array(r.stars)].map((_, si) => (
                      <svg key={si} width="0.55vw" height="0.55vw" viewBox="0 0 24 24" fill="#CA922B" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    ))}
                  </div>
                </div>
                <div style={{ color: "#A87A40", fontSize: "0.5vw", lineHeight: 1.4, marginBottom: r.owner ? "0.3vw" : "0" }}>{r.text}</div>
                {r.owner && (
                  <div style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.4vw", padding: "0.3vw 0.4vw", borderLeft: "2px solid #CA922B" }}>
                    <div style={{ color: "#CA922B", fontSize: "0.4vw", fontWeight: 700 }}>OWNER RESPONSE</div>
                    <div style={{ color: "#D9C4A3", fontSize: "0.46vw" }}>{r.owner}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Phone>
      </div>
    </div>
  );
}
