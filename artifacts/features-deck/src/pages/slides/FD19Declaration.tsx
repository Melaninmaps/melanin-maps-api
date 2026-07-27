/* ─── Act IV — Declaration ───────────────────────────────────────────────────
   Cream returns — but now it feels earned. The audience has seen it at
   Community and Belonging. The background is not new. It is familiar.
   We've arrived somewhere. Not arrived somewhere new — arrived home.
   Cream updated to Antique Manuscript #E4D0AD (Creative Director choice).
──────────────────────────────────────────────────────────────────────────── */
export default function FD19Declaration() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "#E4D0AD" }}>
      {/* Warm center glow — paper catching afternoon light */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.13) 0%, transparent 68%)" }} />

      <div className="relative flex flex-col items-center" style={{ maxWidth: "72vw" }}>
        <h2 className="font-display text-center"
          style={{ fontSize: "4.6vw", fontWeight: 700, color: "#2C1510", lineHeight: 1.1, marginBottom: "2.8vw" }}>
          We aren&rsquo;t just mapping places.
        </h2>

        <div style={{ width: "5vw", height: "2px", background: "#CA922B",
          boxShadow: "0 1px 6px rgba(202,146,43,0.25)", marginBottom: "2.8vw" }} />

        <h2 className="font-display text-center"
          style={{ fontSize: "4.6vw", fontWeight: 800, color: "#2C1510", lineHeight: 1.1 }}>
          We&rsquo;re mapping{" "}
          <span style={{ color: "#CA922B",
            textShadow: "0 2px 8px rgba(202,146,43,0.18), 0 1px 3px rgba(0,0,0,0.10)" }}>
            belonging.
          </span>
        </h2>
      </div>
    </div>
  );
}
