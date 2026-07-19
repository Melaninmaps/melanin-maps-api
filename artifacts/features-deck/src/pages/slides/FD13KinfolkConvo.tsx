/* ─── HOLD — pending founder copy ────────────────────────────────────────────
   This slide is reserved for a real KinfolkAI™ conversation written by the
   founder. Placeholder styled to match collection standards.
   Do not replace with speculative dialogue until founder copy is approved.
──────────────────────────────────────────────────────────────────────────── */
export default function FD13KinfolkConvo() {
  return (
    <div className="relative w-screen h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2E1609 0%, #1C0E06 48%, #120A04 100%)" }}>
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(202,146,43,0.08) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        <div className="font-body"
          style={{ fontSize: "0.95vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "3vw" }}>
          KINFOLK AI&trade; — CONVERSATION
        </div>

        <div style={{
          width: "60vw", padding: "3.5vw",
          border: "1px solid rgba(202,146,43,0.25)",
          borderRadius: "1vw",
          background: "rgba(202,146,43,0.04)"
        }}>
          <div className="font-quote text-center"
            style={{ fontSize: "1.9vw", color: "#7B5B30", fontStyle: "italic",
              lineHeight: 1.7, marginBottom: "2vw" }}>
            This page is written by the founder.
          </div>
          <div style={{ height: "1px", background: "rgba(202,146,43,0.2)", marginBottom: "2vw" }} />
          <p className="font-body text-center"
            style={{ fontSize: "1.15vw", color: "#5A3A18", letterSpacing: "0.06em", lineHeight: 1.7 }}>
            Add your KinfolkAI&trade; conversation here —<br />
            a real exchange that shows how the guide<br />
            understands your community.
          </p>
        </div>
      </div>
    </div>
  );
}
