export default function Slide04WhyNow() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex items-center" style={{ background: "#1C0E06" }}>
      <div className="absolute top-[7vh] left-[8vw]">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>Why Now</span>
      </div>

      {/* Big stat — left */}
      <div className="flex items-center w-full px-[8vw] gap-[8vw]">
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="text-[13vw] leading-none font-body font-bold" style={{ color: "#CA922B" }}>$1.7</div>
          <div className="text-[3.5vw] leading-none font-body font-bold" style={{ color: "#CA922B" }}>Trillion</div>
          <div className="mt-[1.5vh] font-body text-[1.4vw] text-center" style={{ color: "rgba(250,246,239,0.6)" }}>Black Consumer<br />Buying Power</div>
        </div>

        {/* Divider */}
        <div style={{ width: "2px", height: "40vh", background: "linear-gradient(180deg, transparent, #C4622D, transparent)" }} />

        {/* Right content */}
        <div className="flex flex-col gap-[3.5vh]">
          <h2 className="text-[3.2vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#FAF6EF" }}>
            The community <em>wants</em> to support<br />Black businesses.
          </h2>
          <div className="flex flex-col gap-[2.5vh]">
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[1vw] h-[1vw] rounded-full mt-[0.8vh] flex-shrink-0" style={{ background: "#C4622D" }} />
              <p className="font-body text-[1.7vw]" style={{ color: "rgba(250,246,239,0.8)" }}>They just can't find them — or trust they'll have a great experience.</p>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[1vw] h-[1vw] rounded-full mt-[0.8vh] flex-shrink-0" style={{ background: "#CA922B" }} />
              <p className="font-body text-[1.7vw]" style={{ color: "rgba(250,246,239,0.8)" }}>We built the platform. Now we need the founding businesses to fill it with life.</p>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[1vw] h-[1vw] rounded-full mt-[0.8vh] flex-shrink-0" style={{ background: "#2D7A4F" }} />
              <p className="font-body text-[1.7vw]" style={{ color: "rgba(250,246,239,0.8)" }}>Early movers shape the culture of the platform — forever.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>03 / 18</span>
      </div>
    </div>
  );
}
