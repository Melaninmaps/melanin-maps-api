export default function Slide07Safety() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Dark amber band on left */}
      <div className="absolute left-0 top-0 bottom-0 w-[5vw]" style={{ background: "linear-gradient(180deg, rgba(202,146,43,0.3) 0%, rgba(202,146,43,0.1) 50%, rgba(202,146,43,0.3) 100%)" }} />

      {/* Slide number */}
      <div className="absolute top-[5vh] right-[6vw] font-display text-primary" style={{ fontSize: "2.2vw", fontWeight: 700, opacity: 0.4 }}>07</div>

      {/* Top section */}
      <div className="absolute top-[8vh] left-[8vw] right-[7vw]">
        <div className="gold-dot mb-[2vh]" />
        <h2 className="font-display text-accent leading-tight tracking-tight mb-[2vh]" style={{ fontSize: "5vw", fontWeight: 700 }}>
          Safety that travels with you.
        </h2>
        <div className="gold-rule w-[20vw]" />
      </div>

      {/* 3-column feature grid */}
      <div className="absolute left-[8vw] right-[7vw]" style={{ top: "32vh", bottom: "8vh" }}>
        <div className="grid grid-cols-3 gap-[2.5vw] h-full">
          <div className="flex flex-col justify-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="font-display text-primary mb-[1.5vh]" style={{ fontSize: "3.6vw", fontWeight: 700 }}>Neighborhoods</div>
            <div className="gold-rule w-[4vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8, lineHeight: 1.4 }}>
              Community safety scores from people who live there
            </p>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="font-display text-primary mb-[1.5vh]" style={{ fontSize: "3.6vw", fontWeight: 700 }}>Meetup Verification</div>
            <div className="gold-rule w-[4vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8, lineHeight: 1.4 }}>
              Verified check-ins for safe meet-ups
            </p>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="font-display text-primary mb-[1.5vh]" style={{ fontSize: "3.6vw", fontWeight: 700 }}>Officer Watch</div>
            <div className="gold-rule w-[4vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8, lineHeight: 1.4 }}>
              Real-time community reports on encounters
            </p>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="font-display text-primary mb-[1.5vh]" style={{ fontSize: "3.6vw", fontWeight: 700 }}>Community Alerts</div>
            <div className="gold-rule w-[4vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8, lineHeight: 1.4 }}>
              Hyper-local warnings from your network
            </p>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="font-display text-primary mb-[1.5vh]" style={{ fontSize: "3.6vw", fontWeight: 700 }}>Emergency Resources</div>
            <div className="gold-rule w-[4vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8, lineHeight: 1.4 }}>
              Vetted resources available wherever you are
            </p>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="font-display text-primary mb-[1.5vh]" style={{ fontSize: "3.6vw", fontWeight: 700 }}>Travel Confidence</div>
            <div className="gold-rule w-[4vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8, lineHeight: 1.4 }}>
              Go anywhere knowing your community has your back
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
