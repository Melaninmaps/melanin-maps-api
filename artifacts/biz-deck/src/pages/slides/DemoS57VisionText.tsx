const base = import.meta.env.BASE_URL;

export default function DemoS57VisionText() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0">
        <img src={`${base}photos/family-relocating.jpg`} crossOrigin="anonymous" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.15 }} />
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(13,8,5,0.95) 0%, rgba(13,8,5,0.7) 100%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center items-center text-center" style={{ inset: 0, padding: "0 12vw" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2.5vw" }}>MAPPING WITH MELANIN™ · OUR VISION</div>
        <div className="font-display" style={{ fontSize: "5.2vw", fontWeight: 900, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "2vw" }}>
          We're building the infrastructure<br />for diaspora discovery.
        </div>
        <div style={{ width: "8vw", height: "2px", background: "#CA922B", marginBottom: "2.5vw", opacity: 0.8 }} />
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#A87A40", lineHeight: 1.8, maxWidth: "68vw", marginBottom: "3.5vw" }}>
          Not a directory. Not a rating app. Not a social network. A full-stack platform where safety, community, commerce, and intelligence converge — built specifically for melanated and minority communities who have always moved through this world with both joy and vigilance.
        </div>
        <div className="font-display" style={{ fontSize: "2vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.3 }}>
          Zara found her people. Marcus grew his business.<br />That's not a product feature. That's a community.
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>57 / 58</div>
    </div>
  );
}
