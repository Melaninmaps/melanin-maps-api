import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <div className="bg-[#2B1507] text-white py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-[#CA922B] mb-6">
          <FileText className="w-3.5 h-3.5" /> Legal
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">Terms of Service</h1>
        <p className="text-[#F5EBD8]/70 mt-4 text-lg">Last updated: June 21, 2026</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-10 text-[#3A1F0E]">
        <section>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            Welcome to Mapping with Melanin™. By accessing or using our platform at <strong>mappingwithmelanin.com</strong> or our mobile application, you agree to be bound by these Terms of Service. Please read them carefully.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">1. Acceptance of Terms</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            By creating an account or using any part of the Mapping with Melanin™ platform, you confirm that you are at least 13 years of age and that you agree to these Terms of Service and our Privacy Policy. If you are using the platform on behalf of a business, you represent that you have the authority to bind that business to these terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">2. Description of Service</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            Mapping with Melanin™ is a community discovery, travel, and business platform that helps users find Black-owned businesses, access community safety insights, and plan travel. We provide tools for business owners to list and manage their presence on our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">3. User Accounts</h2>
          <ul className="space-y-2 list-disc pl-6 text-[#3A1F0E]/80 leading-relaxed">
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You agree to provide accurate, current, and complete information during registration.</li>
            <li>You may not impersonate another person or create a false identity on our platform.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">4. Community Content & Reviews</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80 mb-3">When you submit reviews, safety reports, survey responses, or any other community content, you agree that:</p>
          <ul className="space-y-2 list-disc pl-6 text-[#3A1F0E]/80 leading-relaxed">
            <li>Your content is truthful, based on genuine experiences, and not misleading.</li>
            <li>You will not submit fake reviews, paid reviews, or competitor attacks.</li>
            <li>You grant us a non-exclusive, royalty-free license to use, display, and aggregate your content as part of our community insights.</li>
            <li>You will not post content that is hateful, harassing, discriminatory, or illegal.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">5. Business Listings</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80 mb-3">Business owners who list on our platform agree to:</p>
          <ul className="space-y-2 list-disc pl-6 text-[#3A1F0E]/80 leading-relaxed">
            <li>Provide accurate information about their business, including ownership status.</li>
            <li>Not misrepresent Minority ownership status. Listings claiming Minority ownership are subject to community verification.</li>
            <li>Respond professionally to community feedback and reviews.</li>
            <li>Comply with all applicable laws and regulations for their business type.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">6. Membership & Payments</h2>
          <ul className="space-y-2 list-disc pl-6 text-[#3A1F0E]/80 leading-relaxed">
            <li>Paid memberships are billed on a recurring basis (monthly or annually).</li>
            <li>You may cancel your membership at any time. Cancellation takes effect at the end of the current billing period.</li>
            <li>Refunds are not provided for partial billing periods. Contact <a href="mailto:hello@mappingwithmelanin.com?subject=Billing%20%26%20Refund%20Inquiry" className="text-[#CA922B] underline">hello@mappingwithmelanin.com</a> for exceptional cases.</li>
            <li>We reserve the right to change pricing with 30 days' advance notice.</li>
            <li>Payment processing is handled by Stripe. By paying, you also agree to Stripe's Terms of Service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">7. Prohibited Conduct</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80 mb-3">You agree not to:</p>
          <ul className="space-y-2 list-disc pl-6 text-[#3A1F0E]/80 leading-relaxed">
            <li>Scrape, crawl, or systematically extract data from the platform</li>
            <li>Attempt to access other users' accounts or private information</li>
            <li>Submit false safety reports to manipulate scores</li>
            <li>Use the platform for any unlawful purpose</li>
            <li>Interfere with or disrupt the platform's infrastructure</li>
            <li>Post spam, advertisements, or unsolicited commercial messages</li>
            <li>Harass, threaten, or intimidate other users or business owners</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">8. Intellectual Property</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            The Mapping with Melanin™ name, logo, brand identity, and platform design are our exclusive intellectual property. You may not use our trademarks, branding, or copyrighted content without prior written permission.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">9. Disclaimers</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            Community safety scores and business information are provided "as-is" based on user submissions. We do not guarantee the accuracy, completeness, or timeliness of this data. Always exercise your own judgment when visiting a location or choosing a business.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">10. Limitation of Liability</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            To the maximum extent permitted by law, Mapping with Melanin™ shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform. Our total liability for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">11. Governing Law</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            These Terms are governed by the laws of the United States and the state in which Mapping with Melanin™ is incorporated. Any disputes shall be resolved through binding arbitration, except where prohibited by law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">12. Changes to Terms</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            We may update these Terms from time to time. Material changes will be communicated via email or a platform notice with at least 14 days' notice before taking effect. Continued use after the effective date constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">13. Contact</h2>
          <div className="bg-white border border-[#2B1507]/10 rounded-2xl p-6 space-y-1 text-sm text-[#3A1F0E]/80">
            <p><strong>Mapping with Melanin™</strong></p>
            <p>Email: <a href="mailto:hello@mappingwithmelanin.com?subject=Legal%20Inquiry%20%E2%80%94%20Terms%20of%20Service" className="text-[#CA922B] underline">hello@mappingwithmelanin.com</a></p>
            <p>Website: <a href="https://mappingwithmelanin.com" className="text-[#CA922B] underline">mappingwithmelanin.com</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
