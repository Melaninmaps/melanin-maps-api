export default function Slide08Visibility() {
  return (
    <div className="w-screen h-screen overflow-hidden flex items-center" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(90,45,10,0.3) 0%, transparent 60%)" }} />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>08</div>

      <div className="relative flex items-center w-full pl-[7vw] pr-[6vw]">
        {/* Left */}
        <div className="flex-shrink-0 w-[34vw] pr-[3vw]">
          <div className="biz-bar w-[7vw] mb-[2.5vh]" />
          <h2 className="font-display mb-[2vh]" style={{ fontSize: "4.5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.2 }}>
            Promotion and visibility.
          </h2>
          <p className="font-body" style={{ fontSize: "2.7vw", fontWeight: 300, color: "#E8B86D", lineHeight: 1.5 }}>
            Put your business in front of the right people at the right moment.
          </p>
        </div>

        {/* Divider */}
        <div className="flex-shrink-0 mx-[3vw]" style={{ width: "1px", height: "55vh", background: "linear-gradient(180deg, transparent, #CA922B 30%, #CA922B 70%, transparent)" }} />

        {/* Right — 5 placement types */}
        <div className="flex-1 flex flex-col gap-[2.2vh]">
          <div className="flex items-center gap-[2vw]">
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: "3.8vw", height: "3.8vw", background: "#CA922B" }}>
              <span className="font-display" style={{ fontSize: "1.8vw", fontWeight: 800, color: "#FAF6EF" }}>1</span>
            </div>
            <div>
              <div className="font-display" style={{ fontSize: "2.9vw", fontWeight: 800, color: "#FAF6EF" }}>Search Spotlight</div>
              <div className="font-body" style={{ fontSize: "2.4vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.7 }}>Top of category search results</div>
            </div>
          </div>
          <div className="flex items-center gap-[2vw]">
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: "3.8vw", height: "3.8vw", background: "rgba(202,146,43,0.3)", border: "1px solid #CA922B" }}>
              <span className="font-display" style={{ fontSize: "1.8vw", fontWeight: 800, color: "#CA922B" }}>2</span>
            </div>
            <div>
              <div className="font-display" style={{ fontSize: "2.9vw", fontWeight: 800, color: "#FAF6EF" }}>Map Pin Boost</div>
              <div className="font-body" style={{ fontSize: "2.4vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.7 }}>Highlighted pin in the discovery map</div>
            </div>
          </div>
          <div className="flex items-center gap-[2vw]">
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: "3.8vw", height: "3.8vw", background: "#CA922B" }}>
              <span className="font-display" style={{ fontSize: "1.8vw", fontWeight: 800, color: "#FAF6EF" }}>3</span>
            </div>
            <div>
              <div className="font-display" style={{ fontSize: "2.9vw", fontWeight: 800, color: "#FAF6EF" }}>Community Feed</div>
              <div className="font-body" style={{ fontSize: "2.4vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.7 }}>Sponsored posts in the social feed</div>
            </div>
          </div>
          <div className="flex items-center gap-[2vw]">
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: "3.8vw", height: "3.8vw", background: "rgba(202,146,43,0.3)", border: "1px solid #CA922B" }}>
              <span className="font-display" style={{ fontSize: "1.8vw", fontWeight: 800, color: "#CA922B" }}>4</span>
            </div>
            <div>
              <div className="font-display" style={{ fontSize: "2.9vw", fontWeight: 800, color: "#FAF6EF" }}>Hub Placement</div>
              <div className="font-body" style={{ fontSize: "2.4vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.7 }}>Featured inside relevant community hubs</div>
            </div>
          </div>
          <div className="flex items-center gap-[2vw]">
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: "3.8vw", height: "3.8vw", background: "#CA922B" }}>
              <span className="font-display" style={{ fontSize: "1.8vw", fontWeight: 800, color: "#FAF6EF" }}>5</span>
            </div>
            <div>
              <div className="font-display" style={{ fontSize: "2.9vw", fontWeight: 800, color: "#FAF6EF" }}>KinfolkAI</div>
              <div className="font-body" style={{ fontSize: "2.4vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.7 }}>Recommended by AI to relevant members</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
