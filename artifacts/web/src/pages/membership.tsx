import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function Membership() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <section className="bg-[#2B1507] py-24 relative overflow-hidden">
        <img src={`${import.meta.env.BASE_URL}images/hero-community-bg.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#2B1507]/88 z-0" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-8">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">MEMBERSHIP</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight max-w-4xl">
            Find Your<br />
            <span className="text-[#CA922B]">Community.</span><br />
            Choose Your Plan.
          </h1>
          
          <p className="text-[#F5EBD8]/80 text-lg md:text-xl max-w-2xl font-light">
            Get full access to community safety scores, verified business listings, group connections, and more.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-6xl py-24 -mt-16 relative z-20">
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {/* Free Plan */}
          <div className="bg-white rounded-3xl p-8 border border-[#3A1F0E]/10 shadow-[0_8px_30px_rgba(43,21,7,0.05)] flex flex-col mt-4">
            <h3 className="font-serif font-bold text-2xl text-[#3A1F0E] mb-2">Community (Free)</h3>
            <div className="text-4xl font-serif font-bold text-[#3A1F0E] mb-2">$0<span className="text-lg text-[#3A1F0E]/50 font-sans font-normal">/month</span></div>
            <p className="text-[#3A1F0E]/60 text-sm mb-8 flex-1">Basic access to explore the directory and view top-level insights.</p>
            
            <ul className="space-y-4 mb-8">
              {["Explore business listings", "View community scores", "Read public reviews", "Join the waitlist"].map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#CA922B] shrink-0" />
                  <span className="text-sm text-[#3A1F0E]/80">{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white h-12 mt-auto">Get Started Free</Button>
          </div>

          {/* Premium Plan */}
          <div className="bg-[#2B1507] rounded-3xl p-8 shadow-2xl flex flex-col relative transform md:-translate-y-4 border border-[#CA922B]/30">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#CA922B] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
              Most Popular
            </div>
            
            <h3 className="font-serif font-bold text-2xl text-white mb-2">Explorer</h3>
            <div className="text-4xl font-serif font-bold text-[#CA922B] mb-2">$9.99<span className="text-lg text-[#F5EBD8]/50 font-sans font-normal">/month</span></div>
            <div className="text-sm text-[#F5EBD8]/40 mb-8 flex-1">or $79/year</div>
            
            <ul className="space-y-4 mb-8">
              {["Everything in Community", "Unlimited business listings", "Submit reviews & reports", "Access all safety scores", "Save businesses & collections", "Priority support"].map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#CA922B] shrink-0" />
                  <span className="text-sm text-[#F5EBD8]/90">{f}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-12 mt-auto shadow-[0_4px_14px_rgba(202,146,43,0.39)]">Start Free Trial</Button>
          </div>

          {/* Lifetime Plan */}
          <div className="bg-gradient-to-b from-white to-[#FAF6EF] rounded-3xl p-8 border border-[#CA922B]/30 shadow-[0_8px_30px_rgba(202,146,43,0.08)] flex flex-col mt-4">
            <h3 className="font-serif font-bold text-2xl text-[#3A1F0E] mb-2">Founding Member</h3>
            <div className="text-4xl font-serif font-bold text-[#CA922B] mb-2">$199<span className="text-lg text-[#3A1F0E]/50 font-sans font-normal"> one-time</span></div>
            <div className="text-sm text-[#CA922B] font-bold uppercase tracking-wider mb-8 flex-1">Limited spots available</div>
            
            <ul className="space-y-4 mb-8">
              {["Lifetime platform access", "Exclusive founding member badge", "Roadmap input & early features", "Direct line to the founding team", "All future premium features included"].map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#CA922B] shrink-0" />
                  <span className="text-sm text-[#3A1F0E]/80">{f}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full rounded-full bg-[#3A1F0E] hover:bg-[#1a0c04] text-white h-12 mt-auto">Become a Founding Member</Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-24 text-center">
          <div className="bg-[#FAF6EF] border border-[#CA922B]/20 p-10 rounded-3xl">
            <h3 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-4">Be part of building something that matters.</h3>
            <p className="text-lg text-[#3A1F0E]/70 font-light leading-relaxed">
              Founding Members shape the platform — your feedback, ideas, and community input directly influence every decision we make.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
