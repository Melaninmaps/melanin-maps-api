export default function FD19Declaration() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center" style={{ background: "#F2E4CC" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.12) 0%, transparent 68%)" }} />

      <div className="relative flex flex-col items-center" style={{ maxWidth: "72vw" }}>
        <h2 className="font-display text-center" style={{ fontSize: "4.6vw", fontWeight: 700, color: "#2C1510", lineHeight: 1.1, marginBottom: "2.4vw" }}>
          We aren&rsquo;t just mapping places.
        </h2>

        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2.4vw" }} />

        <h2 className="font-display text-center" style={{ fontSize: "4.6vw", fontWeight: 800, color: "#2C1510", lineHeight: 1.1 }}>
          We&rsquo;re mapping{" "}
          <span style={{ color: "#CA922B" }}>belonging.</span>
        </h2>
      </div>
    </div>
  );
}
