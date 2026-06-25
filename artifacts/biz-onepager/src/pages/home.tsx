import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  Download, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Check, 
  Star,
  Building2,
  Quote,
  Zap
} from "lucide-react";
import React from "react";

// Fade in component for scroll reveal
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary selection:text-white">
      
      {/* Top Navigation / Actions (Hidden on Print) */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50 print:hidden">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-serif font-bold text-xl tracking-tight text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <MapPin size={18} strokeWidth={2.5} />
            </div>
            Mapping With Melanin™
          </div>
          <Button 
            onClick={handlePrint} 
            variant="outline" 
            className="gap-2 border-foreground/20 hover:bg-foreground/5 hover:text-foreground"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Save as PDF</span>
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-foreground text-background print-page-break pt-24 pb-32 px-6">
        {/* Abstract shapes / decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary" fill="currentColor">
            <circle cx="80" cy="20" r="40" />
            <circle cx="20" cy="80" r="50" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <span className="inline-block py-1 px-3 rounded-full border border-primary/40 text-primary text-sm font-medium tracking-wide mb-6 uppercase">
              For Business Owners
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight mb-6">
              Your Business <br />
              <span className="text-primary italic">Belongs Here.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-lg md:text-xl text-background/80 max-w-2xl mx-auto leading-relaxed mb-10">
              The #1 community platform dedicated to celebrating, supporting, and amplifying minority-owned businesses across America.
            </p>
          </FadeIn>
          <FadeIn delay={0.3} className="print:hidden">
            <Button size="lg" className="bg-primary text-white hover:bg-primary/90 text-lg px-8 py-6 rounded-full shadow-lg shadow-primary/20">
              Claim Your Free Listing
            </Button>
            <p className="mt-4 text-sm text-background/60">Takes 2 minutes • No credit card required</p>
          </FadeIn>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 px-6 bg-background print-break-inside-avoid">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-8">
              What is Mapping With Melanin?
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-8 rounded-full"></div>
            <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed font-medium">
              A mobile-first platform where Black travelers, locals, and community members discover minority-owned businesses, plan safe journeys, and support the community economy. 
            </p>
            <p className="text-lg text-foreground/60 mt-6 max-w-2xl mx-auto">
              Powered by AI, built by the community, for the community.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-secondary text-white border-y-8 border-primary/20 print-break-inside-avoid">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-white/20">
            <FadeIn delay={0.1} className="pt-6 md:pt-0">
              <div className="text-5xl md:text-6xl font-serif font-bold text-primary mb-2">100k+</div>
              <div className="text-lg text-white/80 font-medium">Community Members</div>
            </FadeIn>
            <FadeIn delay={0.2} className="pt-6 md:pt-0">
              <div className="text-5xl md:text-6xl font-serif font-bold text-primary mb-2">50+</div>
              <div className="text-lg text-white/80 font-medium">Cities Covered</div>
            </FadeIn>
            <FadeIn delay={0.3} className="pt-6 md:pt-0">
              <div className="text-5xl md:text-6xl font-serif font-bold text-primary mb-2 flex items-center justify-center gap-2">
                4.8 <Star className="fill-primary text-primary" size={40} />
              </div>
              <div className="text-lg text-white/80 font-medium">Average Rating</div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features (Why List) */}
      <section className="py-24 px-6 bg-accent/20 print-page-break">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Why List on MwM?</h2>
              <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
                Everything you need to reach your people, build credibility, and grow your bottom line.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Users size={28} />,
                title: "Be Found by the Right People",
                desc: "100,000+ users actively searching for minority-owned businesses, events, and experiences in their city and on their travels."
              },
              {
                icon: <ShieldCheck size={28} />,
                title: "Community Credibility",
                desc: "Real reviews, verified ownership badges, and safety intel from people who look like you and shop like you."
              },
              {
                icon: <Sparkles size={28} />,
                title: "KinfolkAI™ Recommendations",
                desc: "Our AI assistant actively recommends your business to users planning trips, exploring neighborhoods, and looking for local gems."
              },
              {
                icon: <TrendingUp size={28} />,
                title: "Business Dashboard",
                desc: "Track views, saves, peak hours, engagement trends, and post nudges to keep your community engaged at the perfect moment."
              },
              {
                icon: <Zap size={28} />,
                title: "Flash Deals & Events",
                desc: "Promote limited-time offers and upcoming events directly to your local community to drive foot traffic."
              },
              {
                icon: <Building2 size={28} />,
                title: "Zero Risk to Start",
                desc: "Free basic listing, no credit card required. Get discovered by the community from day one."
              }
            ].map((feature, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <Card className="p-8 h-full bg-card border-none shadow-lg shadow-foreground/5 hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-foreground/70 leading-relaxed">{feature.desc}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 bg-foreground text-background print-break-inside-avoid relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <FadeIn>
            <h2 className="text-4xl font-serif font-bold text-center mb-16 text-white">Heard in the Community</h2>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Finally a platform that sees us. We've connected with so many travelers passing through.",
                author: "Business Owner",
                location: "Atlanta, GA"
              },
              {
                quote: "My bookings went up 40% after I joined. The community here is incredibly supportive.",
                author: "Natural Hair Salon",
                location: "Washington, DC"
              },
              {
                quote: "The reviews here are real. These are my people. I trust the ratings more than anywhere else.",
                author: "Restaurant Owner",
                location: "Chicago, IL"
              }
            ].map((testimonial, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div className="p-8 rounded-3xl bg-background/5 border border-background/10 h-full flex flex-col relative">
                  <Quote className="text-primary/40 absolute top-6 right-6" size={40} />
                  <p className="text-lg md:text-xl font-medium leading-relaxed flex-grow mb-8 text-white/90 relative z-10">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <div className="font-bold text-primary">{testimonial.author}</div>
                    <div className="text-sm text-white/60">{testimonial.location}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Plans */}
      <section className="py-24 px-6 bg-background print-page-break">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Choose Your Plan</h2>
              <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
                Start for free, or unlock the full power of the platform to actively drive growth.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <FadeIn delay={0.1}>
              <Card className="p-10 h-full bg-card border-2 border-border flex flex-col">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Community</h3>
                  <div className="text-4xl font-serif font-bold text-foreground mb-2">Free</div>
                  <p className="text-foreground/60">Everything you need to get on the map.</p>
                </div>
                
                <ul className="space-y-4 flex-grow mb-8">
                  {[
                    "Business listing with photos and contact info",
                    "Basic analytics (views, saves)",
                    "Community reviews and ratings",
                    "Map pin + neighborhood profile"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-foreground/80">
                      <Check className="text-secondary shrink-0 mt-1" size={18} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                
                <Button variant="outline" className="w-full py-6 text-lg border-foreground/20 print:hidden">
                  Start Free
                </Button>
              </Card>
            </FadeIn>

            {/* Premium Plan */}
            <FadeIn delay={0.2}>
              <Card className="p-10 h-full bg-foreground text-background border-none relative overflow-hidden flex flex-col shadow-2xl shadow-foreground/20">
                {/* Accent line */}
                <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
                
                <div className="mb-8 relative z-10">
                  <div className="inline-block py-1 px-3 rounded-full bg-primary/20 text-primary text-xs font-bold tracking-wider uppercase mb-4">
                    Recommended
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Family Membership</h3>
                  <div className="text-4xl font-serif font-bold text-primary mb-2 flex items-end gap-2">
                    $9.99 <span className="text-lg font-sans font-normal text-background/60 pb-1">/ mo</span>
                  </div>
                  <p className="text-background/80">Active promotion and deep insights.</p>
                </div>
                
                <div className="text-sm font-medium text-white/90 mb-4 pb-4 border-b border-white/10">
                  Everything in Free, plus:
                </div>
                
                <ul className="space-y-4 flex-grow mb-8 relative z-10">
                  {[
                    <span key="1"><strong>KinfolkAI™</strong> featured recommendations</span>,
                    "Verified Black-Owned badge",
                    "Advanced analytics + peak hours insights",
                    "Post nudge alerts for perfect timing",
                    "Flash deal promotion capabilities",
                    "Event listings on platform",
                    "Priority in search results",
                    <span key="8" className="text-primary font-bold">6 months free when you join today</span>
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-background/90">
                      <Sparkles className="text-primary shrink-0 mt-1" size={18} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className="w-full py-6 text-lg bg-primary text-white hover:bg-primary/90 print:hidden relative z-10 shadow-lg shadow-primary/20 border-none">
                  Claim 6 Months Free
                </Button>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 px-6 bg-secondary text-white text-center print-break-inside-avoid border-t-8 border-primary">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-8 text-primary">
              <MapPin size={32} />
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">
              Claim Your Listing Today — It's Free to Start
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 print:hidden">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90 text-lg px-10 py-7 rounded-full shadow-xl shadow-primary/20 w-full sm:w-auto">
                Join the Directory
              </Button>
            </div>

            <div className="space-y-4 text-white/80 font-medium">
              <p className="flex items-center justify-center gap-2">
                Visit: <a href="https://mappingwithmelanin.com" className="text-primary hover:underline">mappingwithmelanin.com</a>
              </p>
              <p>
                Download the app: Search <strong className="text-white">"Mapping With Melanin"</strong> in the App Store or Google Play
              </p>
            </div>
          </FadeIn>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 bg-foreground text-background/40 text-center text-sm print:hidden">
        <p>© {new Date().getFullYear()} Mapping With Melanin™. All rights reserved.</p>
      </footer>
    </div>
  );
}