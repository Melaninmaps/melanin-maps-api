export default function Slide08Visibility() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(90,45,10,0.3) 0%, transparent 60%)" }} />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>08</div>

      {/* Split layout — left header, right 5 items */}
      <div className="absolute inset-0 flex items-center pl-[7vw] pr-[6vw]">
        {/* Left */}
        <div className="w-[35vw] flex-shrink-0 pr-[3vw]">
          <div className="biz-bar w-[8vw] mb-[3vh]" />
          <h2 className="font-display text-accent leading-tight mb-[2.5vh]" style={{ fontSize: "5.5vw", fontWeight: 800 }}>
            Promotion and visibility.
          </h2>
          <p className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#E8B86D", lineHeight: 1.5 }}>
            Put your business in front of the right people at the right moment.
          </p>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-[55vh] mx-[3vw] flex-shrink-0" style={{ background: "linear-gradient(180deg, transparent, #CA922B 30%, #CA922B 70%, transparent)" }} />

        {/* Right — 5 placement types */}
        <div className="flex-1 flex flex-col gap-[2.5vh] justify-center">
          <div className="flex items-center gap-[2vw]">
            <div className="w-[4vw] h-[4vw] flex-shrink-0 flex items-center justify-center" style={{ background: "#CA922B" }}>
              <span className="font-display text-accent" style={{ fontSize: "2vw", fontWeight: 800 }}>1</span>
            </div>
            <div>
              <div className="font-display text-accent" style={{ fontSize: "3.2vw", fontWeight: 800 }}>Search Spotlight</div>
              <div className="font-body text-accent" style={{ fontSize: "2.6vw", fontWeight: 300, opacity: 0.7 }}>Top of category search results</div>
            </div>
          </div>
          <div className="flex items-center gap-[2vw]">
            <div className="w-[4vw] h-[4vw] flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(202,146,43,0.3)", border: "1px solid #CA922B" }}>
              <span className="font-display text-primary" style={{ fontSize: "2vw", fontWeight: 800 }}>2</span>
            </div>
            <div>
              <div className="font-display text-accent" style={{ fontSize: "3.2vw", fontWeight: 800 }}>Map Pin Boost</div>
              <div className="font-body text-accent" style={{ fontSize: "2.6vw", fontWeight: 300, opacity: 0.7 }}>Highlighted pin in the discovery map</div>
            </div>
          </div>
          <div className="flex items-center gap-[2vw]">
            <div className="w-[4vw] h-[4vw] flex-shrink-0 flex items-center justify-center" style={{ background: "#CA922B" }}>
              <span className="font-display text-accent" style={{ fontSize: "2vw", fontWeight: 800 }}>3</span>
            </div>
            <div>
              <div className="font-display text-accent" style={{ fontSize: "3.2vw", fontWeight: 800 }}>Community Feed</div>
              <div className="font-body text-accent" style={{ fontSize: "2.6vw", fontWeight: 300, opacity: 0.7 }}>Sponsored posts in the social feed</div>
            </div>
          </div>
          <div className="flex items-center gap-[2vw]">
            <div className="w-[4vw] h-[4vw] flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(202,146,43,0.3)", border: "1px solid #CA922B" }}>
              <span className="font-display text-primary" style={{ fontSize: "2vw", fontWeight: 800 }}>4</span>
            </div>
            <div>
              <div className="font-display text-accent" style={{ fontSize: "3.2vw", fontWeight: 800 }}>Hub Placement</div>
              <div className="font-body text-accent" style={{ fontSize: "2.6vw", fontWeight: 300, opacity: 0.7 }}>Featured inside relevant community hubs</div>
            </div>
          </div>
          <div className="flex items-center gap-[2vw]">
            <div className="w-[4vw] h-[4vw] flex-shrink-0 flex items-center justify-center" style={{ background: "#CA922B" }}>
              <span className="font-display text-accent" style={{ fontSize: "2vw", fontWeight: 800 }}>5</span>
            </div>
            <div>
              <div className="font-display text-accent" style={{ fontSize: "3.2vw", fontWeight: 800 }}>KinfolkAI</div>
              <div className="font-body text-accent" style={{ fontSize: "2.6vw", fontWeight: 300, opacity: 0.7 }}>Recommended by AI to relevant members</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
