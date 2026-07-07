export default function Slide06BuiltByYou() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 10% 90%, rgba(90,45,10,0.35) 0%, transparent 55%)" }} />

      {/* Slide number */}
      <div className="absolute top-[5vh] right-[6vw] font-display text-primary" style={{ fontSize: "2.2vw", fontWeight: 700, opacity: 0.4 }}>06</div>

      {/* Header — spans full width */}
      <div className="absolute top-[8vh] left-[7vw] right-[7vw]">
        <div className="flex items-center gap-[1.5vw] mb-[1.5vh]">
          <div className="gold-dot" />
          <h2 className="font-display text-accent leading-tight tracking-tight" style={{ fontSize: "5vw", fontWeight: 700 }}>
            Built by people like you.
          </h2>
        </div>
        <div className="gold-rule w-[22vw]" />
      </div>

      {/* 4-column grid of features */}
      <div className="absolute left-[7vw] right-[7vw]" style={{ top: "30vh", bottom: "9vh" }}>
        <div className="grid grid-cols-4 gap-[2vw] h-full">
          <div className="flex flex-col gap-[1vh] py-[2vh] px-[1.5vw]" style={{ background: "rgba(250,246,239,0.04)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="gold-rule w-[2.5vw] mb-[0.5vh]" />
            <span className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 600 }}>Creator Videos</span>
            <span className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#A07840", lineHeight: 1.4 }}>Community-made guides and stories</span>
          </div>
          <div className="flex flex-col gap-[1vh] py-[2vh] px-[1.5vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="gold-rule w-[2.5vw] mb-[0.5vh]" />
            <span className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 600 }}>Community Tips</span>
            <span className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#A07840", lineHeight: 1.4 }}>Local knowledge from residents</span>
          </div>
          <div className="flex flex-col gap-[1vh] py-[2vh] px-[1.5vw]" style={{ background: "rgba(250,246,239,0.04)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="gold-rule w-[2.5vw] mb-[0.5vh]" />
            <span className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 600 }}>Questions</span>
            <span className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#A07840", lineHeight: 1.4 }}>Ask, answer, connect</span>
          </div>
          <div className="flex flex-col gap-[1vh] py-[2vh] px-[1.5vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="gold-rule w-[2.5vw] mb-[0.5vh]" />
            <span className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 600 }}>Recommendations</span>
            <span className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#A07840", lineHeight: 1.4 }}>Trusted by people like you</span>
          </div>
          <div className="flex flex-col gap-[1vh] py-[2vh] px-[1.5vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="gold-rule w-[2.5vw] mb-[0.5vh]" />
            <span className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 600 }}>Mentors</span>
            <span className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#A07840", lineHeight: 1.4 }}>Learn from those ahead</span>
          </div>
          <div className="flex flex-col gap-[1vh] py-[2vh] px-[1.5vw]" style={{ background: "rgba(250,246,239,0.04)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="gold-rule w-[2.5vw] mb-[0.5vh]" />
            <span className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 600 }}>Events</span>
            <span className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#A07840", lineHeight: 1.4 }}>Find your people nearby</span>
          </div>
          <div className="flex flex-col gap-[1vh] py-[2vh] px-[1.5vw]" style={{ background: "rgba(250,246,239,0.04)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="gold-rule w-[2.5vw] mb-[0.5vh]" />
            <span className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 600 }}>Businesses</span>
            <span className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#A07840", lineHeight: 1.4 }}>Community-verified listings</span>
          </div>
          <div className="flex flex-col gap-[1vh] py-[2vh] px-[1.5vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="gold-rule w-[2.5vw] mb-[0.5vh]" />
            <span className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 600 }}>Safety</span>
            <span className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#A07840", lineHeight: 1.4 }}>Real reports, real alerts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
