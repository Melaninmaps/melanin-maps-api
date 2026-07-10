export default function Slide17SendThemBack() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 70% 30%, rgba(202,146,43,0.16), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>18</div>

      <div className="absolute left-[6vw] right-[6vw] top-[7vh] text-center">
        <h1 className="font-display leading-tight" style={{ fontSize: "4vw", fontWeight: 700, color: "#FAF6EF", textWrap: "balance" }}>
          We don&rsquo;t keep customers.
        </h1>
        <div className="font-display leading-tight" style={{ fontSize: "4vw", fontWeight: 700, color: "#CA922B" }}>
          We send them home.
        </div>
        <div className="font-body mt-[2vh]" style={{ fontSize: "1.3vw", color: "#D8B98A", fontWeight: 400 }}>
          Every search ends with a real relationship.
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-[32vh] flex flex-col items-center">
        <div className="font-body" style={{ fontSize: "1.5vw", color: "#FAF6EF", fontWeight: 600 }}>Community</div>
        <div className="font-display" style={{ fontSize: "1.6vw", color: "#CA922B" }}>&darr;</div>
        <div className="font-body" style={{ fontSize: "1.5vw", color: "#FAF6EF", fontWeight: 600 }}>Business Profile</div>
        <div className="font-display" style={{ fontSize: "1.6vw", color: "#CA922B" }}>&darr;</div>
        <div className="grid grid-cols-3 gap-x-[3vw] gap-y-[1vh] mt-[0.5vh]" style={{ fontSize: "1.15vw", color: "#D8B98A" }}>
          <div>Your Website</div>
          <div>Your Booking</div>
          <div>Your Online Store</div>
          <div>Your Social Media</div>
          <div>Your Phone</div>
          <div>Your Business</div>
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] bottom-[6vh] text-center font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#FAF6EF" }}>
        Because our success isn&rsquo;t measured by how long people stay with us.
        <br />
        It&rsquo;s measured by how many people we send to you.
      </div>
    </div>
  );
}
