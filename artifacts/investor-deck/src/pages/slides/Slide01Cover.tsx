export default function Slide01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      {/* Left dark panel */}
      <div className="absolute left-0 top-0 w-[44vw] h-full" style={{ background: "#1C0E06" }} />
      {/* Gold divider line */}
      <div className="absolute top-0 bottom-0 w-[0.5vw]" style={{ left: "44vw", background: "#CA922B" }} />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>01</div>

      {/* Left panel */}
      <div className="absolute left-0 top-0 w-[44vw] h-full flex flex-col justify-center pl-[7vw] pr-[5vw]">
        <div className="font-body mb-[2.5vh]" style={{ fontSize: "2.2vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>
          INVESTOR BRIEF
        </div>
        <h1 className="font-display leading-tight mb-[2vh]" style={{ fontSize: "5.5vw", fontWeight: 700, color: "#FAF6EF", textWrap: "balance" }}>
          The Future of Community Intelligence.
        </h1>
        <div className="inv-rule w-[12vw] mb-[2.5vh]" />
        <div className="font-body" style={{ fontSize: "2.4vw", fontWeight: 300, color: "#A07840" }}>
          Mapping With Melanin™
        </div>
      </div>

      {/* Right panel */}
      <div className="absolute top-0 bottom-0 flex flex-col justify-center pl-[6vw] pr-[6vw]" style={{ left: "46vw" }}>
        <div className="font-body mb-[3.5vh]" style={{ fontSize: "2.2vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 300 }}>
          THE OPPORTUNITY
        </div>
        <div className="flex flex-col gap-[3.5vh]">
          <div className="flex items-start gap-[1.8vw]">
            <div className="flex-shrink-0 mt-[0.6vh]" style={{ width: "3px", height: "4.5vh", background: "#CA922B" }} />
            <div>
              <div className="font-display" style={{ fontSize: "3vw", fontWeight: 700, color: "#1C0E06" }}>Community Discovery</div>
              <div className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#3A1F0E" }}>Built for minorities and the melanated diaspora</div>
            </div>
          </div>
          <div className="flex items-start gap-[1.8vw]">
            <div className="flex-shrink-0 mt-[0.6vh]" style={{ width: "3px", height: "4.5vh", background: "#CA922B" }} />
            <div>
              <div className="font-display" style={{ fontSize: "3vw", fontWeight: 700, color: "#1C0E06" }}>Network Intelligence</div>
              <div className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#3A1F0E" }}>Data that compounds with every member</div>
            </div>
          </div>
          <div className="flex items-start gap-[1.8vw]">
            <div className="flex-shrink-0 mt-[0.6vh]" style={{ width: "3px", height: "4.5vh", background: "#CA922B" }} />
            <div>
              <div className="font-display" style={{ fontSize: "3vw", fontWeight: 700, color: "#1C0E06" }}>Multiple Revenue Streams</div>
              <div className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#3A1F0E" }}>Memberships, B2B, AI, and data</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
