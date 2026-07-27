export default function DemoS01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 68% 50%, rgba(202,146,43,0.16) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,rgba(202,146,43,0.4),transparent)" }} />

      {/* Left text */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "15%", bottom: "15%", width: "44vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "3vw" }}>MAPPING WITH MELANIN™</div>
        <div className="font-display" style={{ fontSize: "5.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "2vw" }}>
          The complete<br /><span style={{ color: "#CA922B" }}>app experience.</span>
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2.5vw", opacity: 0.8 }} />
        <div className="font-body" style={{ fontSize: "1.15vw", color: "#A87A40", lineHeight: 1.75, marginBottom: "4vw", maxWidth: "36vw" }}>
          A screen-by-screen walkthrough of every feature — from first launch to active membership. Two complete journeys: community member and business owner.
        </div>
        <div style={{ display: "flex", gap: "2.5vw" }}>
          {[
            { label: "Slides 1–58", sub: "Community Member" },
            { label: "Slides 59–74", sub: "Business Owner" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.3vw" }}>
              <div style={{ color: "#CA922B", fontSize: "0.7vw", fontWeight: 800, letterSpacing: "0.1em" }}>{item.label}</div>
              <div style={{ color: "#5C3A1A", fontSize: "0.82vw" }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: three phones — flexbox centered, no transform */}
      <div className="absolute flex items-center" style={{ right: "3vw", top: "5%", bottom: "5%", zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5vw" }}>
          {/* Left ghost phone */}
          <div style={{
            width: "12vw", height: "22.5vw",
            background: "linear-gradient(160deg, rgba(60,40,20,0.45), rgba(26,16,6,0.45))",
            borderRadius: "2.5vw",
            border: "0.5px solid rgba(202,146,43,0.12)",
            boxShadow: "0 2vw 6vw rgba(0,0,0,0.7)",
            transform: "rotate(-7deg)",
            flexShrink: 0,
            overflow: "hidden",
            position: "relative",
          }}>
            <div style={{ position: "absolute", top: "1.2vw", left: "50%", transform: "translateX(-50%)", width: "3vw", height: "0.5vw", background: "#1a1008", borderRadius: "0.4vw" }} />
            <div style={{ position: "absolute", top: "2.5vw", left: "0.8vw", right: "0.8vw", bottom: "0.8vw", borderRadius: "2vw", background: "rgba(202,146,43,0.04)" }}>
              {[0,1,2,3,4].map(r => (
                <div key={r} style={{ height: "0.6vw", background: "rgba(202,146,43,0.08)", borderRadius: "0.3vw", margin: `${r===0?"1.2vw":"0.5vw"} 0.8vw 0` }} />
              ))}
            </div>
          </div>

          {/* Center phone — hero */}
          <div style={{
            width: "17vw", height: "31.9vw",
            background: "linear-gradient(160deg, #2A1A08, #1A0E04)",
            borderRadius: "3.2vw",
            border: "0.8px solid rgba(202,146,43,0.22)",
            boxShadow: "0 3vw 10vw rgba(0,0,0,0.9), 0 0 4vw rgba(202,146,43,0.08)",
            flexShrink: 0,
            overflow: "hidden",
            position: "relative",
          }}>
            <div style={{ position: "absolute", top: "1.5vw", left: "50%", transform: "translateX(-50%)", width: "4vw", height: "0.6vw", background: "#0D0805", borderRadius: "0.5vw", zIndex: 5 }} />
            <div style={{ position: "absolute", top: "3vw", left: "0.9vw", right: "0.9vw", bottom: "0.9vw", borderRadius: "2.5vw", background: "rgba(250,246,239,0.04)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1vw" }}>
              <div style={{ width: "4.5vw", height: "4.5vw", borderRadius: "1.3vw", border: "1.5px solid rgba(202,146,43,0.5)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(202,146,43,0.06)" }}>
                <svg width="2.2vw" height="2.2vw" viewBox="0 0 24 24" fill="none" stroke="rgba(202,146,43,0.7)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div style={{ color: "rgba(202,146,43,0.6)", fontSize: "0.65vw", fontWeight: 800, letterSpacing: "0.15em" }}>MWM</div>
              {/* Decorative content rows */}
              <div style={{ marginTop: "1.5vw", width: "100%", padding: "0 1.2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
                {[0.9, 0.7, 0.8, 0.65, 0.75].map((w, i) => (
                  <div key={i} style={{ height: "0.5vw", background: "rgba(202,146,43,0.1)", borderRadius: "0.25vw", width: `${w * 100}%` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Right ghost phone */}
          <div style={{
            width: "12vw", height: "22.5vw",
            background: "linear-gradient(160deg, rgba(60,40,20,0.45), rgba(26,16,6,0.45))",
            borderRadius: "2.5vw",
            border: "0.5px solid rgba(202,146,43,0.12)",
            boxShadow: "0 2vw 6vw rgba(0,0,0,0.7)",
            transform: "rotate(7deg)",
            flexShrink: 0,
            overflow: "hidden",
            position: "relative",
          }}>
            <div style={{ position: "absolute", top: "1.2vw", left: "50%", transform: "translateX(-50%)", width: "3vw", height: "0.5vw", background: "#1a1008", borderRadius: "0.4vw" }} />
            <div style={{ position: "absolute", top: "2.5vw", left: "0.8vw", right: "0.8vw", bottom: "0.8vw", borderRadius: "2vw", background: "rgba(202,146,43,0.04)" }}>
              {[0,1,2,3,4].map(r => (
                <div key={r} style={{ height: "0.6vw", background: "rgba(202,146,43,0.08)", borderRadius: "0.3vw", margin: `${r===0?"1.2vw":"0.5vw"} 0.8vw 0` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
