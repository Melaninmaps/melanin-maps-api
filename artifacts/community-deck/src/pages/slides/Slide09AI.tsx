export default function Slide09AI() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(90,45,10,0.5) 0%, transparent 70%)" }} />

      {/* Slide number */}
      <div className="absolute top-[5vh] right-[6vw] font-display text-primary" style={{ fontSize: "2.2vw", fontWeight: 700, opacity: 0.4 }}>09</div>

      {/* Header — centered */}
      <div className="absolute top-[8vh] left-[7vw] right-[7vw] text-center">
        <div className="flex items-center justify-center gap-[1.5vw] mb-[2vh]">
          <div className="gold-dot" />
          <h2 className="font-display text-accent leading-tight tracking-tight" style={{ fontSize: "5vw", fontWeight: 700 }}>
            AI that understands your journey.
          </h2>
          <div className="gold-dot" />
        </div>
        <div className="flex justify-center"><div className="gold-rule w-[22vw]" /></div>
        <p className="font-body mt-[1.5vh]" style={{ fontSize: "3vw", fontWeight: 300, color: "#E8B86D" }}>Kinfolk AI — your personal community guide.</p>
      </div>

      {/* 5-item row */}
      <div className="absolute left-[5vw] right-[5vw]" style={{ top: "38vh", bottom: "8vh" }}>
        <div className="flex gap-[2vw] h-full">
          <div className="flex-1 flex flex-col items-center justify-center py-[3vh] px-[1.5vw] text-center" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.35)" }}>
            <div className="gold-rule w-[3vw] mb-[2vh]" />
            <div className="font-display text-primary mb-[1.5vh]" style={{ fontSize: "3vw", fontWeight: 700 }}>Roadmaps</div>
            <p className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.75, lineHeight: 1.4 }}>Step-by-step guides for life's transitions</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-[3vh] px-[1.5vw] text-center" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="gold-rule w-[3vw] mb-[2vh]" />
            <div className="font-display text-primary mb-[1.5vh]" style={{ fontSize: "3vw", fontWeight: 700 }}>Recommendations</div>
            <p className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.75, lineHeight: 1.4 }}>Personalized to your life stage</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-[3vh] px-[1.5vw] text-center" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.35)" }}>
            <div className="gold-rule w-[3vw] mb-[2vh]" />
            <div className="font-display text-primary mb-[1.5vh]" style={{ fontSize: "3vw", fontWeight: 700 }}>Saved Topics</div>
            <p className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.75, lineHeight: 1.4 }}>Your interests, organized and delivered</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-[3vh] px-[1.5vw] text-center" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="gold-rule w-[3vw] mb-[2vh]" />
            <div className="font-display text-primary mb-[1.5vh]" style={{ fontSize: "3vw", fontWeight: 700 }}>Weekly Digests</div>
            <p className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.75, lineHeight: 1.4 }}>What matters in your hubs, summarized</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-[3vh] px-[1.5vw] text-center" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.35)" }}>
            <div className="gold-rule w-[3vw] mb-[2vh]" />
            <div className="font-display text-primary mb-[1.5vh]" style={{ fontSize: "3vw", fontWeight: 700 }}>Trip Planning</div>
            <p className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.75, lineHeight: 1.4 }}>Travel plans backed by community knowledge</p>
          </div>
        </div>
      </div>
    </div>
  );
}
