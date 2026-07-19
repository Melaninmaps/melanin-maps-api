const steps = [
  "She leaves",
  "Check-in starts",
  "Sister gets notification",
  "Timer runs",
  "Silence",
];

export default function FD08SafetyCheckin() {
  return (
    <div className="relative w-screen h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2E1609 0%, #1C0E06 48%, #120A04 100%)" }}>
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(202,146,43,0.09) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: "8%", bottom: "6%" }}>
        <div className="font-body"
          style={{ fontSize: "0.95vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "3.2vw" }}>
          SAFETY CHECK-IN
        </div>

        {/* Steps — outline circles replacing filled dots, more spacing between steps */}
        <div className="flex items-center justify-center" style={{ gap: 0, marginBottom: "4vw" }}>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center" style={{ width: "10vw" }}>
                {/* Gold outline circle ◌ — filled only for final "Silence" step */}
                <div style={{
                  width: "0.65vw", height: "0.65vw", borderRadius: "50%",
                  border: `1.5px solid ${i === steps.length - 1 ? "#CA922B" : "rgba(202,146,43,0.5)"}`,
                  background: i === steps.length - 1 ? "#CA922B" : "transparent",
                  marginBottom: "0.9vw",
                  boxShadow: i === steps.length - 1 ? "0 0 6px rgba(202,146,43,0.4)" : "none"
                }} />
                <div className="font-body text-center"
                  style={{
                    fontSize: "0.88vw",
                    color: i === steps.length - 1 ? "#CA922B" : "#7B5B30",
                    lineHeight: 1.4, letterSpacing: "0.05em"
                  }}>
                  {step}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: "2.4vw", height: "1px",
                  background: "rgba(202,146,43,0.28)", marginBottom: "1.8vw", flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ width: "4vw", height: "2px",
          background: "linear-gradient(90deg,transparent,#CA922B,transparent)", marginBottom: "3vw" }} />

        <h2 className="font-display text-center"
          style={{ fontSize: "3.4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.2,
            marginBottom: "2vw", maxWidth: "68vw",
            textShadow: "0 2px 8px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)" }}>
          Someone already knows where she is.
        </h2>

        {/* Bottom takeaway — strengthened emphasis */}
        <p className="font-quote text-center"
          style={{ fontSize: "2.1vw", color: "#CA922B", fontStyle: "italic", lineHeight: 1.65,
            maxWidth: "58vw", fontWeight: 500 }}>
          She doesn&rsquo;t travel alone.<br />
          Even when she&rsquo;s the only one in the room.
        </p>
      </div>
    </div>
  );
}
