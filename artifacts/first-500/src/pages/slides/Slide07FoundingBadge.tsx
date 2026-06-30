export default function Slide07FoundingBadge() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex items-center" style={{ background: "#1C0E06" }}>
      <div className="absolute top-[7vh] left-[8vw]">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>Founding Member Benefit 01</span>
      </div>

      <div className="flex items-center w-full px-[8vw] gap-[8vw]">
        {/* Left: Big key */}
        <div className="flex flex-col items-center flex-shrink-0 gap-[2vh]">
          <div className="text-[14vw] leading-none">🔑</div>
          <div className="rounded-full px-[2vw] py-[1vh]" style={{ background: "rgba(196,98,45,0.2)", border: "1px solid #C4622D" }}>
            <span className="font-body text-[1.3vw] font-semibold" style={{ color: "#C4622D" }}>Founding Member</span>
          </div>
        </div>

        {/* Right: Content */}
        <div className="flex flex-col gap-[4vh]">
          <h1 className="text-[4.5vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
            The <span style={{ color: "#CA922B" }}>🔑 Founding Member</span><br />Badge — permanent.
          </h1>

          <p className="font-body text-[1.6vw]" style={{ color: "rgba(250,246,239,0.7)" }}>
            Displayed everywhere your business appears on the platform:
          </p>

          <div className="flex flex-col gap-[2vh]">
            <div className="flex items-center gap-[1.5vw]">
              <div style={{ width: "2.5vw", height: "2px", background: "#CA922B" }} />
              <span className="font-body text-[1.6vw]" style={{ color: "#FAF6EF" }}>Your business profile page</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <div style={{ width: "2.5vw", height: "2px", background: "#CA922B" }} />
              <span className="font-body text-[1.6vw]" style={{ color: "#FAF6EF" }}>Search results & discovery cards</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <div style={{ width: "2.5vw", height: "2px", background: "#CA922B" }} />
              <span className="font-body text-[1.6vw]" style={{ color: "#FAF6EF" }}>The community map pin</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <div style={{ width: "2.5vw", height: "2px", background: "#CA922B" }} />
              <span className="font-body text-[1.6vw]" style={{ color: "#FAF6EF" }}>All community features & feeds</span>
            </div>
          </div>

          <p className="font-body text-[1.5vw] italic" style={{ color: "#CA922B" }}>
            Signals trust. Signals history. Signals community.
          </p>
        </div>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>06 / 18</span>
      </div>
    </div>
  );
}
