export default function Slide14Membership() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex items-center justify-center" style={{ background: "#1C0E06" }}>
      <div className="absolute top-[7vh] left-1/2 -translate-x-1/2">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>Membership Investment</span>
      </div>

      <div className="flex items-center gap-[8vw]">
        {/* Pricing card */}
        <div className="rounded-3xl p-[4vw] flex flex-col items-center gap-[3vh] w-[35vw]" style={{ background: "linear-gradient(135deg, rgba(196,98,45,0.2), rgba(202,146,43,0.1))", border: "2px solid rgba(202,146,43,0.5)" }}>
          <div className="rounded-full px-[2vw] py-[0.8vh]" style={{ background: "#C4622D" }}>
            <span className="font-body text-[1vw] font-semibold tracking-widest uppercase text-white">Founding Rate — Locked Forever</span>
          </div>
          <div className="text-[1.5vw] font-body" style={{ color: "rgba(250,246,239,0.7)" }}>Starting at</div>
          <div className="flex items-start gap-[0.5vw]">
            <span className="font-body text-[3vw] font-bold mt-[1.5vh]" style={{ color: "#CA922B" }}>$</span>
            <span className="font-body font-bold" style={{ fontSize: "9vw", lineHeight: 1, color: "#CA922B" }}>29</span>
            <span className="font-body text-[2vw] font-semibold mt-[5vh]" style={{ color: "rgba(202,146,43,0.7)" }}>/mo</span>
          </div>
          <div className="font-body text-[1.2vw] text-center" style={{ color: "rgba(250,246,239,0.6)" }}>
            Price never increases as long as you remain a founding member
          </div>
          <div style={{ width: "80%", height: "1px", background: "rgba(202,146,43,0.3)" }} />
          <div className="font-body text-[1.2vw] text-center" style={{ color: "rgba(250,246,239,0.55)" }}>
            Standard listings will cost significantly more when we open to the public
          </div>
        </div>

        {/* Right text */}
        <div className="flex flex-col gap-[4vh] max-w-[35vw]">
          <h2 className="text-[3.8vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
            Your rate is your reward for believing <span style={{ color: "#CA922B" }}>early.</span>
          </h2>
          <div className="flex flex-col gap-[2.5vh]">
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full mt-[0.8vh] flex-shrink-0" style={{ background: "#2D7A4F" }} />
              <p className="font-body text-[1.5vw]" style={{ color: "rgba(250,246,239,0.8)" }}>Founding rate is locked in — forever, with no price increases</p>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full mt-[0.8vh] flex-shrink-0" style={{ background: "#CA922B" }} />
              <p className="font-body text-[1.5vw]" style={{ color: "rgba(250,246,239,0.8)" }}>General public listings open at a higher rate — you're grandfathered in</p>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full mt-[0.8vh] flex-shrink-0" style={{ background: "#C4622D" }} />
              <p className="font-body text-[1.5vw]" style={{ color: "rgba(250,246,239,0.8)" }}>500 spots. Once they're gone, they're gone.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>13 / 18</span>
      </div>
    </div>
  );
}
