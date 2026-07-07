const base = import.meta.env.BASE_URL;

export default function Slide09Trust() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Right image */}
      <div className="absolute right-0 top-0 w-[46vw] h-full">
        <img
          src={`${base}hero-owner.png`}
          className="w-full h-full object-cover"
          alt="Business owner"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #1C0E06 0%, rgba(28,14,6,0.2) 45%, transparent 100%)" }} />
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>09</div>

      {/* Left content — justify-start so overflow clips at bottom not top */}
      <div className="absolute left-0 top-0 w-[56vw] h-full flex flex-col justify-start pt-[6vh] pl-[7vw] pr-[4vw]">
        <div className="biz-bar w-[9vw] mb-[2vh]" />
        <h2 className="font-display mb-[2.5vh]" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.2 }}>
          Community trust is your best marketing.
        </h2>
        <div className="flex flex-col gap-[2.2vh]">
          <div className="flex items-start gap-[2vw]">
            <div className="flex-shrink-0 mt-[1vh] rounded-full" style={{ width: "0.5vw", height: "0.5vw", background: "#CA922B" }} />
            <div>
              <div className="font-display mb-[0.4vh]" style={{ fontSize: "2.5vw", fontWeight: 800, color: "#CA922B" }}>Verified Reviews</div>
              <div className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.4 }}>Real feedback from verified community members</div>
            </div>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div className="flex-shrink-0 mt-[1vh] rounded-full" style={{ width: "0.5vw", height: "0.5vw", background: "#CA922B" }} />
            <div>
              <div className="font-display mb-[0.4vh]" style={{ fontSize: "2.5vw", fontWeight: 800, color: "#CA922B" }}>Confidence Score</div>
              <div className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.4 }}>Community-calculated trust rating shown on your profile</div>
            </div>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div className="flex-shrink-0 mt-[1vh] rounded-full" style={{ width: "0.5vw", height: "0.5vw", background: "#CA922B" }} />
            <div>
              <div className="font-display mb-[0.4vh]" style={{ fontSize: "2.5vw", fontWeight: 800, color: "#CA922B" }}>Owner Responses</div>
              <div className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.4 }}>Reply to reviews publicly to show you care</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
