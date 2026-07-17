export default function FD10Belonging() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.09) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.18 }}>10</div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "3.4vw" }}>
          BELONGING
        </div>

        <p className="font-display text-center" style={{ fontSize: "3vw", fontWeight: 400, color: "#5A3A18", lineHeight: 1.25, marginBottom: "2vw", maxWidth: "68vw" }}>
          Belonging doesn&rsquo;t happen through a single feature.
        </p>

        <p className="font-display text-center" style={{ fontSize: "2.5vw", fontWeight: 400, color: "#FAF6EF", lineHeight: 1.35, marginBottom: "2vw", maxWidth: "66vw" }}>
          It happens through events, groups, businesses,<br />friends, conversations.
        </p>

        <div style={{ width: "3.5vw", height: "2px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)", marginBottom: "2vw" }} />

        <p className="font-display text-center" style={{ fontSize: "2.8vw", fontWeight: 700, color: "#CA922B", lineHeight: 1.25, maxWidth: "64vw" }}>
          It happens when you stop being a newcomer<br />and start being known.
        </p>
      </div>
    </div>
  );
}
