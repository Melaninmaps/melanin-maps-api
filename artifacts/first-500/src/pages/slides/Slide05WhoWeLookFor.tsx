export default function Slide05WhoWeLookFor() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex flex-col justify-center" style={{ background: "#1C0E06" }}>
      <div className="absolute top-[7vh] left-[8vw]">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>Who We're Looking For</span>
      </div>

      <div className="flex flex-col gap-[4vh] px-[8vw]">
        <h1 className="text-[4.5vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
          We're selecting <span style={{ color: "#CA922B" }}>500 founding businesses</span><br />across six categories.
        </h1>

        <div className="grid grid-cols-3 gap-[2vw] mt-[1vh]">
          <div className="flex items-center gap-[1.5vw] rounded-xl px-[2vw] py-[2vh]" style={{ background: "rgba(196,98,45,0.12)", border: "1px solid rgba(196,98,45,0.3)" }}>
            <span className="text-[2.8vw]">🍽️</span>
            <div>
              <div className="font-body text-[1.4vw] font-semibold" style={{ color: "#FAF6EF" }}>Food & Beverage</div>
              <div className="font-body text-[1vw]" style={{ color: "rgba(250,246,239,0.5)" }}>Restaurants, cafes, catering</div>
            </div>
          </div>
          <div className="flex items-center gap-[1.5vw] rounded-xl px-[2vw] py-[2vh]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <span className="text-[2.8vw]">💆🏾</span>
            <div>
              <div className="font-body text-[1.4vw] font-semibold" style={{ color: "#FAF6EF" }}>Beauty & Wellness</div>
              <div className="font-body text-[1vw]" style={{ color: "rgba(250,246,239,0.5)" }}>Salons, spas, fitness</div>
            </div>
          </div>
          <div className="flex items-center gap-[1.5vw] rounded-xl px-[2vw] py-[2vh]" style={{ background: "rgba(196,98,45,0.12)", border: "1px solid rgba(196,98,45,0.3)" }}>
            <span className="text-[2.8vw]">🛍️</span>
            <div>
              <div className="font-body text-[1.4vw] font-semibold" style={{ color: "#FAF6EF" }}>Retail & Boutique</div>
              <div className="font-body text-[1vw]" style={{ color: "rgba(250,246,239,0.5)" }}>Fashion, gifts, home goods</div>
            </div>
          </div>
          <div className="flex items-center gap-[1.5vw] rounded-xl px-[2vw] py-[2vh]" style={{ background: "rgba(45,122,79,0.12)", border: "1px solid rgba(45,122,79,0.3)" }}>
            <span className="text-[2.8vw]">⚕️</span>
            <div>
              <div className="font-body text-[1.4vw] font-semibold" style={{ color: "#FAF6EF" }}>Health & Fitness</div>
              <div className="font-body text-[1vw]" style={{ color: "rgba(250,246,239,0.5)" }}>Clinics, gyms, wellness</div>
            </div>
          </div>
          <div className="flex items-center gap-[1.5vw] rounded-xl px-[2vw] py-[2vh]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <span className="text-[2.8vw]">💼</span>
            <div>
              <div className="font-body text-[1.4vw] font-semibold" style={{ color: "#FAF6EF" }}>Professional Services</div>
              <div className="font-body text-[1vw]" style={{ color: "rgba(250,246,239,0.5)" }}>Law, finance, consulting</div>
            </div>
          </div>
          <div className="flex items-center gap-[1.5vw] rounded-xl px-[2vw] py-[2vh]" style={{ background: "rgba(196,98,45,0.12)", border: "1px solid rgba(196,98,45,0.3)" }}>
            <span className="text-[2.8vw]">🎭</span>
            <div>
              <div className="font-body text-[1.4vw] font-semibold" style={{ color: "#FAF6EF" }}>Arts & Culture</div>
              <div className="font-body text-[1vw]" style={{ color: "rgba(250,246,239,0.5)" }}>Events, galleries, entertainment</div>
            </div>
          </div>
        </div>

        <p className="font-body text-[1.5vw] italic" style={{ color: "rgba(250,246,239,0.5)" }}>
          Quality over quantity. Community-first mindset. That's you.
        </p>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>04 / 18</span>
      </div>
    </div>
  );
}
