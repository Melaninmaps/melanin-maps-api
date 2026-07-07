export default function Slide04Journeys() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(90,45,10,0.3) 0%, transparent 60%)" }} />

      {/* Slide number */}
      <div className="absolute top-[5vh] right-[6vw] font-display text-primary" style={{ fontSize: "2.2vw", fontWeight: 700, opacity: 0.4 }}>04</div>

      {/* Header */}
      <div className="absolute top-[7vh] left-[7vw]">
        <div className="gold-dot mb-[2vh]" />
        <h2 className="font-display text-accent leading-tight tracking-tight" style={{ fontSize: "5vw", fontWeight: 700 }}>
          Every journey starts somewhere.
        </h2>
        <div className="gold-rule w-[20vw] mt-[2vh]" />
      </div>

      {/* Journey cards — 4 across + 3 below centered */}
      <div className="absolute bottom-[8vh] left-[7vw] right-[7vw]">
        {/* Row 1 — 4 items */}
        <div className="flex gap-[2vw] mb-[2.5vh]">
          <div className="flex-1 py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.2vw", fontWeight: 700 }}>Travel</div>
            <div className="gold-rule w-[3vw]" />
          </div>
          <div className="flex-1 py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.2vw", fontWeight: 700 }}>Relocation</div>
            <div className="gold-rule w-[3vw]" />
          </div>
          <div className="flex-1 py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.2vw", fontWeight: 700 }}>Career</div>
            <div className="gold-rule w-[3vw]" />
          </div>
          <div className="flex-1 py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.18)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.2vw", fontWeight: 700 }}>College</div>
            <div className="gold-rule w-[3vw]" />
          </div>
        </div>
        {/* Row 2 — 3 items centered */}
        <div className="flex gap-[2vw]">
          <div className="flex-1 py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.18)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.2vw", fontWeight: 700 }}>Health</div>
            <div className="gold-rule w-[3vw]" />
          </div>
          <div className="flex-1 py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.18)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.2vw", fontWeight: 700 }}>Business</div>
            <div className="gold-rule w-[3vw]" />
          </div>
          <div className="flex-1 py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.18)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.2vw", fontWeight: 700 }}>Family</div>
            <div className="gold-rule w-[3vw]" />
          </div>
        </div>
      </div>
    </div>
  );
}
