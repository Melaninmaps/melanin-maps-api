const base = import.meta.env.BASE_URL;

const alerts = [
  { type: "ICE", text: "ICE vehicle spotted near Howard University campus. Stay alert.", time: "3 min ago", confirms: 12, color: "#DC2626", bg: "#FEF2F2" },
  { type: "Police", text: "Heavy police presence on 14th & U. Checkpoint near the intersection.", time: "11 min ago", confirms: 8, color: "#7C3AED", bg: "#F5F3FF" },
  { type: "Celebration", text: "Caribbean Carnival on Georgia Ave — road closures from 7PM, great energy!", time: "22 min ago", confirms: 34, color: "#CA922B", bg: "#FEF9EE" },
  { type: "Community", text: "Town Hall at Reeves Center starting now — open to all. Free food provided.", time: "35 min ago", confirms: 19, color: "#16A34A", bg: "#F0FDF4" },
];

export default function DemoS32SafetyAlertScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>32</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Informed.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Four real alerts. Right now. Shaw / U Street.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          ICE activity near Howard. Police checkpoint on 14th. A Caribbean Carnival blocking Georgia Ave. A town hall with free food at Reeves. All in the last 35 minutes. All from the community. None from the police blotter.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Information that keeps you safe and connected.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[1.3vw] pb-[0.6vw]" style={{ flexShrink: 0 }}>
              <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 800, color: "#1C0E06" }}>Community Intelligence</div>
              <div className="flex items-center gap-[0.4vw] mt-[0.15vw]">
                <div style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", background: "#16A34A" }} />
                <span className="font-body" style={{ fontSize: "0.5vw", color: "#16A34A", fontWeight: 600 }}>LIVE · Shaw / U Street · 0.5 mi radius</span>
              </div>
            </div>

            {/* Alert cards */}
            <div className="flex flex-col gap-[0.45vw] px-[1vw] flex-1" style={{ overflow: "hidden" }}>
              {alerts.map((a, i) => (
                <div key={i} className="rounded-[0.75vw] p-[0.65vw]" style={{ background: a.bg, border: `1px solid ${a.color}30` }}>
                  <div className="flex items-start gap-[0.5vw]">
                    <div className="rounded-[0.4vw] px-[0.4vw] py-[0.15vw]" style={{ background: a.color, flexShrink: 0, marginTop: "0.08vw" }}>
                      <span className="font-body" style={{ fontSize: "0.42vw", fontWeight: 700, color: "#FFF" }}>{a.type}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="font-body" style={{ fontSize: "0.54vw", color: "#1C0E06", lineHeight: 1.4, fontWeight: 600 }}>{a.text}</div>
                      <div className="flex items-center gap-[0.5vw] mt-[0.18vw]">
                        <span className="font-body" style={{ fontSize: "0.42vw", color: "#A87A40" }}>{a.time}</span>
                        <span style={{ width: "0.2vw", height: "0.2vw", borderRadius: "50%", background: "#DDD0B8" }} />
                        <span className="font-body" style={{ fontSize: "0.42vw", color: a.color, fontWeight: 600 }}>{a.confirms} confirmed</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Submit tip CTA */}
              <div className="flex items-center gap-[0.6vw] rounded-[0.7vw] px-[0.7vw] py-[0.55vw] mt-[0.2vw]" style={{ background: "#FFFFFF", border: "1px dashed #DDD0B8" }}>
                <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.75vw", color: "#CA922B", fontWeight: 700 }}>+</span>
                </div>
                <div>
                  <div className="font-body" style={{ fontSize: "0.55vw", fontWeight: 700, color: "#1C0E06" }}>Submit a Safety Tip</div>
                  <div className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>Anonymous option available</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>ICE and police alerts</strong> — tools that exist nowhere else in a consumer app.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Community-confirmed</strong> — member votes validate or expire each alert.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Cultural and civic alerts</strong> — not just danger. Celebrations and opportunities too.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
