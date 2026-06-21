import { Users } from "lucide-react";

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <div className="bg-[#2B1507] text-white py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-[#CA922B] mb-6">
          <Users className="w-3.5 h-3.5" /> Community
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">Community Guidelines</h1>
        <p className="text-[#F5EBD8]/70 mt-4 text-lg">How we protect and celebrate our community</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-10 text-[#3A1F0E]">
        <section className="bg-[#CA922B]/10 border border-[#CA922B]/30 rounded-2xl p-6">
          <p className="text-[#3A1F0E]/90 leading-relaxed text-lg font-medium italic">
            "Mapping with Melanin™ was built for our community — by our community. These guidelines exist to ensure this space remains safe, authentic, and empowering for every Black traveler, entrepreneur, and culture-keeper who calls this platform home."
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Authenticity", desc: "Real reviews, real experiences, real community intelligence." },
              { title: "Safety", desc: "We protect our members and hold businesses accountable." },
              { title: "Empowerment", desc: "Every interaction should uplift Black businesses and culture." },
              { title: "Respect", desc: "Treat every member and business owner with dignity." },
            ].map((v) => (
              <div key={v.title} className="bg-white border border-[#2B1507]/10 rounded-xl p-5">
                <h3 className="font-bold text-[#2B1507] mb-1">{v.title}</h3>
                <p className="text-sm text-[#3A1F0E]/70">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">Writing Reviews</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80 mb-4">Reviews are the foundation of community trust. We hold them to a high standard:</p>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">✓</span>
              <div>
                <p className="font-semibold text-[#2B1507]">Write from genuine experience</p>
                <p className="text-sm text-[#3A1F0E]/70 mt-0.5">Only review businesses you've actually visited or used. Share specific details about your experience.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">✓</span>
              <div>
                <p className="font-semibold text-[#2B1507]">Be constructive</p>
                <p className="text-sm text-[#3A1F0E]/70 mt-0.5">Even negative feedback should be fair, specific, and helpful — not a personal attack.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">✗</span>
              <div>
                <p className="font-semibold text-[#2B1507]">No incentivized or fake reviews</p>
                <p className="text-sm text-[#3A1F0E]/70 mt-0.5">Reviews paid for, traded, or written by friends/employees are prohibited and will be removed.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">✗</span>
              <div>
                <p className="font-semibold text-[#2B1507]">No competitor attacks</p>
                <p className="text-sm text-[#3A1F0E]/70 mt-0.5">Using reviews to harm a competing business is a serious violation and grounds for account removal.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">Safety Reporting</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80 mb-4">Community safety data is one of our most powerful features. To protect its integrity:</p>
          <ul className="space-y-3 list-disc pl-6 text-[#3A1F0E]/80 leading-relaxed">
            <li>Only submit safety reports for locations you have personally experienced.</li>
            <li>Reports should be factual — describe what you observed, not rumors or hearsay.</li>
            <li>Do not submit false reports to manipulate a neighborhood's safety score.</li>
            <li>Safety scores are anonymized aggregates. Your individual report is never publicly attributed to you.</li>
            <li>Abuse of the safety reporting system will result in account suspension.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">Community Feed & Groups</h2>
          <ul className="space-y-3 list-disc pl-6 text-[#3A1F0E]/80 leading-relaxed">
            <li>Celebrate Black culture, travel, businesses, and achievements.</li>
            <li>No hate speech, slurs, or content that demeans any person or group.</li>
            <li>No spam, pyramid schemes, unsolicited promotions, or MLM content.</li>
            <li>No content depicting violence, explicit sexual material, or illegal activity.</li>
            <li>Debates and disagreements are welcome — harassment is not. Disagree with ideas, not people.</li>
            <li>Respect group-specific rules set by community moderators.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">Business Owner Standards</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80 mb-4">Business owners listed on our platform are ambassadors for the community. We expect:</p>
          <ul className="space-y-3 list-disc pl-6 text-[#3A1F0E]/80 leading-relaxed">
            <li><strong>Honest ownership representation.</strong> If a business misrepresents its Black ownership status, it will be removed and the owner banned.</li>
            <li><strong>Professional responses</strong> to all reviews, including negative ones. Aggressive or retaliatory responses to reviewers will result in listing suspension.</li>
            <li><strong>Accurate business information.</strong> Keep hours, contact info, and services current.</li>
            <li><strong>No pay-to-play reviews.</strong> Soliciting or purchasing reviews is grounds for permanent removal.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">Enforcement</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80 mb-3">Violations of these guidelines may result in:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { level: "Warning", desc: "First-time minor violations receive a community warning and content removal." },
              { level: "Suspension", desc: "Repeated or serious violations result in temporary account suspension." },
              { level: "Permanent Ban", desc: "Severe or malicious violations (fraud, hate speech, doxxing) result in permanent removal." },
            ].map((e) => (
              <div key={e.level} className="bg-white border border-[#2B1507]/10 rounded-xl p-5 text-center">
                <h3 className="font-bold text-[#2B1507] mb-2">{e.level}</h3>
                <p className="text-xs text-[#3A1F0E]/70 leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">Report a Violation</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80 mb-4">
            See something that doesn't belong here? Use the flag/report button on any review, post, or business listing, or reach out directly:
          </p>
          <div className="bg-white border border-[#2B1507]/10 rounded-2xl p-6 space-y-1 text-sm text-[#3A1F0E]/80">
            <p>Email: <a href="mailto:community@mappingwithmelanin.com" className="text-[#CA922B] underline">community@mappingwithmelanin.com</a></p>
            <p>We review all reports within 48 hours and act on confirmed violations within 72 hours.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
