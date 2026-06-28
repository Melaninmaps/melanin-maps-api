export function LightMode() {
  return (
    <div className="w-[1440px] min-h-[900px] bg-[#F5E6C8] relative overflow-hidden flex items-center pt-20 pb-32">
      <div className="absolute inset-0 z-0">
        <img
          src="/__mockup/images/hero-cobblestone.png"
          alt="Cobblestone street"
          className="w-full h-full object-cover object-bottom opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5E6C8]/80 via-[#F5E6C8]/60 to-[#F5E6C8]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#8B5E1A]/40 bg-[#CA922B]/15 text-[#6B4410] text-xs font-bold tracking-widest uppercase">
                ⚡ Safety-First Community Intelligence
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2B1507]/20 bg-[#2B1507]/5 text-[#2B1507] text-xs font-bold">
                👥 3+ community members waiting
              </div>
            </div>

            <h1 className="text-7xl font-serif font-bold text-[#1A0C02] leading-[1.05] mb-8" style={{fontFamily:"'Georgia', serif"}}>
              Map Your Life.<br />
              <span className="text-[#CA922B]">Connect Deeper.</span><br />
              Live With Purpose.
            </h1>

            <p className="text-xl text-[#3D2008]/80 mb-4 max-w-xl leading-relaxed">
              Mapping with Melanin™ connects people to trusted businesses, meaningful relationships, thriving communities, and new opportunities through the power of shared experiences.
            </p>
            <p className="text-base text-[#3D2008]/60 mb-10 max-w-xl leading-relaxed">
              Most platforms tell you where to go. We help you understand what's really there — and direct your dollars to businesses that reflect your culture.
            </p>

            <div className="flex flex-wrap gap-3">
              {["Find Businesses", "Safety Intelligence", "KinfolkAI™", "Community"].map((label) => (
                <div key={label} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#2B1507]/20 bg-[#2B1507]/5 hover:bg-[#2B1507]/10 text-sm font-medium text-[#2B1507] cursor-pointer">
                  {label} →
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-md border border-[#CA922B]/30 rounded-3xl p-10 shadow-2xl shadow-[#CA922B]/10">
            <h2 className="text-2xl font-serif font-bold text-[#1A0C02] mb-1">Join the Waitlist</h2>
            <p className="text-[#3D2008]/60 text-sm mb-6">Free to join. No spam, ever.</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="bg-white border border-[#CA922B]/30 rounded-xl px-4 py-3 text-[#1A0C02] text-sm placeholder:text-[#3D2008]/30 outline-none focus:border-[#CA922B]" placeholder="First name" />
                <input className="bg-white border border-[#CA922B]/30 rounded-xl px-4 py-3 text-[#1A0C02] text-sm placeholder:text-[#3D2008]/30 outline-none focus:border-[#CA922B]" placeholder="Last name" />
              </div>
              <input className="w-full bg-white border border-[#CA922B]/30 rounded-xl px-4 py-3 text-[#1A0C02] text-sm placeholder:text-[#3D2008]/30 outline-none focus:border-[#CA922B]" placeholder="Enter your email address" />
              <div className="grid grid-cols-2 gap-3">
                <input className="bg-white border border-[#CA922B]/30 rounded-xl px-4 py-3 text-[#1A0C02] text-sm placeholder:text-[#3D2008]/30 outline-none focus:border-[#CA922B]" placeholder="Your city" />
                <input className="bg-white border border-[#CA922B]/30 rounded-xl px-4 py-3 text-[#1A0C02] text-sm placeholder:text-[#3D2008]/30 outline-none focus:border-[#CA922B]" placeholder="STATE" />
              </div>
              <button className="w-full bg-[#CA922B] hover:bg-[#B8801F] text-white font-bold py-4 rounded-xl text-base transition-colors mt-2">
                Join the Waitlist
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-6 z-10 bg-[#1A0C02] text-[#CA922B] text-xs font-bold px-3 py-1.5 rounded-full">
        ☀️ LIGHT MODE
      </div>
    </div>
  );
}
