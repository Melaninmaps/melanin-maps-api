const points = [
  { contrast: ["Communities are more connected online than ever", "but loneliness is rising."] },
  { contrast: ["Travel is growing", "but trust is declining."] },
  { contrast: ["Minority-owned businesses are easier to support", "but harder to discover."] },
  { contrast: ["People have more information than ever before.", "But less confidence in where to find belonging."] },
  { contrast: ["Technology has made the world smaller.", "Belonging still feels farther away."] },
  { plain: "People don\u2019t need another app. They need a trusted guide." },
];

export default function FD17WhyNow() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 44%, rgba(202,146,43,0.08) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.18 }}>17</div>

      <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: "7%", bottom: "6%" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "3vw" }}>
          WHY NOW?
        </div>

        <div className="flex flex-col" style={{ gap: "1.5vw", maxWidth: "72vw", width: "100%" }}>
          {points.map((pt, i) => (
            <div key={i} className="flex items-start" style={{ gap: "1.2vw" }}>
              <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.7vw", flexShrink: 0 }} />
              {"contrast" in pt ? (
                <p className="font-body" style={{ fontSize: "1.15vw", lineHeight: 1.6, margin: 0 }}>
                  <span style={{ color: "#FAF6EF" }}>{pt.contrast[0]} </span>
                  <span style={{ color: "#5A3A18" }}>— {pt.contrast[1]}</span>
                </p>
              ) : (
                <p className="font-body" style={{ fontSize: "1.15vw", color: "#CA922B", fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                  {pt.plain}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
