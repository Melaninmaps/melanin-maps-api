import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ForBusinessOwners() {
  const scrollToHow = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <section className="bg-[#2B1507] py-24 relative overflow-hidden">
        <img src={`${import.meta.env.BASE_URL}images/hero-businesses-bg.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#2B1507]/85 z-0" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-8">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">FOR BUSINESS OWNERS</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight max-w-4xl">
            Get Your Business<br />
            <span className="text-[#CA922B]">In Front of the Right</span><br />
            Community.
          </h1>
          
          <p className="text-[#F5EBD8]/80 text-lg md:text-xl max-w-2xl mb-10 font-light">
            List your Minority-owned business on the platform built for conscious consumers who are actively looking to support businesses like yours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <a href="mailto:hello@mappingwithmelanin.com?subject=Early Access Application — List My Business">
              <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-14 text-lg">Apply for Early Access</Button>
            </a>
            <Button variant="outline" onClick={scrollToHow} className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white px-8 h-14 text-lg bg-transparent">Learn More</Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 md:gap-16 pt-8 border-t border-white/10 w-full max-w-4xl">
            <div className="text-center">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">2,400+</div>
              <div className="text-sm text-[#F5EBD8]/70 uppercase tracking-wider font-bold">Listed Businesses</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">10K+</div>
              <div className="text-sm text-[#F5EBD8]/70 uppercase tracking-wider font-bold">Community Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">94/100</div>
              <div className="text-sm text-[#F5EBD8]/70 uppercase tracking-wider font-bold">Avg. Confidence Score</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            <div className="bg-[#FAF6EF] p-8 rounded-2xl border border-[#3A1F0E]/5">
              <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-4">Verified Badge</h3>
              <p className="text-[#3A1F0E]/70 leading-relaxed">Stand out with a community-verified badge that signals trust and authenticity to every member who visits your listing.</p>
            </div>
            <div className="bg-[#FAF6EF] p-8 rounded-2xl border border-[#3A1F0E]/5">
              <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-4">Community Reviews</h3>
              <p className="text-[#3A1F0E]/70 leading-relaxed">Get honest, first-hand reviews from members who've visited your business — and respond to build your reputation.</p>
            </div>
            <div className="bg-[#FAF6EF] p-8 rounded-2xl border border-[#3A1F0E]/5">
              <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-4">Map Visibility</h3>
              <p className="text-[#3A1F0E]/70 leading-relaxed">Appear on the interactive map so members can find you when exploring your city or planning a trip.</p>
            </div>
          </div>

          <div className="text-center mb-16" id="how-it-works">
            <h2 className="text-4xl font-serif font-bold text-[#3A1F0E] mb-6">How It Works</h2>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#CA922B]/30 before:to-transparent">
            {[
              { t: "Apply for Early Access", d: "Submit your business for review. We'll verify your ownership and community alignment." },
              { t: "Build Your Profile", d: "Add photos, hours, menu, services, and your story. Make your listing shine." },
              { t: "Get Discovered", d: "Members searching your city and category will find you first — with your Community Confidence Score front and center." },
              { t: "Grow With the Community", d: "Respond to reviews, engage with members, and track your visibility with the business analytics dashboard." }
            ].map((s, i) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#CA922B] text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  {i+1}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl border border-[#3A1F0E]/10 shadow-sm">
                  <h3 className="font-serif font-bold text-xl text-[#3A1F0E] mb-2">{s.t}</h3>
                  <p className="text-[#3A1F0E]/70">{s.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-24 text-center bg-[#2B1507] p-12 rounded-3xl text-white">
            <h2 className="text-3xl font-serif font-bold mb-8">Ready to Join the Directory?</h2>
            <div className="flex justify-center gap-4">
              <a href="mailto:hello@mappingwithmelanin.com?subject=Early Access Application — List My Business">
                <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12">Apply for Early Access</Button>
              </a>
              <Link href="/membership">
                <Button variant="outline" className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white px-8 h-12">View Membership Plans</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
