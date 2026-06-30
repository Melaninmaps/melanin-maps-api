export default function Slide13AllPerks() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex flex-col justify-center" style={{ background: "#1C0E06" }}>
      <div className="absolute top-[5vh] left-1/2 -translate-x-1/2 text-center">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>Founding Member Perks at a Glance</span>
      </div>

      <div className="flex flex-col items-center gap-[4vh] px-[6vw]">
        <h1 className="text-[4vw] leading-tight text-center" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
          Everything you get, <span style={{ color: "#CA922B" }}>permanently.</span>
        </h1>

        <div className="grid grid-cols-4 gap-[1.5vw] w-full">
          <div className="rounded-xl p-[1.5vw] text-center flex flex-col items-center gap-[1vh]" style={{ background: "rgba(196,98,45,0.12)", border: "1px solid rgba(196,98,45,0.3)" }}>
            <span className="text-[2.5vw]">🔑</span>
            <div className="font-body text-[1.1vw] font-semibold" style={{ color: "#FAF6EF" }}>Founding Badge</div>
            <div className="font-body text-[0.95vw]" style={{ color: "rgba(250,246,239,0.55)" }}>Permanent — everywhere</div>
          </div>
          <div className="rounded-xl p-[1.5vw] text-center flex flex-col items-center gap-[1vh]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <span className="text-[2.5vw]">📍</span>
            <div className="font-body text-[1.1vw] font-semibold" style={{ color: "#FAF6EF" }}>Priority Placement</div>
            <div className="font-body text-[0.95vw]" style={{ color: "rgba(250,246,239,0.55)" }}>Search, map & feed</div>
          </div>
          <div className="rounded-xl p-[1.5vw] text-center flex flex-col items-center gap-[1vh]" style={{ background: "rgba(45,122,79,0.12)", border: "1px solid rgba(45,122,79,0.3)" }}>
            <span className="text-[2.5vw]">📊</span>
            <div className="font-body text-[1.1vw] font-semibold" style={{ color: "#FAF6EF" }}>Full Analytics</div>
            <div className="font-body text-[0.95vw]" style={{ color: "rgba(250,246,239,0.55)" }}>Saves, visits & clicks</div>
          </div>
          <div className="rounded-xl p-[1.5vw] text-center flex flex-col items-center gap-[1vh]" style={{ background: "rgba(196,98,45,0.12)", border: "1px solid rgba(196,98,45,0.3)" }}>
            <span className="text-[2.5vw]">🤖</span>
            <div className="font-body text-[1.1vw] font-semibold" style={{ color: "#FAF6EF" }}>KinfolkAI™ Plan</div>
            <div className="font-body text-[0.95vw]" style={{ color: "rgba(250,246,239,0.55)" }}>AI growth roadmap</div>
          </div>
          <div className="rounded-xl p-[1.5vw] text-center flex flex-col items-center gap-[1vh]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <span className="text-[2.5vw]">🔇</span>
            <div className="font-body text-[1.1vw] font-semibold" style={{ color: "#FAF6EF" }}>Skip Insights</div>
            <div className="font-body text-[0.95vw]" style={{ color: "rgba(250,246,239,0.55)" }}>Private community intel</div>
          </div>
          <div className="rounded-xl p-[1.5vw] text-center flex flex-col items-center gap-[1vh]" style={{ background: "rgba(196,98,45,0.12)", border: "1px solid rgba(196,98,45,0.3)" }}>
            <span className="text-[2.5vw]">🔔</span>
            <div className="font-body text-[1.1vw] font-semibold" style={{ color: "#FAF6EF" }}>Move Alerts</div>
            <div className="font-body text-[0.95vw]" style={{ color: "rgba(250,246,239,0.55)" }}>Notify saved customers</div>
          </div>
          <div className="rounded-xl p-[1.5vw] text-center flex flex-col items-center gap-[1vh]" style={{ background: "rgba(45,122,79,0.12)", border: "1px solid rgba(45,122,79,0.3)" }}>
            <span className="text-[2.5vw]">📣</span>
            <div className="font-body text-[1.1vw] font-semibold" style={{ color: "#FAF6EF" }}>Broadcasts</div>
            <div className="font-body text-[0.95vw]" style={{ color: "rgba(250,246,239,0.55)" }}>Community channel</div>
          </div>
          <div className="rounded-xl p-[1.5vw] text-center flex flex-col items-center gap-[1vh]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <span className="text-[2.5vw]">🎯</span>
            <div className="font-body text-[1.1vw] font-semibold" style={{ color: "#FAF6EF" }}>Promotion Tools</div>
            <div className="font-body text-[0.95vw]" style={{ color: "rgba(250,246,239,0.55)" }}>Boost your listing</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>12 / 18</span>
      </div>
    </div>
  );
}
