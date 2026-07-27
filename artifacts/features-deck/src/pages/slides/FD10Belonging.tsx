/* ─── Act II continues — second cream page ───────────────────────────────────
   Cream held one more page. The audience subconsciously settles.
   Emotional arc: Curiosity → Belonging
──────────────────────────────────────────────────────────────────────────── */
export default function FD10Belonging() {
  return (
    <div className="relative w-screen h-screen overflow-hidden"
      style={{ background: "#E4D0AD" }}>
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.09) 0%, transparent 65%)" }} />

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        <div className="font-body"
          style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "3.8vw" }}>
          BELONGING
        </div>

        <p className="font-display text-center"
          style={{ fontSize: "3vw", fontWeight: 400, color: "#B5906A", lineHeight: 1.25,
            marginBottom: "2.2vw", maxWidth: "68vw" }}>
          Belonging doesn&rsquo;t happen through a single feature.
        </p>

        <p className="font-display text-center"
          style={{ fontSize: "2.5vw", fontWeight: 400, color: "#2C1510", lineHeight: 1.35,
            marginBottom: "2.2vw", maxWidth: "66vw" }}>
          It happens through events, groups, businesses,<br />friends, conversations.
        </p>

        <div style={{ width: "3.5vw", height: "2px",
          background: "linear-gradient(90deg,transparent,#CA922B,transparent)",
          boxShadow: "0 1px 6px rgba(202,146,43,0.20)", marginBottom: "2.2vw" }} />

        {/* Final statement — visually connected, not orphaned */}
        <p className="font-display text-center"
          style={{ fontSize: "2.8vw", fontWeight: 700, color: "#CA922B", lineHeight: 1.25,
            maxWidth: "64vw",
            textShadow: "0 2px 8px rgba(202,146,43,0.18), 0 1px 3px rgba(0,0,0,0.10)" }}>
          It happens when you stop being a newcomer<br />and start being known.
        </p>
      </div>
    </div>
  );
}
