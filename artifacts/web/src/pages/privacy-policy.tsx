import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <div className="bg-[#2B1507] text-white py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-[#CA922B] mb-6">
          <Shield className="w-3.5 h-3.5" /> Legal
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">Privacy Policy</h1>
        <p className="text-[#F5EBD8]/70 mt-4 text-lg">Last updated: June 21, 2026</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-10 text-[#3A1F0E]">
        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">1. Introduction</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            Mapping with Melanin™ ("we", "us", or "our") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, including our website at <strong>mappingwithmelanin.com</strong> and our mobile application.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">2. Information We Collect</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80 mb-3">We may collect the following types of information:</p>
          <ul className="space-y-2 list-disc pl-6 text-[#3A1F0E]/80 leading-relaxed">
            <li><strong>Account Information:</strong> Name, email address, profile photo, and city when you register.</li>
            <li><strong>Usage Data:</strong> Pages visited, search queries, businesses saved, reviews written, and events RSVP'd.</li>
            <li><strong>Location Data:</strong> City and general location if you choose to share it, to provide relevant local results.</li>
            <li><strong>Survey Responses:</strong> Community safety reports and neighborhood feedback you voluntarily submit.</li>
            <li><strong>Device Information:</strong> Browser type, IP address, operating system, and device identifiers for analytics and security.</li>
            <li><strong>Payment Information:</strong> Processed securely through Stripe. We do not store full card numbers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">3. How We Use Your Information</h2>
          <ul className="space-y-2 list-disc pl-6 text-[#3A1F0E]/80 leading-relaxed">
            <li>To provide, personalize, and improve our services</li>
            <li>To connect you with relevant Minority-owned businesses and community events</li>
            <li>To compute and display community safety insights</li>
            <li>To process membership payments and manage subscriptions</li>
            <li>To send platform updates, safety alerts, and community notifications (with your consent)</li>
            <li>To detect fraud, enforce our terms, and maintain platform security</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">4. Sharing Your Information</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80 mb-3">We do not sell your personal data. We may share information with:</p>
          <ul className="space-y-2 list-disc pl-6 text-[#3A1F0E]/80 leading-relaxed">
            <li><strong>Service Providers:</strong> Trusted vendors who assist with hosting, analytics, payments (Stripe), and communications.</li>
            <li><strong>Business Owners:</strong> Aggregated, non-identifying insight data (e.g., how many profile views a listing received).</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect the rights and safety of our users.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">5. Community Safety Data</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            Safety reports and survey responses are used to generate community-level safety scores. Individual responses are anonymized before being incorporated into scores. We never share your personal identity alongside a safety report.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">6. Data Retention</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            We retain your account data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where retention is required by law or for dispute resolution.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">7. Your Rights</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80 mb-3">Depending on your location, you may have the right to:</p>
          <ul className="space-y-2 list-disc pl-6 text-[#3A1F0E]/80 leading-relaxed">
            <li>Access and receive a copy of your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data ("Right to be Forgotten")</li>
            <li>Opt out of marketing communications at any time</li>
            <li>Withdraw consent for optional data collection</li>
          </ul>
          <p className="mt-3 text-[#3A1F0E]/80">To exercise any of these rights, contact us at <a href="mailto:privacy@mappingwithmelanin.com" className="text-[#CA922B] underline">privacy@mappingwithmelanin.com</a>.</p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">8. Cookies</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            We use cookies and similar tracking technologies to maintain session state, remember your preferences, and analyze platform usage. You can control cookie settings through your browser. Disabling cookies may affect certain features.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">9. Security</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            We implement industry-standard security measures including HTTPS encryption, secure token authentication, and regular security audits. However, no method of transmission over the internet is 100% secure and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">10. Children's Privacy</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            Our platform is not directed to children under 13. We do not knowingly collect personal information from children. If we become aware that a child under 13 has provided us with personal information, we will delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">11. Changes to This Policy</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on our platform. Continued use of the platform after changes constitutes acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-4">12. Contact Us</h2>
          <p className="leading-relaxed text-[#3A1F0E]/80">
            If you have questions about this Privacy Policy or how we handle your data:
          </p>
          <div className="mt-4 bg-white border border-[#2B1507]/10 rounded-2xl p-6 space-y-1 text-sm text-[#3A1F0E]/80">
            <p><strong>Mapping with Melanin™</strong></p>
            <p>Email: <a href="mailto:privacy@mappingwithmelanin.com" className="text-[#CA922B] underline">privacy@mappingwithmelanin.com</a></p>
            <p>Website: <a href="https://mappingwithmelanin.com" className="text-[#CA922B] underline">mappingwithmelanin.com</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
