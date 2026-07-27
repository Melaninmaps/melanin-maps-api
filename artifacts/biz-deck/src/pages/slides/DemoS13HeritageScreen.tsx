const base = import.meta.env.BASE_URL;

const categories = [
  { label: "HBCU", color: "#7C3AED" },
  { label: "Civil Rights", color: "#DC2626" },
  { label: "African American History", color: "#CA922B" },
  { label: "Art Institutions", color: "#2563EB" },
  { label: "Music Heritage", color: "#0D9488" },
  { label: "Historic Neighborhoods", color: "#A6720F" },
  { label: "Cultural Centers", color: "#16A34A" },
];

const heritagePins = [
  { t: 18, l: 28, color: "#7C3AED", icon: "H" },
  { t: 34, l: 60, color: "#DC2626", icon: "C" },
  { t: 50, l: 20, color: "#CA922B", icon: "A" },
  { t: 28, l: 75, color: "#2563EB", icon: "★" },
  { t: 62, l: 55, color: "#0D9488", icon: "♪" },
];

const bizPins = [
  { t: 40, l: 40, score: 97 },
  { t: 58, l: 72, score: 91 },
  { t: 22, l: 50, score: 88 },
];

export default function DemoS13HeritageScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>13</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "4.8vw", fontWeight: 700, color: "#1C0E06" }}>History lives here.</h1>
        <div className="font-display leading-tight mt-[1.2vw]" style={{ fontSize: "2.2vw", fontWeight: 700, color: "#A6720F" }}>
          On the same map. In the same moment.
        </div>
        <div className="font-body mt-[1.4vw] mb-[2.2vw]" style={{ fontSize: "1.15vw", color: "#7B5408", lineHeight: 1.6 }}>
          11 heritage categories. Every pin tells a story. Visible by default — because separating our economic journey from our cultural identity was never an option we were willing to accept.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.65vw" }}>
          {categories.map((cat, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.9vw" }}>
              <div style={{ width: "0.85vw", height: "0.85vw", borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#3A1F0E", fontWeight: 500 }}>{cat.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "0.9vw" }}>
            <div style={{ width: "0.85vw", height: "0.85vw", borderRadius: "50%", background: "rgba(202,146,43,0.4)", border: "1.5px dashed #CA922B", flexShrink: 0 }} />
            <span className="font-body" style={{ fontSize: "0.85vw", color: "#A87A40", fontWeight: 400 }}>+4 more categories and growing</span>
          </div>
        </div>

        <div className="font-display mt-[2vw]" style={{ fontSize: "1.6vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>
          Every pin is a reminder: this land carries our story.
        </div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div style={{ width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0.55vw 0.9vw 0.3vw", display: "flex", justifyContent: "space-between", background: "#0D0805" }}>
            <span style={{ color: "#E8D5B7", fontSize: "0.52vw", fontWeight: 700 }}>9:41</span>
            <div style={{ width: "1vw", height: "0.5vw", border: "1px solid rgba(232,213,183,0.5)", borderRadius: "0.12vw", position: "relative" }}>
              <div style={{ position: "absolute", left: "0.1vw", top: "0.09vw", bottom: "0.09vw", width: "80%", background: "#E8D5B7", borderRadius: "0.05vw" }} />
            </div>
          </div>

          <div style={{ flex: 1, position: "relative", background: "linear-gradient(150deg,#1a2518 0%,#243320 35%,#1e2a1b 70%,#162014 100%)", overflow: "hidden" }}>
            {[15,35,55,75].map(y => <div key={y} style={{ position: "absolute", top: `${y}%`, left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.05)" }} />)}
            {[20,45,65,85].map(x => <div key={x} style={{ position: "absolute", left: `${x}%`, top: 0, bottom: 0, width: "1px", background: "rgba(255,255,255,0.05)" }} />)}

            <div style={{ position: "absolute", top: "10%", left: "5%", width: "45%", height: "35%", background: "rgba(76,175,80,0.1)", borderRadius: "0.5vw" }} />
            <div style={{ position: "absolute", top: "48%", left: "5%", width: "50%", height: "28%", background: "rgba(76,175,80,0.07)", borderRadius: "0.5vw" }} />
            <div style={{ position: "absolute", top: "10%", left: "55%", width: "38%", height: "40%", background: "rgba(255,193,7,0.06)", borderRadius: "0.5vw" }} />

            {heritagePins.map((p, i) => (
              <div key={i} style={{ position: "absolute", top: `${p.t}%`, left: `${p.l}%`, transform: "translate(-50%,-100%)" }}>
                <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", background: p.color, border: "0.1vw solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ transform: "rotate(45deg)", color: "#FFF", fontSize: "0.4vw", fontWeight: 800 }}>{p.icon}</span>
                </div>
              </div>
            ))}

            {bizPins.map((p, i) => (
              <div key={i} style={{ position: "absolute", top: `${p.t}%`, left: `${p.l}%`, transform: "translate(-50%,-50%)" }}>
                <div style={{ width: "1.1vw", height: "1.1vw", borderRadius: "50%", background: "#CA922B", border: "0.08vw solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#1C0E06", fontSize: "0.32vw", fontWeight: 900 }}>B</span>
                </div>
              </div>
            ))}

            <div style={{ position: "absolute", top: "10%", left: "20%", background: "rgba(13,8,5,0.95)", borderRadius: "0.6vw", padding: "0.4vw 0.65vw", border: "1px solid rgba(124,58,237,0.6)", whiteSpace: "nowrap" }}>
              <div style={{ color: "#FAF6EF", fontSize: "0.48vw", fontWeight: 800 }}>Howard University</div>
              <div style={{ color: "#A87A40", fontSize: "0.38vw" }}>HBCU · Est. 1867</div>
              <div style={{ color: "#7C3AED", fontSize: "0.35vw", marginTop: "0.15vw", fontWeight: 700 }}>View Details →</div>
            </div>

            <div style={{ position: "absolute", top: "0.7vw", left: "0.7vw", right: "0.7vw", background: "rgba(13,8,5,0.9)", borderRadius: "0.7vw", padding: "0.45vw 0.7vw", border: "1px solid rgba(202,146,43,0.3)", display: "flex", alignItems: "center", gap: "0.4vw" }}>
              <svg width="0.55vw" height="0.55vw" viewBox="0 0 24 24" fill="none" stroke="#5C3A1A" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span style={{ color: "#5C3A1A", fontSize: "0.46vw" }}>DC heritage &amp; businesses...</span>
            </div>

            <div style={{ position: "absolute", bottom: "0.7vw", left: "0.7vw", right: "0.7vw", background: "rgba(13,8,5,0.9)", borderRadius: "0.5vw", padding: "0.45vw 0.6vw", border: "1px solid rgba(202,146,43,0.2)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.35vw", fontWeight: 700, marginBottom: "0.25vw", letterSpacing: "0.08em" }}>HERITAGE LAYER — ACTIVE</div>
              <div style={{ display: "flex", gap: "0.5vw", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.22vw" }}>
                  <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#7C3AED" }} />
                  <span style={{ color: "#A87A40", fontSize: "0.33vw" }}>HBCU</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.22vw" }}>
                  <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#DC2626" }} />
                  <span style={{ color: "#A87A40", fontSize: "0.33vw" }}>Civil Rights</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.22vw" }}>
                  <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B" }} />
                  <span style={{ color: "#A87A40", fontSize: "0.33vw" }}>History</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.22vw" }}>
                  <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B", opacity: 0.5 }} />
                  <span style={{ color: "#A87A40", fontSize: "0.33vw" }}>Business</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(202,146,43,0.2)", padding: "0.4vw 0 0.5vw", display: "flex", justifyContent: "space-around", background: "#0D0805" }}>
            {["Home", "Map", "Community", "Profile"].map((t, i) => (
              <span key={i} style={{ fontSize: "0.4vw", color: i === 1 ? "#CA922B" : "rgba(250,246,239,0.2)" }}>{t}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Heritage pins visible on first open</strong> — no setting to find, no toggle to flip.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Category-specific colors</strong> let members navigate by meaning, not just by place.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Also in Library</strong> — 16 live heritage site cards scroll at the top of every Library tab.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
