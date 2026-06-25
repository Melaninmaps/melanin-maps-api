import jwt from "jsonwebtoken";

const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY ?? "";
const USER_ID = process.env.DOCUSIGN_USER_ID ?? "";
const ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID ?? "";
const BASE_URL = process.env.DOCUSIGN_BASE_URL ?? "https://demo.docusign.net/restapi";
const AUTH_HOST = (process.env.DOCUSIGN_AUTH_URL ?? "https://account-d.docusign.com").replace("https://", "");
const AUTH_URL = `https://${AUTH_HOST}`;

// Handle escaped newlines from Replit secrets storage
const RSA_PRIVATE_KEY = (process.env.DOCUSIGN_RSA_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getDocuSignAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { iss: INTEGRATION_KEY, sub: USER_ID, aud: AUTH_HOST, iat: now, exp: now + 3600, scope: "signature impersonation" },
    RSA_PRIVATE_KEY,
    { algorithm: "RS256" },
  );

  const res = await fetch(`${AUTH_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DocuSign JWT auth failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

async function dsApi(method: string, path: string, body?: object): Promise<any> {
  const token = await getDocuSignAccessToken();
  const res = await fetch(`${BASE_URL}/v2.1/accounts/${ACCOUNT_ID}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DocuSign API ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

function b64(html: string): string {
  return Buffer.from(html, "utf-8").toString("base64");
}

function signerTabs() {
  return {
    signHereTabs: [{ anchorString: "\\Sig\\", anchorXOffset: "0", anchorYOffset: "0", anchorUnits: "pixels" }],
    fullNameTabs: [{ anchorString: "\\FullName\\", anchorXOffset: "0", anchorYOffset: "0", anchorUnits: "pixels" }],
    dateSignedTabs: [{ anchorString: "\\DateSigned\\", anchorXOffset: "0", anchorYOffset: "0", anchorUnits: "pixels" }],
  };
}

async function embeddedUrl(envelopeId: string, email: string, name: string, clientUserId: string, returnUrl: string): Promise<string> {
  const data = await dsApi("POST", `/envelopes/${envelopeId}/views/recipient`, {
    returnUrl, authenticationMethod: "none", email, userName: name, clientUserId,
  });
  return data.url as string;
}

export async function getEmbeddedSigningUrl(
  envelopeId: string, email: string, name: string, clientUserId: string, returnUrl: string,
): Promise<string> {
  return embeddedUrl(envelopeId, email, name, clientUserId, returnUrl);
}

// ── Document HTML builders ──────────────────────────────────────────────────

function sellerAgreementHtml(businessName: string, ownerName: string): string {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;margin:48px;color:#1a1a1a;line-height:1.75;max-width:720px">
<h2 style="text-align:center;letter-spacing:1px">MAPPING WITH MELANIN™</h2>
<h3 style="text-align:center;font-weight:normal;border-bottom:1px solid #ccc;padding-bottom:16px">Marketplace Seller Agreement</h3>
<p><strong>Business:</strong> ${businessName} &nbsp;|&nbsp; <strong>Authorized By:</strong> ${ownerName} &nbsp;|&nbsp; <strong>Date:</strong> ${date}</p>

<h4>1. Platform</h4>
<p>Mapping With Melanin™ ("MWM") is a community discovery and commerce platform. By signing, you ("Seller") agree to list and sell through the MWM marketplace under these terms.</p>

<h4>2. Eligibility</h4>
<p>Sellers must be verified Black-owned businesses. Misrepresentation of ownership is grounds for immediate removal and forfeiture of pending payouts.</p>

<h4>3. Marketplace Fees</h4>
<p>Platform fees are deducted automatically per transaction by seller tier:<br>
&bull; Community (Free) — 10% &bull; Growth — 8% &bull; Premium — 6% &bull; Enterprise — 4%<br>
Founding Business members retain their locked introductory rate for their 3-year guarantee period.</p>

<h4>4. Payouts</h4>
<p>Processed through Stripe Connect to your verified bank account. MWM is not liable for delays caused by banking institutions.</p>

<h4>5. Prohibited Items</h4>
<p>No counterfeit goods, illegal products, or items that violate intellectual property rights. MWM may remove any listing at its discretion.</p>

<h4>6. Content Standards</h4>
<p>Listings must include accurate descriptions, pricing, and availability. Sellers are responsible for fulfilling orders and resolving disputes promptly.</p>

<h4>7. Termination</h4>
<p>Either party may terminate with 30 days written notice. MWM may terminate immediately for material breach, fraud, or community harm.</p>

<h4>8. Governing Law</h4>
<p>Governed by the laws of the District of Columbia. Disputes resolved through binding arbitration.</p>

<p style="margin-top:40px">${ownerName} certifies they are authorized to enter this agreement on behalf of ${businessName}.</p>
<p style="margin-top:40px"><strong>Signature:</strong> &nbsp;\\Sig\\</p>
<p><strong>Full Name:</strong> &nbsp;\\FullName\\</p>
<p><strong>Date Signed:</strong> &nbsp;\\DateSigned\\</p>
</body></html>`;
}

function foundingAgreementHtml(businessName: string, ownerName: string, foundingNumber: number): string {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const exp = new Date(); exp.setFullYear(exp.getFullYear() + 3);
  const expiryDate = exp.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;margin:48px;color:#1a1a1a;line-height:1.75;max-width:720px">
<h2 style="text-align:center;letter-spacing:1px">MAPPING WITH MELANIN™</h2>
<h3 style="text-align:center;font-weight:normal;border-bottom:1px solid #ccc;padding-bottom:16px">Founding Business Program Agreement</h3>
<div style="background:#fffbf0;border:1px solid #c9922b;border-radius:8px;padding:16px;margin-bottom:24px">
<strong>⭐ Founding Business #${foundingNumber} of 500</strong><br>
<strong>Business:</strong> ${businessName} &nbsp;|&nbsp; <strong>Authorized By:</strong> ${ownerName} &nbsp;|&nbsp; <strong>Date:</strong> ${date}
</div>

<h4>1. Program Recognition</h4>
<p>MWM recognizes ${businessName} as Founding Business #${foundingNumber}. This status is exclusive to the first 500 verified businesses during the MWM launch period.</p>

<h4>2. Guaranteed Rate Lock</h4>
<p>${businessName} is guaranteed a <strong>3% platform fee</strong> on all marketplace transactions through <strong>${expiryDate}</strong> (the "Rate Lock Period"), regardless of seller tier. After this period, the applicable tier rate applies.</p>

<h4>3. Premium Feature Access</h4>
<p>6 months of complimentary Premium features from this date, including: AI business tools, enhanced analytics, priority search placement, Founding Business badge, featured business opportunities, and early access to new features.</p>

<h4>4. Recognition &amp; Promotion</h4>
<p>MWM will display the Founding Business badge on the business profile and may feature the business in launch communications, social media, and the website.</p>

<h4>5. Good Standing Requirement</h4>
<p>Founding Business status requires maintaining an accurate listing, responding to customer inquiries, and complying with the Marketplace Seller Agreement.</p>

<h4>6. Non-Transferable</h4>
<p>Founding Business status is tied to this specific entity and is non-transferable.</p>

<p style="margin-top:40px">${ownerName} accepts these terms and acknowledges the privileges and obligations of the Founding Business Program.</p>
<p style="margin-top:40px"><strong>Signature:</strong> &nbsp;\\Sig\\</p>
<p><strong>Full Name:</strong> &nbsp;\\FullName\\</p>
<p><strong>Date Signed:</strong> &nbsp;\\DateSigned\\</p>
</body></html>`;
}

function verificationCertHtml(businessName: string, ownerName: string): string {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;margin:48px;color:#1a1a1a;line-height:1.75;max-width:720px">
<h2 style="text-align:center;letter-spacing:1px">MAPPING WITH MELANIN™</h2>
<h3 style="text-align:center;font-weight:normal;border-bottom:1px solid #ccc;padding-bottom:16px">Business Verification Certification</h3>
<p><strong>Business:</strong> ${businessName} &nbsp;|&nbsp; <strong>Authorized By:</strong> ${ownerName} &nbsp;|&nbsp; <strong>Date:</strong> ${date}</p>

<h4>Certification</h4>
<p>I, ${ownerName}, certify under penalty of removal from Mapping With Melanin™ that:</p>
<ol>
<li>I am the owner or authorized representative of <strong>${businessName}</strong>.</li>
<li>The business is 51% or more Black-owned, or qualifies under another minority ownership category as represented in my verification submission.</li>
<li>All information submitted — including business name, address, ownership details, EIN, and supporting documentation — is <strong>true, accurate, and complete</strong>.</li>
<li>All documents provided are genuine and have not been altered or fabricated.</li>
<li>I understand that submitting false information will result in immediate removal from the platform and may be subject to legal action.</li>
<li>I authorize MWM to use the submitted information to verify and display this business on the platform.</li>
</ol>

<h4>Acknowledgment</h4>
<p>Verification approval is at MWM's sole discretion. I agree to notify MWM of any material changes to ownership or business status within 30 days of such changes.</p>

<p style="margin-top:40px"><strong>Signature:</strong> &nbsp;\\Sig\\</p>
<p><strong>Full Name:</strong> &nbsp;\\FullName\\</p>
<p><strong>Date Signed:</strong> &nbsp;\\DateSigned\\</p>
</body></html>`;
}

// ── Public envelope creators ────────────────────────────────────────────────

export async function createSellerAgreementEnvelope(p: {
  businessId: string; businessName: string; ownerName: string;
  signerEmail: string; clientUserId: string; returnUrl: string;
}): Promise<{ envelopeId: string; signingUrl: string }> {
  const env = await dsApi("POST", "/envelopes", {
    emailSubject: `Mapping With Melanin™ — Seller Agreement for ${p.businessName}`,
    documents: [{ documentId: "1", name: "Marketplace Seller Agreement", fileExtension: "html", documentBase64: b64(sellerAgreementHtml(p.businessName, p.ownerName)) }],
    recipients: { signers: [{ email: p.signerEmail, name: p.ownerName, recipientId: "1", clientUserId: p.clientUserId, tabs: signerTabs() }] },
    status: "sent",
    customFields: { textCustomFields: [{ name: "businessId", value: p.businessId, show: "false", required: "false" }, { name: "agreementType", value: "seller_agreement", show: "false", required: "false" }] },
  });
  const signingUrl = await embeddedUrl(env.envelopeId, p.signerEmail, p.ownerName, p.clientUserId, p.returnUrl);
  return { envelopeId: env.envelopeId, signingUrl };
}

export async function createFoundingAgreementEnvelope(p: {
  businessId: string; businessName: string; ownerName: string; foundingNumber: number;
  signerEmail: string; clientUserId: string; returnUrl: string;
}): Promise<{ envelopeId: string; signingUrl: string }> {
  const env = await dsApi("POST", "/envelopes", {
    emailSubject: `Mapping With Melanin™ — Founding Business Agreement #${p.foundingNumber}`,
    documents: [{ documentId: "1", name: "Founding Business Program Agreement", fileExtension: "html", documentBase64: b64(foundingAgreementHtml(p.businessName, p.ownerName, p.foundingNumber)) }],
    recipients: { signers: [{ email: p.signerEmail, name: p.ownerName, recipientId: "1", clientUserId: p.clientUserId, tabs: signerTabs() }] },
    status: "sent",
    customFields: { textCustomFields: [{ name: "businessId", value: p.businessId, show: "false", required: "false" }, { name: "agreementType", value: "founding_agreement", show: "false", required: "false" }] },
  });
  const signingUrl = await embeddedUrl(env.envelopeId, p.signerEmail, p.ownerName, p.clientUserId, p.returnUrl);
  return { envelopeId: env.envelopeId, signingUrl };
}

export async function createVerificationEnvelope(p: {
  businessName: string; ownerName: string;
  signerEmail: string; clientUserId: string; returnUrl: string;
}): Promise<{ envelopeId: string; signingUrl: string }> {
  const env = await dsApi("POST", "/envelopes", {
    emailSubject: `Mapping With Melanin™ — Business Verification Certification for ${p.businessName}`,
    documents: [{ documentId: "1", name: "Business Verification Certification", fileExtension: "html", documentBase64: b64(verificationCertHtml(p.businessName, p.ownerName)) }],
    recipients: { signers: [{ email: p.signerEmail, name: p.ownerName, recipientId: "1", clientUserId: p.clientUserId, tabs: signerTabs() }] },
    status: "sent",
    customFields: { textCustomFields: [{ name: "agreementType", value: "verification", show: "false", required: "false" }] },
  });
  const signingUrl = await embeddedUrl(env.envelopeId, p.signerEmail, p.ownerName, p.clientUserId, p.returnUrl);
  return { envelopeId: env.envelopeId, signingUrl };
}

export async function getEnvelopeStatus(envelopeId: string): Promise<{ status: string; completedDateTime?: string }> {
  return dsApi("GET", `/envelopes/${envelopeId}`);
}

export function docuSignConsentUrl(): string {
  const redirectUri = encodeURIComponent("https://www.docusign.com");
  return `${AUTH_URL}/oauth/auth?response_type=code&scope=signature+impersonation&client_id=${INTEGRATION_KEY}&redirect_uri=${redirectUri}`;
}
