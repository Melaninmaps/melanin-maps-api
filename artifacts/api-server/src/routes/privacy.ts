import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const SECTIONS = [
  {
    title: "What We Collect",
    items: [
      { label: "Account Information", body: "When you sign up, we collect your name, email address, and a hashed password. If you sign in via Google or Apple, we receive your name and email from those providers — we never store your Google or Apple password." },
      { label: "Profile Data", body: "Information you voluntarily add to your profile: photo, bio, city, and preferences. This data is optional and can be edited or deleted at any time." },
      { label: "Content You Create", body: "Reviews, safety survey responses, community posts, and event RSVPs you submit through the Platform. Safety surveys are stored anonymously — no individual response is ever publicly attributed to you." },
      { label: "Usage Data", body: "How you interact with the app: screens visited, searches performed, businesses viewed. This data helps us improve the Platform. You can opt out of analytics in Settings → Privacy & Safety." },
    ],
  },
  {
    title: "How We Use Your Data",
    items: [
      { label: "Providing the Service", body: "Your account data is used to authenticate you, personalize your experience, and save your preferences across sessions. We cannot operate the Platform without this data." },
      { label: "Community Safety", body: "Aggregated and anonymized safety survey data is used to calculate neighborhood safety scores and business-level safety ratings. Individual submissions are never publicly displayed." },
      { label: "Communications", body: "We may send you transactional emails (password resets, receipts, account updates) and — with your consent — community newsletters and product updates. You can manage email preferences in Settings." },
      { label: "Platform Improvement", body: "Aggregated usage data helps us identify popular features, fix bugs, and build new functionality. We do not use individual behavioral data for advertising or profiling." },
    ],
  },
  {
    title: "Location Data",
    items: [
      { label: "When We Access Location", body: "Location is accessed only when you use map-based features (\"Near Me\" searches, map view) and only when the app is in the foreground. We never access your location in the background." },
      { label: "What We Store", body: "We do not store your GPS coordinates. Location is used in real time to filter results and is discarded immediately after the request is fulfilled." },
      { label: "Your Control", body: "You can use the full Platform without enabling location services. You can revoke location permission at any time in your device settings. Only map-based features will be affected." },
    ],
  },
  {
    title: "Sharing & Disclosure",
    items: [
      { label: "We Do Not Sell Your Data", body: "Mapping With Melanin™ does not sell, rent, or trade your personal information to third parties for marketing or advertising purposes, ever." },
      { label: "Service Providers", body: "We share limited data with trusted service providers who help us operate the Platform: payment processors, push notification services, and our cloud database provider. These providers are contractually prohibited from using your data for any other purpose." },
      { label: "Legal Requirements", body: "We may disclose data if required by law, court order, or to protect the safety of our users or the public. We will notify you of such requests where legally permitted." },
      { label: "Business Transfers", body: "If Mapping With Melanin™ is acquired or merges with another company, your data may be transferred as part of that transaction. We will notify you before your data is subject to a different privacy policy." },
    ],
  },
  {
    title: "Your Rights",
    items: [
      { label: "Access & Correction", body: "You may view and edit your account information at any time through your Profile and Settings screens. If you believe data about you is inaccurate, contact us and we will correct it promptly." },
      { label: "Data Download", body: "You may request a copy of all data associated with your account by going to Settings → Privacy & Safety → Download My Data. We will provide your data in a portable format within 30 days." },
      { label: "Deletion", body: "You may request deletion of your account and all associated personal data at any time via Settings → Privacy & Safety → Delete Account. Aggregated, anonymized data (safety scores, statistics) is not deleted as it cannot be attributed to you." },
      { label: "Opt-Out", body: "You may opt out of analytics tracking, marketing emails, and personalized suggestions at any time in Settings → Privacy & Safety. Core service communications (receipts, security alerts) cannot be opted out of while you have an active account." },
    ],
  },
  {
    title: "Data Retention",
    items: [
      { label: "Active Accounts", body: "We retain your data for as long as your account is active. You can delete your account at any time, which triggers deletion of your personal data within 30 days." },
      { label: "Inactive Accounts", body: "If your account has been inactive for 24 consecutive months, we will notify you by email and begin the process of archiving or deleting your account data." },
      { label: "Legal Obligations", body: "Some data may be retained longer if required by law (e.g., financial records related to transactions may be retained for up to 7 years for tax compliance)." },
    ],
  },
  {
    title: "Security",
    items: [
      { label: "How We Protect Your Data", body: "We use industry-standard encryption (TLS in transit, AES-256 at rest) to protect your data. Auth tokens are stored in your device's Secure Enclave (iOS) or Keystore (Android) — never in plain-text storage." },
      { label: "Breach Notification", body: "In the event of a data breach that affects your personal information, we will notify you within 72 hours of discovery and provide clear guidance on steps to protect yourself." },
      { label: "Your Responsibility", body: "Keep your password confidential and log out of shared devices. Contact us immediately at hello@mappingwithmelanin.com if you suspect unauthorized access to your account." },
    ],
  },
];

function buildHtml(): string {
  const sectionHtml = SECTIONS.map((s) => {
    const itemsHtml = s.items
      .map(
        (item) => `
      <div class="item">
        <div class="item-label">${item.label}</div>
        <div class="item-body">${item.body}</div>
      </div>`,
      )
      .join("");
    return `
    <section class="section">
      <h2 class="section-title">${s.title}</h2>
      ${itemsHtml}
    </section>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy — Mapping With Melanin™</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0a0a0a;
      color: #f5f0eb;
      line-height: 1.6;
      padding: 0 16px 64px;
    }
    header {
      max-width: 720px;
      margin: 0 auto;
      padding: 48px 0 32px;
      border-bottom: 1px solid #2a2a2a;
    }
    header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #CA922B;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    header p {
      color: #888;
      font-size: 0.875rem;
    }
    main {
      max-width: 720px;
      margin: 0 auto;
    }
    .section {
      margin-top: 40px;
      padding-bottom: 32px;
      border-bottom: 1px solid #1e1e1e;
    }
    .section:last-child { border-bottom: none; }
    .section-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #CA922B;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-size: 0.8rem;
    }
    .item { margin-bottom: 20px; }
    .item-label {
      font-weight: 600;
      color: #f5f0eb;
      margin-bottom: 4px;
      font-size: 0.9375rem;
    }
    .item-body {
      color: #aaa;
      font-size: 0.875rem;
    }
    footer {
      max-width: 720px;
      margin: 48px auto 0;
      color: #555;
      font-size: 0.8125rem;
    }
    a { color: #CA922B; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <header>
    <h1>Privacy Policy</h1>
    <p>Mapping With Melanin™ &mdash; Last updated July 2025</p>
  </header>
  <main>
    ${sectionHtml}
  </main>
  <footer>
    <p>Questions? Contact us at <a href="mailto:hello@mappingwithmelanin.com">hello@mappingwithmelanin.com</a></p>
  </footer>
</body>
</html>`;
}

function pageShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Mapping With Melanin™</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0a0a0a; color: #f5f0eb; line-height: 1.6; padding: 0 16px 64px; }
    header { max-width: 720px; margin: 0 auto; padding: 48px 0 32px; border-bottom: 1px solid #2a2a2a; }
    header h1 { font-size: 2rem; font-weight: 700; color: #CA922B; letter-spacing: -0.5px; margin-bottom: 8px; }
    header p { color: #888; font-size: 0.875rem; }
    main { max-width: 720px; margin: 0 auto; }
    section { margin-top: 40px; padding-bottom: 32px; border-bottom: 1px solid #1e1e1e; }
    section:last-child { border-bottom: none; }
    h2 { font-size: 0.8rem; font-weight: 700; color: #CA922B; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.04em; }
    p, li { color: #aaa; font-size: 0.875rem; margin-bottom: 8px; }
    ul { padding-left: 1.25rem; }
    li { margin-bottom: 6px; }
    strong { color: #f5f0eb; }
    footer { max-width: 720px; margin: 48px auto 0; color: #555; font-size: 0.8125rem; }
    a { color: #CA922B; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .back { display: inline-block; margin: 32px 0 0; font-size: 0.8rem; color: #CA922B; }
  </style>
</head>
<body>
  <header><h1>${title}</h1><p>Mapping With Melanin™</p></header>
  <main>${body}</main>
  <footer><p>Questions? <a href="mailto:hello@mappingwithmelanin.com">hello@mappingwithmelanin.com</a></p></footer>
</body>
</html>`;
}

router.get("/privacy", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(buildHtml());
});

router.get("/privacy-policy", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(buildHtml());
});

router.get("/terms", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  const body = `
    <section><p>Welcome to Mapping With Melanin™. By accessing or using our platform at <strong>mappingwithmelanin.com</strong> or our mobile application, you agree to be bound by these Terms of Service.</p></section>
    <section><h2>1. Acceptance of Terms</h2><p>By creating an account or using any part of the Mapping With Melanin™ platform, you confirm that you are at least 13 years of age and agree to these Terms of Service and our <a href="/privacy">Privacy Policy</a>. If you use the platform on behalf of a business, you represent that you have authority to bind that business to these terms.</p></section>
    <section><h2>2. Description of Service</h2><p>Mapping With Melanin™ is a community discovery, travel, and business platform. We provide tools for users to find minority-owned businesses, access community safety insights, and plan culturally informed travel.</p></section>
    <section><h2>3. User Accounts</h2><ul><li>You are responsible for maintaining the security of your account credentials.</li><li>You agree to provide accurate, current, and complete information during registration.</li><li>You may not impersonate another person or create a false identity.</li><li>You are responsible for all activity that occurs under your account.</li><li>We reserve the right to suspend or terminate accounts that violate these terms.</li></ul></section>
    <section><h2>4. Community Content &amp; Reviews</h2><p>When you submit reviews, safety reports, or community content, you agree that your content is truthful and based on genuine experiences. You grant us a non-exclusive, royalty-free license to use and aggregate your content as part of our community insights. You will not post hateful, harassing, discriminatory, or illegal content.</p></section>
    <section><h2>5. Business Listings</h2><p>Business owners who list on our platform agree to provide accurate information and comply with all applicable laws. Listings claiming minority ownership are subject to community verification.</p></section>
    <section><h2>6. Membership &amp; Payments</h2><ul><li>Paid memberships are billed on a recurring basis (monthly or annually).</li><li>You may cancel at any time. Cancellation takes effect at the end of the current billing period.</li><li>Refunds are not provided for partial billing periods. Contact <a href="mailto:hello@mappingwithmelanin.com">hello@mappingwithmelanin.com</a> for exceptional cases.</li><li>We reserve the right to change pricing with 30 days' advance notice.</li><li>Payment processing is handled by Stripe.</li></ul></section>
    <section><h2>7. Prohibited Conduct</h2><ul><li>Do not use the platform for any unlawful purpose.</li><li>Do not attempt to gain unauthorized access to any part of the platform.</li><li>Do not interfere with or disrupt the platform or its servers.</li><li>Do not submit false, misleading, or fraudulent content.</li><li>Do not scrape, crawl, or data-mine the platform without written permission.</li></ul></section>
    <section><h2>8. Intellectual Property</h2><p>All content, features, and functionality of Mapping With Melanin™ — including the name, logo, and platform design — are owned by Mapping With Melanin™ and protected by intellectual property laws. You may not reproduce or distribute any part of the platform without written permission.</p></section>
    <section><h2>9. Disclaimer &amp; Limitation of Liability</h2><p>The platform is provided "as is" without warranties of any kind. Mapping With Melanin™ is not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Community safety data is provided for informational purposes and does not constitute professional advice.</p></section>
    <section><h2>10. Changes to Terms</h2><p>We may update these Terms of Service from time to time. We will notify you of material changes via email or in-app notification. Continued use of the platform after changes take effect constitutes your acceptance of the new terms.</p></section>
    <section><h2>11. Contact</h2><p>Questions about these terms? Contact us at <a href="mailto:hello@mappingwithmelanin.com">hello@mappingwithmelanin.com</a> or visit <a href="https://www.mappingwithmelanin.com/contact">mappingwithmelanin.com/contact</a>.</p><p style="margin-top:8px;color:#666;font-size:0.8rem;">Last updated: June 21, 2026</p></section>
  `;
  res.send(pageShell("Terms of Service", body));
});

router.get("/delete-account", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  const body = `
    <section>
      <p>You have the right to delete your Mapping With Melanin™ account and all associated personal data at any time. We honor all deletion requests within <strong>30 days</strong>.</p>
    </section>
    <section>
      <h2>Option 1 — Delete from within the app</h2>
      <ul>
        <li>Open the Mapping With Melanin™ app</li>
        <li>Go to <strong>Profile</strong></li>
        <li>Tap <strong>Settings</strong></li>
        <li>Tap <strong>Privacy &amp; Safety</strong></li>
        <li>Tap <strong>Delete Account</strong></li>
        <li>Confirm deletion</li>
      </ul>
      <p style="margin-top:12px;">Your account and all personal data will be permanently deleted within 30 days. This action cannot be undone.</p>
    </section>
    <section>
      <h2>Option 2 — Request deletion by email</h2>
      <p>Send a deletion request from the email address associated with your account to <a href="mailto:hello@mappingwithmelanin.com?subject=Account%20Deletion%20Request">hello@mappingwithmelanin.com</a> with the subject line <strong>Account Deletion Request</strong>.</p>
      <p style="margin-top:8px;">We will confirm receipt within 2 business days and complete deletion within 30 days.</p>
    </section>
    <section>
      <h2>What gets deleted</h2>
      <ul>
        <li>Your account profile, name, and email address</li>
        <li>Your saved places and favorites</li>
        <li>Your community posts and reviews</li>
        <li>Your KinfolkAI conversation history</li>
        <li>Your membership and billing information (transaction records may be retained for legal compliance)</li>
      </ul>
      <p style="margin-top:8px;">Aggregated, anonymized community data (such as neighborhood safety scores) cannot be attributed to you and is not deleted.</p>
    </section>
    <section>
      <h2>Questions</h2>
      <p>Contact us at <a href="mailto:hello@mappingwithmelanin.com">hello@mappingwithmelanin.com</a></p>
    </section>
  `;
  res.send(pageShell("Delete Your Account", body));
});

router.get("/support", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  const body = `
    <section>
      <p>We are here to help. Reach us through any of the channels below.</p>
    </section>
    <section>
      <h2>Email Support</h2>
      <p><a href="mailto:hello@mappingwithmelanin.com">hello@mappingwithmelanin.com</a></p>
      <p style="margin-top:6px;">We respond to all support requests within 2 business days.</p>
    </section>
    <section>
      <h2>Common Topics</h2>
      <ul>
        <li><strong>Account issues</strong> — login, password reset, account recovery</li>
        <li><strong>Membership &amp; billing</strong> — subscription questions, cancellations, refund requests</li>
        <li><strong>Business listings</strong> — adding, updating, or claiming a business</li>
        <li><strong>Safety data</strong> — questions about neighborhood safety surveys</li>
        <li><strong>Account deletion</strong> — see our <a href="/delete-account">account deletion page</a></li>
        <li><strong>Privacy</strong> — data requests, opt-outs, see our <a href="/privacy">Privacy Policy</a></li>
      </ul>
    </section>
    <section>
      <h2>Report a Problem</h2>
      <p>To report a technical issue or content concern, email <a href="mailto:hello@mappingwithmelanin.com?subject=Issue%20Report">hello@mappingwithmelanin.com</a> with a description of the problem and your device type (iOS / Android).</p>
    </section>
  `;
  res.send(pageShell("Support", body));
});

export default router;
