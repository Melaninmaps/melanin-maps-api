export default function Slide02Directions() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Subtle background gradient */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(90,45,10,0.35) 0%, transparent 70%)" }} />

      {/* Slide number top right */}
      <div className="absolute top-[5vh] right-[6vw] font-display text-primary" style={{ fontSize: "2.2vw", fontWeight: 700, opacity: 0.4 }}>02</div>

      {/* Main layout — left statement, right list */}
      <div className="absolute inset-0 flex items-center pl-[7vw] pr-[6vw]">
        {/* Left: Headline */}
        <div className="w-[44vw] flex-shrink-0 pr-[4vw]">
          <div className="gold-dot mb-[3vh]" />
          <h2 className="font-display text-accent leading-tight tracking-tight mb-[3.5vh]" style={{ fontSize: "5.8vw", fontWeight: 700, textWrap: "balance" }}>
            Life doesn't come with directions.
          </h2>
          <div className="gold-rule w-[16vw] mb-[3vh]" />
          <p className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#CA922B", textWrap: "pretty" }}>
            We've all been there.
          </p>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-[55vh] mx-[3vw] flex-shrink-0" style={{ background: "linear-gradient(180deg, transparent, #CA922B 30%, #CA922B 70%, transparent)" }} />

        {/* Right: The list */}
        <div className="flex-1">
          <div className="flex flex-col gap-[2.8vh]">
            <div className="flex items-center gap-[1.5vw]">
              <div className="gold-dot flex-shrink-0" />
              <span className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 300 }}>Moving.</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <div className="gold-dot flex-shrink-0" />
              <span className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 300 }}>Traveling.</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <div className="gold-dot flex-shrink-0" />
              <span className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 300 }}>Starting over.</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <div className="gold-dot flex-shrink-0" />
              <span className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 300 }}>Finding trusted businesses.</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <div className="gold-dot flex-shrink-0" />
              <span className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 300 }}>Choosing schools.</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <div className="gold-dot flex-shrink-0" />
              <span className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 300 }}>Finding your people.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
