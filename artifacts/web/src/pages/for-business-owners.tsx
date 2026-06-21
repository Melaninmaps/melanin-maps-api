import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

const CATEGORIES = [
  "Restaurant & Food",
  "Retail & Shopping",
  "Health & Wellness",
  "Beauty & Personal Care",
  "Professional Services",
  "Technology",
  "Real Estate",
  "Events & Entertainment",
  "Education & Coaching",
  "Hospitality & Travel",
  "Arts & Culture",
  "Other",
];

export default function ForBusinessOwners() {
  const scrollToHow = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToForm = () => {
    document.getElementById("submit-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const [form, setForm] = useState({
    name: "",
    businessName: "",
    category: "",
    city: "",
    website: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.businessName.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.message.trim().length < 20) {
      setError("Please tell us a bit more about your business (at least 20 characters).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "business-submission",
          name: form.name.trim(),
          email: form.email.trim(),
          subject: `Business Submission: ${form.businessName.trim()}${form.city ? ` — ${form.city}` : ""}`,
          message: [
            `Business Name: ${form.businessName}`,
            form.category ? `Category: ${form.category}` : "",
            form.city ? `City: ${form.city}` : "",
            form.website ? `Website: ${form.website}` : "",
            `Message: ${form.message}`,
          ].filter(Boolean).join("\n"),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
            <Button onClick={scrollToForm} className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-14 text-lg">Apply for Early Access</Button>
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
        </div>
      </section>

      {/* Submission Form */}
      <section id="submit-form" className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">APPLY NOW</span>
            </div>
            <h2 className="text-4xl font-serif font-bold text-[#3A1F0E] mb-4">Submit Your Business</h2>
            <p className="text-[#3A1F0E]/70 text-lg">Tell us about your business and we'll be in touch with next steps. Early access spots are limited.</p>
          </div>

          {submitted ? (
            <div className="bg-white border border-[#CA922B]/30 rounded-3xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#CA922B]/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-[#CA922B]" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#2B1507] mb-3">Application Received!</h3>
              <p className="text-[#3A1F0E]/70 leading-relaxed mb-6">
                Thank you for applying for early access. Our team will review your submission and reach out within 2–3 business days to walk you through next steps.
              </p>
              <p className="text-sm text-[#3A1F0E]/50">Questions? Email us at <a href="mailto:hello@mappingwithmelanin.com" className="text-[#CA922B] underline">hello@mappingwithmelanin.com</a></p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-[#3A1F0E]/5 space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[#3A1F0E] mb-2">Your Name <span className="text-[#CA922B]">*</span></label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Jane Smith"
                    className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#3A1F0E]/40 focus:outline-none focus:border-[#CA922B]/60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3A1F0E] mb-2">Business Name <span className="text-[#CA922B]">*</span></label>
                  <input
                    name="businessName"
                    value={form.businessName}
                    onChange={handleChange}
                    required
                    placeholder="The Gathering Table"
                    className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#3A1F0E]/40 focus:outline-none focus:border-[#CA922B]/60"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[#3A1F0E] mb-2">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] focus:outline-none focus:border-[#CA922B]/60 bg-white"
                  >
                    <option value="">Select a category…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3A1F0E] mb-2">City</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Atlanta, GA"
                    className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#3A1F0E]/40 focus:outline-none focus:border-[#CA922B]/60"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[#3A1F0E] mb-2">Email Address <span className="text-[#CA922B]">*</span></label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="jane@yourbusiness.com"
                    className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#3A1F0E]/40 focus:outline-none focus:border-[#CA922B]/60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3A1F0E] mb-2">Website</label>
                  <input
                    name="website"
                    type="url"
                    value={form.website}
                    onChange={handleChange}
                    placeholder="https://yourbusiness.com"
                    className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#3A1F0E]/40 focus:outline-none focus:border-[#CA922B]/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#3A1F0E] mb-2">Tell Us About Your Business <span className="text-[#CA922B]">*</span></label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Share a bit about your business, what you offer, and why you'd like to be listed on Mapping with Melanin™…"
                  className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#3A1F0E]/40 focus:outline-none focus:border-[#CA922B]/60 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
              )}

              <Button type="submit" disabled={submitting} className="w-full h-14 rounded-xl bg-[#CA922B] hover:bg-[#B38024] text-white font-bold text-base">
                {submitting ? "Submitting…" : "Submit My Business"}
              </Button>

              <p className="text-center text-xs text-[#3A1F0E]/50">
                By submitting, you agree to our <Link href="/terms" className="text-[#CA922B] underline">Terms of Service</Link> and <Link href="/privacy-policy" className="text-[#CA922B] underline">Privacy Policy</Link>.
              </p>
            </form>
          )}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-[#2B1507] p-12 rounded-3xl text-white text-center">
            <h2 className="text-3xl font-serif font-bold mb-4">Have a Quick Question?</h2>
            <p className="text-[#F5EBD8]/70 mb-8 max-w-lg mx-auto">Our team is happy to answer questions about early access, listing requirements, or membership options.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a href="mailto:hello@mappingwithmelanin.com?subject=Business Listing Question">
                <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12">Email Us</Button>
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
