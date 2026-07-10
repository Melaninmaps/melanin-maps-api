const base = import.meta.env.BASE_URL;

export default function Slide06ImagineCity() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>06</div>

      <div className="absolute left-[6vw] top-1/2 -translate-y-1/2" style={{ maxWidth: "38vw" }}>
        <div className="font-body mb-[2vh]" style={{ fontSize: "1.5vw", color: "#7B5408", letterSpacing: "0.16em", fontWeight: 500 }}>
          CHAPTER ONE
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>
          Discover.
        </h1>
        <div className="font-display leading-tight mt-[2.5vh]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Every journey begins with discovering where you belong.
        </div>
        <div className="font-body mt-[2.5vh]" style={{ fontSize: "1.4vw", color: "#7B5408", fontWeight: 400, lineHeight: 1.5, textWrap: "balance" }}>
          Before you arrive, discover trusted businesses, neighborhoods, events, and local recommendations from people who already know the community.
        </div>
        <div className="inv-rule mt-[3.5vh] mb-[1.6vh]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.5vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>
          Powered by community insight&mdash;not anonymous ratings alone.
        </div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2" style={{ right: "9vw" }}>
        <div className="relative" style={{ width: "20vw", height: "43vw", borderRadius: "2.2vw", border: "0.5vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <img src={`${base}mockups/app-discover.jpg`} crossOrigin="anonymous" alt="Discover screen" className="absolute inset-0 w-full h-full object-cover" />
        </div>

        <div className="absolute flex items-center" style={{ top: "17vw", left: "-13.5vw" }}>
          <span className="font-body" style={{ fontSize: "0.95vw", color: "#A6720F", fontWeight: 600, whiteSpace: "nowrap" }}>Find what matters faster</span>
          <div style={{ width: "3.2vw", height: "1px", background: "#A6720F", opacity: 0.6, marginLeft: "0.5vw" }} />
        </div>
        <div className="absolute flex items-center" style={{ top: "21.5vw", left: "-17.5vw" }}>
          <span className="font-body" style={{ fontSize: "0.95vw", color: "#A6720F", fontWeight: 600, whiteSpace: "nowrap" }}>Support verified minority-owned businesses</span>
          <div style={{ width: "3.2vw", height: "1px", background: "#A6720F", opacity: 0.6, marginLeft: "0.5vw" }} />
        </div>
        <div className="absolute flex items-center" style={{ top: "29vw", left: "-16.5vw" }}>
          <span className="font-body" style={{ fontSize: "0.95vw", color: "#A6720F", fontWeight: 600, whiteSpace: "nowrap" }}>See recommendations from the community</span>
          <div style={{ width: "2.4vw", height: "1px", background: "#A6720F", opacity: 0.6, marginLeft: "0.5vw" }} />
        </div>
      </div>
    </div>
  );
}
