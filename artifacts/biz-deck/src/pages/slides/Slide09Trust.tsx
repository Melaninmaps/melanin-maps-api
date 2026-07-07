const base = import.meta.env.BASE_URL;

export default function Slide09Trust() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Right image */}
      <div className="absolute right-0 top-0 w-[46vw] h-full">
        <img
          src={`${base}hero-owner.png`}
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          alt="Business owner"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #1C0E06 0%, rgba(28,14,6,0.15) 40%, transparent 100%)" }} />
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>09</div>

      {/* Left content */}
      <div className="absolute left-[7vw] top-0 bottom-0 w-[55vw] flex flex-col justify-center pr-[4vw]">
        <div className="biz-bar w-[10vw] mb-[3vh]" />
        <h2 className="font-display text-accent leading-tight mb-[3.5vh]" style={{ fontSize: "5vw", fontWeight: 800 }}>
          Community trust is your best marketing.
        </h2>

        <div className="flex flex-col gap-[3vh]">
          <div className="flex items-start gap-[2vw]">
            <div className="w-[0.5vw] h-[0.5vw] rounded-full flex-shrink-0 mt-[1.5vh]" style={{ background: "#CA922B" }} />
            <div>
              <div className="font-display text-primary" style={{ fontSize: "3.3vw", fontWeight: 800 }}>Verified Reviews</div>
              <div className="font-body text-accent" style={{ fontSize: "2.8vw", fontWeight: 300, opacity: 0.8 }}>Real feedback from verified community members</div>
            </div>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div className="w-[0.5vw] h-[0.5vw] rounded-full flex-shrink-0 mt-[1.5vh]" style={{ background: "#CA922B" }} />
            <div>
              <div className="font-display text-primary" style={{ fontSize: "3.3vw", fontWeight: 800 }}>Confidence Score</div>
              <div className="font-body text-accent" style={{ fontSize: "2.8vw", fontWeight: 300, opacity: 0.8 }}>Community-calculated trust rating shown on your profile</div>
            </div>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div className="w-[0.5vw] h-[0.5vw] rounded-full flex-shrink-0 mt-[1.5vh]" style={{ background: "#CA922B" }} />
            <div>
              <div className="font-display text-primary" style={{ fontSize: "3.3vw", fontWeight: 800 }}>Owner Responses</div>
              <div className="font-body text-accent" style={{ fontSize: "2.8vw", fontWeight: 300, opacity: 0.8 }}>Reply to reviews publicly to show you care</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
