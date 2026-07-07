export default function Slide01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      {/* Left dark panel */}
      <div className="absolute left-0 top-0 w-[42vw] h-full" style={{ background: "#1C0E06" }} />

      {/* Gold rule across the break */}
      <div className="absolute left-[38vw] top-0 bottom-0 w-[0.6vw]" style={{ background: "#CA922B" }} />

      {/* Slide number — bottom right */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>01</div>

      {/* Left panel content */}
      <div className="absolute left-0 top-0 w-[38vw] h-full flex flex-col justify-center pl-[7vw] pr-[3vw]">
        <div className="font-body mb-[3vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>INVESTOR BRIEF</div>
        <h1 className="font-display text-accent leading-tight mb-[2vh]" style={{ fontSize: "6.5vw", fontWeight: 700, textWrap: "balance" }}>
          The Future of Community Intelligence.
        </h1>
        <div className="inv-rule w-[14vw] mb-[3vh]" />
        <div className="font-body" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#A07840" }}>Mapping With Melanin™</div>
      </div>

      {/* Right panel content — cream */}
      <div className="absolute right-0 top-0 w-[58vw] h-full flex flex-col justify-center pl-[7vw] pr-[7vw]">
        <div className="font-body mb-[4vh]" style={{ fontSize: "2.4vw", color: "#7B5408", letterSpacing: "0.12em", fontWeight: 300 }}>THE OPPORTUNITY</div>

        <div className="flex flex-col gap-[3vh]">
          <div className="flex items-start gap-[2vw]">
            <div className="w-[3px] h-[5vh] flex-shrink-0 mt-[0.5vh]" style={{ background: "#CA922B" }} />
            <div>
              <div className="font-display" style={{ fontSize: "3.5vw", fontWeight: 700, color: "#1C0E06" }}>Community Discovery</div>
              <div className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#3A1F0E", opacity: 0.8 }}>Built for minorities and the melanated diaspora</div>
            </div>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div className="w-[3px] h-[5vh] flex-shrink-0 mt-[0.5vh]" style={{ background: "#CA922B" }} />
            <div>
              <div className="font-display" style={{ fontSize: "3.5vw", fontWeight: 700, color: "#1C0E06" }}>Network Intelligence</div>
              <div className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#3A1F0E", opacity: 0.8 }}>Data that compounds with every member</div>
            </div>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div className="w-[3px] h-[5vh] flex-shrink-0 mt-[0.5vh]" style={{ background: "#CA922B" }} />
            <div>
              <div className="font-display" style={{ fontSize: "3.5vw", fontWeight: 700, color: "#1C0E06" }}>Multiple Revenue Streams</div>
              <div className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#3A1F0E", opacity: 0.8 }}>Memberships, B2B, AI, and data</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
