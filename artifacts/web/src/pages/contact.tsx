import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, MapPin, Clock } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.message || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`${BASE}api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch {
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#FAF6EF]">
      {/* Hero */}
      <section className="bg-[#2B1507] text-white py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Get In Touch</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">Contact Us</h1>
          <p className="text-xl text-[#F5EBD8]/80 max-w-xl mx-auto leading-relaxed">
            We're a community-driven platform and we'd love to hear from you — whether you have a question, feedback, or a partnership idea.
          </p>
        </div>
      </section>

      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16">

            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#3A1F0E] mb-8">How to Reach Us</h2>

              <div className="space-y-6 mb-12">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-[#CA922B]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A1F0E] mb-1">General Inquiries</h3>
                    <a href="mailto:hello@mappingwithmelanin.com" className="text-[#CA922B] hover:underline font-medium">
                      hello@mappingwithmelanin.com
                    </a>
                    <p className="text-sm text-[#3A1F0E]/60 mt-1">For general questions, feedback, and press.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-[#CA922B]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A1F0E] mb-1">Business Partnerships</h3>
                    <a href="mailto:partners@mappingwithmelanin.com" className="text-[#CA922B] hover:underline font-medium">
                      partners@mappingwithmelanin.com
                    </a>
                    <p className="text-sm text-[#3A1F0E]/60 mt-1">List your business or explore partnership opportunities.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#CA922B]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A1F0E] mb-1">Headquartered in the Community</h3>
                    <p className="text-[#3A1F0E]/70 text-sm">We're a distributed, community-led team operating across the U.S.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-[#CA922B]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A1F0E] mb-1">Response Time</h3>
                    <p className="text-[#3A1F0E]/70 text-sm">We typically respond within 1–2 business days.</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#2B1507] rounded-2xl p-8 text-white">
                <h3 className="font-serif font-bold text-xl mb-3">Own a Business?</h3>
                <p className="text-[#F5EBD8]/70 text-sm mb-6 leading-relaxed">
                  Get your Black-owned business listed on our verified directory and connect with thousands of conscious consumers who are actively looking to support you.
                </p>
                <a href="/for-business-owners">
                  <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold px-6">
                    List Your Business
                  </Button>
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-[#3A1F0E]/5">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-[#CA922B]/10 flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-8 h-8 text-[#CA922B]" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-3">Message Sent!</h3>
                  <p className="text-[#3A1F0E]/70 leading-relaxed">
                    Thank you for reaching out. We'll get back to you within 1–2 business days at <strong>{form.email}</strong>.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-8">Send Us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-[#3A1F0E] mb-1.5">Name</label>
                        <input
                          type="text"
                          placeholder="Your name"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-[#3A1F0E]/15 bg-[#FAF6EF] text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#3A1F0E] mb-1.5">Email <span className="text-[#CA922B]">*</span></label>
                        <input
                          type="email"
                          placeholder="your@email.com"
                          value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-[#3A1F0E]/15 bg-[#FAF6EF] text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#3A1F0E] mb-1.5">Subject</label>
                      <select
                        value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-[#3A1F0E]/15 bg-[#FAF6EF] text-[#3A1F0E] focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 text-sm"
                      >
                        <option value="">Select a topic</option>
                        <option value="general">General Question</option>
                        <option value="business">List My Business</option>
                        <option value="partnership">Partnership Inquiry</option>
                        <option value="press">Press / Media</option>
                        <option value="support">Technical Support</option>
                        <option value="feedback">Feedback</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#3A1F0E] mb-1.5">Message <span className="text-[#CA922B]">*</span></label>
                      <textarea
                        rows={6}
                        placeholder="Tell us how we can help..."
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#3A1F0E]/15 bg-[#FAF6EF] text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 text-sm resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-12 font-bold text-base"
                    >
                      {submitting ? "Sending..." : "Send Message"}
                    </Button>
                    <p className="text-xs text-[#3A1F0E]/40 text-center">We'll respond within 1–2 business days.</p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
