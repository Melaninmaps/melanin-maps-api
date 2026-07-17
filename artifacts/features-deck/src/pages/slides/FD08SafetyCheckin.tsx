const steps = [
  "She leaves",
  "Check-in starts",
  "Sister gets notification",
  "Timer runs",
  "Silence",
];

export default function FD08SafetyCheckin() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(202,146,43,0.09) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.18 }}>08</div>

      <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: "8%", bottom: "6%" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "2.8vw" }}>
          SAFETY CHECK-IN
        </div>

        <div className="flex items-center justify-center" style={{ gap: "0", marginBottom: "3.6vw" }}>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center" style={{ width: "9vw" }}>
                <div style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", background: i === steps.length - 1 ? "#CA922B" : "#5A3A18", marginBottom: "0.7vw" }} />
                <div className="font-body text-center" style={{ fontSize: "0.82vw", color: i === steps.length - 1 ? "#CA922B" : "#7B5B30", lineHeight: 1.4, letterSpacing: "0.05em" }}>
                  {step}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: "2.2vw", height: "1px", background: "rgba(202,146,43,0.3)", marginBottom: "1.5vw", flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ width: "4vw", height: "2px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)", marginBottom: "2.8vw" }} />

        <h2 className="font-display text-center" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.2, marginBottom: "1.8vw", maxWidth: "68vw" }}>
          Someone already knows where she is.
        </h2>
        <p className="font-quote text-center" style={{ fontSize: "1.9vw", color: "#A07840", fontStyle: "italic", lineHeight: 1.65, maxWidth: "58vw" }}>
          She doesn&rsquo;t travel alone.<br />
          Even when she&rsquo;s the only one in the room.
        </p>
      </div>
    </div>
  );
}
