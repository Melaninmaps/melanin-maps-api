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

router.get("/privacy", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(buildHtml());
});

export default router;
