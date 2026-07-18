const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS15Dashboard() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 50%, rgba(202,146,43,0.07), transparent 55%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>BUSINESS DASHBOARD</div>
        <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.1, marginBottom: "1vw" }}>
          Know what's working<br /><span style={{ color: "#CA922B" }}>before competitors do.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", lineHeight: 1.7 }}>
          Small business owners have been operating on gut instinct while corporate chains use sophisticated analytics. The dashboard closes that gap — giving every community business access to real-time intelligence that was previously out of reach.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {[
            "Live Trust Score — see reputation as the community builds it",
            "Search trends reveal what people are actively looking for nearby",
            "Community feedback shows what's resonating and what needs work",
            "Peak hours data informs staffing and promotion timing",
            "No expensive analysts needed — the data is always current",
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#3A2010" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two phones */}
      <div className="absolute" style={{ right: "3vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "2vw" }}>
        {/* Phone 1 — Dashboard overview */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div>
              <div style={{ color: "#A87A40", fontSize: "0.5vw" }}>Good morning,</div>
              <div style={{ color: "#FAF6EF", fontSize: "0.8vw", fontWeight: 800 }}>Marcus's Barber Studio</div>
            </div>
            {/* KPI Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45vw" }}>
              {[
                { label: "Profile Views", val: "1,247", delta: "+18%", up: true },
                { label: "Trust Score", val: "94", delta: "+2 pts", up: true, gold: true },
                { label: "Saves", val: "218", delta: "+31", up: true },
                { label: "Reviews", val: "47", delta: "+8 this wk", up: true },
              ].map((m, i) => (
                <div key={i} style={{ background: "rgba(202,146,43,0.1)", borderRadius: "0.6vw", padding: "0.5vw", border: `1px solid ${(m as any).gold ? "rgba(202,146,43,0.5)" : "rgba(202,146,43,0.15)"}` }}>
                  <div style={{ color: "#5C3A1A", fontSize: "0.42vw" }}>{m.label}</div>
                  <div style={{ color: (m as any).gold ? "#CA922B" : "#FAF6EF", fontSize: "0.82vw", fontWeight: 800 }}>{m.val}</div>
                  <div style={{ color: "#4CAF50", fontSize: "0.4vw" }}>{m.delta}</div>
                </div>
              ))}
            </div>
            {/* Trending searches */}
            <div>
              <div style={{ color: "#CA922B", fontSize: "0.46vw", fontWeight: 700, marginBottom: "0.3vw" }}>TRENDING SEARCHES NEARBY</div>
              {["barber near me", "black barber DC", "shape up Capitol Hill", "men's grooming"].map((q, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.25vw 0", borderBottom: "1px solid rgba(202,146,43,0.08)" }}>
                  <span style={{ color: "#D9C4A3", fontSize: "0.5vw" }}>{q}</span>
                  <div style={{ height: "0.25vw", width: `${60 - i * 12}%`, background: "rgba(202,146,43,0.5)", borderRadius: "0.15vw" }} />
                </div>
              ))}
            </div>
            {/* Community feedback */}
            <div style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.6vw", padding: "0.5vw", border: "1px solid rgba(202,146,43,0.2)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.44vw", fontWeight: 700 }}>COMMUNITY FEEDBACK</div>
              <div style={{ color: "#D9C4A3", fontSize: "0.5vw", marginTop: "0.15vw" }}>Top compliment this week: "Welcoming" — mentioned 14 times.</div>
            </div>
          </div>
        </Phone>

        {/* Phone 2 — Analytics detail */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.75vw", fontWeight: 800 }}>Analytics</div>
            <div style={{ color: "#A87A40", fontSize: "0.5vw" }}>Last 30 days · Marcus's Barber Studio</div>
            {/* Sparkline placeholder */}
            <div style={{ height: "5vw", background: "rgba(202,146,43,0.05)", borderRadius: "0.6vw", border: "1px solid rgba(202,146,43,0.15)", position: "relative", overflow: "hidden" }}>
              <svg viewBox="0 0 200 60" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="none">
                <polyline points="0,55 20,50 40,42 60,45 80,30 100,28 120,22 140,25 160,15 180,12 200,8" fill="none" stroke="rgba(202,146,43,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="0,60 0,55 20,50 40,42 60,45 80,30 100,28 120,22 140,25 160,15 180,12 200,8 200,60" fill="rgba(202,146,43,0.1)" />
              </svg>
              <div style={{ position: "absolute", top: "0.3vw", right: "0.5vw" }}>
                <span style={{ color: "#4CAF50", fontSize: "0.5vw", fontWeight: 700 }}>+47% profile views</span>
              </div>
            </div>
            {/* Peak hours */}
            <div>
              <div style={{ color: "#CA922B", fontSize: "0.46vw", fontWeight: 700, marginBottom: "0.3vw" }}>PEAK SEARCH HOURS</div>
              <div style={{ display: "flex", gap: "0.25vw", alignItems: "flex-end", height: "3vw" }}>
                {[20, 30, 45, 70, 90, 85, 60, 40, 55, 80, 95, 75].map((h, i) => (
                  <div key={i} style={{ flex: 1, background: i >= 9 && i <= 11 ? "#CA922B" : "rgba(202,146,43,0.3)", borderRadius: "0.2vw 0.2vw 0 0", height: `${h}%` }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.2vw" }}>
                <span style={{ color: "#5C3A1A", fontSize: "0.38vw" }}>8 AM</span>
                <span style={{ color: "#CA922B", fontSize: "0.38vw", fontWeight: 700 }}>5–7 PM peak</span>
                <span style={{ color: "#5C3A1A", fontSize: "0.38vw" }}>8 PM</span>
              </div>
            </div>
            {/* Review sentiment */}
            <div>
              <div style={{ color: "#CA922B", fontSize: "0.46vw", fontWeight: 700, marginBottom: "0.3vw" }}>TOP COMPLIMENTS</div>
              {[{ label: "Welcoming", pct: 88 }, { label: "Skilled", pct: 82 }, { label: "Clean Space", pct: 74 }, { label: "On Time", pct: 68 }].map((c, i) => (
                <div key={i} style={{ marginBottom: "0.3vw" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.1vw" }}>
                    <span style={{ color: "#D9C4A3", fontSize: "0.48vw" }}>{c.label}</span>
                    <span style={{ color: "#CA922B", fontSize: "0.48vw", fontWeight: 700 }}>{c.pct}%</span>
                  </div>
                  <div style={{ height: "0.28vw", background: "rgba(255,255,255,0.07)", borderRadius: "0.14vw" }}>
                    <div style={{ width: `${c.pct}%`, height: "100%", background: "#CA922B", borderRadius: "0.14vw" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
