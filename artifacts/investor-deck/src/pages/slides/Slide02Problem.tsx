export default function Slide02Problem() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#FAF6EF" }}>
      <div className="inv-rule w-full" />

      {/* Header */}
      <div className="px-[7vw] pt-[5vh] pb-[2.5vh]">
        <div className="font-body mb-[1.2vh]" style={{ fontSize: "1.9vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>THE PROBLEM</div>
        <h2 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.15 }}>
          No trusted community layer exists for the melanated diaspora.
        </h2>
        <div className="inv-rule w-[18vw] mt-[1.2vh]" />
      </div>

      {/* 3 columns */}
      <div className="flex-1 px-[7vw] pb-[6vh]">
        <div className="flex gap-[2.5vw] h-full">
          <div className="flex-1 flex flex-col justify-start py-[2.5vh] px-[2.5vw]" style={{ background: "#1C0E06" }}>
            <div className="font-display mb-[1.2vh]" style={{ fontSize: "2.8vw", fontWeight: 700, color: "#CA922B" }}>Fragmented</div>
            <div className="inv-rule w-[3.5vw] mb-[1.2vh]" />
            <p className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.5 }}>
              Safety info, business recs, and community knowledge live across Facebook groups, Reddit, and word of mouth — with no single home.
            </p>
          </div>
          <div className="flex-1 flex flex-col justify-start py-[2.5vh] px-[2.5vw]" style={{ background: "#1C0E06" }}>
            <div className="font-display mb-[1.2vh]" style={{ fontSize: "2.8vw", fontWeight: 700, color: "#CA922B" }}>Untrusted</div>
            <div className="inv-rule w-[3.5vw] mb-[1.2vh]" />
            <p className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.5 }}>
              Platforms like Yelp and Google Maps don't reflect the lived experience of minority and melanated communities.
            </p>
          </div>
          <div className="flex-1 flex flex-col justify-start py-[2.5vh] px-[2.5vw]" style={{ background: "#1C0E06" }}>
            <div className="font-display mb-[1.2vh]" style={{ fontSize: "2.8vw", fontWeight: 700, color: "#CA922B" }}>Static</div>
            <div className="inv-rule w-[3.5vw] mb-[1.2vh]" />
            <p className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.5 }}>
              Existing directories are lists, not living intelligence — they don't travel with you or adapt to your journey.
            </p>
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>02</div>
    </div>
  );
}
