export default function Slide17SendThemBack() {
  const channels = [
    "Website", "Instagram", "TikTok", "Facebook",
    "Booking System", "Online Store", "Phone Number", "Google Maps",
  ];
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 70% 30%, rgba(202,146,43,0.16), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>17</div>

      <div className="absolute left-[6vw] right-[6vw] top-[8vh] text-center">
        <h1 className="font-display leading-tight" style={{ fontSize: "4.2vw", fontWeight: 700, color: "#FAF6EF", textWrap: "balance" }}>
          We don&rsquo;t keep customers.
        </h1>
        <div className="font-display leading-tight" style={{ fontSize: "4.2vw", fontWeight: 700, color: "#CA922B" }}>
          We send them back to you.
        </div>
      </div>

      <div className="absolute left-[8vw] right-[8vw] bottom-[9vh] grid grid-cols-4 gap-[1.6vw]">
        {channels.map((c) => (
          <div key={c} className="flex items-center justify-center text-center" style={{ height: "9vh", borderRadius: "0.6vw", border: "2px solid #3A1F0E", background: "rgba(202,146,43,0.06)" }}>
            <span className="font-body" style={{ fontSize: "1.7vw", color: "#FAF6EF", fontWeight: 500 }}>{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
