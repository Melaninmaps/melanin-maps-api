export default function Slide02Audience() {
  return (
    <div className="w-screen h-screen overflow-hidden flex items-center" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 30%, rgba(90,45,10,0.4) 0%, transparent 60%)" }} />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>02</div>

      {/* Content row */}
      <div className="relative flex items-center w-full pl-[8vw] pr-[6vw] gap-[0]">
        {/* Left: big stat */}
        <div className="flex-shrink-0 w-[38vw] overflow-hidden">
          <div className="font-display" style={{ fontSize: "8vw", fontWeight: 800, color: "#CA922B", lineHeight: 0.9 }}>100M+</div>
          <div className="biz-bar w-[14vw] mt-[2vh] mb-[1.8vh]" />
          <div className="font-body" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.4 }}>
            Minorities and the melanated diaspora — with over $3 trillion in buying power.
          </div>
        </div>

        {/* Divider */}
        <div className="flex-shrink-0 mx-[4vw]" style={{ width: "1px", height: "52vh", background: "linear-gradient(180deg, transparent, #CA922B 30%, #CA922B 70%, transparent)" }} />

        {/* Right: context */}
        <div className="flex-1">
          <h2 className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.2, marginBottom: "3vh" }}>
            Your customers are already here.
          </h2>
          <div className="flex flex-col gap-[2.5vh]">
            <div className="flex items-start gap-[1.5vw]">
              <div className="flex-shrink-0 mt-[1vh] rounded-full" style={{ width: "0.5vw", height: "0.5vw", background: "#CA922B" }} />
              <span className="font-body" style={{ fontSize: "2.4vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.4 }}>Community-first platform, not a generic directory</span>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="flex-shrink-0 mt-[1vh] rounded-full" style={{ width: "0.5vw", height: "0.5vw", background: "#CA922B" }} />
              <span className="font-body" style={{ fontSize: "2.4vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.4 }}>Members search for minority-owned businesses they can trust</span>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="flex-shrink-0 mt-[1vh] rounded-full" style={{ width: "0.5vw", height: "0.5vw", background: "#CA922B" }} />
              <span className="font-body" style={{ fontSize: "2.4vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.4 }}>Recommendations from people in the community</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
