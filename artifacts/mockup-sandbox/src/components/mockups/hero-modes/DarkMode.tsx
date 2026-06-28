export function DarkMode() {
  return (
    <div className="w-[1440px] min-h-[900px] bg-[#2B1507] relative overflow-hidden flex items-center pt-20 pb-32">
      <div className="absolute inset-0 z-0">
        <img
          src="/__mockup/images/hero-cobblestone.png"
          alt="Cobblestone street"
          className="w-full h-full object-cover object-bottom opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2B1507]/60 via-[#2B1507]/25 to-[#2B1507]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#CA922B]/40 bg-[#CA922B]/10 text-[#CA922B] text-xs font-bold tracking-widest uppercase">
                ⚡ Safety-First Community Intelligence
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/5 text-white text-xs font-bold">
                👥 3+ community members waiting
              </div>
            </div>

            <h1 className="text-7xl font-serif font-bold text-white leading-[1.05] mb-8" style={{fontFamily:"'Georgia', serif"}}>
              Map Your Life.<br />
              <span className="text-[#CA922B]">Connect Deeper.</span><br />
              Live With Purpose.
            </h1>

            <p className="text-xl text-[#F5EBD8]/80 mb-4 max-w-xl leading-relaxed">
              Mapping with Melanin™ connects people to trusted businesses, meaningful relationships, thriving communities, and new opportunities through the power of shared experiences.
            </p>
            <p className="text-base text-[#F5EBD8]/60 mb-10 max-w-xl leading-relaxed">
              Most platforms tell you where to go. We help you understand what's really there — and direct your dollars to businesses that reflect your culture.
            </p>

            <div className="flex flex-wrap gap-3">
              {["Find Businesses", "Safety Intelligence", "KinfolkAI™", "Community"].map((label) => (
                <div key={label} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 bg-white/5 text-sm font-medium text-[#F5EBD8] cursor-pointer">
                  {label} →
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-10 shadow-2xl">
            <h2 className="text-2xl font-serif font-bold text-white mb-1">Join the Waitlist</h2>
            <p className="text-[#F5EBD8]/60 text-sm mb-6">Free to join. No spam, ever.</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none" placeholder="First name" />
                <input className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none" placeholder="Last name" />
              </div>
              <input className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none" placeholder="Enter your email address" />
              <div className="grid grid-cols-2 gap-3">
                <input className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none" placeholder="Your city" />
                <input className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none" placeholder="STATE" />
              </div>
              <button className="w-full bg-[#CA922B] hover:bg-[#B8801F] text-white font-bold py-4 rounded-xl text-base transition-colors mt-2">
                Join the Waitlist
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-6 z-10 bg-[#CA922B] text-white text-xs font-bold px-3 py-1.5 rounded-full">
        🌙 DARK MODE
      </div>
    </div>
  );
}
