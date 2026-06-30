export default function Slide09Dashboard() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex items-center" style={{ background: "#1C0E06" }}>
      <div className="absolute top-[7vh] left-[8vw]">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>Founding Member Benefit 03</span>
      </div>

      <div className="flex flex-col gap-[4vh] px-[8vw] w-full">
        <h1 className="text-[4.5vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
          Your business <span style={{ color: "#CA922B" }}>command center.</span>
        </h1>

        <div className="grid grid-cols-3 gap-[1.8vw]">
          <div className="rounded-xl p-[1.8vw]" style={{ background: "rgba(196,98,45,0.1)", border: "1px solid rgba(196,98,45,0.25)" }}>
            <div className="text-[2.2vw] mb-[1.2vh]">✏️</div>
            <div className="font-body text-[1.25vw] font-semibold mb-[0.8vh]" style={{ color: "#FAF6EF" }}>Edit Your Profile</div>
            <div className="font-body text-[1.05vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Photos, intro video, hours, story — always in your control</div>
          </div>
          <div className="rounded-xl p-[1.8vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="text-[2.2vw] mb-[1.2vh]">📊</div>
            <div className="font-body text-[1.25vw] font-semibold mb-[0.8vh]" style={{ color: "#FAF6EF" }}>Saves & Analytics</div>
            <div className="font-body text-[1.05vw]" style={{ color: "rgba(250,246,239,0.6)" }}>See who's saving, visiting, and clicking your listing</div>
          </div>
          <div className="rounded-xl p-[1.8vw]" style={{ background: "rgba(45,122,79,0.1)", border: "1px solid rgba(45,122,79,0.25)" }}>
            <div className="text-[2.2vw] mb-[1.2vh]">💬</div>
            <div className="font-body text-[1.25vw] font-semibold mb-[0.8vh]" style={{ color: "#FAF6EF" }}>Respond to Reviews</div>
            <div className="font-body text-[1.05vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Post public owner responses — build trust, show you listen</div>
          </div>
          <div className="rounded-xl p-[1.8vw]" style={{ background: "rgba(196,98,45,0.1)", border: "1px solid rgba(196,98,45,0.25)" }}>
            <div className="text-[2.2vw] mb-[1.2vh]">🔇</div>
            <div className="font-body text-[1.25vw] font-semibold mb-[0.8vh]" style={{ color: "#FAF6EF" }}>Skip Insights</div>
            <div className="font-body text-[1.05vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Private intel on why people pass — only you see it</div>
          </div>
          <div className="rounded-xl p-[1.8vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="text-[2.2vw] mb-[1.2vh]">📣</div>
            <div className="font-body text-[1.25vw] font-semibold mb-[0.8vh]" style={{ color: "#FAF6EF" }}>Community Broadcasts</div>
            <div className="font-body text-[1.05vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Send announcements to everyone who saved your business</div>
          </div>
          <div className="rounded-xl p-[1.8vw]" style={{ background: "rgba(196,98,45,0.1)", border: "1px solid rgba(196,98,45,0.25)" }}>
            <div className="text-[2.2vw] mb-[1.2vh]">🤖</div>
            <div className="font-body text-[1.25vw] font-semibold mb-[0.8vh]" style={{ color: "#FAF6EF" }}>KinfolkAI™ Action Plan</div>
            <div className="font-body text-[1.05vw]" style={{ color: "rgba(250,246,239,0.6)" }}>AI-generated growth plan based on your real community data</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>08 / 18</span>
      </div>
    </div>
  );
}
