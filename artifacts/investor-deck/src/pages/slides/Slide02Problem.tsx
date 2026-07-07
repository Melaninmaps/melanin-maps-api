export default function Slide02Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      {/* Top gold rule */}
      <div className="inv-rule absolute top-0 left-0 right-0" />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>02</div>

      {/* Header */}
      <div className="absolute top-[8vh] left-[7vw] right-[7vw]">
        <div className="font-body mb-[1.5vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>THE PROBLEM</div>
        <h2 className="font-display" style={{ fontSize: "5.5vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          There is no trusted community layer for the melanated diaspora.
        </h2>
        <div className="inv-rule w-[20vw] mt-[2vh]" />
      </div>

      {/* 3-column problems */}
      <div className="absolute left-[7vw] right-[7vw]" style={{ top: "38vh", bottom: "8vh" }}>
        <div className="flex gap-[3vw] h-full">
          <div className="flex-1 flex flex-col justify-center py-[3vh] px-[2.5vw]" style={{ background: "#1C0E06" }}>
            <div className="font-display mb-[1.5vh]" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#CA922B" }}>Fragmented</div>
            <div className="inv-rule w-[4vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.85, lineHeight: 1.4 }}>
              Safety info, business recs, and community knowledge are scattered across Facebook groups, Reddit, and word of mouth
            </p>
          </div>
          <div className="flex-1 flex flex-col justify-center py-[3vh] px-[2.5vw]" style={{ background: "#1C0E06" }}>
            <div className="font-display mb-[1.5vh]" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#CA922B" }}>Untrusted</div>
            <div className="inv-rule w-[4vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.85, lineHeight: 1.4 }}>
              Generic platforms like Yelp and Google Maps don't reflect the lived experience of minority and melanated communities
            </p>
          </div>
          <div className="flex-1 flex flex-col justify-center py-[3vh] px-[2.5vw]" style={{ background: "#1C0E06" }}>
            <div className="font-display mb-[1.5vh]" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#CA922B" }}>Static</div>
            <div className="inv-rule w-[4vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.85, lineHeight: 1.4 }}>
              Existing directories are lists, not living intelligence — they don't travel with you or adapt to your journey
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
