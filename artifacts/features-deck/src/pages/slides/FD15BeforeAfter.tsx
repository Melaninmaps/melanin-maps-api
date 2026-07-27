const rows = [
  { without: "Just another listing", with: "Known by your community" },
  { without: "Fighting algorithms", with: "Trust built over time" },
  { without: "Paying for attention", with: "Authentic introductions" },
  { without: "Anonymous reviews", with: "Customers who understand your mission" },
];

export default function FD15BeforeAfter() {
  return (
    <div className="relative w-screen h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2E1609 0%, #1C0E06 48%, #120A04 100%)" }}>
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(202,146,43,0.09) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: "8%", bottom: "6%" }}>
        <div className="font-body"
          style={{ fontSize: "0.95vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "3.6vw" }}>
          THE TRANSFORMATION
        </div>

        {/* Table — same warm shadow fix as FD05; left column now clearly readable */}
        <div style={{
          width: "66vw", borderRadius: "0.8vw", overflow: "hidden",
          border: "1px solid rgba(202,146,43,0.22)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.35)"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: "1.1vw 2.6vw", background: "rgba(90,58,24,0.28)",
              borderBottom: "1px solid rgba(202,146,43,0.15)" }}>
              <div className="font-body"
                style={{ fontSize: "0.8vw", color: "#A07840", letterSpacing: "0.22em", fontWeight: 700 }}>
                WITHOUT
              </div>
            </div>
            <div style={{ padding: "1.1vw 2.6vw", background: "rgba(202,146,43,0.12)",
              borderBottom: "1px solid rgba(202,146,43,0.15)", borderLeft: "1px solid rgba(202,146,43,0.15)" }}>
              <div className="font-body"
                style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.22em", fontWeight: 700 }}>
                WITH MAPPING WITH MELANIN™
              </div>
            </div>
            {rows.map((r, i) => (
              <>
                <div key={`l-${i}`} style={{ padding: "1.2vw 2.6vw", background: "transparent",
                  borderBottom: i < rows.length - 1 ? "1px solid rgba(202,146,43,0.08)" : "none" }}>
                  {/* Left column — now clearly readable (was #3D2008, near-invisible) */}
                  <span className="font-body"
                    style={{ fontSize: "1.08vw", color: "#A07840", lineHeight: 1.5 }}>{r.without}</span>
                </div>
                <div key={`r-${i}`} style={{ padding: "1.2vw 2.6vw", background: "rgba(202,146,43,0.05)",
                  borderBottom: i < rows.length - 1 ? "1px solid rgba(202,146,43,0.08)" : "none",
                  borderLeft: "1px solid rgba(202,146,43,0.12)" }}>
                  <span className="font-body"
                    style={{ fontSize: "1.08vw", color: "#E8B86D", fontWeight: 500, lineHeight: 1.5 }}>
                    {r.with}
                  </span>
                </div>
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
