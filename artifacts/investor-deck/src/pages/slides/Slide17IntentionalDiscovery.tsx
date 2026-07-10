export default function Slide16IntentionalDiscovery() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>17</div>

      <div className="absolute left-[6vw] top-[9vh]">
        <div className="font-body mb-[1.6vh]" style={{ fontSize: "1.8vw", color: "#7B5408", letterSpacing: "0.16em", fontWeight: 500 }}>
          NOT ADVERTISING
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "4.6vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          Intentional discovery.
        </h1>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[34vh] grid grid-cols-3 gap-x-[3vw] gap-y-[3.5vh]">
        <div className="font-body" style={{ fontSize: "2.5vw", color: "#3A1F0E", fontWeight: 500 }}>A click.</div>
        <div className="font-body" style={{ fontSize: "2.5vw", color: "#3A1F0E", fontWeight: 500 }}>A recommendation.</div>
        <div className="font-body" style={{ fontSize: "2.5vw", color: "#3A1F0E", fontWeight: 500 }}>A saved business.</div>
        <div className="font-body" style={{ fontSize: "2.5vw", color: "#3A1F0E", fontWeight: 500 }}>An itinerary.</div>
        <div className="font-body" style={{ fontSize: "2.5vw", color: "#3A1F0E", fontWeight: 500 }}>A relocation plan.</div>
        <div className="font-body" style={{ fontSize: "2.5vw", color: "#3A1F0E", fontWeight: 500 }}>A travel guide.</div>
      </div>
    </div>
  );
}
