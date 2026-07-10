export default function Slide06ImagineCity() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>06</div>

      <div className="absolute left-[6vw] top-[7vh]">
        <h1 className="font-display leading-tight" style={{ fontSize: "4.4vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          Imagine moving to a new city.
        </h1>
        <div className="font-body mt-[1.6vh]" style={{ fontSize: "2.4vw", color: "#7B5408", fontWeight: 300 }}>
          You don&rsquo;t know&hellip;
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[30vh] grid grid-cols-2 gap-x-[4vw] gap-y-[2.2vh]">
        <div className="font-body" style={{ fontSize: "2.6vw", color: "#3A1F0E" }}>&mdash; the neighborhoods</div>
        <div className="font-body" style={{ fontSize: "2.6vw", color: "#3A1F0E" }}>&mdash; the networking groups</div>
        <div className="font-body" style={{ fontSize: "2.6vw", color: "#3A1F0E" }}>&mdash; the schools</div>
        <div className="font-body" style={{ fontSize: "2.6vw", color: "#3A1F0E" }}>&mdash; the local events</div>
        <div className="font-body" style={{ fontSize: "2.6vw", color: "#3A1F0E" }}>&mdash; the salons</div>
        <div className="font-body" style={{ fontSize: "2.6vw", color: "#3A1F0E" }}>&mdash; which businesses welcome you</div>
        <div className="font-body" style={{ fontSize: "2.6vw", color: "#3A1F0E" }}>&mdash; the doctors</div>
        <div className="font-body" style={{ fontSize: "2.6vw", color: "#3A1F0E" }}>&mdash; or who your community is</div>
        <div className="font-body" style={{ fontSize: "2.6vw", color: "#3A1F0E" }}>&mdash; the churches</div>
        <div />
        <div className="font-body" style={{ fontSize: "2.6vw", color: "#3A1F0E" }}>&mdash; the restaurants</div>
        <div />
      </div>
    </div>
  );
}
